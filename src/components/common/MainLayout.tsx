import { ReactNode } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import './MainLayout.css';

interface MainLayoutProps {
  children?: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="main-layout">
      {/* Left Navigation */}
      <nav className="main-nav">
        <div className="nav-header">
          <h1 className="nav-logo">CareerSIM</h1>
          <p className="nav-subtitle">KI-Karriereplattform</p>
        </div>

        <div className="nav-section">
          <h3 className="nav-section-title">Hauptbereiche</h3>
          <Link
            to="/interview"
            className={`nav-link ${isActive('/interview') ? 'active' : ''}`}
          >
            <span className="nav-icon">🎤</span>
            <span>Interview-Training</span>
          </Link>

          <Link
            to="/career"
            className={`nav-link ${isActive('/career') ? 'active' : ''}`}
          >
            <span className="nav-icon">🎯</span>
            <span>Karriere-Coach</span>
          </Link>
        </div>

        <div className="nav-section">
          <h3 className="nav-section-title">Weitere</h3>
          <Link
            to="/dashboard"
            className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
          >
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </Link>

          <Link
            to="/account-settings"
            className={`nav-link ${isActive('/account-settings') ? 'active' : ''}`}
          >
            <span className="nav-icon">⚙️</span>
            <span>Einstellungen</span>
          </Link>
        </div>

        <div className="nav-footer">
          <button className="nav-link logout-btn">
            <span className="nav-icon">🚪</span>
            <span>Abmelden</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {children || <Outlet />}
      </main>
    </div>
  );
};
