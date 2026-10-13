from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
    )

    assignment_id: Mapped[int] = mapped_column(
        ForeignKey("assignments.id"),
        nullable=False,
        index=True,
    )

    student_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    original_filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    stored_filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
    )

    file_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    file_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    extracted_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="uploaded",
        nullable=False,
    )

    submitted_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )