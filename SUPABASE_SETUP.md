# 🚀 Supabase Setup für CareerSIM

## ⏱️ Dauer: 15 Minuten

---

## 📋 **Schritt 1: Supabase Account erstellen** (2 Minuten)

1. Gehe zu: **https://supabase.com**
2. Klicke auf **"Start your project"**
3. **Sign up** mit GitHub (empfohlen) oder Email
4. ✅ Account erstellt!

---

## 🏗️ **Schritt 2: Neues Projekt erstellen** (3 Minuten)

Nach Login siehst du das Dashboard:

### **Klicke auf "New Project"**

Fülle aus:

| Feld | Wert | Wichtig |
|------|------|---------|
| **Organization** | (Auto-erstellt) | - |
| **Name** | `CareerSIM` | Dein Projektname |
| **Database Password** | (Auto-generiert) | ⚠️ **KOPIEREN & SPEICHERN!** |
| **Region** | 🇪🇺 **Europe Central (Frankfurt)** | ✅ DSGVO-konform |
| **Pricing Plan** | **Free** | $0/Monat |

### ⚠️ **WICHTIG: Database Password speichern!**

```bash
# Beispiel:
Database Password: Xy7K#mP9qR2nL5wF
```

**Klicke auf:** `Create new project`

⏳ Warte 2 Minuten - Datenbank wird erstellt...

---

## 🔑 **Schritt 3: API Keys kopieren** (2 Minuten)

Sobald Projekt fertig:

1. Klicke auf **"Settings"** ⚙️ (links unten)
2. Dann **"API"**
3. Du siehst:

### **Kopiere diese 3 Werte:**

```
┌─────────────────────────────────────────┐
│  Project URL                            │
│  https://abcdefgh.supabase.co           │ ← Kopieren!
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  anon public (Client-Key)               │
│  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXV...  │ ← Kopieren!
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  service_role (Server-Key)              │
│  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXV...  │ ← Kopieren!
└─────────────────────────────────────────┘
```

---

## 📝 **Schritt 4: In .env einfügen** (1 Minute)

Öffne `.env` in deinem Projekt und füge hinzu:

```env
# Supabase Configuration
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXV...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXV...
```

⚠️ **Ersetze mit deinen echten Werten!**

---

## 🗄️ **Schritt 5: Datenbank-Tabellen erstellen** (3 Minuten)

1. Gehe in Supabase zu **"SQL Editor"** (links im Menü)
2. Klicke auf **"New query"**
3. **Kopiere & Füge dieses SQL ein:**

```sql
-- ============================================
-- CAREERSIM DATABASE SCHEMA
-- ============================================

-- 1. Profiles Tabelle
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  study TEXT,
  target_company TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

-- 2. Interviews Tabelle
CREATE TABLE IF NOT EXISTS interviews (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  company_id TEXT,
  industry TEXT,
  duration INT,
  completed_phases INT,
  scores JSONB,
  ai_feedback TEXT,
  transcript JSONB,
  config JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- 3. Subscriptions Tabelle
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- 4. Usage Tracking (für Limits)
CREATE TABLE IF NOT EXISTS usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  interviews_count INT DEFAULT 0,
  api_calls INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, month)
);

-- ============================================
-- INDEXES für Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_interviews_user 
  ON interviews(user_id);
  
CREATE INDEX IF NOT EXISTS idx_interviews_created 
  ON interviews(created_at DESC);
  
CREATE INDEX IF NOT EXISTS idx_subscriptions_user 
  ON subscriptions(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;

-- Policies: Users können nur ihre eigenen Daten sehen/ändern

-- Profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Interviews
CREATE POLICY "Users can view own interviews"
  ON interviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interviews"
  ON interviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Subscriptions
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Usage
CREATE POLICY "Users can view own usage"
  ON usage FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Neues Profil bei User-Registrierung erstellen
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, created_at)
  VALUES (new.id, new.email, now());
  
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (new.id, 'free', 'active');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Automatisch beim neuen User
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SUCCESS!
-- ============================================
SELECT '✅ CareerSIM Datenbank erfolgreich erstellt!' as status;
```

4. **Klicke auf "RUN"** ▶️ (oben rechts)
5. ✅ Du siehst: `✅ CareerSIM Datenbank erfolgreich erstellt!`

---

## 🎯 **Schritt 6: Server neu starten** (1 Minute)

```bash
# Im Terminal:
node server.js
```

**Du siehst:**
```
🚀 CareerSIM Server läuft auf http://localhost:3000
📡 OpenAI Integration: ✅ Aktiviert
🎤 Realtime API: ✅ Bereit
💾 Datenbank: ✅ Supabase verbunden  ← NEU!
📊 Interview-Historie: ✅ Aktiviert
```

---

## ✅ **Fertig! System läuft jetzt mit Supabase**

### **Was jetzt anders ist:**

| Vorher (db.json) | Nachher (Supabase) |
|------------------|-------------------|
| ⚠️ Nur lokale Speicherung | ✅ Cloud-Datenbank |
| ⚠️ Bei Deploy verloren | ✅ Daten bleiben erhalten |
| ⚠️ Nur 1 User gleichzeitig | ✅ Unbegrenzt User |
| ⚠️ Keine User-Accounts | ✅ Built-in Auth |

---

## 🧪 **Testen:**

1. Mache ein Interview auf `localhost:3000`
2. Beende es
3. Gehe zu Supabase → **"Table Editor"** → **"interviews"**
4. ✅ Du siehst dein Interview in der Datenbank!

---

## 📊 **Supabase Dashboard:**

### **Table Editor** - Deine Daten sehen
- `profiles` - User-Profile
- `interviews` - Interview-Historie
- `subscriptions` - Bezahl-Pläne
- `usage` - API-Nutzung

### **Authentication** - User verwalten
- Alle registrierten User
- Email-Bestätigung
- Social Logins (Google, GitHub, etc.)

### **Storage** - Dateien speichern
- PDFs hochladen
- Avatars speichern
- Backups

### **SQL Editor** - Datenbank-Queries
- Custom Queries
- Daten exportieren
- Backup erstellen

---

## 💰 **Kosten:**

### **Free Tier:**
- ✅ 500 MB Database
- ✅ 1 GB Storage
- ✅ 50.000 MAU (Monthly Active Users)
- ✅ 2 GB Bandwidth
- ✅ $0/Monat

**Reicht für:** ~1.000 Studenten mit je 10 Interviews

### **Wenn Free nicht mehr reicht:**

**Pro Plan: $25/Monat**
- 8 GB Database
- 100 GB Storage
- 100.000 MAU
- 250 GB Bandwidth

**Reicht für:** ~50.000 Studenten

---

## 🔄 **Hybrid-Modus:**

Dein System läuft jetzt **HYBRID**:

```javascript
// Wenn Supabase konfiguriert → Nutzt Supabase
// Wenn nicht konfiguriert → Nutzt db.json

if (supabase) {
  // ✅ Speichert in Supabase
} else {
  // ⚠️ Speichert in db.json (Fallback)
}
```

**Vorteil:** 
- Entwicklung lokal mit db.json
- Production mit Supabase
- Smooth Migration!

---

## 🚀 **Nächste Schritte:**

### **1. Authentication einrichten** (Optional)
```sql
-- In Supabase → Authentication → Settings
Enable Email/Password auth
Enable Email confirmations
```

### **2. Stripe Integration** (Optional)
```bash
npm install stripe
```

### **3. Domain verbinden** (Später)
- Eigene Domain (z.B. `app.careersim.de`)
- SSL automatisch
- CDN für Speed

---

## ❓ **Häufige Probleme:**

### **Problem 1: "Connection refused"**
```
Lösung: Prüfe .env - Sind die Keys korrekt?
```

### **Problem 2: "Row Level Security policy violation"**
```
Lösung: RLS Policies erstellt? (Schritt 5)
```

### **Problem 3: "Database not found"**
```
Lösung: Tabellen erstellt? (Schritt 5 - SQL ausführen)
```

---

## 📞 **Support:**

- **Supabase Docs:** https://supabase.com/docs
- **Discord:** https://discord.supabase.com
- **GitHub Issues:** Schreib mir!

---

**Erstellt am:** 16. November 2025  
**Für:** CareerSIM-TEAM  
**Version:** 1.0
