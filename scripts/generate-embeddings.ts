#!/usr/bin/env tsx

/**
 * Generate embeddings for documents in Supabase vector store
 * Run: npm run embeddings:generate
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });
  return response.data[0].embedding;
}

async function processDocuments() {
  console.log('🚀 Starting embedding generation...\n');

  // Fetch documents without embeddings
  const { data: documents, error } = await supabase
    .from('vector_embeddings')
    .select('*')
    .is('embedding', null);

  if (error) {
    console.error('❌ Error fetching documents:', error);
    return;
  }

  if (!documents || documents.length === 0) {
    console.log('✅ All documents already have embeddings!');
    return;
  }

  console.log(`📄 Found ${documents.length} documents without embeddings\n`);

  let processed = 0;
  let failed = 0;

  for (const doc of documents) {
    try {
      console.log(`Processing: ${doc.title}...`);

      // Generate embedding
      const embedding = await generateEmbedding(doc.content);

      // Update document with embedding
      const { error: updateError } = await supabase
        .from('vector_embeddings')
        .update({ embedding: `[${embedding.join(',')}]` })
        .eq('id', doc.id);

      if (updateError) {
        console.error(`  ❌ Failed to update: ${updateError.message}`);
        failed++;
      } else {
        console.log(`  ✅ Embedded successfully`);
        processed++;
      }

      // Rate limiting: wait 200ms between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error: any) {
      console.error(`  ❌ Error: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  ✅ Processed: ${processed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`\n🎉 Done!`);
}

// Run the script
processDocuments().catch(console.error);
