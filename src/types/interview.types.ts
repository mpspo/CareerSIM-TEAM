// ============================================
// INTERVIEW TYPES
// ============================================

export interface InterviewConfig {
  jobRole: string;
  jobAd?: string;
  company: CompanyProfile;
  persona: Persona;
  duration: number; // in minutes
  difficulty: 'junior' | 'intermediate' | 'advanced';
  type: 'standard' | 'case' | 'technical' | 'mixed';
  cvSummary?: string;
}

export interface CompanyProfile {
  name: string;
  type: 'startup' | 'corporate' | 'consulting' | 'scaleup';
  industry: string;
  tone?: string;
}

export interface Phase {
  id: number;
  name: string;
  duration: number; // in minutes
  questionCount: number;
  objectives: string[];
  questionTypes?: string[];
}

export interface InterviewSession {
  id: string;
  userId: string;
  config: InterviewConfig;
  phases: Phase[];
  currentPhase: number;
  questionCount: number;
  startTime: Date;
  endTime?: Date;
  status: 'setup' | 'in_progress' | 'paused' | 'completed' | 'abandoned';
  conversationHistory: Message[];
  
  // Career Integration ⭐
  summary?: string; // AI-generated summary
  strengths: string[]; // detected strengths
  weaknesses: string[]; // detected weaknesses
  overallScore?: number; // 0-100
  
  metadata?: Record<string, any>;
}

export interface InterviewStep {
  id: string;
  sessionId: string;
  question: string;
  answer: string;
  feedback?: string;
  analysis?: {
    completeness: number;
    clarity: number;
    relevance: number;
    structure: 'STAR' | 'unstructured' | 'partial';
  };
  askedAt: Date;
  answeredAt?: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'text' | 'audio';
}

export interface Question {
  id: string;
  phase: number;
  text: string;
  type: 'intro' | 'technical' | 'behavioral' | 'case' | 'closing';
  difficulty: number; // 1-3
  followUpTo?: string; // ID of previous question
  askedAt: Date;
}

export interface Answer {
  id: string;
  questionId: string;
  text: string;
  duration: number; // seconds
  answeredAt: Date;
}

export interface InterviewContext {
  session: InterviewSession;
  currentPhase: Phase;
  previousAnswers: Answer[];
  cvSummary?: string;
  jobAd?: string;
  companyContext?: string;
}

// ============================================
// EXPORTS
// ============================================

export type InterviewStatus = InterviewSession['status'];
export type InterviewType = InterviewConfig['type'];
export type DifficultyLevel = InterviewConfig['difficulty'];
