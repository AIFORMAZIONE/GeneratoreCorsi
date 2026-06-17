# AIFormazione — Logica del Progetto e Punti di Inserimento Agenti AI

_Documento di architettura funzionale. Descrive l'intero flusso end-to-end dall'inserimento dei documenti alla pubblicazione, e indica dove inserire gli agenti AI. Trio di generazione core: **Generazione Corso**, **Generatore Copione**, **Generatore Quiz**. Agenti di contorno: **Validazione KB**, **Argomenti**, **Struttura**, **Presentazione Corso**, **Revisione**._

---

## 0. In sintesi (una riga)

> Documenti grezzi → **Ingestion** (chunk + tag + 🤖 **Validazione KB**: no-troncamenti + coerenza) → **Knowledge Base** (Supabase) → **Configurazione corso** (Accordo SR 2025) + 🤖 **Argomenti** → 🤖 **Struttura** (indice approvato) → 🤖 **Generazione Corso** + 🤖 **Copione** + 🤖 **Quiz** → 🤖 **Presentazione Corso** (~1000 caratteri per gli Agenti Social) → **Output** (DOCX corso, DOCX copioni, XLSX quiz, presentazione, email, post+video) → **LearnWorlds / HeyGen API / Social** → 🤖 **Revisione** (storico, confronta generato vs. corretto e migliora gli agenti).

---

## 1. Componenti del sistema

| Livello | Tecnologia | Ruolo |
|---|---|---|
| **Frontend** | React (`src/App.jsx`), Vite, su Vercel | UI: login, configurazione, generazione, pagina corso, download/upload revisioni |
| **Backend** | Supabase (`zdvzxkzdkazewotiivxw`, eu-central-1) | Auth, DB con RLS, Edge Function proxy |
| **AI** | API Anthropic — `claude-sonnet-4-6` | Generazione contenuti (via Edge Function) |
| **Sicurezza** | Edge Function `genera-lezione` | Custodisce `ANTHROPIC_API_KEY` (mai nel browser) |
| **Target e-learning** | LearnWorlds | Corso + quiz |
| **Target video** | HeyGen **API** | Copioni → video avatar (invio automatico) |
| **Target marketing** | Agenti Social + email | Presentazione (~1000 caratteri), anteprima video, post per ogni social |

**Principio cardine:** la chiave API non sta mai nel frontend. Ogni chiamata AI passa dalla Edge Function `genera-lezione`, che fa retry/backoff, rileva troncamenti, calcola costi e logga in `generazioni_log`.

---

## 2. Modello dati (Supabase)

**Knowledge base e generazione:**
```
documenti           (id, titolo, tipo, approvato, usabile, created_at)
   └─ argomenti     (id, titolo, testo_chunk, tag, usabile, documento_id)   ← i "chunk" della KB
ingestion_log       (id, documento_id, stato, fonte, chunks_inseriti, esito)
articoli_dlgs       (id, numero, titolo, testo, capo, sezione, tag/corsi_tag) ← 306 articoli D.Lgs. 81/08
argomenti_sinonimi  (~50 termini per espansione query)
corsi_generati      (titolo, destinatari, n_lezioni, versione, lezioni_json, modello_ai, ...)
generazioni_log     (log di ogni chiamata AI: token, costo, stop_reason)
profiles            (id, email, ruolo ∈ {developer, docente})
```

**Validazione, pagina corso, revisioni e pubblicazione:**
```
validazione_kb      (id, argomento_id, troncato bool, coerente bool, n_parole, motivo, esito ∈ {ok, scartato, da_rivedere}, created_at)
asset_corso         (id, corso_id, tipo ∈ {corso, quiz, copione, video, email, presentazione, anteprima, post},
                     versione, file_url, stato ∈ {generato, in_revisione, approvato, pubblicato}, created_at)
revisioni           (id, asset_id, file_generato_url, file_corretto_url, diff/note, autore, created_at)
pubblicazioni       (id, corso_id, canale ∈ {learnworlds, heygen, instagram, facebook, linkedin, ...},
                     stato, ref_esterno, pubblicato_at)
```

**Funzioni DB:** `normalizza(text)`, `cerca_materiale(termine)` (espansione sinonimi + ricerca token-wildcard), `ruolo_corrente()`, trigger `handle_new_user()`.

**Configurazione normativa:** file [`Nuova/Agente_Corsi/corsi_config.js`](../Nuova/Agente_Corsi/corsi_config.js) — per ogni tipo di corso: ore totali, moduli, argomenti, e-learning sì/no, regole quiz, e (per il Datore di Lavoro 16h) la `struttura_suggerita` lezione-per-lezione.

---

## 3. Flusso end-to-end (le 6 fasi)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  FASE A — INGESTION                                                            │
│  PDF / DOCX / PPTX / PPT  ──▶  estrazione testo  ──▶  chunking  ──▶ tagging    │
│  ──▶  [🤖 Agente Validazione KB: chunk non troncati + coerenti]  ──▶ approvazione│
│  ──▶  tabella `argomenti`                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  FASE B — CONFIGURAZIONE CORSO                                                 │
│  scelta tipo corso (corsi_config.js)  +  programma docente                     │
│  ──▶  [🤖 Agente Argomenti] normalizza programma in tag piatti                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  FASE C — GAP ANALYSIS + STRUTTURA                                             │
│  [🤖 Agente Struttura] misura copertura KB per modulo                          │
│  ──▶ propone indice (N lezioni, tipo: lezione/quiz/caso/verifica)              │
│  ──▶ approvazione umana (docente)                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  FASE D — GENERAZIONE CONTENUTI  (per ogni lezione, a gruppi di 3)             │
│  recupero chunk KB + articoli D.Lgs.  ──▶  build prompt  ──▶                   │
│  [🤖 Agente Generazione Corso]  → testo lezione (1.400-1.900 parole)           │
│  [🤖 Agente Copione]            → script avatar (2.500-3.000 parole)           │
│  [🤖 Agente Quiz]               → domande a risposta multipla                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  FASE E — ASSEMBLAGGIO OUTPUT                                                  │
│  DOCX corso (docx)  +  DOCX copioni (docx)  +  XLSX quiz (SheetJS)             │
│  ──▶ [🤖 Agente Presentazione Corso] → testo dettagliato di presentazione      │
│       del corso, destinato agli Agenti Social                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  FASE F — PERSISTENZA, REVISIONE, PUBBLICAZIONE                                │
│  salva in `corsi_generati` (versioning)                                        │
│  ──▶ upload su LearnWorlds (corso + quiz)  /  invio copioni a HeyGen API        │
│  ──▶ PAGINA CORSO: download/upload con revisione e storico per ogni sezione →  │
│       Corso · Quiz · Copioni/Manda video · Template email · Presentazione ·    │
│       Anteprima video+post · Pubblica post+video (per ogni social)             │
│  ──▶ [🤖 Agente Revisione] confronta i file generati con le revisioni caricate │
│       e aggiorna il modo di ragionare degli agenti (feedback loop)             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Fase A — Ingestion dei documenti
1. **Input:** file caricati dalla docente (PDF, DOCX, PPTX, PPT). Es. manuali RLS, slide, casi reali, normativa.
2. **Estrazione testo:** PDF/PPTX → testo grezzo; per DOCX si usa `mammoth` (`extractRawText`).
3. **Chunking:** il testo viene spezzato in "chunk" (es. una slide, un paragrafo) salvati come righe in `argomenti` (`titolo`, `testo_chunk`, `n_parole`).
4. **Tagging:** ogni chunk riceve `tag` agganciabili agli argomenti normativi.
5. **🤖 Agente Validazione KB:** controlla che ogni chunk **non sia troncato** (testo tagliato a metà frase/comma, come accadde con il limite di 1.500 char su `articoli_dlgs`) e che sia **coerente** (autoconsistente, leggibile, attribuito al titolo giusto). Esito → `validazione_kb` (`ok` / `scartato` / `da_rivedere`).
6. **Approvazione:** flag `approvato` / `usabile`; solo i chunk validati (`ok`) e `usabile=true` entrano nelle query di generazione.
7. **Tracciamento:** ogni run di ingestion scrive in `ingestion_log` (`stato`, `fonte`, `chunks_inseriti`, `esito`).

> Questo agente è **distinto** dall'Agente Argomenti della Fase B: qui si garantisce la **qualità del materiale in ingresso** (integrità + coerenza dei chunk), non la traduzione del programma docente in tag.

**Stato attuale KB:** 28 documenti approvati, ~163 chunk usabili, ~60.000 parole + 306 articoli `articoli_dlgs`.

> ⚠️ Nota: oggi l'ingestion è **esterna all'app** (script). Un prossimo passo previsto è portare l'upload + ingestion dentro l'UI.

### Fase B — Configurazione del corso
- Si sceglie il **tipo di corso** da `corsi_config.js` (es. `formazione_datore_lavoro`, `aggiornamento_rls`).
- La docente può incollare/importare il proprio **programma** (`.docx` via `mammoth`).
- 🤖 **Agente Argomenti:** normalizza il programma descrittivo in **tag piatti** agganciabili alla KB, proposti come chip da accettare/scartare.

### Fase C — Gap analysis e struttura
- 🤖 **Agente Struttura** ([`agente_struttura.js`](../Nuova/Agente_Corsi/agente_struttura.js)):
  1. Per ogni modulo conta i chunk KB disponibili → status ✅ / ⚠️ / ❌.
  2. Passa la copertura a Claude che adatta la `struttura_suggerita` ai gap reali.
  3. Restituisce un JSON con `moduli` + `lezioni` (ognuna con `n`, `titolo`, `focus`, `tipo`, `kb_disponibile`).
  4. **Approvazione interattiva**: la docente può modificare/rimuovere/aggiungere lezioni o rigenerare.
- Regole struttura: numero lezioni fisso (ore × 4 per lezioni da 15 min), un **quiz** a fine modulo, ultima lezione **verifica_finale**.

### Fase D — Generazione contenuti (cuore del sistema)
Per ogni lezione (elaborata a **gruppi di 3 in parallelo**, vedi `genera_section.jsx`):
1. **Recupero materiale:** `fetchChunksPerArgomento()` (chunk KB per tag) + `fetchArticoliPerTag()` (articoli D.Lgs. pertinenti).
2. **Build prompt:** template v5 con i placeholder `{{NUMERO_LEZIONE}}`, `{{TITOLO_LEZIONE}}`, `{{TITOLO_CORSO}}`, `{{DESTINATARI}}`, `{{CHUNKS_KB}}`, `{{ARTICOLI_DLGS}}`.
3. **Chiamata AI** via Edge Function → testo strutturato (Introduzione, obiettivi, pillola, 4-6 sezioni, casi pratici, riepilogo, domanda di verifica).
4. **Robustezza:** auto-retry sui troncamenti (`max_tokens` 4500 → 8000), badge "⚠ Troncata", rigenerazione per singola lezione.

### Fase E — Assemblaggio output
- **Corso DOCX** (libreria `docx@9.6.1`): documento Word strutturato.
- **Copioni DOCX:** uno script avatar per lezione (~2.500-3.000 parole, 10-15 min a 300 p/min) → HeyGen.
- **Quiz XLSX** (SheetJS `xlsx`): foglio compatibile con il "Question Bank Template" di LearnWorlds.
- 🤖 **Agente Presentazione Corso:** genera un **testo dettagliato di presentazione del corso** (obiettivi, destinatari, valore, programma sintetico, call-to-action) destinato alla fleet di **Agenti Social** che produrranno la comunicazione marketing.

### Fase F — Persistenza, revisione e pubblicazione
- Salvataggio in `corsi_generati` con **versioning** (sovrascrivi ultima vs. nuova versione, modale dedicato).
- **Distribuzione automatica:** upload su LearnWorlds (corso + quiz); invio copioni a **HeyGen via API** per la generazione dei video avatar.
- **Pagina corso** (nuova UI): per ogni sezione un blocco con **download del generato**, **upload della revisione** e **storico versioni**. Sezioni:
  `Corso` · `Quiz` · `Copioni / Manda video` · `Template email` · `Presentazione corso` · `Anteprima video + post` · `Pubblica post + video` (per ogni social).
- 🤖 **Agente Revisione:** confronta i file **generati** con le **revisioni** caricate dall'umano (diff semantico), estrae i pattern di correzione ricorrenti e li traduce in aggiornamenti dei prompt/regole degli altri agenti → **feedback loop di miglioramento continuo**.

---

## 4. Gli Agenti AI — dove e come inserirli

Tutti gli agenti girano **dietro la Edge Function `genera-lezione`** (chiave server-side), su `claude-sonnet-4-6`. Validazione KB in **Fase A**; Argomenti in Fase A→B; il trio core (Generazione Corso, Copione, Quiz) vive nella **Fase D**; Presentazione in Fase E; Revisione in Fase F.

### 4.0 🤖 Agente Validazione KB
- **Punto di inserimento:** Fase A, sui chunk appena estratti, **prima** dell'approvazione. Agente **separato** dall'Agente Argomenti.
- **Input:** ogni chunk (`titolo`, `testo_chunk`, `n_parole`) + documento di origine.
- **Logica:** verifica **integrità** (chunk non troncato a metà frase/comma; nessun taglio da limite di caratteri) e **coerenza** (testo autoconsistente, leggibile, coerente col titolo e con la fonte).
- **Output:** esito `ok` / `scartato` / `da_rivedere` con motivo → tabella `validazione_kb`.
- **Destinazione:** solo i chunk `ok` diventano `usabile=true` e alimentano la generazione.

```
[chunk estratti] → ┌────────────────────────┐
                   │ Agente Validazione KB  │ → ok / scartato / da_rivedere → validazione_kb
                   └────────────────────────┘
```

### 4.1 🤖 Agente Generazione Corso
- **Punto di inserimento:** Fase D, step 3 — primo a girare per ogni lezione.
- **Input:** `titolo_lezione`, `focus`, chunk KB pertinenti, articoli D.Lgs. pertinenti, `destinatari`.
- **Prompt:** template v5 (vedi `PROMPT_DEFAULT` in `genera_section.jsx`), formato obbligatorio con sezioni fisse.
- **Output:** testo lezione **1.400-1.900 parole** in markdown strutturato.
- **Validazioni:** conteggio parole, presenza di tutte le sezioni obbligatorie, gestione troncamenti.
- **Destinazione:** corpo del **DOCX corso**.

```
[focus lezione] + [chunk KB] + [articoli D.Lgs.]
        │
        ▼  prompt v5
  ┌──────────────────────────┐
  │ Agente Generazione Corso │ → testo lezione (markdown) → DOCX corso
  └──────────────────────────┘
```

### 4.2 🤖 Agente Generatore Copione
- **Punto di inserimento:** Fase D, **dopo** la lezione testuale (riutilizza il testo già generato) — on-demand o batch.
- **Input:** testo della lezione generata + `titolo_lezione` + durata target (10-15 min).
- **Prompt:** trasforma la lezione in **monologo parlato per avatar HeyGen** — tono colloquiale, frasi brevi, niente elenchi puntati, ritmo a ~300 parole/min.
- **Output:** copione **2.500-3.000 parole** per lezione (testo continuo, eventuali marcatori di pausa/enfasi).
- **Validazioni:** durata stimata (parole/300), assenza di formattazione non leggibile dall'avatar.
- **Destinazione:** **DOCX copioni** → invio a **HeyGen via API**.

```
[testo lezione]  →  prompt "voce avatar"  →  ┌────────────────────┐
                                             │ Agente Copione     │ → copione ~2.700 parole → HeyGen API
                                             └────────────────────┘
```

### 4.3 🤖 Agente Generatore Quiz
- **Punto di inserimento:** Fase D, in parallelo o dopo la generazione del corso. Due livelli:
  - **per-lezione:** ~2 domande a lezione (verifica continua);
  - **di corso/modulo:** quiz intermedi e **verifica finale** (es. 30 domande, soglia 70%, regole da `corsi_config.js → quiz`).
- **Input:** testo lezione (o aggregato del modulo) + articoli D.Lgs. + parametri quiz dal config.
- **Prompt:** domande **a risposta multipla** (≥3 opzioni), risposta corretta indicata e distrattori plausibili, ancorate ai contenuti normativi.
- **Output:** struttura dati domande → foglio **XLSX** in formato "Question Bank Template" LearnWorlds.
- **Validazioni:** numero domande richiesto, una sola risposta corretta, niente domande fuori dal contenuto.
- **Destinazione:** **XLSX quiz** → import in LearnWorlds.

```
[testo lezione/modulo] + [regole quiz config]
        │  prompt "quiz a risposta multipla"
        ▼
  ┌──────────────────┐
  │ Agente Quiz      │ → domande JSON → XLSX (Question Bank) → LearnWorlds
  └──────────────────┘
```

### 4.4 🤖 Agente Presentazione Corso
- **Punto di inserimento:** Fase E, dopo l'assemblaggio del corso completo.
- **Input:** struttura approvata (titolo, destinatari, moduli/lezioni) + sintesi dei contenuti generati.
- **Prompt:** produce un **testo di presentazione di ~1000 caratteri** — value proposition, destinatari, obiettivi, requisiti normativi, call-to-action — pensato come **brief per gli Agenti Social**.
- **Output:** presentazione (~1000 caratteri) salvata come asset `presentazione`.
- **Validazioni:** lunghezza target ~1000 caratteri.
- **Destinazione:** **fleet Agenti Social** (input per email, post, anteprime video).

```
[corso assemblato] → ┌────────────────────────────┐
                     │ Agente Presentazione Corso │ → brief presentazione → Agenti Social
                     └────────────────────────────┘
```

### 4.5 🤖 Agente Revisione
- **Punto di inserimento:** Fase F, sulla pagina corso, ogni volta che viene caricata una **revisione umana** di un asset.
- **Input:** file **generato** + file **corretto** (per sezione: corso, quiz, copione, presentazione, ...).
- **Logica:** calcola il **diff semantico**, individua i pattern di correzione ricorrenti (tono, lunghezza, errori normativi, formattazione) e li sintetizza in **regole/aggiustamenti di prompt** per l'agente che ha prodotto l'asset.
- **Output:** suggerimenti di aggiornamento prompt + note salvate in `revisioni`; opzionalmente aggiorna i template degli agenti.
- **Destinazione:** **miglioramento continuo** del trio core e degli agenti di contorno.

```
[file generato] + [file corretto]
        │  diff semantico
        ▼
  ┌──────────────────┐
  │ Agente Revisione │ → pattern di correzione → aggiorna prompt/regole degli agenti
  └──────────────────┘
```

### 4.6 Orchestrazione consigliata (per lezione e per corso)
```
                 ┌─────────────────────────────┐
   recupero      │   1. Agente Generazione      │──┐ testo lezione
   chunk KB ────▶│      Corso                   │  │
   + articoli    └─────────────────────────────┘  │
                                                   ├─▶ 2. Agente Copione   (usa il testo) ─▶ HeyGen API
                                                   └─▶ 3. Agente Quiz      (usa il testo) ─▶ XLSX/LearnWorlds
   (a corso completo)
        └─▶ 4. Agente Presentazione Corso ─▶ Agenti Social
   (post-revisione umana)
        └─▶ 5. Agente Revisione ─▶ aggiorna i prompt di 1-4
```
- **Agente Struttura** (Fase C) è l'orchestratore a monte: decide quante lezioni e di che `tipo`, quindi quante volte invocare ciascun agente.
- **Agente Revisione** chiude il ciclo: le correzioni umane rientrano come miglioramento dei prompt.

---

## 5. Tabella riassuntiva agenti

| Agente | Fase | Input principale | Output | Lunghezza target | Destinazione |
|---|---|---|---|---|---|
| **Validazione KB** | A | chunk estratti | esito integrità + coerenza | — | `validazione_kb` / KB |
| **Argomenti** (esistente) | B | programma docente | tag piatti | — | aggancio KB |
| **Struttura** (esistente) | C | config + copertura KB | indice JSON (lezioni) | N lezioni | approvazione |
| **Generazione Corso** | D | focus + KB + articoli | testo lezione MD | 1.400-1.900 parole | DOCX corso |
| **Copione** | D | testo lezione | monologo avatar | 2.500-3.000 parole | HeyGen API |
| **Quiz** | D | testo lezione/modulo | domande multiple | 2/lez · 30/corso | XLSX → LearnWorlds |
| **Presentazione Corso** | E | corso assemblato | testo presentazione | ~1000 caratteri | Agenti Social |
| **Revisione** | F | generato + corretto | pattern + update prompt | — | miglioramento agenti |

---

## 6. Principi operativi (da rispettare)

- **Chiave API solo server-side** (Edge Function `genera-lezione`).
- **Misura prima di automatizzare:** ogni chiamata loggata in `generazioni_log` (token, costo, `stop_reason`).
- **`max_tokens` + `stop_reason`** sono i diagnostici dei troncamenti → retry a budget maggiore.
- **Ricerca KB con sinonimi**, bias verso il recall (`cerca_materiale`).
- **Input umano ≠ input macchina:** serve lo strato Agente Argomenti per tradurre i programmi descrittivi.
- **Output finale sempre DOCX/DOCX/XLSX** (corso/copioni/quiz), mai txt/md grezzi.
- **Versioning ovunque:** corsi in `corsi_generati`; asset e revisioni con storico per sezione.
- **Feedback loop:** ogni revisione umana è materiale per l'Agente Revisione → gli agenti migliorano nel tempo.
- **E-learning condizionato dalla norma:** alcuni corsi/moduli (es. preposti, parti pratiche antincendio/primo soccorso) NON sono erogabili in e-learning → l'Agente Struttura deve marcarli.

---

## 7. Costi tipici (riferimento)

| Operazione | Costo indicativo |
|---|---|
| Proposta indice / argomenti | pochi centesimi |
| Quiz | pochi centesimi |
| Corso ~16 lezioni | ~$0.50–0.70 |
| Copioni avatar | più costosi (1 chiamata lunga/lezione) |
| Presentazione corso | pochi centesimi |
| Revisione (per asset) | pochi centesimi |

---

_Fonti: [`docs/STATO_PROGETTOv10.md`](STATO_PROGETTOv10.md), [`Nuova/Agente_Corsi/corsi_config.js`](../Nuova/Agente_Corsi/corsi_config.js), [`Nuova/Agente_Corsi/agente_struttura.js`](../Nuova/Agente_Corsi/agente_struttura.js), [`Nuova/App/genera_section.jsx`](../Nuova/App/genera_section.jsx), schema DB in [`db/`](../db/)._
