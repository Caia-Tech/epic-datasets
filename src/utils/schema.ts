import type { Organization, WebSite, Service, ContactPoint } from 'schema-dts';
import type { CaiaTechSchema } from '../types/schema';

export const generateOrganizationSchema = (): Organization => ({
  "@type": "Organization",
  "@id": "https://caiatech.com/#organization",
  "name": "Caia Tech",
  "url": "https://caiatech.com",
  "logo": "https://caiatech.com/logo.svg",
  "description": "Computer science research and practical AI implementations. Building the future of creative technology with ML, transformer architectures, and distributed systems.",
  "foundingDate": "2024",
  "industry": "Computer Science Research & AI Development",
  "email": "owner@caiatech.com",
  "knowsAbout": [
    "Transformer Architecture Implementations",
    "Kubernetes Deployment Patterns", 
    "Machine Learning Pipeline Optimization",
    "Distributed Systems Research",
    "AI Model Efficiency Studies",
    "Computational Creativity Systems",
    "Neural Network Optimization",
    "Open Source AI Research"
  ],
  "location": {
    "@type": "Place",
    "name": "Remote-first research lab"
  },
  "sameAs": [
    "https://github.com/Caia-Tech",
    "https://twitter.com/caiatech"
  ]
});

export const generateWebSiteSchema = (): WebSite => ({
  "@type": "WebSite",
  "@id": "https://caiatech.com/#website",
  "url": "https://caiatech.com",
  "name": "Caia Tech - Computer Science Research & Practical AI Implementations",
  "description": "From transformers to Kubernetes: Full-stack innovation in distributed systems, machine learning pipeline optimization, and open source AI research",
  "keywords": "transformer architecture implementations, kubernetes deployment patterns, machine learning pipeline optimization, distributed systems research, AI model efficiency studies",
  "publisher": {
    "@id": "https://caiatech.com/#organization"
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://caiatech.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
});

export const generateServicesSchema = (): Service[] => [
  {
    "@type": "Service",
    "@id": "https://caiatech.com/services/ml-research",
    "name": "Machine Learning Research & Implementation",
    "description": "Peer-reviewed ML implementations, transformer model fine-tuning, and neural network optimization for production systems",
    "provider": {
      "@id": "https://caiatech.com/#organization"
    },
    "category": "AI/ML Research",
    "keywords": "transformer architecture implementations, neural network optimization, ML pipeline optimization",
    "url": "https://caiatech.com/research"
  },
  {
    "@type": "Service", 
    "@id": "https://caiatech.com/services/distributed-systems",
    "name": "Distributed Systems & Kubernetes",
    "description": "Kubernetes auto-scaling strategies, deployment patterns, and distributed computing frameworks for ML workloads",
    "provider": {
      "@id": "https://caiatech.com/#organization"
    },
    "category": "Infrastructure & DevOps",
    "keywords": "kubernetes deployment patterns, distributed systems research, edge computing ML deployment",
    "url": "https://caiatech.com/infrastructure"
  },
  {
    "@type": "Service",
    "@id": "https://caiatech.com/services/creative-ai",
    "name": "Creative AI & Computational Creativity",
    "description": "For World Builders creative AI, narrative structure algorithms, and worldbuilding application development",
    "provider": {
      "@id": "https://caiatech.com/#organization"
    },
    "category": "Creative Technology",
    "keywords": "computational creativity systems, creative writing technology tools, worldbuilding applications",
    "url": "https://caiatech.com/creative"
  }
];

export const generateContactSchema = (): ContactPoint => ({
  "@type": "ContactPoint",
  "contactType": "Business Inquiries",
  "url": "https://caiatech.com/contact"
});

export const generateFullSchema = (): CaiaTechSchema => ({
  organization: generateOrganizationSchema(),
  website: generateWebSiteSchema(),
  services: generateServicesSchema(),
  contactPoint: generateContactSchema()
});

export const jsonLdScript = (schema: any) => {
  return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
};