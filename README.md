# AIFormazione

Piattaforma che genera corsi di formazione sulla sicurezza sul lavoro (D.Lgs. 81/08) con l'AI.
Output per corso: **corso (DOCX)**, **quiz (XLSX)**, **copioni avatar (DOCX)** per LearnWorlds e HeyGen.

## Documentazione

- **[docs/LOGICA_PROGETTO_E_AGENTI.md](docs/LOGICA_PROGETTO_E_AGENTI.md)** — architettura e logica della pipeline (Fasi A–F) e degli 8 agenti AI.
- **[docs/STATO_PROGETTOv10.md](docs/STATO_PROGETTOv10.md)** — stato del progetto, backend Supabase, KB.
- **[docs/GUIDA_GENERAZIONE_CORSI.md](docs/GUIDA_GENERAZIONE_CORSI.md)** — convenzioni di output, template, script.
- **[docs/TODO.md](docs/TODO.md)** — piano di lavoro a due con mappa proprietà file.
- **[CLAUDE_CODE_COLLABORATION.md](CLAUDE_CODE_COLLABORATION.md)** — workflow Git/PR per collaborare senza conflitti.

## Stack

- **Frontend:** React (`src/App.jsx`), Vite, deploy su Vercel.
- **Backend:** Supabase (`zdvzxkzdkazewotiivxw`, eu-central-1) — Auth, DB con RLS, Edge Function `genera-lezione` (proxy Anthropic).
- **AI:** API Anthropic, modello `claude-sonnet-4-6`.
- **Agenti CLI/Node:** `Agente_Corsi/` (ESM, `"type": "module"`).

## Setup locale

```bash
# 1. clona il repo
git clone <url-repo>
cd aiformazione

# 2. dipendenze degli agenti Node
cd Agente_Corsi && npm install

# 3. variabili d'ambiente (NON committare il .env)
cp .env.example .env
#   compila ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY,
#   (opzionale) SUPABASE_SERVICE_ROLE_KEY
```

> ⚠️ La `SUPABASE_ANON_KEY` è pubblica (protetta da RLS). Le chiavi vere — `ANTHROPIC_API_KEY` e `SUPABASE_SERVICE_ROLE_KEY` — stanno **solo** nel `.env` locale (gitignorato) e nei secret della Edge Function. Mai nel codice committato.

## Collaborazione

Si lavora in due con feature branch + Pull Request. Prima di iniziare una task leggere
[CLAUDE_CODE_COLLABORATION.md](CLAUDE_CODE_COLLABORATION.md) e la **mappa proprietà file** in [docs/TODO.md](docs/TODO.md): _un file = un solo owner alla volta_.

## Nota su dati e binari

Non sono versionati nel repo (vedi `.gitignore`): `node_modules/`, dump CSV del DB, PDF/PPTX sorgente, output DOCX/XLSX generati. Si condividono fuori dal repo o via Git LFS.
