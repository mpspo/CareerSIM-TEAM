// ============================================
// PERSONA TYPES
// ============================================

export interface Persona {
  id: string;
  name: string;
  type: 'recruiter' | 'hiring_manager' | 'consultant' | 'technical';
  tone: 'friendly' | 'professional' | 'strict' | 'casual';
  difficulty: 'easy' | 'medium' | 'hard';
  followUpStyle: 'supportive' | 'challenging' | 'neutral';
  industry: string[];
  companyTypes: string[];
  description?: string;
  systemPromptTemplate: string;
  avatarUrl?: string;
  createdAt?: Date;
}

export interface PersonaSuggestion {
  persona: Persona;
  matchScore: number; // 0-100
  reason: string;
}

export type PersonaType = Persona['type'];
export type PersonaTone = Persona['tone'];
export type PersonaDifficulty = Persona['difficulty'];
export type FollowUpStyle = Persona['followUpStyle'];
