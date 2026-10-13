import numpy as np # type: ignore
from app.services.semantic_similarity import get_model
from app.services.similarity_engine import calculate_tfidf_similarity
from app.services.text_preprocessor import split_sentences


def find_sentence_matches(
    submitted_text: str,
    reference_text: str,
    semantic_threshold: float = 0.55,
    exact_threshold: float = 0.40,
) -> list[dict]:
    submitted_sentences = split_sentences(submitted_text)
    reference_sentences = split_sentences(reference_text)

    if not submitted_sentences or not reference_sentences:
        return []

    model = get_model()
    submitted_embeddings = model.encode(
        submitted_sentences,
        normalize_embeddings=True,
        convert_to_numpy=True,
        batch_size=64,
        show_progress_bar=False,
    )
    reference_embeddings = model.encode(
        reference_sentences,
        normalize_embeddings=True,
        convert_to_numpy=True,
        batch_size=64,
        show_progress_bar=False,
    )

    semantic_matrix = np.matmul(
        submitted_embeddings, reference_embeddings.T
    )
    matches = []
    candidate_count = min(10, len(reference_sentences))

    for submitted_index, submitted_sentence in enumerate(submitted_sentences):
        similarities = semantic_matrix[submitted_index]

        if candidate_count == len(reference_sentences):
            candidate_indices = np.arange(len(reference_sentences))
        else:
            candidate_indices = np.argpartition(
                similarities, -candidate_count
            )[-candidate_count:]

        candidate_indices = set(candidate_indices.tolist())
        candidate_indices.update(
            np.where(similarities >= semantic_threshold)[0].tolist()
        )

        best_match = None

        for reference_index in candidate_indices:
            semantic_similarity = float(similarities[reference_index])
            rounded_semantic = round(semantic_similarity, 4)

            # A candidate with a lower (or tied) score cannot replace
            # the current winner, so TF-IDF would be wasted work.
            if (
                best_match is not None
                and rounded_semantic <= best_match["semantic_similarity"]
            ):
                continue

            exact_similarity = None

            if semantic_similarity < semantic_threshold:
                exact_similarity = calculate_tfidf_similarity(
                    submitted_sentence,
                    reference_sentences[reference_index],
                )
                if exact_similarity < exact_threshold:
                    continue

            best_match = {
                "submitted_sentence": submitted_sentence,
                "reference_sentence": reference_sentences[reference_index],
                "submitted_sentence_index": submitted_index,
                "reference_sentence_index": int(reference_index),
                "exact_similarity": (
                    round(exact_similarity, 4)
                    if exact_similarity is not None
                    else None
                ),
                "semantic_similarity": rounded_semantic,
                "_needs_exact_score": exact_similarity is None,
            }

        if best_match is not None:
            if best_match.pop("_needs_exact_score"):
                best_match["exact_similarity"] = round(
                    calculate_tfidf_similarity(
                        best_match["submitted_sentence"],
                        best_match["reference_sentence"],
                    ),
                    4,
                )
            matches.append(best_match)

    return matches
