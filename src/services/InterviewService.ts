import { supabase } from '../clients/SupabaseClient';

// Types
export interface InterviewConfig {
  persona?: {
    id: string;
    name: string;
    type: string;
    difficulty: number;
  };
  company: string;
  role: string;
  duration: number; // minutes
  difficulty: number; // 1-5
  focusAreas: string[];
}

export interface InterviewMessage {
  id: string;
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: Date;
}

export interface InterviewResponse {
  questionId: string;
  question: string;
  answer: string;
  timestamp: Date;
  feedback?: string;
}

export interface InterviewSession {
  id: string;
  userId: string;
  personaId?: string;
  config: InterviewConfig;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  startedAt?: Date;
  completedAt?: Date;
  durationMinutes?: number;
  questions: any[];
  responses: InterviewResponse[];
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  overallScore?: number;
  metrics?: {
    knowledge: number;
    communication: number;
    structure: number;
    confidence: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class InterviewService {
  /**
   * Create a new interview session
   */
  static async createSession(config: InterviewConfig, userId?: string): Promise<InterviewSession> {
    // Get current user if not provided
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      userId = user.id;
    }

    const { data, error } = await supabase
      .from('interview_sessions')
      .insert({
        user_id: userId,
        persona_id: config.persona?.id,
        config: config,
        status: 'pending',
        questions: [],
        responses: [],
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToSession(data);
  }

  /**
   * Start an interview session
   */
  static async startSession(sessionId: string): Promise<InterviewSession> {
    const { data, error } = await supabase
      .from('interview_sessions')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return this.mapToSession(data);
  }

  /**
   * Add a question to the session
   */
  static async addQuestion(sessionId: string, question: string): Promise<void> {
    // Get current questions
    const { data: session, error: fetchError } = await supabase
      .from('interview_sessions')
      .select('questions')
      .eq('id', sessionId)
      .single();

    if (fetchError) throw fetchError;

    const questions = session.questions || [];
    questions.push({
      id: crypto.randomUUID(),
      question,
      timestamp: new Date().toISOString(),
    });

    const { error: updateError } = await supabase
      .from('interview_sessions')
      .update({ questions })
      .eq('id', sessionId);

    if (updateError) throw updateError;
  }

  /**
   * Add a response to the session
   */
  static async addResponse(
    sessionId: string,
    response: Omit<InterviewResponse, 'timestamp'>
  ): Promise<void> {
    // Get current responses
    const { data: session, error: fetchError } = await supabase
      .from('interview_sessions')
      .select('responses')
      .eq('id', sessionId)
      .single();

    if (fetchError) throw fetchError;

    const responses = session.responses || [];
    responses.push({
      ...response,
      timestamp: new Date().toISOString(),
    });

    const { error: updateError } = await supabase
      .from('interview_sessions')
      .update({ responses })
      .eq('id', sessionId);

    if (updateError) throw updateError;
  }

  /**
   * Complete an interview session with feedback
   */
  static async completeSession(
    sessionId: string,
    feedback: {
      summary: string;
      strengths: string[];
      weaknesses: string[];
      overallScore: number;
      metrics: {
        knowledge: number;
        communication: number;
        structure: number;
        confidence: number;
      };
    }
  ): Promise<InterviewSession> {
    const { data, error } = await supabase
      .from('interview_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        summary: feedback.summary,
        strengths: feedback.strengths,
        weaknesses: feedback.weaknesses,
        overall_score: feedback.overallScore,
        metrics: feedback.metrics,
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return this.mapToSession(data);
  }

  /**
   * Get a session by ID
   */
  static async getSession(sessionId: string): Promise<InterviewSession | null> {
    const { data, error } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return this.mapToSession(data);
  }

  /**
   * Get all sessions for a user
   */
  static async getUserSessions(userId?: string): Promise<InterviewSession[]> {
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      userId = user.id;
    }

    const { data, error } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(this.mapToSession);
  }

  /**
   * Get recent sessions
   */
  static async getRecentSessions(limit: number = 5): Promise<InterviewSession[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data.map(this.mapToSession);
  }

  /**
   * Calculate session duration
   */
  static async calculateDuration(sessionId: string): Promise<number> {
    const { data, error } = await supabase
      .from('interview_sessions')
      .select('started_at, completed_at')
      .eq('id', sessionId)
      .single();

    if (error) throw error;

    if (!data.started_at || !data.completed_at) return 0;

    const start = new Date(data.started_at);
    const end = new Date(data.completed_at);
    const durationMs = end.getTime() - start.getTime();
    return Math.round(durationMs / 60000); // Convert to minutes
  }

  /**
   * Map database record to InterviewSession
   */
  private static mapToSession(data: any): InterviewSession {
    return {
      id: data.id,
      userId: data.user_id,
      personaId: data.persona_id,
      config: data.config,
      status: data.status,
      startedAt: data.started_at ? new Date(data.started_at) : undefined,
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      durationMinutes: data.duration_minutes,
      questions: data.questions || [],
      responses: data.responses || [],
      summary: data.summary,
      strengths: data.strengths,
      weaknesses: data.weaknesses,
      overallScore: data.overall_score,
      metrics: data.metrics,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  /**
   * Delete a session
   */
  static async deleteSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('interview_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;
  }

  /**
   * Get session statistics
   */
  static async getStatistics(userId?: string): Promise<{
    totalSessions: number;
    completedSessions: number;
    averageScore: number;
    totalMinutes: number;
  }> {
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      userId = user.id;
    }

    const { data, error } = await supabase
      .from('interview_sessions')
      .select('status, overall_score, duration_minutes')
      .eq('user_id', userId);

    if (error) throw error;

    const totalSessions = data.length;
    const completedSessions = data.filter((s) => s.status === 'completed').length;
    const scores = data.filter((s) => s.overall_score !== null).map((s) => s.overall_score);
    const averageScore = scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
    const totalMinutes = data
      .filter((s) => s.duration_minutes)
      .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

    return {
      totalSessions,
      completedSessions,
      averageScore,
      totalMinutes,
    };
  }
}
