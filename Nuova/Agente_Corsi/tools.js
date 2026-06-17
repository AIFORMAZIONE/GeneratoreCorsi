import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { Document, Packer, Paragraph, HeadingLevel } from "docx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { slugCorso } from "./slug.js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = process.env.OUTPUT_DIR
  ?? path.join(__dirname, "..", "..", "..", "Corsi Generati");

// ─── Definizioni strumenti per Claude ────────────────────────────────────────

export const TOOL_DEFINITIONS = [
  {
    name: "analizza_gap_kb",
    description:
      "Verifica se gli argomenti richiesti per il corso sono presenti nella Knowledge Base. Per ogni argomento restituisce: se coperto, quanti chunk disponibili, e lista titoli chunk trovati. Usare sempre PRIMA di generare per capire se la KB è sufficiente.",
    input_schema: {
      type: "object",
      properties: {
        argomenti: {
          type: "array",
          items: { type: "string" },
          description: "Lista degli argomenti/tag da verificare nella KB (es: ['rls','dvr','dpi'])",
        },
      },
      required: ["argomenti"],
    },
  },
  {
    name: "recupera_chunks_kb",
    description:
      "Recupera i chunk testuali dalla Knowledge Base per gli argomenti specificati. Restituisce il testo completo dei chunk usabili (usabile=true). Usare per costruire il materiale di riferimento prima di generare ogni lezione.",
    input_schema: {
      type: "object",
      properties: {
        argomenti: {
          type: "array",
          items: { type: "string" },
          description: "Lista di tag/argomenti da cercare",
        },
        limite_parole: {
          type: "number",
          description: "Limite massimo parole totali da restituire (default: 6000)",
        },
      },
      required: ["argomenti"],
    },
  },
  {
    name: "recupera_articoli_dlgs",
    description:
      "Recupera gli articoli del D.Lgs. 81/08 pertinenti agli argomenti del corso. Usa i corsi_tag per filtrare. Restituisce testo completo degli articoli selezionati.",
    input_schema: {
      type: "object",
      properties: {
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Lista di tag per filtrare gli articoli (es: ['rls','dpi','dvr'])",
        },
        max_articoli: {
          type: "number",
          description: "Numero massimo articoli da restituire (default: 10)",
        },
      },
      required: ["tags"],
    },
  },
  {
    name: "genera_lezione",
    description:
      "Genera il testo completo di una singola lezione usando Claude. Richiede titolo lezione, numero, corso, destinatari e materiale KB. Restituisce il testo strutturato della lezione pronto per essere inserito nel corso.",
    input_schema: {
      type: "object",
      properties: {
        numero_lezione: { type: "number", description: "Numero progressivo lezione (1-based)" },
        titolo_lezione: { type: "string", description: "Titolo della lezione" },
        titolo_corso: { type: "string", description: "Titolo del corso completo" },
        destinatari: { type: "string", description: "Destinatari del corso" },
        chunks_kb: { type: "string", description: "Testo dei chunk KB rilevanti (max ~6000 parole)" },
        articoli_dlgs: { type: "string", description: "Testo degli articoli D.Lgs. pertinenti" },
        prompt_custom: {
          type: "string",
          description: "Prompt personalizzato opzionale. Se omesso usa il prompt v5 default.",
        },
      },
      required: ["numero_lezione", "titolo_lezione", "titolo_corso", "destinatari", "chunks_kb"],
    },
  },
  {
    name: "salva_corso_supabase",
    description:
      "Salva il corso generato nella tabella corsi_generati di Supabase. Usare dopo aver generato tutte le lezioni. Restituisce l'ID del corso salvato.",
    input_schema: {
      type: "object",
      properties: {
        titolo: { type: "string", description: "Titolo del corso" },
        destinatari: { type: "string", description: "Destinatari del corso" },
        n_lezioni: { type: "number", description: "Numero totale di lezioni" },
        argomenti: {
          type: "array",
          items: { type: "string" },
          description: "Lista argomenti usati",
        },
        lezioni_json: {
          type: "array",
          items: {
            type: "object",
            properties: {
              numero: { type: "number" },
              titolo: { type: "string" },
              testo: { type: "string" },
            },
          },
          description: "Array di lezioni con numero, titolo e testo",
        },
      },
      required: ["titolo", "destinatari", "n_lezioni", "argomenti", "lezioni_json"],
    },
  },
  {
    name: "esporta_corso_txt",
    description:
      "Salva il corso completo come file .txt nella cartella output/. Il file è strutturato e leggibile, pronto per essere convertito in DOCX con build_rls_v4.cjs. Restituisce il percorso del file salvato.",
    input_schema: {
      type: "object",
      properties: {
        titolo: { type: "string", description: "Titolo del corso (usato anche come nome file)" },
        lezioni_json: {
          type: "array",
          items: {
            type: "object",
            properties: {
              numero: { type: "number" },
              titolo: { type: "string" },
              testo: { type: "string" },
            },
          },
          description: "Array di lezioni complete",
        },
      },
      required: ["titolo", "lezioni_json"],
    },
  },
  {
    name: "leggi_documenti_kb",
    description:
      "Restituisce la lista dei documenti nella Knowledge Base con stato, numero chunk, argomenti_tag. Utile per capire cosa è disponibile prima di pianificare il corso.",
    input_schema: {
      type: "object",
      properties: {
        filtro_stato: {
          type: "string",
          enum: ["tutti", "approvato", "analizzato"],
          description: "Filtra per stato documento (default: approvato)",
        },
      },
      required: [],
    },
  },
  {
    name: "genera_quiz_lezione",
    description:
      "Genera domande a risposta multipla per una lezione nel formato LearnWorlds (XLSX). Produce 4 domande per lezione standard, 10 per quiz di fine modulo, 30 per la verifica finale. Output: array di righe pronte per SheetJS.",
    input_schema: {
      type: "object",
      properties: {
        titolo_lezione: { type: "string", description: "Titolo della lezione da cui generare le domande" },
        focus_lezione: { type: "string", description: "Focus e argomenti trattati nella lezione" },
        testo_lezione: { type: "string", description: "Testo completo della lezione (opzionale — se fornito, le domande saranno più precise)" },
        corso: { type: "string", description: "Titolo del corso di appartenenza" },
        destinatari: { type: "string", description: "Figura professionale destinataria del corso" },
        gruppo: { type: "string", description: "Nome del gruppo per LearnWorlds (es: 'Lezione 7' o 'Quiz Modulo 1')" },
        n_domande: {
          type: "number",
          description: "Numero di domande da generare: 4 per lezione standard, 10 per quiz modulo, 30 per verifica finale. Default: 4",
        },
      },
      required: ["titolo_lezione", "focus_lezione", "corso", "gruppo"],
    },
  },
  {
    name: "genera_copione_avatar",
    description:
      "Genera il copione parlato per un avatar HeyGen a partire dal testo di una lezione: ~2500-3000 parole (8-10 minuti a ~300 parole/min), tono discorsivo e naturale, senza simboli/markdown/elenchi puntati. Salva il risultato come file .docx in 'Corsi Generati/Copioni Avatar' e restituisce il percorso. Da usare on demand, una lezione alla volta.",
    input_schema: {
      type: "object",
      properties: {
        numero_lezione: { type: "number", description: "Numero progressivo della lezione" },
        titolo_lezione: { type: "string", description: "Titolo della lezione" },
        focus_lezione: { type: "string", description: "Focus e argomenti della lezione (usato se testo_lezione non è fornito)" },
        testo_lezione: { type: "string", description: "Testo completo della lezione su cui basare il copione (consigliato)" },
        corso: { type: "string", description: "Titolo del corso di appartenenza" },
        destinatari: { type: "string", description: "Figura professionale destinataria del corso" },
      },
      required: ["numero_lezione", "titolo_lezione", "corso"],
    },
  },
  {
    name: "aggiorna_stato_documento",
    description:
      "Approva o rifiuta un documento nella Knowledge Base. Imposta stato='approvato' e approvato=true, oppure marca i chunk come usabile=false.",
    input_schema: {
      type: "object",
      properties: {
        documento_id: { type: "number", description: "ID del documento da aggiornare" },
        azione: {
          type: "string",
          enum: ["approva", "rifiuta"],
          description: "approva: imposta stato=approvato+approvato=true | rifiuta: imposta stato=rifiutato",
        },
      },
      required: ["documento_id", "azione"],
    },
  },
];

// ─── Implementazioni strumenti ────────────────────────────────────────────────

export async function eseguiStrumento(nome, input) {
  switch (nome) {
    case "analizza_gap_kb":
      return await analizzaGapKB(input.argomenti);
    case "recupera_chunks_kb":
      return await recuperaChunksKB(input.argomenti, input.limite_parole ?? 6000);
    case "recupera_articoli_dlgs":
      return await recuperaArticoliDlgs(input.tags, input.max_articoli ?? 10);
    case "genera_lezione":
      return await generaLezione(input);
    case "salva_corso_supabase":
      return await salvaCorsoSupabase(input);
    case "esporta_corso_txt":
      return await esportaCorsoTxt(input.titolo, input.lezioni_json);
    case "leggi_documenti_kb":
      return await leggiDocumentiKB(input.filtro_stato ?? "approvato");
    case "genera_quiz_lezione":
      return await generaQuizLezione(input);
    case "genera_copione_avatar":
      return await generaCopioneAvatar(input);
    case "aggiorna_stato_documento":
      return await aggiornaStatoDocumento(input.documento_id, input.azione);
    default:
      return { errore: `Strumento sconosciuto: ${nome}` };
  }
}

// ─── analizza_gap_kb ──────────────────────────────────────────────────────────

async function analizzaGapKB(argomenti) {
  const risultati = [];
  for (const arg of argomenti) {
    const { data: byTitolo } = await supabase
      .from("argomenti")
      .select("id, titolo, n_parole")
      .eq("usabile", true)
      .ilike("titolo", `%${arg}%`);

    const { data: byTesto } = await supabase
      .from("argomenti")
      .select("id, titolo, n_parole")
      .eq("usabile", true)
      .ilike("testo_chunk", `%${arg}%`);

    const { data: byTag } = await supabase
      .from("documenti")
      .select("id, nome_file, argomenti_tag")
      .eq("approvato", true)
      .contains("argomenti_tag", [arg]);

    const tuttiChunk = [...(byTitolo ?? []), ...(byTesto ?? [])];
    const unici = [...new Map(tuttiChunk.map(c => [c.id, c])).values()];

    risultati.push({
      argomento: arg,
      coperto: unici.length > 0 || (byTag ?? []).length > 0,
      n_chunk: unici.length,
      n_documenti_tag: (byTag ?? []).length,
      chunk_trovati: unici.map(c => c.titolo),
    });
  }
  return { gap_analysis: risultati };
}

// ─── recupera_chunks_kb ───────────────────────────────────────────────────────

async function recuperaChunksKB(argomenti, limiteParole) {
  const chunks = [];
  for (const arg of argomenti) {
    const { data: byTitolo } = await supabase
      .from("argomenti")
      .select("id, titolo, testo_chunk, n_parole")
      .eq("usabile", true)
      .ilike("titolo", `%${arg}%`);

    const { data: byTesto } = await supabase
      .from("argomenti")
      .select("id, titolo, testo_chunk, n_parole")
      .eq("usabile", true)
      .ilike("testo_chunk", `%${arg}%`);

    const tutti = [...(byTitolo ?? []), ...(byTesto ?? [])];
    const unici = [...new Map(tutti.map(c => [c.id, c])).values()];
    chunks.push(...unici);
  }

  // dedup globale e rispetto limite parole
  const dedup = [...new Map(chunks.map(c => [c.id, c])).values()];
  let totaleParole = 0;
  const selezionati = [];
  for (const c of dedup) {
    if (totaleParole + (c.n_parole ?? 0) > limiteParole) break;
    selezionati.push(c);
    totaleParole += c.n_parole ?? 0;
  }

  const testo = selezionati
    .map(c => `### ${c.titolo}\n${c.testo_chunk}`)
    .join("\n\n---\n\n");

  return {
    n_chunk: selezionati.length,
    parole_totali: totaleParole,
    testo,
  };
}

// ─── recupera_articoli_dlgs ───────────────────────────────────────────────────

async function recuperaArticoliDlgs(tags, maxArticoli) {
  const articoli = [];
  for (const tag of tags) {
    const { data } = await supabase
      .from("articoli_dlgs")
      .select("numero_articolo, titolo_articolo, testo_completo, tipo")
      .contains("corsi_tag", [tag])
      .neq("tipo", "abrogato")
      .limit(Math.ceil(maxArticoli / tags.length) + 2);
    if (data) articoli.push(...data);
  }

  // dedup per numero_articolo
  const dedup = [...new Map(articoli.map(a => [a.numero_articolo, a])).values()]
    .slice(0, maxArticoli);

  const testo = dedup
    .map(a => `Art. ${a.numero_articolo} — ${a.titolo_articolo}\n${a.testo_completo}`)
    .join("\n\n---\n\n");

  return { n_articoli: dedup.length, testo };
}

// ─── genera_lezione ───────────────────────────────────────────────────────────

const PROMPT_V5 = `Sei un esperto di formazione sulla sicurezza sul lavoro ai sensi del D.Lgs. 81/08.
Genera la lezione {{NUMERO_LEZIONE}} dal titolo "{{TITOLO_LEZIONE}}" per il corso "{{TITOLO_CORSO}}" destinato a: {{DESTINATARI}}.

MATERIALE DI RIFERIMENTO:
{{CHUNKS_KB}}

ARTICOLI D.LGS. PERTINENTI:
{{ARTICOLI_DLGS}}

STRUTTURA OBBLIGATORIA (rispetta esattamente questo formato):

## Introduzione
[almeno 5-7 frasi discorsive che introducono l'argomento]

## In questa lezione apprenderai:
- [obiettivo 1 con verbo infinito]
- [obiettivo 2 con verbo infinito]
- [obiettivo 3 con verbo infinito]
- [obiettivo 4 con verbo infinito]

## 💡 Pillola informativa
[massima memorabile, max 20 parole]

## Sezione 1 — [titolo]
[almeno 8 frasi discorsive, cita articoli D.Lgs. sviluppando i comma centrali]

## Sezione 2 — [titolo]
[almeno 8 frasi discorsive]

## Sezione 3 — [titolo]
[almeno 8 frasi discorsive]

## Sezione 4 — [titolo]
[almeno 8 frasi discorsive]

[Sezione 5 e 6 opzionali se il contenuto lo richiede]

## Casi pratici e spunti di riflessione

### 🔍 Esempio pratico 1
[caso concreto aziendale, 3-4 frasi]

### 💭 Domanda di riflessione 1
[domanda aperta, senza risposta]

### 🔍 Esempio pratico 2
[caso concreto aziendale, 3-4 frasi]

### 💭 Domanda di riflessione 2
[domanda aperta, senza risposta]

## Riepilogo
[almeno 4 frasi che sintetizzano i punti chiave]

## ❓ Domanda di verifica
Domanda: [domanda a scelta multipla]
A) [risposta]
B) [risposta]
C) [risposta]
D) [risposta]
Risposta corretta: [lettera] — [breve motivazione]

Scrivi minimo 1.400 parole. Non usare elenchi puntati salvo elementi normativi enumerabili.`;

async function generaLezione(input) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = (input.prompt_custom ?? PROMPT_V5)
    .replace("{{NUMERO_LEZIONE}}", input.numero_lezione)
    .replace("{{TITOLO_LEZIONE}}", input.titolo_lezione)
    .replace("{{TITOLO_CORSO}}", input.titolo_corso)
    .replace("{{DESTINATARI}}", input.destinatari)
    .replace("{{CHUNKS_KB}}", input.chunks_kb || "(nessun materiale KB disponibile)")
    .replace("{{ARTICOLI_DLGS}}", input.articoli_dlgs || "(nessun articolo specificato)");

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4500,
    messages: [{ role: "user", content: prompt }],
  });

  const testo = msg.content[0].text;
  const parole = testo.split(/\s+/).filter(Boolean).length;

  return {
    testo,
    parole,
    stop_reason: msg.stop_reason,
    troncata: msg.stop_reason === "max_tokens",
  };
}

// ─── salva_corso_supabase ─────────────────────────────────────────────────────

async function salvaCorsoSupabase(input) {
  // recupera ultima versione per questo titolo
  const { data: existing } = await supabase
    .from("corsi_generati")
    .select("versione")
    .ilike("titolo", input.titolo)
    .order("versione", { ascending: false })
    .limit(1);

  const versione = existing && existing.length > 0 ? existing[0].versione + 1 : 1;

  const { data, error } = await supabase
    .from("corsi_generati")
    .insert({
      titolo: input.titolo,
      destinatari: input.destinatari,
      versione,
      n_lezioni: input.n_lezioni,
      argomento_ids: input.argomenti,
      lezioni_json: input.lezioni_json,
      creato_il: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return { errore: error.message };
  return { id: data.id, versione, messaggio: `Corso salvato come versione ${versione}` };
}

// ─── esporta_corso_txt ────────────────────────────────────────────────────────

async function esportaCorsoTxt(titolo, lezioniJson) {
  const outputDir = path.join(process.cwd(), "output");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const nomeFile = titolo.replace(/[^a-z0-9àèìòù]/gi, "_").toLowerCase() + ".txt";
  const percorso = path.join(outputDir, nomeFile);

  const contenuto = lezioniJson
    .map(l => `${"=".repeat(60)}\nLezione ${l.numero} — ${l.titolo}\n${"=".repeat(60)}\n\n${l.testo}`)
    .join("\n\n\n");

  fs.writeFileSync(percorso, contenuto, "utf8");
  return { percorso, nome_file: nomeFile, n_lezioni: lezioniJson.length };
}

// ─── leggi_documenti_kb ───────────────────────────────────────────────────────

async function leggiDocumentiKB(filtroStato) {
  let query = supabase
    .from("documenti")
    .select("id, nome_file, formato, stato, approvato, n_parole, argomenti_tag");

  if (filtroStato === "approvato") {
    query = query.eq("approvato", true);
  } else if (filtroStato === "analizzato") {
    query = query.eq("stato", "analizzato");
  }

  const { data, error } = await query.order("nome_file");
  if (error) return { errore: error.message };

  return {
    n_documenti: (data ?? []).length,
    documenti: (data ?? []).map(d => ({
      id: d.id,
      nome: d.nome_file,
      formato: d.formato,
      stato: d.stato,
      parole: d.n_parole,
      tag: d.argomenti_tag,
    })),
  };
}

// ─── aggiorna_stato_documento ─────────────────────────────────────────────────

// ─── genera_quiz_lezione ──────────────────────────────────────────────────────

const PROMPT_QUIZ = `Sei un esperto di formazione sulla sicurezza sul lavoro (D.Lgs. 81/08).
Genera {{N_DOMANDE}} domande a risposta multipla per la lezione "{{TITOLO}}" del corso "{{CORSO}}" (destinatari: {{DESTINATARI}}).

Focus della lezione: {{FOCUS}}

{{TESTO_LEZIONE}}

REGOLE:
- Ogni domanda deve avere esattamente 4 opzioni di risposta
- Una sola risposta corretta per domanda
- Le 3 opzioni errate devono essere plausibili (non ovviamente sbagliate)
- La risposta corretta deve essere posizionata in modo casuale (non sempre la prima)
- CorrectExplanation: breve spiegazione (1-2 frasi) che cita l'articolo o il principio normativo
- IncorrectExplanation: spiegazione comune valida per tutte le risposte errate (1-2 frasi)
- Difficoltà media: adatta al livello professionale del destinatario
- Non ripetere la stessa risposta corretta sempre nella stessa posizione

Restituisci SOLO un array JSON valido (nessun testo prima o dopo):
[
  {
    "domanda": "...",
    "risposta_corretta_n": 2,
    "answer1": "...",
    "answer2": "...(risposta corretta)",
    "answer3": "...",
    "answer4": "...",
    "correct_explanation": "...",
    "incorrect_explanation": "..."
  }
]

Il campo "risposta_corretta_n" indica quale Answer è corretta (1, 2, 3 o 4).`;

async function generaQuizLezione(input) {
  const clientQuiz = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const nDomande = input.n_domande ?? 4;

  const testoLezioneBlock = input.testo_lezione
    ? `TESTO DELLA LEZIONE:\n${input.testo_lezione.slice(0, 3000)}`
    : "(genera le domande basandoti sul focus e sulle tue conoscenze normative)";

  const prompt = PROMPT_QUIZ
    .replace("{{N_DOMANDE}}", nDomande)
    .replace("{{TITOLO}}", input.titolo_lezione)
    .replace("{{CORSO}}", input.corso)
    .replace("{{DESTINATARI}}", input.destinatari ?? "professionisti della sicurezza")
    .replace("{{FOCUS}}", input.focus_lezione)
    .replace("{{TESTO_LEZIONE}}", testoLezioneBlock);

  const msg = await clientQuiz.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: nDomande <= 4 ? 2000 : nDomande <= 10 ? 4000 : 8000,
    messages: [{ role: "user", content: prompt }],
  });

  const testo = msg.content[0].text.trim();

  let domande;
  try {
    const match = testo.match(/```(?:json)?\s*([\s\S]+?)\s*```/) ?? [null, testo];
    domande = JSON.parse(match[1]);
  } catch {
    const start = testo.indexOf("[");
    const end = testo.lastIndexOf("]");
    if (start === -1) return { errore: "Claude non ha restituito JSON valido per il quiz." };
    domande = JSON.parse(testo.slice(start, end + 1));
  }

  // Converti in righe formato LearnWorlds
  // NOTA: CorrectExplanation/IncorrectExplanation vanno lasciate vuote — se valorizzate
  // l'import XLSX su LearnWorlds fallisce (verificato manualmente).
  const righe = domande.map(d => ({
    Group: input.gruppo,
    Type: "TMC",
    Question: d.domanda,
    CorAns: d.risposta_corretta_n,
    Answer1: d.answer1,
    Answer2: d.answer2,
    Answer3: d.answer3,
    Answer4: d.answer4,
    Answer5: null, Answer6: null, Answer7: null, Answer8: null, Answer9: null, Answer10: null,
    CorrectExplanation: null,
    IncorrectExplanation: null,
  }));

  return {
    n_domande: righe.length,
    gruppo: input.gruppo,
    righe,
    // Anteprima testuale per debug (le spiegazioni restano qui, non nel file XLSX)
    anteprima: domande.map((d, i) =>
      `D${i + 1}. ${d.domanda}\n  1) ${d.answer1}\n  2) ${d.answer2}\n  3) ${d.answer3}\n  4) ${d.answer4}\n  ✅ Risposta: ${d.risposta_corretta_n} — ${d.correct_explanation}`
    ).join("\n\n"),
  };
}

// ─── genera_copione_avatar ────────────────────────────────────────────────────

const PROMPT_COPIONE_AVATAR = `Sei un formatore esperto di sicurezza sul lavoro (D.Lgs. 81/08) che deve registrare un video-lezione con un avatar digitale (HeyGen) per il corso "{{CORSO}}" (destinatari: {{DESTINATARI}}).

Scrivi il COPIONE PARLATO della lezione "{{TITOLO}}".

{{MATERIALE}}

REGOLE FONDAMENTALI:
- Lunghezza: 2500-3000 parole (corrisponde a 8-10 minuti di parlato a ~300 parole/minuto)
- Tono: discorsivo, naturale, come se stessi parlando direttamente allo studente ("tu")
- NESSUN simbolo, markdown, elenco puntato, numerazione, emoji, titolo o intestazione: solo testo continuo pensato per essere letto ad alta voce
- Quando serve elencare punti, usa connettivi parlati ("il primo aspetto riguarda...", "un altro elemento importante è...", "infine...")
- Spiega i concetti con parole semplici, esempi pratici e situazioni concrete del luogo di lavoro
- Cita gli articoli di legge in modo naturale ("l'articolo 16 del decreto stabilisce che...") senza sigle o riferimenti tra parentesi
- Apri la lezione con un breve aggancio che introduce l'argomento e chiudi con un riepilogo dei punti chiave e un collegamento alla lezione successiva
- Scrivi in italiano corrente, frasi non troppo lunghe, adatte alla sintesi vocale

Restituisci SOLO il testo del copione, senza commenti, titoli o note aggiuntive.`;

async function generaCopioneAvatar(input) {
  const clientCopione = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const materiale = input.testo_lezione
    ? `MATERIALE DI RIFERIMENTO (testo della lezione scritta):\n${input.testo_lezione.slice(0, 6000)}`
    : `Focus della lezione: ${input.focus_lezione ?? "(non specificato — basati sulle tue conoscenze normative)"}`;

  const prompt = PROMPT_COPIONE_AVATAR
    .replace("{{CORSO}}", input.corso)
    .replace("{{DESTINATARI}}", input.destinatari ?? "lavoratori")
    .replace("{{TITOLO}}", input.titolo_lezione)
    .replace("{{MATERIALE}}", materiale);

  const msg = await clientCopione.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 6000,
    messages: [{ role: "user", content: prompt }],
  });

  const copione = msg.content[0].text.trim();
  const nParole = copione.split(/\s+/).filter(Boolean).length;

  // Genera DOCX
  const paragrafi = copione.split(/\n+/).filter(p => p.trim().length > 0);
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          text: `Lezione ${input.numero_lezione} — ${input.titolo_lezione}`,
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({ text: input.corso, heading: HeadingLevel.HEADING_3 }),
        new Paragraph({ text: "" }),
        ...paragrafi.map(p => new Paragraph({ text: p, spacing: { after: 200 } })),
      ],
    }],
  });

  const cartellaCopioni = path.join(OUTPUT_DIR, slugCorso(input.corso), "Copioni Avatar");
  fs.mkdirSync(cartellaCopioni, { recursive: true });

  const slugTitolo = slugCorso(input.titolo_lezione);
  const nomeFile = `L${String(input.numero_lezione).padStart(2, "0")}_${slugTitolo}.docx`;
  const percorso = path.join(cartellaCopioni, nomeFile);

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(percorso, buffer);

  return {
    percorso,
    n_parole: nParole,
    durata_stimata_min: Math.round((nParole / 300) * 10) / 10,
    anteprima: copione.slice(0, 500) + (copione.length > 500 ? "..." : ""),
  };
}

// ─── aggiorna_stato_documento ─────────────────────────────────────────────────

async function aggiornaStatoDocumento(documentoId, azione) {
  if (azione === "approva") {
    const { error } = await supabase
      .from("documenti")
      .update({ stato: "approvato", approvato: true })
      .eq("id", documentoId);
    if (error) return { errore: error.message };
    return { successo: true, messaggio: `Documento ${documentoId} approvato` };
  } else {
    const { error } = await supabase
      .from("documenti")
      .update({ stato: "rifiutato", approvato: false })
      .eq("id", documentoId);
    if (error) return { errore: error.message };
    return { successo: true, messaggio: `Documento ${documentoId} rifiutato` };
  }
}
