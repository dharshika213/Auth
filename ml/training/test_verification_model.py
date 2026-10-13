from pathlib import Path
import pickle
import re

import numpy as np

from sentence_transformers import SentenceTransformer


BASE_DIR = Path(__file__).resolve().parents[2]

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

EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"

CLASS_NAMES = {
    0: "original",
    1: "exact_copy",
    2: "paraphrased",
    3: "partial_copy",
    4: "unrelated",
}


def normalize_text(text: str) -> str:
    text = text.lower()

    text = text.replace("\r", " ")
    text = text.replace("\n", " ")
    text = text.replace("\t", " ")

    text = re.sub(r"\s+", " ", text)

    text = re.sub(
        r"\s+([,.!?;:])",
        r"\1",
        text,
    )

    repairs = {
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

    for broken, fixed in repairs.items():
        text = text.replace(
            broken,
            fixed,
        )

    return text.strip()


def tokenize(text: str) -> list[str]:
    return re.findall(
        r"\b[a-z0-9]+\b",
        normalize_text(text),
    )


def word_overlap(
    tokens_a: list[str],
    tokens_b: list[str],
) -> float:

    set_a = set(tokens_a)
    set_b = set(tokens_b)

    if not set_a or not set_b:
        return 0.0

    union = set_a | set_b

    if not union:
        return 0.0

    return len(set_a & set_b) / len(union)


def sequence_overlap(
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

    shorter = len(tokens_a)

    best_matches = 0

    for index in range(
        len(tokens_b) - shorter + 1
    ):
        window = tokens_b[
            index:index + shorter
        ]

        matches = sum(
            left == right
            for left, right
            in zip(tokens_a, window)
        )

        best_matches = max(
            best_matches,
            matches,
        )

    return best_matches / shorter


def length_ratio(
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


def shared_phrase_ratio(
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
            tokens_a[index:index + phrase_size]
        )
        for index in range(
            len(tokens_a)
            - phrase_size
            + 1
        )
    }

    phrases_b = {
        tuple(
            tokens_b[index:index + phrase_size]
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
        phrases_a & phrases_b
    )

    total = min(
        len(phrases_a),
        len(phrases_b),
    )

    return shared / total


def build_features(
    text_a: str,
    text_b: str,
    embedding_a: np.ndarray,
    embedding_b: np.ndarray,
) -> np.ndarray:

    tokens_a = tokenize(text_a)
    tokens_b = tokenize(text_b)

    semantic_similarity = float(
        np.dot(
            embedding_a,
            embedding_b,
        )
    )

    lexical_overlap = word_overlap(
        tokens_a,
        tokens_b,
    )

    order_overlap = sequence_overlap(
        tokens_a,
        tokens_b,
    )

    document_length_ratio = length_ratio(
        tokens_a,
        tokens_b,
    )

    phrase_overlap = shared_phrase_ratio(
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
            lexical_overlap,
            order_overlap,
            document_length_ratio,
            phrase_overlap,
            difference_mean,
            difference_std,
            difference_max,
        ],
        dtype=np.float32,
    )


def predict_pair(
    classifier,
    scaler,
    embedding_model,
    text_a: str,
    text_b: str,
) -> None:

    clean_a = normalize_text(text_a)
    clean_b = normalize_text(text_b)

    embeddings = embedding_model.encode(
        [
            clean_a,
            clean_b,
        ],
        normalize_embeddings=True,
        convert_to_numpy=True,
    )

    features = build_features(
        clean_a,
        clean_b,
        embeddings[0],
        embeddings[1],
    )

    features = features.reshape(
        1,
        -1,
    )

    scaled_features = scaler.transform(
        features
    )

    prediction = classifier.predict(
        scaled_features
    )[0]

    probabilities = classifier.predict_proba(
        scaled_features
    )[0]

    predicted_class = CLASS_NAMES[
        int(prediction)
    ]

    print(
        "\nPrediction:"
    )

    print(
        f"Class: {predicted_class}"
    )

    print(
        f"Confidence: "
        f"{probabilities[prediction] * 100:.2f}%"
    )

    print(
        "\nClass probabilities:"
    )

    for class_id, probability in enumerate(
        probabilities
    ):
        print(
            f"  {CLASS_NAMES[class_id]:15s}"
            f" {probability * 100:6.2f}%"
        )

    print(
        "\nFeature values:"
    )

    feature_names = [
        "semantic_similarity",
        "word_overlap",
        "sequence_overlap",
        "length_ratio",
        "shared_phrase_ratio",
        "embedding_difference_mean",
        "embedding_difference_std",
        "embedding_difference_max",
    ]

    for name, value in zip(
        feature_names,
        features[0],
    ):
        print(
            f"  {name:30s} {value:.4f}"
        )


def main() -> None:

    print(
        "AuthentiCheck model inference test"
    )

    print(
        "=" * 45
    )

    if not MODEL_FILE.exists():
        raise FileNotFoundError(
            f"Classifier not found: {MODEL_FILE}"
        )

    if not SCALER_FILE.exists():
        raise FileNotFoundError(
            f"Scaler not found: {SCALER_FILE}"
        )

    print(
        "\nLoading trained classifier..."
    )

    with MODEL_FILE.open(
        "rb"
    ) as file:
        classifier = pickle.load(file)

    print(
        "Loading trained scaler..."
    )

    with SCALER_FILE.open(
        "rb"
    ) as file:
        scaler = pickle.load(file)

    print(
        f"Loading embedding model: "
        f"{EMBEDDING_MODEL_NAME}"
    )

    embedding_model = SentenceTransformer(
        EMBEDDING_MODEL_NAME
    )

    # --------------------------------------------------------
    # Test 1: Exact copy
    # --------------------------------------------------------

    original = (
        "Supervised learning trains a model "
        "using labeled examples. The algorithm "
        "learns a relationship between input "
        "features and known target values."
    )

    exact_copy = (
        "Supervised learning trains a model "
        "using labeled examples. The algorithm "
        "learns a relationship between input "
        "features and known target values."
    )

    print(
        "\n"
        + "=" * 45
    )

    print(
        "TEST 1: Exact copy"
    )

    predict_pair(
        classifier,
        scaler,
        embedding_model,
        original,
        exact_copy,
    )

    # --------------------------------------------------------
    # Test 2: Paraphrased
    # --------------------------------------------------------

    paraphrased = (
        "Supervised learning teaches models "
        "from examples that already contain "
        "target labels. The method learns how "
        "input characteristics correspond to "
        "known outcomes."
    )

    print(
        "\n"
        + "=" * 45
    )

    print(
        "TEST 2: Paraphrased"
    )

    predict_pair(
        classifier,
        scaler,
        embedding_model,
        original,
        paraphrased,
    )

    # --------------------------------------------------------
    # Test 3: Unrelated
    # --------------------------------------------------------

    unrelated = (
        "Photosynthesis is the biological process "
        "through which green plants convert light "
        "energy into chemical energy. Chlorophyll "
        "absorbs light during this process."
    )

    print(
        "\n"
        + "=" * 45
    )

    print(
        "TEST 3: Unrelated"
    )

    predict_pair(
        classifier,
        scaler,
        embedding_model,
        original,
        unrelated,
    )

    print(
        "\n"
        + "=" * 45
    )

    print(
        "Inference test completed successfully."
    )


if __name__ == "__main__":
    main()
