# Python Epic Dataset

A curated collection of 598 Python programming examples for training AI models on Python development patterns and best practices.

## Dataset Description

This dataset encompasses Python code examples from beginner to advanced levels, including data science applications, web development, automation scripts, and machine learning implementations. Each entry demonstrates Pythonic idioms and modern Python features.

## Key Features

- **598 Python code examples** with detailed explanations
- **Diverse application domains**: Web, data science, automation, ML
- **Modern Python features**: Type hints, async/await, decorators
- **Multiple formats**: JSON, JSONL, and Parquet
- **Best practices** and PEP 8 compliant code

## Dataset Statistics

- Total examples: 598
- Topics covered:
  - Python fundamentals
  - Object-oriented programming
  - Functional programming patterns
  - Data structures and algorithms
  - Web frameworks (Django, Flask, FastAPI)
  - Data analysis (pandas, NumPy)
  - Machine learning (scikit-learn, TensorFlow)
  - Async programming
  - Testing and debugging

## File Formats

- `python-epic.json`: Complete dataset with metadata
- `python-epic.jsonl`: Line-delimited JSON for streaming
- `python-epic.parquet`: Columnar format for efficient processing

## Usage

```python
import json
import pandas as pd

# Load JSON format
with open('python-epic.json', 'r') as f:
    data = json.load(f)

# Load JSONL format
examples = []
with open('python-epic.jsonl', 'r') as f:
    for line in f:
        examples.append(json.loads(line))

# Load Parquet format
df = pd.read_parquet('python-epic.parquet')
```

## Content Structure

Each Python example includes:
- Complete source code
- Problem context and requirements
- Pythonic solutions
- Alternative approaches
- Performance considerations
- Common use cases

## Intended Use

This dataset is designed for:
- Training AI models on Python programming
- Code generation and completion
- Learning Python best practices
- Research on programming patterns

## License

Apache 2.0