# 📊 Token Usage & Cost Tracking Setup

## 🎯 **Was wird getrackt:**

- ✅ Token-Verbrauch pro Interview
- ✅ Kosten-Berechnung basierend auf OpenAI Pricing
- ✅ Monatliche Statistiken
- ✅ API-Model tracking (gpt-4o-mini vs gpt-4)

---

## 💰 **OpenAI Pricing (Stand November 2025):**

| Model | Input | Output |
|-------|-------|--------|
| **gpt-4o-mini-realtime** | $0.60 / 1M tokens | $2.40 / 1M tokens |
| **gpt-4o-realtime** | $5.00 / 1M tokens | $20.00 / 1M tokens |
| **gpt-4o-mini** | $0.15 / 1M tokens | $0.60 / 1M tokens |
| **gpt-4o** | $2.50 / 1M tokens | $10.00 / 1M tokens |

---

## 🗄️ **Schritt 1: Token Usage Tabelle erstellen**

### **In Supabase SQL Editor:**

```sql
-- ============================================
-- TOKEN USAGE TRACKING TABELLE
-- ============================================

CREATE TABLE IF NOT EXISTS token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  interview_id BIGINT REFERENCES interviews(id) ON DELETE SET NULL,
  
  -- Token Counts
  input_tokens INT NOT NULL DEFAULT 0,
  output_tokens INT NOT NULL DEFAULT 0,
  total_tokens INT NOT NULL DEFAULT 0,
  
  -- Model Info
  model TEXT NOT NULL DEFAULT 'gpt-4o-mini-realtime-preview-2024-12-17',
  api_type TEXT DEFAULT 'realtime', -- 'realtime' oder 'chat'
  
  -- Cost Calculation (in USD)
  input_cost DECIMAL(10, 6) DEFAULT 0,
  output_cost DECIMAL(10, 6) DEFAULT 0,
  total_cost DECIMAL(10, 6) DEFAULT 0,
  
  -- Metadata
  duration_seconds INT,
  session_type TEXT, -- 'interview', 'career_advice', 'cv_review'
  
  created_at TIMESTAMP DEFAULT now()
);

-- ============================================
-- INDEXES für Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_token_usage_user 
  ON token_usage(user_id);
  
CREATE INDEX IF NOT EXISTS idx_token_usage_created 
  ON token_usage(created_at DESC);
  
CREATE INDEX IF NOT EXISTS idx_token_usage_interview 
  ON token_usage(interview_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;

-- User kann nur seine eigene Usage sehen
CREATE POLICY "Users can view own token usage"
  ON token_usage FOR SELECT
  USING (auth.uid() = user_id);

-- User kann seine Usage erstellen (durch App)
CREATE POLICY "Users can insert own token usage"
  ON token_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTION: Kosten automatisch berechnen
-- ============================================

CREATE OR REPLACE FUNCTION calculate_token_cost()
RETURNS TRIGGER AS $$
DECLARE
  input_price DECIMAL(10, 8);
  output_price DECIMAL(10, 8);
BEGIN
  -- Preise basierend auf Model setzen
  CASE NEW.model
    WHEN 'gpt-4o-mini-realtime-preview-2024-12-17' THEN
      input_price := 0.60 / 1000000;  -- $0.60 per 1M tokens
      output_price := 2.40 / 1000000; -- $2.40 per 1M tokens
    
    WHEN 'gpt-4o-realtime-preview-2024-12-17' THEN
      input_price := 5.00 / 1000000;   -- $5.00 per 1M tokens
      output_price := 20.00 / 1000000; -- $20.00 per 1M tokens
    
    WHEN 'gpt-4o-mini' THEN
      input_price := 0.15 / 1000000;  -- $0.15 per 1M tokens
      output_price := 0.60 / 1000000; -- $0.60 per 1M tokens
    
    WHEN 'gpt-4o' THEN
      input_price := 2.50 / 1000000;   -- $2.50 per 1M tokens
      output_price := 10.00 / 1000000; -- $10.00 per 1M tokens
    
    ELSE
      -- Default: gpt-4o-mini-realtime
      input_price := 0.60 / 1000000;
      output_price := 2.40 / 1000000;
  END CASE;

  -- Kosten berechnen
  NEW.input_cost := NEW.input_tokens * input_price;
  NEW.output_cost := NEW.output_tokens * output_price;
  NEW.total_cost := NEW.input_cost + NEW.output_cost;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Automatische Kosten-Berechnung
DROP TRIGGER IF EXISTS calculate_cost_trigger ON token_usage;
CREATE TRIGGER calculate_cost_trigger
  BEFORE INSERT OR UPDATE ON token_usage
  FOR EACH ROW EXECUTE FUNCTION calculate_token_cost();

-- ============================================
-- VIEW: Monatliche Zusammenfassung
-- ============================================

CREATE OR REPLACE VIEW monthly_usage_summary AS
SELECT 
  user_id,
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_sessions,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens,
  SUM(total_tokens) as total_tokens,
  SUM(total_cost) as total_cost,
  AVG(duration_seconds) as avg_duration_seconds
FROM token_usage
GROUP BY user_id, DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- ============================================
-- FUNCTION: User Stats abrufen
-- ============================================

CREATE OR REPLACE FUNCTION get_user_usage_stats(target_user_id UUID)
RETURNS TABLE (
  total_interviews BIGINT,
  total_tokens BIGINT,
  total_cost NUMERIC,
  this_month_tokens BIGINT,
  this_month_cost NUMERIC,
  avg_tokens_per_interview NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT interview_id)::BIGINT as total_interviews,
    COALESCE(SUM(total_tokens), 0)::BIGINT as total_tokens,
    COALESCE(SUM(total_cost), 0)::NUMERIC as total_cost,
    COALESCE(SUM(CASE 
      WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE) 
      THEN total_tokens ELSE 0 
    END), 0)::BIGINT as this_month_tokens,
    COALESCE(SUM(CASE 
      WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE) 
      THEN total_cost ELSE 0 
    END), 0)::NUMERIC as this_month_cost,
    CASE 
      WHEN COUNT(DISTINCT interview_id) > 0 
      THEN (SUM(total_tokens)::NUMERIC / COUNT(DISTINCT interview_id)::NUMERIC)
      ELSE 0 
    END as avg_tokens_per_interview
  FROM token_usage
  WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SUCCESS!
-- ============================================
SELECT '✅ Token Usage Tracking erfolgreich erstellt!' as status;

-- Test Query: Deine Stats anzeigen
-- SELECT * FROM get_user_usage_stats(auth.uid());
```

---

## 📊 **Schritt 2: Usage-Dashboard in Settings anzeigen**

Das ist bereits in `settings.html` integriert! Die Seite wird:
- ✅ Monatliche Token-Usage anzeigen
- ✅ Kosten in $ und € umrechnen
- ✅ Durchschnitt pro Interview zeigen
- ✅ Chart mit Verlauf erstellen

---

## 🎯 **Wo du es in Supabase findest:**

### **1. Table Editor:**
- Klicke links auf **"token_usage"** Tabelle
- Siehst alle Token-Einträge mit Kosten

### **2. SQL Editor:**
- Führe Query aus:
```sql
SELECT * FROM token_usage WHERE user_id = auth.uid();
```

### **3. API:**
Über deine App kannst du abfragen:
```javascript
const { data } = await supabase
  .from('token_usage')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(10);
```

---

## 💡 **Beispiel-Daten:**

Nach einem Interview siehst du z.B.:

| user_id | input_tokens | output_tokens | model | total_cost |
|---------|--------------|---------------|-------|------------|
| abc123  | 1500         | 800           | gpt-4o-mini-realtime | $0.0028 |
| abc123  | 2300         | 1200          | gpt-4o-mini-realtime | $0.0043 |

**Monatlich:** ~$0.50 für 100 Interviews (sehr günstig!)

---

## 🔍 **Test-Queries:**

```sql
-- Deine gesamten Kosten
SELECT SUM(total_cost) as total_spent 
FROM token_usage 
WHERE user_id = auth.uid();

-- Diesen Monat
SELECT SUM(total_cost) as month_spent 
FROM token_usage 
WHERE user_id = auth.uid() 
  AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE);

-- Pro Model
SELECT model, COUNT(*), SUM(total_cost) as cost
FROM token_usage 
WHERE user_id = auth.uid()
GROUP BY model;
```

---

**Erstellt am:** 16. November 2025  
**Status:** ✅ Production-Ready
