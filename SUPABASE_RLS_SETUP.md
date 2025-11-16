# 🔐 Supabase Row Level Security (RLS) Setup

## 📋 **Was ist RLS?**

Row Level Security stellt sicher, dass:
- ✅ User nur ihre **eigenen** Daten sehen
- ✅ User keine Daten anderer User ändern können
- ✅ Datenbank automatisch filtert basierend auf auth.uid()

---

## 🚀 **Anleitung:**

### **1. Gehe zu Supabase SQL Editor**
https://supabase.com → Dein Projekt → **SQL Editor**

### **2. Führe dieses SQL aus:**

```sql
-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Zuerst: RLS für alle Tabellen aktivieren
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Jeder kann sein eigenes Profil sehen
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Jeder kann sein eigenes Profil erstellen
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Jeder kann sein eigenes Profil aktualisieren
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- INTERVIEWS POLICIES
-- ============================================

-- User können nur ihre eigenen Interviews sehen
CREATE POLICY "Users can view own interviews"
  ON interviews
  FOR SELECT
  USING (auth.uid() = user_id);

-- User können nur Interviews für sich selbst erstellen
CREATE POLICY "Users can insert own interviews"
  ON interviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User können ihre eigenen Interviews aktualisieren
CREATE POLICY "Users can update own interviews"
  ON interviews
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User können ihre eigenen Interviews löschen
CREATE POLICY "Users can delete own interviews"
  ON interviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- SUBSCRIPTIONS POLICIES
-- ============================================

-- User können nur ihr eigenes Subscription sehen
CREATE POLICY "Users can view own subscription"
  ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- User können ihr Subscription aktualisieren
CREATE POLICY "Users can update own subscription"
  ON subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- USAGE POLICIES
-- ============================================

-- User können nur ihre eigene Usage sehen
CREATE POLICY "Users can view own usage"
  ON usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- User können ihre Usage aktualisieren
CREATE POLICY "Users can update own usage"
  ON usage
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- SUCCESS!
-- ============================================
SELECT '✅ Row Level Security erfolgreich aktiviert!' as status;
```

---

## ✅ **Was passiert jetzt?**

### **Vorher (ohne RLS):**
```sql
-- User A kann ALLES sehen:
SELECT * FROM interviews;  -- Alle Interviews aller User! ❌
```

### **Nachher (mit RLS):**
```sql
-- User A sieht nur seine Interviews:
SELECT * FROM interviews;  -- Nur Interviews von User A ✅
-- Supabase fügt automatisch hinzu: WHERE user_id = auth.uid()
```

---

## 🧪 **Testen:**

### **1. Erstelle 2 Test-Accounts:**
- user1@test.de
- user2@test.de

### **2. Mache Interviews mit beiden Accounts**

### **3. Prüfe in Dashboard:**
- ✅ User 1 sieht nur seine Interviews
- ✅ User 2 sieht nur seine Interviews

### **4. Prüfe in Supabase Table Editor:**
- Als Admin siehst du alles
- Aber die App filtert automatisch!

---

## 🔍 **RLS Policies prüfen:**

```sql
-- Alle Policies anzeigen:
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## ⚠️ **Wichtig:**

### **Service Role Key vs Anon Key:**

| Key | Zweck | RLS |
|-----|-------|-----|
| **Anon Key** | Frontend (Browser) | ✅ **RLS aktiviert** |
| **Service Role Key** | Backend (Server) | ❌ **RLS ignoriert** |

**Deshalb:**
- Frontend nutzt `SUPABASE_ANON_KEY` → RLS schützt Daten
- Backend nutzt `SUPABASE_SERVICE_KEY` → Admin-Zugriff

---

## 🚨 **Fehlerbehandlung:**

### **Problem: "new row violates row-level security policy"**

**Ursache:** Du versuchst ein Interview für einen anderen User zu erstellen

**Lösung:** Stelle sicher, dass `user_id` = `auth.uid()`

```javascript
// ❌ FALSCH:
const { data } = await supabase
  .from('interviews')
  .insert({ user_id: 'some-other-user-id', ... });

// ✅ RICHTIG:
const { data: { user } } = await supabase.auth.getUser();
const { data } = await supabase
  .from('interviews')
  .insert({ user_id: user.id, ... });
```

---

### **Problem: "No rows returned"**

**Ursache:** User ist nicht eingeloggt oder Session abgelaufen

**Lösung:** Prüfe Session:

```javascript
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  // Redirect to login
  window.location.href = '/auth.html';
}
```

---

## 🔧 **RLS temporär deaktivieren (nur für Tests):**

```sql
-- NUR FÜR DEVELOPMENT!
ALTER TABLE interviews DISABLE ROW LEVEL SECURITY;

-- Für Production IMMER aktiviert lassen:
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
```

---

## 📊 **Performance-Tipps:**

RLS Policies sollten effizient sein:

```sql
-- ✅ GUT: Nutzt Index
CREATE POLICY "fast_policy" ON interviews
  FOR SELECT USING (auth.uid() = user_id);

-- ❌ LANGSAM: Komplexe Subqueries
CREATE POLICY "slow_policy" ON interviews
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM other_table WHERE ...
    )
  );
```

---

## 🎯 **Best Practices:**

1. ✅ **Immer RLS aktivieren** in Production
2. ✅ **Teste mit mehreren Test-Accounts**
3. ✅ **Nutze Anon Key im Frontend**
4. ✅ **Service Key nur im Backend**
5. ✅ **Prüfe auth.uid() in Policies**
6. ✅ **Erstelle Indexes auf user_id Spalten**

---

## 🔐 **Security Checklist:**

- [ ] RLS aktiviert für alle Tabellen
- [ ] Policies erstellt für SELECT, INSERT, UPDATE, DELETE
- [ ] Frontend nutzt Anon Key
- [ ] Backend nutzt Service Key (wenn nötig)
- [ ] Indexes auf user_id Spalten
- [ ] Mit mehreren Accounts getestet
- [ ] Email Confirmation aktiviert
- [ ] Rate Limiting konfiguriert

---

**Erstellt am:** 16. November 2025  
**Für:** CareerSIM Production Security  
**Status:** Production-Ready
