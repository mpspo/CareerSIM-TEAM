# 🚀 Git & GitHub Anleitung für Teamarbeit

## 📋 Inhaltsverzeichnis
1. [Grundlagen](#grundlagen)
2. [Projekt Setup](#projekt-setup)
3. [Täglicher Workflow](#täglicher-workflow)
4. [Befehle Übersicht](#befehle-übersicht)
5. [Problemlösungen](#problemlösungen)

---

## 🎯 Grundlagen

### Was ist Git?
Git ist ein **Versionskontrollsystem** - wie eine Zeitmaschine für deinen Code:
- Speichert alle Änderungen
- Du kannst zurück zu früheren Versionen
- Mehrere Personen können gleichzeitig arbeiten

### Was ist GitHub?
GitHub ist ein **Online-Speicher** für Git-Projekte:
- Wie Google Drive, aber für Code
- Team kann von überall zugreifen
- Alle haben die gleiche Version

---

## 🛠️ Projekt Setup

### Für dich (bereits erledigt ✅)
Dein Projekt ist bereits verbunden mit:
```
https://github.com/mpspo/CareerSIM-TEAM.git
```

### Für deinen Kollegen (auf neuem MacBook)

#### Schritt 1: Git installieren
```bash
# Prüfen ob Git installiert ist
git --version
```

Wenn nicht installiert, wird macOS automatisch fragen, ob du es installieren möchtest.

#### Schritt 2: Projekt klonen
```bash
# In den Dokumente-Ordner wechseln
cd ~/Documents

# Projekt herunterladen
git clone https://github.com/mpspo/CareerSIM-TEAM.git

# In den Projektordner wechseln
cd CareerSIM-TEAM
```

#### Schritt 3: Node.js Abhängigkeiten installieren
```bash
npm install
```

#### Schritt 4: Umgebungsvariablen einrichten
Erstelle eine `.env` Datei im Hauptordner:
```bash
touch .env
```

Öffne die Datei und füge ein:
```
OPENAI_API_KEY=sk-dein-api-key-hier
```

#### Schritt 5: Server testen
```bash
node server.js
```

Öffne im Browser: `http://localhost:3000`

---

## 🔄 Täglicher Workflow

### 📥 Morgens: Neueste Version holen

**Bevor du anfängst zu arbeiten:**

```bash
# Neueste Änderungen vom Team holen
git pull origin main
```

**Was passiert:**
- Lädt alle Änderungen von GitHub herunter
- Aktualisiert deine lokale Version
- Jetzt hast du die gleiche Version wie dein Kollege

---

### 💻 Während der Arbeit: Änderungen machen

1. **Arbeite an deinem Code** in VSCode
2. **Speichere regelmäßig** (⌘+S)

---

### 📤 Abends: Änderungen hochladen

#### Schritt 1: Status prüfen
```bash
git status
```

**Zeigt dir:**
- Welche Dateien du geändert hast (rot)
- Welche Dateien bereit zum Speichern sind (grün)

---

#### Schritt 2: Dateien vorbereiten (Staging)
```bash
# Alle Änderungen hinzufügen
git add .
```

**Alternative: Einzelne Dateien**
```bash
git add interview.html
git add dashboard.html
```

**Was ist "git add"?**
- Wie Produkte in den Einkaufswagen legen 🛒
- Markiert Dateien als "bereit zum Speichern"
- Noch nicht endgültig gespeichert!

---

#### Schritt 3: Änderungen speichern (Commit)
```bash
git commit -m "Kurze Beschreibung der Änderungen"
```

**Beispiele für gute Commit-Messages:**
```bash
git commit -m "Chat-Funktion im Interview hinzugefügt"
git commit -m "Dashboard Layout verbessert"
git commit -m "Fehler in Evaluation behoben"
git commit -m "OpenAI API Integration aktualisiert"
```

**Was ist "git commit"?**
- Wie an der Kasse bezahlen 💳
- Speichert einen Snapshot deines Codes
- Mit Beschreibung (die Quittung)
- Jetzt ist es fix gespeichert!

---

#### Schritt 4: Zu GitHub hochladen (Push)
```bash
git push origin main
```

**Was passiert:**
- Lädt deine Änderungen zu GitHub hoch
- Dein Kollege kann sie jetzt mit `git pull` holen

---

### ⚠️ Wenn beide gleichzeitig arbeiten

#### Problem:
```bash
git push origin main

# ❌ Fehler!
# error: failed to push some refs
# Updates were rejected because the remote contains work...
```

**Bedeutung:** Dein Kollege hat schon Änderungen hochgeladen.

#### Lösung:
```bash
# Schritt 1: Beide Versionen kombinieren
git pull origin main --rebase

# Schritt 2: Jetzt hochladen
git push origin main
```

**Was macht "--rebase"?**
- Lädt Änderungen deines Kollegen herunter
- Setzt DEINE Änderungen oben drauf
- Kombiniert beide automatisch
- Beide Änderungen bleiben erhalten! ✅

---

## 📚 Befehle Übersicht

### Grundlegende Befehle

| Befehl | Was passiert | Wann nutzen |
|--------|--------------|-------------|
| `git status` | Zeigt geänderte Dateien | Vor jedem Commit - um zu sehen was du änderst |
| `git add .` | Alle Dateien vorbereiten | Wenn du alles speichern willst |
| `git add datei.html` | Einzelne Datei vorbereiten | Wenn du nur bestimmte Dateien speichern willst |
| `git commit -m "Text"` | Änderungen speichern | Wenn du einen Snapshot erstellen willst |
| `git push origin main` | Zu GitHub hochladen | Wenn du deine Arbeit teilen willst |
| `git pull origin main` | Von GitHub herunterladen | Bevor du anfängst zu arbeiten |

### Erweiterte Befehle

| Befehl | Was passiert | Wann nutzen |
|--------|--------------|-------------|
| `git pull origin main --rebase` | Kombiniert eure Versionen | Wenn Push fehlschlägt |
| `git log` | Zeigt Commit-Historie | Um zu sehen was geändert wurde |
| `git diff` | Zeigt Änderungen an | Um zu sehen WAS du geändert hast |
| `git reset` | Entfernt aus Staging | Wenn du `git add` rückgängig machen willst |

---

## 🔍 Die drei Bereiche in Git

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Working         │     │ Staging         │     │ Repository      │
│ Directory       │────▶│ Area            │────▶│ (Commits)       │
│                 │     │                 │     │                 │
│ Deine Dateien   │     │ Mit "git add"   │     │ Mit "git commit"│
│ in VSCode       │     │ vorbereitet     │     │ gespeichert     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
      (Ändern)              (git add)              (git commit)
```

---

## 💡 Best Practices

### ✅ DO (Mach das):

1. **Vor dem Arbeiten immer pullen**
   ```bash
   git pull origin main
   ```

2. **Oft committen und pushen**
   ```bash
   # Nach jeder größeren Änderung
   git add .
   git commit -m "Kleine Änderung"
   git push origin main
   ```

3. **Gute Commit-Messages schreiben**
   ```bash
   ✅ git commit -m "Chat-Funktion hinzugefügt"
   ✅ git commit -m "Dashboard-Bug behoben"
   ❌ git commit -m "update"
   ❌ git commit -m "fix"
   ```

4. **An verschiedenen Dateien arbeiten**
   ```
   Du:      dashboard.html
   Kollege: interview.html
   → Keine Konflikte! ✅
   ```

5. **Kommunizieren**
   ```
   "Ich arbeite gerade an interview.html"
   "Ich pushe jetzt"
   ```

---

### ❌ DON'T (Mach das nicht):

1. **Ohne Commit pullen**
   ```bash
   # Du hast Änderungen gemacht
   git pull origin main  # ❌ Gefährlich!
   
   # Richtig:
   git add .
   git commit -m "Meine Änderungen"
   git pull origin main --rebase  # ✅
   ```

2. **Lange ohne Push arbeiten**
   ```bash
   # 3 Tage ohne Push = Viele Konflikte! ❌
   
   # Besser: Jeden Tag pushen ✅
   ```

3. **An der gleichen Datei gleichzeitig arbeiten**
   ```bash
   # Beide ändern interview.html Zeile 100
   → Konflikt! ⚠️
   
   # Besser: Abwechselnd oder verschiedene Dateien ✅
   ```

---

## 🆘 Problemlösungen

### Problem 1: Push funktioniert nicht

**Fehlermeldung:**
```
error: failed to push some refs
Updates were rejected because the remote contains work...
```

**Lösung:**
```bash
git pull origin main --rebase
git push origin main
```

---

### Problem 2: Merge Konflikt

**Fehlermeldung:**
```
CONFLICT (content): Merge conflict in interview.html
```

**Was ist passiert:**
- Du und dein Kollege haben die **gleiche Zeile** in der **gleichen Datei** geändert
- Git weiß nicht, welche Version richtig ist

**Lösung:**

1. **Öffne die Datei in VSCode**
   
   Du siehst:
   ```javascript
   <<<<<<< HEAD
   const phase = 2;  // Deine Version
   =======
   const phase = 1;  // Kollege's Version
   >>>>>>> 
   ```

2. **Wähle die richtige Version** oder kombiniere beide:
   ```javascript
   const phase = 2;  // Entschieden: Deine Version
   ```

3. **Speichern und fortfahren:**
   ```bash
   git add .
   git rebase --continue
   git push origin main
   ```

---

### Problem 3: Änderungen rückgängig machen

**Vor dem Commit (noch nicht gespeichert):**
```bash
# Alle Änderungen verwerfen
git restore .

# Einzelne Datei verwerfen
git restore interview.html
```

**Nach dem Commit (schon gespeichert):**
```bash
# Letzten Commit rückgängig (Änderungen bleiben)
git reset --soft HEAD~1

# Letzten Commit komplett löschen
git reset --hard HEAD~1  # ⚠️ VORSICHT!
```

---

### Problem 4: Falschen Commit hochgeladen

**Noch nicht gepusht:**
```bash
# Commit-Message ändern
git commit --amend -m "Neue bessere Message"
```

**Schon gepusht:**
```bash
# Neuen Commit erstellen, der den alten rückgängig macht
git revert HEAD
git push origin main
```

---

## 📖 Supermarkt-Analogie

Zur Erinnerung, wie Git funktioniert:

### 🛒 Einkaufen = Git Workflow

1. **Produkte aussuchen** = Dateien ändern in VSCode
   ```bash
   # Du schreibst Code...
   ```

2. **In Einkaufswagen legen** = git add
   ```bash
   git add .
   ```
   - Produkte sind im Wagen
   - Du kannst noch ändern
   - Noch nicht bezahlt

3. **An Kasse bezahlen** = git commit
   ```bash
   git commit -m "Einkauf vom Samstag"
   ```
   - Jetzt bezahlt mit Quittung
   - Gekauft und fix
   - Kann nicht mehr ändern (nur zurückgeben)

4. **Nach Hause bringen** = git push
   ```bash
   git push origin main
   ```
   - Einkauf ist jetzt zu Hause (auf GitHub)
   - Familie kann es sehen und nutzen

5. **Einkauf von Familie holen** = git pull
   ```bash
   git pull origin main
   ```
   - Dein Mitbewohner war auch einkaufen
   - Du holst seine Sachen auch ins Haus
   - Jetzt habt ihr beide alles

---

## 🎯 Schnellreferenz

### Jeden Morgen:
```bash
git pull origin main
```

### Nach der Arbeit:
```bash
git add .
git commit -m "Beschreibung"
git push origin main
```

### Bei Fehler:
```bash
git pull origin main --rebase
git push origin main
```

### Status prüfen:
```bash
git status
```

---

## 📞 Hilfreiche Links

- **GitHub Repository:** https://github.com/mpspo/CareerSIM-TEAM
- **Git Dokumentation:** https://git-scm.com/doc
- **GitHub Desktop** (GUI Alternative): https://desktop.github.com/

---

## ✅ Checkliste für neues Teammitglied

- [ ] Git installiert (`git --version`)
- [ ] Repository geklont (`git clone ...`)
- [ ] Node.js installiert (`node --version`)
- [ ] Abhängigkeiten installiert (`npm install`)
- [ ] `.env` Datei erstellt mit OpenAI Key
- [ ] Server läuft (`node server.js`)
- [ ] Erster Pull funktioniert (`git pull origin main`)
- [ ] Ersten Commit gemacht (`git commit`)
- [ ] Ersten Push gemacht (`git push origin main`)

---

## 🎓 Zusammenfassung

### Die wichtigsten 4 Befehle:

```bash
# 1. Vor dem Arbeiten
git pull origin main

# 2. Änderungen vorbereiten
git add .

# 3. Änderungen speichern
git commit -m "Was du gemacht hast"

# 4. Änderungen hochladen
git push origin main
```

### Das war's! 🎉

Mit diesen 4 Befehlen könnt ihr zu zweit am gleichen Projekt arbeiten.

---

**Erstellt am:** 16. November 2025  
**Für Projekt:** CareerSIM-TEAM  
**Repository:** https://github.com/mpspo/CareerSIM-TEAM
