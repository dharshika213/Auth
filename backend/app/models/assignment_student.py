from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AssignmentStudent(Base):
    __tablename__ = "assignment_students"

    __table_args__ = (
        UniqueConstraint(
            "assignment_id",
            "student_id",
            name="uq_assignment_student",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
    )

    assignment_id: Mapped[int] = mapped_column(
        ForeignKey(
            "assignments.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    student_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )