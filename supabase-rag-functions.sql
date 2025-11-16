-- ============================================================================
-- Vector Similarity Search Function for RAG
-- This function performs cosine similarity search on embeddings
-- ============================================================================

-- Function to match documents based on embedding similarity
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  content_type_filter text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content_type varchar(50),
  content_id varchar(255),
  title varchar(500),
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    vector_embeddings.id,
    vector_embeddings.content_type,
    vector_embeddings.content_id,
    vector_embeddings.title,
    vector_embeddings.content,
    vector_embeddings.metadata,
    1 - (vector_embeddings.embedding <=> query_embedding) AS similarity
  FROM vector_embeddings
  WHERE 
    (content_type_filter IS NULL OR vector_embeddings.content_type = content_type_filter)
    AND 1 - (vector_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY vector_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION match_documents TO authenticated;

-- ============================================================================
-- Sample Company Data for RAG (Optional - for testing)
-- ============================================================================

-- Insert sample company data
INSERT INTO vector_embeddings (content_type, content_id, title, content, metadata)
VALUES
(
  'company',
  'google',
  'Google - Company Profile',
  'Google LLC is an American multinational technology company focusing on artificial intelligence, online advertising, search engine technology, cloud computing, computer software, quantum computing, e-commerce, and consumer electronics. Known for its innovative culture, Google values creativity, collaboration, and a data-driven approach. The company offers competitive benefits, encourages 20% time for personal projects, and maintains a casual work environment. Interview process typically includes: 1) Phone screen with recruiter, 2) Technical phone interview, 3) On-site interviews (4-5 rounds), 4) Hiring committee review. Google looks for candidates with strong problem-solving skills, leadership potential, and passion for technology.',
  '{"industry": "Technology", "size": "Large", "headquarters": "Mountain View, CA", "founded": 1998}'::jsonb
),
(
  'company',
  'goldman-sachs',
  'Goldman Sachs - Company Profile',
  'The Goldman Sachs Group, Inc. is a leading global investment banking, securities, and investment management firm. Known for its rigorous culture and high standards, Goldman Sachs values excellence, integrity, and client service. The firm attracts top talent from around the world and offers extensive training programs. Work environment is fast-paced and demanding, with emphasis on analytical thinking and teamwork. Interview process includes: 1) Online application and HireVue interview, 2) Super Day (multiple back-to-back interviews), 3) Final round with senior leadership. Candidates should demonstrate strong quantitative skills, commercial awareness, and cultural fit.',
  '{"industry": "Finance", "size": "Large", "headquarters": "New York, NY", "founded": 1869}'::jsonb
),
(
  'role',
  'software-engineer',
  'Software Engineer - Role Description',
  'Software Engineers design, develop, test, and maintain software applications and systems. Key responsibilities include: writing clean, maintainable code; collaborating with cross-functional teams; participating in code reviews; debugging and troubleshooting issues; contributing to technical documentation. Required skills: proficiency in programming languages (Python, Java, JavaScript, etc.); understanding of data structures and algorithms; experience with version control (Git); problem-solving abilities; communication skills. Ideal candidate has a degree in Computer Science or related field, 2-5 years of experience, and passion for learning new technologies.',
  '{"department": "Engineering", "level": "Mid-level", "type": "Technical"}'::jsonb
),
(
  'role',
  'product-manager',
  'Product Manager - Role Description',
  'Product Managers define product vision, strategy, and roadmap while working closely with engineering, design, and business teams. Key responsibilities include: gathering and prioritizing requirements; defining product specifications; analyzing market trends and competition; working with stakeholders to ensure product success; making data-driven decisions. Required skills: strategic thinking; communication and leadership; analytical abilities; user empathy; technical understanding. Ideal candidate has 3-7 years of experience in product management or related role, strong track record of shipping successful products, and ability to influence without authority.',
  '{"department": "Product", "level": "Mid-Senior", "type": "Business"}'::jsonb
)
ON CONFLICT DO NOTHING;

-- Note: Embeddings need to be generated and added separately using the RAGService
-- Run: node scripts/generate-embeddings.js (to be created)

-- ============================================================================
-- Utility: View documents without embeddings (for debugging)
-- ============================================================================

CREATE OR REPLACE VIEW documents_summary AS
SELECT 
  id,
  content_type,
  content_id,
  title,
  LEFT(content, 100) || '...' AS content_preview,
  metadata,
  created_at
FROM vector_embeddings
ORDER BY created_at DESC;

-- Grant select on view
GRANT SELECT ON documents_summary TO authenticated;
