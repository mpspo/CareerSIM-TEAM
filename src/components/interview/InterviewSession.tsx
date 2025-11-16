import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './InterviewSession.css';

interface InterviewConfig {
  personaId?: string;
  company: string;
  role: string;
  duration: number;
  difficulty: number;
  focusAreas: string[];
}

interface Message {
  id: string;
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: Date;
  feedback?: string;
}

type InterviewPhase = 'intro' | 'questions' | 'closing' | 'completed';

export function InterviewSession() {
  const location = useLocation();
  const navigate = useNavigate();
  const config = location.state?.config as InterviewConfig;

  const [sessionId] = useState<string>(() => `session-${Date.now()}`);
  const [phase, setPhase] = useState<InterviewPhase>('intro');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout>();

  // Initialize interview
  useEffect(() => {
    if (!config) {
      navigate('/interview/setup');
      return;
    }

    startInterview();

    // Start timer
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setTimeElapsed(elapsed);

      // Auto-end if duration exceeded
      if (elapsed >= config.duration * 60) {
        handleEndInterview();
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startInterview = async () => {
    // Add welcome message
    addMessage('interviewer', getWelcomeMessage());

    // Wait 2 seconds, then start first question
    setTimeout(() => {
      setPhase('questions');
      askNextQuestion();
    }, 2000);
  };

  const getWelcomeMessage = (): string => {
    return `Hallo! Schön, dass du heute hier bist. Ich freue mich auf unser Gespräch über die Position als ${config.role} bei ${config.company}. 

Lass uns direkt loslegen. Bitte nimm dir Zeit für deine Antworten und nutze die STAR-Methode (Situation, Task, Action, Result), wo es passt.

Bereit? Dann starten wir!`;
  };

  const askNextQuestion = async () => {
    setIsProcessing(true);

    try {
      // TODO: Call RAG service to get contextual question
      // For now, use predefined questions
      const questions = [
        `Erzähl mir zunächst etwas über dich und deinen Hintergrund. Wie hat dich dein Werdegang auf die Position als ${config.role} vorbereitet?`,
        `Warum interessierst du dich speziell für ${config.company} und was weißt du über unsere Unternehmenskultur?`,
        'Beschreibe eine Situation, in der du ein komplexes Problem in einem Team gelöst hast. Wie bist du vorgegangen?',
        'Wie gehst du mit konstruktivem Feedback um? Kannst du ein konkretes Beispiel nennen?',
        `Was sind deine größten Stärken für die Position als ${config.role} und wie möchtest du dich weiterentwickeln?`,
      ];

      const question = questions[questionIndex] || 'Hast du noch Fragen an mich?';
      setCurrentQuestion(question);
      addMessage('interviewer', question);
      setQuestionIndex(questionIndex + 1);

      // Check if this is the last question
      if (questionIndex >= questions.length - 1) {
        setTimeout(() => {
          setPhase('closing');
        }, 100);
      }
    } catch (error) {
      console.error('Error getting next question:', error);
      addMessage('interviewer', 'Entschuldigung, es gab einen technischen Fehler. Kannst du deine letzte Antwort wiederholen?');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) return;

    setIsProcessing(true);
    const answer = userAnswer.trim();
    setUserAnswer('');

    // Add user's answer
    addMessage('candidate', answer);

    try {
      // Get feedback from backend
      const response = await fetch('http://localhost:3000/api/interview/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add auth token
        },
        body: JSON.stringify({
          interviewId: sessionId,
          answer: answer,
        }),
      });

      const data = await response.json();

      // Add immediate feedback if available
      if (data.feedback) {
        setTimeout(() => {
          addMessage('interviewer', `📝 Feedback: ${data.feedback}`, data.feedback);
        }, 1000);
      }

      // Ask next question or end interview
      if (data.done || phase === 'closing') {
        setTimeout(() => {
          handleEndInterview();
        }, 2000);
      } else {
        setTimeout(() => {
          askNextQuestion();
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      addMessage('interviewer', 'Danke für deine Antwort. Lass uns mit der nächsten Frage fortfahren.');
      
      setTimeout(() => {
        if (phase === 'closing') {
          handleEndInterview();
        } else {
          askNextQuestion();
        }
      }, 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEndInterview = () => {
    setPhase('completed');
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    addMessage('interviewer', `Vielen Dank für das Gespräch! Das war's für heute. Ich leite dich jetzt zur detaillierten Auswertung weiter.`);

    // Navigate to feedback after 3 seconds
    setTimeout(() => {
      navigate(`/interview/feedback/${sessionId}`, {
        state: { config, messages, timeElapsed },
      });
    }, 3000);
  };

  const addMessage = (role: 'interviewer' | 'candidate', content: string, feedback?: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      role,
      content,
      timestamp: new Date(),
      feedback,
    };

    setMessages((prev) => [...prev, newMessage]);
  };

  const toggleRecording = () => {
    // TODO: Implement voice recording with OpenAI Realtime API
    setIsRecording(!isRecording);
    
    if (!isRecording) {
      // Start recording
      console.log('Start recording...');
    } else {
      // Stop recording and transcribe
      console.log('Stop recording...');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRemainingTime = (): number => {
    return Math.max(0, config.duration * 60 - timeElapsed);
  };

  const getProgressPercentage = (): number => {
    return Math.min(100, (timeElapsed / (config.duration * 60)) * 100);
  };

  if (!config) {
    return null;
  }

  return (
    <div className="interview-session">
      {/* Header */}
      <div className="session-header">
        <div className="header-info">
          <h2>{config.role} Interview</h2>
          <p>{config.company}</p>
        </div>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-label">Zeit</span>
            <span className="stat-value">{formatTime(timeElapsed)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Verbleibend</span>
            <span className="stat-value remaining">{formatTime(getRemainingTime())}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Fragen</span>
            <span className="stat-value">{questionIndex}/5</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${getProgressPercentage()}%` }}></div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="message-avatar">
              {message.role === 'interviewer' ? '👤' : '🙋'}
            </div>
            <div className="message-content">
              <div className="message-header">
                <span className="message-role">
                  {message.role === 'interviewer' ? 'Interviewer' : 'Du'}
                </span>
                <span className="message-time">
                  {message.timestamp.toLocaleTimeString('de-DE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="message-text">{message.content}</div>
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="message interviewer">
            <div className="message-avatar">👤</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {phase !== 'completed' && (
        <div className="input-container">
          <div className="input-wrapper">
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitAnswer();
                }
              }}
              placeholder="Schreibe deine Antwort hier... (Enter zum Senden, Shift+Enter für neue Zeile)"
              disabled={isProcessing || phase === 'intro'}
              rows={3}
            />
            <div className="input-actions">
              <button
                className={`btn-voice ${isRecording ? 'recording' : ''}`}
                onClick={toggleRecording}
                disabled={isProcessing || phase === 'intro'}
                title="Spracheingabe (Coming Soon)"
              >
                {isRecording ? '⏹️ Stop' : '🎤 Sprechen'}
              </button>
              <button
                className="btn-send"
                onClick={handleSubmitAnswer}
                disabled={!userAnswer.trim() || isProcessing || phase === 'intro'}
              >
                Senden →
              </button>
            </div>
          </div>

          {/* Tips */}
          <div className="input-tips">
            <p>
              💡 <strong>Tipp:</strong> Nutze die STAR-Methode: Beschreibe die{' '}
              <strong>Situation</strong>, deine <strong>Aufgabe</strong>, deine{' '}
              <strong>Aktion</strong> und das <strong>Ergebnis</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Emergency Exit */}
      <button
        className="btn-exit"
        onClick={() => {
          if (confirm('Möchtest du das Interview wirklich beenden?')) {
            handleEndInterview();
          }
        }}
      >
        Interview beenden
      </button>
    </div>
  );
}
