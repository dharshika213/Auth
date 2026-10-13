from pathlib import Path

import joblib
import pandas as pd

from sklearn.metrics import confusion_matrix


BASE_DIR = Path(__file__).resolve().parents[2]

DATASET_FILE = (
    BASE_DIR
    / "ml"
    / "training"
    / "dataset_schema.csv"
)

MODEL_FILE = (
    BASE_DIR
    / "ml"
    / "models"
    / "relationship_classifier.joblib"
)


LABEL_NAMES = {
    0: "original",
    1: "exact_copy",
    2: "paraphrased",
    3: "partial_copy",
    4: "unrelated",
}


def build_pair_text(text_a: str, text_b: str) -> str:
    return f"{text_a} [TEXT_B] {text_b}"


def main() -> None:
    print("=" * 70)
    print("AuthentiCheck — Relationship Model Diagnostic")
    print("=" * 70)

    dataframe = pd.read_csv(DATASET_FILE)

    model_bundle = joblib.load(MODEL_FILE)

    vectorizer = model_bundle["vectorizer"]
    classifier = model_bundle["classifier"]

    pair_texts = [
        build_pair_text(
            str(text_a),
            str(text_b),
        )
        for text_a, text_b in zip(
            dataframe["text_a"],
            dataframe["text_b"],
        )
    ]

    features = vectorizer.transform(pair_texts)

    predictions = classifier.predict(features)

    probabilities = classifier.predict_proba(features)

    dataframe["predicted_label"] = predictions

    dataframe["confidence"] = [
        float(max(probability_row))
        for probability_row in probabilities
    ]

    dataframe["correct"] = (
        dataframe["label"]
        == dataframe["predicted_label"]
    )

    print("\nFull-dataset diagnostic:")
    print(
        f"Correct predictions: "
        f"{dataframe['correct'].sum()}/{len(dataframe)}"
    )

    print("\nPrediction distribution:")

    prediction_counts = (
        dataframe["predicted_label"]
        .value_counts()
        .sort_index()
    )

    for label, count in prediction_counts.items():
        print(
            f"  {label} = "
            f"{LABEL_NAMES.get(label, 'unknown')}: "
            f"{count}"
        )

    print("\nMisclassified examples:")
    print("-" * 70)

    incorrect_rows = dataframe[
        ~dataframe["correct"]
    ]

    for index, row in incorrect_rows.iterrows():
        actual = int(row["label"])
        predicted = int(row["predicted_label"])

        print(f"\nExample {index + 1}")
        print(
            f"Actual:    "
            f"{actual} = {LABEL_NAMES[actual]}"
        )
        print(
            f"Predicted: "
            f"{predicted} = {LABEL_NAMES[predicted]}"
        )
        print(
            f"Confidence: "
            f"{row['confidence']:.4f}"
        )

        print("\nText A:")
        print(row["text_a"])

        print("\nText B:")
        print(row["text_b"])

        print("-" * 70)

    matrix = confusion_matrix(
        dataframe["label"],
        dataframe["predicted_label"],
        labels=sorted(LABEL_NAMES.keys()),
    )

    print("\nConfusion matrix:")
    print(matrix)

    print("\nDiagnostic completed.")
    print("=" * 70)


if __name__ == "__main__":
    main()