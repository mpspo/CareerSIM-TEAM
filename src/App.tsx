import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './clients/SupabaseClient';
import { MainLayout } from './components/common/MainLayout';
import { CareerDashboard } from './components/dashboard/CareerDashboard';
import { InterviewSetup } from './components/interview/InterviewSetup';
import { InterviewSession } from './components/interview/InterviewSession';
import { FeedbackView } from './components/interview/FeedbackView';

// Components (will be created in next phases)
// import Dashboard from './components/dashboard/Dashboard';
// import Login from './components/auth/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
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

  if (isAuthenticated === null) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Lädt...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <div>
                <h1>Login Page (Coming Soon)</h1>
                <p>Legacy login still available at /public/login.html</p>
              </div>
            }
          />

          {/* Protected Routes with Layout */}
          {isAuthenticated ? (
            <Route element={<MainLayout children={undefined} />}>
              <Route path="/" element={<Navigate to="/career" />} />

              {/* ⭐ Career Coach - Hauptbereich 1 */}
              <Route path="/career" element={<CareerDashboard />} />

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
                element={
                  <div style={{ padding: '40px' }}>
                    <h1>Dashboard</h1>
                    <p>Übersicht über beide Bereiche</p>
                  </div>
                }
              />

              <Route
                path="/account-settings"
                element={
                  <div style={{ padding: '40px' }}>
                    <h1>Account Settings</h1>
                    <p>Legacy: /public/account-settings.html</p>
                  </div>
                }
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
