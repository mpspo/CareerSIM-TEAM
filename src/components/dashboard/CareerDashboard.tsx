import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CareerProfileService } from '../../services/CareerProfileService';
import type { CareerProfile, RoleRecommendation, SkillRecommendation } from '../../types/career.types';
import './CareerDashboard.css';

export const CareerDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCareerProfile();
  }, []);

  const loadCareerProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const profileData = await CareerProfileService.getCompleteProfile();
      setProfile(profileData);
    } catch (err) {
      console.error('Error loading career profile:', err);
      setError('Fehler beim Laden des Karriereprofils');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="career-dashboard loading">
        <div className="spinner"></div>
        <p>Lade dein Karriereprofil...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="career-dashboard error">
        <p>{error}</p>
        <button onClick={loadCareerProfile} className="btn-primary">
          Erneut versuchen
        </button>
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
                <button 
                  className="btn-primary"
                  onClick={() => navigate('/interview/setup')}
                >
                  Erstes Interview starten
                </button>
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
        <button 
          className="btn-primary"
          onClick={() => navigate('/interview/setup')}
        >
          Neues Interview starten
        </button>
        <button 
          className="btn-secondary"
          onClick={loadCareerProfile}
        >
          Profil aktualisieren
        </button>
      </div>

      {/* Stats */}
      {profile && (profile.totalInterviews || 0) > 0 && (
        <div className="career-stats">
          <div className="stat-card">
            <span className="stat-value">{profile.totalInterviews || 0}</span>
            <span className="stat-label">Absolvierte Interviews</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{Math.round(profile.averageScore || 0)}</span>
            <span className="stat-label">Durchschnittlicher Score</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{profile.aggregatedStrengths.length}</span>
            <span className="stat-label">Identifizierte Stärken</span>
          </div>
        </div>
      )}
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
    <p className="role-company">{role.company}</p>
    <p className="role-description">{role.description}</p>
    <div className="role-details">
      <span className="role-salary">{role.salary}</span>
      <span className="role-location">📍 {role.location}</span>
    </div>
    <div className="role-skills">
      {role.requiredSkills.slice(0, 3).map((skill, i) => (
        <span key={i} className="skill-tag">
          {skill}
        </span>
      ))}
    </div>
  </div>
);

const SkillCard = ({ skill }: { skill: SkillRecommendation }) => (
  <div className="skill-card">
    <div className="skill-header">
      <h4>{skill.skill}</h4>
      <span className={`priority-badge ${skill.priority}`}>
        {skill.priority === 'high' ? 'Hoch' : skill.priority === 'medium' ? 'Mittel' : 'Niedrig'}
      </span>
    </div>
    <p className="skill-reason">{skill.reason}</p>
    <p className="skill-time">⏱️ {skill.estimatedTime}</p>
    {skill.resources && skill.resources.length > 0 && (
      <div className="skill-resources">
        {skill.resources.slice(0, 2).map((resource, i) => (
          <a key={i} href={resource.url} className="resource-link" target="_blank" rel="noopener noreferrer">
            {resource.type === 'course' ? '📚' : resource.type === 'video' ? '🎥' : '📄'} {resource.title}
          </a>
        ))}
      </div>
    )}
  </div>
);
