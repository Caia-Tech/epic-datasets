# Dataset Fetcher Integration

This Astro integration automatically fetches dataset information from GitHub and Hugging Face APIs during build time to generate a dynamic datasets page.

## How it works

1. **Build-time execution**: Runs during `astro build` via the `astro:build:start` hook
2. **GitHub integration**: Fetches dataset directories and files from the `epic-datasets` repository
3. **Hugging Face integration**: Optionally fetches metadata from Hugging Face datasets (requires token)
4. **Static generation**: Creates a JSON file with all dataset information for use by the datasets page

## Features

- **Multiple format support**: Automatically detects JSON, JSONL, Parquet, CSV, and TXT files
- **File size calculation**: Shows individual format sizes and total dataset size
- **Intelligent descriptions**: Generates contextual descriptions based on dataset names
- **Badge system**: Automatically assigns "New" badges to recent datasets
- **Error resilience**: Gracefully handles API failures and missing tokens
- **Type safety**: Full TypeScript support with proper interfaces

## Configuration

Set environment variables for enhanced functionality:

```bash
# Optional: For private repository access
GITHUB_TOKEN=your_github_token

# Optional: For Hugging Face metadata (downloads, likes, etc.)
HUGGING_FACE_TOKEN=your_hf_token
```

## Generated data structure

The integration generates `src/data/datasets.json` with the following structure:

```typescript
interface DatasetInfo {
  id: string;
  name: string;
  title: string;
  description: string;
  files: DatasetFile[];
  size: {
    json?: string;
    jsonl?: string;
    parquet?: string;
    total: string;
  };
  metadata: {
    license: string;
    lastUpdated: string;
    version: string;
    downloads?: number;
    likes?: number;
    tags: string[];
  };
  links: {
    github: string;
    huggingface?: string;
  };
  badge?: string;
}
```

## Extending

To add support for new dataset sources:

1. Add a new fetch method in `DatasetFetcher` class
2. Update the `fetchAllDatasets()` method to include the new source
3. Modify the `generateDatasetInfo()` method to handle additional metadata

## Performance

- **Build time**: ~1-2 seconds for API calls
- **Runtime**: Zero - all data is pre-generated
- **Caching**: Uses retry logic with exponential backoff for resilient API calls