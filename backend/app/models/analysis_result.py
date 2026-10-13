from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
    )

    submission_id: Mapped[int] = mapped_column(
        ForeignKey("submissions.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    originality_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    exact_match_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    semantic_similarity_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    ai_writing_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    evidence_classification: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    trained_class: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    trained_confidence: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    strongest_reference_submission_id: Mapped[int | None] = mapped_column(
        ForeignKey("submissions.id"),
        nullable=True,
        index=True,
    )

    trained_reference_submission_id: Mapped[int | None] = mapped_column(
        ForeignKey("submissions.id"),
        nullable=True,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="pending",
        nullable=False,
    )

    summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    analyzed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )