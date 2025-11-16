import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { requireToken } from '../middleware/auth';
import { readDb, writeDb, findUser } from '../utils/database';
import { openAIService } from '../services/OpenAIService';

const router = Router();

// Start interview
router.post('/start', requireToken, (req, res) => {
  const { username } = req.session!;
  const db = readDb();
  const user = findUser(db, username);

  const questions = generateQuestions(user?.study, user?.target);
  const interviewId = uuidv4();

  db.interviews[interviewId] = {
    username,
    questions,
    index: 0,
    history: [],
  };

  writeDb(db);

  return res.json({ interviewId, question: questions[0] });
});

// Respond to interview
router.post('/respond', requireToken, async (req, res) => {
  const { interviewId, answer } = req.body;

  if (!interviewId) {
    return res.status(400).json({ error: 'interviewId required' });
  }

  const db = readDb();
  const interview = db.interviews[interviewId];

  if (!interview) {
    return res.status(404).json({ error: 'interview not found' });
  }

  // Save answer
  interview.history.push({
    question: interview.questions[interview.index],
    answer,
    time: Date.now(),
  });

  interview.index += 1;

  let next: string | null = null;
  let done = false;

  if (interview.index < interview.questions.length) {
    next = interview.questions[interview.index];
  } else {
    done = true;
  }

  writeDb(db);

  // Get feedback from OpenAI
  const user = findUser(db, interview.username);
  const feedback = await openAIService.getInterviewFeedback(
    interview.history[interview.history.length - 1].question,
    answer,
    {
      study: user?.study,
      target: user?.target,
    }
  );

  // Check if feedback contains a follow-up question
  const match = feedback.match(/NÄCHSTE_FRAGE:\s*(.+)/i);
  if (match && match[1]) {
    next = match[1].trim();
  }

  return res.json({ nextQuestion: next, done, feedback });
});

// Get user interview history
router.get('/dashboard', requireToken, (req, res) => {
  const { username } = req.session!;
  const db = readDb();

  const userInterviews = Object.entries(db.interviews)
    .filter(
      ([, interview]) =>
        interview.username === username && interview.index >= interview.questions.length
    )
    .map(([id, interview]) => {
      let score = 0;
      interview.history.forEach((item) => {
        const answerLength = (item.answer || '').length;
        if (answerLength > 200) score += 25;
        else if (answerLength > 100) score += 18;
        else if (answerLength > 50) score += 12;
        else score += 5;
      });
      score = Math.min(100, score);

      const user = findUser(db, username);
      return {
        id,
        date: interview.history[0]?.time || Date.now(),
        company: user?.target || 'Unbekannt',
        questionsCount: interview.questions.length,
        score: Math.round(score),
        duration:
          Math.round(
            (interview.history[interview.history.length - 1]?.time - interview.history[0]?.time) /
              1000 /
              60
          ) || 0,
      };
    })
    .sort((a, b) => b.date - a.date);

  const user = findUser(db, username);

  return res.json({
    username,
    study: user?.study || '',
    target: user?.target || '',
    interviews: userInterviews,
    stats: {
      totalInterviews: userInterviews.length,
      averageScore:
        userInterviews.length > 0
          ? Math.round(userInterviews.reduce((sum, i) => sum + i.score, 0) / userInterviews.length)
          : 0,
    },
  });
});

// Analyze interview
router.get('/analyze', requireToken, async (req, res) => {
  const { id } = req.query;
  const { username } = req.session!;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Interview ID required' });
  }

  const db = readDb();
  const interview = db.interviews[id];

  if (!interview) {
    return res.status(404).json({ error: 'Interview not found' });
  }

  if (interview.username !== username) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const user = findUser(db, username);

  // For now, return a simple analysis structure
  // Full OpenAI analysis will be implemented in Phase 2
  const analysis = {
    position: user?.target || 'Software Engineer',
    industry: 'Technologie',
    duration:
      Math.round(
        (interview.history[interview.history.length - 1]?.time - interview.history[0]?.time) / 60000
      ) || 45,
    date: new Date().toLocaleDateString('de-DE'),
    overallScore: 85,
    overallFeedback: 'Gute Leistung im Interview.',
    metrics: {
      knowledge: {
        score: 85,
        description: 'Gute fachliche Kenntnisse gezeigt.',
      },
      body: {
        score: 78,
        description: 'Selbstbewusstes Auftreten.',
      },
      speaking: {
        score: 82,
        description: 'Klare und verständliche Ausdrucksweise.',
      },
      structure: {
        score: 90,
        description: 'Gut strukturierte Antworten.',
      },
    },
    strengths: [
      'Strukturierte Antworten mit klarer STAR-Methode',
      'Gute Verknüpfung von Theorie und Praxis',
      'Selbstbewusstes Auftreten',
    ],
    improvements: [
      'Mehr konkrete Zahlen und Metriken nennen',
      'Antworten etwas kürzer und prägnanter formulieren',
      'Noch mehr Beispiele aus der Praxis einbringen',
    ],
  };

  return res.json(analysis);
});

// Helper: Generate questions
function generateQuestions(study?: string, target?: string): string[] {
  const base = [
    'Erzähle mir etwas über dich und deinen Studienhintergrund.',
    `Warum interessierst du dich für dieses Praktikum bei ${target || 'dem Unternehmen'}?`,
    'Nenne eine Situation, in der du im Team ein Problem gelöst hast.',
    'Wie gehst du mit Stress und engen Deadlines um?',
  ];

  if (study && study.toLowerCase().includes('wirtschaft')) {
    base.splice(2, 0, 'Beschreibe eine betriebswirtschaftliche Analyse, die du durchgeführt hast.');
  }

  if (target && /goldman|jp morgan|dax|big four/i.test(target)) {
    base.push(
      `Wie beurteilst du aktuelle Trends in der Finanzbranche und ihre Bedeutung für ${target}?`
    );
  }

  return base;
}

export default router;
