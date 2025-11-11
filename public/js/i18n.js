// Internationalization System
const translations = {
  de: {
    // Navigation
    nav_home: 'Startseite',
    nav_features: 'Funktionen',
    nav_pricing: 'Preise',
    nav_about: 'Über uns',
    nav_contact: 'Kontakt',
    nav_students: 'Für Studierende',
    nav_universities: 'Für Hochschulen',
    nav_companies: 'Für Unternehmen',
    nav_login: 'Anmelden',
    nav_signup: 'Registrieren',
    nav_dashboard: 'Dashboard',
    nav_start_interview: 'Interview Simulation',
    nav_logout: 'Abmelden',
    
    // Home Page
    home_hero_title: 'KI-gestützte Interview-Vorbereitung für deinen Karriere-Erfolg',
    home_hero_subtitle: 'Meistere Bewerbungsgespräche mit unserer fortschrittlichen KI. Übe realistische Interviews, erhalte sofortiges Feedback und steigere deine Performance.',
    home_cta_start: 'Jetzt starten',
    home_cta_learn: 'Mehr erfahren',
    home_trusted: 'Vertraut von 10.000+ Studierenden',
    
    // Features
    feature_ai_interview: 'KI-Interview Simulator',
    feature_ai_interview_desc: 'Realistische Interview-Szenarien powered by künstlicher Intelligenz',
    feature_ai_coaching: 'KI-Karriereberatung',
    feature_ai_coaching_desc: 'Personalisierte Karriereempfehlungen basierend auf deinen Stärken',
    feature_speech: 'Speech Recognition',
    feature_speech_desc: 'Antworte mündlich und erhalte Echtzeit-Transkription',
    feature_feedback: 'Sofortiges KI-Feedback',
    feature_feedback_desc: 'Detaillierte Analyse deiner Antworten mit Verbesserungsvorschlägen',
    feature_analytics: 'Performance Analytics',
    feature_analytics_desc: 'Verfolge deinen Fortschritt mit detaillierten Statistiken',
    feature_companies: 'Unternehmens-Spezifisch',
    feature_companies_desc: 'Trainiere für über 500 Top-Unternehmen weltweit',
    
    // CTA Buttons
    cta_start_practice: 'Jetzt üben',
    cta_get_started: 'Jetzt starten',
    cta_learn_more: 'Mehr erfahren',
    cta_try_free: 'Kostenlos testen',
    cta_book_demo: 'Demo buchen',
    cta_contact_us: 'Kontaktiere uns',
    
    // Footer
    footer_copyright: '© 2025 CareerSIM. Alle Rechte vorbehalten.',
    footer_product: 'Produkt',
    footer_company: 'Unternehmen',
    footer_resources: 'Ressourcen',
    footer_legal: 'Rechtliches',
    
    // Dashboard
    dashboard_welcome: 'Willkommen zurück',
    dashboard_start_interview: 'Neues Interview starten',
    dashboard_continue_practice: 'Weiter üben',
    dashboard_view_progress: 'Fortschritt ansehen',
    dashboard_total_interviews: 'Gesamte Interviews',
    dashboard_avg_score: 'Durchschnittlicher Score',
    dashboard_this_week: 'Diese Woche',
    dashboard_last_score: 'Letzter Score',
    
    // Pricing
    pricing_title: 'Wähle den perfekten Plan für dich',
    pricing_subtitle: 'Flexible Preismodelle für Studierende, Hochschulen und Unternehmen',
    pricing_hero_title: 'Wähle deinen Plan',
    pricing_hero_subtitle: 'Flexible Preismodelle für jeden Bedarf. Starte noch heute und verbessere deine Interview-Skills.',
    pricing_single: 'Einzelnes Interview',
    pricing_single_price: '3€',
    pricing_single_desc: 'Perfekt zum Testen und für gelegentliche Übung.',
    pricing_single_feature1: '1 vollständiges Interview',
    pricing_single_feature2: 'KI-gestütztes Feedback',
    pricing_single_feature3: 'Speech Recognition',
    pricing_single_feature4: 'Interview-Transkript',
    pricing_single_feature5: '7 Tage Zugriff auf Ergebnisse',
    pricing_single_cta: 'Jetzt kaufen',
    
    pricing_monthly: 'Monats-Abo',
    pricing_monthly_price: '9€',
    pricing_monthly_period: '/Monat',
    pricing_monthly_desc: 'Ideal für kurze Bewerbungsphasen und intensive Vorbereitung.',
    pricing_monthly_feature1: 'Unbegrenzte Interviews',
    pricing_monthly_feature2: 'Alle Features inklusive',
    pricing_monthly_feature3: 'Dashboard & Analytics',
    pricing_monthly_feature4: 'Fortschritts-Tracking',
    pricing_monthly_feature5: 'Prioritäts-Support',
    pricing_monthly_feature6: 'Monatlich kündbar',
    pricing_monthly_cta: 'Jetzt starten',
    
    pricing_semester: 'Semester-Abo',
    pricing_semester_price: '49€',
    pricing_semester_period: '/6 Monate',
    pricing_semester_desc: 'Beste Wahl für Studenten während Praktikums- und Bewerbungsphasen.',
    pricing_semester_feature1: 'Unbegrenzte Interviews (6 Monate)',
    pricing_semester_feature2: 'Alle Premium-Features',
    pricing_semester_feature3: 'Dashboard & Analytics',
    pricing_semester_feature4: 'Pause-Funktion für Auslandssemester',
    pricing_semester_feature5: 'Interview-Historie exportieren',
    pricing_semester_feature6: 'Prioritäts-Support',
    pricing_semester_feature7: 'Spare 27€ vs. Monatlich',
    pricing_semester_cta: 'Jetzt starten',
    
    pricing_yearly: 'Jahres-Abo',
    pricing_yearly_price: '89€',
    pricing_yearly_period: '/Jahr',
    pricing_yearly_desc: 'Maximale Flexibilität für das gesamte Studienjahr und langfristige Karriereplanung.',
    pricing_yearly_feature1: 'Unbegrenzte Interviews (12 Monate)',
    pricing_yearly_feature2: 'Alle Premium-Features',
    pricing_yearly_feature3: 'Erweiterte Analytics',
    pricing_yearly_feature4: 'Pause-Funktion jederzeit',
    pricing_yearly_feature5: '1-zu-1 Coaching-Session (1x)',
    pricing_yearly_feature6: 'Lebenslanger Zugriff auf Transkripte',
    pricing_yearly_feature7: 'VIP Support',
    pricing_yearly_feature8: 'Spare 19€ vs. Monatlich',
    pricing_yearly_cta: 'Jetzt starten',
    
    pricing_popular: 'Beliebt',
    pricing_faq_title: 'Häufig gestellte Fragen',
    pricing_faq1_q: 'Was bedeutet "Pause-Funktion"?',
    pricing_faq1_a: 'Bei Semester- und Jahres-Abos kannst du dein Abo für bis zu 3 Monate pausieren, z.B. während eines Auslandssemesters oder Praktikums. Die Laufzeit wird automatisch verlängert.',
    pricing_faq2_q: 'Kann ich jederzeit kündigen?',
    pricing_faq2_a: 'Ja! Das Monats-Abo ist monatlich kündbar. Bei Semester- und Jahres-Abos erhältst du die volle Laufzeit, eine vorzeitige Kündigung ist ohne Erstattung möglich.',
    pricing_faq3_q: 'Welche Zahlungsmethoden akzeptiert ihr?',
    pricing_faq3_a: 'Wir akzeptieren alle gängigen Kreditkarten, PayPal, SEPA-Lastschrift und Sofortüberweisung.',
    pricing_faq4_q: 'Gibt es Rabatte für Studenten?',
    pricing_faq4_a: 'Unsere Preise sind bereits studentenfreundlich gestaltet. Kontaktiere uns für Gruppenrabatte oder Hochschul-Partnerschaften.',
    pricing_features: 'Features',
    pricing_cta: 'Jetzt wählen',
  },
  en: {
    // Navigation
    nav_home: 'Home',
    nav_features: 'Features',
    nav_pricing: 'Pricing',
    nav_about: 'About',
    nav_contact: 'Contact',
    nav_students: 'For Students',
    nav_universities: 'For Universities',
    nav_companies: 'For Companies',
    nav_login: 'Login',
    nav_signup: 'Sign Up',
    nav_dashboard: 'Dashboard',
    nav_start_interview: 'Interview Simulation',
    nav_logout: 'Logout',
    
    // Home Page
    home_hero_title: 'AI-Powered Interview Preparation for Your Career Success',
    home_hero_subtitle: 'Master job interviews with our advanced AI. Practice realistic interviews, get instant feedback, and boost your performance.',
    home_cta_start: 'Get Started',
    home_cta_learn: 'Learn More',
    home_trusted: 'Trusted by 10,000+ Students',
    
    // Features
    feature_ai_interview: 'AI Interview Simulator',
    feature_ai_interview_desc: 'Realistic interview scenarios powered by artificial intelligence',
    feature_ai_coaching: 'AI Career Coaching',
    feature_ai_coaching_desc: 'Personalized career recommendations based on your strengths',
    feature_speech: 'Speech Recognition',
    feature_speech_desc: 'Answer verbally and get real-time transcription',
    feature_feedback: 'Instant AI Feedback',
    feature_feedback_desc: 'Detailed analysis of your answers with improvement suggestions',
    feature_analytics: 'Performance Analytics',
    feature_analytics_desc: 'Track your progress with detailed statistics',
    feature_companies: 'Company-Specific',
    feature_companies_desc: 'Train for 500+ top companies worldwide',
    
    // CTA Buttons
    cta_start_practice: 'Start Practice',
    cta_get_started: 'Get Started',
    cta_learn_more: 'Learn More',
    cta_try_free: 'Try for Free',
    cta_book_demo: 'Book a Demo',
    cta_contact_us: 'Contact Us',
    
    // Footer
    footer_copyright: '© 2025 CareerSIM. All rights reserved.',
    footer_product: 'Product',
    footer_company: 'Company',
    footer_resources: 'Resources',
    footer_legal: 'Legal',
    
    // Dashboard
    dashboard_welcome: 'Welcome back',
    dashboard_start_interview: 'Start New Interview',
    dashboard_continue_practice: 'Continue Practice',
    dashboard_view_progress: 'View Progress',
    dashboard_total_interviews: 'Total Interviews',
    dashboard_avg_score: 'Average Score',
    dashboard_this_week: 'This Week',
    dashboard_last_score: 'Last Score',
    
    // Pricing
    pricing_title: 'Choose the Perfect Plan for You',
    pricing_subtitle: 'Flexible pricing models for students, universities, and companies',
    pricing_hero_title: 'Choose Your Plan',
    pricing_hero_subtitle: 'Flexible pricing for every need. Start today and improve your interview skills.',
    pricing_single: 'Single Interview',
    pricing_single_price: '€3',
    pricing_single_desc: 'Perfect for testing and occasional practice.',
    pricing_single_feature1: '1 complete interview',
    pricing_single_feature2: 'AI-powered feedback',
    pricing_single_feature3: 'Speech Recognition',
    pricing_single_feature4: 'Interview transcript',
    pricing_single_feature5: '7 days access to results',
    pricing_single_cta: 'Buy Now',
    
    pricing_monthly: 'Monthly Plan',
    pricing_monthly_price: '€9',
    pricing_monthly_period: '/month',
    pricing_monthly_desc: 'Ideal for short application phases and intensive preparation.',
    pricing_monthly_feature1: 'Unlimited interviews',
    pricing_monthly_feature2: 'All features included',
    pricing_monthly_feature3: 'Dashboard & Analytics',
    pricing_monthly_feature4: 'Progress tracking',
    pricing_monthly_feature5: 'Priority support',
    pricing_monthly_feature6: 'Cancel monthly',
    pricing_monthly_cta: 'Get Started',
    
    pricing_semester: 'Semester Plan',
    pricing_semester_price: '€49',
    pricing_semester_period: '/6 months',
    pricing_semester_desc: 'Best choice for students during internship and application phases.',
    pricing_semester_feature1: 'Unlimited interviews (6 months)',
    pricing_semester_feature2: 'All premium features',
    pricing_semester_feature3: 'Dashboard & Analytics',
    pricing_semester_feature4: 'Pause function for study abroad',
    pricing_semester_feature5: 'Export interview history',
    pricing_semester_feature6: 'Priority support',
    pricing_semester_feature7: 'Save €27 vs. Monthly',
    pricing_semester_cta: 'Get Started',
    
    pricing_yearly: 'Yearly Plan',
    pricing_yearly_price: '€89',
    pricing_yearly_period: '/year',
    pricing_yearly_desc: 'Maximum flexibility for the entire academic year and long-term career planning.',
    pricing_yearly_feature1: 'Unlimited interviews (12 months)',
    pricing_yearly_feature2: 'All premium features',
    pricing_yearly_feature3: 'Extended analytics',
    pricing_yearly_feature4: 'Pause function anytime',
    pricing_yearly_feature5: '1-on-1 coaching session (1x)',
    pricing_yearly_feature6: 'Lifetime access to transcripts',
    pricing_yearly_feature7: 'VIP support',
    pricing_yearly_feature8: 'Save €19 vs. Monthly',
    pricing_yearly_cta: 'Get Started',
    
    pricing_popular: 'Popular',
    pricing_faq_title: 'Frequently Asked Questions',
    pricing_faq1_q: 'What does "Pause Function" mean?',
    pricing_faq1_a: 'With semester and yearly plans, you can pause your subscription for up to 3 months, e.g., during a study abroad or internship. The subscription term is automatically extended.',
    pricing_faq2_q: 'Can I cancel anytime?',
    pricing_faq2_a: 'Yes! The monthly plan can be cancelled monthly. For semester and yearly plans, you get the full term, early cancellation is possible without refund.',
    pricing_faq3_q: 'Which payment methods do you accept?',
    pricing_faq3_a: 'We accept all major credit cards, PayPal, SEPA direct debit, and instant bank transfer.',
    pricing_faq4_q: 'Are there student discounts?',
    pricing_faq4_a: 'Our prices are already student-friendly. Contact us for group discounts or university partnerships.',
    pricing_monthly: 'Monthly Plan',
    pricing_semester: 'Semester Plan',
    pricing_yearly: 'Yearly Plan',
    pricing_popular: 'Popular',
    pricing_features: 'Features',
    pricing_cta: 'Choose Plan',
  }
};

class I18n {
  constructor() {
    // Use consistent localStorage key
    this.storageKey = 'language';
    this.currentLang = localStorage.getItem(this.storageKey) || 'de';
    this.loadLanguage();
  }

  loadLanguage() {
    document.documentElement.lang = this.currentLang;
    this.updateContent();
  }

  setLanguage(lang) {
    if (translations[lang]) {
      this.currentLang = lang;
      localStorage.setItem(this.storageKey, lang);
      this.loadLanguage();
    }
  }

  t(key) {
    return translations[this.currentLang][key] || key;
  }

  updateContent() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);
      
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.placeholder = translation;
      } else {
        element.textContent = translation;
      }
    });

    // Update lang switcher active state
    document.querySelectorAll('.lang-switch').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === this.currentLang);
    });
  }
}

// Initialize i18n
const i18n = new I18n();

// Export for use in other scripts
window.i18n = i18n;
