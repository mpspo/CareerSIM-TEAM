/**
 * Achievement & Gamification Service
 * Tracks user progress, unlocks achievements, and manages badges
 */

import { supabase } from '../clients/SupabaseClient';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'interview' | 'skill' | 'streak' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  requirement: {
    type: 'interview_count' | 'score_average' | 'streak_days' | 'skill_mastery' | 'perfect_score' | 'voice_mode';
    target: number;
  };
  unlockedAt?: Date;
  progress?: number; // 0-100
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  level: number; // 1-5 (Bronze, Silver, Gold, Platinum, Diamond)
  earnedAt: Date;
}

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: number; // Current level (0-5)
  maxLevel: number; // Usually 5
  xp: number; // Experience points in current level
  xpToNextLevel: number;
  prerequisites: string[]; // Other skill IDs required
  isUnlocked: boolean;
  benefits: string[]; // What this skill improves
}

export interface UserProgress {
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalInterviews: number;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  achievements: Achievement[];
  badges: Badge[];
  skillTree: SkillNode[];
  rank: string; // e.g., "Novice", "Intermediate", "Expert"
  percentile: number; // Top X% of users
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  level: number;
  points: number;
  rank: number;
  badges: Badge[];
}

class AchievementService {
  /**
   * Define all possible achievements
   */
  private getAllAchievements(): Achievement[] {
    return [
      // Interview Count Achievements
      {
        id: 'first_interview',
        title: 'Erste Schritte',
        description: 'Absolviere dein erstes Mock-Interview',
        icon: '🎯',
        category: 'interview',
        rarity: 'common',
        points: 50,
        requirement: { type: 'interview_count', target: 1 }
      },
      {
        id: 'interview_veteran',
        title: 'Interview-Veteran',
        description: 'Absolviere 10 Mock-Interviews',
        icon: '🏆',
        category: 'interview',
        rarity: 'rare',
        points: 200,
        requirement: { type: 'interview_count', target: 10 }
      },
      {
        id: 'interview_master',
        title: 'Interview-Meister',
        description: 'Absolviere 50 Mock-Interviews',
        icon: '👑',
        category: 'interview',
        rarity: 'epic',
        points: 500,
        requirement: { type: 'interview_count', target: 50 }
      },
      {
        id: 'interview_legend',
        title: 'Interview-Legende',
        description: 'Absolviere 100 Mock-Interviews',
        icon: '⭐',
        category: 'interview',
        rarity: 'legendary',
        points: 1000,
        requirement: { type: 'interview_count', target: 100 }
      },

      // Score Achievements
      {
        id: 'rising_star',
        title: 'Aufsteigender Stern',
        description: 'Erreiche einen Durchschnittsscore von 70',
        icon: '✨',
        category: 'skill',
        rarity: 'common',
        points: 100,
        requirement: { type: 'score_average', target: 70 }
      },
      {
        id: 'high_performer',
        title: 'Top-Performer',
        description: 'Erreiche einen Durchschnittsscore von 85',
        icon: '🌟',
        category: 'skill',
        rarity: 'rare',
        points: 300,
        requirement: { type: 'score_average', target: 85 }
      },
      {
        id: 'perfect_score',
        title: 'Perfekte Leistung',
        description: 'Erreiche 100 Punkte in einem Interview',
        icon: '💯',
        category: 'skill',
        rarity: 'epic',
        points: 500,
        requirement: { type: 'perfect_score', target: 100 }
      },

      // Streak Achievements
      {
        id: 'consistent_learner',
        title: 'Konsequenter Lerner',
        description: 'Übe 7 Tage in Folge',
        icon: '🔥',
        category: 'streak',
        rarity: 'rare',
        points: 250,
        requirement: { type: 'streak_days', target: 7 }
      },
      {
        id: 'dedication_master',
        title: 'Meister der Hingabe',
        description: 'Übe 30 Tage in Folge',
        icon: '⚡',
        category: 'streak',
        rarity: 'epic',
        points: 750,
        requirement: { type: 'streak_days', target: 30 }
      },

      // Voice Mode Achievements
      {
        id: 'voice_pioneer',
        title: 'Voice-Mode-Pionier',
        description: 'Absolviere 5 Interviews im Voice-Modus',
        icon: '🎤',
        category: 'special',
        rarity: 'rare',
        points: 300,
        requirement: { type: 'voice_mode', target: 5 }
      },
      {
        id: 'smooth_talker',
        title: 'Rhetorisches Talent',
        description: 'Erreiche einen Voice-Score von 90+',
        icon: '🗣️',
        category: 'special',
        rarity: 'epic',
        points: 600,
        requirement: { type: 'skill_mastery', target: 90 }
      }
    ];
  }

  /**
   * Get user's progress including achievements, badges, and skill tree
   */
  async getUserProgress(userId: string): Promise<UserProgress> {
    try {
      // Fetch user's interview sessions
      const { data: sessions, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (error) throw error;

      const totalInterviews = sessions?.length || 0;
      const avgScore = sessions?.length 
        ? sessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / sessions.length
        : 0;

      // Calculate XP and level
      const xpPerInterview = 100;
      const totalXP = totalInterviews * xpPerInterview + Math.round(avgScore * 10);
      const level = Math.floor(totalXP / 1000) + 1;
      const currentLevelXP = totalXP % 1000;
      const xpToNextLevel = 1000 - currentLevelXP;

      // Calculate streak
      const { currentStreak, longestStreak } = this.calculateStreak(sessions || []);

      // Check achievements
      const allAchievements = this.getAllAchievements();
      const achievements = this.checkAchievements(allAchievements, {
        totalInterviews,
        avgScore,
        currentStreak,
        sessions: sessions || []
      });

      // Calculate total points from unlocked achievements
      const totalPoints = achievements
        .filter(a => a.unlockedAt)
        .reduce((sum, a) => sum + a.points, 0);

      // Generate badges based on achievements
      const badges = this.generateBadges(achievements);

      // Build skill tree
      const skillTree = this.buildSkillTree(sessions || []);

      // Determine rank
      const rank = this.getRank(level, avgScore);

      // Mock percentile (in production, query database)
      const percentile = Math.max(5, Math.min(99, 100 - level * 5));

      return {
        level,
        xp: totalXP,
        xpToNextLevel,
        totalInterviews,
        totalPoints,
        currentStreak,
        longestStreak,
        achievements,
        badges,
        skillTree,
        rank,
        percentile
      };
    } catch (error) {
      console.error('Error getting user progress:', error);
      return this.getDefaultProgress();
    }
  }

  /**
   * Calculate current and longest streak
   */
  private calculateStreak(sessions: any[]): { currentStreak: number; longestStreak: number } {
    if (sessions.length === 0) return { currentStreak: 0, longestStreak: 0 };

    // Sort by date
    const sorted = [...sessions].sort((a, b) => 
      new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;
    let lastDate = new Date(sorted[0].completed_at);

    // Check if most recent is today or yesterday
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 1) {
      currentStreak = 1;
    }

    // Calculate streaks
    for (let i = 1; i < sorted.length; i++) {
      const currentDate = new Date(sorted[i].completed_at);
      const diff = Math.floor((lastDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diff === 1) {
        tempStreak++;
        if (i === 1 || currentStreak > 0) {
          currentStreak++;
        }
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
        if (i === 1) {
          currentStreak = 0;
        }
      }

      lastDate = currentDate;
    }

    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    return { currentStreak, longestStreak };
  }

  /**
   * Check which achievements are unlocked
   */
  private checkAchievements(
    achievements: Achievement[],
    stats: {
      totalInterviews: number;
      avgScore: number;
      currentStreak: number;
      sessions: any[];
    }
  ): Achievement[] {
    return achievements.map(achievement => {
      let isUnlocked = false;
      let progress = 0;

      switch (achievement.requirement.type) {
        case 'interview_count':
          progress = Math.min(100, (stats.totalInterviews / achievement.requirement.target) * 100);
          isUnlocked = stats.totalInterviews >= achievement.requirement.target;
          break;

        case 'score_average':
          progress = Math.min(100, (stats.avgScore / achievement.requirement.target) * 100);
          isUnlocked = stats.avgScore >= achievement.requirement.target;
          break;

        case 'streak_days':
          progress = Math.min(100, (stats.currentStreak / achievement.requirement.target) * 100);
          isUnlocked = stats.currentStreak >= achievement.requirement.target;
          break;

        case 'perfect_score':
          const hasPerfectScore = stats.sessions.some(s => s.overall_score >= 100);
          progress = hasPerfectScore ? 100 : 0;
          isUnlocked = hasPerfectScore;
          break;

        case 'voice_mode':
          // Would check voice mode sessions
          progress = 0;
          isUnlocked = false;
          break;

        case 'skill_mastery':
          progress = Math.min(100, (stats.avgScore / achievement.requirement.target) * 100);
          isUnlocked = stats.avgScore >= achievement.requirement.target;
          break;
      }

      return {
        ...achievement,
        unlockedAt: isUnlocked ? new Date() : undefined,
        progress: Math.round(progress)
      };
    });
  }

  /**
   * Generate badges from achievements
   */
  private generateBadges(achievements: Achievement[]): Badge[] {
    const badges: Badge[] = [];

    // Interview badges
    const interviewCount = achievements.find(a => a.id === 'interview_legend' && a.unlockedAt) ? 5 :
                          achievements.find(a => a.id === 'interview_master' && a.unlockedAt) ? 4 :
                          achievements.find(a => a.id === 'interview_veteran' && a.unlockedAt) ? 3 :
                          achievements.find(a => a.id === 'first_interview' && a.unlockedAt) ? 1 : 0;

    if (interviewCount > 0) {
      badges.push({
        id: 'interview_badge',
        name: 'Interview Master',
        icon: '🎯',
        level: interviewCount,
        earnedAt: new Date()
      });
    }

    // Performance badge
    const perfBadge = achievements.find(a => a.id === 'perfect_score' && a.unlockedAt) ? 3 :
                      achievements.find(a => a.id === 'high_performer' && a.unlockedAt) ? 2 :
                      achievements.find(a => a.id === 'rising_star' && a.unlockedAt) ? 1 : 0;

    if (perfBadge > 0) {
      badges.push({
        id: 'performance_badge',
        name: 'High Achiever',
        icon: '⭐',
        level: perfBadge,
        earnedAt: new Date()
      });
    }

    // Streak badge
    const streakBadge = achievements.find(a => a.id === 'dedication_master' && a.unlockedAt) ? 2 :
                       achievements.find(a => a.id === 'consistent_learner' && a.unlockedAt) ? 1 : 0;

    if (streakBadge > 0) {
      badges.push({
        id: 'streak_badge',
        name: 'Dedication',
        icon: '🔥',
        level: streakBadge,
        earnedAt: new Date()
      });
    }

    return badges;
  }

  /**
   * Build skill tree based on performance
   */
  private buildSkillTree(sessions: any[]): SkillNode[] {
    const avgMetrics = this.calculateAverageMetrics(sessions);

    return [
      {
        id: 'communication',
        name: 'Kommunikation',
        description: 'Klare und effektive Kommunikation',
        icon: '💬',
        level: Math.floor(avgMetrics.communication / 20),
        maxLevel: 5,
        xp: avgMetrics.communication % 20,
        xpToNextLevel: 20,
        prerequisites: [],
        isUnlocked: true,
        benefits: ['Bessere Antwortstruktur', 'Klarere Ausdrucksweise']
      },
      {
        id: 'knowledge',
        name: 'Fachwissen',
        description: 'Technische und fachliche Kompetenz',
        icon: '🧠',
        level: Math.floor(avgMetrics.knowledge / 20),
        maxLevel: 5,
        xp: avgMetrics.knowledge % 20,
        xpToNextLevel: 20,
        prerequisites: [],
        isUnlocked: true,
        benefits: ['Tiefere technische Antworten', 'Mehr Selbstvertrauen']
      },
      {
        id: 'confidence',
        name: 'Selbstbewusstsein',
        description: 'Selbstsicheres Auftreten',
        icon: '💪',
        level: Math.floor(avgMetrics.confidence / 20),
        maxLevel: 5,
        xp: avgMetrics.confidence % 20,
        xpToNextLevel: 20,
        prerequisites: [],
        isUnlocked: true,
        benefits: ['Weniger Nervosität', 'Bessere Performance']
      },
      {
        id: 'structure',
        name: 'Struktur',
        description: 'STAR-Methode und strukturierte Antworten',
        icon: '📋',
        level: Math.floor(avgMetrics.structure / 20),
        maxLevel: 5,
        xp: avgMetrics.structure % 20,
        xpToNextLevel: 20,
        prerequisites: ['communication'],
        isUnlocked: avgMetrics.communication >= 40,
        benefits: ['STAR-Methode', 'Bessere Storytelling']
      },
      {
        id: 'behavioral',
        name: 'Behavioral Questions',
        description: 'Meisterung von Verhaltensfragen',
        icon: '🎭',
        level: Math.floor((avgMetrics.communication + avgMetrics.structure) / 40),
        maxLevel: 5,
        xp: ((avgMetrics.communication + avgMetrics.structure) / 2) % 20,
        xpToNextLevel: 20,
        prerequisites: ['communication', 'structure'],
        isUnlocked: avgMetrics.structure >= 40,
        benefits: ['Bessere STAR-Stories', 'Authentische Antworten']
      },
      {
        id: 'technical',
        name: 'Technical Deep Dive',
        description: 'Tiefe technische Diskussionen',
        icon: '⚙️',
        level: Math.floor(avgMetrics.knowledge / 20),
        maxLevel: 5,
        xp: avgMetrics.knowledge % 20,
        xpToNextLevel: 20,
        prerequisites: ['knowledge'],
        isUnlocked: avgMetrics.knowledge >= 60,
        benefits: ['System Design', 'Algorithmen', 'Best Practices']
      }
    ];
  }

  /**
   * Calculate average metrics from sessions
   */
  private calculateAverageMetrics(sessions: any[]): {
    communication: number;
    knowledge: number;
    confidence: number;
    structure: number;
  } {
    if (sessions.length === 0) {
      return { communication: 0, knowledge: 0, confidence: 0, structure: 0 };
    }

    const totals = sessions.reduce((acc, session) => {
      const metrics = session.metrics || {};
      return {
        communication: acc.communication + (metrics.communication || 0),
        knowledge: acc.knowledge + (metrics.knowledge || 0),
        confidence: acc.confidence + (metrics.confidence || 0),
        structure: acc.structure + (metrics.structure || 0)
      };
    }, { communication: 0, knowledge: 0, confidence: 0, structure: 0 });

    return {
      communication: Math.round(totals.communication / sessions.length),
      knowledge: Math.round(totals.knowledge / sessions.length),
      confidence: Math.round(totals.confidence / sessions.length),
      structure: Math.round(totals.structure / sessions.length)
    };
  }

  /**
   * Get rank based on level and score
   */
  private getRank(level: number, avgScore: number): string {
    if (level >= 20 && avgScore >= 85) return 'Grandmaster';
    if (level >= 15 && avgScore >= 80) return 'Master';
    if (level >= 10 && avgScore >= 75) return 'Expert';
    if (level >= 5 && avgScore >= 70) return 'Advanced';
    if (level >= 3 && avgScore >= 60) return 'Intermediate';
    return 'Novice';
  }

  /**
   * Get default progress for new users
   */
  private getDefaultProgress(): UserProgress {
    return {
      level: 1,
      xp: 0,
      xpToNextLevel: 1000,
      totalInterviews: 0,
      totalPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      achievements: this.getAllAchievements().map(a => ({ ...a, progress: 0 })),
      badges: [],
      skillTree: this.buildSkillTree([]),
      rank: 'Novice',
      percentile: 100
    };
  }

  /**
   * Get leaderboard (mock implementation)
   */
  async getLeaderboard(_limit: number = 10): Promise<LeaderboardEntry[]> {
    // In production, this would query the database
    // For now, return mock data
    return [
      {
        userId: '1',
        username: 'InterviewPro',
        level: 25,
        points: 5000,
        rank: 1,
        badges: [
          { id: 'interview_badge', name: 'Interview Master', icon: '🎯', level: 5, earnedAt: new Date() },
          { id: 'performance_badge', name: 'High Achiever', icon: '⭐', level: 3, earnedAt: new Date() }
        ]
      },
      {
        userId: '2',
        username: 'TechGuru',
        level: 22,
        points: 4500,
        rank: 2,
        badges: [
          { id: 'interview_badge', name: 'Interview Master', icon: '🎯', level: 4, earnedAt: new Date() }
        ]
      },
      // Add more mock entries...
    ];
  }
}

export const achievementService = new AchievementService();
