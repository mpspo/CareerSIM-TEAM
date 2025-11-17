/**
 * Career Recommendation Service
 * Generates personalized career path recommendations based on interview performance
 */

import { supabase } from '../clients/SupabaseClient';

export interface CareerRecommendation {
  role: string;
  matchScore: number; // 0-100
  reasons: string[];
  requiredSkills: string[];
  currentSkillGaps: string[];
  estimatedTimeToReady: string; // e.g., "3-6 months"
  salaryRange: string;
  growthOutlook: 'high' | 'medium' | 'low';
  learningResources: LearningResource[];
}

export interface LearningResource {
  title: string;
  type: 'course' | 'book' | 'certification' | 'project' | 'practice';
  provider?: string;
  url?: string;
  duration?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface SkillAnalysis {
  skill: string;
  currentLevel: number; // 0-100
  targetLevel: number; // 0-100
  gap: number; // target - current
  importance: 'critical' | 'important' | 'nice-to-have';
  learningPath: LearningResource[];
}

export interface CareerPathAnalysis {
  currentProfile: {
    strengths: string[];
    weaknesses: string[];
    avgInterviewScore: number;
    totalInterviews: number;
    topSkills: string[];
  };
  recommendations: CareerRecommendation[];
  skillAnalysis: SkillAnalysis[];
  industryTrends: IndustryTrend[];
}

export interface IndustryTrend {
  skill: string;
  trendDirection: 'rising' | 'stable' | 'declining';
  demandLevel: 'very-high' | 'high' | 'medium' | 'low';
  description: string;
}

class CareerRecommendationService {
  private openAIKey: string;

  constructor() {
    this.openAIKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  }

  /**
   * Generate comprehensive career path analysis
   */
  async generateCareerAnalysis(userId: string): Promise<CareerPathAnalysis> {
    try {
      // Get user's interview history and performance
      const { data: sessions, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (error) throw error;

      if (!sessions || sessions.length === 0) {
        return this.getDefaultAnalysis();
      }

      // Aggregate performance data
      const currentProfile = this.analyzePerformance(sessions);

      // Generate AI-powered recommendations
      const recommendations = await this.generateRecommendations(currentProfile, sessions);

      // Analyze skill gaps
      const skillAnalysis = await this.analyzeSkillGaps(currentProfile, recommendations);

      // Get industry trends
      const industryTrends = await this.getIndustryTrends(currentProfile.topSkills);

      return {
        currentProfile,
        recommendations,
        skillAnalysis,
        industryTrends
      };
    } catch (error) {
      console.error('Error generating career analysis:', error);
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Analyze user's performance from interview sessions
   */
  private analyzePerformance(sessions: any[]): CareerPathAnalysis['currentProfile'] {
    const strengths: Map<string, number> = new Map();
    const weaknesses: Map<string, number> = new Map();
    let totalScore = 0;
    const skills: Map<string, number> = new Map();

    sessions.forEach(session => {
      // Aggregate strengths
      session.strengths?.forEach((strength: string) => {
        strengths.set(strength, (strengths.get(strength) || 0) + 1);
      });

      // Aggregate weaknesses
      session.weaknesses?.forEach((weakness: string) => {
        weaknesses.set(weakness, (weaknesses.get(weakness) || 0) + 1);
      });

      // Sum scores
      totalScore += session.overall_score || 0;

      // Extract skills from config
      const focusAreas = session.config?.focusAreas || [];
      focusAreas.forEach((skill: string) => {
        skills.set(skill, (skills.get(skill) || 0) + 1);
      });
    });

    // Top 5 most common strengths
    const topStrengths = Array.from(strengths.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([strength]) => strength);

    // Top 5 most common weaknesses
    const topWeaknesses = Array.from(weaknesses.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([weakness]) => weakness);

    // Top 5 most practiced skills
    const topSkills = Array.from(skills.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skill]) => skill);

    return {
      strengths: topStrengths,
      weaknesses: topWeaknesses,
      avgInterviewScore: Math.round(totalScore / sessions.length),
      totalInterviews: sessions.length,
      topSkills
    };
  }

  /**
   * Generate AI-powered career recommendations
   */
  private async generateRecommendations(
    profile: CareerPathAnalysis['currentProfile'],
    sessions: any[]
  ): Promise<CareerRecommendation[]> {
    try {
      const prompt = `As a career advisor, analyze this candidate's interview performance and provide 3 personalized career recommendations.

**Candidate Profile:**
- Average Interview Score: ${profile.avgInterviewScore}/100
- Total Interviews: ${profile.totalInterviews}
- Top Strengths: ${profile.strengths.join(', ')}
- Areas for Improvement: ${profile.weaknesses.join(', ')}
- Practiced Skills: ${profile.topSkills.join(', ')}

**Recent Interviews:**
${sessions.slice(0, 3).map(s => `- ${s.config?.role || 'Unknown Role'} at ${s.config?.company || 'Unknown Company'} (Score: ${s.overall_score}/100)`).join('\n')}

Provide exactly 3 role recommendations in JSON format. Each recommendation should include:
- role (string): Job title
- matchScore (number 0-100): How well they match
- reasons (string[]): 3 specific reasons why this role fits
- requiredSkills (string[]): 5 key skills needed
- currentSkillGaps (string[]): 3 skills they need to develop
- estimatedTimeToReady (string): e.g., "2-4 months"
- salaryRange (string): e.g., "$80k-$120k"
- growthOutlook (string): "high", "medium", or "low"

Return ONLY a JSON array of 3 recommendations, no other text.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openAIKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '[]';
      
      // Parse JSON response
      let recommendations = JSON.parse(content);
      
      // Add learning resources to each recommendation
      recommendations = await Promise.all(
        recommendations.map(async (rec: CareerRecommendation) => ({
          ...rec,
          learningResources: await this.generateLearningResources(rec.currentSkillGaps)
        }))
      );

      return recommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return this.getDefaultRecommendations(profile);
    }
  }

  /**
   * Generate learning resources for skill gaps
   */
  private async generateLearningResources(skills: string[]): Promise<LearningResource[]> {
    const resources: LearningResource[] = [];

    for (const skill of skills) {
      // In production, this would query a learning resource API or database
      // For now, provide generic but useful resources
      resources.push({
        title: `Master ${skill}`,
        type: 'course',
        provider: 'Coursera / Udemy',
        duration: '4-8 weeks',
        priority: 'high'
      });

      resources.push({
        title: `${skill} Practice Projects`,
        type: 'project',
        duration: '2-4 weeks',
        priority: 'high'
      });
    }

    return resources.slice(0, 5); // Limit to 5 resources
  }

  /**
   * Analyze skill gaps for each recommendation
   */
  private async analyzeSkillGaps(
    profile: CareerPathAnalysis['currentProfile'],
    recommendations: CareerRecommendation[]
  ): Promise<SkillAnalysis[]> {
    const skillAnalysisMap: Map<string, SkillAnalysis> = new Map();

    // Collect all required skills from recommendations
    recommendations.forEach(rec => {
      rec.requiredSkills.forEach(skill => {
        if (!skillAnalysisMap.has(skill)) {
          // Estimate current level based on strengths/weaknesses
          const isStrength = profile.strengths.some(s => 
            s.toLowerCase().includes(skill.toLowerCase())
          );
          const isWeakness = profile.weaknesses.some(w => 
            w.toLowerCase().includes(skill.toLowerCase())
          );

          const currentLevel = isStrength ? 70 : isWeakness ? 30 : 50;
          const targetLevel = 85;
          const gap = targetLevel - currentLevel;

          skillAnalysisMap.set(skill, {
            skill,
            currentLevel,
            targetLevel,
            gap,
            importance: gap > 40 ? 'critical' : gap > 20 ? 'important' : 'nice-to-have',
            learningPath: []
          });
        }
      });
    });

    // Add learning paths
    const skillAnalyses = Array.from(skillAnalysisMap.values());
    for (const analysis of skillAnalyses) {
      analysis.learningPath = await this.generateLearningResources([analysis.skill]);
    }

    // Sort by importance and gap
    return skillAnalyses.sort((a, b) => b.gap - a.gap).slice(0, 8);
  }

  /**
   * Get industry trends for skills
   */
  private async getIndustryTrends(skills: string[]): Promise<IndustryTrend[]> {
    // In production, this would use real market data
    // For now, provide realistic trends based on common knowledge
    const trendMap: Record<string, IndustryTrend> = {
      'AI/ML': {
        skill: 'AI/ML',
        trendDirection: 'rising',
        demandLevel: 'very-high',
        description: 'Artificial Intelligence and Machine Learning skills are in extremely high demand'
      },
      'Cloud': {
        skill: 'Cloud Computing',
        trendDirection: 'rising',
        demandLevel: 'very-high',
        description: 'Cloud infrastructure skills (AWS, Azure, GCP) continue to grow'
      },
      'React': {
        skill: 'React',
        trendDirection: 'stable',
        demandLevel: 'high',
        description: 'React remains a top choice for frontend development'
      },
      'Python': {
        skill: 'Python',
        trendDirection: 'rising',
        demandLevel: 'very-high',
        description: 'Python is essential for data science, AI, and backend development'
      },
      'TypeScript': {
        skill: 'TypeScript',
        trendDirection: 'rising',
        demandLevel: 'high',
        description: 'TypeScript adoption continues to grow in enterprise applications'
      }
    };

    return skills
      .map(skill => {
        // Try to match skill to known trends
        const key = Object.keys(trendMap).find(k => 
          skill.toLowerCase().includes(k.toLowerCase()) ||
          k.toLowerCase().includes(skill.toLowerCase())
        );
        
        return key ? trendMap[key] : {
          skill,
          trendDirection: 'stable' as const,
          demandLevel: 'medium' as const,
          description: `${skill} remains relevant in the current job market`
        };
      })
      .slice(0, 5);
  }

  /**
   * Get default analysis for users with no interview history
   */
  private getDefaultAnalysis(): CareerPathAnalysis {
    return {
      currentProfile: {
        strengths: [],
        weaknesses: [],
        avgInterviewScore: 0,
        totalInterviews: 0,
        topSkills: []
      },
      recommendations: this.getDefaultRecommendations({
        strengths: [],
        weaknesses: [],
        avgInterviewScore: 0,
        totalInterviews: 0,
        topSkills: []
      }),
      skillAnalysis: [],
      industryTrends: []
    };
  }

  /**
   * Get default recommendations
   */
  private getDefaultRecommendations(_profile: CareerPathAnalysis['currentProfile']): CareerRecommendation[] {
    return [
      {
        role: 'Junior Software Engineer',
        matchScore: 75,
        reasons: [
          'Great starting point for building technical skills',
          'High demand in the job market',
          'Clear career progression path'
        ],
        requiredSkills: ['Programming', 'Problem Solving', 'Version Control', 'Testing', 'Debugging'],
        currentSkillGaps: ['System Design', 'Code Review', 'CI/CD'],
        estimatedTimeToReady: '2-3 months',
        salaryRange: '$60k-$90k',
        growthOutlook: 'high',
        learningResources: []
      },
      {
        role: 'Frontend Developer',
        matchScore: 70,
        reasons: [
          'Focus on user-facing features',
          'Creative and technical balance',
          'Growing demand for modern frameworks'
        ],
        requiredSkills: ['HTML/CSS', 'JavaScript', 'React', 'UI/UX', 'Responsive Design'],
        currentSkillGaps: ['State Management', 'Performance Optimization', 'Accessibility'],
        estimatedTimeToReady: '3-4 months',
        salaryRange: '$70k-$100k',
        growthOutlook: 'high',
        learningResources: []
      },
      {
        role: 'Data Analyst',
        matchScore: 65,
        reasons: [
          'Strong analytical skills',
          'High demand across industries',
          'Clear path to data science'
        ],
        requiredSkills: ['SQL', 'Excel', 'Data Visualization', 'Statistics', 'Python/R'],
        currentSkillGaps: ['Advanced Analytics', 'Machine Learning', 'Big Data'],
        estimatedTimeToReady: '4-6 months',
        salaryRange: '$65k-$95k',
        growthOutlook: 'high',
        learningResources: []
      }
    ];
  }
}

export const careerRecommendationService = new CareerRecommendationService();
