from datetime import datetime
from pathlib import Path
from threading import Thread
from uuid import uuid4
from zoneinfo import ZoneInfo
import traceback

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.database import SessionLocal, get_db
from app.models.analysis_match import AnalysisMatch
from app.models.analysis_result import AnalysisResult
from app.models.assignment import Assignment
from app.models.submission import Submission
from app.models.user import User
from app.security import get_current_user
from app.services.document_extractor import extract_text
from app.services.submission_analyzer import analyze_submission


router = APIRouter(
    prefix="/api/submissions",
    tags=["Submissions"],
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".pptx"}
INDIA_TIMEZONE = ZoneInfo("Asia/Kolkata")


def get_current_time() -> datetime:
    """Return the current time as an India-local, naive datetime."""
    return datetime.now(INDIA_TIMEZONE).replace(tzinfo=None)


def is_deadline_passed(assignment: Assignment) -> bool:
    """Interpret naive database deadlines as India local time."""
    due_date = assignment.due_date

    if due_date is None:
        return False

    if due_date.tzinfo is not None:
        due_date = due_date.astimezone(INDIA_TIMEZONE).replace(
            tzinfo=None
        )

    return get_current_time() >= due_date


def run_submission_analysis(submission_id: int) -> None:
    """
    Analyze a submission in a background task using a dedicated
    SQLAlchemy session. Never reuse the request's database session.
    """
    db = SessionLocal()

    try:
        submission = (
            db.query(Submission)
            .filter(Submission.id == submission_id)
            .first()
        )

        if submission is None:
            print(
                f"[AuthentiCheck] Submission {submission_id} "
                "was not found for background analysis."
            )
            return

        submission.status = "processing"
        db.commit()

        # Reload the submission with the current session state.
        db.refresh(submission)

        analyze_submission(
            submission=submission,
            db=db,
        )

        print(
            f"[AuthentiCheck] Submission {submission_id} "
            "analysis completed."
        )

    except Exception as exc:
        db.rollback()

        print(
            f"[AuthentiCheck] Analysis failed for submission "
            f"{submission_id}: {exc}"
        )
        traceback.print_exc()

        try:
            submission = (
                db.query(Submission)
                .filter(Submission.id == submission_id)
                .first()
            )

            if submission is not None:
                submission.status = "analysis_failed"
                db.commit()

        except Exception:
            db.rollback()
            traceback.print_exc()

    finally:
        db.close()


@router.post("/{assignment_id}", status_code=status.HTTP_201_CREATED)
async def upload_submission(
    assignment_id: int,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can submit assignments.",
        )

    assignment = (
        db.query(Assignment)
        .filter(Assignment.id == assignment_id)
        .first()
    )

    if assignment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found.",
        )

    if is_deadline_passed(assignment):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "The assignment deadline has passed. "
                "Submissions and resubmissions are closed."
            ),
        )

    original_filename = file.filename or ""
    extension = Path(original_filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Unsupported file type. Only PDF, DOCX, and PPTX "
                "files are allowed."
            ),
        )

    file_contents = await file.read()

    if not file_contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty.",
        )

    stored_filename = f"{uuid4().hex}{extension}"
    file_path = UPLOAD_DIR / stored_filename

    try:
        file_path.write_bytes(file_contents)

        # Extraction still occurs before returning the response.
        # Very large files may therefore take time at this stage.
        extracted_text = extract_text(str(file_path))

        if not extracted_text or not extracted_text.strip():
            raise ValueError(
                "No readable text was extracted from the document."
            )

    except Exception as exc:
        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Could not extract readable text from the uploaded "
                "file. Scanned PDFs may require OCR."
            ),
        ) from exc

    submission = Submission(
        assignment_id=assignment_id,
        student_id=current_user.id,
        original_filename=original_filename,
        stored_filename=stored_filename,
        file_path=str(file_path),
        file_type=extension.lstrip("."),
        extracted_text=extracted_text,
        status="uploaded",
    )

    try:
        db.add(submission)
        db.commit()
        db.refresh(submission)

    except Exception:
        db.rollback()

        if file_path.exists():
            file_path.unlink()

        raise

    submission_id = submission.id

    # Schedule analysis after the submission has been committed.
    background_tasks.add_task(
        run_submission_analysis,
        submission_id,
    )

    return {
        "id": submission.id,
        "assignment_id": submission.assignment_id,
        "student_id": submission.student_id,
        "original_filename": submission.original_filename,
        "file_type": submission.file_type,
        "status": "processing",
        "submitted_at": submission.submitted_at,
        "message": (
            "Submission uploaded successfully. "
            "Analysis is running in the background."
        ),
    }


@router.get("/mine")
def get_my_submissions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can view their submissions.",
        )

    submissions = (
        db.query(Submission, Assignment)
        .join(
            Assignment,
            Assignment.id == Submission.assignment_id,
        )
        .filter(
            Submission.student_id == current_user.id,
        )
        .order_by(
            Submission.submitted_at.desc()
        )
        .all()
    )

    return [
        {
            "id": submission.id,
            "assignment_id": submission.assignment_id,
            "assignment_title": assignment.title,
            "original_filename": submission.original_filename,
            "file_type": submission.file_type,
            "status": submission.status,
            "submitted_at": submission.submitted_at,
        }
        for submission, assignment in submissions
    ]


@router.get("/teacher")
def get_teacher_submissions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can view teacher submissions.",
        )

    submissions = (
        db.query(Submission, Assignment, User)
        .join(
            Assignment,
            Assignment.id == Submission.assignment_id,
        )
        .join(
            User,
            User.id == Submission.student_id,
        )
        .filter(
            Assignment.teacher_id == current_user.id
        )
        .order_by(
            Submission.submitted_at.desc()
        )
        .all()
    )

    return [
        {
            "id": submission.id,
            "assignment_id": submission.assignment_id,
            "assignment_title": assignment.title,
            "student_id": student.id,
            "student_name": student.name,
            "student_email": student.email,
            "original_filename": submission.original_filename,
            "file_type": submission.file_type,
            "status": submission.status,
            "submitted_at": submission.submitted_at,
        }
        for submission, assignment, student in submissions
    ]


@router.delete("/{submission_id}")
def delete_submission(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can delete submissions.",
        )

    submission = (
        db.query(Submission)
        .filter(
            Submission.id == submission_id,
            Submission.student_id == current_user.id,
        )
        .first()
    )

    if submission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found.",
        )

    analysis_result = (
        db.query(AnalysisResult)
        .filter(
            AnalysisResult.submission_id == submission.id
        )
        .first()
    )

    if analysis_result:
        db.query(AnalysisMatch).filter(
            AnalysisMatch.analysis_result_id == analysis_result.id
        ).delete(synchronize_session=False)

        db.query(AnalysisResult).filter(
            AnalysisResult.id == analysis_result.id
        ).update(
            {
                AnalysisResult.strongest_reference_submission_id: None,
                AnalysisResult.trained_reference_submission_id: None,
            }
        )

        db.flush()
        db.delete(analysis_result)

    db.query(AnalysisResult).filter(
        AnalysisResult.strongest_reference_submission_id == submission.id
    ).update(
        {AnalysisResult.strongest_reference_submission_id: None}
    )

    db.query(AnalysisResult).filter(
        AnalysisResult.trained_reference_submission_id == submission.id
    ).update(
        {AnalysisResult.trained_reference_submission_id: None}
    )

    db.query(AnalysisMatch).filter(
        AnalysisMatch.reference_submission_id == submission.id
    ).update(
        {AnalysisMatch.reference_submission_id: None}
    )

    file_path = Path(submission.file_path)

    db.delete(submission)
    db.commit()

    if file_path.exists():
        file_path.unlink()

    return {
        "message": "Submission deleted successfully."
    }