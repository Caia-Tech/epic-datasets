# CAIA Math Dataset

A comprehensive mathematical reasoning dataset containing 131 problems with detailed solutions for training AI models on mathematical problem-solving.

## Dataset Description

This dataset covers a wide range of mathematical topics from basic arithmetic to advanced calculus concepts. Each problem includes complete step-by-step solutions, making it ideal for training models on mathematical reasoning and problem-solving methodologies.

## Key Features

- **131 mathematical problems** with detailed solutions
- **Progressive difficulty levels** from elementary to advanced
- **Step-by-step walkthroughs** showing complete problem-solving process
- **Multiple formats**: JSON, JSONL, and Parquet
- **Diverse mathematical domains**: Algebra, geometry, calculus, statistics, and more

## Dataset Statistics

- Total problems: 131
- Topics covered:
  - Algebra and equations
  - Geometry and trigonometry
  - Calculus fundamentals
  - Statistics and probability
  - Number theory
  - Word problems

## File Formats

- `caia-math.json`: Complete dataset with metadata
- `caia-math.jsonl`: Line-delimited JSON for streaming
- `caia-math.parquet`: Columnar format for efficient processing

## Usage

```python
import json
import pandas as pd

# Load JSON format
with open('caia-math.json', 'r') as f:
    data = json.load(f)

# Load JSONL format
problems = []
with open('caia-math.jsonl', 'r') as f:
    for line in f:
        problems.append(json.loads(line))

# Load Parquet format
df = pd.read_parquet('caia-math.parquet')
```

## Problem Structure

Each problem includes:
- Problem statement
- Required concepts
- Step-by-step solution
- Final answer
- Common mistakes to avoid

## Intended Use

This dataset is designed for:
- Training mathematical reasoning in language models
- Educational AI applications
- Automated math tutoring systems
- Research on symbolic reasoning

## License

Apache 2.0