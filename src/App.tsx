import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './clients/SupabaseClient';

// Components (will be created in next phases)
// import Dashboard from './components/dashboard/Dashboard';
// import InterviewSetup from './components/interview/setup/SetupWizard';
// import InterviewSession from './components/interview/session/InterviewSession';
// import FeedbackView from './components/interview/feedback/FeedbackView';
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

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <div>
                  <h1>CareerSIM - Dashboard</h1>
                  <p>TypeScript + React Version is ready!</p>
                  <p>Legacy app still available at /public/index.html</p>
                </div>
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/interview/setup"
            element={
              isAuthenticated ? (
                <div>Interview Setup (Coming Soon)</div>
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/interview/session/:id"
            element={
              isAuthenticated ? (
                <div>Interview Session (Coming Soon)</div>
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/interview/feedback/:id"
            element={
              isAuthenticated ? (
                <div>Feedback View (Coming Soon)</div>
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
