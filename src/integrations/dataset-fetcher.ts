import type { AstroIntegration } from 'astro';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface DatasetFile {
  name: string;
  path: string;
  size: number;
  download_url: string;
}

interface GitHubDataset {
  name: string;
  path: string;
  files: DatasetFile[];
  lastModified: string;
}

interface HuggingFaceDataset {
  id: string;
  downloads: number;
  likes: number;
  tags: string[];
  createdAt: string;
  lastModified: string;
  description?: string;
  cardData?: any;
}

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

class DatasetFetcher {
  private readonly githubToken?: string;
  private readonly hfToken?: string;
  private readonly baseGitHubUrl = 'https://api.github.com/repos/Caia-Tech/epic-datasets';
  private readonly baseHFUrl = 'https://huggingface.co/api/datasets';

  constructor() {
    this.githubToken = process.env.GITHUB_TOKEN;
    this.hfToken = process.env.HUGGING_FACE_TOKEN;
  }

  private async fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'User-Agent': 'caiatech.com-dataset-fetcher',
            ...(this.githubToken && url.includes('github.com') && {
              'Authorization': `token ${this.githubToken}`
            }),
            ...(this.hfToken && url.includes('huggingface.co') && {
              'Authorization': `Bearer ${this.hfToken}`
            }),
            ...options.headers,
          },
        });

        if (response.ok) {
          return response;
        }

        if (response.status === 403 && i < retries - 1) {
          // Rate limited, wait and retry
          await new Promise(resolve => setTimeout(resolve, (i + 1) * 1000));
          continue;
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, (i + 1) * 1000));
      }
    }
    throw new Error('Max retries exceeded');
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  private getFileType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'json': return 'json';
      case 'jsonl': return 'jsonl';
      case 'parquet': return 'parquet';
      case 'csv': return 'csv';
      case 'txt': return 'txt';
      default: return 'other';
    }
  }

  async fetchGitHubDatasets(): Promise<GitHubDataset[]> {
    try {
      console.log('Fetching datasets from GitHub...');
      
      // Fetch from the epic-datasets subdirectory, not the root
      const response = await this.fetchWithRetry(`${this.baseGitHubUrl}/contents/epic-datasets`);
      const contents = await response.json() as any[];

      const datasets: GitHubDataset[] = [];

      for (const item of contents) {
        // Only process directories that look like datasets (exclude common non-dataset dirs)
        if (item.type === 'dir' && !item.name.startsWith('.') && 
            !['node_modules', 'src', 'public', 'tests', 'k8s', 'articles', 'constitution_website', 
              'dist', 'docs', 'scripts', 'tools', '.github'].includes(item.name.toLowerCase())) {
          console.log(`Processing dataset: ${item.name}`);
          
          try {
            const datasetResponse = await this.fetchWithRetry(`${this.baseGitHubUrl}/contents/epic-datasets/${item.name}`);
            const datasetFiles = await datasetResponse.json() as any[];

            const files: DatasetFile[] = datasetFiles
              .filter((file: any) => {
                if (file.type !== 'file') return false;
                const name = file.name.toLowerCase();
                const isDataFile = name.endsWith('.json') || name.endsWith('.jsonl') || 
                                  name.endsWith('.parquet') || name.endsWith('.csv') || 
                                  name.endsWith('.txt');
                const isNotReadme = !name.includes('readme') && !name.includes('license');
                return isDataFile && isNotReadme;
              })
              .map((file: any) => ({
                name: file.name,
                path: file.path,
                size: file.size || 0,
                download_url: file.download_url || `https://raw.githubusercontent.com/Caia-Tech/epic-datasets/master/epic-datasets/${item.name}/${file.name}`
              }));

            if (files.length > 0) {
              datasets.push({
                name: item.name,
                path: item.path,
                files,
                lastModified: new Date().toISOString() // GitHub API doesn't provide this directly
              });
            } else {
              console.log(`Skipping ${item.name}: no valid dataset files found`);
            }
          } catch (error) {
            console.warn(`Failed to fetch files for dataset ${item.name}:`, error);
          }
        } else {
          console.log(`Skipping directory ${item.name}: excluded from processing`);
        }
      }

      console.log(`Found ${datasets.length} datasets on GitHub`);
      return datasets;
    } catch (error) {
      console.error('Error fetching GitHub datasets:', error);
      return [];
    }
  }

  async fetchHuggingFaceDataset(datasetId: string): Promise<HuggingFaceDataset | null> {
    // Skip HF fetching if no token is provided
    if (!this.hfToken) {
      console.log(`Skipping Hugging Face data for ${datasetId} (no token provided)`);
      return null;
    }

    try {
      console.log(`Fetching Hugging Face data for: ${datasetId}`);
      
      const response = await this.fetchWithRetry(`${this.baseHFUrl}/CaiaTech/${datasetId}`);
      
      if (!response.ok) {
        console.warn(`Hugging Face dataset not found: CaiaTech/${datasetId}`);
        return null;
      }

      const data = await response.json();
      
      return {
        id: datasetId,
        downloads: data.downloads || 0,
        likes: data.likes || 0,
        tags: data.tags || [],
        createdAt: data.createdAt || new Date().toISOString(),
        lastModified: data.lastModified || new Date().toISOString(),
        description: data.description,
        cardData: data.cardData
      };
    } catch (error) {
      console.warn(`Error fetching Hugging Face data for ${datasetId}:`, error);
      return null;
    }
  }

  private generateDatasetInfo(githubDataset: GitHubDataset, hfData?: HuggingFaceDataset | null): DatasetInfo {
    const name = githubDataset.name;
    const title = name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') + ' Dataset';

    // Calculate file sizes by type
    const sizeMap: Record<string, number> = {};
    let totalSize = 0;

    githubDataset.files.forEach(file => {
      const type = this.getFileType(file.name);
      sizeMap[type] = (sizeMap[type] || 0) + file.size;
      totalSize += file.size;
    });

    const size = {
      json: sizeMap.json ? this.formatFileSize(sizeMap.json) : undefined,
      jsonl: sizeMap.jsonl ? this.formatFileSize(sizeMap.jsonl) : undefined,
      parquet: sizeMap.parquet ? this.formatFileSize(sizeMap.parquet) : undefined,
      total: this.formatFileSize(totalSize)
    };

    // Generate description based on available data or dataset name
    let description = '';
    if (hfData?.description) {
      description = hfData.description;
    } else if (hfData?.cardData?.description) {
      description = hfData.cardData.description;
    } else {
      // Generate intelligent descriptions based on dataset name
      switch (name.toLowerCase()) {
        case 'go-epic':
          description = `A comprehensive Go programming dataset containing examples from basic syntax to distributed systems and algorithms. Each entry includes working code with explanations covering why specific patterns are used and how they apply to real development.

The dataset spans goroutines and channels, HTTP servers, database patterns, Kubernetes operators, gRPC services, and distributed systems architecture. It includes algorithm problems with multiple solution approaches and performance analysis.

Uses a minimal JSONL format with three fields per entry: instruction, output, and topic. Each example combines explanation and code in a single integrated teaching unit.

Released under CC0 1.0 Universal license. Available on GitHub, Hugging Face, and caiatech.com.`;
          break;
        default:
          description = `A comprehensive ${name.replace(/-/g, ' ')} dataset for AI/ML research and development. This dataset contains high-quality, curated data designed for training and evaluation of machine learning models.

The dataset is available in multiple formats including JSON, JSONL, and Parquet to support different workflows and tools. All data is carefully validated and documented to ensure reliability and practical utility.

Released under permissive licensing for both research and commercial use.`;
      }
    }

    // Determine badge
    let badge: string | undefined;
    const isRecent = new Date(githubDataset.lastModified) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (isRecent) badge = 'New';
    else if (hfData && hfData.downloads > 100) badge = 'Popular';

    return {
      id: name,
      name,
      title,
      description,
      files: githubDataset.files,
      size,
      metadata: {
        license: 'CC0 1.0 Universal', // Default, could be fetched from LICENSE file
        lastUpdated: new Date(githubDataset.lastModified).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        version: '1.0.0', // Default, could be determined from releases
        downloads: hfData?.downloads,
        likes: hfData?.likes,
        tags: hfData?.tags || []
      },
      links: {
        github: 'https://github.com/Caia-Tech/epic-datasets',
        huggingface: hfData ? `https://huggingface.co/datasets/CaiaTech/${name}` : undefined
      },
      badge
    };
  }

  async fetchAllDatasets(): Promise<DatasetInfo[]> {
    console.log('Starting dataset fetch process...');
    
    const githubDatasets = await this.fetchGitHubDatasets();
    const datasets: DatasetInfo[] = [];

    for (const githubDataset of githubDatasets) {
      const hfData = await this.fetchHuggingFaceDataset(githubDataset.name);
      const datasetInfo = this.generateDatasetInfo(githubDataset, hfData);
      datasets.push(datasetInfo);
    }

    console.log(`Successfully processed ${datasets.length} datasets`);
    return datasets;
  }
}

export function datasetFetcher(): AstroIntegration {
  return {
    name: 'dataset-fetcher',
    hooks: {
      'astro:build:start': async ({ logger }) => {
        logger.info('Fetching dataset information...');
        
        const fetcher = new DatasetFetcher();
        const datasets = await fetcher.fetchAllDatasets();

        // Ensure the data directory exists
        const dataDir = join(process.cwd(), 'src', 'data');
        if (!existsSync(dataDir)) {
          mkdirSync(dataDir, { recursive: true });
        }

        // Write datasets to a JSON file
        const datasetPath = join(dataDir, 'datasets.json');
        writeFileSync(datasetPath, JSON.stringify(datasets, null, 2));

        logger.info(`✅ Dataset information saved to ${datasetPath}`);
        logger.info(`📊 Found ${datasets.length} datasets`);
        
        datasets.forEach(dataset => {
          logger.info(`  - ${dataset.title} (${dataset.files.length} files, ${dataset.size.total})`);
        });
      }
    }
  };
}