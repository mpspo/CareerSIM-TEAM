import { supabase } from '../clients/SupabaseClient';
import type { CareerProfile, RoleRecommendation, SkillRecommendation } from '../types/career.types';

export interface CareerProfileData {
  id: string;
  userId: string;
  currentRole?: string;
  currentCompany?: string;
  yearsExperience?: number;
  targetRole?: string;
  targetIndustries?: string[];
  careerGoals?: string;
  totalInterviews: number;
  averageScore?: number;
  improvementTrend?: {
    dates: string[];
    scores: number[];
  };
  roleRecommendations?: any[];
  skillRecommendations?: any[];
  educationRecommendations?: any[];
  lastUpdated: Date;
  createdAt: Date;
}

export class CareerProfileService {
  /**
   * Get or create career profile for current user
   */
  static async getOrCreateProfile(userId?: string): Promise<CareerProfileData> {
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      userId = user.id;
    }

    // Try to get existing profile
    const { data: existing, error: fetchError } = await supabase
      .from('career_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existing) {
      return this.mapToProfile(existing);
    }

    // Create new profile if not exists
    if (fetchError?.code === 'PGRST116') {
      const { data: newProfile, error: createError } = await supabase
        .from('career_profiles')
        .insert({
          user_id: userId,
          total_interviews: 0,
        })
        .select()
        .single();

      if (createError) throw createError;
      return this.mapToProfile(newProfile);
    }

    throw fetchError;
  }

  /**
   * Update career profile with interview results
   */
  static async updateAfterInterview(
    sessionId: string,
    userId?: string
  ): Promise<CareerProfileData> {
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      userId = user.id;
    }

    // Get the interview session
    const { error: sessionError } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) throw sessionError;

    // Get or create profile
    const profile = await this.getOrCreateProfile(userId);

    // Get all completed sessions for this user
    const { data: allSessions, error: sessionsError } = await supabase
      .from('interview_sessions')
      .select('overall_score, completed_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: true });

    if (sessionsError) throw sessionsError;

    // Calculate statistics
    const totalInterviews = allSessions.length;
    const scores = allSessions
      .filter((s) => s.overall_score !== null)
      .map((s) => s.overall_score);
    const averageScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;

    // Build improvement trend
    const improvementTrend = {
      dates: allSessions.map((s) => s.completed_at),
      scores: allSessions.map((s) => s.overall_score || 0),
    };

    // Update profile
    const { data: updated, error: updateError } = await supabase
      .from('career_profiles')
      .update({
        total_interviews: totalInterviews,
        average_score: averageScore,
        improvement_trend: improvementTrend,
        last_updated: new Date().toISOString(),
      })
      .eq('id', profile.id)
      .select()
      .single();

    if (updateError) throw updateError;
    return this.mapToProfile(updated);
  }

  /**
   * Get aggregated strengths from all interviews
   */
  static async getAggregatedStrengths(userId?: string): Promise<string[]> {
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      userId = user.id;
    }

    const { data: sessions, error } = await supabase
      .from('interview_sessions')
      .select('strengths')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .not('strengths', 'is', null);

    if (error) throw error;

    // Flatten all strengths and count occurrences
    const strengthCounts = new Map<string, number>();
    sessions.forEach((session) => {
      (session.strengths || []).forEach((strength: string) => {
        strengthCounts.set(strength, (strengthCounts.get(strength) || 0) + 1);
      });
    });

    // Sort by frequency and return top strengths
    return Array.from(strengthCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([strength]) => strength);
  }

  /**
   * Get aggregated weaknesses from all interviews
   */
  static async getAggregatedWeaknesses(userId?: string): Promise<string[]> {
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      userId = user.id;
    }

    const { data: sessions, error } = await supabase
      .from('interview_sessions')
      .select('weaknesses')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .not('weaknesses', 'is', null);

    if (error) throw error;

    // Flatten all weaknesses and count occurrences
    const weaknessCounts = new Map<string, number>();
    sessions.forEach((session) => {
      (session.weaknesses || []).forEach((weakness: string) => {
        weaknessCounts.set(weakness, (weaknessCounts.get(weakness) || 0) + 1);
      });
    });

    // Sort by frequency and return top weaknesses
    return Array.from(weaknessCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([weakness]) => weakness);
  }

  /**
   * Generate role recommendations based on interview performance
   */
  static async generateRoleRecommendations(userId?: string): Promise<RoleRecommendation[]> {
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      userId = user.id;
    }

    // Get profile and sessions
    await this.getOrCreateProfile(userId);
    await this.getAggregatedStrengths(userId);

    // TODO: Use AI to generate personalized recommendations
    // For now, return mock recommendations based on strengths
    const mockRecommendations: RoleRecommendation[] = [
      {
        title: 'Senior Software Engineer',
        company: 'Tech Startup',
        matchScore: 87,
        requiredSkills: ['TypeScript', 'React', 'System Design', 'Leadership'],
        description: 'Basierend auf deinen strukturierten Antworten und technischen Kenntnissen',
        salary: '€70,000 - €95,000',
        location: 'Berlin',
      },
      {
        title: 'Product Manager',
        company: 'Scale-up',
        matchScore: 78,
        requiredSkills: ['Product Strategy', 'User Research', 'Stakeholder Management'],
        description: 'Deine Kommunikationsfähigkeiten passen gut zu dieser Rolle',
        salary: '€65,000 - €85,000',
        location: 'München',
      },
      {
        title: 'Engineering Team Lead',
        company: 'Enterprise',
        matchScore: 73,
        requiredSkills: ['Technical Leadership', 'Mentoring', 'Architecture'],
        description: 'Deine Problemlösungsfähigkeiten sind ideal für diese Position',
        salary: '€75,000 - €100,000',
        location: 'Frankfurt',
      },
    ];

    return mockRecommendations;
  }

  /**
   * Generate skill recommendations based on career goals and gaps
   */
  static async generateSkillRecommendations(userId?: string): Promise<SkillRecommendation[]> {
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      userId = user.id;
    }

    await this.getAggregatedWeaknesses(userId);

    // TODO: Use AI to generate personalized skill recommendations
    // For now, return mock recommendations based on weaknesses
    const mockSkills: SkillRecommendation[] = [
      {
        skill: 'Datenanalyse & Metriken',
        priority: 'high',
        reason: 'Häufig in deinen Verbesserungsbereichen erwähnt',
        resources: [
          { title: 'Data Analytics Course', url: '#', type: 'course' },
          { title: 'Metrics für Product Manager', url: '#', type: 'article' },
        ],
        estimatedTime: '4 Wochen',
      },
      {
        skill: 'Prägnante Kommunikation',
        priority: 'high',
        reason: 'Verkürze deine Antworten für mehr Impact',
        resources: [
          { title: 'Effective Communication', url: '#', type: 'course' },
        ],
        estimatedTime: '2 Wochen',
      },
      {
        skill: 'Storytelling',
        priority: 'medium',
        reason: 'Stärke deine Beispiele mit besseren Narrativen',
        resources: [
          { title: 'Business Storytelling', url: '#', type: 'video' },
        ],
        estimatedTime: '3 Wochen',
      },
    ];

    return mockSkills;
  }

  /**
   * Get complete career profile with recommendations
   */
  static async getCompleteProfile(userId?: string): Promise<CareerProfile> {
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      userId = user.id;
    }

    const [profile, strengths, weaknesses, roleRecs, skillRecs] = await Promise.all([
      this.getOrCreateProfile(userId),
      this.getAggregatedStrengths(userId),
      this.getAggregatedWeaknesses(userId),
      this.generateRoleRecommendations(userId),
      this.generateSkillRecommendations(userId),
    ]);

    return {
      userId: profile.userId,
      currentRole: profile.currentRole,
      currentCompany: profile.currentCompany,
      yearsExperience: profile.yearsExperience || 0,
      targetRole: profile.targetRole,
      targetIndustries: profile.targetIndustries || [],
      careerGoals: profile.careerGoals,
      aggregatedStrengths: strengths,
      aggregatedWeaknesses: weaknesses,
      recommendedRoles: roleRecs,
      recommendedSkills: skillRecs,
      totalInterviews: profile.totalInterviews,
      averageScore: profile.averageScore || 0,
      lastUpdated: profile.lastUpdated,
    };
  }

  /**
   * Update profile basic info
   */
  static async updateBasicInfo(
    data: {
      currentRole?: string;
      currentCompany?: string;
      yearsExperience?: number;
      targetRole?: string;
      targetIndustries?: string[];
      careerGoals?: string;
    },
    userId?: string
  ): Promise<CareerProfileData> {
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      userId = user.id;
    }

    // Get or create profile
    const profile = await this.getOrCreateProfile(userId);

    // Update
    const { data: updated, error } = await supabase
      .from('career_profiles')
      .update({
        ...data,
        last_updated: new Date().toISOString(),
      })
      .eq('id', profile.id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToProfile(updated);
  }

  /**
   * Map database record to CareerProfileData
   */
  private static mapToProfile(data: any): CareerProfileData {
    return {
      id: data.id,
      userId: data.user_id,
      currentRole: data.current_role,
      currentCompany: data.current_company,
      yearsExperience: data.years_experience,
      targetRole: data.target_role,
      targetIndustries: data.target_industries,
      careerGoals: data.career_goals,
      totalInterviews: data.total_interviews,
      averageScore: data.average_score,
      improvementTrend: data.improvement_trend,
      roleRecommendations: data.role_recommendations,
      skillRecommendations: data.skill_recommendations,
      educationRecommendations: data.education_recommendations,
      lastUpdated: new Date(data.last_updated),
      createdAt: new Date(data.created_at),
    };
  }
}
