import type { Organization, WebSite, Service, ContactPoint } from 'schema-dts';

export interface CaiaTechSchema {
  organization: Organization;
  website: WebSite;
  services: Service[];
  contactPoint: ContactPoint;
}

export interface NLWebResponse {
  type: 'answer' | 'redirect' | 'action';
  content: string;
  schema?: any;
  metadata?: Record<string, any>;
}

export interface ConversationalQuery {
  query: string;
  context?: Record<string, any>;
  intent?: 'information' | 'navigation' | 'contact' | 'service';
}