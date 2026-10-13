import pymupdf

doc = pymupdf.open()
page = doc.new_page()

sentences = [
    "Machine learning is a branch of artificial intelligence that allows computers to learn patterns from data.",
    "Supervised learning uses labeled examples to learn relationships between inputs and known outputs.",
    "Unsupervised learning discovers hidden patterns in data without predefined labels.",
]

y_positions = [90, 170, 250]

for sentence, y in zip(sentences, y_positions):
    page.insert_text(
        (72, y),
        sentence,
        fontsize=12,
    )

doc.save("clean_reference.pdf")
doc.close()

print("Created clean_reference.pdf")
