// ============================================
// RAG (Retrieval-Augmented Generation) TYPES
// ============================================

export interface Document {
  id: string;
  type: 'job_ad' | 'company_info' | 'cv' | 'knowledge_base';
  content: string;
  metadata: DocumentMetadata;
  embedding?: number[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface DocumentMetadata {
  title?: string;
  company?: string;
  industry?: string;
  role?: string;
  source?: string;
  tags?: string[];
  [key: string]: any;
}

export interface SearchResult {
  content: string;
  score: number;
  metadata: DocumentMetadata;
  documentId: string;
}

export interface Snippet {
  text: string;
  relevanceScore: number;
  source: string;
  metadata?: Record<string, any>;
}

export interface CompanyContext {
  name: string;
  description: string;
  culture: string;
  values: string[];
  recentNews?: string[];
  keyPeople?: string[];
}

export interface RoleContext {
  title: string;
  department: string;
  responsibilities: string[];
  requirements: string[];
  skills: string[];
  seniorityLevel: string;
}

export type DocumentType = Document['type'];
