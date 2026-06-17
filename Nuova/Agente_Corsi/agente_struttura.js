/**
 * Agente Struttura — propone l'indice completo di un corso prima della generazione.
 *
 * Flusso:
 *   1. Carica la configurazione normativa da corsi_config.js
 *   2. Analizza la copertura della KB (Supabase) per ogni modulo
 *   3. Usa Claude per adattare la struttura suggerita ai gap reali
 *   4. Mostra l'indice proposto all'utente (CLI interattiva)
 *   5. Attende approvazione o modifiche
 *   6. Restituisce la struttura approvata all'orchestratore
 *
 * Esportazione principale: runAgenteStruttura(tipoCorso, opzioni)
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import readline from "readline";
import { getCorsoConfig, listCorsi } from "./corsi_config.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Client Supabase ──────────────────────────────────────────────────────────
// Usa service role se disponibile (bypassa RLS), altrimenti prova auth email/pw

function creaClientSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  return createClient(process.env.SUPABASE_URL, key);
}

async function autenticaSupabase(supabase) {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return true; // service role bypassa RLS
  if (!process.env.SUPABASE_EMAIL || !process.env.SUPABASE_PASSWORD) {
    console.warn("⚠️  Nessuna SUPABASE_SERVICE_ROLE_KEY né credenziali — le query KB potrebbero fallire.");
    return false;
  }
  const { error } = await supabase.auth.signInWithPassword({
    email: process.env.SUPABASE_EMAIL,
    password: process.env.SUPABASE_PASSWORD,
  });
  if (error) {
    console.warn(`⚠️  Auth Supabase fallita: ${error.message}`);
    return false;
  }
  return true;
}

// ─── Analisi copertura KB ─────────────────────────────────────────────────────

async function analizzaKBCopertura(config, supabase) {
  console.log("\n[Gap analysis KB in corso...]\n");
  const report = [];

  for (const modulo of config.moduli) {
    // Prende le prime 4 parole chiave dal primo argomento del modulo come termini di ricerca
    const termini = modulo.argomenti
      .slice(0, 4)
      .map(a => a.split(":")[0].split("(")[0].trim().split(" ")[0].toLowerCase())
      .filter(t => t.length > 3);

    let nChunk = 0;
    let nDocumenti = 0;
    const chunkTrovati = [];

    for (const termine of termini) {
      const { data: byTitolo } = await supabase
        .from("argomenti")
        .select("id, titolo, n_parole")
        .eq("usabile", true)
        .ilike("titolo", `%${termine}%`)
        .limit(6);

      const { data: byTesto } = await supabase
        .from("argomenti")
        .select("id, titolo, n_parole")
        .eq("usabile", true)
        .ilike("testo_chunk", `%${termine}%`)
        .limit(4);

      const tutti = [...(byTitolo ?? []), ...(byTesto ?? [])];
      const unici = [...new Map(tutti.map(c => [c.id, c])).values()];
      nChunk += unici.length;
      chunkTrovati.push(...unici.map(c => c.titolo));
    }

    // Conta documenti con tag correlati
    const tagRicerca = modulo.argomenti
      .slice(0, 3)
      .map(a => a.split(":")[0].trim().toLowerCase().replace(/\s+/g, "-"));

    for (const tag of tagRicerca) {
      const { count } = await supabase
        .from("documenti")
        .select("id", { count: "exact", head: true })
        .eq("approvato", true)
        .contains("argomenti_tag", [tag]);
      nDocumenti += count ?? 0;
    }

    const dedup = [...new Set(chunkTrovati)];
    const status = nChunk >= 5 ? "✅" : nChunk >= 2 ? "⚠️ " : "❌ ";

    report.push({
      modulo: modulo.nome,
      ore: modulo.ore,
      n_chunk: nChunk,
      n_documenti: nDocumenti,
      status,
      coperto: nChunk >= 2,
      chunk_trovati: dedup.slice(0, 5),
      elearning: modulo.elearning,
    });

    console.log(`  ${status} ${modulo.nome} (${modulo.ore}h) — ${nChunk} chunk, ${nDocumenti} doc`);
  }

  return report;
}

// ─── Genera proposta con Claude ───────────────────────────────────────────────

async function generaPropostaConClaude(config, copertura, opzioni = {}) {
  const gapModuli = copertura.filter(m => !m.coperto).map(m => m.modulo);

  const prompt = `Sei un esperto di formazione sulla sicurezza sul lavoro (D.Lgs. 81/08).
Stai costruendo la struttura definitiva per il corso: "${config.titolo}"
Destinatari: ${config.destinatari}
Durata: ${config.ore_totali} ore — ${config.lezioni_suggerite} lezioni da ~${config.durata_lezione_min} minuti ciascuna
Riferimento normativo: ${config.riferimento}

COPERTURA KB (Knowledge Base aziendale):
${copertura.map(m => `  ${m.status} ${m.modulo}: ${m.n_chunk} chunk disponibili`).join("\n")}

${gapModuli.length > 0
  ? `MODULI CON GAP KB (generare comunque con soli articoli D.Lgs.):
${gapModuli.map(m => `  - ${m}`).join("\n")}`
  : "La KB copre tutti i moduli."}

STRUTTURA BASE (da adattare):
${JSON.stringify(config.struttura_suggerita ?? [], null, 2)}

${opzioni.note_utente ? `NOTE AGGIUNTIVE DALL'UTENTE:\n${opzioni.note_utente}\n` : ""}

COMPITO:
Restituisci SOLO un oggetto JSON valido con questa struttura esatta (nessun testo prima o dopo):
{
  "titolo_corso": "...",
  "destinatari": "...",
  "ore_totali": ${config.ore_totali},
  "n_lezioni": ${config.lezioni_suggerite},
  "durata_lezione_min": ${config.durata_lezione_min},
  "elearning": ${JSON.stringify(config.elearning)},
  "gap_segnalati": ["modulo o lezione con materiale KB limitato", ...],
  "moduli": [
    {
      "numero": 1,
      "nome": "...",
      "ore": ...,
      "n_lezioni": ...,
      "argomenti_chiave": ["...", "..."]
    }
  ],
  "lezioni": [
    {
      "n": 1,
      "modulo": 1,
      "titolo": "...",
      "focus": "...",
      "tipo": "lezione|quiz|caso_pratico|verifica_finale",
      "kb_disponibile": true|false
    }
  ]
}

Regole:
- Mantieni esattamente ${config.lezioni_suggerite} lezioni totali
- Ogni modulo deve avere lezioni equamente distribuite
- Ogni quarto del corso deve avere un quiz di verifica intermedia (tipo "quiz")
- L'ultima lezione deve essere tipo "verifica_finale"
- Adatta i titoli se la KB è carente (aggiungi nota "(art. D.Lgs.)" per indicare che si usa solo normativa)
- focus: massimo 120 caratteri, descrivi esattamente cosa viene trattato`;

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
  });

  const testo = msg.content[0].text.trim();

  // Estrai JSON dalla risposta (tollerante a markdown code blocks)
  const match = testo.match(/```(?:json)?\s*([\s\S]+?)\s*```/) ?? [null, testo];
  try {
    return JSON.parse(match[1]);
  } catch {
    // Fallback: tenta estrazione tra prima { e ultima }
    const start = testo.indexOf("{");
    const end = testo.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      return JSON.parse(testo.slice(start, end + 1));
    }
    throw new Error("Claude non ha restituito JSON valido per la struttura corso.");
  }
}

// ─── Visualizzazione indice ───────────────────────────────────────────────────

function stampaIndice(proposta) {
  console.log("\n" + "═".repeat(70));
  console.log(`  INDICE PROPOSTO: ${proposta.titolo_corso}`);
  console.log(`  Destinatari: ${proposta.destinatari}`);
  console.log(`  ${proposta.ore_totali}h — ${proposta.n_lezioni} lezioni da ~${proposta.durata_lezione_min} min — E-learning: ${proposta.elearning}`);
  console.log("═".repeat(70));

  let moduloCorrente = 0;
  for (const lezione of proposta.lezioni) {
    if (lezione.modulo !== moduloCorrente) {
      moduloCorrente = lezione.modulo;
      const mod = proposta.moduli.find(m => m.numero === moduloCorrente);
      if (mod) {
        console.log(`\n  ── MODULO ${mod.numero}: ${mod.nome} (${mod.ore}h, ${mod.n_lezioni} lezioni) ──`);
      }
    }
    const icona = lezione.tipo === "quiz" ? "📝" :
                  lezione.tipo === "verifica_finale" ? "🏆" :
                  lezione.tipo === "caso_pratico" ? "🔍" : "📖";
    const kb = lezione.kb_disponibile ? "" : " ⚠️ KB";
    console.log(`  ${String(lezione.n).padStart(3, " ")}. ${icona} ${lezione.titolo}${kb}`);
    if (process.env.DEBUG === "true") {
      console.log(`       → ${lezione.focus}`);
    }
  }

  if (proposta.gap_segnalati?.length > 0) {
    console.log("\n  ⚠️  GAP KB segnalati:");
    proposta.gap_segnalati.forEach(g => console.log(`     - ${g}`));
  }
  console.log("\n" + "═".repeat(70));
}

// ─── Approvazione interattiva ─────────────────────────────────────────────────

async function chiediApprovazione(proposta) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    console.log("\nOpzioni:");
    console.log("  [INVIO]      → Approva e procedi con la generazione");
    console.log("  modifica N   → Modifica titolo/focus della lezione N");
    console.log("  rimuovi N    → Rimuovi la lezione N dall'indice");
    console.log("  aggiungi     → Aggiungi una lezione manualmente");
    console.log("  rigenera     → Chiedi a Claude una struttura alternativa");
    console.log("  annulla      → Interrompi\n");

    const chiedi = () => {
      rl.question("Cosa vuoi fare? ", async (input) => {
        const cmd = input.trim().toLowerCase();

        if (cmd === "" || cmd === "ok" || cmd === "approva") {
          rl.close();
          resolve({ approvata: true, struttura: proposta });
          return;
        }

        if (cmd === "annulla") {
          rl.close();
          resolve({ approvata: false, struttura: null });
          return;
        }

        if (cmd.startsWith("modifica ")) {
          const n = parseInt(cmd.split(" ")[1]);
          const lezione = proposta.lezioni.find(l => l.n === n);
          if (!lezione) { console.log(`  ❌ Lezione ${n} non trovata.`); chiedi(); return; }
          rl.question(`  Nuovo titolo (attuale: "${lezione.titolo}"): `, (nuovoTitolo) => {
            if (nuovoTitolo.trim()) lezione.titolo = nuovoTitolo.trim();
            rl.question(`  Nuovo focus (attuale: "${lezione.focus}"): `, (nuovoFocus) => {
              if (nuovoFocus.trim()) lezione.focus = nuovoFocus.trim();
              console.log(`  ✅ Lezione ${n} aggiornata.`);
              chiedi();
            });
          });
          return;
        }

        if (cmd.startsWith("rimuovi ")) {
          const n = parseInt(cmd.split(" ")[1]);
          const idx = proposta.lezioni.findIndex(l => l.n === n);
          if (idx === -1) { console.log(`  ❌ Lezione ${n} non trovata.`); chiedi(); return; }
          proposta.lezioni.splice(idx, 1);
          // Rinumera
          proposta.lezioni.forEach((l, i) => { l.n = i + 1; });
          proposta.n_lezioni = proposta.lezioni.length;
          console.log(`  ✅ Lezione rimossa. Totale: ${proposta.n_lezioni} lezioni.`);
          chiedi();
          return;
        }

        if (cmd === "aggiungi") {
          rl.question("  Modulo (numero): ", (modNum) => {
            rl.question("  Titolo: ", (titolo) => {
              rl.question("  Focus: ", (focus) => {
                const newN = proposta.lezioni.length + 1;
                proposta.lezioni.push({ n: newN, modulo: parseInt(modNum), titolo, focus, tipo: "lezione", kb_disponibile: true });
                proposta.n_lezioni = newN;
                console.log(`  ✅ Lezione ${newN} aggiunta.`);
                chiedi();
              });
            });
          });
          return;
        }

        if (cmd === "rigenera") {
          console.log("  ↺ Rigenerazione struttura con Claude...");
          rl.close();
          resolve({ approvata: false, rigenera: true, struttura: null });
          return;
        }

        if (cmd === "mostra" || cmd === "indice") {
          stampaIndice(proposta);
          chiedi();
          return;
        }

        console.log("  Comando non riconosciuto. Digita INVIO per approvare o 'annulla' per uscire.");
        chiedi();
      });
    };

    chiedi();
  });
}

// ─── Funzione principale esportata ───────────────────────────────────────────

/**
 * Propone e fa approvare la struttura di un corso.
 *
 * @param {string} tipoCorso  - ID del corso da corsi_config.js (es: "formazione_datore_lavoro")
 * @param {object} opzioni    - { note_utente, destinatari_custom, skip_interattivo }
 * @returns {object|null}     - { struttura, n_lezioni, gap_segnalati } oppure null se annullato
 */
export async function runAgenteStruttura(tipoCorso, opzioni = {}) {
  const config = getCorsoConfig(tipoCorso);
  if (!config) {
    const disponibili = listCorsi().map(c => `  - ${c.id}: ${c.titolo}`).join("\n");
    throw new Error(`Tipo corso "${tipoCorso}" non trovato in corsi_config.js.\nCorsi disponibili:\n${disponibili}`);
  }

  console.log(`\n[Agente Struttura] Corso: ${config.titolo}`);
  console.log(`[Agente Struttura] ${config.ore_totali}h — ${config.lezioni_suggerite} lezioni da ~${config.durata_lezione_min} min\n`);

  // 1. Connetti Supabase
  const supabase = creaClientSupabase();
  await autenticaSupabase(supabase);

  // 2. Analizza copertura KB
  const copertura = await analizzaKBCopertura(config, supabase);

  // 3. Genera proposta con Claude (con retry se rigenera)
  let proposta = null;
  let tentativo = 0;

  while (tentativo < 3) {
    tentativo++;
    console.log(`\n[Agente Struttura] Generazione proposta (tentativo ${tentativo})...`);
    proposta = await generaPropostaConClaude(config, copertura, opzioni);

    // Mostra indice
    stampaIndice(proposta);

    // 4. Approvazione interattiva (salvo se skip)
    if (opzioni.skip_interattivo) {
      console.log("[Agente Struttura] Struttura approvata automaticamente (skip_interattivo=true)");
      return proposta;
    }

    const risultato = await chiediApprovazione(proposta);

    if (risultato.approvata) {
      console.log("\n✅ Struttura approvata. Pronto per la generazione.\n");
      return risultato.struttura;
    }

    if (risultato.rigenera) {
      console.log("\n↺ Rigenerazione in corso...\n");
      continue;
    }

    // annullato
    console.log("\n❌ Struttura annullata dall'utente.\n");
    return null;
  }

  console.log("\n⚠️  Numero massimo di tentativi raggiunto. Restituzione ultima proposta.\n");
  return proposta;
}

// ─── CLI standalone (node agente_struttura.js <tipo_corso>) ──────────────────

if (process.argv[1].endsWith("agente_struttura.js")) {
  import("fs").then(({ default: fs }) => {
    const tipoCorso = process.argv[2];

    if (!tipoCorso || tipoCorso === "--list") {
      console.log("\nCorsi disponibili:\n");
      listCorsi().forEach(c => {
        console.log(`  ${c.id}`);
        console.log(`    → ${c.titolo} (${c.ore_totali}h, ${c.lezioni_suggerite} lezioni, e-learning: ${c.elearning})`);
      });
      console.log("\nUso: node agente_struttura.js <tipo_corso>\n");
      process.exit(0);
    }

    const noteUtente = process.argv.slice(3).join(" ") || "";

    runAgenteStruttura(tipoCorso, { note_utente: noteUtente })
      .then(struttura => {
        if (struttura) {
          console.log("\n📋 Struttura pronta:");
          console.log(`   ${struttura.n_lezioni} lezioni — ${struttura.gap_segnalati?.length ?? 0} gap segnalati`);
          const percorso = `output/struttura_${tipoCorso}_${Date.now()}.json`;
          fs.mkdirSync("output", { recursive: true });
          fs.writeFileSync(percorso, JSON.stringify(struttura, null, 2), "utf8");
          console.log(`   Salvata in: ${percorso}`);
        }
      })
      .catch(err => {
        console.error("\n❌ Errore:", err.message);
        process.exit(1);
      });
  });
}
