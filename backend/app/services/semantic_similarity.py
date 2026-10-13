from sentence_transformers import SentenceTransformer

from app.services.text_preprocessor import normalize_text


MODEL_NAME = "all-MiniLM-L6-v2"

_model = None


def get_model() -> SentenceTransformer:
    """
    Load the Sentence Transformer model once and reuse it.
    """

    global _model

    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)

    return _model


def calculate_semantic_similarity(
    text_a: str,
    text_b: str,
) -> float:
    """
    Calculate semantic similarity between two pieces of text.

    Returns a value between 0.0 and 1.0.
    """

    text_a = normalize_text(text_a)
    text_b = normalize_text(text_b)

    if not text_a or not text_b:
        return 0.0

    model = get_model()

    embeddings = model.encode(
        [text_a, text_b],
        normalize_embeddings=True,
    )

    similarity = float(embeddings[0] @ embeddings[1])

    # Keep the result inside the expected range.
    return max(0.0, min(1.0, similarity))