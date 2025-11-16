# 📄 CV Storage Setup mit Supabase

## 🎯 **Was wird gespeichert:**

- ✅ PDF-Lebensläufe
- ✅ User-spezifisch (jeder User sein eigener CV)
- ✅ Automatischer Download für Interviews
- ✅ Versionierung (alter CV wird überschrieben)

---

## 🚀 **Schritt 1: Storage Bucket erstellen**

### **In Supabase:**
1. Gehe zu **Storage** (links im Menü)
2. Klicke **"New bucket"**
3. Name: `cvs`
4. **Public bucket:** `OFF` (private!)
5. **Klicke "Create bucket"**

---

## 🔐 **Schritt 2: Storage Policies erstellen**

### **In Supabase SQL Editor:**

```sql
-- Storage Policy: User kann nur seinen eigenen CV hochladen
CREATE POLICY "Users can upload own CV"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'cvs' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage Policy: User kann nur seinen eigenen CV lesen
CREATE POLICY "Users can view own CV"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'cvs' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage Policy: User kann nur seinen eigenen CV aktualisieren
CREATE POLICY "Users can update own CV"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'cvs' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage Policy: User kann nur seinen eigenen CV löschen
CREATE POLICY "Users can delete own CV"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'cvs' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## 📊 **Schritt 3: Profile Tabelle erweitern**

```sql
-- CV-Felder zur profiles Tabelle hinzufügen
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS cv_url TEXT,
ADD COLUMN IF NOT EXISTS cv_uploaded_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS cv_filename TEXT;

-- Kommentar für Dokumentation
COMMENT ON COLUMN profiles.cv_url IS 'Supabase Storage URL zum CV';
COMMENT ON COLUMN profiles.cv_uploaded_at IS 'Zeitpunkt des letzten CV-Uploads';
COMMENT ON COLUMN profiles.cv_filename IS 'Original-Dateiname des CVs';
```

---

## ✅ **Fertig!**

Nach diesen 3 Schritten:
- ✅ Bucket `cvs` existiert
- ✅ Storage Policies aktiv
- ✅ Profile Tabelle hat CV-Felder

Jetzt kann der Code CVs hochladen! 🎉
