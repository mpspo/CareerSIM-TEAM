import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import './FeedbackView.css';

interface FeedbackData {
  overallScore: number;
  overallFeedback: string;
  metrics: {
    knowledge: { score: number; description: string };
    communication: { score: number; description: string };
    structure: { score: number; description: string };
    confidence: { score: number; description: string };
  };
  strengths: string[];
  improvements: string[];
  detailedAnalysis?: {
    question: string;
    answer: string;
    feedback: string;
    starScore: { situation: number; task: number; action: number; result: number };
  }[];
}

export function FeedbackView() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);

  useEffect(() => {
    loadFeedback();
  }, [id]);

  const loadFeedback = async () => {
    try {
      // TODO: Load from backend API
      // For now, generate mock feedback
      const mockFeedback: FeedbackData = {
        overallScore: 82,
        overallFeedback: 'Sehr gute Leistung! Du hast strukturiert geantwortet und konkrete Beispiele genannt. Arbeite weiter an der Quantifizierung deiner Erfolge.',
        metrics: {
          knowledge: {
            score: 85,
            description: 'Hervorragende fachliche Kenntnisse und praktische Erfahrung.',
          },
          communication: {
            score: 78,
            description: 'Klare und verständliche Kommunikation. Mehr Selbstbewusstsein zeigen.',
          },
          structure: {
            score: 88,
            description: 'Exzellente Strukturierung mit STAR-Methode.',
          },
          confidence: {
            score: 77,
            description: 'Gutes Auftreten. Nutze aktivere Formulierungen.',
          },
        },
        strengths: [
          'Strukturierte Antworten mit klarer STAR-Methode',
          'Gute Verknüpfung von Theorie und Praxis',
          'Selbstbewusstes Auftreten',
          'Konkrete Beispiele aus der Berufserfahrung',
          'Proaktive Problemlösungsfähigkeiten',
        ],
        improvements: [
          'Mehr konkrete Zahlen und Metriken in Antworten einbauen',
          'Antworten etwas kürzer und prägnanter formulieren',
          'Noch mehr Beispiele aus der Praxis einbringen',
          'Aktive statt passive Formulierungen verwenden',
        ],
      };

      setFeedback(mockFeedback);
    } catch (error) {
      console.error('Error loading feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 85) return '#10a37f';
    if (score >= 70) return '#52c41a';
    if (score >= 50) return '#faad14';
    return '#ef4444';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 85) return 'Exzellent';
    if (score >= 70) return 'Gut';
    if (score >= 50) return 'Befriedigend';
    return 'Verbesserungsbedarf';
  };

  if (loading) {
    return (
      <div className="feedback-view">
        <div className="loading">
          <div className="spinner"></div>
          <p>Analysiere deine Performance...</p>
        </div>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="feedback-view">
        <div className="error">
          <p>Feedback konnte nicht geladen werden.</p>
          <button onClick={() => navigate('/interview')}>Zurück</button>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-view">
      {/* Header with Overall Score */}
      <div className="feedback-header">
        <h1>Interview-Auswertung</h1>
        <div className="overall-score-card">
          <div className="score-circle" style={{ borderColor: getScoreColor(feedback.overallScore) }}>
            <span className="score-number">{feedback.overallScore}</span>
            <span className="score-label">{getScoreLabel(feedback.overallScore)}</span>
          </div>
          <p className="overall-feedback">{feedback.overallFeedback}</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <section className="feedback-section">
        <h2>Bewertung nach Kategorien</h2>
        <div className="metrics-grid">
          {Object.entries(feedback.metrics).map(([key, metric]) => (
            <div key={key} className="metric-card">
              <div className="metric-header">
                <h3>{getMetricTitle(key)}</h3>
                <div className="metric-score" style={{ color: getScoreColor(metric.score) }}>
                  {metric.score}
                </div>
              </div>
              <div className="metric-bar">
                <div
                  className="metric-fill"
                  style={{
                    width: `${metric.score}%`,
                    background: getScoreColor(metric.score),
                  }}
                ></div>
              </div>
              <p className="metric-description">{metric.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Strengths */}
      <section className="feedback-section">
        <h2>✅ Deine Stärken</h2>
        <div className="list-grid">
          {feedback.strengths.map((strength, index) => (
            <div key={index} className="list-item strength">
              <span className="list-icon">✓</span>
              <span className="list-text">{strength}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Improvements */}
      <section className="feedback-section">
        <h2>💡 Verbesserungsvorschläge</h2>
        <div className="list-grid">
          {feedback.improvements.map((improvement, index) => (
            <div key={index} className="list-item improvement">
              <span className="list-icon">→</span>
              <span className="list-text">{improvement}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Action Plan */}
      <section className="feedback-section action-plan">
        <h2>🎯 Nächste Schritte</h2>
        <div className="action-cards">
          <div className="action-card">
            <div className="action-icon">📚</div>
            <h3>Weiter üben</h3>
            <p>Führe weitere Mock-Interviews durch, um deine Skills zu verbessern.</p>
            <button className="action-btn" onClick={() => navigate('/interview/setup')}>
              Neues Interview starten
            </button>
          </div>
          <div className="action-card">
            <div className="action-icon">🎯</div>
            <h3>Karriereplan erstellen</h3>
            <p>Lass dir einen personalisierten Karriereplan basierend auf deinen Stärken erstellen.</p>
            <button className="action-btn" onClick={() => navigate('/career')}>
              Zum Karriere-Coach
            </button>
          </div>
          <div className="action-card">
            <div className="action-icon">📊</div>
            <h3>Fortschritt verfolgen</h3>
            <p>Sieh dir deine Entwicklung über alle Interviews hinweg an.</p>
            <button className="action-btn" onClick={() => navigate('/dashboard')}>
              Zum Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="feedback-actions">
        <button className="btn-secondary" onClick={() => navigate('/interview')}>
          Zurück zur Übersicht
        </button>
        <button className="btn-primary" onClick={() => navigate('/interview/setup')}>
          Neues Interview starten
        </button>
      </div>
    </div>
  );
}

function getMetricTitle(key: string): string {
  const titles: Record<string, string> = {
    knowledge: 'Fachwissen',
    communication: 'Kommunikation',
    structure: 'Struktur',
    confidence: 'Auftreten',
  };
  return titles[key] || key;
}
