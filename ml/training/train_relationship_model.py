from pathlib import Path
import json

import joblib
import pandas as pd

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    precision_recall_fscore_support,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import FeatureUnion


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
    / "relationship_classifier.joblib"
)

METRICS_FILE = (
    MODEL_DIR
    / "relationship_classifier_metrics.json"
)


LABEL_NAMES = {
    0: "original",
    1: "exact_copy",
    2: "paraphrased",
    3: "partial_copy",
    4: "unrelated",
}


def build_pair_text(text_a: str, text_b: str) -> str:
    """
    Combine two academic texts into a single representation.

    A separator token helps the vectorizer distinguish where
    the first document ends and the second document begins.
    """
    return f"{text_a} [TEXT_B] {text_b}"


def main() -> None:
    print("=" * 70)
    print("AuthentiCheck — Academic Relationship Classifier Training")
    print("=" * 70)

    if not DATASET_FILE.exists():
        raise FileNotFoundError(
            f"Dataset not found: {DATASET_FILE}"
        )

    MODEL_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    print(f"\nLoading dataset:")
    print(DATASET_FILE)

    dataframe = pd.read_csv(DATASET_FILE)

    required_columns = {
        "text_a",
        "text_b",
        "label",
    }

    missing_columns = required_columns - set(
        dataframe.columns
    )

    if missing_columns:
        raise ValueError(
            f"Dataset is missing columns: {sorted(missing_columns)}"
        )

    dataframe = dataframe.dropna(
        subset=[
            "text_a",
            "text_b",
            "label",
        ]
    ).copy()

    dataframe["text_a"] = (
        dataframe["text_a"]
        .astype(str)
        .str.strip()
    )

    dataframe["text_b"] = (
        dataframe["text_b"]
        .astype(str)
        .str.strip()
    )

    dataframe["label"] = dataframe["label"].astype(int)

    print(f"\nRows available: {len(dataframe)}")

    print("\nClass distribution:")

    class_counts = (
        dataframe["label"]
        .value_counts()
        .sort_index()
    )

    for label, count in class_counts.items():
        print(
            f"  {label} = {LABEL_NAMES.get(label, 'unknown')}: {count}"
        )

    if dataframe["label"].nunique() < 2:
        raise ValueError(
            "The dataset must contain at least two classes."
        )

    pair_texts = [
        build_pair_text(text_a, text_b)
        for text_a, text_b
        in zip(
            dataframe["text_a"],
            dataframe["text_b"],
        )
    ]

    labels = dataframe["label"].tolist()

    # ---------------------------------------------------------
    # Train/test split
    # ---------------------------------------------------------
    #
    # The test set is kept separate from training so we can
    # measure how well the model generalizes to unseen pairs.
    #
    X_train, X_test, y_train, y_test = train_test_split(
        pair_texts,
        labels,
        test_size=0.25,
        random_state=42,
        stratify=labels,
    )

    print("\nDataset split:")
    print(f"  Training samples: {len(X_train)}")
    print(f"  Test samples:     {len(X_test)}")

    # ---------------------------------------------------------
    # TF-IDF feature extraction
    # ---------------------------------------------------------
    #
    # Word-level features capture meaningful academic phrases.
    # Character-level features help recognize partially changed
    # or copied wording.
    #
    word_vectorizer = TfidfVectorizer(
        lowercase=True,
        strip_accents="unicode",
        ngram_range=(1, 2),
        min_df=1,
        sublinear_tf=True,
    )

    character_vectorizer = TfidfVectorizer(
        analyzer="char_wb",
        lowercase=True,
        ngram_range=(3, 5),
        min_df=1,
        sublinear_tf=True,
    )

    vectorizer = FeatureUnion(
        [
            (
                "word_features",
                word_vectorizer,
            ),
            (
                "character_features",
                character_vectorizer,
            ),
        ]
    )

    print("\nFitting TF-IDF feature extractor...")

    X_train_features = vectorizer.fit_transform(
        X_train
    )

    X_test_features = vectorizer.transform(
        X_test
    )

    print(
        "Feature matrix:"
        f" {X_train_features.shape[0]} samples ×"
        f" {X_train_features.shape[1]} features"
    )

    # ---------------------------------------------------------
    # Train supervised classifier
    # ---------------------------------------------------------
    classifier = LogisticRegression(
        max_iter=2000,
        class_weight="balanced",
        random_state=42,
    )

    print("\nTraining Logistic Regression classifier...")

    classifier.fit(
        X_train_features,
        y_train,
    )

    # ---------------------------------------------------------
    # Evaluation
    # ---------------------------------------------------------
    print("\nEvaluating model...")

    predictions = classifier.predict(
        X_test_features
    )

    accuracy = accuracy_score(
        y_test,
        predictions,
    )

    precision, recall, f1, _ = (
        precision_recall_fscore_support(
            y_test,
            predictions,
            average="weighted",
            zero_division=0,
        )
    )

    report = classification_report(
        y_test,
        predictions,
        labels=sorted(LABEL_NAMES.keys()),
        target_names=[
            LABEL_NAMES[label]
            for label in sorted(LABEL_NAMES.keys())
        ],
        zero_division=0,
    )

    matrix = confusion_matrix(
        y_test,
        predictions,
        labels=sorted(LABEL_NAMES.keys()),
    )

    print("\n" + "=" * 70)
    print("MODEL EVALUATION")
    print("=" * 70)

    print(
        f"\nAccuracy : {accuracy:.4f}"
    )

    print(
        f"Precision: {precision:.4f}"
    )

    print(
        f"Recall   : {recall:.4f}"
    )

    print(
        f"F1-score : {f1:.4f}"
    )

    print("\nClassification report:")
    print(report)

    print("Confusion matrix:")

    print(matrix)

    # ---------------------------------------------------------
    # Save model
    # ---------------------------------------------------------
    #
    # Save both the feature extractor and classifier together so
    # the backend can later load one artifact and perform
    # predictions on uploaded academic documents.
    #
    model_bundle = {
        "vectorizer": vectorizer,
        "classifier": classifier,
        "label_names": LABEL_NAMES,
    }

    joblib.dump(
        model_bundle,
        MODEL_FILE,
    )

    print(
        f"\nModel saved to:\n{MODEL_FILE}"
    )

    # ---------------------------------------------------------
    # Save evaluation metrics
    # ---------------------------------------------------------
    metrics = {
        "model": "TF-IDF + Logistic Regression",
        "dataset_rows": int(len(dataframe)),
        "training_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "accuracy": round(float(accuracy), 6),
        "weighted_precision": round(float(precision), 6),
        "weighted_recall": round(float(recall), 6),
        "weighted_f1": round(float(f1), 6),
        "labels": LABEL_NAMES,
        "confusion_matrix": matrix.tolist(),
        "classification_report": classification_report(
            y_test,
            predictions,
            labels=sorted(LABEL_NAMES.keys()),
            target_names=[
                LABEL_NAMES[label]
                for label in sorted(LABEL_NAMES.keys())
            ],
            output_dict=True,
            zero_division=0,
        ),
    }

    with METRICS_FILE.open(
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            metrics,
            file,
            indent=2,
        )

    print(
        f"Metrics saved to:\n{METRICS_FILE}"
    )

    print("\nTraining completed successfully.")
    print("=" * 70)


if __name__ == "__main__":
    main()