# CAIA Civil Rights Dataset

A comprehensive dataset for training AI models on civil rights history, legislation, and social justice topics.

## Dataset Description

This dataset contains 225 high-quality entries covering American civil rights history, including historical texts, biographies, legislation, and landmark cases. The content spans from slavery and abolition through modern civil rights movements.

## Key Features

- **225 structured entries** with rich historical content
- **420,761 total words** averaging 1,870 words per entry
- **174 Q&A pairs** for instruction tuning
- **Multiple formats**: JSON, JSONL, and Parquet for flexibility
- **Diverse categories**: Historical books, legislation, legal cases, biographies, civil rights events

## Dataset Statistics

- Total entries: 225
- Average words per entry: 1,870
- Minimum words per entry: 100
- Categories covered:
  - Historical books: 59 entries
  - Biographies: 51 entries
  - General civil rights: 48 entries
  - Women's rights: 22 entries
  - Civil rights events: 21 entries
  - Legislation: 10 entries
  - Legal cases: 9 entries

## File Formats

- `caia-civil-rights.json`: Complete dataset with metadata
- `caia-civil-rights.jsonl`: Line-delimited JSON for streaming
- `caia-civil-rights.parquet`: Columnar format for efficient processing

## Usage

```python
import json
import pandas as pd

# Load JSON format
with open('caia-civil-rights.json', 'r') as f:
    data = json.load(f)

# Load JSONL format
entries = []
with open('caia-civil-rights.jsonl', 'r') as f:
    for line in f:
        entries.append(json.loads(line))

# Load Parquet format
df = pd.read_parquet('caia-civil-rights.parquet')
```

## Content Sources

- Project Gutenberg (Public Domain)
- Wikipedia (CC BY-SA)
- US Government documents (Public Domain)

## License

Mixed licensing based on sources:
- Wikipedia content: CC BY-SA
- Project Gutenberg: Public Domain
- US Government documents: Public Domain

## Intended Use

This dataset is designed for:
- Training language models on civil rights knowledge
- Historical question-answering systems
- Educational AI applications
- Research on social justice topics

## Ethical Considerations

This dataset contains historical content that reflects the realities of civil rights struggles, including descriptions of discrimination and injustice. The content is preserved for educational and historical accuracy.