import React from 'react';
import { VoiceMetrics } from '../../services/VoiceAnalyticsService';
import './VoiceAnalyticsDisplay.css';

interface VoiceAnalyticsDisplayProps {
  metrics: VoiceMetrics;
  overallScore: number;
  realtimeFeedback: string | null;
  isVisible: boolean;
}

export const VoiceAnalyticsDisplay: React.FC<VoiceAnalyticsDisplayProps> = ({
  metrics,
  overallScore,
  realtimeFeedback,
  isVisible
}) => {
  if (!isVisible) return null;

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#10a37f';
    if (score >= 60) return '#fbbf24';
    return '#ef4444';
  };

  const getPaceLabel = (wpm: number): string => {
    if (wpm < 100) return 'Langsam';
    if (wpm > 180) return 'Schnell';
    return 'Optimal';
  };

  const getPaceColor = (wpm: number): string => {
    if (wpm < 100 || wpm > 180) return '#fbbf24';
    return '#10a37f';
  };

  return (
    <div className="voice-analytics-display">
      {/* Real-time Feedback Banner */}
      {realtimeFeedback && (
        <div className="feedback-banner">
          {realtimeFeedback}
        </div>
      )}

      {/* Overall Score */}
      <div className="analytics-header">
        <div className="overall-score">
          <div 
            className="score-circle"
            style={{ 
              background: `conic-gradient(${getScoreColor(overallScore)} ${overallScore}%, #e5e7eb ${overallScore}%)`
            }}
          >
            <div className="score-inner">
              <span className="score-value">{overallScore}</span>
              <span className="score-label">Score</span>
            </div>
          </div>
        </div>

        <div className="metrics-summary">
          <h4>Sprach-Analyse</h4>
          <p className="metrics-hint">Live-Feedback zu deiner Sprechweise</p>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="metrics-grid">
        {/* Speech Pace */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">⚡</span>
            <span className="metric-label">Sprechtempo</span>
          </div>
          <div className="metric-value" style={{ color: getPaceColor(metrics.speechPace) }}>
            {metrics.speechPace} WPM
          </div>
          <div className="metric-sublabel">
            {getPaceLabel(metrics.speechPace)}
          </div>
          <div className="metric-bar">
            <div 
              className="metric-bar-fill"
              style={{ 
                width: `${Math.min(100, (metrics.speechPace / 200) * 100)}%`,
                backgroundColor: getPaceColor(metrics.speechPace)
              }}
            />
          </div>
        </div>

        {/* Filler Words */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">💬</span>
            <span className="metric-label">Füllwörter</span>
          </div>
          <div className="metric-value" style={{ color: metrics.fillerWords > 5 ? '#ef4444' : '#10a37f' }}>
            {metrics.fillerWords}
          </div>
          <div className="metric-sublabel">
            {metrics.fillerWords === 0 ? 'Perfekt!' : metrics.fillerWords < 3 ? 'Gut' : 'Vermeide mehr'}
          </div>
        </div>

        {/* Pause Duration */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">⏸️</span>
            <span className="metric-label">Ø Pause</span>
          </div>
          <div className="metric-value">
            {metrics.pauseDuration.toFixed(1)}s
          </div>
          <div className="metric-sublabel">
            {metrics.pauseDuration < 0.5 ? 'Sehr kurz' : metrics.pauseDuration > 2 ? 'Zu lang' : 'Optimal'}
          </div>
        </div>

        {/* Tone Confidence */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">🎯</span>
            <span className="metric-label">Selbstbewusstsein</span>
          </div>
          <div className="metric-value" style={{ color: getScoreColor(metrics.toneConfidence) }}>
            {metrics.toneConfidence}%
          </div>
          <div className="metric-sublabel">
            {metrics.toneConfidence >= 80 ? 'Stark' : metrics.toneConfidence >= 60 ? 'Gut' : 'Übe weiter'}
          </div>
          <div className="metric-bar">
            <div 
              className="metric-bar-fill"
              style={{ 
                width: `${metrics.toneConfidence}%`,
                backgroundColor: getScoreColor(metrics.toneConfidence)
              }}
            />
          </div>
        </div>

        {/* Clarity */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">✨</span>
            <span className="metric-label">Klarheit</span>
          </div>
          <div className="metric-value" style={{ color: getScoreColor(metrics.clarity) }}>
            {metrics.clarity}%
          </div>
          <div className="metric-sublabel">
            {metrics.clarity >= 80 ? 'Sehr klar' : metrics.clarity >= 60 ? 'Gut verständlich' : 'Übe weiter'}
          </div>
          <div className="metric-bar">
            <div 
              className="metric-bar-fill"
              style={{ 
                width: `${metrics.clarity}%`,
                backgroundColor: getScoreColor(metrics.clarity)
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
