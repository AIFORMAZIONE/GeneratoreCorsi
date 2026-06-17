# Guida alla generazione corsi — AIFormazione

Riferimento generale per generare l'output di **qualsiasi corso** (non solo "Formazione Datore di Lavoro"): formato file, struttura, template e script riutilizzabili.

## 1. Convenzione di output (sempre, per ogni corso)

| Contenuto | Formato | Note |
|---|---|---|
| Corso (testi e-learning delle lezioni) | **`corso.docx`** | Word, struttura/stile da `File base/Template Corso.docx` |
| Copioni avatar (script HeyGen) | **`copioni_avatar.docx`** | Word, una sezione per lezione |
| Quiz | **`quiz.xlsx`** | Excel, formato Question Bank LearnWorlds |

Mai `.txt` / `.md` come output finale di un corso (vedi `STATO_PROGETTOv10.md`, Fase 6).

Librerie usate: `docx@9.7.1` ed `exceljs@4.4.0`, già installate in `Nuova/Agente_Corsi/node_modules`. Script Node **ESM** (`"type": "module"`), eseguiti da `Nuova/Agente_Corsi/`.

## 2. Template di riferimento (`File base/`)

- **`Template Corso.docx`** → definisce struttura e stile di `corso.docx` (colori, dimensioni, sezioni per lezione)
- **`Question Bank Template.xlsx`** → definisce le colonne di `quiz.xlsx` per l'import LearnWorlds

## 3. Struttura standard di `corso.docx`

**Copertina** (una volta per corso):
- Nome corso — grassetto, colore `#1F4E79`, size 64 (32pt)
- A chi è rivolto — colore `#2E75B6`, size 36 (18pt)
- Numero ore — corsivo, colore `#666666`, size 26 (13pt)
- Numero lezioni | Piattaforma LearnWorlds — colore `#888888`

**Indice del corso** — heading (grassetto `#1F4E79`, size 40/20pt) + elenco "Lezione NN — Titolo" (titolo in grassetto `#2E75B6`)

**Per ogni lezione** (interruzione di pagina prima di ogni lezione):

1. `LEZIONE NN` — label, grassetto `#2E75B6`, size 22 (11pt)
2. Titolo lezione — grassetto `#1F4E79`, size 44 (22pt)
3. **Introduzione** (heading `#2E75B6` size 28/14pt) + paragrafo
4. **In questa lezione apprenderai:** (heading) + elenco puntato (3-4 obiettivi)
5. **💡 Pillola informativa:** (label inline grassetto `#2E75B6`) + paragrafo di sintesi normativa (1 frase)
6. 2-3 sezioni di approfondimento ("Accordion" del template) — **titolate con l'argomento reale**, non "Accordion N"
7. **🔍 Esempio pratico:** (label inline grassetto `#1B5E20`, verde) + caso pratico/scenario
8. **💭 Domanda di riflessione:** (label inline grassetto `#4A148C`, viola) + domanda aperta di autovalutazione (1 per lezione, da scrivere ex novo se non presente nel testo originale)
9. **Riepilogo** (heading) + **paragrafo discorsivo** (NON elenco puntato)

## 4. Struttura standard di `copioni_avatar.docx`

Un documento, una sezione per lezione:
- Heading1: `Lezione N — Titolo`
- Heading3: nome del corso
- Paragrafi in prosa, tono conversazionale, **senza markdown/elenchi/simboli**
- Target ~2500-3000 parole/lezione (~8-10 min a 300 parole/min)

## 5. Struttura standard di `quiz.xlsx`

Foglio "Questions", colonne:

`Group | Type | Question | CorAns | Answer1..Answer10 | CorrectExplanation | IncorrectExplanation`

- `Group`: "Lezione N — Titolo"
- `Type`: `TMC` (risposta multipla, 4 opzioni)
- `CorAns`: numero 1-4 della risposta corretta
- `Answer1-4`: le 4 opzioni (Answer5-10 vuote)
- `CorrectExplanation` / `IncorrectExplanation`: **sempre vuote** — un valore non vuoto fa fallire l'import LearnWorlds (verificato)
- Scrivere con **ExcelJS** (shared strings), non con librerie che generano inline strings (es. openpyxl) — l'importer LearnWorlds le rifiuta

## 6. Schema dati per lezione

Per generare una nuova lezione, serve compilare questo oggetto (poi passato allo script di generazione):

```js
{
  numero: 7,                 // numero lezione nel corso
  modulo: 1,                 // modulo di appartenenza
  titolo: "...",
  introduzione: "...",       // 1 paragrafo
  imparerai: ["...", "...", "..."],   // 3-4 obiettivi
  daSapere: "...",           // 1 frase di sintesi normativa
  sezioni: [                 // 2-3 sezioni di approfondimento
    { titolo: "...", testo: "..." },
    { titolo: "...", testo: "..." },
    { titolo: "...", testo: "..." },
  ],
  casoPratico: "...",        // scenario applicativo
  domandaRiflessione: "...", // domanda aperta di autovalutazione
  riepilogo: "...",          // paragrafo discorsivo finale
}
```

Lo stesso set di lezioni alimenta anche `copioni_avatar.docx` (espandendo introduzione/sezioni/caso pratico in prosa discorsiva ~2500-3000 parole) e `quiz.xlsx` (4 domande TMC per lezione, derivate dai contenuti normativi).

## 7. Script riutilizzabili (`Nuova/Agente_Corsi/`)

- **`genera_corso_template.mjs`** — genera `corso.docx`. Contiene tutti gli helper di formattazione pronti (`heading1`, `heading2`, `body`, `bullet`, `inlineLabel`, `lezioneTitolo`, colori/size costanti). Per un nuovo corso: aggiornare `TITOLO_CORSO`/`DESTINATARI`/`ORE`/`TOT_LEZIONI` e sostituire l'array `lezioni` con i dati del nuovo corso (schema sopra).
- **`genera_pilot_output.mjs`** — genera `copioni_avatar.docx` e `quiz.xlsx` a partire da file `.txt` (copioni e quiz già scritti); contiene anche il parser `quiz.txt → righe ExcelJS` e il builder `copioni.txt → docx` da adattare.
- **`xlsx_export.js`** / **`tools.js`** (in Agente_Corsi) — implementazioni originali di riferimento per `esportaQuizXlsx` e `genera_copione_avatar`.

Esecuzione:

```powershell
cd "Nuova/Agente_Corsi"
node genera_corso_template.mjs    # corso.docx
node genera_pilot_output.mjs      # copioni_avatar.docx, quiz.xlsx
```

## 8. Note operative

- **Chiudere i file `.docx`/`.xlsx` in Word/Excel prima di rigenerarli** — altrimenti errore `EBUSY` (file in uso).
- Usare percorsi assoluti via `path.dirname(fileURLToPath(import.meta.url))`, non percorsi relativi alla cwd della shell.
- Salvare l'output nella cartella del corso sotto `Corsi Generati/<NomeCorso>/`.

## Esempio completo

Vedi `../Corsi Generati/Corso_Form_Datore_2026_PILOT_v2/` (corso "Formazione Datore di Lavoro") per un caso applicato end-to-end: `corso.docx` generato con `genera_corso_template.mjs`, `copioni_avatar.docx` e `quiz.xlsx` con `genera_pilot_output.mjs`.
