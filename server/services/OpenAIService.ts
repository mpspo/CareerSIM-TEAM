import OpenAI from 'openai';

class OpenAIService {
  private client: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } else {
      console.warn('⚠️  OpenAI API key not configured. Using fallback responses.');
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async getChatCompletion(
    systemPrompt: string,
    userPrompt: string,
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<string | null> {
    if (!this.client) {
      return null;
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: options.model || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: options.maxTokens || 500,
        temperature: options.temperature || 0.7,
      });

      return completion.choices[0]?.message?.content || null;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      return null;
    }
  }

  async getInterviewFeedback(
    question: string,
    answer: string,
    userContext: { study?: string; target?: string }
  ): Promise<string> {
    const systemPrompt =
      'Du bist ein professioneller Interview-Coach. Gib präzises, konstruktives Feedback zur Antwort des Kandidaten. Antworte auf Deutsch und nutze die STAR-Methode (Situation, Task, Action, Result) zur Bewertung.';

    const userPrompt = `Studiengang: ${userContext.study || 'Nicht angegeben'}
Zielunternehmen: ${userContext.target || 'Nicht angegeben'}
Interviewfrage: "${question}"
Kandidatenantwort: "${answer}"

Bitte gib:
1. Kurzes Feedback (2-3 Sätze) zur Qualität der Antwort
2. Einen konkreten Verbesserungsvorschlag
3. Optional: Eine passende Folgefrage (mit "NÄCHSTE_FRAGE:" markiert)`;

    const response = await this.getChatCompletion(systemPrompt, userPrompt);

    if (response) {
      return response;
    }

    // Fallback
    return this.getFallbackInterviewFeedback(answer);
  }

  async getCareerAdvice(
    message: string,
    userContext: { username: string; study?: string; target?: string }
  ): Promise<string> {
    const systemPrompt = `Du bist ein professioneller KI-Karriereberater mit Expertise in:
- Karriereplanung und -entwicklung
- Bewerbungsprozesse und CV-Optimierung
- Stärken-Schwächen-Analyse
- Berufseinstieg für Studierende und Absolventen
- Branchenspezifische Karrierewege

Antworte freundlich, professionell und konkret. Gib praktische, umsetzbare Ratschläge.`;

    const userPrompt = `Nutzer: ${userContext.username}
Studiengang: ${userContext.study || 'Nicht angegeben'}
Zielunternehmen: ${userContext.target || 'Nicht angegeben'}

Frage: ${message}`;

    const response = await this.getChatCompletion(systemPrompt, userPrompt, {
      maxTokens: 800,
    });

    if (response) {
      return response;
    }

    // Fallback
    return this.getFallbackCareerAdvice(message);
  }

  async analyzCV(cvText: string): Promise<any> {
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

    const response = await this.getChatCompletion(
      systemPrompt,
      `Bitte analysiere diesen Lebenslauf:\n\n${cvText.substring(0, 3000)}`,
      {
        maxTokens: 1000,
        temperature: 0.5,
      }
    );

    if (response) {
      try {
        return JSON.parse(response);
      } catch {
        return {
          overallScore: 75,
          structureScore: 80,
          contentScore: 75,
          clarityScore: 78,
          professionalismScore: 70,
          feedback: [{ type: '🤖', title: 'KI-Analyse', text: response }],
        };
      }
    }

    return this.getFallbackCVRating(cvText);
  }

  // Fallback methods
  private getFallbackInterviewFeedback(answer: string): string {
    if (!answer) {
      return 'Versuche, strukturierter zu antworten: Situation, Aufgabe, Aktion, Ergebnis.';
    }
    const a = answer.toLowerCase();
    if (a.length < 50) {
      return 'Zu kurz: gib mehr konkrete Beispiele und Zahlen, falls möglich.';
    }
    if (a.includes('team') || a.includes('wir')) {
      return 'Gute Teamorientierung sichtbar — nenne eine konkrete Rolle, die du hattest.';
    }
    if (a.includes('ich') && a.includes('verantwort')) {
      return 'Stark: du übernimmst Verantwortung. Erwähne ein konkretes Ergebnis.';
    }
    return 'Gut strukturiert. Füge konkrete Zahlen oder Resultate zur Stärkung deiner Antwort hinzu.';
  }

  private getFallbackCareerAdvice(message: string): string {
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

  private getFallbackCVRating(cvText: string): any {
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

    const overallScore = Math.round(
      (structureScore + contentScore + clarityScore + professionalismScore) / 4
    );

    return {
      overallScore,
      structureScore,
      contentScore,
      clarityScore,
      professionalismScore,
      feedback: [
        {
          type: '✅',
          title: 'Stärken',
          text: hasEmail && hasPhone ? 'Kontaktdaten vorhanden' : 'Grundstruktur erkennbar',
        },
        {
          type: '⚠️',
          title: 'Verbesserungspotential',
          text:
            wordCount < 200
              ? 'CV ist zu kurz - füge mehr Details hinzu'
              : 'Füge messbare Erfolge hinzu',
        },
        {
          type: '💡',
          title: 'Empfehlungen',
          text: 'Verwende klare Überschriften, füge Zeitangaben hinzu und quantifiziere deine Erfolge (z.B. "Umsatz um 20% gesteigert")',
        },
      ],
    };
  }
}

export const openAIService = new OpenAIService();
