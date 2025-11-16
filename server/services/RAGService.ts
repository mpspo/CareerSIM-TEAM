import OpenAI from 'openai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface Document {
  id: string;
  contentType: 'company' | 'role' | 'job_description' | 'skill';
  title: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

interface SearchResult {
  document: Document;
  similarity: number;
  relevantExcerpt?: string;
}

interface CompanyContext {
  name: string;
  industry: string;
  culture: string;
  values: string[];
  recentNews?: string[];
  interviewProcess?: string;
}

interface RoleContext {
  title: string;
  department: string;
  requiredSkills: string[];
  responsibilities: string[];
  idealCandidate: string;
}

class RAGService {
  private openai: OpenAI | null = null;
  private supabase: SupabaseClient | null = null;
  private isInitialized = false;

  constructor() {
    // Initialize OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    // Initialize Supabase
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );
      this.isInitialized = true;
    } else {
      console.warn('⚠️  RAG Service: Supabase not configured. RAG features disabled.');
    }
  }

  /**
   * Check if RAG service is available
   */
  isAvailable(): boolean {
    return this.isInitialized && this.openai !== null && this.supabase !== null;
  }

  /**
   * Generate embedding for text using OpenAI
   */
  async generateEmbedding(text: string): Promise<number[] | null> {
    if (!this.openai) {
      console.warn('OpenAI not configured for embeddings');
      return null;
    }

    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      return null;
    }
  }

  /**
   * Add document to vector store
   */
  async addDocument(doc: Document): Promise<boolean> {
    if (!this.supabase) {
      console.warn('Supabase not configured');
      return false;
    }

    try {
      // Generate embedding if not provided
      let embedding = doc.embedding;
      if (!embedding) {
        embedding = await this.generateEmbedding(doc.content) || undefined;
      }

      // Insert into Supabase
      const { error } = await this.supabase.from('vector_embeddings').insert({
        content_type: doc.contentType,
        content_id: doc.id,
        title: doc.title,
        content: doc.content,
        metadata: doc.metadata,
        embedding: embedding ? `[${embedding.join(',')}]` : null,
      });

      if (error) {
        console.error('Error inserting document:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error adding document:', error);
      return false;
    }
  }

  /**
   * Semantic search for relevant documents
   */
  async search(
    query: string,
    options: {
      contentType?: string;
      limit?: number;
      threshold?: number;
    } = {}
  ): Promise<SearchResult[]> {
    if (!this.isAvailable()) {
      console.warn('RAG service not available');
      return [];
    }

    try {
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query);
      if (!queryEmbedding) {
        return [];
      }

      // Perform vector similarity search
      const { data, error } = await this.supabase!
        .rpc('match_documents', {
          query_embedding: queryEmbedding,
          match_threshold: options.threshold || 0.7,
          match_count: options.limit || 5,
          content_type_filter: options.contentType || null,
        });

      if (error) {
        console.error('Error searching documents:', error);
        return [];
      }

      // Map results to SearchResult format
      return (data || []).map((row: any) => ({
        document: {
          id: row.content_id,
          contentType: row.content_type,
          title: row.title,
          content: row.content,
          metadata: row.metadata,
        },
        similarity: row.similarity,
        relevantExcerpt: this.extractRelevantExcerpt(row.content, query),
      }));
    } catch (error) {
      console.error('Error in semantic search:', error);
      return [];
    }
  }

  /**
   * Get company context for interview preparation
   */
  async getCompanyContext(companyName: string): Promise<CompanyContext | null> {
    if (!this.isAvailable()) {
      return this.getMockCompanyContext(companyName);
    }

    try {
      const results = await this.search(`${companyName} company culture values interview process`, {
        contentType: 'company',
        limit: 3,
      });

      if (results.length === 0) {
        return this.getMockCompanyContext(companyName);
      }

      // Aggregate information from search results
      const combinedContext = results.map(r => r.document.content).join('\n\n');

      // Use OpenAI to structure the context
      if (this.openai) {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Extract structured company information from the text. Return JSON with: name, industry, culture, values (array), recentNews (array), interviewProcess.',
            },
            {
              role: 'user',
              content: `Company: ${companyName}\n\nContext:\n${combinedContext}`,
            },
          ],
          max_tokens: 800,
          temperature: 0.3,
        });

        const response = completion.choices[0]?.message?.content;
        if (response) {
          try {
            return JSON.parse(response);
          } catch {
            // Fallback if JSON parsing fails
          }
        }
      }

      return this.getMockCompanyContext(companyName);
    } catch (error) {
      console.error('Error getting company context:', error);
      return this.getMockCompanyContext(companyName);
    }
  }

  /**
   * Get role context for interview preparation
   */
  async getRoleContext(roleTitle: string, companyName?: string): Promise<RoleContext | null> {
    if (!this.isAvailable()) {
      return this.getMockRoleContext(roleTitle);
    }

    try {
      const query = companyName
        ? `${roleTitle} at ${companyName} job description responsibilities skills`
        : `${roleTitle} job description responsibilities skills`;

      const results = await this.search(query, {
        contentType: 'role',
        limit: 3,
      });

      if (results.length === 0) {
        return this.getMockRoleContext(roleTitle);
      }

      const combinedContext = results.map(r => r.document.content).join('\n\n');

      // Use OpenAI to structure the context
      if (this.openai) {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Extract structured role information. Return JSON with: title, department, requiredSkills (array), responsibilities (array), idealCandidate.',
            },
            {
              role: 'user',
              content: `Role: ${roleTitle}\n\nContext:\n${combinedContext}`,
            },
          ],
          max_tokens: 800,
          temperature: 0.3,
        });

        const response = completion.choices[0]?.message?.content;
        if (response) {
          try {
            return JSON.parse(response);
          } catch {
            // Fallback
          }
        }
      }

      return this.getMockRoleContext(roleTitle);
    } catch (error) {
      console.error('Error getting role context:', error);
      return this.getMockRoleContext(roleTitle);
    }
  }

  /**
   * Generate context-aware interview questions
   */
  async generateContextualQuestions(
    roleTitle: string,
    companyName: string,
    userBackground: {
      study?: string;
      experience?: string[];
    }
  ): Promise<string[]> {
    if (!this.openai) {
      return this.getFallbackQuestions(roleTitle);
    }

    try {
      // Get context from RAG
      const [companyContext, roleContext] = await Promise.all([
        this.getCompanyContext(companyName),
        this.getRoleContext(roleTitle, companyName),
      ]);

      // Generate questions using context
      const systemPrompt = `Du bist ein Experte für Bewerbungsgespräche. Erstelle 5-7 maßgeschneiderte Interviewfragen basierend auf:
- Unternehmen: ${companyName}
- Position: ${roleTitle}
- Kandidat Hintergrund: ${userBackground.study || 'N/A'}

Berücksichtige die Unternehmenskultur und spezifische Anforderungen der Rolle. Mix aus behavioral, technical und situational questions.`;

      const userPrompt = `Unternehmenskontext: ${JSON.stringify(companyContext, null, 2)}

Rollenkontext: ${JSON.stringify(roleContext, null, 2)}

Erstelle passende Interviewfragen für diese Kombination.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1000,
        temperature: 0.8,
      });

      const response = completion.choices[0]?.message?.content;
      if (response) {
        // Extract questions from response (assuming they're numbered or bulleted)
        const questions = response
          .split('\n')
          .filter(line => /^\d+[\.)]\s|^[-•]\s/.test(line.trim()))
          .map(line => line.replace(/^\d+[\.)]\s|^[-•]\s/, '').trim())
          .filter(q => q.length > 10);

        return questions.length > 0 ? questions : this.getFallbackQuestions(roleTitle);
      }

      return this.getFallbackQuestions(roleTitle);
    } catch (error) {
      console.error('Error generating contextual questions:', error);
      return this.getFallbackQuestions(roleTitle);
    }
  }

  /**
   * Extract relevant excerpt from content
   */
  private extractRelevantExcerpt(content: string, query: string, maxLength = 200): string {
    const queryWords = query.toLowerCase().split(/\s+/);
    const sentences = content.split(/[.!?]\s+/);

    // Find sentence with most query word matches
    let bestSentence = sentences[0] || '';
    let maxMatches = 0;

    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase();
      const matches = queryWords.filter(word => sentenceLower.includes(word)).length;

      if (matches > maxMatches) {
        maxMatches = matches;
        bestSentence = sentence;
      }
    }

    // Truncate if too long
    if (bestSentence.length > maxLength) {
      return bestSentence.substring(0, maxLength) + '...';
    }

    return bestSentence;
  }

  // Fallback methods for when RAG is not available

  private getMockCompanyContext(companyName: string): CompanyContext {
    return {
      name: companyName,
      industry: 'Technology',
      culture: 'Fast-paced, innovative, collaborative',
      values: ['Innovation', 'Integrity', 'Customer Focus', 'Teamwork'],
      recentNews: [`${companyName} announces new product line`, 'Company expands to new markets'],
      interviewProcess: 'Typically 3-4 rounds: HR screening, technical interview, team fit, final round',
    };
  }

  private getMockRoleContext(roleTitle: string): RoleContext {
    return {
      title: roleTitle,
      department: 'Engineering',
      requiredSkills: ['Problem-solving', 'Communication', 'Technical expertise', 'Teamwork'],
      responsibilities: [
        'Develop and maintain software solutions',
        'Collaborate with cross-functional teams',
        'Participate in code reviews',
        'Contribute to technical discussions',
      ],
      idealCandidate: 'Strong technical background with excellent communication skills and passion for innovation',
    };
  }

  private getFallbackQuestions(roleTitle: string): string[] {
    return [
      'Erzähle mir etwas über dich und deinen Hintergrund.',
      `Warum interessierst du dich für die Position als ${roleTitle}?`,
      'Beschreibe eine Situation, in der du ein komplexes Problem gelöst hast.',
      'Wie gehst du mit Feedback und Kritik um?',
      'Wo siehst du dich in 3-5 Jahren?',
    ];
  }
}

export const ragService = new RAGService();
