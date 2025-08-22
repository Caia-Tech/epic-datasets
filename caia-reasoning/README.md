# CAIA Reasoning Dataset

A structured dataset of 250 reasoning examples for training AI models on logical, mathematical, and analytical thinking tasks.

## Dataset Description

This dataset provides diverse reasoning challenges across multiple domains including logical reasoning, mathematical problem-solving, causal analysis, and ethical reasoning. Each example includes detailed metadata, structured inputs, and comprehensive solutions with step-by-step reasoning chains.

## Key Features

- **250 curated reasoning examples** across multiple difficulty levels
- **Rich metadata** including domain, difficulty, and task type
- **Step-by-step solutions** with explicit reasoning chains
- **Multiple formats**: JSON, JSONL, and Parquet
- **Diverse reasoning types**: Deductive, inductive, causal, and ethical

## Dataset Statistics

- Total examples: 250
- Difficulty levels: Elementary to Advanced
- Domains covered:
  - Logical reasoning
  - Mathematical reasoning
  - Causal reasoning
  - Ethical reasoning
  - Constraint satisfaction
  - Pattern recognition

## File Formats

- `caia-reasoning.json`: Complete dataset with full structure
- `caia-reasoning.jsonl`: Line-delimited JSON for streaming
- `caia-reasoning.parquet`: Columnar format for efficient processing

## Usage

```python
import json
import pandas as pd

# Load JSON format
with open('caia-reasoning.json', 'r') as f:
    data = json.load(f)

# Load JSONL format
examples = []
with open('caia-reasoning.jsonl', 'r') as f:
    for line in f:
        examples.append(json.loads(line))

# Load Parquet format
df = pd.read_parquet('caia-reasoning.parquet')
```

## Example Structure

Each reasoning example includes:
- Problem statement and context
- Input variables and constraints
- Step-by-step reasoning process
- Final answer with justification
- Metadata (domain, difficulty, task type)

## Intended Use

This dataset is designed for:
- Training reasoning capabilities in language models
- Benchmark evaluation of logical reasoning
- Research on chain-of-thought prompting
- Educational AI applications

## License

Apache 2.0