import { useState } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

export const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-left">
            <div className="nav-logo">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="6" fill="url(#gradient1)"/>
                <path d="M14 8L19 12L14 16L14 8Z" fill="white" opacity="0.9"/>
                <path d="M9 12L14 16L14 20L9 12Z" fill="white" opacity="0.7"/>
                <defs>
                  <linearGradient id="gradient1" x1="0" y1="0" x2="28" y2="28">
                    <stop offset="0%" stopColor="#667eea"/>
                    <stop offset="100%" stopColor="#764ba2"/>
                  </linearGradient>
                </defs>
              </svg>
              <span>CareerSIM</span>
            </div>
          </div>
          
          <div className={`nav-center ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <a href="#features">Features</a>
            <a href="#for-universities">Universitäten</a>
            <a href="#for-companies">Unternehmen</a>
            <a href="#for-students">Studenten</a>
            <a href="#pricing">Pricing</a>
            <a href="#updates">Updates</a>
            <a href="#contact">Kontakt</a>
          </div>

          <div className="nav-right">
            <Link to="/login" className="nav-login-btn">
              <span>Log in</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 12L10 8L6 4"/>
              </svg>
            </Link>
          </div>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L9.5 6.5L14 8L9.5 9.5L8 14L6.5 9.5L2 8L6.5 6.5L8 2Z" fill="currentColor"/>
            </svg>
            <span>Powered by GPT-5.1</span>
          </div>
          <h1 className="hero-title">
            KI-gestütztes Interview-Training für deine Traumkarriere
          </h1>
          <p className="hero-subtitle">
            CareerSIM nutzt modernste KI-Technologie für personalisierte Interview-Trainings 
            und Karriereberatung. Realistische Simulationen mit sofortigem Feedback.
          </p>
          <div className="hero-actions">
            <Link to="/login" className="btn-hero-primary">Jetzt starten</Link>
            <a href="#features" className="btn-hero-secondary">Mehr erfahren</a>
          </div>
        </div>
      </section>

      <section id="features" className="features-section">
        <div className="section-container">
          <h2 className="section-title">Intelligente Features für deinen Erfolg</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎤</div>
              <h3>KI-Interview-Training</h3>
              <p>Realistische Interviews mit KI-Persona und sofortigem Feedback.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Karriereberatung</h3>
              <p>Individueller Karriereplan basierend auf deinen Stärken.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Analytics</h3>
              <p>Detaillierte Analysen zu deiner Performance.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Echtzeit-Feedback</h3>
              <p>Sofortige Bewertung deiner Antworten und Kommunikation.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📄</div>
              <h3>CV-Analyse</h3>
              <p>KI-gestützte Optimierung deines Lebenslaufs.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Fortschritt-Tracking</h3>
              <p>Verfolge deine Verbesserungen systematisch.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="for-universities" className="audience-section">
        <div className="section-container">
          <div className="audience-grid">
            <div className="audience-content">
              <span className="audience-tag">Für Universitäten</span>
              <h2>Bereite Studierende optimal auf den Berufseinstieg vor</h2>
              <p>
                CareerSIM bietet Universitäten eine skalierbare Lösung für professionelles 
                Interview-Training. Integrieren Sie KI-gestütztes Karriere-Coaching direkt in 
                Ihr Career-Center.
              </p>
              <ul className="benefit-list">
                <li>✓ Unbegrenzte Studenten-Accounts</li>
                <li>✓ Analytics Dashboard für Career Services</li>
                <li>✓ White-Label & Branding Optionen</li>
                <li>✓ Dedizierter Support</li>
              </ul>
              <a href="#contact" className="btn-audience">Kontaktiere uns</a>
            </div>
            <div className="audience-visual">
              <div className="stats-card">
                <div className="stat-number">94%</div>
                <div className="stat-label">Erfolgsrate</div>
              </div>
              <div className="stats-card">
                <div className="stat-number">15k+</div>
                <div className="stat-label">Studierende</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="for-companies" className="audience-section dark">
        <div className="section-container">
          <div className="audience-grid reverse">
            <div className="audience-visual">
              <div className="stats-card">
                <div className="stat-number">60%</div>
                <div className="stat-label">Zeit gespart</div>
              </div>
              <div className="stats-card">
                <div className="stat-number">85%</div>
                <div className="stat-label">Bessere Matches</div>
              </div>
            </div>
            <div className="audience-content">
              <span className="audience-tag">Für Unternehmen</span>
              <h2>Finde die besten Talente effizienter</h2>
              <p>
                Nutze CareerSIM für dein Recruiting. Lasse Kandidaten vor dem ersten Gespräch 
                ihre Skills unter Beweis stellen und spare Zeit im Hiring-Prozess.
              </p>
              <ul className="benefit-list">
                <li>✓ Pre-Screening mit KI-Interviews</li>
                <li>✓ Detaillierte Kandidaten-Analysen</li>
                <li>✓ Anpassbare Interview-Szenarien</li>
                <li>✓ HR-Tool Integration</li>
              </ul>
              <a href="#contact" className="btn-audience">Demo vereinbaren</a>
            </div>
          </div>
        </div>
      </section>

      <section id="for-students" className="audience-section">
        <div className="section-container">
          <div className="audience-grid">
            <div className="audience-content">
              <span className="audience-tag">Für Studenten</span>
              <h2>Starte deine Karriere mit Selbstvertrauen</h2>
              <p>
                Bereite dich optimal auf dein erstes Bewerbungsgespräch vor. Mit CareerSIM 
                übst du in einer sicheren Umgebung und bekommst professionelles Feedback.
              </p>
              <ul className="benefit-list">
                <li>✓ Kostenlose Basis-Version</li>
                <li>✓ Übe für verschiedene Branchen</li>
                <li>✓ Personalisiertes Coaching</li>
                <li>✓ Sofortiges Feedback</li>
              </ul>
              <Link to="/login" className="btn-audience">Kostenlos starten</Link>
            </div>
            <div className="audience-visual">
              <div className="stats-card">
                <div className="stat-number">50k+</div>
                <div className="stat-label">Interviews geübt</div>
              </div>
              <div className="stats-card">
                <div className="stat-number">91%</div>
                <div className="stat-label">Erfolgsquote</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="pricing-section">
        <div className="section-container">
          <h2 className="section-title">Transparente Preise</h2>
          <p className="section-subtitle">Wähle das Modell, das am besten zu dir passt</p>
          <div className="pricing-grid">
            <div className="pricing-card">
              <h3>Studenten</h3>
              <div className="price">€0<span>/Monat</span></div>
              <ul className="feature-list">
                <li>✓ 5 Interviews pro Monat</li>
                <li>✓ Basis-Feedback</li>
                <li>✓ CV-Analyse</li>
                <li className="disabled">✗ Erweiterte Analytics</li>
              </ul>
              <Link to="/login" className="pricing-cta">Jetzt starten</Link>
            </div>
            <div className="pricing-card featured">
              <div className="popular-badge">Beliebt</div>
              <h3>Professional</h3>
              <div className="price">€19<span>/Monat</span></div>
              <ul className="feature-list">
                <li>✓ Unbegrenzte Interviews</li>
                <li>✓ Detailliertes Feedback</li>
                <li>✓ CV-Optimierung</li>
                <li>✓ Performance Analytics</li>
                <li>✓ Prioritäts-Support</li>
              </ul>
              <Link to="/login" className="pricing-cta">Jetzt starten</Link>
            </div>
            <div className="pricing-card">
              <h3>Enterprise</h3>
              <div className="price">Custom</div>
              <ul className="feature-list">
                <li>✓ Alle Professional Features</li>
                <li>✓ White-Label Lösung</li>
                <li>✓ API-Zugang</li>
                <li>✓ Account Manager</li>
                <li>✓ Custom Training</li>
              </ul>
              <a href="#contact" className="pricing-cta">Kontakt aufnehmen</a>
            </div>
          </div>
        </div>
      </section>

      <section id="updates" className="updates-section">
        <div className="section-container">
          <h2 className="section-title">Neueste Updates</h2>
          <p className="section-subtitle">Bleibe auf dem Laufenden über neue Features</p>
          <div className="updates-grid">
            <article className="update-card">
              <div className="update-header">
                <span className="update-badge">Feature Release</span>
                <span className="update-date">15. Nov 2025</span>
              </div>
              <h3>GPT-5.1 Integration</h3>
              <p>
                Noch natürlichere Gespräche und präziseres Feedback durch das neueste 
                GPT-5.1 Modell.
              </p>
              <div className="update-tags">
                <span className="tag">AI</span>
                <span className="tag">Performance</span>
              </div>
            </article>

            <article className="update-card">
              <div className="update-header">
                <span className="update-badge new">New Feature</span>
                <span className="update-date">8. Nov 2025</span>
              </div>
              <h3>Voice Analytics Dashboard</h3>
              <p>
                Analysiere Sprachmuster, Tempo und Tonalität mit detaillierten Einblicken 
                in deine Kommunikation.
              </p>
              <div className="update-tags">
                <span className="tag">Analytics</span>
                <span className="tag">Voice</span>
              </div>
            </article>

            <article className="update-card">
              <div className="update-header">
                <span className="update-badge improvement">Improvement</span>
                <span className="update-date">1. Nov 2025</span>
              </div>
              <h3>Mobile App Beta</h3>
              <p>
                CareerSIM ist jetzt auch unterwegs nutzbar. Die Beta-Version unserer 
                Mobile App ist verfügbar.
              </p>
              <div className="update-tags">
                <span className="tag">Mobile</span>
                <span className="tag">Beta</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="contact" className="contact-section">
        <div className="section-container">
          <div className="contact-grid">
            <div className="contact-info">
              <h2>Lass uns sprechen</h2>
              <p>
                Hast du Fragen zu CareerSIM? Möchtest du eine Demo oder Partnership besprechen? 
                Wir freuen uns auf deine Nachricht.
              </p>
              <div className="contact-methods">
                <div className="contact-method">
                  <div className="method-icon">📧</div>
                  <div>
                    <div className="method-label">Email</div>
                    <div className="method-value">hello@careersim.io</div>
                  </div>
                </div>
                <div className="contact-method">
                  <div className="method-icon">📞</div>
                  <div>
                    <div className="method-label">Telefon</div>
                    <div className="method-value">+49 (0) 123 456789</div>
                  </div>
                </div>
              </div>
            </div>
            <form className="contact-form">
              <div className="form-row">
                <input type="text" placeholder="Name" className="form-input" />
                <input type="email" placeholder="Email" className="form-input" />
              </div>
              <input type="text" placeholder="Organisation (optional)" className="form-input" />
              <textarea placeholder="Nachricht" rows={5} className="form-input"></textarea>
              <button type="submit" className="form-submit">Nachricht senden</button>
            </form>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-column">
              <div className="footer-logo">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <rect width="28" height="28" rx="6" fill="url(#gradient2)"/>
                  <path d="M14 8L19 12L14 16L14 8Z" fill="white" opacity="0.9"/>
                  <path d="M9 12L14 16L14 20L9 12Z" fill="white" opacity="0.7"/>
                  <defs>
                    <linearGradient id="gradient2" x1="0" y1="0" x2="28" y2="28">
                      <stop offset="0%" stopColor="#667eea"/>
                      <stop offset="100%" stopColor="#764ba2"/>
                    </linearGradient>
                  </defs>
                </svg>
                <span>CareerSIM</span>
              </div>
              <p>KI-gestütztes Interview-Training für deine erfolgreiche Karriere.</p>
            </div>
            <div className="footer-column">
              <h4>Produkt</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#updates">Updates</a>
              <Link to="/login">Login</Link>
            </div>
            <div className="footer-column">
              <h4>Lösungen</h4>
              <a href="#for-students">Studenten</a>
              <a href="#for-universities">Universitäten</a>
              <a href="#for-companies">Unternehmen</a>
            </div>
            <div className="footer-column">
              <h4>Unternehmen</h4>
              <a href="#contact">Kontakt</a>
              <a href="#">Datenschutz</a>
              <a href="#">AGB</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 CareerSIM. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
