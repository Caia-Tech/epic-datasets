# Rust Epic Dataset

A focused collection of 98 Rust programming examples for training AI models on Rust's ownership system, memory safety, and systems programming patterns.

## Dataset Description

This dataset contains carefully selected Rust code examples that demonstrate the language's unique features including ownership, borrowing, lifetimes, and zero-cost abstractions. Each example showcases idiomatic Rust code with emphasis on memory safety and performance.

## Key Features

- **98 high-quality Rust examples** with detailed explanations
- **Memory safety patterns** demonstrating ownership and borrowing
- **Systems programming** examples including OS interactions
- **Multiple formats**: JSON, JSONL, and Parquet
- **Error handling** with Result and Option types

## Dataset Statistics

- Total examples: 98
- Topics covered:
  - Ownership and borrowing
  - Lifetimes and references
  - Traits and generics
  - Error handling patterns
  - Concurrent programming with threads
  - Async programming with tokio
  - Unsafe Rust and FFI
  - Macro development
  - Performance optimization

## File Formats

- `rust-epic.json`: Complete dataset with metadata
- `rust-epic.jsonl`: Line-delimited JSON for streaming
- `rust-epic.parquet`: Columnar format for efficient processing

## Usage

```python
import json
import pandas as pd

# Load JSON format
with open('rust-epic.json', 'r') as f:
    data = json.load(f)

# Load JSONL format
examples = []
with open('rust-epic.jsonl', 'r') as f:
    for line in f:
        examples.append(json.loads(line))

# Load Parquet format
df = pd.read_parquet('rust-epic.parquet')
```

## Content Structure

Each Rust example includes:
- Complete source code
- Ownership and lifetime annotations
- Memory safety guarantees
- Performance characteristics
- Common compiler errors and fixes
- Idiomatic alternatives

## Intended Use

This dataset is designed for:
- Training AI models on Rust programming
- Understanding memory-safe systems programming
- Learning Rust ownership patterns
- Research on zero-cost abstractions

## License

Apache 2.0