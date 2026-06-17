/**
 * Orchestratore multi-agente AIFormazione
 *
 * Flusso di generazione:
 *   1. Parse richiesta utente → identifica tipo corso
 *   2. Agente Struttura → propone indice, attende approvazione
 *   3. Loop lezioni: recupera KB + articoli D.Lgs. → genera testo
 *   4. Salva su Supabase (corsi_generati) + esporta file TXT
 *
 * Comandi CLI speciali:
 *   /corsi          → lista corsi disponibili con durata e n. lezioni
 *   /kb             → lista documenti nella Knowledge Base
 *   /gap <tag,...>  → analisi gap per tag specifici
 *   /struttura <id> → propone solo l'indice (senza generare)
 *   /help           → mostra questo aiuto
 *   /exit           → esci
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import readline from "readline";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { runAgenteStruttura } from "./agente_struttura.js";
import { listCorsi, getCorsoConfig } from "./corsi_config.js";
import { esportaQuizXlsx } from "./xlsx_export.js";
import { slugCorso } from "./slug.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = process.env.OUTPUT_DIR
  ?? path.join(__dirname, "..", "..", "..", "Corsi Generati");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Client Supabase ──────────────────────────────────────────────────────────

function creaClientSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  return createClient(process.env.SUPABASE_URL, key);
}

async function autenticaSupabase(supabase) {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return true;
  if (process.env.SUPABASE_EMAIL && process.env.SUPABASE_PASSWORD) {
    const { error } = await supabase.auth.signInWithPassword({
      email: process.env.SUPABASE_EMAIL,
      password: process.env.SUPABASE_PASSWORD,
    });
    if (!error) return true;
    console.warn("⚠️  Auth Supabase fallita:", error.message);
  }
  return false;
}

// ─── Prompt e-learning (550-750 parole, ~15 min) ─────────────────────────────

const PROMPT_ELEARNING = `Sei un esperto di formazione sulla sicurezza sul lavoro (D.Lgs. 81/08).
Genera il testo della lezione {{N}} — "{{TITOLO}}" per il corso "{{CORSO}}" destinato a: {{DESTINATARI}}.
Durata target: ~15 minuti di lettura/visione.

FOCUS: {{FOCUS}}

MATERIALE DI RIFERIMENTO (KB aziendale):
{{CHUNKS_KB}}

ARTICOLI D.LGS. PERTINENTI:
{{ARTICOLI_DLGS}}

STRUTTURA OBBLIGATORIA (rispetta questo formato esatto):

## {{TITOLO}}

### Introduzione
[3-4 frasi discorsive che contestualizzano il tema nel ruolo del destinatario]

### In questa lezione imparerai a:
- [obiettivo 1 con verbo all'infinito]
- [obiettivo 2 con verbo all'infinito]
- [obiettivo 3 con verbo all'infinito]

### 💡 Da sapere
[Massima o dato normativo chiave — massimo 25 parole]

### [Titolo sezione 1 — argomento principale]
[4-6 frasi discorsive. Cita articoli D.Lgs. quando pertinente. No elenchi puntati.]

### [Titolo sezione 2 — approfondimento]
[4-6 frasi discorsive.]

### [Titolo sezione 3 — aspetto pratico o normativo aggiuntivo]
[4-6 frasi discorsive.]

### Caso pratico
[Scenario aziendale concreto e realistico in 3-4 frasi. Concludi con una domanda aperta di riflessione.]

### Punti chiave
- [punto 1 — sintetico e memorabile]
- [punto 2]
- [punto 3]
- [punto 4 se necessario]

Scrivi 580-750 parole totali. Tono professionale ma accessibile. Cita sempre gli articoli D.Lgs. pertinenti.`;

const PROMPT_QUIZ_MODULO = `Sei un esperto di formazione sulla sicurezza sul lavoro (D.Lgs. 81/08).
Genera un quiz di verifica per il modulo {{MODULO_NOME}} del corso "{{CORSO}}".
Il quiz deve coprire i contenuti delle seguenti lezioni:
{{LEZIONI_MODULO}}

Genera esattamente 10 domande a risposta multipla (3 opzioni: A, B, C).
Restituisci SOLO un array JSON valido, senza testo prima o dopo:
[
  {
    "n": 1,
    "domanda": "...",
    "opzioni": { "A": "...", "B": "...", "C": "..." },
    "risposta_corretta": "A",
    "spiegazione": "..."
  }
]

Regole:
- Una sola risposta corretta per domanda
- Le opzioni sbagliate devono essere plausibili (no risposte ovviamente errate)
- La spiegazione deve citare l'articolo o il principio normativo rilevante
- Difficoltà media: adatta al livello del destinatario`;

const PROMPT_VERIFICA_FINALE = `Sei un esperto di formazione sulla sicurezza sul lavoro (D.Lgs. 81/08).
Genera la verifica finale del corso "{{CORSO}}" ({{ORE_TOTALI}} ore, {{N_LEZIONI}} lezioni).
Copre l'intero corso: {{MODULI_CORSO}}.

Genera esattamente 30 domande a risposta multipla (3 opzioni: A, B, C) distribuite equamente tra i moduli.
Restituisci SOLO un array JSON valido (stesso formato del quiz modulo).
Soglia di superamento: 70% (21/30 risposte corrette).`;

// ─── Recupero materiale per lezione ──────────────────────────────────────────

async function recuperaChunksPerLezione(lezione, struttura, supabase) {
  const termini = estraiTermini(lezione.focus, lezione.titolo);
  const chunks = [];

  for (const termine of termini.slice(0, 4)) {
    const { data: byTitolo } = await supabase
      .from("argomenti")
      .select("id, titolo, testo_chunk, n_parole")
      .eq("usabile", true)
      .ilike("titolo", `%${termine}%`)
      .limit(4);

    const { data: byTesto } = await supabase
      .from("argomenti")
      .select("id, titolo, testo_chunk, n_parole")
      .eq("usabile", true)
      .ilike("testo_chunk", `%${termine}%`)
      .limit(3);

    for (const c of [...(byTitolo ?? []), ...(byTesto ?? [])]) {
      if (!chunks.find(x => x.id === c.id)) chunks.push(c);
    }
  }

  // Limita a max 3000 parole di contesto
  let totaleParole = 0;
  const selezionati = [];
  for (const c of chunks) {
    if (totaleParole + (c.n_parole ?? 0) > 3000) break;
    selezionati.push(c);
    totaleParole += c.n_parole ?? 0;
  }

  return selezionati.map(c => `### ${c.titolo}\n${c.testo_chunk}`).join("\n\n---\n\n");
}

async function recuperaArticoliPerLezione(lezione, supabase) {
  const termini = estraiTermini(lezione.focus, lezione.titolo);
  const tagDB = ["datore_lavoro", "tutti", "valutazione_rischi", "rls",
                 "appalti", "rspp", "medico_competente", "dpi", "segnaletica",
                 "emergenze", "luoghi_di_lavoro", "attrezzature", "agenti_fisici"];

  // Cerca tag pertinenti dalla lezione
  const tagRilevanti = tagDB.filter(tag =>
    termini.some(t => tag.includes(t) || t.includes(tag.replace("_", " ")))
  );
  if (tagRilevanti.length === 0) tagRilevanti.push("tutti");

  const articoli = [];
  for (const tag of tagRilevanti.slice(0, 3)) {
    const { data } = await supabase
      .from("articoli_dlgs")
      .select("numero_articolo, titolo_articolo, testo_completo")
      .contains("corsi_tag", [tag])
      .neq("tipo", "abrogato")
      .limit(3);
    if (data) articoli.push(...data);
  }

  const dedup = [...new Map(articoli.map(a => [a.numero_articolo, a])).values()].slice(0, 5);
  return dedup
    .map(a => `Art. ${a.numero_articolo} — ${a.titolo_articolo}\n${a.testo_completo}`)
    .join("\n\n---\n\n");
}

function estraiTermini(focus, titolo) {
  const stopWords = new Set(["il","la","lo","le","i","gli","di","del","della","degli",
    "dei","con","per","nel","nella","e","o","un","una","che","da","in","su","al","ai",
    "tra","fra","ma","non","si","se","come","quando","dove","cosa","chi","ha","è","sono"]);
  const testo = `${titolo} ${focus}`.toLowerCase();
  return testo
    .replace(/[().,;:\/\\-]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 4 && !stopWords.has(t))
    .slice(0, 8);
}

// ─── Generazione contenuti ────────────────────────────────────────────────────

async function generaLezioneElearning(lezione, struttura, chunks, articoli) {
  const prompt = PROMPT_ELEARNING
    .replaceAll("{{N}}", lezione.n)
    .replaceAll("{{TITOLO}}", lezione.titolo)
    .replaceAll("{{CORSO}}", struttura.titolo_corso)
    .replaceAll("{{DESTINATARI}}", struttura.destinatari)
    .replaceAll("{{FOCUS}}", lezione.focus)
    .replaceAll("{{CHUNKS_KB}}", chunks || "(nessun materiale KB disponibile — usa solo normativa)")
    .replaceAll("{{ARTICOLI_DLGS}}", articoli || "(nessun articolo specifico — tratta il tema in modo generale)");

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2500,
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

async function generaQuizModulo(nomeModulo, corso, lezioniModulo) {
  const riepilogo = lezioniModulo
    .filter(l => l.tipo === "lezione" || l.tipo === "caso_pratico")
    .map(l => `  ${l.n}. ${l.titolo} — ${l.focus}`)
    .join("\n");

  const prompt = PROMPT_QUIZ_MODULO
    .replaceAll("{{MODULO_NOME}}", nomeModulo)
    .replaceAll("{{CORSO}}", corso)
    .replaceAll("{{LEZIONI_MODULO}}", riepilogo);

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }],
  });

  const testo = msg.content[0].text.trim();
  try {
    const match = testo.match(/```(?:json)?\s*([\s\S]+?)\s*```/) ?? [null, testo];
    return JSON.parse(match[1]);
  } catch {
    const start = testo.indexOf("[");
    const end = testo.lastIndexOf("]");
    if (start !== -1 && end !== -1) return JSON.parse(testo.slice(start, end + 1));
    return [];
  }
}

async function generaVerificaFinale(struttura) {
  const moduli = struttura.moduli.map(m => m.nome).join(", ");
  const prompt = PROMPT_VERIFICA_FINALE
    .replaceAll("{{CORSO}}", struttura.titolo_corso)
    .replaceAll("{{ORE_TOTALI}}", struttura.ore_totali)
    .replaceAll("{{N_LEZIONI}}", struttura.n_lezioni)
    .replaceAll("{{MODULI_CORSO}}", moduli);

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
  });

  const testo = msg.content[0].text.trim();
  try {
    const match = testo.match(/```(?:json)?\s*([\s\S]+?)\s*```/) ?? [null, testo];
    return JSON.parse(match[1]);
  } catch {
    const start = testo.indexOf("[");
    const end = testo.lastIndexOf("]");
    if (start !== -1 && end !== -1) return JSON.parse(testo.slice(start, end + 1));
    return [];
  }
}

// ─── Orchestrazione generazione ───────────────────────────────────────────────

async function orchestraGenerazione(struttura, supabase) {
  const lezioniComplete = [];
  const quizModuli = {};
  let verificaFinale = [];
  const problemi = [];

  const totaleLezioni = struttura.lezioni.filter(
    l => l.tipo === "lezione" || l.tipo === "caso_pratico"
  ).length;
  let contatore = 0;

  console.log(`\n${"─".repeat(60)}`);
  console.log(`Generazione: ${struttura.titolo_corso}`);
  console.log(`${struttura.n_lezioni} lezioni totali — ${struttura.ore_totali}h`);
  console.log("─".repeat(60) + "\n");

  for (const lezione of struttura.lezioni) {

    // ── Quiz di fine modulo ──
    if (lezione.tipo === "quiz") {
      process.stdout.write(`  📝 Quiz Modulo ${lezione.modulo}... `);
      const modulo = struttura.moduli.find(m => m.numero === lezione.modulo);
      const lezioniMod = struttura.lezioni.filter(
        l => l.modulo === lezione.modulo && (l.tipo === "lezione" || l.tipo === "caso_pratico")
      );
      const domande = await generaQuizModulo(modulo?.nome ?? `Modulo ${lezione.modulo}`, struttura.titolo_corso, lezioniMod);
      quizModuli[lezione.modulo] = domande;
      lezioniComplete.push({ ...lezione, quiz: domande });
      console.log(`✅ ${domande.length} domande`);
      continue;
    }

    // ── Verifica finale ──
    if (lezione.tipo === "verifica_finale") {
      process.stdout.write(`  🏆 Verifica finale... `);
      verificaFinale = await generaVerificaFinale(struttura);
      lezioniComplete.push({ ...lezione, quiz: verificaFinale });
      console.log(`✅ ${verificaFinale.length} domande`);
      continue;
    }

    // ── Lezione / Caso pratico ──
    contatore++;
    process.stdout.write(`  [${contatore}/${totaleLezioni}] L${lezione.n}: "${lezione.titolo}"... `);

    const chunks = await recuperaChunksPerLezione(lezione, struttura, supabase);
    const articoli = await recuperaArticoliPerLezione(lezione, supabase);

    let risultato = await generaLezioneElearning(lezione, struttura, chunks, articoli);

    // Retry se troncata
    if (risultato.troncata) {
      process.stdout.write("⚠️ troncata, retry... ");
      const msgRetry = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 3500,
        messages: [{ role: "user", content: PROMPT_ELEARNING
          .replaceAll("{{N}}", lezione.n)
          .replaceAll("{{TITOLO}}", lezione.titolo)
          .replaceAll("{{CORSO}}", struttura.titolo_corso)
          .replaceAll("{{DESTINATARI}}", struttura.destinatari)
          .replaceAll("{{FOCUS}}", lezione.focus)
          .replaceAll("{{CHUNKS_KB}}", chunks || "(nessun materiale KB)")
          .replaceAll("{{ARTICOLI_DLGS}}", articoli || "(nessun articolo specifico)")
        }],
      });
      risultato = {
        testo: msgRetry.content[0].text,
        parole: msgRetry.content[0].text.split(/\s+/).filter(Boolean).length,
        stop_reason: msgRetry.stop_reason,
        troncata: msgRetry.stop_reason === "max_tokens",
      };
    }

    if (risultato.troncata) {
      problemi.push(`L${lezione.n}: "${lezione.titolo}" — ancora troncata dopo retry`);
    }

    lezioniComplete.push({ ...lezione, ...risultato });
    console.log(`✅ ${risultato.parole} parole${risultato.troncata ? " ⚠️" : ""}`);
  }

  console.log(`\n✅ Generazione completata.`);
  if (problemi.length > 0) {
    console.log("⚠️  Problemi rilevati:");
    problemi.forEach(p => console.log(`   - ${p}`));
  }

  return { lezioni: lezioniComplete, quizModuli, verificaFinale, problemi };
}

// ─── Salvataggio e export ─────────────────────────────────────────────────────

async function salvaCorsoSupabase(struttura, lezioni, supabase) {
  const lezioniJson = lezioni
    .filter(l => l.testo)
    .map(l => ({ numero: l.n, titolo: l.titolo, modulo: l.modulo, testo: l.testo, parole: l.parole }));

  const { data: existing } = await supabase
    .from("corsi_generati")
    .select("versione")
    .ilike("titolo", struttura.titolo_corso)
    .order("versione", { ascending: false })
    .limit(1);

  const versione = existing?.length > 0 ? existing[0].versione + 1 : 1;

  const { data, error } = await supabase
    .from("corsi_generati")
    .insert({
      titolo: struttura.titolo_corso,
      destinatari: struttura.destinatari,
      versione,
      n_lezioni: struttura.n_lezioni,
      argomenti: struttura.moduli?.map(m => m.nome) ?? [],
      lezioni_json: lezioniJson,
    })
    .select("id")
    .single();

  if (error) {
    console.warn("⚠️  Salvataggio Supabase fallito:", error.message);
    return null;
  }
  console.log(`\n💾 Corso salvato su Supabase (v${versione}, id: ${data.id})`);
  return data.id;
}

function cartellaCorso(struttura) {
  const dir = path.join(OUTPUT_DIR, slugCorso(struttura.titolo_corso));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function esportaCorsoTxt(struttura, lezioni) {
  const percorso = path.join(cartellaCorso(struttura), "corso.txt");

  const intestazione = [
    "=".repeat(70),
    `CORSO: ${struttura.titolo_corso}`,
    `Destinatari: ${struttura.destinatari}`,
    `Durata: ${struttura.ore_totali}h — ${struttura.n_lezioni} lezioni`,
    `Generato il: ${new Date().toLocaleDateString("it-IT")}`,
    "=".repeat(70),
    "",
  ].join("\n");

  const lezioniTxt = lezioni.map(l => {
    if (l.quiz) {
      // Sezione quiz
      const header = `${"─".repeat(70)}\n${l.tipo === "verifica_finale" ? "🏆 VERIFICA FINALE" : `📝 QUIZ — ${struttura.moduli?.find(m => m.numero === l.modulo)?.nome ?? "Modulo " + l.modulo}`}\n${"─".repeat(70)}\n`;
      const domandeStr = l.quiz.map((d, i) =>
        `${i + 1}. ${d.domanda}\n   A) ${d.opzioni.A}\n   B) ${d.opzioni.B}\n   C) ${d.opzioni.C}\n   → Risposta: ${d.risposta_corretta} — ${d.spiegazione}`
      ).join("\n\n");
      return header + domandeStr;
    }
    if (!l.testo) return "";
    return `${"─".repeat(70)}\nLezione ${l.n} — ${l.titolo} [Modulo ${l.modulo}]\n${"─".repeat(70)}\n\n${l.testo}`;
  }).filter(Boolean).join("\n\n\n");

  fs.writeFileSync(percorso, intestazione + lezioniTxt, "utf8");
  return percorso;
}

function esportaQuizJson(struttura, lezioni) {
  const tutteLeQuiz = lezioni
    .filter(l => l.quiz)
    .flatMap(l => l.quiz.map(d => ({ ...d, modulo: l.modulo, tipo: l.tipo })));

  if (tutteLeQuiz.length === 0) return null;

  const percorso = path.join(cartellaCorso(struttura), "quiz.json");
  fs.writeFileSync(percorso, JSON.stringify(tutteLeQuiz, null, 2), "utf8");
  return percorso;
}

const LETTERA_A_CORANS = { A: 1, B: 2, C: 3, D: 4 };

async function esportaQuizExcel(struttura, lezioni) {
  const lezioniConQuiz = lezioni.filter(l => l.quiz && l.quiz.length > 0);
  if (lezioniConQuiz.length === 0) return null;

  const righe = lezioniConQuiz.flatMap(l => {
    const gruppo = l.tipo === "verifica_finale" ? "Verifica Finale" : `Modulo ${l.modulo}`;
    return l.quiz.map(d => ({
      Group: gruppo,
      Type: "TMC",
      Question: d.domanda,
      CorAns: LETTERA_A_CORANS[d.risposta_corretta] ?? 1,
      Answer1: d.opzioni?.A ?? null,
      Answer2: d.opzioni?.B ?? null,
      Answer3: d.opzioni?.C ?? null,
      Answer4: d.opzioni?.D ?? null,
    }));
  });

  const percorso = path.join(cartellaCorso(struttura), "quiz.xlsx");
  await esportaQuizXlsx(righe, percorso);
  return percorso;
}

// ─── Parsing richiesta utente ─────────────────────────────────────────────────

async function identificaTipoCorso(testo) {
  const corsiDisponibili = listCorsi();

  // Corrispondenza diretta per ID
  const idDiretto = corsiDisponibili.find(c => testo.toLowerCase().includes(c.id));
  if (idDiretto) return idDiretto.id;

  // Corrispondenza per parole chiave nel titolo
  const mappaTitoli = {
    "datore di lavoro": "formazione_datore_lavoro",
    "datore lavoro": "formazione_datore_lavoro",
    "16 ore": "formazione_datore_lavoro",
    "rls": "aggiornamento_rls",
    "rappresentante": "aggiornamento_rls",
    "lavoratori basso": "formazione_lavoratori_basso",
    "rischio basso": "formazione_lavoratori_basso",
    "lavoratori medio": "formazione_lavoratori_medio",
    "rischio medio": "formazione_lavoratori_medio",
    "lavoratori alto": "formazione_lavoratori_alto",
    "rischio alto": "formazione_lavoratori_alto",
    "preposto": "formazione_preposti",
    "preposti": "formazione_preposti",
    "dirigent": "formazione_dirigenti",
    "antincendio basso": "antincendio_basso",
    "antincendio medio": "antincendio_medio",
    "antincendio alto": "antincendio_alto",
    "primo soccorso": "primo_soccorso_bc",
    "gdpr": "gdpr_privacy",
    "privacy": "gdpr_privacy",
  };

  const testoLower = testo.toLowerCase();
  for (const [kw, id] of Object.entries(mappaTitoli)) {
    if (testoLower.includes(kw)) return id;
  }

  // Fallback: chiedi a Claude
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 100,
    messages: [{
      role: "user",
      content: `Quale tipo di corso di sicurezza sul lavoro viene richiesto?\nRichiesta: "${testo}"\n\nCorsi disponibili:\n${corsiDisponibili.map(c => `- ${c.id}: ${c.titolo}`).join("\n")}\n\nRispondi SOLO con l'id del corso (es: formazione_datore_lavoro). Se non identificabile, rispondi "non_identificato".`,
    }],
  });

  const risposta = msg.content[0].text.trim().toLowerCase();
  const corsoTrovato = corsiDisponibili.find(c => risposta.includes(c.id));
  return corsoTrovato?.id ?? null;
}

// ─── Flusso principale ────────────────────────────────────────────────────────

async function generaCorso(richiestaUtente) {
  console.log("\n" + "═".repeat(60));
  console.log("  AIFORMAZIONE — Generazione Corso");
  console.log("═".repeat(60));

  // 1. Identifica tipo corso
  const tipoCorso = await identificaTipoCorso(richiestaUtente);
  if (!tipoCorso) {
    console.log("\n❌ Tipo corso non identificato. Corsi disponibili:");
    listCorsi().forEach(c => console.log(`   - ${c.titolo} → usa: ${c.id}`));
    return;
  }

  const config = getCorsoConfig(tipoCorso);
  console.log(`\n→ Corso identificato: ${config.titolo}`);

  // 2. Connetti Supabase
  const supabase = creaClientSupabase();
  await autenticaSupabase(supabase);

  // 3. Agente Struttura → propone e approva indice
  const noteAggiuntive = richiestaUtente.replace(config.titolo.toLowerCase(), "").trim();
  const struttura = await runAgenteStruttura(tipoCorso, {
    note_utente: noteAggiuntive,
  });
  if (!struttura) {
    console.log("↩️  Generazione annullata.");
    return;
  }

  // 4. Genera lezioni
  const { lezioni, problemi } = await orchestraGenerazione(struttura, supabase);

  // 5. Salva su Supabase
  await salvaCorsoSupabase(struttura, lezioni, supabase);

  // 6. Esporta file
  const percorsoTxt = esportaCorsoTxt(struttura, lezioni);
  const percorsoQuiz = esportaQuizJson(struttura, lezioni);
  const percorsoQuizXlsx = await esportaQuizExcel(struttura, lezioni);

  // 7. Riepilogo finale
  const lezioniConTesto = lezioni.filter(l => l.testo);
  const paroleTotali = lezioniConTesto.reduce((acc, l) => acc + (l.parole ?? 0), 0);
  const quizTotali = lezioni.filter(l => l.quiz).reduce((acc, l) => acc + (l.quiz?.length ?? 0), 0);

  console.log("\n" + "═".repeat(60));
  console.log("  RIEPILOGO GENERAZIONE");
  console.log("═".repeat(60));
  console.log(`  Corso:        ${struttura.titolo_corso}`);
  console.log(`  Lezioni:      ${lezioniConTesto.length} testi generati`);
  console.log(`  Parole:       ${paroleTotali.toLocaleString("it-IT")}`);
  console.log(`  Domande quiz: ${quizTotali}`);
  console.log(`  File TXT:     ${percorsoTxt}`);
  if (percorsoQuiz) console.log(`  File Quiz:    ${percorsoQuiz}`);
  if (percorsoQuizXlsx) console.log(`  File Quiz XLSX (LearnWorlds): ${percorsoQuizXlsx}`);
  if (problemi.length > 0) {
    console.log(`  ⚠️  Problemi:   ${problemi.length} (vedi dettagli sopra)`);
  }
  console.log("═".repeat(60) + "\n");
}

// ─── Comandi speciali CLI ─────────────────────────────────────────────────────

async function gestisciComando(input, supabase) {
  if (input === "/corsi") {
    console.log("\nCorsi disponibili:\n");
    listCorsi().forEach(c => {
      const el = c.elearning === true ? "✅ e-learning" : c.elearning === false ? "❌ solo presenza" : "⚠️  parziale";
      console.log(`  ${c.id}`);
      console.log(`    ${c.titolo}`);
      console.log(`    ${c.ore_totali}h — ${c.lezioni_suggerite} lezioni da ~15 min — ${el}`);
    });
    console.log();
    return true;
  }

  if (input.startsWith("/struttura ")) {
    const tipoCorso = input.slice(11).trim();
    await runAgenteStruttura(tipoCorso, { note_utente: "" });
    return true;
  }

  if (input === "/kb") {
    const { data, error } = await supabase
      .from("documenti")
      .select("id, nome_file, stato, approvato, n_parole, argomenti_tag")
      .eq("approvato", true)
      .order("nome_file");
    if (error) { console.log("❌ Errore:", error.message); return true; }
    console.log(`\nKnowledge Base — ${data.length} documenti approvati:\n`);
    data.forEach(d => console.log(`  ✅ ${d.nome_file} — ${d.n_parole ?? "?"} parole — tag: ${(d.argomenti_tag ?? []).join(", ")}`));
    console.log();
    return true;
  }

  if (input.startsWith("/gap ")) {
    const tags = input.slice(5).split(",").map(t => t.trim());
    console.log("\nAnalisi gap KB:\n");
    for (const tag of tags) {
      const { data: byTag } = await supabase
        .from("argomenti")
        .select("id, titolo")
        .eq("usabile", true)
        .ilike("titolo", `%${tag}%`)
        .limit(8);
      const n = byTag?.length ?? 0;
      const icona = n >= 3 ? "✅" : n >= 1 ? "⚠️ " : "❌ ";
      console.log(`  ${icona} "${tag}": ${n} chunk`);
      if (n > 0) byTag.slice(0, 3).forEach(c => console.log(`     - ${c.titolo}`));
    }
    console.log();
    return true;
  }

  if (input === "/help") {
    mostraAiuto();
    return true;
  }

  if (input === "/exit" || input === "/quit") {
    console.log("Arrivederci!\n");
    process.exit(0);
  }

  return false;
}

function mostraAiuto() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           AIFORMAZIONE — Generatore Corsi E-learning          ║
╚══════════════════════════════════════════════════════════════╝

COMANDI:
  /corsi              → lista corsi disponibili con durata e lezioni
  /struttura <id>     → propone solo l'indice (senza generare)
  /kb                 → lista documenti nella Knowledge Base
  /gap <tag1,tag2>    → verifica copertura KB per tag specifici
  /help               → mostra questo aiuto
  /exit               → esci

ESEMPI DI RICHIESTA:
  Genera il corso Datore di Lavoro 16h
  formazione_lavoratori_basso
  Genera aggiornamento RLS per aziende manifatturiere
  Corso antincendio rischio basso

FLUSSO:
  1. L'agente propone l'indice del corso (64 lezioni per 16h)
  2. Approvi o modifichi l'indice
  3. L'agente genera tutte le lezioni automaticamente
  4. File salvati in: ${OUTPUT_DIR}
`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const missing = ["ANTHROPIC_API_KEY", "SUPABASE_URL", "SUPABASE_ANON_KEY"]
    .filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.error(`\n❌ Variabili d'ambiente mancanti: ${missing.join(", ")}`);
    console.error("   Copia .env.example in .env e compila i valori.\n");
    process.exit(1);
  }

  const supabase = creaClientSupabase();
  await autenticaSupabase(supabase);

  mostraAiuto();

  // Modalità non interattiva (argomento CLI)
  const argoCLI = process.argv.slice(2).join(" ").trim();
  if (argoCLI) {
    const eraComando = await gestisciComando(argoCLI, supabase);
    if (!eraComando) await generaCorso(argoCLI);
    return;
  }

  // Modalità interattiva
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const chiedi = () => {
    rl.question("\nRichiesta corso (o comando): ", async input => {
      const testo = input.trim();
      if (!testo) { chiedi(); return; }
      const eraComando = await gestisciComando(testo, supabase);
      if (!eraComando) await generaCorso(testo).catch(err => console.error("❌ Errore:", err.message));
      chiedi();
    });
  };
  chiedi();
}

main().catch(err => {
  console.error("\n❌ Errore fatale:", err.message);
  process.exit(1);
});
