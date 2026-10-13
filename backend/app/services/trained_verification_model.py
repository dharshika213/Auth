from pathlib import Path
import pickle
import re

import numpy as np
from sentence_transformers import SentenceTransformer


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[3]

MODEL_FILE = (
    BASE_DIR
    / "ml"
    / "models"
    / "verification_classifier.pkl"
)

SCALER_FILE = (
    BASE_DIR
    / "ml"
    / "models"
    / "verification_scaler.pkl"
)


# ============================================================
# MODEL CONFIGURATION
# ============================================================

EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"

CLASS_NAMES = {
    0: "original",
    1: "exact_copy",
    2: "paraphrased",
    3: "partial_copy",
    4: "unrelated",
}


# ============================================================
# LAZY-LOADED MODELS
# ============================================================

_classifier = None
_scaler = None
_embedding_model = None


def get_classifier():
    global _classifier

    if _classifier is None:

        if not MODEL_FILE.exists():
            raise FileNotFoundError(
                f"Trained verification classifier not found: "
                f"{MODEL_FILE}"
            )

        with MODEL_FILE.open(
            "rb"
        ) as file:
            _classifier = pickle.load(file)

    return _classifier


def get_scaler():
    global _scaler

    if _scaler is None:

        if not SCALER_FILE.exists():
            raise FileNotFoundError(
                f"Trained verification scaler not found: "
                f"{SCALER_FILE}"
            )

        with SCALER_FILE.open(
            "rb"
        ) as file:
            _scaler = pickle.load(file)

    return _scaler


def get_embedding_model():
    global _embedding_model

    if _embedding_model is None:
        _embedding_model = SentenceTransformer(
            EMBEDDING_MODEL_NAME
        )

    return _embedding_model


# ============================================================
# TEXT UTILITIES
# ============================================================

def normalize_text(
    text: str,
) -> str:

    if not isinstance(text, str):
        return ""

    text = text.lower()

    text = text.replace(
        "\r",
        " ",
    )

    text = text.replace(
        "\n",
        " ",
    )

    text = text.replace(
        "\t",
        " ",
    )

    text = re.sub(
        r"\s+",
        " ",
        text,
    )

    text = re.sub(
        r"\s+([,.!?;:])",
        r"\1",
        text,
    )

    known_repairs = {
        "optimizationalgorithm": "optimization algorithm",
        "resultinggradients": "resulting gradients",
        "machinelearning": "machine learning",
        "datapreprocessing": "data preprocessing",
        "classificationpredictions": "classification predictions",
        "computationalunits": "computational units",
        "trainingdata": "training data",
        "inputfeatures": "input features",
        "targetvalues": "target values",
        "real-worlddatasets": "real-world datasets",
        "inpractical": "in practical",
        "whendesigning": "when designing",
        "forfurther": "for further",
        "fromdifferent": "from different",
    }

    for broken, fixed in known_repairs.items():
        text = text.replace(
            broken,
            fixed,
        )

    return text.strip()


def tokenize(
    text: str,
) -> list[str]:

    return re.findall(
        r"\b[a-z0-9]+\b",
        normalize_text(text),
    )


# ============================================================
# FEATURE ENGINEERING
# ============================================================

def calculate_word_overlap(
    tokens_a: list[str],
    tokens_b: list[str],
) -> float:

    set_a = set(tokens_a)
    set_b = set(tokens_b)

    if not set_a or not set_b:
        return 0.0

    union = set_a.union(
        set_b
    )

    if not union:
        return 0.0

    intersection = set_a.intersection(
        set_b
    )

    return len(intersection) / len(union)


def calculate_sequence_overlap(
    tokens_a: list[str],
    tokens_b: list[str],
) -> float:

    if not tokens_a or not tokens_b:
        return 0.0

    if len(tokens_a) > len(tokens_b):
        tokens_a, tokens_b = (
            tokens_b,
            tokens_a,
        )

    shorter_length = len(
        tokens_a
    )

    if shorter_length == 0:
        return 0.0

    best_matches = 0

    for index in range(
        len(tokens_b)
        - shorter_length
        + 1
    ):

        window = tokens_b[
            index:index + shorter_length
        ]

        matches = sum(
            left == right
            for left, right
            in zip(
                tokens_a,
                window,
            )
        )

        best_matches = max(
            best_matches,
            matches,
        )

    return best_matches / shorter_length


def calculate_length_ratio(
    tokens_a: list[str],
    tokens_b: list[str],
) -> float:

    shortest = min(
        len(tokens_a),
        len(tokens_b),
    )

    longest = max(
        len(tokens_a),
        len(tokens_b),
    )

    if longest == 0:
        return 0.0

    return shortest / longest


def calculate_shared_phrase_ratio(
    tokens_a: list[str],
    tokens_b: list[str],
    phrase_size: int = 3,
) -> float:

    if (
        len(tokens_a) < phrase_size
        or len(tokens_b) < phrase_size
    ):
        return 0.0

    phrases_a = {
        tuple(
            tokens_a[
                index:index + phrase_size
            ]
        )
        for index in range(
            len(tokens_a)
            - phrase_size
            + 1
        )
    }

    phrases_b = {
        tuple(
            tokens_b[
                index:index + phrase_size
            ]
        )
        for index in range(
            len(tokens_b)
            - phrase_size
            + 1
        )
    }

    if not phrases_a or not phrases_b:
        return 0.0

    shared = len(
        phrases_a.intersection(
            phrases_b
        )
    )

    total = min(
        len(phrases_a),
        len(phrases_b),
    )

    if total == 0:
        return 0.0

    return shared / total


def build_features(
    text_a: str,
    text_b: str,
    embedding_a: np.ndarray,
    embedding_b: np.ndarray,
) -> np.ndarray:

    tokens_a = tokenize(
        text_a
    )

    tokens_b = tokenize(
        text_b
    )

    semantic_similarity = float(
        np.dot(
            embedding_a,
            embedding_b,
        )
    )

    word_overlap = calculate_word_overlap(
        tokens_a,
        tokens_b,
    )

    sequence_overlap = calculate_sequence_overlap(
        tokens_a,
        tokens_b,
    )

    length_ratio = calculate_length_ratio(
        tokens_a,
        tokens_b,
    )

    shared_phrase_ratio = calculate_shared_phrase_ratio(
        tokens_a,
        tokens_b,
    )

    absolute_difference = np.abs(
        embedding_a - embedding_b
    )

    difference_mean = float(
        absolute_difference.mean()
    )

    difference_std = float(
        absolute_difference.std()
    )

    difference_max = float(
        absolute_difference.max()
    )

    return np.array(
        [
            semantic_similarity,
            word_overlap,
            sequence_overlap,
            length_ratio,
            shared_phrase_ratio,
            difference_mean,
            difference_std,
            difference_max,
        ],
        dtype=np.float32,
    )


# ============================================================
# PUBLIC PREDICTION FUNCTION
# ============================================================

def predict_verification(
    submitted_text: str,
    reference_text: str,
) -> dict:

    submitted_text = normalize_text(
        submitted_text
    )

    reference_text = normalize_text(
        reference_text
    )

    if (
        not submitted_text
        or not reference_text
    ):
        return {
            "predicted_class": "insufficient_text",
            "confidence": 0.0,
            "probabilities": {},
        }

    embedding_model = get_embedding_model()

    embeddings = embedding_model.encode(
        [
            submitted_text,
            reference_text,
        ],
        normalize_embeddings=True,
        convert_to_numpy=True,
    )

    features = build_features(
        submitted_text,
        reference_text,
        embeddings[0],
        embeddings[1],
    )

    feature_matrix = features.reshape(
        1,
        -1,
    )

    scaler = get_scaler()

    scaled_features = scaler.transform(
        feature_matrix
    )

    classifier = get_classifier()

    prediction = classifier.predict(
        scaled_features
    )[0]

    probabilities = classifier.predict_proba(
        scaled_features
    )[0]

    predicted_class = CLASS_NAMES.get(
        int(prediction),
        "unknown",
    )

    confidence = float(
        probabilities[prediction]
    )

    probability_map = {
        CLASS_NAMES[index]: round(
            float(probability),
            4,
        )
        for index, probability
        in enumerate(probabilities)
    }

    return {
        "predicted_class": predicted_class,
        "confidence": round(
            confidence,
            4,
        ),
        "probabilities": probability_map,
        "semantic_similarity": round(
            float(features[0]),
            4,
        ),
        "word_overlap": round(
            float(features[1]),
            4,
        ),
        "sequence_overlap": round(
            float(features[2]),
            4,
        ),
        "length_ratio": round(
            float(features[3]),
            4,
        ),
        "shared_phrase_ratio": round(
            float(features[4]),
            4,
        ),
    }
