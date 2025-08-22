# Go Epic Dataset

A comprehensive dataset of 3,202 Go programming examples for training AI models on Go language patterns, idioms, and best practices.

## Dataset Description

This dataset contains production-quality Go code examples covering the full spectrum of Go programming, from basic syntax to advanced concurrency patterns. Each entry includes working code with explanations of Go-specific concepts like goroutines, channels, interfaces, and error handling.

## Key Features

- **3,202 Go code examples** with explanations
- **Complete working programs** demonstrating Go idioms
- **Concurrency patterns** with goroutines and channels
- **Multiple formats**: JSON, JSONL, and Parquet
- **Real-world applications** including web servers, CLI tools, and microservices

## Dataset Statistics

- Total examples: 3,202
- Topics covered:
  - Go fundamentals and syntax
  - Goroutines and concurrency
  - Channels and synchronization
  - Interfaces and composition
  - Error handling patterns
  - HTTP servers and clients
  - Database interactions
  - Testing and benchmarking
  - Package management

## File Formats

- `go-epic.json`: Complete dataset with metadata
- `go-epic.jsonl`: Line-delimited JSON for streaming
- `go-epic.parquet`: Columnar format for efficient processing

## Usage

```python
import json
import pandas as pd

# Load JSON format
with open('go-epic.json', 'r') as f:
    data = json.load(f)

# Load JSONL format
examples = []
with open('go-epic.jsonl', 'r') as f:
    for line in f:
        examples.append(json.loads(line))

# Load Parquet format
df = pd.read_parquet('go-epic.parquet')
```

## Content Structure

Each Go example includes:
- Complete source code
- Problem description
- Go-specific concepts demonstrated
- Best practices and idioms
- Common pitfalls to avoid
- Performance considerations

## Intended Use

This dataset is designed for:
- Training AI models on Go programming
- Code generation for Go applications
- Learning Go patterns and idioms
- Research on concurrent programming

## License

Apache 2.0