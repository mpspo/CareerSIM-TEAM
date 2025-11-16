import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth';
import interviewRoutes from './routes/interview';
import careerRoutes from './routes/career';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use('/', express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api', authRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/career', careerRoutes);

// Health check
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 CareerSIM Server (TypeScript)                        ║
║                                                            ║
║   Server running on: http://localhost:${PORT}               ║
║   API Endpoints:                                           ║
║     - POST /api/register                                   ║
║     - POST /api/login                                      ║
║     - POST /api/interview/start                            ║
║     - POST /api/interview/respond                          ║
║     - GET  /api/interview/dashboard                        ║
║     - GET  /api/interview/analyze                          ║
║     - POST /api/career/advice                              ║
║     - POST /api/career/cv-upload                           ║
║     - POST /api/career/cv-rating                           ║
║     - POST /api/career/strength-analysis                   ║
║     - GET  /api/ping                                       ║
║                                                            ║
║   Frontend: http://localhost:5173 (Vite Dev Server)       ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);

  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  Warning: OPENAI_API_KEY not set. Using fallback responses.');
  } else {
    console.log('✅ OpenAI API configured');
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.warn('⚠️  Warning: Supabase not configured. Using local db.json');
  } else {
    console.log('✅ Supabase configured');
  }
});

export default app;
