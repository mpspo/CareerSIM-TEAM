// ============================================
// FEEDBACK TYPES
// ============================================

export interface AnswerAnalysis {
  completeness: number; // 0-100
  clarity: number; // 0-100
  relevance: number; // 0-100
  structure: 'STAR' | 'unstructured' | 'partial';
  topics: string[];
  weaknesses: string[];
  strengths: string[];
  sentiment?: 'positive' | 'neutral' | 'nervous';
}

export interface STARAnalysis {
  situation: STARComponent;
  task: STARComponent;
  action: STARComponent;
  result: STARComponent;
  suggestion: string;
  overallScore: number; // 0-100
}

export interface STARComponent {
  present: boolean;
  quality: 'good' | 'weak' | 'missing';
  excerpt?: string;
}

export interface ImmediateFeedback {
  strengths: string[];
  weaknesses: string[];
  suggestion: string;
  starAnalysis?: STARAnalysis;
  exampleAnswer?: string;
  score?: number; // 0-100
}

export interface FinalScorecard {
  overallScore: number; // 0-100
  categoryScores: CategoryScores;
  keyStrengths: string[];
  areasForImprovement: string[];
  detailedFeedback: string;
  trainingPlan: TrainingStep[];
  duration: number; // seconds
  questionsAsked: number;
  questionsAnswered: number;
}

export interface CategoryScores {
  communication: number; // 0-100
  technical: number; // 0-100
  problemSolving: number; // 0-100
  motivation: number; // 0-100
  fit: number; // 0-100
}

export interface TrainingStep {
  title: string;
  description: string;
  resources?: string[];
  estimatedTime?: string; // e.g., "2 weeks"
  priority: 'high' | 'medium' | 'low';
}

export interface FeedbackResult {
  immediate?: ImmediateFeedback;
  analysis: AnswerAnalysis;
  shouldAskFollowUp: boolean;
  followUpSuggestion?: string;
}
