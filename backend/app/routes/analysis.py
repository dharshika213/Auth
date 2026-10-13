from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.analysis_match import AnalysisMatch
from app.models.analysis_result import AnalysisResult
from app.models.assignment import Assignment
from app.models.submission import Submission
from app.models.user import User
from app.schemas.analysis import AnalysisResultWithMatchesResponse
from app.security import get_current_user
from app.services.submission_analyzer import analyze_submission


router = APIRouter(
    prefix="/api/analysis",
    tags=["Analysis"],
)


def build_analysis_response(
    analysis_result: AnalysisResult,
    db: Session,
) -> dict:
    matches = (
        db.query(AnalysisMatch)
        .filter(
            AnalysisMatch.analysis_result_id
            == analysis_result.id
        )
        .order_by(
            AnalysisMatch.created_at.asc(),
            AnalysisMatch.id.asc(),
        )
        .all()
    )

    match_responses = []

    for match in matches:
        reference_student_id = None
        reference_student_name = None
        reference_filename = None

        if match.reference_submission_id is not None:
            reference_submission = (
                db.query(Submission)
                .join(
                    User,
                    Submission.student_id == User.id,
                )
                .filter(
                    Submission.id
                    == match.reference_submission_id
                )
                .first()
            )

            if reference_submission:
                reference_student_id = (
                    reference_submission.student_id
                )
                reference_student_name = (
                    reference_submission.student.name
                    if getattr(
                        reference_submission,
                        "student",
                        None,
                    )
                    else None
                )
                reference_filename = (
                    reference_submission.original_filename
                )

                if reference_student_name is None:
                    reference_student = (
                        db.query(User)
                        .filter(
                            User.id
                            == reference_submission.student_id
                        )
                        .first()
                    )

                    if reference_student:
                        reference_student_name = (
                            reference_student.name
                        )

        match_responses.append(
            {
                "id": match.id,
                "analysis_result_id": (
                    match.analysis_result_id
                ),
                "reference_submission_id": (
                    match.reference_submission_id
                ),
                "reference_student_id": (
                    reference_student_id
                ),
                "reference_student_name": (
                    reference_student_name
                ),
                "reference_filename": (
                    reference_filename
                ),
                "submitted_sentence": (
                    match.submitted_sentence
                ),
                "reference_sentence": (
                    match.reference_sentence
                ),
                "submitted_sentence_index": (
                    match.submitted_sentence_index
                ),
                "reference_sentence_index": (
                    match.reference_sentence_index
                ),
                "exact_similarity": (
                    match.exact_similarity
                ),
                "semantic_similarity": (
                    match.semantic_similarity
                ),
                "created_at": match.created_at,
            }
        )

    strongest_reference_student_id = None
    strongest_reference_student_name = None
    strongest_reference_filename = None

    if (
        analysis_result.strongest_reference_submission_id
        is not None
    ):
        strongest_reference = (
            db.query(Submission)
            .filter(
                Submission.id
                == analysis_result.strongest_reference_submission_id
            )
            .first()
        )

        if strongest_reference:
            strongest_reference_student_id = (
                strongest_reference.student_id
            )
            strongest_reference_filename = (
                strongest_reference.original_filename
            )

            strongest_reference_student = (
                db.query(User)
                .filter(
                    User.id
                    == strongest_reference.student_id
                )
                .first()
            )

            if strongest_reference_student:
                strongest_reference_student_name = (
                    strongest_reference_student.name
                )

    trained_reference_student_id = None
    trained_reference_student_name = None
    trained_reference_filename = None

    if (
        analysis_result.trained_reference_submission_id
        is not None
    ):
        trained_reference = (
            db.query(Submission)
            .filter(
                Submission.id
                == analysis_result.trained_reference_submission_id
            )
            .first()
        )

        if trained_reference:
            trained_reference_student_id = (
                trained_reference.student_id
            )
            trained_reference_filename = (
                trained_reference.original_filename
            )

            trained_reference_student = (
                db.query(User)
                .filter(
                    User.id
                    == trained_reference.student_id
                )
                .first()
            )

            if trained_reference_student:
                trained_reference_student_name = (
                    trained_reference_student.name
                )

    return {
        "id": analysis_result.id,
        "submission_id": analysis_result.submission_id,
        "originality_score": (
            analysis_result.originality_score
        ),
        "exact_match_score": (
            analysis_result.exact_match_score
        ),
        "semantic_similarity_score": (
            analysis_result.semantic_similarity_score
        ),
        "ai_writing_score": (
            analysis_result.ai_writing_score
        ),

        # Evidence-based classification.
        # This represents the similarity evidence
        # independently of the supervised ML prediction.
        "evidence_classification": (
            analysis_result.evidence_classification
        ),

        # Supervised ML classification and confidence.
        "trained_class": (
            analysis_result.trained_class
        ),
        "trained_confidence": (
            analysis_result.trained_confidence
        ),

        "strongest_reference_submission_id": (
            analysis_result.strongest_reference_submission_id
        ),
        "strongest_reference_student_id": (
            strongest_reference_student_id
        ),
        "strongest_reference_student_name": (
            strongest_reference_student_name
        ),
        "strongest_reference_filename": (
            strongest_reference_filename
        ),

        "trained_reference_submission_id": (
            analysis_result.trained_reference_submission_id
        ),
        "trained_reference_student_id": (
            trained_reference_student_id
        ),
        "trained_reference_student_name": (
            trained_reference_student_name
        ),
        "trained_reference_filename": (
            trained_reference_filename
        ),

        "status": analysis_result.status,
        "summary": analysis_result.summary,
        "analyzed_at": analysis_result.analyzed_at,
        "created_at": analysis_result.created_at,
        "matches": match_responses,
    }


@router.get(
    "/submission/{submission_id}",
    response_model=AnalysisResultWithMatchesResponse,
)
def get_submission_analysis(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "teacher":
        raise HTTPException(
            status_code=403,
            detail="Only teachers can view verification reports.",
        )

    submission = (
        db.query(Submission)
        .join(
            Assignment,
            Submission.assignment_id == Assignment.id,
        )
        .filter(
            Submission.id == submission_id,
            Assignment.teacher_id == current_user.id,
        )
        .first()
    )

    if submission is None:
        raise HTTPException(
            status_code=404,
            detail="Submission not found.",
        )

    analysis_result = (
        db.query(AnalysisResult)
        .filter(
            AnalysisResult.submission_id
            == submission_id
        )
        .first()
    )

    if analysis_result is None:
        raise HTTPException(
            status_code=404,
            detail="Analysis result not found.",
        )

    return build_analysis_response(
        analysis_result,
        db,
    )


@router.post(
    "/{submission_id}",
    response_model=AnalysisResultWithMatchesResponse,
)
def run_submission_analysis(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "teacher":
        raise HTTPException(
            status_code=403,
            detail="Only teachers can run verification.",
        )

    submission = (
        db.query(Submission)
        .join(
            Assignment,
            Submission.assignment_id == Assignment.id,
        )
        .filter(
            Submission.id == submission_id,
            Assignment.teacher_id == current_user.id,
        )
        .first()
    )

    if submission is None:
        raise HTTPException(
            status_code=404,
            detail="Submission not found.",
        )

    try:
        analysis_result = analyze_submission(
            submission,
            db,
        )
    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Verification failed: {str(exc)}",
        ) from exc

    return build_analysis_response(
        analysis_result,
        db,
    )