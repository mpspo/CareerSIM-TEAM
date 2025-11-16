-- ============================================================================
-- CareerSIM Supabase Database Schema Extensions
-- Phase 1: Foundation Tables for Interview Simulator + Career Advisory
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector"; -- For RAG embeddings (Phase 2+)

-- ============================================================================
-- 1. PERSONAS TABLE
-- Stores interview personas with characteristics and behavior patterns
-- ============================================================================
CREATE TABLE IF NOT EXISTS personas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'friendly', 'neutral', 'critical', 'technical', 'hr'
  role VARCHAR(255) NOT NULL, -- e.g., 'Senior Software Engineer', 'HR Manager'
  company_type VARCHAR(100), -- e.g., 'Startup', 'Corporate', 'Consulting'
  industry VARCHAR(100), -- e.g., 'Technology', 'Finance', 'Healthcare'
  description TEXT,
  behavior_traits JSONB, -- { "interruption_frequency": 0.2, "follow_up_intensity": 0.8 }
  sample_questions TEXT[], -- Array of typical questions this persona asks
  communication_style JSONB, -- { "formality": "high", "tone": "professional" }
  difficulty_level INTEGER DEFAULT 3 CHECK (difficulty_level BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster persona queries
CREATE INDEX idx_personas_type ON personas(type);
CREATE INDEX idx_personas_industry ON personas(industry);
CREATE INDEX idx_personas_difficulty ON personas(difficulty_level);

-- ============================================================================
-- 2. INTERVIEW_QUESTIONS TABLE
-- Stores question bank with metadata for intelligent question selection
-- ============================================================================
CREATE TABLE IF NOT EXISTS interview_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_text TEXT NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'behavioral', 'technical', 'case', 'situational'
  difficulty INTEGER DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
  industry VARCHAR(100),
  role VARCHAR(255),
  tags TEXT[], -- ['teamwork', 'leadership', 'problem-solving']
  follow_up_questions TEXT[], -- Potential follow-up questions
  ideal_answer_structure TEXT, -- STAR method guidance
  evaluation_criteria JSONB, -- Criteria for answer evaluation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for question filtering
CREATE INDEX idx_questions_category ON interview_questions(category);
CREATE INDEX idx_questions_difficulty ON interview_questions(difficulty);
CREATE INDEX idx_questions_industry ON interview_questions(industry);
CREATE INDEX idx_questions_tags ON interview_questions USING GIN(tags);

-- ============================================================================
-- 3. INTERVIEW_SESSIONS TABLE (Enhanced from db.json)
-- Stores complete interview session data with career integration
-- ============================================================================
CREATE TABLE IF NOT EXISTS interview_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  persona_id UUID REFERENCES personas(id),
  config JSONB NOT NULL, -- { "duration": 30, "difficulty": 3, "focus_areas": [] }
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  
  -- Session metadata
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  
  -- Questions and responses
  questions JSONB NOT NULL DEFAULT '[]', -- Array of question IDs
  responses JSONB NOT NULL DEFAULT '[]', -- Array of { question_id, answer, timestamp }
  
  -- Career integration fields
  summary TEXT, -- AI-generated interview summary
  strengths TEXT[], -- Identified strengths from this interview
  weaknesses TEXT[], -- Areas for improvement
  overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
  
  -- Metrics
  metrics JSONB, -- { "knowledge": 85, "communication": 78, "structure": 90 }
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for session queries
CREATE INDEX idx_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX idx_sessions_status ON interview_sessions(status);
CREATE INDEX idx_sessions_started_at ON interview_sessions(started_at);
CREATE INDEX idx_sessions_completed_at ON interview_sessions(completed_at);

-- ============================================================================
-- 4. FEEDBACK TABLE
-- Stores detailed feedback for each interview response
-- ============================================================================
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES interview_questions(id),
  response_index INTEGER NOT NULL, -- Index in the responses array
  
  -- STAR Analysis
  star_analysis JSONB, -- { "situation": 8, "task": 7, "action": 9, "result": 6 }
  
  -- Feedback content
  feedback_type VARCHAR(50) NOT NULL, -- 'immediate', 'final', 'follow_up'
  feedback_text TEXT NOT NULL,
  strengths TEXT[],
  improvements TEXT[],
  
  -- Scores
  content_score INTEGER CHECK (content_score BETWEEN 0 AND 100),
  clarity_score INTEGER CHECK (clarity_score BETWEEN 0 AND 100),
  relevance_score INTEGER CHECK (relevance_score BETWEEN 0 AND 100),
  
  -- Training recommendations
  training_plan JSONB, -- Specific exercises or resources
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for feedback queries
CREATE INDEX idx_feedback_session_id ON feedback(session_id);
CREATE INDEX idx_feedback_question_id ON feedback(question_id);
CREATE INDEX idx_feedback_type ON feedback(feedback_type);

-- ============================================================================
-- 5. CAREER_PROFILES TABLE (NEW - for Career Advisory)
-- Stores aggregated career data from all interview sessions
-- ============================================================================
CREATE TABLE IF NOT EXISTS career_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Aggregated strengths and weaknesses
  strengths JSONB NOT NULL DEFAULT '[]', -- Array of { category, score, evidence[], count }
  weaknesses JSONB NOT NULL DEFAULT '[]', -- Array of { category, score, improvement_actions[], count }
  
  -- Current state
  current_skills TEXT[],
  target_roles TEXT[],
  target_industries TEXT[],
  career_goals TEXT,
  
  -- Progress tracking
  total_interviews INTEGER DEFAULT 0,
  average_score NUMERIC(5,2),
  improvement_trend JSONB, -- { "dates": [], "scores": [] }
  
  -- Recommendations (cached)
  role_recommendations JSONB, -- Array of recommended roles with match scores
  skill_recommendations JSONB, -- Skills to develop
  education_recommendations JSONB, -- Programs/certifications
  
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX idx_career_profiles_user_id ON career_profiles(user_id);

-- ============================================================================
-- 6. CAREER_ASSESSMENTS TABLE
-- Stores point-in-time career assessments
-- ============================================================================
CREATE TABLE IF NOT EXISTS career_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES career_profiles(id) ON DELETE CASCADE,
  
  -- Assessment data
  assessment_type VARCHAR(50) NOT NULL, -- 'interview_based', 'manual', 'periodic'
  interview_session_ids UUID[], -- References to interview_sessions
  
  -- Results
  strengths JSONB NOT NULL,
  weaknesses JSONB NOT NULL,
  role_recommendations JSONB NOT NULL,
  skill_recommendations JSONB NOT NULL,
  education_recommendations JSONB NOT NULL,
  
  -- Context
  user_context JSONB, -- User profile snapshot at assessment time
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for assessment queries
CREATE INDEX idx_assessments_user_id ON career_assessments(user_id);
CREATE INDEX idx_assessments_profile_id ON career_assessments(profile_id);
CREATE INDEX idx_assessments_created_at ON career_assessments(created_at);

-- ============================================================================
-- 7. ACTION_PLANS TABLE
-- Stores personalized career action plans
-- ============================================================================
CREATE TABLE IF NOT EXISTS action_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES career_assessments(id) ON DELETE SET NULL,
  
  -- Plan details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  timeline VARCHAR(50), -- '3_months', '6_months', '1_year'
  
  -- Steps
  steps JSONB NOT NULL, -- Array of { id, title, description, status, target_date, resources }
  milestones JSONB, -- Array of { title, target_date, criteria, achieved }
  
  -- Progress
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'paused', 'cancelled'
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for action plan queries
CREATE INDEX idx_action_plans_user_id ON action_plans(user_id);
CREATE INDEX idx_action_plans_status ON action_plans(status);
CREATE INDEX idx_action_plans_assessment_id ON action_plans(assessment_id);

-- ============================================================================
-- 8. VECTOR_EMBEDDINGS TABLE (For RAG - Phase 2+)
-- Stores embeddings for semantic search of company data, job descriptions, etc.
-- ============================================================================
CREATE TABLE IF NOT EXISTS vector_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type VARCHAR(50) NOT NULL, -- 'company', 'role', 'job_description', 'skill'
  content_id VARCHAR(255), -- External ID reference
  
  -- Content
  title VARCHAR(500),
  content TEXT NOT NULL,
  metadata JSONB, -- Additional context (company name, industry, etc.)
  
  -- Vector embedding (OpenAI text-embedding-ada-002 produces 1536 dimensions)
  embedding vector(1536),
  
  -- Source tracking
  source VARCHAR(255),
  source_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for vector similarity search
CREATE INDEX idx_embeddings_vector ON vector_embeddings USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_embeddings_content_type ON vector_embeddings(content_type);
CREATE INDEX idx_embeddings_metadata ON vector_embeddings USING GIN(metadata);

-- ============================================================================
-- 9. USER_PROFILES TABLE (Extended from auth.users)
-- Stores additional user data beyond Supabase auth
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic info
  full_name VARCHAR(255),
  email VARCHAR(255) NOT NULL UNIQUE,
  
  -- Education
  university VARCHAR(255),
  studiengang VARCHAR(255),
  semester INTEGER,
  abschlussjahr INTEGER,
  degree VARCHAR(100), -- 'Bachelor', 'Master', 'PhD'
  
  -- Career
  target_companies TEXT[],
  target_roles TEXT[],
  interests TEXT[],
  career_goals TEXT,
  
  -- CV
  cv_url TEXT, -- Supabase Storage URL
  cv_uploaded_at TIMESTAMP WITH TIME ZONE,
  
  -- Settings
  preferred_language VARCHAR(10) DEFAULT 'de',
  notification_preferences JSONB,
  
  -- Tokens (for tracking)
  token_balance INTEGER DEFAULT 5000,
  tokens_used INTEGER DEFAULT 0,
  subscription_tier VARCHAR(50) DEFAULT 'free', -- 'free', 'pro', 'enterprise'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user profile lookups
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_subscription ON user_profiles(subscription_tier);

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_personas_updated_at BEFORE UPDATE ON personas
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON interview_questions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON interview_sessions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON career_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON action_plans
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_embeddings_updated_at BEFORE UPDATE ON vector_embeddings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vector_embeddings ENABLE ROW LEVEL SECURITY;

-- Personas: Public read, admin write
CREATE POLICY "Personas are viewable by everyone"
  ON personas FOR SELECT
  USING (true);

-- Interview Questions: Public read, admin write
CREATE POLICY "Questions are viewable by everyone"
  ON interview_questions FOR SELECT
  USING (true);

-- Interview Sessions: Users can only access their own
CREATE POLICY "Users can view own sessions"
  ON interview_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON interview_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON interview_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Feedback: Users can view feedback for their sessions
CREATE POLICY "Users can view own feedback"
  ON feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM interview_sessions
      WHERE interview_sessions.id = feedback.session_id
      AND interview_sessions.user_id = auth.uid()
    )
  );

-- Career Profiles: Users can only access their own
CREATE POLICY "Users can view own career profile"
  ON career_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own career profile"
  ON career_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own career profile"
  ON career_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Career Assessments: Users can only access their own
CREATE POLICY "Users can view own assessments"
  ON career_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessments"
  ON career_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Action Plans: Users can only access their own
CREATE POLICY "Users can view own action plans"
  ON action_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own action plans"
  ON action_plans FOR ALL
  USING (auth.uid() = user_id);

-- User Profiles: Users can only access their own
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Vector Embeddings: Public read (for RAG)
CREATE POLICY "Embeddings are viewable by authenticated users"
  ON vector_embeddings FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- SEED DATA: Sample Personas (Optional)
-- ============================================================================

INSERT INTO personas (name, type, role, company_type, industry, description, behavior_traits, sample_questions, difficulty_level)
VALUES
  (
    'Sarah Chen',
    'friendly',
    'Senior Software Engineer',
    'Startup',
    'Technology',
    'A friendly and encouraging interviewer who focuses on problem-solving approach and teamwork.',
    '{"interruption_frequency": 0.1, "follow_up_intensity": 0.6, "encouragement_level": 0.9}',
    ARRAY[
      'Tell me about a time you solved a challenging technical problem.',
      'How do you handle code reviews?',
      'Describe your ideal development environment.'
    ],
    2
  ),
  (
    'Dr. Michael Hoffmann',
    'critical',
    'VP of Engineering',
    'Corporate',
    'Finance',
    'A detail-oriented and critical interviewer who demands precise, well-structured answers.',
    '{"interruption_frequency": 0.4, "follow_up_intensity": 0.9, "pressure_level": 0.8}',
    ARRAY[
      'Walk me through the architecture of your most complex project.',
      'How do you ensure code quality at scale?',
      'What trade-offs did you make in your recent decisions?'
    ],
    5
  ),
  (
    'Lisa Weber',
    'neutral',
    'HR Business Partner',
    'Corporate',
    'Consulting',
    'A professional HR interviewer focused on cultural fit and behavioral questions.',
    '{"interruption_frequency": 0.2, "follow_up_intensity": 0.7, "formality": 0.8}',
    ARRAY[
      'Why are you interested in our company?',
      'Tell me about a time you had a conflict with a colleague.',
      'Where do you see yourself in 5 years?'
    ],
    3
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: User Dashboard Data
CREATE OR REPLACE VIEW user_dashboard AS
SELECT 
  u.id as user_id,
  u.email,
  up.full_name,
  up.studiengang,
  up.target_companies,
  cp.total_interviews,
  cp.average_score,
  cp.strengths,
  cp.weaknesses,
  cp.role_recommendations
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN career_profiles cp ON u.id = cp.user_id;

-- View: Interview History with Scores
CREATE OR REPLACE VIEW interview_history AS
SELECT 
  s.id,
  s.user_id,
  s.started_at,
  s.completed_at,
  s.duration_minutes,
  s.overall_score,
  s.status,
  p.name as persona_name,
  p.role as persona_role,
  s.strengths,
  s.weaknesses
FROM interview_sessions s
LEFT JOIN personas p ON s.persona_id = p.id
WHERE s.status = 'completed'
ORDER BY s.completed_at DESC;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
