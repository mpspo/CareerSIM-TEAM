# 🏗️ CareerSIM - KI-Karriereplattform Architektur

**Erstellt:** 16. November 2025  
**Status:** Phase 1 - Foundation Complete ✅  
**Ziel:** Integrierte Plattform für Interview-Training + Karriereberatung

---

## 🎯 VISION: Zwei verknüpfte Hauptfunktionen

### 1. **KI-Interview-Simulator**
- Realistisches Training mit dynamischen Personas
- Audio-basiert, firmenspezifisch, Case-Interviews
- Speichert Stärken/Schwächen strukturiert

### 2. **KI-Karriereberatung** ⭐ NEU
- Nutzt Interview-Ergebnisse + User-Präferenzen + CV
- Empfiehlt passende Rollen, Skills, Programme
- Erstellt personalisierten Karriereplan
- **Eng verzahnt mit Interview-Daten**

**Design-Prinzip:** 
- **Bestehendes OpenAI-ähnliches UI beibehalten**
- Clean, minimalistisch, viel Weißraum
- Komponenten, Buttons, Cards, Fonts wiederverwenden
- Nur neue Logik/Inhalte, kein Redesign

---

## 📊 1. BESTEHENDE SYSTEM-ANALYSE

### 1.1 Aktueller Tech-Stack
```
Frontend:
├── Vanilla JavaScript (interview.html, dashboard.html, etc.)
├── Supabase Client (@supabase/supabase-js v2)
├── OpenAI Realtime API (WebSocket, direkt im Browser)
└── HTML/CSS (keine Framework-Struktur)

Backend:
├── Node.js / Express
├── Supabase PostgreSQL (User Auth, Interviews, Profiles)
├── OpenAI SDK (Chat Completions für Feedback)
├── db.json (Legacy fallback storage)
└── Multer (File uploads)

APIs & Services:
├── OpenAI Realtime API (wss://api.openai.com/v1/realtime)
├── OpenAI Chat Completions (gpt-3.5-turbo für Feedback)
├── Supabase Auth (JWT-basiert)
├── Supabase Storage (CV uploads)
└── Supabase PostgreSQL (profiles, interviews, token_usage)
```

### 1.2 Aktuelle Features (Bestand)
✅ **Authentication:**
- Supabase Auth (Email/Password)
- JWT Session Management
- Row Level Security (RLS)

✅ **Interview-Ablauf:**
- Realtime Audio-Streaming (WebRTC)
- 4-Phasen Interview-System
- Live Transkription (Whisper-1)
- Phase-basierte System-Prompts

✅ **Data Management:**
- Interview History (Supabase)
- User Profiles (Study, Target Company)
- Token Usage Tracking (mit automatischer Kostenberechnung)
- CV Upload (Supabase Storage)

✅ **UX/UI:**
- Live Video Grid (User + AI Avatar)
- Phase Progress Indicator
- Real-time Chat Transcript
- Timer & Duration Tracking

### 1.3 Probleme im aktuellen System

🔴 **Architektur:**
- **Monolithischer Frontend-Code** (2267 Zeilen interview.html)
- **Keine klare Trennung** zwischen UI, Business Logic, API Layer
- **Direkter OpenAI API Call** im Browser (API Key exposure risk)
- **Kein State Management** (nur globale Variablen)
- **Keine TypeScript** (fehleranfällig bei Skalierung)

🔴 **Interview-Logik:**
- **Statische Phase-Definition** (hardcoded)
- **Keine Persona-Konsistenz** (jeder Prompt neu)
- **Kein Follow-Up System** (keine Antwort-Analyse)
- **Kein strukturiertes Feedback** (nur Chat-Completions)

🔴 **RAG/Context:**
- **Kein Vector Store** (CV & Job Ad nur als String)
- **Keine Unternehmens-Knowledge-Base**
- **Keine semantische Suche** für relevante Fragen

🔴 **Case Interview:**
- **Nicht implementiert**
- **Keine mehrstufige Logik**

---

## 🎯 2. NEUE SYSTEM-ARCHITEKTUR (Target State)

### 2.1 Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  React + TypeScript Components                              │
│  ├── InterviewSetup (5-Step Flow)                           │
│  ├── InterviewSession (Live Interview)                      │
│  ├── FeedbackView (Results & Scorecard)                     │
│  └── Dashboard (History & Analytics)                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                          │
│  Business Logic Services (TypeScript)                       │
│  ├── InterviewEngine (Phase Management, Question Flow)      │
│  ├── PersonaManager (Interviewer Behavior)                  │
│  ├── FollowUpLogic (Dynamic Question Generation)            │
│  ├── FeedbackEngine (STAR Analysis, Scoring)                │
│  └── CaseInterviewModule (Multi-Stage Problem Solving)      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      RAG LAYER                               │
│  Retrieval-Augmented Generation (OpenAI Embeddings)         │
│  ├── VectorStore (OpenAI Vector Store / Pinecone)           │
│  ├── ContextRetrieval (getCompanyContext, getRoleQuestions) │
│  ├── DocumentProcessing (Job Ad, Company Info, CV)          │
│  └── RelevantSnippets (Semantic Search)                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    INTEGRATION LAYER                         │
│  External API Clients                                        │
│  ├── OpenAIRealtimeClient (Audio Stream, WebRTC)            │
│  ├── OpenAIChatClient (Feedback, Analysis)                  │
│  ├── SupabaseClient (Auth, DB, Storage)                     │
│  └── WhisperClient (Transcription)                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER                               │
│  Supabase PostgreSQL + Storage                              │
│  ├── users (Supabase Auth)                                  │
│  ├── profiles (CV, preferences)                             │
│  ├── interviews (sessions, history)                         │
│  ├── interview_questions (Q&A pairs)                        │
│  ├── feedback (per-answer + overall)                        │
│  ├── token_usage (costs, analytics)                         │
│  ├── personas (interviewer types)                           │
│  └── vector_embeddings (RAG data)                           │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Core Service Interfaces

#### **InterviewEngine**
```typescript
interface InterviewEngine {
  // Phase Management
  startInterview(config: InterviewConfig): Promise<InterviewSession>;
  getCurrentPhase(): Phase;
  advancePhase(): void;
  
  // Question Flow
  getNextQuestion(context: InterviewContext): Promise<Question>;
  submitAnswer(answer: Answer): Promise<FeedbackResult>;
  
  // Session Control
  pauseInterview(): void;
  resumeInterview(): void;
  endInterview(): Promise<FinalScorecard>;
}

interface InterviewConfig {
  jobRole: string;
  jobAd?: string;
  company: CompanyProfile;
  persona: Persona;
  duration: number;
  difficulty: 'junior' | 'intermediate' | 'advanced';
  type: 'standard' | 'case' | 'technical' | 'mixed';
}

interface Phase {
  id: number;
  name: string;
  duration: number;
  questionCount: number;
  objectives: string[];
}
```

#### **PersonaManager**
```typescript
interface PersonaManager {
  // Persona Selection
  suggestPersonas(jobRole: string, company: string): Promise<Persona[]>;
  selectPersona(id: string): void;
  
  // Behavior Control
  getSystemPrompt(phase: Phase, context: InterviewContext): string;
  maintainConsistency(conversationHistory: Message[]): void;
}

interface Persona {
  id: string;
  name: string; // "Friendly Recruiter", "Technical Lead", "McKinsey Partner"
  type: 'recruiter' | 'hiring_manager' | 'consultant' | 'technical';
  tone: 'friendly' | 'professional' | 'strict' | 'casual';
  difficulty: 'easy' | 'medium' | 'hard';
  followUpStyle: 'supportive' | 'challenging' | 'neutral';
  industry: string[];
  companyTypes: string[];
}
```

#### **FollowUpLogic**
```typescript
interface FollowUpLogic {
  // Answer Analysis
  analyzeAnswer(answer: string, question: Question): Promise<AnswerAnalysis>;
  
  // Follow-Up Decision
  shouldAskFollowUp(analysis: AnswerAnalysis): boolean;
  generateFollowUp(analysis: AnswerAnalysis, level: 1 | 2 | 3): Promise<Question>;
  
  // Topic Extraction
  extractTopics(answer: string): string[];
  identifyWeaknesses(analysis: AnswerAnalysis): string[];
}

interface AnswerAnalysis {
  completeness: number; // 0-100
  clarity: number;
  relevance: number;
  structure: 'STAR' | 'unstructured' | 'partial';
  topics: string[];
  weaknesses: string[];
  strengths: string[];
}
```

#### **FeedbackEngine**
```typescript
interface FeedbackEngine {
  // Per-Answer Feedback
  generateImmediateFeedback(answer: Answer): Promise<ImmediateFeedback>;
  
  // Overall Feedback
  generateFinalFeedback(session: InterviewSession): Promise<FinalScorecard>;
  
  // STAR Analysis
  analyzeSTAR(answer: string): STARAnalysis;
  suggestSTARImprovement(answer: string): string;
  
  // Training Plan
  generateTrainingPlan(scorecard: FinalScorecard): TrainingStep[];
}

interface ImmediateFeedback {
  strengths: string[];
  weaknesses: string[];
  suggestion: string;
  starAnalysis?: STARAnalysis;
  exampleAnswer?: string;
}

interface FinalScorecard {
  overallScore: number;
  categoryScores: {
    communication: number;
    technical: number;
    problemSolving: number;
    motivation: number;
    fit: number;
  };
  keyStrengths: string[];
  areasForImprovement: string[];
  detailedFeedback: string;
  trainingPlan: TrainingStep[];
}

interface STARAnalysis {
  situation: { present: boolean; quality: 'good' | 'weak' | 'missing' };
  task: { present: boolean; quality: 'good' | 'weak' | 'missing' };
  action: { present: boolean; quality: 'good' | 'weak' | 'missing' };
  result: { present: boolean; quality: 'good' | 'weak' | 'missing' };
  suggestion: string;
}
```

#### **RAG Layer**
```typescript
interface RAGService {
  // Document Management
  addDocument(doc: Document, type: 'job_ad' | 'company_info' | 'cv'): Promise<void>;
  updateDocument(id: string, content: string): Promise<void>;
  deleteDocument(id: string): Promise<void>;
  
  // Context Retrieval
  getCompanyContext(companyName: string): Promise<string>;
  getRoleSpecificQuestions(role: string, industry: string): Promise<Question[]>;
  getRelevantSnippets(query: string, k: number): Promise<Snippet[]>;
  
  // Embeddings
  createEmbedding(text: string): Promise<number[]>;
  similaritySearch(query: string, topK: number): Promise<SearchResult[]>;
}

interface Document {
  id: string;
  type: 'job_ad' | 'company_info' | 'cv' | 'knowledge_base';
  content: string;
  metadata: Record<string, any>;
}

interface SearchResult {
  content: string;
  score: number;
  metadata: Record<string, any>;
}
```

#### **CaseInterviewModule**
```typescript
interface CaseInterviewModule {
  // Case Management
  startCase(caseType: 'market_sizing' | 'profitability' | 'market_entry'): Promise<CaseSession>;
  
  // Multi-Stage Flow
  defineStage(stage: CaseStage): void;
  evaluateStage(response: string): Promise<StageEvaluation>;
  advanceStage(): void;
  
  // Guidance
  offerHint(stage: CaseStage): string;
  correctApproach(stage: CaseStage): string;
}

interface CaseSession {
  type: string;
  stages: CaseStage[];
  currentStage: number;
  structureUsed: boolean;
  numericalAccuracy: number;
}

interface CaseStage {
  name: 'problem_definition' | 'structure' | 'data_analysis' | 'insight' | 'recommendation';
  objective: string;
  expectedElements: string[];
  timeLimit: number;
}

interface StageEvaluation {
  complete: boolean;
  missingElements: string[];
  feedback: string;
  suggestHint: boolean;
}
```

---

## 🔄 3. MIGRATIONS-PLAN (Alt → Neu)

### Phase 1: Foundation (Wochen 1-2)
**Ziel:** Saubere Code-Basis ohne Breaking Changes

✅ **Setup:**
- [ ] TypeScript Projekt aufsetzen (`tsconfig.json`)
- [ ] React mit Vite initialisieren
- [ ] Projekt-Struktur erstellen (`/src`, `/services`, `/components`)
- [ ] ESLint + Prettier konfigurieren

✅ **Backend Refactoring:**
- [ ] Express Server in TypeScript umschreiben
- [ ] OpenAI Service Layer erstellen (wiederverwendbarer Client)
- [ ] Supabase Service Layer abstrahieren
- [ ] API Routes sauber strukturieren (`/routes`)

✅ **Database Schema:**
```sql
-- Neue Tabellen (zusätzlich zu bestehenden)
CREATE TABLE personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  tone TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  follow_up_style TEXT,
  industry TEXT[],
  company_types TEXT[],
  system_prompt_template TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id BIGINT REFERENCES interviews(id) ON DELETE CASCADE,
  phase INT NOT NULL,
  question_text TEXT NOT NULL,
  answer_text TEXT,
  analysis JSONB, -- AnswerAnalysis object
  feedback JSONB, -- ImmediateFeedback object
  asked_at TIMESTAMP DEFAULT now()
);

CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id BIGINT REFERENCES interviews(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'immediate' | 'final'
  content JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE vector_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 dimension
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- Index for vector similarity search (requires pgvector extension)
CREATE INDEX ON vector_embeddings USING ivfflat (embedding vector_cosine_ops);
```

### Phase 2: RAG Layer (Wochen 3-4)
**Ziel:** OpenAI Vector Store Integration

✅ **Implementation:**
- [ ] OpenAI Vector Store API Client
- [ ] Document Upload Pipeline (Job Ads, Company Info)
- [ ] Embedding Generation Service
- [ ] Semantic Search Implementation
- [ ] `getCompanyContext()` Interface
- [ ] `getRoleSpecificQuestions()` Interface

✅ **Testing:**
- [ ] Upload Test-Dokumente
- [ ] Verifiziere Embedding-Qualität
- [ ] Teste Similarity Search
- [ ] Integration mit bestehender Interview-Logik

### Phase 3: Persona System (Wochen 5-6)
**Ziel:** Konsistente Interviewer-Persönlichkeiten

✅ **Implementation:**
- [ ] Persona-Datenbank (Supabase)
- [ ] PersonaManager Service
- [ ] System-Prompt Templates pro Persona
- [ ] Persona-Auswahl UI (Schritt 2 im neuen Flow)
- [ ] Auto-Suggestion basierend auf Job Role

✅ **Personas erstellen:**
```typescript
const defaultPersonas: Persona[] = [
  {
    name: "Friendly HR Recruiter",
    type: "recruiter",
    tone: "friendly",
    difficulty: "easy",
    followUpStyle: "supportive",
    industry: ["all"],
    companyTypes: ["corporate", "startup"],
    systemPromptTemplate: "Du bist ein freundlicher HR-Recruiter bei {{company}}..."
  },
  {
    name: "Technical Lead",
    type: "technical",
    tone: "professional",
    difficulty: "medium",
    followUpStyle: "challenging",
    industry: ["tech", "finance"],
    companyTypes: ["corporate", "startup"],
    systemPromptTemplate: "Du bist der Technical Lead bei {{company}}..."
  },
  {
    name: "McKinsey Partner",
    type: "consultant",
    tone: "strict",
    difficulty: "hard",
    followUpStyle: "challenging",
    industry: ["consulting"],
    companyTypes: ["consulting"],
    systemPromptTemplate: "Du bist ein Partner bei McKinsey..."
  }
];
```

### Phase 4: Follow-Up Logic (Wochen 7-8)
**Ziel:** Dynamische, kontextbezogene Rückfragen

✅ **Implementation:**
- [ ] FollowUpLogic Service
- [ ] Answer Analysis mit GPT-4
- [ ] Topic Extraction (NLP)
- [ ] Weakness Detection
- [ ] Follow-Up Generation (Level 1-3)
- [ ] Integration in Interview Flow

✅ **Logik:**
```typescript
// Nach jeder Antwort:
const analysis = await followUpLogic.analyzeAnswer(userAnswer, currentQuestion);

if (analysis.completeness < 70 || analysis.structure === 'unstructured') {
  const followUp = await followUpLogic.generateFollowUp(analysis, 2); // Level 2
  return followUp;
} else if (questionCount < phase.questionCount) {
  const nextQuestion = await interviewEngine.getNextQuestion(context);
  return nextQuestion;
} else {
  interviewEngine.advancePhase();
}
```

### Phase 5: Feedback Engine (Wochen 9-10)
**Ziel:** STAR-basiertes Feedback + Trainingsplan

✅ **Implementation:**
- [ ] FeedbackEngine Service
- [ ] STAR-Analyse Algorithmus
- [ ] Immediate Feedback Generation
- [ ] Final Scorecard Generation
- [ ] Training Plan Generator
- [ ] Feedback UI Components

✅ **Features:**
- Pro-Antwort: Sofortiges Feedback nach jedem Answer
- Gesamt: Detaillierte Scorecard am Ende
- STAR-Check: Automatische Struktur-Analyse
- Export: PDF/Email mit Feedback

### Phase 6: Neuer UX Flow (Wochen 11-12)
**Ziel:** 5-Schritte Prozess (Setup → Interview → Feedback)

✅ **React Components:**
```
/src/components/interview/
├── setup/
│   ├── Step1_GoalDefinition.tsx      (Job Role oder Stellenanzeige)
│   ├── Step2_PersonaSelection.tsx    (Interviewer-Typ wählen)
│   ├── Step3_Settings.tsx            (Dauer, Schwierigkeit, Typ)
│   └── SetupWizard.tsx               (Stepper Container)
│
├── session/
│   ├── VideoGrid.tsx                 (User + AI Video)
│   ├── PhaseIndicator.tsx            (Progress Bar)
│   ├── ChatTranscript.tsx            (Q&A Historie)
│   ├── Controls.tsx                  (Pause, Mute, Stop)
│   └── InterviewSession.tsx          (Main Container)
│
└── feedback/
    ├── ImmediateFeedback.tsx         (Nach jeder Antwort)
    ├── FinalScorecard.tsx            (Ende-Bewertung)
    ├── TrainingPlan.tsx              (Nächste Schritte)
    └── FeedbackView.tsx              (Main Container)
```

✅ **State Management:**
- Zustand oder Redux für globalen State
- Interview Session State
- User Settings
- Realtime Audio/Video State

### Phase 7: Case Interview (Wochen 13-14)
**Ziel:** Spezial-Modus für Consulting

✅ **Implementation:**
- [ ] CaseInterviewModule Service
- [ ] Case-Typen (Market Sizing, Profitability, etc.)
- [ ] Multi-Stage Flow (5 Stages)
- [ ] Stage Evaluation Logic
- [ ] Hint System
- [ ] Case-specific UI Components

✅ **Case Flow:**
```
1. Problem Definition (Kandidat versteht das Problem)
2. Structure/Issue Tree (Kandidat schlägt Struktur vor)
3. Data Analysis (Kandidat arbeitet mit Zahlen)
4. Insights (Kandidat leitet Erkenntnisse ab)
5. Recommendation (Kandidat gibt Empfehlung + Summary)
```

### Phase 8: Testing & Migration (Wochen 15-16)
**Ziel:** Altes System durch neues ersetzen

✅ **Rollout:**
- [ ] Beta-Test mit 10 Usern
- [ ] Performance-Optimierung
- [ ] Bug Fixes
- [ ] Parallel-Betrieb (Alt + Neu)
- [ ] Feature-Flag für neue Version
- [ ] Vollständige Migration
- [ ] Altes System deaktivieren

---

## 📁 4. NEUE PROJEKT-STRUKTUR

```
CareerSIM-main/
├── src/
│   ├── components/          # React Components (TypeScript)
│   │   ├── interview/
│   │   │   ├── setup/
│   │   │   ├── session/
│   │   │   └── feedback/
│   │   ├── dashboard/
│   │   └── common/
│   │
│   ├── services/            # Business Logic Layer
│   │   ├── interview/
│   │   │   ├── InterviewEngine.ts
│   │   │   ├── PersonaManager.ts
│   │   │   ├── FollowUpLogic.ts
│   │   │   └── FeedbackEngine.ts
│   │   ├── rag/
│   │   │   ├── RAGService.ts
│   │   │   ├── VectorStore.ts
│   │   │   └── DocumentProcessor.ts
│   │   └── case/
│   │       └── CaseInterviewModule.ts
│   │
│   ├── clients/             # External API Clients
│   │   ├── OpenAIRealtimeClient.ts
│   │   ├── OpenAIChatClient.ts
│   │   ├── SupabaseClient.ts
│   │   └── WhisperClient.ts
│   │
│   ├── types/               # TypeScript Interfaces
│   │   ├── interview.types.ts
│   │   ├── persona.types.ts
│   │   ├── feedback.types.ts
│   │   └── rag.types.ts
│   │
│   ├── hooks/               # React Custom Hooks
│   │   ├── useInterview.ts
│   │   ├── useAudio.ts
│   │   └── useSupabase.ts
│   │
│   ├── utils/               # Helper Functions
│   │   ├── audio.ts
│   │   ├── prompts.ts
│   │   └── formatting.ts
│   │
│   └── App.tsx              # Main React App
│
├── server/                  # Backend (Node/Express)
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── interview.ts
│   │   ├── feedback.ts
│   │   └── rag.ts
│   ├── services/
│   │   ├── OpenAIService.ts
│   │   ├── SupabaseService.ts
│   │   └── RAGService.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── error.ts
│   └── server.ts            # Express Server
│
├── public/                  # Legacy Files (wird ersetzt)
│   └── (alte HTML Files)
│
├── docs/                    # Dokumentation
│   ├── ARCHITECTURE.md      # Diese Datei
│   ├── API_SPEC.md
│   └── USER_GUIDE.md
│
├── tests/                   # Unit & Integration Tests
│   ├── services/
│   ├── components/
│   └── integration/
│
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🚀 5. NÄCHSTE SCHRITTE

### Sofort (Diese Woche):
1. ✅ TypeScript + React + Vite Setup
2. ✅ Backend in TypeScript umschreiben
3. ✅ Service Layer Interfaces definieren
4. ✅ Supabase Schema erweitern

### Kurzfristig (Woche 2-4):
1. ✅ RAG Layer mit OpenAI Vector Store
2. ✅ Erste React Components (Setup Wizard)
3. ✅ PersonaManager implementieren

### Mittelfristig (Woche 5-10):
1. ✅ Follow-Up Logic + Feedback Engine
2. ✅ Kompletter neuer UX Flow
3. ✅ Beta Testing

### Langfristig (Woche 11-16):
1. ✅ Case Interview Module
2. ✅ Performance Optimization
3. ✅ Migration von altem System
4. ✅ Production Deployment

---

## 📝 6. DESIGN-ENTSCHEIDUNGEN

### Warum React + TypeScript?
- ✅ **Component-basiert:** Wiederverwendbare UI-Blöcke
- ✅ **Type-Safety:** Weniger Bugs, bessere IDE-Unterstützung
- ✅ **State Management:** Zustand oder Redux für komplexen State
- ✅ **Testing:** Jest + React Testing Library
- ✅ **Community:** Riesiges Ökosystem

### Warum Layered Architecture?
- ✅ **Separation of Concerns:** UI, Logic, Data klar getrennt
- ✅ **Testbarkeit:** Jede Schicht isoliert testbar
- ✅ **Skalierbarkeit:** Neue Features leicht hinzufügbar
- ✅ **Wartbarkeit:** Änderungen betreffen nur eine Schicht

### Warum OpenAI Vector Store?
- ✅ **Managed Service:** Keine eigene Vektor-DB betreiben
- ✅ **Schnell:** Optimierte Similarity Search
- ✅ **OpenAI-Integration:** Nahtlos mit Chat/Realtime APIs
- ✅ **Kosten:** Pay-as-you-go, keine Infrastruktur

### Warum Supabase?
- ✅ **PostgreSQL:** Bewährt, leistungsstark
- ✅ **Auth out-of-the-box:** JWT, RLS, User Management
- ✅ **Realtime:** WebSocket-Subscriptions möglich
- ✅ **Storage:** Für CVs, Dokumente
- ✅ **Free Tier:** 50.000 MAU kostenlos

---

## ✅ 7. SUCCESS METRICS

**Nach Migration muss folgendes funktionieren:**
- [ ] User kann Interview in 5 Schritten konfigurieren
- [ ] System schlägt passende Personas vor
- [ ] Interview läuft mit konsistentem Interviewer-Verhalten
- [ ] Follow-Up Fragen basieren auf Antwort-Analyse
- [ ] Feedback enthält STAR-Analyse + Verbesserungsvorschläge
- [ ] Trainingsplan mit 3-5 konkreten Schritten
- [ ] Case Interview läuft in 5 Stages
- [ ] RAG liefert relevante Unternehmens-Infos
- [ ] Token-Tracking funktioniert weiterhin
- [ ] Alle Tests grün (>80% Coverage)

---

**Status:** 🟡 In Planung  
**Next Action:** TypeScript + React Setup starten  
**Owner:** Development Team  
**Review Date:** Ende Woche 2

