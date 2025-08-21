export interface DatasetFile {
  name: string;
  path: string;
  size: number;
  download_url: string;
}

export interface DatasetInfo {
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