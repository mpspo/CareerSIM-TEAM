import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './InterviewSetup.css';

interface Persona {
  id: string;
  name: string;
  type: string;
  role: string;
  company_type: string;
  industry: string;
  description: string;
  difficulty_level: number;
}

interface InterviewConfig {
  personaId?: string;
  company: string;
  role: string;
  duration: number; // minutes
  difficulty: number; // 1-5
  focusAreas: string[];
}

export function InterviewSetup() {
  const navigate = useNavigate();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<InterviewConfig>({
    company: '',
    role: '',
    duration: 30,
    difficulty: 3,
    focusAreas: [],
  });

  // Available focus areas
  const focusOptions = [
    'Behavioral Questions',
    'Technical Skills',
    'Case Studies',
    'Leadership',
    'Problem Solving',
    'Communication',
    'Cultural Fit',
  ];

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    try {
      // TODO: Load from Supabase in Phase 2
      // For now, use mock data
      const mockPersonas: Persona[] = [
        {
          id: '1',
          name: 'Sarah Chen',
          type: 'friendly',
          role: 'Senior Software Engineer',
          company_type: 'Startup',
          industry: 'Technology',
          description: 'Eine freundliche und ermutigende Interviewerin, die sich auf Problemlösungsansätze und Teamarbeit konzentriert.',
          difficulty_level: 2,
        },
        {
          id: '2',
          name: 'Dr. Michael Hoffmann',
          type: 'critical',
          role: 'VP of Engineering',
          company_type: 'Corporate',
          industry: 'Finance',
          description: 'Ein detailorientierter und kritischer Interviewer, der präzise, gut strukturierte Antworten erwartet.',
          difficulty_level: 5,
        },
        {
          id: '3',
          name: 'Lisa Weber',
          type: 'neutral',
          role: 'HR Business Partner',
          company_type: 'Corporate',
          industry: 'Consulting',
          description: 'Eine professionelle HR-Interviewerin, die sich auf Cultural Fit und Verhaltenfragen konzentriert.',
          difficulty_level: 3,
        },
      ];

      setPersonas(mockPersonas);
    } catch (error) {
      console.error('Error loading personas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePersonaSelect = (personaId: string) => {
    setConfig({ ...config, personaId });
  };

  const handleFocusAreaToggle = (area: string) => {
    const updated = config.focusAreas.includes(area)
      ? config.focusAreas.filter((a) => a !== area)
      : [...config.focusAreas, area];

    setConfig({ ...config, focusAreas: updated });
  };

  const handleStartInterview = async () => {
    // Validate config
    if (!config.company || !config.role) {
      alert('Bitte fülle Unternehmen und Position aus.');
      return;
    }

    try {
      // TODO: Create interview session via API
      // For now, navigate with config in state
      navigate('/interview/session', { state: { config } });
    } catch (error) {
      console.error('Error starting interview:', error);
      alert('Fehler beim Starten des Interviews. Bitte versuche es erneut.');
    }
  };

  const getDifficultyLabel = (level: number): string => {
    const labels = ['Sehr leicht', 'Leicht', 'Mittel', 'Schwer', 'Sehr schwer'];
    return labels[level - 1] || 'Mittel';
  };

  const getDifficultyColor = (level: number): string => {
    const colors = ['#10a37f', '#52c41a', '#faad14', '#ff7a45', '#ef4444'];
    return colors[level - 1] || '#faad14';
  };

  if (loading) {
    return (
      <div className="interview-setup">
        <div className="loading">
          <div className="spinner"></div>
          <p>Lade Interview-Optionen...</p>
        </div>
      </div>
    );
  }

  const selectedPersona = personas.find((p) => p.id === config.personaId);

  return (
    <div className="interview-setup">
      <div className="setup-header">
        <h1>Interview konfigurieren</h1>
        <p>Passe dein Interview-Erlebnis an deine Bedürfnisse an</p>
      </div>

      <div className="setup-content">
        {/* Basic Info */}
        <section className="setup-section">
          <h2>1. Grundinformationen</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="company">Zielunternehmen *</label>
              <input
                type="text"
                id="company"
                value={config.company}
                onChange={(e) => setConfig({ ...config, company: e.target.value })}
                placeholder="z.B. Google, Goldman Sachs, ..."
              />
            </div>
            <div className="form-group">
              <label htmlFor="role">Position *</label>
              <input
                type="text"
                id="role"
                value={config.role}
                onChange={(e) => setConfig({ ...config, role: e.target.value })}
                placeholder="z.B. Software Engineer, Consultant, ..."
              />
            </div>
          </div>
        </section>

        {/* Persona Selection */}
        <section className="setup-section">
          <h2>2. Interviewer-Persona</h2>
          <p className="section-description">
            Wähle einen Interviewer mit unterschiedlichem Stil und Schwierigkeitsgrad
          </p>
          <div className="persona-grid">
            {personas.map((persona) => (
              <div
                key={persona.id}
                className={`persona-card ${config.personaId === persona.id ? 'selected' : ''}`}
                onClick={() => handlePersonaSelect(persona.id)}
              >
                <div className="persona-header">
                  <h3>{persona.name}</h3>
                  <span
                    className="difficulty-badge"
                    style={{ backgroundColor: getDifficultyColor(persona.difficulty_level) }}
                  >
                    {getDifficultyLabel(persona.difficulty_level)}
                  </span>
                </div>
                <div className="persona-info">
                  <p className="persona-role">{persona.role}</p>
                  <p className="persona-company">
                    {persona.company_type} · {persona.industry}
                  </p>
                </div>
                <p className="persona-description">{persona.description}</p>
                {config.personaId === persona.id && (
                  <div className="selected-indicator">✓ Ausgewählt</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Interview Settings */}
        <section className="setup-section">
          <h2>3. Interview-Einstellungen</h2>
          <div className="settings-grid">
            <div className="setting-item">
              <label htmlFor="duration">Dauer (Minuten)</label>
              <div className="slider-container">
                <input
                  type="range"
                  id="duration"
                  min="15"
                  max="60"
                  step="15"
                  value={config.duration}
                  onChange={(e) => setConfig({ ...config, duration: parseInt(e.target.value) })}
                />
                <span className="slider-value">{config.duration} Min</span>
              </div>
            </div>

            <div className="setting-item">
              <label htmlFor="difficulty">Schwierigkeitsgrad</label>
              <div className="slider-container">
                <input
                  type="range"
                  id="difficulty"
                  min="1"
                  max="5"
                  step="1"
                  value={config.difficulty}
                  onChange={(e) => setConfig({ ...config, difficulty: parseInt(e.target.value) })}
                />
                <span className="slider-value" style={{ color: getDifficultyColor(config.difficulty) }}>
                  {getDifficultyLabel(config.difficulty)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Focus Areas */}
        <section className="setup-section">
          <h2>4. Themenschwerpunkte (Optional)</h2>
          <p className="section-description">
            Wähle bis zu 3 Bereiche, auf die sich das Interview konzentrieren soll
          </p>
          <div className="focus-areas">
            {focusOptions.map((area) => (
              <button
                key={area}
                className={`focus-chip ${config.focusAreas.includes(area) ? 'selected' : ''}`}
                onClick={() => handleFocusAreaToggle(area)}
                disabled={config.focusAreas.length >= 3 && !config.focusAreas.includes(area)}
              >
                {area}
              </button>
            ))}
          </div>
        </section>

        {/* Summary */}
        {selectedPersona && (
          <section className="setup-section summary">
            <h2>Zusammenfassung</h2>
            <div className="summary-content">
              <div className="summary-item">
                <span className="summary-label">Unternehmen:</span>
                <span className="summary-value">{config.company || 'Noch nicht ausgefüllt'}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Position:</span>
                <span className="summary-value">{config.role || 'Noch nicht ausgefüllt'}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Interviewer:</span>
                <span className="summary-value">{selectedPersona.name}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Dauer:</span>
                <span className="summary-value">{config.duration} Minuten</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Schwierigkeit:</span>
                <span className="summary-value">{getDifficultyLabel(config.difficulty)}</span>
              </div>
              {config.focusAreas.length > 0 && (
                <div className="summary-item">
                  <span className="summary-label">Schwerpunkte:</span>
                  <span className="summary-value">{config.focusAreas.join(', ')}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Actions */}
        <div className="setup-actions">
          <button className="btn-secondary" onClick={() => navigate('/interview')}>
            Abbrechen
          </button>
          <button
            className="btn-primary"
            onClick={handleStartInterview}
            disabled={!config.company || !config.role}
          >
            Interview starten →
          </button>
        </div>
      </div>
    </div>
  );
}
