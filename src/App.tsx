import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './clients/SupabaseClient';
import { MainLayout } from './components/common/MainLayout';
import { CareerDashboard } from './components/dashboard/CareerDashboard';
import { InterviewSetup } from './components/interview/InterviewSetup';
import { InterviewSession } from './components/interview/InterviewSession';
import { FeedbackView } from './components/interview/FeedbackView';
import { CareerRecommendations } from './components/career/CareerRecommendations';
import { ProgressDashboard } from './components/progress/ProgressDashboard';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { Profile } from './components/auth/Profile';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#667eea'
      }}>
        Wird geladen...
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes with Layout */}
          {isAuthenticated ? (
            <Route element={<MainLayout />}>
              <Route path="/" element={<Navigate to="/career" />} />

              {/* ⭐ Career Coach - Hauptbereich 1 */}
              <Route path="/career" element={<CareerDashboard />} />
              <Route path="/career/recommendations" element={<CareerRecommendations />} />

              {/* ⭐ Interview Training - Hauptbereich 2 */}
              <Route
                path="/interview"
                element={
                  <div style={{ padding: '40px' }}>
                    <h1>Interview-Training</h1>
                    <p>Starte ein neues Mock-Interview</p>
                    <button
                      onClick={() => (window.location.href = '/interview/setup')}
                      style={{
                        padding: '12px 24px',
                        background: '#10a37f',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginTop: '20px',
                      }}
                    >
                      Neues Interview konfigurieren →
                    </button>
                  </div>
                }
              />

              <Route path="/interview/setup" element={<InterviewSetup />} />

              <Route path="/interview/session" element={<InterviewSession />} />

              <Route
                path="/interview/session/:id"
                element={<div>Interview Session (Legacy Route)</div>}
              />

              <Route
                path="/interview/feedback/:id"
                element={<FeedbackView />}
              />

              <Route
                path="/dashboard"
                element={<ProgressDashboard />}
              />

              <Route
                path="/profile"
                element={<Profile />}
              />

              <Route
                path="/account-settings"
                element={<Profile />}
              />
            </Route>
          ) : (
            <Route path="*" element={<Navigate to="/login" />} />
          )}

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
