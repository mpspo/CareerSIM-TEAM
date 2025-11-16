# Supabase Schema Migration Guide

## Overview

This schema extends your Supabase database with tables for:
- ✅ Interview Simulator (personas, questions, sessions, feedback)
- ✅ Career Advisory (profiles, assessments, action plans)
- ✅ RAG System (vector embeddings for semantic search)

## Prerequisites

- Supabase project set up
- PostgreSQL with `vector` extension enabled
- Admin access to Supabase SQL Editor

## Installation Steps

### 1. Enable Required Extensions

In your Supabase SQL Editor, run:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
```

### 2. Run the Schema Migration

Copy the entire contents of `supabase-schema.sql` and execute it in your Supabase SQL Editor.

**OR** use the Supabase CLI:

```bash
supabase db push
```

### 3. Verify Tables Created

Check that all tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Expected tables:
- `personas`
- `interview_questions`
- `interview_sessions`
- `feedback`
- `career_profiles`
- `career_assessments`
- `action_plans`
- `user_profiles`
- `vector_embeddings`

### 4. Verify Sample Data

Check if sample personas were inserted:

```sql
SELECT name, type, role FROM personas;
```

You should see:
- Sarah Chen (Friendly, Startup)
- Dr. Michael Hoffmann (Critical, Corporate)
- Lisa Weber (Neutral, HR)

## Schema Details

### Core Interview Tables

#### `personas`
Stores interview personas with behavior patterns.
- **Key fields**: name, type, role, behavior_traits, difficulty_level
- **Use case**: Select persona for interview session

#### `interview_questions`
Question bank with metadata for intelligent selection.
- **Key fields**: question_text, category, difficulty, tags
- **Use case**: Build dynamic question sets

#### `interview_sessions`
Complete interview data with career integration.
- **Key fields**: user_id, responses, strengths, weaknesses, overall_score
- **Use case**: Store and analyze interview performance

#### `feedback`
Detailed feedback for each interview response.
- **Key fields**: star_analysis, feedback_text, scores, training_plan
- **Use case**: Provide immediate and final feedback

### Career Advisory Tables

#### `career_profiles`
Aggregated career data from all interviews.
- **Key fields**: strengths, weaknesses, role_recommendations, total_interviews
- **Use case**: Track career progress over time

#### `career_assessments`
Point-in-time career assessments.
- **Key fields**: assessment_type, role_recommendations, skill_recommendations
- **Use case**: Generate career recommendations

#### `action_plans`
Personalized career action plans.
- **Key fields**: steps, milestones, progress_percentage
- **Use case**: Track user's career development journey

### Supporting Tables

#### `user_profiles`
Extended user data beyond Supabase auth.
- **Key fields**: education, target_companies, cv_url, token_balance
- **Use case**: Store user context for personalization

#### `vector_embeddings`
Embeddings for semantic search (RAG).
- **Key fields**: content_type, content, embedding (1536 dimensions)
- **Use case**: Semantic search for company data, job descriptions

## Row Level Security (RLS)

All tables have RLS enabled with policies:
- ✅ Users can only access their own data
- ✅ Public read access for personas and questions
- ✅ Authenticated users can read embeddings
- ✅ Admin-only write access for personas/questions

## Views

### `user_dashboard`
Combines user profile, career profile, and recommendations.

```sql
SELECT * FROM user_dashboard WHERE user_id = 'your-user-id';
```

### `interview_history`
Shows completed interviews with scores and personas.

```sql
SELECT * FROM interview_history WHERE user_id = 'your-user-id';
```

## Next Steps

### 1. Populate Question Bank

Add interview questions to `interview_questions` table:

```sql
INSERT INTO interview_questions (question_text, category, difficulty, industry, tags)
VALUES 
  ('Beschreibe eine Situation, in der du im Team ein Problem gelöst hast.', 'behavioral', 3, 'Technology', ARRAY['teamwork', 'problem-solving']),
  ('Wie würdest du ein System mit 1 Million Nutzern skalieren?', 'technical', 4, 'Technology', ARRAY['scalability', 'architecture']);
```

### 2. Create Career Profile on First Login

In your backend (server/routes/auth.ts), after successful registration:

```typescript
// Create user profile
await supabase.from('user_profiles').insert({
  id: user.id,
  email: user.email,
  full_name: req.body.full_name,
  studiengang: req.body.study,
  target_companies: req.body.target ? [req.body.target] : []
});

// Create empty career profile
await supabase.from('career_profiles').insert({
  user_id: user.id,
  strengths: [],
  weaknesses: []
});
```

### 3. Update Interview Session After Completion

When an interview is completed, save results:

```typescript
await supabase
  .from('interview_sessions')
  .update({
    status: 'completed',
    completed_at: new Date().toISOString(),
    strengths: extractedStrengths,
    weaknesses: extractedWeaknesses,
    overall_score: calculatedScore,
    summary: aiGeneratedSummary
  })
  .eq('id', sessionId);
```

### 4. Generate Career Assessment

After each interview, update career profile:

```typescript
import { careerAdvisoryService } from '@/services/career/CareerAdvisoryService';

const assessment = await careerAdvisoryService.generateAssessment(userId);

await supabase.from('career_assessments').insert({
  user_id: userId,
  assessment_type: 'interview_based',
  interview_session_ids: [sessionId],
  strengths: assessment.strengths,
  weaknesses: assessment.weaknesses,
  role_recommendations: assessment.roleRecommendations,
  skill_recommendations: assessment.skillRecommendations,
  education_recommendations: assessment.educationRecommendations
});
```

## Migration Rollback

If you need to remove the schema:

```sql
-- WARNING: This will delete all data!

DROP VIEW IF EXISTS user_dashboard CASCADE;
DROP VIEW IF EXISTS interview_history CASCADE;

DROP TABLE IF EXISTS vector_embeddings CASCADE;
DROP TABLE IF EXISTS action_plans CASCADE;
DROP TABLE IF EXISTS career_assessments CASCADE;
DROP TABLE IF EXISTS career_profiles CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS interview_sessions CASCADE;
DROP TABLE IF EXISTS interview_questions CASCADE;
DROP TABLE IF EXISTS personas CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

## Troubleshooting

### Error: extension "vector" does not exist

Enable the pgvector extension in your Supabase project:
1. Go to Database → Extensions
2. Enable "vector"
3. Retry schema migration

### Error: permission denied

Make sure you're using the service role key, not the anon key:
```typescript
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Not SUPABASE_ANON_KEY
);
```

### Error: RLS prevents access

If you can't access data, check RLS policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'interview_sessions';
```

Temporarily disable RLS for testing (NOT for production):
```sql
ALTER TABLE interview_sessions DISABLE ROW LEVEL SECURITY;
```

## Performance Optimization

### Add Indexes for Your Query Patterns

```sql
-- If you frequently query by company
CREATE INDEX idx_sessions_company ON interview_sessions((config->>'company'));

-- If you frequently query by date range
CREATE INDEX idx_sessions_date_range ON interview_sessions(started_at, completed_at);
```

### Optimize Vector Search

For better vector search performance:
```sql
-- Adjust ivfflat parameters
CREATE INDEX idx_embeddings_vector ON vector_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100); -- Adjust based on data size
```

## Support

For issues or questions:
- Check ARCHITECTURE.md for system design
- See INTEGRATION_README.md for API integration
- Review TypeScript types in `src/types/`

---

**Status**: Schema ready for Phase 1 ✅  
**Next**: Phase 2 - RAG Integration & Realtime API
