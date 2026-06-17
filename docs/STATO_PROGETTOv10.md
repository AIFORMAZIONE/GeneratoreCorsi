# STATO PROGETTO — AIFormazione (v10)

_Documento di contesto persistente. Caricare a inizio sessione. Aggiornato dopo la sessione di fix articoli_dlgs: correzione troncamenti sui 22 articoli "datore di lavoro", con patch DL 159/2025 e ISO 45001._

---

## 1. Scopo e contesto

**AIFormazione** è una piattaforma che genera corsi di formazione sulla sicurezza sul lavoro (D.Lgs. 81/08) con l'AI. Utenti: Davide (sviluppatore) e una docente non tecnica che approva e usa l'app. Obiettivo: ridurre al minimo la supervisione manuale producendo output professionali e strutturati per LearnWorlds.

**Output per corso:** documento corso (DOCX), quiz (XLSX), copioni avatar HeyGen (DOCX, ~8-10 min/lezione a ~300 parole/min).

---

## 2. Architettura e stack (stato attuale)

- **Frontend:** app React in un unico file `src/App.jsx` (progetto Vite), **pubblicata su Vercel**.
  - Progetto Vercel: `generatore-corsi` (team `daviisulu-3817s-projects`).
  - URL produzione: `https://generatore-corsi.vercel.app`.
  - Struttura repo: `index.html`, `package.json`, `vite.config.js`, `src/main.jsx`, `src/App.jsx`.
  - Il file che si modifica è **sempre** `src/App.jsx` (etichettato `App.jsx` quando consegnato).
- **Backend:** Supabase, progetto `zdvzxkzdkazewotiivxw` (eu-central-1).
  - Autenticazione, database con RLS, ed Edge Function come proxy verso l'API Anthropic.
- **AI:** API Anthropic, modello **`claude-sonnet-4-6`** (il vecchio `claude-sonnet-4-20250514` è ritirato).
- **Target:** LearnWorlds (e-learning), HeyGen (video avatar).

---

## 3. Cosa è stato completato (fasi 1-7, consolidate)

### Fase 1 — Sicurezza DB (base)
- `articoli_dlgs` (306 articoli) era **senza RLS** (chiunque con la anon key poteva cancellarli). Ora RLS attiva, **sola lettura** per utenti autenticati.
- Fissato `search_path` della funzione `aggiorna_updated_at`.

### Fase 2 — Backend per la chiave Anthropic
- Creata Edge Function **`genera-lezione`** (proxy verso Anthropic). La chiave `ANTHROPIC_API_KEY` vive **solo** come secret della funzione, mai nel browser.
- Funzionalità: retry con backoff esponenziale + jitter su 429/5xx/529; rilevamento troncamenti (`stop_reason: max_tokens`); calcolo token e costo; logging di ogni chiamata.
- Tabella **`generazioni_log`** + vista **`riepilogo_generazioni`** (`security_invoker`).
- `verify_jwt: true` (richiede un token di progetto valido).
- Il frontend ora chiama la funzione invece di `api.anthropic.com`.

### Fase 3 — Auth + chiusura RLS
- **Supabase Auth email + password.** Tabella **`profiles`** (id, email, `ruolo` ∈ {developer, docente}) con trigger `handle_new_user` che crea il profilo alla registrazione.
- Account creati nel dashboard (gli account li crea Davide, non l'AI). Utente developer: `daviisulu@gmail.com`.
- Schermata di **login** nell'app (sessione in memoria; refresh = nuovo login).
- **RLS chiusa (3c):** rimossi tutti gli accessi anonimi. Le tre viste `SECURITY DEFINER` convertite a `security_invoker`. Funzioni `cerca_materiale` e `ruolo_corrente` rese `security_invoker` con execute revocato all'anon.
- Advisor di sicurezza: **nessun ERROR**.

### Ricerca robusta con sinonimi (extra, durante la fase 3)
- Funzione **`normalizza`**, tabella **`argomenti_sinonimi`** (~50 termini iniziali), funzione **`cerca_materiale(termine)`** con espansione sinonimi e ricerca token-wildcard normalizzata.
- Il frontend usa `cerca_materiale` sia per la **verifica gap** sia per la **generazione**.

### Fase 4 — Step di outline/indice
- Pulsante **"Proponi indice con AI"**: l'AI propone N lezioni distinte con titolo, focus e argomenti. Editabile prima di generare.
- Materiale mirato per lezione, messo in cache per insieme di argomenti.

### Fase 5 — Robustezza generazione
- **Auto-riprovo sui troncamenti:** max_tokens 4500 → retry 8000. Badge "⚠ Troncata" se persiste.
- **Riprovo per singola lezione** con pulsante "↺ Rigenera questa lezione".
- **Visibilità costi:** per lezione e totali.

### Fase 6 — Output reali
- **Corso (DOCX):** documento Word reale via `docx@9.6.1`.
- **Quiz (XLSX):** ~2 domande per lezione via AI → foglio Excel SheetJS, pronto per LearnWorlds.
- **Copioni avatar (DOCX):** ~2500-3000 parole per lezione, on-demand.

### Fase 7 — Proposta argomenti con AI + import programma
- Blocco **"Proponi argomenti con l'AI"**: AI normalizza il programma della docente in tag piatti agganciabili alla KB. Accetta/scarta i proposti come chip.
- **Import da `.docx`** con `mammoth` (`extractRawText`). Si può anche incollare testo.
- Nessuna modifica al backend: riusa Edge Function e `cerca_materiale`.

---

## 3-bis. Sessione corrente — Fix articoli_dlgs (22 articoli datore di lavoro)

**Problema risolto.** La colonna `testo_completo` della tabella `articoli_dlgs` era stata inserita con un limite di 1.500 caratteri. Su 306 articoli totali, 154 erano troncati. Per il corso Datore di Lavoro 16h, 22 articoli chiave erano inutilizzabili per un prompt serio.

**Fonte adottata.** Bosetti & Gatti (`bosettiegatti.eu/info/norme/statali/2008_0081.htm`), testo consolidato a Windows-1252, estratto con BeautifulSoup via ancore `<a name="NNN">`. Aggiornato a L.203/2024 in vigore dal 12/01/2025. Per le modifiche DL 159/2025 (in vigore 31/12/2025) si è usato il PDF utente (`TU-81-08-Ed_-Gennaio-2026.pdf`, edizione Amato, Jan 2026) come riscontro e fonte per i commi mancanti.

**Patch applicate:**
- **Art.16**: aggiunta lettera e) ("che la delega sia accettata dal delegato per iscritto") — DL 31/10/2025 n.159 conv. L.29/12/2025 n.198, in vigore 31/12/2025.
- **Art.30 comma 5**: "British Standard OHSAS 18001:2007" → "**UNI EN ISO 45001:2023+A1:2024**" — stessa legge.
- **Art.30**: aggiunti commi **5-bis** e **5-ter** (commissione semplificate PMI; convenzioni INAIL-UNI), estratti dal PDF utente (page-break crossing).
- **Art.39**: aggiunto comma **2-bis** (decreto Ministro salute sui requisiti strutture), estratto dal PDF.
- **Titoli corretti** (rimossi numeri pagina incollati): Art.27, 28, 29, 32, 34.

**Risultato:**
| | Prima | Dopo |
|---|---|---|
| Articoli troncati (≥1499 char) nella tabella | 154 | **150** |
| Articoli ≥1499 tra i 22 datore | 22 | 0 (tutti corretti) |
| Max chars (Art.18) | 1.500 | **8.134** |
| Media chars tabella | ~1.200 | ~1.248 |

I 4 articoli datore ora con char < 1499 sono brevi per natura: Art.17 (262), Art.34 (1.318), Art.40 (1.105), Art.59 (334). I 150 troncati residui sono articoli fuori scope datore (rischi specifici, cantieri, agenti chimici ecc.) — da affrontare in un ciclo futuro se necessario.

**File intermedi prodotti (sessione):**
- `/tmp/bg.html` — HTML scaricato da Bosetti & Gatti
- `/tmp/articoli_final.json` — 22 articoli estratti con patch applicate
- `/tmp/clean_22_v2.pkl` — testi finali prima dell'invio al DB
- `/mnt/user-data/outputs/Anteprima_22art_datore.docx` — documento di anteprima mostrato prima del write

---

## 4. Oggetti backend (Supabase)

**Tabelle (public):** `documenti`, `argomenti`, `corsi_generati`, `ingestion_log`, `articoli_dlgs` (306), `profiles`, `generazioni_log`, `argomenti_sinonimi`.

**Viste:** `riepilogo_generazioni`, `argomenti_disponibili`, `argomenti_overlap`, `argomenti_con_overlap` (tutte `security_invoker`).

**Funzioni:** `normalizza(text)`, `cerca_materiale(text)` (invoker, solo authenticated), `ruolo_corrente()`, `handle_new_user()` (trigger), `aggiorna_updated_at()`.

**Edge Function:** `genera-lezione` (verify_jwt, secret `ANTHROPIC_API_KEY`, default modello `claude-sonnet-4-6` con conversione automatica dei vecchi id `claude-sonnet-4-2025*`).

**RLS:** tutto authenticated-only; anon bloccato ovunque.

---

## 5. Stato della Knowledge Base

- **28 documenti approvati**, 0 in attesa (tutti approvati nell'ultimo ciclo di pulizia).
- Circa **163 chunk usabili**, ~60.000 parole utili.
- `articoli_dlgs`: 306 articoli; **0 troncati** — i **132 articoli al cap di 1.500 char sono stati risolti il 2026-06-17** (testo integrale da Bosetti & Gatti per 125 + PDF Amato per 7: art 5, 6, 87, 104, 286, 294, 300). I **22 articoli datore** restano quelli aggiornati a testo integrale con patch DL 159/2025 (esclusi dal re-import per non regredire le patch). _Nota: la metrica storica "≥1499 char = 150 troncati" era errata: includeva 18 articoli lunghi legittimi; i veri troncati erano 132 (esattamente 1.500)._ Restano da correggere 3 `titolo_articolo` errati pre-esistenti (art 5, 6, 286) — fix in `db/File da caricare/fix_titoli.sql`.
- Gap noti per il corso Datore di Lavoro 16h (~13 temi): delega Art.16, appalti/DUVRI, ATEX, cancerogeni, amianto, lavori in quota, spazi confinati, rumore/vibrazioni, gravidanza, lavoro notturno/minori, attrezzature con abilitazione, burnout, MOG 231. Materiale da produrre ex novo dagli istruttori (fonti: Normattiva, INAIL catalogo).

---

## 6. Operatività / fatti chiave

- Per modificare l'app: aggiornare `src/App.jsx` (e `package.json` se cambiano le dipendenze) sul repo GitHub → Vercel rideployia in automatico. **I file caricati nel Progetto Claude sono copie in sola lettura.**
- Le librerie del frontend: `react`, `react-dom`, `docx`, `xlsx`, **`mammoth`** (+ vite, plugin-react in dev).
- La sessione di login è in memoria: dopo un refresh serve rifare l'accesso (persistenza rimandata).
- Costi tipici: indice/quiz pochi centesimi; proposta argomenti pochi centesimi; corso ~16 lezioni ≈ $0.50-0.70; copioni avatar più costosi (una chiamata lunga per lezione).
- **Fonte articoli_dlgs:** Bosetti & Gatti per il testo base + PDF utente (TU edizione Amato Jan 2026) per le patch più recenti e i commi mancanti in B&G. B&G si ferma a L.203/2024; il PDF è aggiornato a DL 159/2025.

---

## 7. Cosa resta / prossimi passi

- **Istruttori producano testo originale** per i 13 gap Datore di Lavoro → ingestione KB → re-run feasibility → generazione corso.
- ~~Aggiornare gli altri 150 articoli troncati~~ **FATTO (2026-06-17):** i 132 articoli realmente troncati sono stati portati a testo integrale (fonte B&G + PDF Amato). Resta solo da applicare `fix_titoli.sql` (3 titoli) e, se servono, arricchire dal PDF i 7 articoli istituzionali estratti con qualità inferiore.
- **Rifiniture App.jsx (non bloccanti):** `.replace` → `.replaceAll` nel template prompt; encoding uniforme query; pulizia codice morto (vecchia `downloadDocx`/`assemblaDocx` .txt).
- **Allineamento alla specifica:** manca il campo **livello** nell'input e l'**upload documenti / ingestion** dentro l'app (oggi esterna).
- **Opzionali sicurezza:** restringere le policy "sempre vere" per ruolo; attivare protezione password compromesse in Auth.
- **Qualità:** arricchire la formattazione del DOCX (box pillola/esempi/riflessioni struttura v5); ampliare `argomenti_sinonimi`.

---

## 8. Principi e learning consolidati

- **Misura prima di automatizzare:** logging (`generazioni_log`) prima dell'orchestrazione.
- **Sicurezza graduale e non distruttiva:** prima concedi agli autenticati ciò che serve, poi rimuovi gli accessi anonimi.
- **La chiave API non sta mai nel frontend:** vive nella Edge Function.
- **`max_tokens` e `stop_reason`** sono diagnostici chiave per i troncamenti; gestire con riprovo a budget maggiore.
- **Catena errori API tipica (in ordine):** `invalid x-api-key` → `credit balance too low` → `model not found`.
- **Ricerca KB:** normalizzare e usare sinonimi, bias verso il recall.
- **Input umano ≠ input macchina:** i programmi della docente sono indici descrittivi; serve uno strato AI (Fase 7) che li traduca in argomenti piatti agganciabili alla KB.
- **Modello corrente:** `claude-sonnet-4-6`.
- **Fonte testi normativi:** testi ufficiali (Normattiva/Bosetti & Gatti) sono pubblico dominio e usabili verbatim. Il PDF edizione annotata Amato è utile come riscontro ma non come fonte di estrazione automatica (note, interpelli e citazioni giurisprudenziali sono intrecciati nel corpo degli articoli, anche a metà comma su page break).
- **Troncamento articoli_dlgs:** il limite originale di 1.500 char era un hard-cap nell'inserimento iniziale. Per aggiornare: estrazione da B&G via ancore HTML `<a name="NNN">` + decodifica windows-1252 + patch manuali per commi mancanti in B&G (estratti dal PDF con crossing page-break). Procedura documentata nella sessione v10.
