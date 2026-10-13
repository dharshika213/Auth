from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.assignment import Assignment
from app.models.assignment_student import AssignmentStudent
from app.models.submission import Submission
from app.models.user import User
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentResponse,
    AssignmentRosterResponse,
    AssignmentStudentStatus,
    AssignmentSubmissionInfo,
)
from app.security import get_current_user

router = APIRouter(prefix="/api/assignments", tags=["Assignments"])


@router.post(
    "/",
    response_model=AssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_assignment(
    assignment_data: AssignmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can create assignments.",
        )

    assignment = Assignment(
        title=assignment_data.title,
        description=assignment_data.description,
        teacher_id=current_user.id,
        due_date=assignment_data.due_date,
    )

    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return AssignmentResponse(
        id=assignment.id,
        title=assignment.title,
        description=assignment.description,
        teacher_id=assignment.teacher_id,
        due_date=assignment.due_date,
        created_at=assignment.created_at,
        student_ids=[],
    )


@router.get("/", response_model=list[AssignmentResponse])
def get_assignments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == "teacher":
        assignments = (
            db.query(Assignment)
            .filter(Assignment.teacher_id == current_user.id)
            .order_by(Assignment.created_at.desc())
            .all()
        )

    elif current_user.role == "student":
        # Every assignment created by every teacher is visible
        # to every student.
        assignments = (
            db.query(Assignment)
            .order_by(Assignment.created_at.desc())
            .all()
        )

    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid user role.",
        )

    result = []

    for assignment in assignments:
        student_ids = [
            row.student_id
            for row in (
                db.query(AssignmentStudent)
                .filter(
                    AssignmentStudent.assignment_id == assignment.id
                )
                .all()
            )
        ]

        result.append(
            AssignmentResponse(
                id=assignment.id,
                title=assignment.title,
                description=assignment.description,
                teacher_id=assignment.teacher_id,
                due_date=assignment.due_date,
                created_at=assignment.created_at,
                student_ids=student_ids,
            )
        )

    return result


@router.get(
    "/{assignment_id}/roster",
    response_model=AssignmentRosterResponse,
)
def get_assignment_roster(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can view assignment rosters.",
        )

    assignment = (
        db.query(Assignment)
        .filter(
            Assignment.id == assignment_id,
            Assignment.teacher_id == current_user.id,
        )
        .first()
    )

    if assignment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found.",
        )

    # Every student is considered assigned to a normal class assignment.
    all_students = (
        db.query(User)
        .filter(User.role == "student")
        .order_by(User.name.asc())
        .all()
    )

    students = []

    for student in all_students:
        student_submissions = (
            db.query(Submission)
            .filter(
                Submission.assignment_id == assignment_id,
                Submission.student_id == student.id,
            )
            .order_by(Submission.submitted_at.desc())
            .all()
        )

        submission_info = [
            AssignmentSubmissionInfo(
                submission_id=submission.id,
                original_filename=submission.original_filename,
                submitted_at=submission.submitted_at,
            )
            for submission in student_submissions
        ]

        if not student_submissions:
            students.append(
                AssignmentStudentStatus(
                    student_id=student.id,
                    student_name=student.name,
                    student_email=student.email,
                    status="not_submitted",
                    submissions=[],
                )
            )
        else:
            students.append(
                AssignmentStudentStatus(
                    student_id=student.id,
                    student_name=student.name,
                    student_email=student.email,
                    status="submitted",
                    submissions=submission_info,
                )
            )

    submitted_count = sum(
        1
        for student in students
        if student.status == "submitted"
    )

    total_students = len(students)

    return AssignmentRosterResponse(
        assignment_id=assignment.id,
        assignment_title=assignment.title,
        total_students=total_students,
        submitted_count=submitted_count,
        not_submitted_count=total_students - submitted_count,
        students=students,
    )