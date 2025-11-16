require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const OpenAI = require('openai');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

const DB_PATH = path.join(__dirname, 'db.json');

// Initialize Supabase (optional - falls später migrieren willst)
const supabase = process.env.SUPABASE_URL ? createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
) : null;

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX allowed.'));
    }
  }
});

// Initialize OpenAI with API key from environment
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

function readDb() {
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function findUser(db, username) {
  return db.users.find(u => u.username === username);
}

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve static frontend
app.use('/', express.static(path.join(__dirname, 'public')));

// Register
app.post('/api/register', (req, res) => {
  const { username, password, study, target } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const db = readDb();
  if (findUser(db, username)) return res.status(400).json({ error: 'user exists' });
  const hashed = bcrypt.hashSync(password, 8);
  const user = { id: uuidv4(), username, password: hashed, study: study || '', target: target || '' };
  db.users.push(user);
  writeDb(db);
  return res.json({ ok: true });
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const db = readDb();
  const user = findUser(db, username);
  if (!user) return res.status(400).json({ error: 'invalid credentials' });
  const match = bcrypt.compareSync(password, user.password);
  if (!match) return res.status(400).json({ error: 'invalid credentials' });
  const token = uuidv4();
  db.sessions[token] = { username: user.username, created: Date.now() };
  writeDb(db);
  return res.json({ token, username: user.username, study: user.study, target: user.target });
});

function requireToken(req, res, next) {
  const token = req.headers['authorization'] || req.headers['x-auth-token'] || req.body.token || req.query.token;
  if (!token) return res.status(401).json({ error: 'no token' });
  const db = readDb();
  const sess = db.sessions[token];
  if (!sess) return res.status(401).json({ error: 'invalid token' });
  req.session = sess;
  req.db = db;
  req.token = token;
  next();
}

// Start interview
app.post('/api/interview/start', requireToken, (req, res) => {
  const { username } = req.session;
  const db = readDb();
  const user = findUser(db, username);
  // Simple question flow depending on study/target
  const questions = generateQuestions(user.study, user.target);
  const interviewId = uuidv4();
  db.interviews[interviewId] = { username, questions, index: 0, history: [] };
  writeDb(db);
  return res.json({ interviewId, question: questions[0] });
});

// Respond to interview
app.post('/api/interview/respond', requireToken, (req, res) => {
  const { interviewId, answer } = req.body || {};
  if (!interviewId) return res.status(400).json({ error: 'interviewId required' });
  const db = readDb();
  const interview = db.interviews[interviewId];
  if (!interview) return res.status(404).json({ error: 'interview not found' });
  // Save answer
  interview.history.push({ question: interview.questions[interview.index], answer, time: Date.now() });
  interview.index += 1;
  let next = null;
  let done = false;
  if (interview.index < interview.questions.length) {
    next = interview.questions[interview.index];
  } else {
    done = true;
  }
  writeDb(db);
  // Mock feedback (fallback)
  let feedback = generateFeedback(answer);

  // If OpenAI is configured, attempt to get richer feedback from OpenAI
  if (openai) {
    (async () => {
      try {
        const user = findUser(db, interview.username) || {};
        const systemPrompt = 'Du bist ein professioneller Interview-Coach. Gib präzises, konstruktives Feedback zur Antwort des Kandidaten. Antworte auf Deutsch und nutze die STAR-Methode (Situation, Task, Action, Result) zur Bewertung.';
        
        const userPrompt = `Studiengang: ${user.study || 'Nicht angegeben'}
Zielunternehmen: ${user.target || 'Nicht angegeben'}
Interviewfrage: "${interview.history[interview.history.length-1].question}"
Kandidatenantwort: "${answer}"

Bitte gib:
1. Kurzes Feedback (2-3 Sätze) zur Qualität der Antwort
2. Einen konkreten Verbesserungsvorschlag
3. Optional: Eine passende Folgefrage (mit "NÄCHSTE_FRAGE:" markiert)`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 500,
          temperature: 0.7
        });

        const aiResponse = completion.choices[0]?.message?.content;
        if (aiResponse && aiResponse.trim().length > 0) {
          feedback = aiResponse.trim();
          // If assistant included a line starting with NÄCHSTE_FRAGE:, use it to override next question
          const match = feedback.match(/NÄCHSTE_FRAGE:\s*(.+)/i);
          if (match && match[1]) {
            next = match[1].trim();
          }
        }
      } catch (err) {
        console.error('OpenAI API Fehler:', err.message || err);
        // keep fallback feedback
      }
      // respond after OpenAI attempt
      return res.json({ nextQuestion: next, done, feedback });
    })();
    // exit early — response will be sent from async block
    return;
  }

  return res.json({ nextQuestion: next, done, feedback });
});

// Get user interview history and stats
app.get('/api/dashboard', requireToken, (req, res) => {
  const { username } = req.session;
  const db = readDb();
  
  // Find all completed interviews for this user
  const userInterviews = Object.entries(db.interviews)
    .filter(([id, interview]) => interview.username === username && interview.index >= interview.questions.length)
    .map(([id, interview]) => {
      // Calculate a simple score based on answer quality
      let score = 0;
      interview.history.forEach(item => {
        const answerLength = (item.answer || '').length;
        if (answerLength > 200) score += 25;
        else if (answerLength > 100) score += 18;
        else if (answerLength > 50) score += 12;
        else score += 5;
      });
      score = Math.min(100, score); // cap at 100
      
      const user = findUser(db, username);
      return {
        id,
        date: interview.history[0]?.time || Date.now(),
        company: user?.target || 'Unbekannt',
        questionsCount: interview.questions.length,
        score: Math.round(score),
        duration: Math.round((interview.history[interview.history.length - 1]?.time - interview.history[0]?.time) / 1000 / 60) || 0
      };
    })
    .sort((a, b) => b.date - a.date); // newest first

  const user = findUser(db, username);
  return res.json({
    username,
    study: user?.study || '',
    target: user?.target || '',
    interviews: userInterviews,
    stats: {
      totalInterviews: userInterviews.length,
      averageScore: userInterviews.length > 0 
        ? Math.round(userInterviews.reduce((sum, i) => sum + i.score, 0) / userInterviews.length)
        : 0
    }
  });
});

// Helper: simple question generator
function generateQuestions(study, target) {
  const base = [
    'Erzähle mir etwas über dich und deinen Studienhintergrund.',
    'Warum interessierst du dich für dieses Praktikum bei ' + (target || 'dem Unternehmen') + '?',
    'Nenne eine Situation, in der du im Team ein Problem gelöst hast.',
    'Wie gehst du mit Stress und engen Deadlines um?'
  ];
  if (study && study.toLowerCase().includes('wirtschaft')) {
    base.splice(2, 0, 'Beschreibe eine betriebswirtschaftliche Analyse, die du durchgeführt hast.');
  }
  if (target && /goldman|jp morgan|dax|big four/i.test(target)) {
    base.push('Wie beurteilst du aktuelle Trends in der Finanzbranche und ihre Bedeutung für ' + target + '?');
  }
  return base;
}

function generateFeedback(answer) {
  if (!answer) return 'Versuche, strukturierter zu antworten: Situation, Aufgabe, Aktion, Ergebnis.';
  const a = answer.toLowerCase();
  if (a.length < 50) return 'Zu kurz: gib mehr konkrete Beispiele und Zahlen, falls möglich.';
  if (a.includes('team') || a.includes('wir')) return 'Gute Teamorientierung sichtbar — nenne eine konkrete Rolle, die du hattest.';
  if (a.includes('ich') && a.includes('verantwort')) return 'Stark: du übernimmst Verantwortung. Erwähne ein konkretes Ergebnis.';
  return 'Gut strukturiert. Füge konkrete Zahlen oder Resultate zur Stärkung deiner Antwort hinzu.';
}

// Simple health
app.get('/api/ping', (req, res) => res.json({ ok: true }));

// Career Advice Chat Endpoint
app.post('/api/career-advice', requireToken, async (req, res) => {
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message required' });

  const { username } = req.session;
  const db = readDb();
  const user = findUser(db, username);

  // Fallback response if OpenAI is not configured
  if (!openai) {
    const fallbackResponse = generateCareerAdviceFallback(message);
    return res.json({ response: fallbackResponse });
  }

  try {
    const systemPrompt = `Du bist ein professioneller KI-Karriereberater mit Expertise in:
- Karriereplanung und -entwicklung
- Bewerbungsprozesse und CV-Optimierung
- Stärken-Schwächen-Analyse
- Berufseinstieg für Studierende und Absolventen
- Branchenspezifische Karrierewege

Antworte freundlich, professionell und konkret. Gib praktische, umsetzbare Ratschläge.`;

    const userContext = `Nutzer: ${username}
Studiengang: ${user?.study || 'Nicht angegeben'}
Zielunternehmen: ${user?.target || 'Nicht angegeben'}

Frage: ${message}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContext }
      ],
      max_tokens: 800,
      temperature: 0.7
    });

    const aiResponse = completion.choices[0]?.message?.content || 'Entschuldigung, ich konnte keine Antwort generieren.';
    return res.json({ response: aiResponse.trim() });

  } catch (error) {
    console.error('OpenAI API Fehler (Career Advice):', error.message || error);
    const fallbackResponse = generateCareerAdviceFallback(message);
    return res.json({ response: fallbackResponse });
  }
});

// CV File Upload Endpoint
app.post('/api/cv-upload', requireToken, upload.single('cv'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { username } = req.session;

  try {
    // Read file content (simplified - in production, use proper PDF/DOC parsing)
    const fileContent = fs.readFileSync(req.file.path, 'utf-8');
    
    // Clean up uploaded file after reading
    fs.unlinkSync(req.file.path);

    // Analyze the CV using the rating endpoint logic
    return await analyzeCVContent(fileContent, username, res);

  } catch (error) {
    console.error('File processing error:', error);
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ error: 'Error processing file' });
  }
});

// CV Rating Endpoint (can accept text directly)
app.post('/api/cv-rating', requireToken, async (req, res) => {
  const { cvText } = req.body || {};
  if (!cvText) return res.status(400).json({ error: 'cvText required' });

  const { username } = req.session;
  return await analyzeCVContent(cvText, username, res);
});

// Helper function for CV analysis
async function analyzeCVContent(cvText, username, res) {

  // Fallback rating if OpenAI is not configured
  if (!openai) {
    const fallbackRating = generateCVRatingFallback(cvText);
    return res.json(fallbackRating);
  }

  try {
    const systemPrompt = `Du bist ein professioneller CV-Analyst. Analysiere Lebensläufe und bewerte sie in folgenden Kategorien (jeweils 0-100 Punkte):

1. Struktur & Format - Übersichtlichkeit, Layout, Formatierung
2. Inhalt & Relevanz - Qualität der Erfahrungen, Qualifikationen
3. Klarheit - Verständlichkeit, präzise Formulierungen
4. Professionalität - Sprache, Stil, Vollständigkeit

Gib eine strukturierte Bewertung mit:
- Scores für jede Kategorie
- Overall Score (Durchschnitt)
- Konkrete Stärken
- Verbesserungspotential
- Handlungsempfehlungen

Format: JSON mit: overallScore, structureScore, contentScore, clarityScore, professionalismScore, feedback (Array mit {type, title, text})`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Bitte analysiere diesen Lebenslauf:\n\n${cvText.substring(0, 3000)}` }
      ],
      max_tokens: 1000,
      temperature: 0.5
    });

    const aiResponse = completion.choices[0]?.message?.content;
    
    // Try to parse JSON response
    try {
      const parsed = JSON.parse(aiResponse);
      return res.json(parsed);
    } catch (parseError) {
      // If not JSON, create structured response from text
      return res.json({
        overallScore: 75,
        structureScore: 80,
        contentScore: 75,
        clarityScore: 78,
        professionalismScore: 70,
        feedback: [
          { type: '🤖', title: 'KI-Analyse', text: aiResponse }
        ]
      });
    }

  } catch (error) {
    console.error('OpenAI API Fehler (CV Rating):', error.message || error);
    const fallbackRating = generateCVRatingFallback(cvText);
    return res.json(fallbackRating);
  }
}

// Strength-Weakness Analysis Endpoint
app.post('/api/strength-analysis', requireToken, async (req, res) => {
  const { responses } = req.body || {};
  if (!responses) return res.status(400).json({ error: 'responses required' });

  const { username } = req.session;
  const db = readDb();
  const user = findUser(db, username);

  if (!openai) {
    return res.json({
      strengths: ['Teamfähigkeit', 'Analytisches Denken', 'Kommunikation'],
      weaknesses: ['Zeitmanagement', 'Delegation'],
      recommendations: ['Fokussiere dich auf strukturierte Arbeitsmethoden', 'Suche Mentoring für Leadership-Skills']
    });
  }

  try {
    const systemPrompt = `Du bist ein Karriere-Coach für Stärken-Schwächen-Analyse. 
Identifiziere basierend auf den Antworten des Nutzers:
- Top 3-5 Stärken
- 2-3 Entwicklungsbereiche
- Konkrete Empfehlungen zur Weiterentwicklung`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Nutzer: ${username}\nStudiengang: ${user?.study || 'N/A'}\n\nAntworten:\n${JSON.stringify(responses, null, 2)}` }
      ],
      max_tokens: 600,
      temperature: 0.7
    });

    const aiResponse = completion.choices[0]?.message?.content;
    return res.json({ analysis: aiResponse });

  } catch (error) {
    console.error('OpenAI API Fehler (Strength Analysis):', error.message || error);
    return res.json({
      analysis: 'Basierend auf deinen Antworten zeigst du gute analytische Fähigkeiten und Teamorientierung. Arbeite an deinem Zeitmanagement und der strukturierten Herangehensweise an komplexe Probleme.'
    });
  }
});

// Helper functions for fallback responses
function generateCareerAdviceFallback(message) {
  const msg = message.toLowerCase();
  
  if (msg.includes('cv') || msg.includes('lebenslauf')) {
    return 'Für einen starken CV empfehle ich: 1) Klare Struktur mit Überschriften, 2) Messbare Erfolge (z.B. "Umsatz um 20% gesteigert"), 3) Relevante Skills für die Zielposition hervorheben, 4) Maximal 2 Seiten, 5) Fehlerfreie Rechtschreibung und professionelles Layout.';
  }
  
  if (msg.includes('stärken') || msg.includes('schwächen')) {
    return 'Für die Stärken-Schwächen-Analyse: Nenne echte Stärken mit Beispielen (z.B. "Teamfähigkeit - habe erfolgreich ein 5-köpfiges Team geleitet"). Bei Schwächen zeige Selbstreflexion und Lernbereitschaft (z.B. "Zeitmanagement - arbeite mit Pomodoro-Technik daran").';
  }
  
  if (msg.includes('interview') || msg.includes('bewerbungsgespräch')) {
    return 'Tipps fürs Interview: 1) Bereite STAR-Antworten vor (Situation, Task, Action, Result), 2) Recherchiere das Unternehmen gründlich, 3) Bereite eigene Fragen vor, 4) Übe mit Mock-Interviews, 5) Sei authentisch und zeige Begeisterung für die Position.';
  }
  
  if (msg.includes('karriere') || msg.includes('beruf')) {
    return 'Für deine Karriereplanung: 1) Definiere klare Ziele (kurz- und langfristig), 2) Identifiziere benötigte Skills und schließe Lücken, 3) Netzwerke aktiv (LinkedIn, Events), 4) Sammle relevante Erfahrungen (Praktika, Projekte), 5) Bleibe flexibel und offen für Chancen.';
  }
  
  return 'Danke für deine Frage! Ich helfe dir gerne bei Karriereplanung, Bewerbungen, CV-Optimierung und Interview-Vorbereitung. Kannst du deine Frage etwas spezifischer formulieren?';
}

function generateCVRatingFallback(cvText) {
  const wordCount = cvText.split(/\s+/).length;
  const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(cvText);
  const hasPhone = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(cvText);
  const hasEducation = /bildung|ausbildung|studium|university|universität/i.test(cvText);
  const hasExperience = /erfahrung|praktikum|beruf|project|projekt/i.test(cvText);
  
  let structureScore = 70;
  let contentScore = 70;
  let clarityScore = 70;
  let professionalismScore = 70;
  
  if (wordCount > 300) contentScore += 10;
  if (hasEmail && hasPhone) structureScore += 15;
  if (hasEducation) contentScore += 10;
  if (hasExperience) contentScore += 10;
  
  const overallScore = Math.round((structureScore + contentScore + clarityScore + professionalismScore) / 4);
  
  return {
    overallScore,
    structureScore,
    contentScore,
    clarityScore,
    professionalismScore,
    feedback: [
      { type: '✅', title: 'Stärken', text: hasEmail && hasPhone ? 'Kontaktdaten vorhanden' : 'Grundstruktur erkennbar' },
      { type: '⚠️', title: 'Verbesserungspotential', text: wordCount < 200 ? 'CV ist zu kurz - füge mehr Details hinzu' : 'Füge messbare Erfolge hinzu' },
      { type: '💡', title: 'Empfehlungen', text: 'Verwende klare Überschriften, füge Zeitangaben hinzu und quantifiziere deine Erfolge (z.B. "Umsatz um 20% gesteigert")' }
    ]
  };
}

// Interview Analysis Endpoint
app.get('/api/interview/analyze', requireToken, async (req, res) => {
  const { id } = req.query;
  const { username } = req.session;
  
  if (!id) return res.status(400).json({ error: 'Interview ID required' });
  
  const db = readDb();
  const interview = db.interviews[id];
  
  if (!interview) return res.status(404).json({ error: 'Interview not found' });
  if (interview.username !== username) return res.status(403).json({ error: 'Unauthorized' });
  
  try {
    // Generate analysis with OpenAI if available
    let analysis;
    if (openai) {
      const user = findUser(db, username) || {};
      const historyText = interview.history.map((h, i) => 
        `Frage ${i + 1}: ${h.question}\nAntwort: ${h.answer}`
      ).join('\n\n');
      
      const systemPrompt = `Du bist ein erfahrener Interview-Coach und HR-Experte. Analysiere das folgende Interview-Transkript und gib detailliertes Feedback.

Bewerte in folgenden Kategorien (Skala 0-100):
1. Domänenwissen / Fachliche Kompetenz
2. Körpersprache / Auftreten (basierend auf Antwortqualität)
3. Sprechgeschwindigkeit / Klarheit (basierend auf Formulierung)
4. Antwortstruktur (STAR-Methode, Logik)

Gib auch:
- 3-5 konkrete Stärken
- 3-5 konkrete Verbesserungsvorschläge
- Ein Gesamt-Feedback (2-3 Sätze)

Formatiere deine Antwort als JSON.`;

      const userPrompt = `Kandidat: ${user.study || 'Nicht angegeben'}
Zielposition: ${user.target || 'Nicht angegeben'}

INTERVIEW-TRANSKRIPT:
${historyText}

Bitte analysiere und bewerte das Interview.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1500,
        temperature: 0.7
      });

      const aiResponse = completion.choices[0]?.message?.content;
      
      // Try to parse JSON response
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          analysis = {
            position: user.target || 'Software Engineer',
            industry: 'Technologie',
            duration: Math.round((interview.history[interview.history.length - 1]?.time - interview.history[0]?.time) / 60000) || 45,
            date: new Date().toLocaleDateString('de-DE'),
            overallScore: parsed.overallScore || 85,
            overallFeedback: parsed.overallFeedback || 'Gute Leistung im Interview.',
            metrics: {
              knowledge: { 
                score: parsed.knowledge || 85, 
                description: parsed.knowledgeDesc || 'Gute fachliche Kenntnisse gezeigt.' 
              },
              body: { 
                score: parsed.body || 78, 
                description: parsed.bodyDesc || 'Selbstbewusstes Auftreten.' 
              },
              speaking: { 
                score: parsed.speaking || 82, 
                description: parsed.speakingDesc || 'Klare und verständliche Ausdrucksweise.' 
              },
              structure: { 
                score: parsed.structure || 90, 
                description: parsed.structureDesc || 'Gut strukturierte Antworten.' 
              }
            },
            strengths: parsed.strengths || [],
            improvements: parsed.improvements || []
          };
        } else {
          throw new Error('No JSON in response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        analysis = generateFallbackAnalysis(interview, user);
      }
    } else {
      analysis = generateFallbackAnalysis(interview, findUser(db, username) || {});
    }
    
    res.json(analysis);
  } catch (error) {
    console.error('Interview analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// User Statistics Endpoint
app.get('/api/user/stats', requireToken, (req, res) => {
  const { username } = req.session;
  const db = readDb();
  
  // Get all interviews for this user
  const userInterviews = Object.entries(db.interviews)
    .filter(([_, interview]) => interview.username === username)
    .map(([id, interview]) => ({
      id,
      company: 'TechCorp', // Mock data
      date: interview.history[interview.history.length - 1]?.time || Date.now(),
      duration: Math.round((interview.history[interview.history.length - 1]?.time - interview.history[0]?.time) / 60000) || 45,
      questionsCount: interview.questions.length,
      score: Math.floor(Math.random() * 30) + 70 // Mock score 70-100
    }))
    .sort((a, b) => b.date - a.date);
  
  const totalInterviews = userInterviews.length;
  const averageScore = totalInterviews > 0 
    ? Math.round(userInterviews.reduce((sum, i) => sum + i.score, 0) / totalInterviews)
    : 0;
  
  res.json({
    totalInterviews,
    averageScore,
    interviews: userInterviews
  });
});

function generateFallbackAnalysis(interview, user) {
  const answerLengths = interview.history.map(h => h.answer?.length || 0);
  const avgLength = answerLengths.reduce((a, b) => a + b, 0) / answerLengths.length;
  
  const overallScore = Math.min(100, Math.floor(50 + avgLength / 10));
  
  return {
    position: user.target || 'Software Engineer',
    industry: 'Technologie',
    duration: Math.round((interview.history[interview.history.length - 1]?.time - interview.history[0]?.time) / 60000) || 45,
    date: new Date().toLocaleDateString('de-DE'),
    overallScore,
    overallFeedback: 'Du hast in diesem Interview solide abgeschnitten. Deine Antworten zeigen Engagement und Vorbereitung.',
    metrics: {
      knowledge: { 
        score: Math.min(100, overallScore + 5), 
        description: 'Deine fachlichen Kenntnisse waren erkennbar. Mehr konkrete Beispiele würden deine Antworten stärken.' 
      },
      body: { 
        score: Math.max(60, overallScore - 7), 
        description: 'Dein Auftreten wirkte überwiegend selbstbewusst. Achte auf eine offene Körperhaltung.' 
      },
      speaking: { 
        score: Math.min(100, overallScore + 2), 
        description: 'Deine Ausdrucksweise war klar. Bei komplexen Themen ruhig etwas langsamer sprechen.' 
      },
      structure: { 
        score: Math.min(100, overallScore + 10), 
        description: 'Deine Antworten waren strukturiert. Die STAR-Methode hilft, noch präziser zu werden.' 
      }
    },
    strengths: [
      'Engagement und Motivation erkennbar',
      'Angemessene Antwortlängen',
      'Versuch, strukturiert zu antworten',
      'Fachliches Interesse deutlich'
    ],
    improvements: [
      'Mehr konkrete Beispiele aus der Praxis einbauen',
      'STAR-Methode konsequenter anwenden',
      'Bei komplexen Fragen mehr Zeit zum Nachdenken nehmen',
      'Eigene Fragen zum Unternehmen vorbereiten'
    ]
  };
}

// OpenAI Realtime API Session Token Endpoint - NO AUTH REQUIRED FOR TESTING
app.post('/api/realtime/session', async (req, res) => {
  console.log('Realtime session request received');
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key not configured');
    return res.status(503).json({ error: 'OpenAI API key not configured' });
  }

  try {
    console.log('Returning API key for Realtime connection');
    // Return the API key for client-side use (in production, use ephemeral tokens)
    return res.json({
      apiKey: process.env.OPENAI_API_KEY
    });
  } catch (error) {
    console.error('Realtime session error:', error);
    return res.status(500).json({ error: 'Failed to create Realtime session', details: error.message });
  }
});

// ============================================
// INTERVIEW HISTORY API
// ============================================

// Save interview to history
app.post('/api/interviews', async (req, res) => {
  try {
    const interviewData = req.body;
    
    // Add unique ID and timestamp
    interviewData.id = Date.now();
    interviewData.savedAt = new Date().toISOString();
    
    // Option 1: Supabase (wenn konfiguriert)
    if (supabase) {
      console.log('💾 Saving to Supabase...');
      
      // Prepare data for Supabase
      const supabaseData = {
        user_id: interviewData.userId === 'guest' ? null : interviewData.userId,
        company: interviewData.company,
        company_id: interviewData.companyId || null,
        industry: interviewData.industry || null,
        duration: interviewData.duration || 0,
        completed_phases: interviewData.completedPhases || 0,
        scores: interviewData.scores || {},
        ai_feedback: interviewData.aiFeedback || '',
        transcript: interviewData.transcript || null,
        config: interviewData.config || {}
      };
      
      console.log('📤 Sending to Supabase:', supabaseData);
      
      const { data, error } = await supabase
        .from('interviews')
        .insert(supabaseData)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      console.log('✅ Interview saved to Supabase:', data.id);
      return res.json({
        success: true,
        id: data.id,
        message: 'Interview erfolgreich in Supabase gespeichert',
        storage: 'supabase'
      });
    }
    
    // Option 2: Fallback zu db.json (wenn Supabase nicht konfiguriert)
    console.log('💾 Saving to db.json (Supabase not configured)...');
    const db = readDb();
    
    // Initialize interviews array if it doesn't exist
    if (!db.interviews) {
      db.interviews = [];
    }
    
    // Add to beginning of array
    db.interviews.unshift(interviewData);
    
    // Keep only last 100 interviews per user
    if (interviewData.userId) {
      const userInterviews = db.interviews.filter(i => i.userId === interviewData.userId);
      if (userInterviews.length > 100) {
        // Remove oldest interviews
        const toRemove = userInterviews.slice(100);
        db.interviews = db.interviews.filter(i => !toRemove.includes(i));
      }
    }
    
    writeDb(db);
    
    console.log('✅ Interview gespeichert:', {
      id: interviewData.id,
      company: interviewData.company,
      score: interviewData.scores?.overall
    });
    
    return res.json({
      success: true,
      id: interviewData.id,
      message: 'Interview erfolgreich gespeichert'
    });
  } catch (error) {
    console.error('❌ Fehler beim Speichern des Interviews:', error);
    return res.status(500).json({
      success: false,
      error: 'Fehler beim Speichern'
    });
  }
});

// Get interview history for a user
app.get('/api/interviews/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Option 1: Supabase (wenn konfiguriert)
    if (supabase) {
      console.log(`📊 Loading from Supabase for user: ${userId}`);
      
      let query = supabase
        .from('interviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      // Filter by user if not guest
      if (userId !== 'guest') {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      console.log(`✅ ${data.length} interviews loaded from Supabase`);
      return res.json({ 
        interviews: data,
        storage: 'supabase'
      });
    }
    
    // Option 2: Fallback zu db.json
    console.log(`📊 Loading from db.json for user: ${userId}`);
    const db = readDb();
    
    if (!db.interviews) {
      return res.json({ interviews: [] });
    }
    
    // Filter interviews by userId or return all if userId is 'guest'
    const interviews = userId === 'guest' 
      ? db.interviews.filter(i => !i.userId || i.userId === 'guest').slice(0, 20)
      : db.interviews.filter(i => i.userId === userId);
    
    console.log(`📊 ${interviews.length} Interviews abgerufen für User: ${userId}`);
    
    return res.json({ interviews });
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Interviews:', error);
    return res.status(500).json({
      success: false,
      error: 'Fehler beim Abrufen'
    });
  }
});

// Get single interview by ID
app.get('/api/interviews/detail/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    
    if (!db.interviews) {
      return res.status(404).json({ error: 'Interview nicht gefunden' });
    }
    
    const interview = db.interviews.find(i => i.id === parseInt(id));
    
    if (!interview) {
      return res.status(404).json({ error: 'Interview nicht gefunden' });
    }
    
    return res.json({ interview });
  } catch (error) {
    console.error('❌ Fehler beim Abrufen des Interviews:', error);
    return res.status(500).json({ error: 'Fehler beim Abrufen' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 CareerSIM Server läuft auf http://localhost:${PORT}`);
  console.log(`📡 OpenAI Integration: ${openai ? '✅ Aktiviert' : '❌ Nicht konfiguriert'}`);
  console.log(`🎤 Realtime API: ${openai ? '✅ Bereit' : '❌ Nicht verfügbar'}`);
  console.log(`💾 Datenbank: ${supabase ? '✅ Supabase verbunden' : '⚠️  db.json (lokal)'}`);
  console.log(`📊 Interview-Historie: ✅ Aktiviert`);
});
