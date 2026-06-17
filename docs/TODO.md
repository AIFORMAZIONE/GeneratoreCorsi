# TODO — Realizzazione progetto AIFormazione (LOGICA_PROGETTO_E_AGENTI)

_Piano operativo per costruire il sistema descritto in [LOGICA_PROGETTO_E_AGENTI.md](LOGICA_PROGETTO_E_AGENTI.md), lavorando in **due** con Claude Code + GitHub._
_Convenzioni Git/PR: vedi **CLAUDE_CODE_COLLABORATION.md**. Aggiornato: 2026-06-17._

**Persone:** **A = Davide** · **B = Collega**
**Regola d'oro anti-conflitto:** _un file ha UN SOLO owner alla volta. Nessuno tocca i file dell'altro finché non sono mergiati su `main`._

---

## 🎯 Obiettivo

Costruire la pipeline a 6 fasi (A→F) con gli 8 agenti: **Validazione KB, Argomenti, Struttura, Generazione Corso, Copione, Quiz, Presentazione, Revisione**, più **pagina corso**, **pubblicazione** (LearnWorlds/HeyGen/social) e tabelle DB nuove.

---

## 🧱 Struttura repo target (un file per agente = lavoro parallelo senza conflitti)

```
aiformazione/                         (repo GitHub — nome da confermare)
├── Agente_Corsi/
│   ├── corsi_config.js               [A]  config normativa (append-only)
│   ├── orchestratore.js              [A]  coordina gli agenti
│   ├── contracts.js                  [⛔ CONGELATO] interfacce dati condivise
│   ├── agenti/
│   │   ├── agente_validazione_kb.js  [A]  Fase A
│   │   ├── agente_argomenti.js       [A]  Fase B
│   │   ├── agente_struttura.js       [A]  Fase C (esiste, da rifinire)
│   │   ├── agente_generazione.js     [A]  Fase D
│   │   ├── agente_quiz.js            [A]  Fase D
│   │   ├── agente_copione.js         [B]  Fase D
│   │   ├── agente_presentazione.js   [B]  Fase E
│   │   └── agente_revisione.js       [B]  Fase F
│   └── integrazioni/
│       ├── heygen.js                 [B]
│       ├── learnworlds.js            [B]
│       └── social.js                 [B]
├── supabase/migrations/              file separati per migrazione (no conflitto)
├── src/                              FRONTEND — owner unico: B
│   ├── App.jsx                       [B]
│   └── components/PaginaCorso.jsx    [B]
├── docs/                             file separati per documento
├── CLAUDE_CODE_COLLABORATION.md
├── .gitignore   ·   README.md
```

> ⚠️ I file **condivisi critici** (`corsi_config.js`, `orchestratore.js`, `contracts.js`, `src/App.jsx`) hanno **un solo owner**. L'altro propone modifiche **solo via PR**, mai editandoli sul proprio branch.

---

## 🗺️ Mappa proprietà file (la usate per NON pestarvi i piedi)

| Area | File | Owner |
|---|---|---|
| Config normativa | `corsi_config.js` | **A** |
| Orchestrazione | `orchestratore.js` | **A** |
| Contratti dati | `contracts.js` | **A** (congelato, modifiche a 4 mani) |
| Validazione KB | `agenti/agente_validazione_kb.js` | **A** |
| Argomenti | `agenti/agente_argomenti.js` | **A** |
| Struttura | `agenti/agente_struttura.js` | **A** |
| Generazione Corso | `agenti/agente_generazione.js` | **A** |
| Quiz | `agenti/agente_quiz.js` | **A** |
| Edge Function `genera-lezione` | backend Supabase | **A** |
| Copione | `agenti/agente_copione.js` | **B** |
| Presentazione | `agenti/agente_presentazione.js` | **B** |
| Revisione | `agenti/agente_revisione.js` | **B** |
| Integrazioni | `integrazioni/heygen.js · learnworlds.js · social.js` | **B** |
| Frontend | `src/App.jsx · src/components/*` | **B** |
| Migrazioni DB | `supabase/migrations/<timestamp>_<nome>.sql` | chi crea la tabella |
| Docs | `docs/*` (un file a testa) | autore del file |

**Divisione logica:** **A = motore contenuti (Fase A–D + DB + backend)** · **B = output, pubblicazione, UI (Fase E–F + frontend + integrazioni)**.

---

## 0️⃣ FASE 0 — Setup condiviso (PRIMA di tutto, insieme)

> Da fare in coppia in una sola sessione: dopo questa, si lavora in parallelo senza toccarsi.

- [ ] **[A]** Creare repo GitHub `aiformazione`, push del codice esistente (`Agente_Corsi/`, `src/`, `docs/`), `.gitignore` (node_modules, .env, *.docx/xlsx generati), `README.md`. Branch protetto su `main` (no push diretto).
- [ ] **[A+B]** Definire e **CONGELARE** `contracts.js` — le interfacce dati tra agenti (vedi §Contratti sotto). Niente codice parte prima che questo sia approvato da entrambi.
- [ ] **[A]** Creare lo **scaffold**: cartelle `agenti/`, `integrazioni/`, `src/components/`, con file **stub vuoti** (solo `export` placeholder) per ogni agente → così ogni owner ha già il suo file e i confini esistono.
- [ ] **[A+B]** Copiare `CLAUDE_CODE_COLLABORATION.md` nel repo e compilare la tabella "Chi sta facendo cosa".
- [ ] **[B]** Verificare accesso alle API esterne: HeyGen (key), LearnWorlds (import/API), credenziali social.

---

## 📐 Contratti dati condivisi (`contracts.js`) — da congelare in Fase 0

Le strutture che gli agenti si scambiano (così A e B sviluppano contro interfacce stabili):

```js
// Struttura corso (output Agente Struttura → input generazione)
Struttura = { titolo_corso, destinatari, ore_totali, n_lezioni, moduli[], lezioni:[{n, modulo, titolo, focus, tipo, kb_disponibile}] }
// Lezione generata (output Generazione → input Copione/Quiz)
Lezione   = { numero, titolo, modulo, testo_md, parole, articoli_usati[], chunk_usati[] }
// Asset (riga asset_corso) — prodotto da chi genera, consumato da pubblicazione/revisione
Asset     = { corso_id, tipo, versione, file_url, stato }
// Esito validazione KB
Validaz.  = { argomento_id, troncato, coerente, esito }
```

---

## 1️⃣ MILESTONE 1 — Motore contenuti [A] ∥ Output base [B]

### A — Fase A–D
- [ ] **[A]** `feature/agente-validazione-kb` → `agente_validazione_kb.js`: controlla chunk non troncati + coerenti, scrive `validazione_kb`. + migrazione `..._validazione_kb.sql`.
- [ ] **[A]** `feature/agente-generazione` → `agente_generazione.js`: prompt v5, recupero chunk+articoli, output `Lezione` (1.400-1.900 parole), retry troncamenti.
- [ ] **[A]** `feature/agente-quiz` → `agente_quiz.js`: domande multiple per lezione/modulo, export XLSX Question Bank.

### B — Fase D–E (in parallelo, file diversi)
- [ ] **[B]** `feature/agente-copione` → `agente_copione.js`: da `Lezione.testo_md` a monologo avatar 2.500-3.000 parole.
- [ ] **[B]** `feature/agente-presentazione` → `agente_presentazione.js`: presentazione ~1000 caratteri per Agenti Social.
- [ ] **[B]** `feature/db-asset-corso` → migrazione `..._asset_corso.sql` (tabella asset_corso).

---

## 2️⃣ MILESTONE 2 — Orchestrazione + Output/Pubblicazione

### A
- [ ] **[A]** `feature/orchestratore` → `orchestratore.js`: coordina Struttura→Generazione→(Copione/Quiz), gruppi di 3 in parallelo, logging.
- [ ] **[A]** `feature/agente-argomenti` → `agente_argomenti.js`: normalizza programma docente in tag piatti.

### B
- [ ] **[B]** `feature/integrazione-heygen` → `integrazioni/heygen.js`: invio copioni a HeyGen via API.
- [ ] **[B]** `feature/integrazione-learnworlds` → `integrazioni/learnworlds.js`: upload corso+quiz.
- [ ] **[B]** `feature/db-pubblicazioni` → migrazione `..._pubblicazioni.sql`.

---

## 3️⃣ MILESTONE 3 — Pagina corso + Revisione (feedback loop)

### B
- [ ] **[B]** `feature/pagina-corso` → `src/components/PaginaCorso.jsx` + wiring in `App.jsx`: download/upload + storico per sezione (Corso, Quiz, Copioni/video, Email, Presentazione, Anteprima, Pubblica).
- [ ] **[B]** `feature/integrazione-social` → `integrazioni/social.js`: anteprima video+post, pubblica per ogni social.

### A
- [ ] **[A]** `feature/agente-revisione` → `agente_revisione.js` + migrazione `..._revisioni.sql`: confronta generato vs corretto, aggiorna prompt/regole.
  - _Nota: tocca i prompt degli agenti di A; se servono modifiche a file di B, via PR._

---

## ⚙️ Workflow per ogni task (sintesi di CLAUDE_CODE_COLLABORATION.md)

1. `git checkout main && git pull origin main`
2. `git checkout -b feature/<nome-task>` (nome = esattamente cosa fai)
3. Avvisa il collega: _"sto lavorando su `<file>` fino a <data>"_ + aggiorna la tabella sotto
4. Lavora **solo sui tuoi file**, commit ogni 1-2 ore (messaggi chiari in italiano)
5. `git push origin feature/<nome-task>` → Pull Request → review del collega → **Squash & merge**
6. Entrambi: `git checkout main && git pull origin main`

**Mai:** push diretto su `main` · editare un file di cui non sei owner · branch giganti (un branch = una feature).

---

## 📊 Chi sta facendo cosa (AGGIORNARE a ogni task)

| Task | Owner | Branch | File | Stato | Fine |
|------|-------|--------|------|-------|------|
| Setup repo + scaffold | A | `chore/setup-repo` | repo, stub | Da iniziare | — |
| Contratti dati | A+B | `chore/contracts` | `contracts.js` | Da iniziare | — |
| Agente Generazione | A | `feature/agente-generazione` | `agente_generazione.js` | Da iniziare | — |
| Agente Copione | B | `feature/agente-copione` | `agente_copione.js` | Da iniziare | — |

---

## 🔗 Dipendenze (ordine consigliato)

- `contracts.js` **prima di tutto** (blocca tutto il resto).
- `Generazione Corso` [A] prima di `Copione`/`Quiz` (ne consumano l'output) → ma B può sviluppare contro lo stub `Lezione` definito nei contratti, in parallelo.
- `orchestratore` [A] dopo che gli agenti base esistono.
- `Pagina corso` [B] dopo `asset_corso` + integrazioni.
- `Revisione` [A] per ultimo (chiude il loop su tutti gli output).

---

## ✅ Già fatto (base esistente, non da rifare)

- [x] `corsi_config.js` (config normativa 10 tipi corso) — esiste
- [x] `agente_struttura.js` (proposta indice + gap analysis) — esiste, da rifinire e spostare in `agenti/`
- [x] Edge Function `genera-lezione` (proxy Anthropic, key server-side)
- [x] Auth + RLS + tabella `profiles`, funzione `cerca_materiale` con sinonimi
- [x] Output DOCX corso + XLSX quiz + DOCX copioni (versione pilota)
- [x] **KB articoli_dlgs: 132 articoli troncati risolti (2026-06-17)** — vedi STATO_PROGETTOv10
- [x] App.jsx frontend su Vercel (monolitico, da modularizzare in `src/components/`)

---

## ❓ Da confermare prima della Fase 0

- Nome del repo GitHub (`aiformazione`?) e chi lo crea.
- Un solo repo per AIFormazione, separato da `nido-di-agenti`.
- Email/username Git di entrambi (per `git config`).
