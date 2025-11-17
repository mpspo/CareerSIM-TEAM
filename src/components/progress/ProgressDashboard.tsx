import React, { useState, useEffect } from 'react';
import { achievementService, UserProgress } from '../../services/AchievementService';
import './ProgressDashboard.css';

export const ProgressDashboard: React.FC = () => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'achievements' | 'skills'>('overview');

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const userId = 'mock-user'; // Replace with actual user ID
      const data = await achievementService.getUserProgress(userId);
      setProgress(data);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="progress-dashboard loading">
        <div className="spinner"></div>
        <p>Lade deine Fortschritte...</p>
      </div>
    );
  }

  if (!progress) return null;

  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'legendary': return '#fbbf24';
      case 'epic': return '#a855f7';
      case 'rare': return '#3b82f6';
      case 'common': return '#9ca3af';
      default: return '#6b7280';
    }
  };

  const getBadgeLevelName = (level: number): string => {
    switch (level) {
      case 5: return 'Diamond';
      case 4: return 'Platinum';
      case 3: return 'Gold';
      case 2: return 'Silver';
      case 1: return 'Bronze';
      default: return '';
    }
  };

  const getBadgeLevelColor = (level: number): string => {
    switch (level) {
      case 5: return '#60a5fa';
      case 4: return '#c4b5fd';
      case 3: return '#fbbf24';
      case 2: return '#d1d5db';
      case 1: return '#cd7f32';
      default: return '#9ca3af';
    }
  };

  return (
    <div className="progress-dashboard">
      {/* Hero Section */}
      <div className="progress-hero">
        <div className="hero-content">
          <div className="level-circle">
            <div className="level-inner">
              <span className="level-number">{progress.level}</span>
              <span className="level-label">Level</span>
            </div>
            <svg className="level-ring" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="6"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#10a37f"
                strokeWidth="6"
                strokeDasharray={`${(progress.xp / (progress.xp + progress.xpToNextLevel)) * 283} 283`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
          </div>

          <div className="hero-info">
            <h1>{progress.rank}</h1>
            <p className="hero-subtitle">Top {progress.percentile}% aller Nutzer</p>
            
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="stat-icon">🎯</span>
                <div>
                  <div className="stat-value">{progress.totalInterviews}</div>
                  <div className="stat-label">Interviews</div>
                </div>
              </div>
              <div className="hero-stat">
                <span className="stat-icon">⭐</span>
                <div>
                  <div className="stat-value">{progress.totalPoints}</div>
                  <div className="stat-label">Punkte</div>
                </div>
              </div>
              <div className="hero-stat">
                <span className="stat-icon">🔥</span>
                <div>
                  <div className="stat-value">{progress.currentStreak}</div>
                  <div className="stat-label">Tage Streak</div>
                </div>
              </div>
            </div>

            <div className="xp-bar">
              <div className="xp-bar-fill" style={{ width: `${(progress.xp / (progress.xp + progress.xpToNextLevel)) * 100}%` }} />
              <span className="xp-text">
                {progress.xp} / {progress.xp + progress.xpToNextLevel} XP
              </span>
            </div>
          </div>
        </div>

        {/* Badges */}
        {progress.badges.length > 0 && (
          <div className="badges-showcase">
            <h3>Deine Badges</h3>
            <div className="badges-list">
              {progress.badges.map((badge) => (
                <div key={badge.id} className="badge-item" style={{ borderColor: getBadgeLevelColor(badge.level) }}>
                  <span className="badge-icon">{badge.icon}</span>
                  <div className="badge-info">
                    <div className="badge-name">{badge.name}</div>
                    <div className="badge-level" style={{ color: getBadgeLevelColor(badge.level) }}>
                      {getBadgeLevelName(badge.level)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="progress-tabs">
        <button
          className={`tab ${selectedTab === 'overview' ? 'active' : ''}`}
          onClick={() => setSelectedTab('overview')}
        >
          📊 Übersicht
        </button>
        <button
          className={`tab ${selectedTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setSelectedTab('achievements')}
        >
          🏆 Achievements
        </button>
        <button
          className={`tab ${selectedTab === 'skills' ? 'active' : ''}`}
          onClick={() => setSelectedTab('skills')}
        >
          🌳 Skill Tree
        </button>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="overview-content">
          <div className="overview-grid">
            {/* Recent Achievements */}
            <div className="overview-card">
              <h3>Neueste Achievements</h3>
              <div className="recent-achievements">
                {progress.achievements
                  .filter(a => a.unlockedAt)
                  .slice(0, 5)
                  .map((achievement) => (
                    <div key={achievement.id} className="mini-achievement">
                      <span className="achievement-icon">{achievement.icon}</span>
                      <div className="achievement-details">
                        <div className="achievement-title">{achievement.title}</div>
                        <div className="achievement-points">+{achievement.points} XP</div>
                      </div>
                    </div>
                  ))}
                {progress.achievements.filter(a => a.unlockedAt).length === 0 && (
                  <p className="empty-state">Noch keine Achievements freigeschaltet</p>
                )}
              </div>
            </div>

            {/* Streaks */}
            <div className="overview-card">
              <h3>Streak-Statistiken</h3>
              <div className="streak-stats">
                <div className="streak-item">
                  <span className="streak-icon">🔥</span>
                  <div>
                    <div className="streak-value">{progress.currentStreak} Tage</div>
                    <div className="streak-label">Aktueller Streak</div>
                  </div>
                </div>
                <div className="streak-item">
                  <span className="streak-icon">⚡</span>
                  <div>
                    <div className="streak-value">{progress.longestStreak} Tage</div>
                    <div className="streak-label">Längster Streak</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Achievements Tab */}
      {selectedTab === 'achievements' && (
        <div className="achievements-content">
          {['interview', 'skill', 'streak', 'special'].map((category) => {
            const categoryAchievements = progress.achievements.filter(
              (a) => a.category === category
            );

            if (categoryAchievements.length === 0) return null;

            return (
              <div key={category} className="achievement-category">
                <h3>
                  {category === 'interview' && '🎯 Interview'}
                  {category === 'skill' && '⭐ Skill'}
                  {category === 'streak' && '🔥 Streak'}
                  {category === 'special' && '✨ Spezial'}
                </h3>
                <div className="achievements-grid">
                  {categoryAchievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`achievement-card ${achievement.unlockedAt ? 'unlocked' : 'locked'}`}
                      style={{ borderColor: achievement.unlockedAt ? getRarityColor(achievement.rarity) : '#e5e7eb' }}
                    >
                      <div className="achievement-header">
                        <span className="achievement-icon-large">{achievement.icon}</span>
                        <span
                          className="achievement-rarity"
                          style={{ backgroundColor: getRarityColor(achievement.rarity) }}
                        >
                          {achievement.rarity}
                        </span>
                      </div>
                      <div className="achievement-body">
                        <h4>{achievement.title}</h4>
                        <p>{achievement.description}</p>
                        {achievement.unlockedAt ? (
                          <div className="achievement-unlocked">
                            <span className="unlock-icon">✓</span>
                            <span className="unlock-text">Freigeschaltet</span>
                            <span className="unlock-points">+{achievement.points} XP</span>
                          </div>
                        ) : (
                          <div className="achievement-progress">
                            <div className="progress-bar-small">
                              <div
                                className="progress-bar-fill-small"
                                style={{ width: `${achievement.progress}%` }}
                              />
                            </div>
                            <span className="progress-text">{achievement.progress}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Skills Tab */}
      {selectedTab === 'skills' && (
        <div className="skills-content">
          <div className="skills-intro">
            <h3>Skill Tree</h3>
            <p>Entwickle deine Fähigkeiten durch regelmäßiges Üben</p>
          </div>

          <div className="skill-tree">
            {progress.skillTree.map((skill) => (
              <div
                key={skill.id}
                className={`skill-node ${skill.isUnlocked ? 'unlocked' : 'locked'}`}
              >
                <div className="skill-icon-container">
                  <span className="skill-icon-large">{skill.icon}</span>
                  <div className="skill-level-badge">{skill.level}/{skill.maxLevel}</div>
                </div>

                <div className="skill-details">
                  <h4>{skill.name}</h4>
                  <p>{skill.description}</p>

                  {skill.isUnlocked ? (
                    <>
                      <div className="skill-xp-bar">
                        <div
                          className="skill-xp-fill"
                          style={{ width: `${(skill.xp / skill.xpToNextLevel) * 100}%` }}
                        />
                        <span className="skill-xp-text">
                          {skill.xp}/{skill.xpToNextLevel} XP
                        </span>
                      </div>

                      {skill.benefits.length > 0 && (
                        <div className="skill-benefits">
                          <span className="benefits-label">Benefits:</span>
                          <ul>
                            {skill.benefits.map((benefit, i) => (
                              <li key={i}>{benefit}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="skill-locked-message">
                      <span>🔒 Locked</span>
                      {skill.prerequisites.length > 0 && (
                        <span className="prerequisites">
                          Benötigt: {skill.prerequisites.join(', ')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
