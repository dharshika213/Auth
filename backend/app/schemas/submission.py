from datetime import datetime

from pydantic import BaseModel


class SubmissionResponse(BaseModel):
    id: int
    assignment_id: int
    student_id: int

    original_filename: str
    stored_filename: str
    file_path: str
    file_type: str

    extracted_text: str | None

    status: str
    submitted_at: datetime

    model_config = {
        "from_attributes": True
    }


class StudentSubmissionResponse(BaseModel):
    id: int
    assignment_id: int

    assignment_title: str
    assignment_description: str | None

    original_filename: str
    file_type: str

    status: str
    submitted_at: datetime

    model_config = {
        "from_attributes": True
    }