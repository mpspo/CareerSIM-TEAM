// ============================================
// CAREER ADVISORY TYPES
// ============================================

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  education: Education;
  interests: string[]; // e.g., ["Consulting", "Tech", "Marketing"]
  preferredLanguages: ('de' | 'en')[];
  goals: string[]; // e.g., ["Traineeprogramm", "Master im Ausland"]
  cv_file_name?: string;
  cv_file_path?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Education {
  studiengang: string; // e.g., "Betriebswirtschaftslehre"
  uni: string; // e.g., "LMU München"
  abschlussjahr?: number; // e.g., 2025
  degree: 'Bachelor' | 'Master' | 'Diplom' | 'PhD' | 'other';
  currentSemester?: number;
}

export interface CareerProfile {
  id: string;
  userId: string;
  aggregatedStrengths: string[]; // from all interviews
  aggregatedWeaknesses: string[]; // from all interviews
  recommendedRoles: RoleRecommendation[];
  recommendedSkills: SkillRecommendation[];
  recommendedEducationOptions: EducationRecommendation[];
  lastUpdated: Date;
  interviewCount: number;
}

export interface RoleRecommendation {
  title: string; // e.g., "Junior Consultant"
  industry: string; // e.g., "Consulting", "Tech", "Finance"
  matchScore: number; // 0-100
  reasons: string[]; // why this role fits
  requiredSkills: string[];
  salaryRange?: string; // e.g., "45k-65k EUR"
  companies?: string[]; // example companies
}

export interface SkillRecommendation {
  name: string; // e.g., "Python", "Case Interview Skills"
  category: 'technical' | 'soft' | 'language' | 'business';
  currentLevel: 'none' | 'beginner' | 'intermediate' | 'advanced';
  targetLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  priority: 'high' | 'medium' | 'low';
  howToLearn: LearningResource[];
  estimatedTime: string; // e.g., "3 months"
}

export interface LearningResource {
  type: 'course' | 'bootcamp' | 'certification' | 'book' | 'project' | 'practice';
  title: string;
  provider?: string; // e.g., "Coursera", "Udacity"
  url?: string;
  cost?: string; // e.g., "Free", "49 EUR"
  duration?: string; // e.g., "6 weeks"
}

export interface EducationRecommendation {
  type: 'bachelor' | 'master' | 'mba' | 'bootcamp' | 'certification' | 'weiterbildung';
  title: string;
  institution: string;
  location: string;
  duration: string; // e.g., "2 years", "3 months"
  cost?: string;
  matchScore: number; // 0-100
  reasons: string[];
  applicationDeadline?: string;
  startDate?: string;
}

export interface CareerAssessment {
  id: string;
  userId: string;
  createdAt: Date;
  interviewSessionIds: string[]; // which interviews were used
  strengths: StrengthAssessment[];
  weaknesses: WeaknessAssessment[];
  roleMatches: RoleRecommendation[];
  skillGaps: SkillRecommendation[];
  actionPlan: ActionPlan;
}

export interface StrengthAssessment {
  category: 'communication' | 'technical' | 'problemSolving' | 'leadership' | 'motivation' | 'fit';
  score: number; // 0-100
  evidence: string[]; // examples from interviews
  applicableRoles: string[];
}

export interface WeaknessAssessment {
  category: 'communication' | 'technical' | 'problemSolving' | 'leadership' | 'motivation' | 'fit';
  score: number; // 0-100 (lower = more weakness)
  evidence: string[]; // examples from interviews
  improvementActions: string[];
}

export interface ActionPlan {
  timeline: '3_months' | '6_months' | '1_year';
  steps: ActionStep[];
  milestones: Milestone[];
}

export interface ActionStep {
  title: string;
  description: string;
  category: 'skill_development' | 'application' | 'networking' | 'education' | 'project';
  deadline?: string; // e.g., "2025-12-31"
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'completed';
  resources?: LearningResource[];
}

export interface Milestone {
  title: string;
  description: string;
  targetDate: string;
  achieved: boolean;
}

// ============================================
// CAREER DASHBOARD TYPES
// ============================================

export interface CareerDashboardData {
  profile: CareerProfile;
  recentAssessments: CareerAssessment[];
  topRoles: RoleRecommendation[];
  urgentSkills: SkillRecommendation[];
  upcomingDeadlines: EducationRecommendation[];
  progress: CareerProgress;
}

export interface CareerProgress {
  skillsAcquired: number;
  skillsTotal: number;
  applicationsSubmitted: number;
  interviewsCompleted: number;
  milestonesAchieved: number;
  milestonesTotal: number;
}

// ============================================
// EXPORTS
// ============================================

export type SkillCategory = SkillRecommendation['category'];
export type EducationType = EducationRecommendation['type'];
export type ActionCategory = ActionStep['category'];
