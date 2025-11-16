import { useState, useEffect } from 'react';
import type { CareerProfile, RoleRecommendation, SkillRecommendation } from '@types/career.types';
import './CareerDashboard.css';

export const CareerDashboard = () => {
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCareerProfile();
  }, []);

  const loadCareerProfile = async () => {
    // TODO: Fetch from API
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="career-dashboard loading">
        <div className="spinner"></div>
        <p>Lade dein Karriereprofil...</p>
      </div>
    );
  }

  return (
    <div className="career-dashboard">
      {/* Header */}
      <div className="career-header">
        <h1>Karriere-Coach</h1>
        <p className="career-subtitle">
          Personalisierte Empfehlungen basierend auf deinen Interview-Ergebnissen
        </p>
      </div>

      {/* Main Grid */}
      <div className="career-grid">
        {/* Deine Stärken */}
        <div className="career-card">
          <div className="card-header">
            <span className="card-icon">💪</span>
            <h2>Deine Stärken</h2>
          </div>
          <div className="card-content">
            {profile?.aggregatedStrengths.length ? (
              <ul className="strength-list">
                {profile.aggregatedStrengths.map((strength, i) => (
                  <li key={i} className="strength-item">
                    <span className="check-icon">✓</span>
                    {strength}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state">
                <p>Absolviere Interviews, um deine Stärken zu identifizieren</p>
                <button className="btn-primary">Erstes Interview starten</button>
              </div>
            )}
          </div>
        </div>

        {/* Empfohlene Rollen */}
        <div className="career-card">
          <div className="card-header">
            <span className="card-icon">🎯</span>
            <h2>Empfohlene Rollen</h2>
          </div>
          <div className="card-content">
            {profile?.recommendedRoles.length ? (
              <div className="role-list">
                {profile.recommendedRoles.slice(0, 3).map((role, i) => (
                  <RoleCard key={i} role={role} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>Wir analysieren deine Interviews, um passende Rollen zu finden</p>
              </div>
            )}
          </div>
        </div>

        {/* Fehlende Skills */}
        <div className="career-card">
          <div className="card-header">
            <span className="card-icon">📚</span>
            <h2>Fehlende Skills</h2>
          </div>
          <div className="card-content">
            {profile?.recommendedSkills.length ? (
              <div className="skill-list">
                {profile.recommendedSkills
                  .filter((s) => s.priority === 'high')
                  .slice(0, 5)
                  .map((skill, i) => (
                    <SkillCard key={i} skill={skill} />
                  ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>Keine dringenden Skill-Lücken identifiziert</p>
              </div>
            )}
          </div>
        </div>

        {/* Empfohlene Programme */}
        <div className="career-card">
          <div className="card-header">
            <span className="card-icon">🎓</span>
            <h2>Empfohlene Programme</h2>
          </div>
          <div className="card-content">
            <div className="empty-state">
              <p>Basierend auf deinen Zielen werden wir passende Programme vorschlagen</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="career-actions">
        <button className="btn-primary">
          Neues Karriere-Assessment starten
        </button>
        <button className="btn-secondary">
          Analyse auf Basis letzter Interviews
        </button>
      </div>
    </div>
  );
};

// Helper Components
const RoleCard = ({ role }: { role: RoleRecommendation }) => (
  <div className="role-card">
    <div className="role-header">
      <h3>{role.title}</h3>
      <span className="match-score">{role.matchScore}% Match</span>
    </div>
    <p className="role-industry">{role.industry}</p>
    <div className="role-reasons">
      {role.reasons.slice(0, 2).map((reason, i) => (
        <span key={i} className="reason-tag">
          {reason}
        </span>
      ))}
    </div>
  </div>
);

const SkillCard = ({ skill }: { skill: SkillRecommendation }) => (
  <div className="skill-card">
    <div className="skill-header">
      <h4>{skill.name}</h4>
      <span className={`priority-badge ${skill.priority}`}>{skill.priority}</span>
    </div>
    <div className="skill-progress">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: '30%' }}></div>
      </div>
      <span className="progress-text">
        {skill.currentLevel} → {skill.targetLevel}
      </span>
    </div>
    <p className="skill-time">{skill.estimatedTime}</p>
  </div>
);
