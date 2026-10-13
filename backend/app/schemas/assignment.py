from datetime import datetime

from pydantic import BaseModel, Field


class AssignmentCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: str | None = None
    due_date: datetime | None = None
    student_ids: list[int] = Field(default_factory=list)


class AssignmentResponse(BaseModel):
    id: int
    title: str
    description: str | None
    teacher_id: int
    due_date: datetime | None
    created_at: datetime
    student_ids: list[int] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class AssignmentSubmissionInfo(BaseModel):
    submission_id: int
    original_filename: str
    submitted_at: datetime


class AssignmentStudentStatus(BaseModel):
    student_id: int
    student_name: str
    student_email: str
    status: str
    submissions: list[AssignmentSubmissionInfo] = Field(
        default_factory=list
    )


class AssignmentRosterResponse(BaseModel):
    assignment_id: int
    assignment_title: str
    total_students: int
    submitted_count: int
    not_submitted_count: int
    students: list[AssignmentStudentStatus]