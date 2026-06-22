/**
 * Agente Quiz — [Owner: A · Fase D]
 * Genera domande a risposta multipla (formato Question Bank LearnWorlds).
 * IN:  Lezione (o aggregato modulo) + regole quiz (da corsi_config.js)
 * OUT: DomandaQuiz[]   →  export XLSX (ExcelJS, shared strings) via xlsx_export.js
 *
 * Riusa il prompt e il formato già validati in tools.js (generaQuizLezione).
 */

import Anthropic from "@anthropic-ai/sdk";
import { esportaQuizXlsx } from "../xlsx_export.js";

const MODEL = "claude-sonnet-4-6";

const PROMPT_QUIZ = `Sei un esperto di formazione sulla sicurezza sul lavoro (D.Lgs. 81/08).
Genera {{N_DOMANDE}} domande a risposta multipla per la lezione "{{TITOLO}}" del corso "{{CORSO}}" (destinatari: {{DESTINATARI}}).

Focus della lezione: {{FOCUS}}

{{TESTO_LEZIONE}}

REGOLE:
- Ogni domanda deve avere esattamente 4 opzioni di risposta
- Una sola risposta corretta per domanda
- Le 3 opzioni errate devono essere plausibili (non ovviamente sbagliate)
- La risposta corretta deve essere posizionata in modo casuale (non sempre la prima)
- Difficoltà media: adatta al livello professionale del destinatario
- Cita, dove possibile, l'articolo o il principio normativo nella domanda o nelle opzioni

Restituisci SOLO un array JSON valido (nessun testo prima o dopo):
[
  {
    "domanda": "...",
    "risposta_corretta_n": 2,
    "answer1": "...",
    "answer2": "...",
    "answer3": "...",
    "answer4": "..."
  }
]

Il campo "risposta_corretta_n" indica quale Answer è corretta (1, 2, 3 o 4).`;

function estraiJsonArray(testo) {
  const t = testo.trim();
  try {
    const match = t.match(/```(?:json)?\s*([\s\S]+?)\s*```/) ?? [null, t];
    return JSON.parse(match[1]);
  } catch {
    const start = t.indexOf("[");
    const end = t.lastIndexOf("]");
    if (start === -1 || end === -1) throw new Error("Claude non ha restituito un array JSON valido per il quiz.");
    return JSON.parse(t.slice(start, end + 1));
  }
}

/**
 * Genera le domande per una lezione (o aggregato modulo).
 *
 * @param {import("../contracts.js").Lezione} lezione  - usa titolo, focus, testo_md, numero
 * @param {object} [regole]                            - { nDomande, corso, destinatari }
 * @returns {Promise<import("../contracts.js").DomandaQuiz[]>}
 */
export async function generaQuiz(lezione, regole = {}) {
  if (!lezione?.titolo) throw new Error("agente_quiz: lezione.titolo mancante");

  const nDomande = regole.nDomande ?? 4;
  const corso = regole.corso ?? "Corso sicurezza sul lavoro";
  const destinatari = regole.destinatari ?? "professionisti della sicurezza";
  const group = `Lezione ${lezione.numero ?? "?"} — ${lezione.titolo}`;

  const testoBlock = lezione.testo_md
    ? `TESTO DELLA LEZIONE:\n${lezione.testo_md.slice(0, 3000)}`
    : "(genera le domande basandoti sul focus e sulle conoscenze normative)";

  const prompt = PROMPT_QUIZ
    .replaceAll("{{N_DOMANDE}}", String(nDomande))
    .replaceAll("{{TITOLO}}", lezione.titolo)
    .replaceAll("{{CORSO}}", corso)
    .replaceAll("{{DESTINATARI}}", destinatari)
    .replaceAll("{{FOCUS}}", lezione.focus ?? "")
    .replaceAll("{{TESTO_LEZIONE}}", testoBlock);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: nDomande <= 4 ? 2000 : nDomande <= 10 ? 4000 : 8000,
    messages: [{ role: "user", content: prompt }],
  });

  const domande = estraiJsonArray(msg.content[0].text);

  // Mappa al contratto DomandaQuiz
  return domande.map(d => ({
    group,
    type: "TMC",
    question: d.domanda,
    corAns: d.risposta_corretta_n,
    answers: [d.answer1, d.answer2, d.answer3, d.answer4],
  }));
}

/** Converte DomandaQuiz[] in righe formato Question Bank LearnWorlds. */
export function domandeToRighe(domande) {
  return domande.map(q => ({
    Group: q.group,
    Type: q.type,
    Question: q.question,
    CorAns: q.corAns,
    Answer1: q.answers[0] ?? null,
    Answer2: q.answers[1] ?? null,
    Answer3: q.answers[2] ?? null,
    Answer4: q.answers[3] ?? null,
    Answer5: null, Answer6: null, Answer7: null, Answer8: null, Answer9: null, Answer10: null,
    // CorrectExplanation/IncorrectExplanation sempre vuote (l'import LearnWorlds le rifiuta)
    CorrectExplanation: null,
    IncorrectExplanation: null,
  }));
}

/** Genera il quiz e lo esporta in XLSX (Question Bank). @returns {Promise<string>} percorso file */
export async function generaEdEsportaQuiz(lezione, percorso, regole = {}) {
  const domande = await generaQuiz(lezione, regole);
  await esportaQuizXlsx(domandeToRighe(domande), percorso);
  return percorso;
}
