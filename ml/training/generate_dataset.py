from pathlib import Path
import csv
import random
import re


OUTPUT_FILE = Path(__file__).resolve().parent / "dataset_schema.csv"

RANDOM_SEED = 42
SAMPLES_PER_CLASS = 120


LABELS = {
    "original": 0,
    "exact_copy": 1,
    "paraphrased": 2,
    "partial_copy": 3,
    "unrelated": 4,
}


ACADEMIC_PASSAGES = [
    (
        "Supervised learning trains a model using labeled examples. "
        "The algorithm learns a relationship between input features and known target values."
    ),
    (
        "Unsupervised learning analyzes data without predefined labels. "
        "Clustering algorithms group observations according to similarities in their features."
    ),
    (
        "Neural networks contain interconnected computational units called neurons. "
        "During training, the network adjusts its parameters to reduce prediction error."
    ),
    (
        "Backpropagation calculates how much each model parameter contributes to prediction error. "
        "The resulting gradients are used by an optimization algorithm to update the network."
    ),
    (
        "Convolutional neural networks are frequently used for image analysis. "
        "Convolutional layers learn local visual patterns such as edges, textures, and shapes."
    ),
    (
        "A decision tree makes predictions by repeatedly dividing data according to selected features. "
        "Each internal node represents a decision and each leaf represents a predicted outcome."
    ),
    (
        "Natural language processing enables computers to process and analyze human language. "
        "Applications include sentiment analysis, machine translation, and text classification."
    ),
    (
        "A database stores information in an organized structure so applications can retrieve and modify it efficiently. "
        "Relational databases commonly represent information using tables and relationships."
    ),
    (
        "Cybersecurity protects computer systems and information from unauthorized access, modification, or destruction. "
        "Authentication and access control are important components of secure systems."
    ),
    (
        "Cloud computing provides computing resources through network-accessible services. "
        "Organizations can use cloud infrastructure without maintaining all physical hardware themselves."
    ),
    (
        "Data preprocessing prepares raw information for machine learning algorithms. "
        "Typical operations include cleaning missing values, scaling numerical features, and encoding categories."
    ),
    (
        "Model evaluation measures how well a machine learning system performs on data that was not used during training. "
        "Accuracy, precision, recall, and F1-score are common evaluation metrics."
    ),
    (
        "Regression algorithms predict numerical values from input features. "
        "Linear regression estimates relationships between variables using a fitted mathematical function."
    ),
    (
        "Classification algorithms assign observations to predefined categories. "
        "Common approaches include logistic regression, decision trees, and support vector machines."
    ),
    (
        "Feature engineering transforms raw variables into representations that can improve machine learning performance. "
        "Useful features can capture patterns that are difficult for a model to discover directly."
    ),
    (
        "Overfitting occurs when a model learns training data too closely and performs poorly on unseen examples. "
        "Regularization and validation techniques can help reduce this problem."
    ),
    (
        "Cross-validation evaluates a machine learning model across multiple partitions of a dataset. "
        "This provides a more reliable estimate of generalization performance."
    ),
    (
        "Gradient descent is an optimization method that adjusts model parameters in a direction that reduces the objective function. "
        "The learning rate controls the size of each parameter update."
    ),
    (
        "Principal component analysis reduces the dimensionality of numerical data. "
        "It creates new components that capture directions containing large amounts of variance."
    ),
    (
        "K-means clustering divides observations into a selected number of groups. "
        "The algorithm repeatedly assigns points to nearby centroids and updates those centroids."
    ),
    (
        "Recurrent neural networks process sequential information by maintaining information from previous time steps. "
        "They have been used for tasks involving language and time-series data."
    ),
    (
        "Transfer learning reuses knowledge learned from one task when solving another related task. "
        "Pretrained models can reduce the amount of labeled data and training time required."
    ),
    (
        "Attention mechanisms allow a model to assign different importance to different parts of an input. "
        "They are widely used in modern natural language processing architectures."
    ),
    (
        "Data augmentation creates additional training examples by applying controlled transformations to existing data. "
        "The technique can improve robustness and reduce overfitting."
    ),
    (
        "Precision measures the proportion of predicted positive cases that are actually positive. "
        "Recall measures the proportion of actual positive cases that the model successfully identifies."
    ),
    (
        "A confusion matrix summarizes classification predictions by comparing actual classes with predicted classes. "
        "It can reveal which categories are commonly confused by a model."
    ),
    (
        "Computer vision enables machines to extract useful information from images and videos. "
        "Applications include object detection, image classification, and facial analysis."
    ),
    (
        "Information retrieval systems locate relevant documents in response to a user's query. "
        "Search engines commonly rank documents according to estimated relevance."
    ),
    (
        "Natural language embeddings represent words or sentences as numerical vectors. "
        "Similar meanings can be represented by vectors that are close together in embedding space."
    ),
    (
        "An application programming interface allows software to communicate with another service. "
        "APIs define structured methods for requesting and exchanging information."
    ),
]


UNRELATED_PASSAGES = [
    (
        "The university library provides quiet study areas and access to printed and digital resources. "
        "Students can use these facilities for academic research and independent study."
    ),
    (
        "Regular physical activity can improve cardiovascular fitness and support overall health. "
        "A balanced exercise routine may include aerobic activity, strength training, and flexibility work."
    ),
    (
        "Rainfall varies between geographical regions because of differences in climate and atmospheric conditions. "
        "Seasonal weather patterns can influence local water availability."
    ),
    (
        "Public transportation connects residential neighborhoods with commercial and educational areas. "
        "Bus and rail networks can reduce dependence on private vehicles."
    ),
    (
        "Solar and wind power are renewable energy sources that can generate electricity without directly burning fossil fuels. "
        "Their output depends partly on environmental conditions."
    ),
    (
        "Effective time management allows students to organize academic tasks and personal responsibilities. "
        "Planning activities in advance can make large workloads easier to handle."
    ),
    (
        "Agricultural production depends on soil quality, water availability, temperature, and farming practices. "
        "Different crops require different environmental conditions."
    ),
    (
        "Museums preserve historical objects, artworks, and cultural materials for public education. "
        "Exhibitions can help visitors understand events and traditions from different periods."
    ),
    (
        "Urban parks provide recreational spaces where residents can walk, exercise, and relax. "
        "Green areas can also contribute to the visual character of a city."
    ),
    (
        "Nutrition involves obtaining energy and essential nutrients from food. "
        "A varied diet can provide carbohydrates, proteins, fats, vitamins, minerals, and water."
    ),
]


PARAPHRASE_MAP = {
    "trains a model using labeled examples":
        "learns from examples that already contain target labels",

    "analyzes data without predefined labels":
        "examines data when target labels are not provided",

    "group observations":
        "organize observations",

    "interconnected computational units called neurons":
        "connected processing units known as neurons",

    "reduce prediction error":
        "minimize mistakes in its predictions",

    "prediction error":
        "difference between predicted and actual results",

    "frequently used for image analysis":
        "often applied to image-related tasks",

    "local visual patterns":
        "small-scale visual features",

    "makes predictions":
        "produces predictions",

    "repeatedly dividing data":
        "splitting the dataset multiple times",

    "human language":
        "natural language",

    "retrieve and modify it efficiently":
        "access and update it efficiently",

    "unauthorized access":
        "access by unauthorized users",

    "network-accessible services":
        "services delivered through a network",

    "raw information":
        "unprocessed data",

    "not used during training":
        "held outside the training data",

    "predict numerical values":
        "estimate continuous values",

    "predefined categories":
        "known classes",

    "raw variables":
        "original variables",

    "performs poorly on unseen examples":
        "generalizes poorly to new examples",

    "multiple partitions":
        "several subsets",

    "reduces the objective function":
        "minimizes the optimization objective",

    "reduces the dimensionality":
        "decreases the number of dimensions",

    "selected number of groups":
        "chosen number of clusters",

    "sequential information":
        "ordered information",

    "reuses knowledge learned from one task":
        "uses previously learned knowledge from another task",

    "different importance":
        "different levels of importance",

    "additional training examples":
        "extra examples for training",

    "summarizes classification predictions":
        "provides a summary of classification results",

    "extract useful information":
        "derive meaningful information",

    "relevant documents":
        "documents related to a query",

    "numerical vectors":
        "numeric vector representations",

    "communicate with another service":
        "exchange information with another service",
}


VARIATION_SENTENCES = [
    "The method is useful in practical machine learning systems.",
    "This concept is important when designing data-driven applications.",
    "The technique is frequently discussed during model development.",
    "This approach can be applied to real-world datasets.",
    "The method provides a useful foundation for further analysis.",
    "This principle is relevant when building reliable software systems.",
    "The technique can support different types of analytical workflows.",
    "This example illustrates an important idea in modern computing.",
    "The concept can be evaluated using representative datasets.",
    "This approach is commonly considered in academic machine learning studies.",
    "The method can be adapted to different application requirements.",
    "This technique is useful when interpreting computational results.",
]


def clean_text(text: str) -> str:
    text = text.replace("\r", " ")
    text = text.replace("\n", " ")
    text = text.replace("\t", " ")

    text = re.sub(r"\s+", " ", text)

    text = re.sub(
        r"\s+([,.!?;:])",
        r"\1",
        text,
    )

    # Repair accidental word concatenation caused by
    # generated/document formatting.
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
    }

    for broken, fixed in known_repairs.items():
        text = text.replace(
            broken,
            fixed,
        )

    return text.strip()


def add_variation(
    text: str,
    index: int,
) -> str:
    sentence = VARIATION_SENTENCES[
        index % len(VARIATION_SENTENCES)
    ]

    cycle = index // len(
        VARIATION_SENTENCES
    )

    return clean_text(
        f"{text} {sentence} "
        f"Dataset example {cycle + 1}."
    )


def paraphrase(
    text: str,
    index: int,
) -> str:
    result = text

    replacements = list(
        PARAPHRASE_MAP.items()
    )

    rng = random.Random(
        RANDOM_SEED + index * 97
    )

    rng.shuffle(replacements)

    number_to_replace = 2 + (
        index % 4
    )

    applied = 0

    for original, replacement in replacements:
        if original in result:
            result = result.replace(
                original,
                replacement,
                1,
            )

            applied += 1

            if applied >= number_to_replace:
                break

    # Every paraphrase gets a different,
    # meaning-preserving closing sentence.
    result = (
        result
        + " "
        + VARIATION_SENTENCES[
            (index + 3)
            % len(VARIATION_SENTENCES)
        ]
    )

    return clean_text(result)


def partial_copy(
    text: str,
    index: int,
) -> str:
    sentences = re.split(
        r"(?<=[.!?])\s+",
        clean_text(text),
    )

    sentences = [
        sentence.strip()
        for sentence in sentences
        if sentence.strip()
    ]

    # Keep the first sentence from the source and
    # append independently written material.
    copied_sentence = sentences[
        0
    ]

    independent_sentences = [
        "The remaining analysis can consider how the method behaves on different datasets.",
        "A practical implementation may require additional preprocessing before evaluation.",
        "Further experiments can examine how this approach performs under changing conditions.",
        "The final outcome can depend on the characteristics of the application.",
        "Additional evaluation is useful when comparing different implementation choices.",
        "Researchers can also examine how the method interacts with other techniques.",
        "The application context may influence the final interpretation of the results.",
        "A larger experiment could provide more information about generalization.",
        "Other factors may need to be considered before drawing conclusions.",
        "Future work can investigate the method using additional examples.",
    ]

    independent = independent_sentences[
        index % len(independent_sentences)
    ]

    cycle = index // len(
        independent_sentences
    )

    return clean_text(
        f"{copied_sentence} "
        f"{independent} "
        f"Partial-copy example {cycle + 1}."
    )


def create_original_pair(
    index: int,
) -> tuple[str, str]:
    first = ACADEMIC_PASSAGES[
        (index * 7)
        % len(ACADEMIC_PASSAGES)
    ]

    second = ACADEMIC_PASSAGES[
        (index * 11 + 4)
        % len(ACADEMIC_PASSAGES)
    ]

    if first == second:
        second = ACADEMIC_PASSAGES[
            (index + 1)
            % len(ACADEMIC_PASSAGES)
        ]

    text_a = add_variation(
        first,
        index,
    )

    text_b = add_variation(
        second,
        index + 120,
    )

    return text_a, text_b


def create_unrelated_pair(
    index: int,
) -> tuple[str, str]:
    academic = ACADEMIC_PASSAGES[
        (index * 7)
        % len(ACADEMIC_PASSAGES)
    ]

    unrelated = UNRELATED_PASSAGES[
        (index * 3)
        % len(UNRELATED_PASSAGES)
    ]

    return (
        add_variation(
            academic,
            index + 300,
        ),
        add_variation(
            unrelated,
            index + 500,
        ),
    )


def build_dataset() -> list[
    tuple[str, str, int]
]:
    rows = []

    # ---------------------------------------------------------
    # CLASS 0 — ORIGINAL
    # ---------------------------------------------------------

    for index in range(
        SAMPLES_PER_CLASS
    ):
        text_a, text_b = create_original_pair(
            index
        )

        rows.append(
            (
                text_a,
                text_b,
                LABELS["original"],
            )
        )

    # ---------------------------------------------------------
    # CLASS 1 — EXACT COPY
    # ---------------------------------------------------------

    for index in range(
        SAMPLES_PER_CLASS
    ):
        base = ACADEMIC_PASSAGES[
            index % len(ACADEMIC_PASSAGES)
        ]

        document_text = add_variation(
            base,
            index + 700,
        )

        # Both documents are identical.
        rows.append(
            (
                document_text,
                document_text,
                LABELS["exact_copy"],
            )
        )

    # ---------------------------------------------------------
    # CLASS 2 — PARAPHRASED
    # ---------------------------------------------------------

    for index in range(
        SAMPLES_PER_CLASS
    ):
        base = ACADEMIC_PASSAGES[
            index % len(ACADEMIC_PASSAGES)
        ]

        source = add_variation(
            base,
            index + 900,
        )

        rewritten = paraphrase(
            base,
            index + 900,
        )

        # Keep the document-level variation while ensuring
        # the core semantic relationship remains intact.
        rewritten = clean_text(
            f"{rewritten} "
            f"Paraphrase sample {index + 1}."
        )

        rows.append(
            (
                source,
                rewritten,
                LABELS["paraphrased"],
            )
        )

    # ---------------------------------------------------------
    # CLASS 3 — PARTIAL COPY
    # ---------------------------------------------------------

    for index in range(
        SAMPLES_PER_CLASS
    ):
        base = ACADEMIC_PASSAGES[
            index % len(ACADEMIC_PASSAGES)
        ]

        source = add_variation(
            base,
            index + 1100,
        )

        partial = partial_copy(
            base,
            index,
        )

        rows.append(
            (
                source,
                partial,
                LABELS["partial_copy"],
            )
        )

    # ---------------------------------------------------------
    # CLASS 4 — UNRELATED
    # ---------------------------------------------------------

    for index in range(
        SAMPLES_PER_CLASS
    ):
        text_a, text_b = create_unrelated_pair(
            index
        )

        rows.append(
            (
                text_a,
                text_b,
                LABELS["unrelated"],
            )
        )

    return rows


def verify_dataset(
    rows: list[tuple[str, str, int]]
) -> None:
    pairs = [
        (
            text_a,
            text_b,
        )
        for text_a, text_b, _ in rows
    ]

    duplicate_pairs = (
        len(pairs)
        - len(set(pairs))
    )

    print("\nDataset validation:")
    print(
        f"Total rows: {len(rows)}"
    )

    print(
        f"Unique pairs: {len(set(pairs))}"
    )

    print(
        f"Duplicate pairs: {duplicate_pairs}"
    )

    if duplicate_pairs != 0:
        raise RuntimeError(
            "Dataset generation produced duplicate pairs."
        )

    empty_rows = [
        index
        for index, (
            text_a,
            text_b,
            _,
        ) in enumerate(rows)
        if not text_a.strip()
        or not text_b.strip()
    ]

    if empty_rows:
        raise RuntimeError(
            "Dataset contains empty text rows."
        )

    print(
        "Empty rows: 0"
    )


def main() -> None:
    rows = build_dataset()

    verify_dataset(rows)

    with OUTPUT_FILE.open(
        "w",
        newline="",
        encoding="utf-8",
    ) as file:
        writer = csv.writer(file)

        writer.writerow(
            [
                "text_a",
                "text_b",
                "label",
            ]
        )

        writer.writerows(rows)

    print(
        f"\nDataset created: {OUTPUT_FILE}"
    )

    print(
        f"Total rows: {len(rows)}"
    )

    print("\nClass distribution:")

    for name, label in LABELS.items():
        count = sum(
            1
            for _, _, row_label in rows
            if row_label == label
        )

        print(
            f"{label} = {name}: {count}"
        )


if __name__ == "__main__":
    main()