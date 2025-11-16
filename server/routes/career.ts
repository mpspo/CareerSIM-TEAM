import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import { requireToken } from '../middleware/auth';
import { readDb, findUser } from '../utils/database';
import { openAIService } from '../services/OpenAIService';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX allowed.'));
    }
  },
});

// Career Advice Chat
router.post('/advice', requireToken, async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'message required' });
  }

  const { username } = req.session!;
  const db = readDb();
  const user = findUser(db, username);

  const response = await openAIService.getCareerAdvice(message, {
    username,
    study: user?.study,
    target: user?.target,
  });

  return res.json({ response });
});

// CV Upload
router.post('/cv-upload', requireToken, upload.single('cv'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // Read file content
    const fileContent = fs.readFileSync(req.file.path, 'utf-8');

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    // Analyze CV
    const analysis = await openAIService.analyzCV(fileContent);

    return res.json(analysis);
  } catch (error) {
    console.error('File processing error:', error);

    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({ error: 'Error processing file' });
  }
});

// CV Rating (text-based)
router.post('/cv-rating', requireToken, async (req, res) => {
  const { cvText } = req.body;

  if (!cvText) {
    return res.status(400).json({ error: 'cvText required' });
  }

  const analysis = await openAIService.analyzCV(cvText);

  return res.json(analysis);
});

// Strength-Weakness Analysis
router.post('/strength-analysis', requireToken, async (req, res) => {
  const { responses } = req.body;

  if (!responses) {
    return res.status(400).json({ error: 'responses required' });
  }

  const { username } = req.session!;
  const db = readDb();
  const user = findUser(db, username);

  if (!openAIService.isAvailable()) {
    return res.json({
      strengths: ['Teamfähigkeit', 'Analytisches Denken', 'Kommunikation'],
      weaknesses: ['Zeitmanagement', 'Delegation'],
      recommendations: [
        'Fokussiere dich auf strukturierte Arbeitsmethoden',
        'Suche Mentoring für Leadership-Skills',
      ],
    });
  }

  const systemPrompt = `Du bist ein Karriere-Coach für Stärken-Schwächen-Analyse. 
Identifiziere basierend auf den Antworten des Nutzers:
- Top 3-5 Stärken
- 2-3 Entwicklungsbereiche
- Konkrete Empfehlungen zur Weiterentwicklung`;

  const userPrompt = `Nutzer: ${username}\nStudiengang: ${user?.study || 'N/A'}\n\nAntworten:\n${JSON.stringify(responses, null, 2)}`;

  const analysis = await openAIService.getChatCompletion(systemPrompt, userPrompt, {
    maxTokens: 600,
  });

  if (analysis) {
    return res.json({ analysis });
  }

  return res.json({
    analysis:
      'Basierend auf deinen Antworten zeigst du gute analytische Fähigkeiten und Teamorientierung. Arbeite an deinem Zeitmanagement und der strukturierten Herangehensweise an komplexe Probleme.',
  });
});

export default router;
