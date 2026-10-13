import re
from collections import Counter

from sklearn.feature_extraction.text import TfidfVectorizer


def _sentence_lengths(text: str) -> list[int]:
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    return [
        len(sentence.split())
        for sentence in sentences
        if sentence.strip()
    ]


def _punctuation_ratio(text: str) -> float:
    if not text:
        return 0.0

    punctuation_count = sum(
        1 for character in text if character in ",;:!?-()"
    )

    return punctuation_count / max(len(text), 1)


def _vocabulary_richness(text: str) -> float:
    words = re.findall(r"\b[a-zA-Z]+\b", text.lower())

    if not words:
        return 0.0

    unique_words = len(set(words))
    return unique_words / len(words)


def _repeated_phrase_ratio(text: str) -> float:
    words = re.findall(r"\b[a-zA-Z]+\b", text.lower())

    if len(words) < 6:
        return 0.0

    trigrams = [
        " ".join(words[index:index + 3])
        for index in range(len(words) - 2)
    ]

    counts = Counter(trigrams)

    repeated = sum(
        count - 1
        for count in counts.values()
        if count > 1
    )

    return repeated / max(len(trigrams), 1)


def _sentence_length_variation(lengths: list[int]) -> float:
    if len(lengths) < 2:
        return 0.0

    mean_length = sum(lengths) / len(lengths)

    if mean_length == 0:
        return 0.0

    variance = sum(
        (length - mean_length) ** 2
        for length in lengths
    ) / len(lengths)

    standard_deviation = variance ** 0.5

    return standard_deviation / mean_length


def calculate_ai_writing_score(text: str) -> float | None:
    """
    Returns an AI-writing review score from 0 to 100.

    Higher values indicate that the document contains more
    characteristics associated with highly uniform/generated writing.

    This is a review signal, not proof that AI was used.
    """

    if not text or len(text.split()) < 30:
        return None

    clean_text = " ".join(text.split())

    sentence_lengths = _sentence_lengths(clean_text)

    vocabulary_richness = _vocabulary_richness(clean_text)
    punctuation_ratio = _punctuation_ratio(clean_text)
    repeated_phrase_ratio = _repeated_phrase_ratio(clean_text)
    length_variation = _sentence_length_variation(sentence_lengths)

    # TF-IDF helps measure how concentrated the vocabulary is.
    vectorizer = TfidfVectorizer(
        lowercase=True,
        ngram_range=(1, 2),
        min_df=1,
        max_features=5000,
    )

    matrix = vectorizer.fit_transform([clean_text])

    tfidf_values = matrix.toarray()[0]

    if len(tfidf_values) > 0:
        tfidf_mean = float(tfidf_values.mean())
        tfidf_std = float(tfidf_values.std())
    else:
        tfidf_mean = 0.0
        tfidf_std = 0.0

    # Normalize the feature contributions into review signals.
    uniform_sentence_signal = max(
        0.0,
        min(1.0, 1.0 - (length_variation / 0.8))
    )

    vocabulary_signal = max(
        0.0,
        min(1.0, 1.0 - ((vocabulary_richness - 0.35) / 0.35))
    )

    repetition_signal = max(
        0.0,
        min(1.0, repeated_phrase_ratio / 0.08)
    )

    punctuation_signal = max(
        0.0,
        min(1.0, (punctuation_ratio - 0.015) / 0.06)
    )

    tfidf_uniformity_signal = max(
        0.0,
        min(1.0, 1.0 - (tfidf_std / 0.20))
    )

    score = (
        uniform_sentence_signal * 0.30
        + vocabulary_signal * 0.20
        + repetition_signal * 0.20
        + punctuation_signal * 0.10
        + tfidf_uniformity_signal * 0.20
    )

    return round(max(0.0, min(100.0, score * 100.0)), 2)
