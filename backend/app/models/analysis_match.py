from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AnalysisMatch(Base):
    __tablename__ = "analysis_matches"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
    )

    analysis_result_id: Mapped[int] = mapped_column(
        ForeignKey("analysis_results.id"),
        nullable=False,
        index=True,
    )

    reference_submission_id: Mapped[int | None] = mapped_column(
        ForeignKey("submissions.id"),
        nullable=True,
        index=True,
    )

    submitted_sentence: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    reference_sentence: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    submitted_sentence_index: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    reference_sentence_index: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    exact_similarity: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    semantic_similarity: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )