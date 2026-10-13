import re


def normalize_text(text: str) -> str:
    if not text:
        return ""

    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")
    text = text.replace("\t", " ")

    # Handle words split across a line with a hyphen:
    # "machine-\nlearning" -> "machine-learning"
    text = re.sub(
        r"(\w)-\s*\n\s*(\w)",
        r"\1-\2",
        text,
    )

    # Convert all remaining line breaks to spaces.
    text = text.replace("\n", " ")

    # Collapse repeated whitespace.
    text = re.sub(r"[ \t]+", " ", text)

    # Remove spaces before punctuation.
    text = re.sub(
        r"\s+([,.!?;:])",
        r"\1",
        text,
    )

    # Clean spaces around parentheses.
    text = re.sub(r"\(\s+", "(", text)
    text = re.sub(r"\s+\)", ")", text)

    return text.strip().lower()


def split_sentences(text: str) -> list[str]:
    normalized = normalize_text(text)

    if not normalized:
        return []

    sentences = re.split(
        r"(?<=[.!?])\s+",
        normalized,
    )

    return [
        sentence.strip()
        for sentence in sentences
        if sentence.strip()
    ]