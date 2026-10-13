from app.services.semantic_similarity import calculate_semantic_similarity
from app.services.similarity_engine import calculate_tfidf_similarity
from app.services.text_preprocessor import normalize_text


def analyze_similarity(
    submitted_text: str,
    reference_text: str,
) -> dict:
    """
    Analyze a submitted document against a reference document.

    Combines:
    - TF-IDF similarity for exact/near-exact copying
    - Sentence Transformer similarity for semantic/paraphrased copying
    """

    submitted_text = normalize_text(submitted_text)
    reference_text = normalize_text(reference_text)

    if not submitted_text or not reference_text:
        return {
            "exact_similarity": 0.0,
            "semantic_similarity": 0.0,
            "originality_score": 100.0,
            "classification": "insufficient_text",
        }

    exact_similarity = calculate_tfidf_similarity(
        submitted_text,
        reference_text,
    )

    semantic_similarity = calculate_semantic_similarity(
        submitted_text,
        reference_text,
    )

    # Use the stronger of the two signals as the detected
    # similarity level.
    similarity = max(
        exact_similarity,
        semantic_similarity,
    )

    originality_score = max(
        0.0,
        min(100.0, (1.0 - similarity) * 100.0),
    )

    if similarity >= 0.85:
        classification = "high_similarity"
    elif similarity >= 0.65:
        classification = "moderate_similarity"
    elif similarity >= 0.40:
        classification = "low_similarity"
    else:
        classification = "minimal_similarity"

    return {
        "exact_similarity": round(exact_similarity, 4),
        "semantic_similarity": round(semantic_similarity, 4),
        "originality_score": round(originality_score, 2),
        "classification": classification,
    }