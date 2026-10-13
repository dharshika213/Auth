import re

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def calculate_tfidf_similarity(
    text_a: str,
    text_b: str,
) -> float:
    """
    Calculate TF-IDF cosine similarity between two texts.

    Returns a score between 0.0 and 1.0.
    Handles empty text, punctuation-only text, and inputs
    that produce an empty TF-IDF vocabulary.
    """

    if not isinstance(text_a, str) or not isinstance(text_b, str):
        return 0.0

    text_a = text_a.strip()
    text_b = text_b.strip()

    if not text_a or not text_b:
        return 0.0

    # Avoid running TF-IDF on text that contains no letters or digits.
    if not re.search(r"[a-zA-Z0-9]", text_a):
        return 0.0

    if not re.search(r"[a-zA-Z0-9]", text_b):
        return 0.0

    vectorizer = TfidfVectorizer(
        lowercase=True,
        ngram_range=(1, 2),
        min_df=1,
        token_pattern=r"(?u)\b\w+\b",
    )

    try:
        vectors = vectorizer.fit_transform([text_a, text_b])

        similarity = cosine_similarity(
            vectors[0:1],
            vectors[1:2],
        )[0][0]

        # Protect against unexpected invalid numeric results.
        if not similarity >= 0.0:
            return 0.0

        return float(min(similarity, 1.0))

    except ValueError as exc:
        # Some text pairs can produce no usable vocabulary.
        if "empty vocabulary" in str(exc).lower():
            return 0.0

        raise