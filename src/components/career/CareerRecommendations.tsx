import React, { useState, useEffect } from 'react';
import { careerRecommendationService, CareerPathAnalysis } from '../../services/CareerRecommendationService';
import './CareerRecommendations.css';

export const CareerRecommendations: React.FC = () => {
  const [analysis, setAnalysis] = useState<CareerPathAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'recommendations' | 'skills' | 'trends'>('recommendations');

  useEffect(() => {
    loadAnalysis();
  }, []);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For now, use mock user ID
      // In production, get from auth context
      const userId = 'mock-user';
      
      const data = await careerRecommendationService.generateCareerAnalysis(userId);
      setAnalysis(data);
    } catch (err) {
      console.error('Error loading career analysis:', err);
      setError('Fehler beim Laden der Karriere-Analyse');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="career-recommendations loading">
        <div className="spinner"></div>
        <p>Analysiere dein Karriereprofil...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="career-recommendations error">
        <p>{error}</p>
        <button onClick={loadAnalysis} className="retry-btn">
          Erneut versuchen
        </button>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#10a37f';
    if (score >= 60) return '#fbbf24';
    return '#ef4444';
  };

  const getGrowthIcon = (outlook: string): string => {
    switch (outlook) {
      case 'high': return '📈';
      case 'medium': return '→';
      case 'low': return '📉';
      default: return '→';
    }
  };

  const getTrendIcon = (direction: string): string => {
    switch (direction) {
      case 'rising': return '🚀';
      case 'stable': return '➡️';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  const getDemandColor = (level: string): string => {
    switch (level) {
      case 'very-high': return '#10a37f';
      case 'high': return '#3b82f6';
      case 'medium': return '#fbbf24';
      case 'low': return '#9ca3af';
      default: return '#6b7280';
    }
  };

  return (
    <div className="career-recommendations">
      {/* Profile Summary */}
      <div className="profile-summary">
        <h2>Dein Karriereprofil</h2>
        <div className="summary-stats">
          <div className="stat">
            <span className="stat-value">{analysis.currentProfile.totalInterviews}</span>
            <span className="stat-label">Interviews</span>
          </div>
          <div className="stat">
            <span className="stat-value" style={{ color: getScoreColor(analysis.currentProfile.avgInterviewScore) }}>
              {analysis.currentProfile.avgInterviewScore}
            </span>
            <span className="stat-label">Avg. Score</span>
          </div>
          <div className="stat">
            <span className="stat-value">{analysis.currentProfile.topSkills.length}</span>
            <span className="stat-label">Practiced Skills</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${selectedTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setSelectedTab('recommendations')}
        >
          🎯 Empfehlungen
        </button>
        <button
          className={`tab ${selectedTab === 'skills' ? 'active' : ''}`}
          onClick={() => setSelectedTab('skills')}
        >
          📚 Skill-Analyse
        </button>
        <button
          className={`tab ${selectedTab === 'trends' ? 'active' : ''}`}
          onClick={() => setSelectedTab('trends')}
        >
          📊 Trends
        </button>
      </div>

      {/* Recommendations Tab */}
      {selectedTab === 'recommendations' && (
        <div className="recommendations-list">
          {analysis.recommendations.length === 0 ? (
            <div className="empty-state">
              <p>Absolviere ein paar Interviews, um personalisierte Empfehlungen zu erhalten!</p>
            </div>
          ) : (
            analysis.recommendations.map((rec, index) => (
              <div key={index} className="recommendation-card">
                <div className="card-header">
                  <div className="header-left">
                    <h3>{rec.role}</h3>
                    <span className="salary">{rec.salaryRange}</span>
                  </div>
                  <div className="match-score" style={{ borderColor: getScoreColor(rec.matchScore) }}>
                    <span className="score">{rec.matchScore}%</span>
                    <span className="label">Match</span>
                  </div>
                </div>

                <div className="card-body">
                  {/* Reasons */}
                  <div className="section">
                    <h4>Warum dieser Job passt:</h4>
                    <ul className="reasons-list">
                      {rec.reasons.map((reason, i) => (
                        <li key={i}>✓ {reason}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Skills */}
                  <div className="section">
                    <h4>Benötigte Skills:</h4>
                    <div className="skills-tags">
                      {rec.requiredSkills.map((skill, i) => (
                        <span key={i} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                  </div>

                  {/* Skill Gaps */}
                  {rec.currentSkillGaps.length > 0 && (
                    <div className="section">
                      <h4>Zu entwickeln:</h4>
                      <div className="gaps-tags">
                        {rec.currentSkillGaps.map((gap, i) => (
                          <span key={i} className="gap-tag">{gap}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Learning Resources */}
                  {rec.learningResources && rec.learningResources.length > 0 && (
                    <div className="section">
                      <h4>Lernressourcen:</h4>
                      <div className="resources-list">
                        {rec.learningResources.map((resource, i) => (
                          <div key={i} className="resource-item">
                            <span className="resource-icon">
                              {resource.type === 'course' ? '📚' : 
                               resource.type === 'project' ? '🛠️' :
                               resource.type === 'certification' ? '🎓' :
                               resource.type === 'practice' ? '💪' : '📖'}
                            </span>
                            <div className="resource-info">
                              <span className="resource-title">{resource.title}</span>
                              {resource.provider && <span className="resource-provider">{resource.provider}</span>}
                              {resource.duration && <span className="resource-duration">{resource.duration}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="card-footer">
                    <span className="time-estimate">⏱️ {rec.estimatedTimeToReady}</span>
                    <span className="growth-outlook">
                      {getGrowthIcon(rec.growthOutlook)} {rec.growthOutlook === 'high' ? 'Hohe' : rec.growthOutlook === 'medium' ? 'Mittlere' : 'Geringe'} Wachstumsaussichten
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Skills Tab */}
      {selectedTab === 'skills' && (
        <div className="skills-analysis">
          {analysis.skillAnalysis.length === 0 ? (
            <div className="empty-state">
              <p>Absolviere Interviews, um deine Skill-Lücken zu analysieren!</p>
            </div>
          ) : (
            <>
              <div className="skills-intro">
                <h3>Deine Skill-Entwicklung</h3>
                <p>Konzentriere dich auf diese Bereiche, um deine Karriereziele zu erreichen</p>
              </div>
              <div className="skills-list">
                {analysis.skillAnalysis.map((skill, index) => (
                  <div key={index} className="skill-analysis-card">
                    <div className="skill-header">
                      <h4>{skill.skill}</h4>
                      <span className={`importance-badge ${skill.importance}`}>
                        {skill.importance === 'critical' ? '🔥 Kritisch' :
                         skill.importance === 'important' ? '⭐ Wichtig' : '✨ Nice-to-have'}
                      </span>
                    </div>

                    <div className="skill-levels">
                      <div className="level-item">
                        <span className="level-label">Aktuell</span>
                        <div className="level-bar">
                          <div 
                            className="level-fill current"
                            style={{ width: `${skill.currentLevel}%` }}
                          />
                        </div>
                        <span className="level-value">{skill.currentLevel}%</span>
                      </div>

                      <div className="level-item">
                        <span className="level-label">Ziel</span>
                        <div className="level-bar">
                          <div 
                            className="level-fill target"
                            style={{ width: `${skill.targetLevel}%` }}
                          />
                        </div>
                        <span className="level-value">{skill.targetLevel}%</span>
                      </div>
                    </div>

                    <div className="gap-info">
                      <span className="gap-label">Gap:</span>
                      <span className="gap-value">{skill.gap} Punkte</span>
                    </div>

                    {skill.learningPath.length > 0 && (
                      <div className="learning-path">
                        <h5>Lernpfad:</h5>
                        {skill.learningPath.slice(0, 2).map((resource, i) => (
                          <div key={i} className="path-item">
                            <span className="path-icon">
                              {resource.type === 'course' ? '📚' : '🛠️'}
                            </span>
                            <span className="path-title">{resource.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Trends Tab */}
      {selectedTab === 'trends' && (
        <div className="industry-trends">
          {analysis.industryTrends.length === 0 ? (
            <div className="empty-state">
              <p>Absolviere Interviews, um relevante Branchen-Trends zu sehen!</p>
            </div>
          ) : (
            <>
              <div className="trends-intro">
                <h3>Branchen-Trends</h3>
                <p>Aktuelle Marktentwicklungen für deine Skills</p>
              </div>
              <div className="trends-list">
                {analysis.industryTrends.map((trend, index) => (
                  <div key={index} className="trend-card">
                    <div className="trend-header">
                      <span className="trend-icon">{getTrendIcon(trend.trendDirection)}</span>
                      <h4>{trend.skill}</h4>
                      <span 
                        className="demand-badge"
                        style={{ backgroundColor: getDemandColor(trend.demandLevel) }}
                      >
                        {trend.demandLevel === 'very-high' ? 'Sehr hohe Nachfrage' :
                         trend.demandLevel === 'high' ? 'Hohe Nachfrage' :
                         trend.demandLevel === 'medium' ? 'Mittlere Nachfrage' : 'Niedrige Nachfrage'}
                      </span>
                    </div>
                    <p className="trend-description">{trend.description}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
