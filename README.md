# CareerSIM — einfacher KI Interview Simulator (Mock)

Kurze Demo-App mit Register / Login und einem simulierten Interview-Flow, das wie ein Zoom-Meeting aussieht.

Starten:

1. Node dependencies installieren:

```bash
npm install
```

2. Server starten:

```bash
npm start
```

Öffne dann http://localhost:3000 im Browser.

Optional: OpenAI-Integration
If you want the simulator to use OpenAI for richer feedback, set the environment variable `OPENAI_API_KEY` before starting the server:

```bash
export OPENAI_API_KEY="sk-..."
npm start
```

If the key is not present, the app will use the built-in heuristic feedback.

APIs (kurz):
- POST /api/register {username,password,study,target}
- POST /api/login {username,password} => {token}
- POST /api/interview/start  (x-auth-token header) => {interviewId, question}
- POST /api/interview/respond {interviewId, answer} (x-auth-token header) => {nextQuestion, done, feedback}

Hinweis: Die "KI" ist aktuell ein lokaler Mock mit einfachen Heuristiken. Wenn du möchtest, kann ich die Integration mit einer echten LLM-API (z.B. OpenAI) hinzufügen und die Auth hardened (JWT, DB, hashing, email-verifikation) — sag mir Bescheid.
