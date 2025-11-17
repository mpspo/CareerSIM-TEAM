/**
 * Voice Analytics Service
 * Analyzes speech patterns during voice interviews
 */

export interface VoiceMetrics {
  speechPace: number; // words per minute
  fillerWords: number; // count of filler words
  pauseDuration: number; // average pause duration in seconds
  toneConfidence: number; // 0-100 score
  clarity: number; // 0-100 score
}

export interface FillerWord {
  word: string;
  timestamp: number;
  count: number;
}

export interface VoiceAnalytics {
  metrics: VoiceMetrics;
  fillerWords: FillerWord[];
  speechSegments: SpeechSegment[];
  overallScore: number;
}

export interface SpeechSegment {
  text: string;
  startTime: number;
  endTime: number;
  wordsPerMinute: number;
  fillerCount: number;
}

class VoiceAnalyticsService {
  private fillerWordPatterns = [
    'um', 'uh', 'like', 'you know', 'basically', 'actually',
    'literally', 'sort of', 'kind of', 'i mean', 'so', 'well'
  ];

  private speechSegments: SpeechSegment[] = [];
  private fillerWordsDetected: Map<string, FillerWord> = new Map();
  private startTime: number = 0;
  private totalWords: number = 0;
  private totalPauseDuration: number = 0;
  private pauseCount: number = 0;
  private lastSpeechTime: number = 0;

  /**
   * Initialize analytics session
   */
  startSession(): void {
    this.startTime = Date.now();
    this.speechSegments = [];
    this.fillerWordsDetected.clear();
    this.totalWords = 0;
    this.totalPauseDuration = 0;
    this.pauseCount = 0;
    this.lastSpeechTime = Date.now();
  }

  /**
   * Analyze a speech transcript segment
   */
  analyzeTranscript(text: string, timestamp: number): void {
    const segmentStart = this.lastSpeechTime;
    const segmentEnd = timestamp;
    const segmentDuration = (segmentEnd - segmentStart) / 1000; // seconds

    // Calculate pause duration
    if (this.lastSpeechTime > 0 && segmentDuration > 1) {
      this.totalPauseDuration += segmentDuration;
      this.pauseCount++;
    }

    // Count words
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    this.totalWords += wordCount;

    // Calculate words per minute for this segment
    const wordsPerMinute = segmentDuration > 0 
      ? Math.round((wordCount / segmentDuration) * 60) 
      : 0;

    // Detect filler words
    const fillerCount = this.detectFillerWords(text, timestamp);

    // Store segment
    this.speechSegments.push({
      text,
      startTime: segmentStart,
      endTime: segmentEnd,
      wordsPerMinute,
      fillerCount
    });

    this.lastSpeechTime = timestamp;
  }

  /**
   * Detect filler words in text
   */
  private detectFillerWords(text: string, timestamp: number): number {
    const lowerText = text.toLowerCase();
    let count = 0;

    for (const filler of this.fillerWordPatterns) {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      const matches = lowerText.match(regex);
      
      if (matches) {
        count += matches.length;
        
        const existing = this.fillerWordsDetected.get(filler);
        if (existing) {
          existing.count += matches.length;
          existing.timestamp = timestamp;
        } else {
          this.fillerWordsDetected.set(filler, {
            word: filler,
            timestamp,
            count: matches.length
          });
        }
      }
    }

    return count;
  }

  /**
   * Calculate overall speech pace (WPM)
   */
  private calculateSpeechPace(): number {
    const totalDuration = (Date.now() - this.startTime) / 1000 / 60; // minutes
    
    if (totalDuration === 0) return 0;
    
    const wpm = Math.round(this.totalWords / totalDuration);
    
    // Typical conversational pace: 120-150 WPM
    // Too slow: < 100, Too fast: > 180
    return Math.min(wpm, 250); // Cap at 250 WPM
  }

  /**
   * Calculate tone confidence score
   */
  private calculateToneConfidence(): number {
    // Based on speech pace and filler words
    const wpm = this.calculateSpeechPace();
    const totalFillers = Array.from(this.fillerWordsDetected.values())
      .reduce((sum, f) => sum + f.count, 0);
    
    // Ideal pace: 120-150 WPM
    let paceScore = 100;
    if (wpm < 100) {
      paceScore = Math.max(50, 100 - (100 - wpm) * 0.5);
    } else if (wpm > 180) {
      paceScore = Math.max(50, 100 - (wpm - 180) * 0.5);
    }

    // Filler word penalty
    const fillerRatio = this.totalWords > 0 ? totalFillers / this.totalWords : 0;
    const fillerScore = Math.max(0, 100 - fillerRatio * 500);

    // Average pause duration (ideal: 0.5-1.5 seconds)
    const avgPause = this.pauseCount > 0 
      ? this.totalPauseDuration / this.pauseCount 
      : 1;
    let pauseScore = 100;
    if (avgPause > 2) {
      pauseScore = Math.max(50, 100 - (avgPause - 2) * 25);
    } else if (avgPause < 0.3) {
      pauseScore = Math.max(70, 100 - (0.3 - avgPause) * 100);
    }

    // Weighted average
    return Math.round(paceScore * 0.4 + fillerScore * 0.4 + pauseScore * 0.2);
  }

  /**
   * Calculate clarity score
   */
  private calculateClarity(): number {
    // Based on consistent pace and minimal filler words
    const segments = this.speechSegments;
    if (segments.length === 0) return 100;

    // Calculate variance in speech pace
    const wpms = segments.map(s => s.wordsPerMinute);
    const avgWpm = wpms.reduce((a, b) => a + b, 0) / wpms.length;
    const variance = wpms.reduce((sum, wpm) => sum + Math.pow(wpm - avgWpm, 2), 0) / wpms.length;
    const stdDev = Math.sqrt(variance);

    // Lower variance = more consistent = higher clarity
    const consistencyScore = Math.max(0, 100 - stdDev * 0.5);

    // Filler word ratio
    const totalFillers = Array.from(this.fillerWordsDetected.values())
      .reduce((sum, f) => sum + f.count, 0);
    const fillerRatio = this.totalWords > 0 ? totalFillers / this.totalWords : 0;
    const fillerScore = Math.max(0, 100 - fillerRatio * 400);

    return Math.round(consistencyScore * 0.6 + fillerScore * 0.4);
  }

  /**
   * Get current analytics
   */
  getAnalytics(): VoiceAnalytics {
    const speechPace = this.calculateSpeechPace();
    const toneConfidence = this.calculateToneConfidence();
    const clarity = this.calculateClarity();
    
    const totalFillers = Array.from(this.fillerWordsDetected.values())
      .reduce((sum, f) => sum + f.count, 0);
    
    const avgPause = this.pauseCount > 0 
      ? this.totalPauseDuration / this.pauseCount 
      : 0;

    const metrics: VoiceMetrics = {
      speechPace,
      fillerWords: totalFillers,
      pauseDuration: Math.round(avgPause * 100) / 100,
      toneConfidence,
      clarity
    };

    const overallScore = Math.round(
      (toneConfidence * 0.5) + (clarity * 0.5)
    );

    return {
      metrics,
      fillerWords: Array.from(this.fillerWordsDetected.values()),
      speechSegments: this.speechSegments,
      overallScore
    };
  }

  /**
   * Get real-time feedback message
   */
  getRealtimeFeedback(): string | null {
    const analytics = this.getAnalytics();
    const { metrics } = analytics;

    // Too fast
    if (metrics.speechPace > 180) {
      return '🎯 Tipp: Versuche etwas langsamer zu sprechen';
    }

    // Too slow
    if (metrics.speechPace < 100 && this.totalWords > 20) {
      return '⚡ Tipp: Du kannst gerne etwas schneller sprechen';
    }

    // Too many filler words
    const fillerRatio = this.totalWords > 0 ? metrics.fillerWords / this.totalWords : 0;
    if (fillerRatio > 0.1 && this.totalWords > 30) {
      return '💬 Tipp: Vermeide Füllwörter wie "ähm" oder "also"';
    }

    // Long pauses
    if (metrics.pauseDuration > 2.5 && this.pauseCount > 3) {
      return '⏸️ Tipp: Versuche Pausen kürzer zu halten';
    }

    // Doing well
    if (analytics.overallScore > 80 && this.totalWords > 50) {
      return '✨ Großartig! Du sprichst sehr klar und selbstbewusst';
    }

    return null;
  }

  /**
   * Reset analytics
   */
  reset(): void {
    this.speechSegments = [];
    this.fillerWordsDetected.clear();
    this.totalWords = 0;
    this.totalPauseDuration = 0;
    this.pauseCount = 0;
    this.startTime = 0;
    this.lastSpeechTime = 0;
  }
}

export const voiceAnalyticsService = new VoiceAnalyticsService();
