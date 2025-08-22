# CAIA System Design Dataset

A comprehensive collection of 882 system design problems and solutions for training AI models on software architecture and distributed systems.

## Dataset Description

This dataset contains real-world system design scenarios covering scalable architectures, distributed systems, microservices, and cloud infrastructure. Each entry includes problem requirements, constraints, and detailed architectural solutions with trade-off analyses.

## Key Features

- **882 system design scenarios** with complete solutions
- **Real-world applications**: Social networks, e-commerce, streaming services
- **Detailed architectural diagrams** described in text
- **Multiple formats**: JSON, JSONL, and Parquet
- **Trade-off analysis** for each design decision

## Dataset Statistics

- Total scenarios: 882
- Categories covered:
  - Distributed systems design
  - Microservices architecture
  - Database design and scaling
  - Caching strategies
  - Load balancing
  - Message queuing systems
  - API design
  - Cloud architecture patterns

## File Formats

- `caia-system-design.json`: Complete dataset with metadata
- `caia-system-design.jsonl`: Line-delimited JSON for streaming
- `caia-system-design.parquet`: Columnar format for efficient processing

## Usage

```python
import json
import pandas as pd

# Load JSON format
with open('caia-system-design.json', 'r') as f:
    data = json.load(f)

# Load JSONL format
designs = []
with open('caia-system-design.jsonl', 'r') as f:
    for line in f:
        designs.append(json.loads(line))

# Load Parquet format
df = pd.read_parquet('caia-system-design.parquet')
```

## Content Structure

Each system design includes:
- Problem statement and requirements
- Functional and non-functional requirements
- Capacity estimates
- High-level architecture
- Detailed component design
- Data model and API design
- Scalability considerations
- Trade-offs and alternatives

## Intended Use

This dataset is designed for:
- Training AI models on system architecture
- Technical interview preparation
- Educational resources for distributed systems
- Research on software design patterns

## License

Apache 2.0