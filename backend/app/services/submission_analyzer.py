from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.analysis_match import AnalysisMatch
from app.models.analysis_result import AnalysisResult
from app.models.submission import Submission
from app.services.ai_writing_detector import calculate_ai_writing_score
from app.services.sentence_matcher import find_sentence_matches
from app.services.trained_verification_model import predict_verification
from app.services.verification_engine import analyze_similarity


def determine_evidence_classification(
    comparisons: list[dict],
    matches: list[dict],
) -> str:
    """
    Determine the overall evidence pattern independently from
    the supervised ML classifier.

    Priority:
    1. Exact copy
    2. Paraphrased
    3. Partial copy
    4. Original

    The supervised model result is intentionally kept separate.
    """

    if not comparisons:
        return "original"

    exact_sentence_matches = [
        match
        for match in matches
        if match["exact_similarity"] >= 0.85
        and match["semantic_similarity"] >= 0.85
    ]

    strong_paraphrase_matches = [
        match
        for match in matches
        if match["semantic_similarity"] >= 0.85
        and match["exact_similarity"] < 0.85
    ]

    strongest_exact_similarity = max(
        (
            comparison["exact_similarity"]
            for comparison in comparisons
        ),
        default=0.0,
    )

    strongest_semantic_similarity = max(
        (
            comparison["semantic_similarity"]
            for comparison in comparisons
        ),
        default=0.0,
    )

    if (
        strongest_exact_similarity >= 0.85
        or len(exact_sentence_matches) > 0
    ):
        return "exact_copy"

    if (
        strongest_semantic_similarity >= 0.85
        or len(strong_paraphrase_matches) > 0
    ):
        return "paraphrased"

    if any(
        max(
            comparison["exact_similarity"],
            comparison["semantic_similarity"],
        )
        >= 0.40
        for comparison in comparisons
    ):
        return "partial_copy"

    return "original"


def analyze_submission(
    submission: Submission,
    db: Session,
) -> AnalysisResult:
    if not submission.extracted_text:
        raise ValueError(
            "Submission does not contain extracted text."
        )

    reference_submissions = (
        db.query(Submission)
        .filter(
            Submission.assignment_id == submission.assignment_id,
            Submission.id != submission.id,
            Submission.student_id != submission.student_id,
        )
        .order_by(
            Submission.submitted_at.asc()
        )
        .all()
    )

    ai_writing_score = calculate_ai_writing_score(
        submission.extracted_text
    )

    analysis_result = (
        db.query(AnalysisResult)
        .filter(
            AnalysisResult.submission_id == submission.id
        )
        .first()
    )

    if analysis_result is None:
        analysis_result = AnalysisResult(
            submission_id=submission.id,
            status="pending",
        )
        db.add(analysis_result)
        db.flush()

    (
        db.query(AnalysisMatch)
        .filter(
            AnalysisMatch.analysis_result_id
            == analysis_result.id
        )
        .delete(
            synchronize_session=False
        )
    )

    if not reference_submissions:
        analysis_result.originality_score = 100.0
        analysis_result.exact_match_score = 0.0
        analysis_result.semantic_similarity_score = 0.0
        analysis_result.ai_writing_score = ai_writing_score

        analysis_result.evidence_classification = "original"

        analysis_result.trained_class = "original"
        analysis_result.trained_confidence = 1.0

        analysis_result.strongest_reference_submission_id = None
        analysis_result.trained_reference_submission_id = None

        analysis_result.status = "completed"

        analysis_result.summary = (
            "No submissions from other students "
            "were available for comparison. "
            "The available evidence is therefore "
            "classified as original, but this does not "
            "establish authorship by itself."
        )

        analysis_result.analyzed_at = datetime.now(
            timezone.utc
        )

        submission.status = "analyzed"

        db.commit()
        db.refresh(analysis_result)

        return analysis_result

    comparisons = []
    all_matches = []

    for reference_submission in reference_submissions:
        if not reference_submission.extracted_text:
            continue

        similarity = analyze_similarity(
            submission.extracted_text,
            reference_submission.extracted_text,
        )

        exact_similarity = similarity[
            "exact_similarity"
        ]

        semantic_similarity = similarity[
            "semantic_similarity"
        ]

        combined_similarity = max(
            exact_similarity,
            semantic_similarity,
        )

        trained_prediction = None

        try:
            trained_prediction = predict_verification(
                submission.extracted_text,
                reference_submission.extracted_text,
            )
        except Exception as exc:
            print(
                "Warning: trained verification "
                f"model failed for reference "
                f"{reference_submission.id}: {exc}"
            )

        comparison = {
            "reference_submission_id": (
                reference_submission.id
            ),
            "reference_student_id": (
                reference_submission.student_id
            ),
            "exact_similarity": exact_similarity,
            "semantic_similarity": semantic_similarity,
            "combined_similarity": combined_similarity,
            "trained_prediction": trained_prediction,
        }

        comparisons.append(comparison)

        sentence_matches = find_sentence_matches(
            submission.extracted_text,
            reference_submission.extracted_text,
        )

        for match in sentence_matches:
            match_record = AnalysisMatch(
                analysis_result_id=analysis_result.id,
                reference_submission_id=(
                    reference_submission.id
                ),
                submitted_sentence=(
                    match["submitted_sentence"]
                ),
                reference_sentence=(
                    match["reference_sentence"]
                ),
                submitted_sentence_index=(
                    match["submitted_sentence_index"]
                ),
                reference_sentence_index=(
                    match["reference_sentence_index"]
                ),
                exact_similarity=(
                    match["exact_similarity"]
                ),
                semantic_similarity=(
                    match["semantic_similarity"]
                ),
            )

            db.add(match_record)

            all_matches.append(
                {
                    "reference_submission_id": (
                        reference_submission.id
                    ),
                    "reference_student_id": (
                        reference_submission.student_id
                    ),
                    "exact_similarity": (
                        match["exact_similarity"]
                    ),
                    "semantic_similarity": (
                        match["semantic_similarity"]
                    ),
                }
            )

    if not comparisons:
        analysis_result.originality_score = 100.0
        analysis_result.exact_match_score = 0.0
        analysis_result.semantic_similarity_score = 0.0
        analysis_result.ai_writing_score = ai_writing_score

        analysis_result.evidence_classification = "original"

        analysis_result.trained_class = "original"
        analysis_result.trained_confidence = 1.0

        analysis_result.strongest_reference_submission_id = None
        analysis_result.trained_reference_submission_id = None

        analysis_result.status = "completed"

        analysis_result.summary = (
            "No readable reference submissions "
            "were available for comparison."
        )

        analysis_result.analyzed_at = datetime.now(
            timezone.utc
        )

        submission.status = "analyzed"

        db.commit()
        db.refresh(analysis_result)

        return analysis_result

    strongest_similarity_comparison = max(
        comparisons,
        key=lambda item: (
            item["combined_similarity"],
            item["semantic_similarity"],
            item["exact_similarity"],
        ),
    )

    best_exact_similarity = (
        strongest_similarity_comparison[
            "exact_similarity"
        ]
    )

    best_semantic_similarity = (
        strongest_similarity_comparison[
            "semantic_similarity"
        ]
    )

    strongest_similarity = (
        strongest_similarity_comparison[
            "combined_similarity"
        ]
    )

    strongest_reference_submission_id = (
        strongest_similarity_comparison[
            "reference_submission_id"
        ]
    )

    evidence_classification = determine_evidence_classification(
        comparisons,
        all_matches,
    )

    suspicious_classes = {
        "exact_copy",
        "paraphrased",
        "partial_copy",
    }

    suspicious_predictions = [
        comparison
        for comparison in comparisons
        if comparison["trained_prediction"]
        and comparison["trained_prediction"][
            "predicted_class"
        ]
        in suspicious_classes
    ]

    if suspicious_predictions:
        strongest_trained_comparison = max(
            suspicious_predictions,
            key=lambda item: (
                item["trained_prediction"]["confidence"],
                item["trained_prediction"][
                    "probabilities"
                ].get(
                    item["trained_prediction"][
                        "predicted_class"
                    ],
                    0.0,
                ),
                item["combined_similarity"],
            ),
        )
    else:
        comparisons_with_predictions = [
            comparison
            for comparison in comparisons
            if comparison["trained_prediction"]
        ]

        if comparisons_with_predictions:
            strongest_trained_comparison = max(
                comparisons_with_predictions,
                key=lambda item: (
                    item["trained_prediction"][
                        "confidence"
                    ],
                    item["combined_similarity"],
                ),
            )
        else:
            strongest_trained_comparison = None

    if strongest_trained_comparison:
        trained_prediction = (
            strongest_trained_comparison[
                "trained_prediction"
            ]
        )

        trained_class = (
            trained_prediction["predicted_class"]
        )

        trained_confidence = (
            trained_prediction["confidence"]
        )

        trained_reference_submission_id = (
            strongest_trained_comparison[
                "reference_submission_id"
            ]
        )
    else:
        trained_class = None
        trained_confidence = None
        trained_reference_submission_id = None

    originality_score = max(
        0.0,
        min(
            100.0,
            (1.0 - strongest_similarity) * 100.0,
        ),
    )

    unique_reference_students = len(
        {
            match["reference_student_id"]
            for match in all_matches
            if match["reference_student_id"] is not None
        }
    )

    exact_match_count = sum(
        1
        for match in all_matches
        if match["exact_similarity"] >= 0.85
        and match["semantic_similarity"] >= 0.85
    )

    paraphrased_match_count = sum(
        1
        for match in all_matches
        if match["semantic_similarity"] >= 0.85
        and match["exact_similarity"] < 0.85
    )

    summary_parts = [
        f"Compared against "
        f"{len(comparisons)} "
        f"submission(s) from other students."
    ]

    if all_matches:
        summary_parts.append(
            f"Found {len(all_matches)} "
            f"potentially similar sentence match(es)."
        )
    else:
        summary_parts.append(
            "No sentence-level matches "
            "passed the configured thresholds."
        )

    if exact_match_count:
        summary_parts.append(
            f"{exact_match_count} "
            f"sentence-level match(es) show strong "
            f"direct textual overlap."
        )

    if paraphrased_match_count:
        summary_parts.append(
            f"{paraphrased_match_count} "
            f"sentence-level match(es) show strong "
            f"meaning-level similarity with lower "
            f"direct word overlap."
        )

    if unique_reference_students:
        summary_parts.append(
            f"Potential matches involve "
            f"{unique_reference_students} "
            f"other student(s)."
        )

    summary_parts.append(
        "Evidence-based classification: "
        f"{evidence_classification}."
    )

    summary_parts.append(
        "Strongest similarity signal came from "
        f"reference submission "
        f"#{strongest_reference_submission_id}."
    )

    if strongest_trained_comparison:
        confidence = trained_confidence * 100

        summary_parts.append(
            "Trained model strongest signal: "
            f"{trained_class} "
            f"({confidence:.1f}% confidence) "
            f"against reference submission "
            f"#{trained_reference_submission_id}."
        )

    analysis_result.originality_score = round(
        originality_score,
        2,
    )

    analysis_result.exact_match_score = round(
        best_exact_similarity,
        4,
    )

    analysis_result.semantic_similarity_score = round(
        best_semantic_similarity,
        4,
    )

    analysis_result.ai_writing_score = ai_writing_score

    analysis_result.evidence_classification = (
        evidence_classification
    )

    analysis_result.trained_class = trained_class

    analysis_result.trained_confidence = (
        round(
            trained_confidence,
            4,
        )
        if trained_confidence is not None
        else None
    )

    analysis_result.strongest_reference_submission_id = (
        strongest_reference_submission_id
    )

    analysis_result.trained_reference_submission_id = (
        trained_reference_submission_id
    )

    analysis_result.status = "completed"

    analysis_result.summary = " ".join(
        summary_parts
    )

    analysis_result.analyzed_at = datetime.now(
        timezone.utc
    )

    submission.status = "analyzed"

    db.commit()
    db.refresh(analysis_result)

    return analysis_result