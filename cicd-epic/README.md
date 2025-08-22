# CI/CD Epic Dataset

A large-scale dataset of 2,708 CI/CD configurations, pipeline definitions, and deployment scenarios for training AI models on DevOps practices.

## Dataset Description

This dataset contains comprehensive CI/CD examples including GitHub Actions workflows, Jenkins pipelines, GitLab CI configurations, and deployment strategies. Each entry represents real-world automation scenarios with best practices for continuous integration and deployment.

## Key Features

- **2,708 CI/CD configurations** from various platforms
- **Multiple CI/CD tools**: GitHub Actions, Jenkins, GitLab CI, CircleCI, Travis CI
- **Complete pipeline examples** with testing, building, and deployment stages
- **Multiple formats**: JSON, JSONL, and Parquet
- **Infrastructure as Code** examples including Terraform and Kubernetes

## Dataset Statistics

- Total entries: 2,708
- CI/CD platforms covered:
  - GitHub Actions workflows
  - Jenkins pipeline scripts
  - GitLab CI/CD configurations
  - Docker and containerization
  - Kubernetes deployments
  - Terraform configurations
  - AWS/Azure/GCP deployments

## File Formats

- `cicd-epic.json`: Complete dataset with metadata
- `cicd-epic.jsonl`: Line-delimited JSON for streaming
- `cicd-epic.parquet`: Columnar format for efficient processing

## Usage

```python
import json
import pandas as pd

# Load JSON format
with open('cicd-epic.json', 'r') as f:
    data = json.load(f)

# Load JSONL format
pipelines = []
with open('cicd-epic.jsonl', 'r') as f:
    for line in f:
        pipelines.append(json.loads(line))

# Load Parquet format
df = pd.read_parquet('cicd-epic.parquet')
```

## Content Structure

Each CI/CD configuration includes:
- Pipeline definition and stages
- Build and test configurations
- Deployment strategies
- Environment configurations
- Security scanning steps
- Artifact management
- Rollback procedures

## Intended Use

This dataset is designed for:
- Training AI models on DevOps automation
- Learning CI/CD best practices
- Generating pipeline configurations
- Research on deployment patterns

## License

Apache 2.0