from datetime import datetime

from pydantic import BaseModel


class AnalysisMatchResponse(BaseModel):
    id: int
    analysis_result_id: int

    reference_submission_id: int | None
    reference_student_id: int | None
    reference_student_name: str | None
    reference_filename: str | None

    submitted_sentence: str
    reference_sentence: str

    submitted_sentence_index: int
    reference_sentence_index: int

    exact_similarity: float
    semantic_similarity: float

    created_at: datetime


class AnalysisResultResponse(BaseModel):
    id: int
    submission_id: int

    originality_score: float | None
    exact_match_score: float | None
    semantic_similarity_score: float | None
    ai_writing_score: float | None

    # Evidence-based classification.
    # This represents the overall similarity evidence
    # independently of the supervised ML prediction.
    evidence_classification: str | None

    # Supervised ML classification and confidence.
    trained_class: str | None
    trained_confidence: float | None

    strongest_reference_submission_id: int | None
    strongest_reference_student_id: int | None
    strongest_reference_student_name: str | None
    strongest_reference_filename: str | None

    trained_reference_submission_id: int | None
    trained_reference_student_id: int | None
    trained_reference_student_name: str | None
    trained_reference_filename: str | None

    status: str
    summary: str | None
    analyzed_at: datetime | None
    created_at: datetime

    model_config = {
        "from_attributes": True,
    }


class AnalysisResultWithMatchesResponse(
    AnalysisResultResponse
):
    matches: list[AnalysisMatchResponse]