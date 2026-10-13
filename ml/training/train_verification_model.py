from pathlib import Path
import json
import pickle
import re

import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    precision_recall_fscore_support,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from sentence_transformers import SentenceTransformer


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[2]

DATASET_FILE = (
    BASE_DIR
    / "ml"
    / "training"
    / "dataset_schema.csv"
)

MODEL_DIR = (
    BASE_DIR
    / "ml"
    / "models"
)

MODEL_FILE = (
    MODEL_DIR
    / "verification_classifier.pkl"
)

SCALER_FILE = (
    MODEL_DIR
    / "verification_scaler.pkl"
)

METRICS_FILE = (
    BASE_DIR
    / "ml"
    / "evaluation"
    / "verification_metrics.json"
)

REPORT_FILE = (
    BASE_DIR
    / "ml"
    / "evaluation"
    / "classification_report.txt"
)

CONFUSION_FILE = (
    BASE_DIR
    / "ml"
    / "evaluation"
    / "confusion_matrix.csv"
)


# ============================================================
# CONFIGURATION
# ============================================================

RANDOM_STATE = 42

TEST_SIZE = 0.20

VALIDATION_SIZE = 0.20

EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"

CLASS_NAMES = {
    0: "original",
    1: "exact_copy",
    2: "paraphrased",
    3: "partial_copy",
    4: "unrelated",
}


# ============================================================
# TEXT UTILITIES
# ============================================================

def normalize_text(text: str) -> str:
    """
    Normalize whitespace and common formatting artifacts.
    """

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


def tokenize(text: str) -> list[str]:
    """
    Simple word tokenizer used for overlap features.
    """

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
    """
    Jaccard similarity between unique word sets.
    """

    set_a = set(tokens_a)
    set_b = set(tokens_b)

    if not set_a or not set_b:
        return 0.0

    intersection = len(
        set_a.intersection(set_b)
    )

    union = len(
        set_a.union(set_b)
    )

    if union == 0:
        return 0.0

    return intersection / union


def calculate_sequence_overlap(
    tokens_a: list[str],
    tokens_b: list[str],
) -> float:
    """
    Measures how many words from the shorter document
    appear in the same order inside the longer document.

    This is a lightweight lexical-overlap feature.
    """

    if not tokens_a or not tokens_b:
        return 0.0

    if len(tokens_a) > len(tokens_b):
        tokens_a, tokens_b = (
            tokens_b,
            tokens_a,
        )

    shorter = len(tokens_a)

    if shorter == 0:
        return 0.0

    matches = 0

    for index in range(
        len(tokens_b)
        - shorter
        + 1
    ):
        window = tokens_b[
            index:index + shorter
        ]

        same_positions = sum(
            1
            for left, right
            in zip(
                tokens_a,
                window,
            )
            if left == right
        )

        matches = max(
            matches,
            same_positions,
        )

    return matches / shorter


def calculate_length_ratio(
    tokens_a: list[str],
    tokens_b: list[str],
) -> float:
    """
    Ratio between shorter and longer document length.
    """

    lengths = [
        len(tokens_a),
        len(tokens_b),
    ]

    longest = max(lengths)

    if longest == 0:
        return 0.0

    shortest = min(lengths)

    return shortest / longest


def calculate_shared_phrase_ratio(
    tokens_a: list[str],
    tokens_b: list[str],
    phrase_size: int = 3,
) -> float:
    """
    Measures the proportion of n-grams from the shorter
    document that also appear in the longer document.
    """

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
    """
    Construct supervised-model features.

    Features:
        1. semantic cosine similarity
        2. word overlap
        3. sequence overlap
        4. document length ratio
        5. shared trigram ratio
        6. absolute embedding difference statistics
        7. embedding dot-product statistics
    """

    tokens_a = tokenize(text_a)
    tokens_b = tokenize(text_b)

    # Embeddings are normalized by SentenceTransformer,
    # therefore their dot product approximates cosine similarity.
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

    phrase_overlap = calculate_shared_phrase_ratio(
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

    feature_vector = np.array(
        [
            semantic_similarity,
            word_overlap,
            sequence_overlap,
            length_ratio,
            phrase_overlap,
            difference_mean,
            difference_std,
            difference_max,
        ],
        dtype=np.float32,
    )

    return feature_vector


# ============================================================
# DATA LOADING
# ============================================================

def load_dataset() -> pd.DataFrame:
    if not DATASET_FILE.exists():
        raise FileNotFoundError(
            f"Dataset not found: {DATASET_FILE}"
        )

    dataframe = pd.read_csv(
        DATASET_FILE
    )

    required_columns = {
        "text_a",
        "text_b",
        "label",
    }

    missing = (
        required_columns
        - set(dataframe.columns)
    )

    if missing:
        raise ValueError(
            "Dataset is missing columns: "
            + ", ".join(sorted(missing))
        )

    dataframe["text_a"] = dataframe[
        "text_a"
    ].map(normalize_text)

    dataframe["text_b"] = dataframe[
        "text_b"
    ].map(normalize_text)

    dataframe["label"] = dataframe[
        "label"
    ].astype(int)

    if dataframe[
        ["text_a", "text_b"]
    ].isna().any().any():
        raise ValueError(
            "Dataset contains missing text values."
        )

    return dataframe


# ============================================================
# EMBEDDING GENERATION
# ============================================================

def generate_embeddings(
    dataframe: pd.DataFrame,
    model: SentenceTransformer,
) -> tuple[
    np.ndarray,
    np.ndarray,
]:
    print(
        "\nGenerating SentenceTransformer embeddings..."
    )

    texts_a = dataframe[
        "text_a"
    ].tolist()

    texts_b = dataframe[
        "text_b"
    ].tolist()

    embeddings_a = model.encode(
        texts_a,
        normalize_embeddings=True,
        show_progress_bar=True,
        convert_to_numpy=True,
    )

    embeddings_b = model.encode(
        texts_b,
        normalize_embeddings=True,
        show_progress_bar=True,
        convert_to_numpy=True,
    )

    return (
        embeddings_a,
        embeddings_b,
    )


# ============================================================
# FEATURE MATRIX
# ============================================================

def build_feature_matrix(
    dataframe: pd.DataFrame,
    embeddings_a: np.ndarray,
    embeddings_b: np.ndarray,
) -> np.ndarray:
    print(
        "\nBuilding supervised feature matrix..."
    )

    feature_rows = []

    for index in range(
        len(dataframe)
    ):
        feature_rows.append(
            build_features(
                dataframe.iloc[index]["text_a"],
                dataframe.iloc[index]["text_b"],
                embeddings_a[index],
                embeddings_b[index],
            )
        )

    return np.vstack(
        feature_rows
    )


# ============================================================
# MODEL TRAINING
# ============================================================

def train_model(
    X_train: np.ndarray,
    y_train: np.ndarray,
) -> tuple[
    RandomForestClassifier,
    StandardScaler,
]:
    print(
        "\nScaling feature matrix..."
    )

    scaler = StandardScaler()

    X_train_scaled = scaler.fit_transform(
        X_train
    )

    print(
        "\nTraining Random Forest classifier..."
    )

    classifier = RandomForestClassifier(
        n_estimators=400,
        max_depth=12,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )

    classifier.fit(
        X_train_scaled,
        y_train,
    )

    return (
        classifier,
        scaler,
    )


# ============================================================
# EVALUATION
# ============================================================

def evaluate_model(
    classifier: RandomForestClassifier,
    scaler: StandardScaler,
    X: np.ndarray,
    y: np.ndarray,
    split_name: str,
) -> dict:
    X_scaled = scaler.transform(
        X
    )

    predictions = classifier.predict(
        X_scaled
    )

    accuracy = accuracy_score(
        y,
        predictions,
    )

    precision, recall, f1, _ = (
        precision_recall_fscore_support(
            y,
            predictions,
            average="weighted",
            zero_division=0,
        )
    )

    macro_precision, macro_recall, macro_f1, _ = (
        precision_recall_fscore_support(
            y,
            predictions,
            average="macro",
            zero_division=0,
        )
    )

    print(
        f"\n{split_name} performance"
    )

    print(
        f"Accuracy:  {accuracy:.4f}"
    )

    print(
        f"Precision: {precision:.4f}"
    )

    print(
        f"Recall:    {recall:.4f}"
    )

    print(
        f"F1-score:  {f1:.4f}"
    )

    print(
        f"Macro F1:  {macro_f1:.4f}"
    )

    report = classification_report(
        y,
        predictions,
        labels=list(CLASS_NAMES.keys()),
        target_names=list(
            CLASS_NAMES.values()
        ),
        digits=4,
        zero_division=0,
    )

    print("\nClassification report:")
    print(report)

    matrix = confusion_matrix(
        y,
        predictions,
        labels=list(
            CLASS_NAMES.keys()
        ),
    )

    return {
        "split": split_name,
        "accuracy": float(accuracy),
        "weighted_precision": float(precision),
        "weighted_recall": float(recall),
        "weighted_f1": float(f1),
        "macro_precision": float(
            macro_precision
        ),
        "macro_recall": float(
            macro_recall
        ),
        "macro_f1": float(
            macro_f1
        ),
        "classification_report": report,
        "confusion_matrix": matrix.tolist(),
    }


# ============================================================
# SAVE ARTIFACTS
# ============================================================

def save_model(
    classifier: RandomForestClassifier,
    scaler: StandardScaler,
) -> None:
    MODEL_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    with MODEL_FILE.open(
        "wb"
    ) as file:
        pickle.dump(
            classifier,
            file,
        )

    with SCALER_FILE.open(
        "wb"
    ) as file:
        pickle.dump(
            scaler,
            file,
        )

    print(
        f"\nModel saved to: {MODEL_FILE}"
    )

    print(
        f"Scaler saved to: {SCALER_FILE}"
    )


def save_evaluation(
    validation_metrics: dict,
    test_metrics: dict,
    feature_importances: list[float],
) -> None:
    METRICS_FILE.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    metrics = {
        "model": "RandomForestClassifier",
        "embedding_model": EMBEDDING_MODEL_NAME,
        "random_state": RANDOM_STATE,
        "dataset_rows": 600,
        "classes": CLASS_NAMES,
        "validation": {
            key: value
            for key, value
            in validation_metrics.items()
            if key != "classification_report"
            and key != "confusion_matrix"
        },
        "test": {
            key: value
            for key, value
            in test_metrics.items()
            if key != "classification_report"
            and key != "confusion_matrix"
        },
        "feature_importances": {
            "semantic_similarity": float(
                feature_importances[0]
            ),
            "word_overlap": float(
                feature_importances[1]
            ),
            "sequence_overlap": float(
                feature_importances[2]
            ),
            "length_ratio": float(
                feature_importances[3]
            ),
            "shared_phrase_ratio": float(
                feature_importances[4]
            ),
            "embedding_difference_mean": float(
                feature_importances[5]
            ),
            "embedding_difference_std": float(
                feature_importances[6]
            ),
            "embedding_difference_max": float(
                feature_importances[7]
            ),
        },
    }

    with METRICS_FILE.open(
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            metrics,
            file,
            indent=4,
        )

    REPORT_FILE.write_text(
        "AUTHENTICHECK VERIFICATION MODEL\n"
        "================================\n\n"
        "Validation performance\n"
        "----------------------\n"
        + validation_metrics[
            "classification_report"
        ]
        + "\n\n"
        "Test performance\n"
        "----------------\n"
        + test_metrics[
            "classification_report"
        ],
        encoding="utf-8",
    )

    confusion = pd.DataFrame(
        test_metrics[
            "confusion_matrix"
        ],
        index=[
            CLASS_NAMES[index]
            for index in CLASS_NAMES
        ],
        columns=[
            CLASS_NAMES[index]
            for index in CLASS_NAMES
        ],
    )

    confusion.to_csv(
        CONFUSION_FILE
    )

    print(
        f"\nMetrics saved to: {METRICS_FILE}"
    )

    print(
        f"Report saved to: {REPORT_FILE}"
    )

    print(
        f"Confusion matrix saved to: {CONFUSION_FILE}"
    )


# ============================================================
# MAIN
# ============================================================

def main() -> None:
    print(
        "AuthentiCheck supervised verification model training"
    )

    print(
        "=" * 55
    )

    dataframe = load_dataset()

    print(
        f"\nLoaded dataset: {len(dataframe)} rows"
    )

    print(
        "\nClass distribution:"
    )

    print(
        dataframe[
            "label"
        ].value_counts().sort_index()
    )

    print(
        f"\nLoading embedding model: "
        f"{EMBEDDING_MODEL_NAME}"
    )

    embedding_model = SentenceTransformer(
        EMBEDDING_MODEL_NAME
    )

    embeddings_a, embeddings_b = (
        generate_embeddings(
            dataframe,
            embedding_model,
        )
    )

    X = build_feature_matrix(
        dataframe,
        embeddings_a,
        embeddings_b,
    )

    y = dataframe[
        "label"
    ].to_numpy()

    print(
        f"\nFeature matrix shape: {X.shape}"
    )

    # --------------------------------------------------------
    # First split:
    # 80% development data
    # 20% final test data
    # --------------------------------------------------------

    (
        X_development,
        X_test,
        y_development,
        y_test,
    ) = train_test_split(
        X,
        y,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=y,
    )

    # --------------------------------------------------------
    # Second split:
    # 80% training
    # 20% validation
    # --------------------------------------------------------

    (
        X_train,
        X_validation,
        y_train,
        y_validation,
    ) = train_test_split(
        X_development,
        y_development,
        test_size=VALIDATION_SIZE,
        random_state=RANDOM_STATE,
        stratify=y_development,
    )

    print(
        "\nDataset split:"
    )

    print(
        f"Training:   {len(X_train)}"
    )

    print(
        f"Validation: {len(X_validation)}"
    )

    print(
        f"Test:       {len(X_test)}"
    )

    classifier, scaler = train_model(
        X_train,
        y_train,
    )

    validation_metrics = evaluate_model(
        classifier,
        scaler,
        X_validation,
        y_validation,
        "Validation",
    )

    test_metrics = evaluate_model(
        classifier,
        scaler,
        X_test,
        y_test,
        "Final test",
    )

    print(
        "\nFeature importance:"
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

    for name, importance in zip(
        feature_names,
        classifier.feature_importances_,
    ):
        print(
            f"{name}: {importance:.4f}"
        )

    save_model(
        classifier,
        scaler,
    )

    save_evaluation(
        validation_metrics,
        test_metrics,
        classifier.feature_importances_.tolist(),
    )

    print(
        "\nTraining completed successfully."
    )


if __name__ == "__main__":
    main()
