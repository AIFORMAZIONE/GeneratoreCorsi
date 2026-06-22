/**
 * contracts.js — Interfacce dati CONDIVISE tra gli agenti AIFormazione.
 *
 * ⛔ FILE CONGELATO: si modifica SOLO a quattro mani (Davide + Collega) via PR.
 * Tutti gli agenti sviluppano contro queste strutture, così A e B possono
 * lavorare in parallelo senza dipendere dai file dell'altro.
 *
 * Sono definizioni JSDoc (nessun effetto a runtime) + enum + validatori leggeri.
 * Riferimento: docs/LOGICA_PROGETTO_E_AGENTI.md
 */

// ─── Enum ────────────────────────────────────────────────────────────────────
export const TIPI_LEZIONE = ["lezione", "quiz", "caso_pratico", "verifica_finale"];
export const TIPI_ASSET   = ["corso", "quiz", "copione", "video", "email", "presentazione", "anteprima", "post"];
export const STATI_ASSET  = ["generato", "in_revisione", "approvato", "pubblicato"];
export const ESITI_VALIDAZIONE = ["ok", "scartato", "da_rivedere"];

// ─── KB (input per la generazione) ────────────────────────────────────────────
/**
 * @typedef {Object} ChunkKB        // riga della tabella `argomenti`
 * @property {string} id
 * @property {string} titolo
 * @property {string} testo_chunk
 * @property {string} documento_id
 */
/**
 * @typedef {Object} ArticoloDlgs   // riga della tabella `articoli_dlgs`
 * @property {number} numero_articolo
 * @property {string} titolo_articolo
 * @property {string} testo_completo
 */

// ─── Fase A — Validazione KB (Agente Validazione KB → tabella validazione_kb) ──
/**
 * @typedef {Object} ValidazioneKB
 * @property {string} argomento_id
 * @property {boolean} troncato
 * @property {boolean} coerente
 * @property {number} n_parole
 * @property {('ok'|'scartato'|'da_rivedere')} esito
 * @property {string} [motivo]
 */

// ─── Fase C — Struttura (Agente Struttura → input generazione) ────────────────
/**
 * @typedef {Object} ModuloStruttura
 * @property {number} numero
 * @property {string} nome
 * @property {number} ore
 * @property {number} n_lezioni
 * @property {string[]} argomenti_chiave
 */
/**
 * @typedef {Object} VoceLezione
 * @property {number} n
 * @property {number} modulo
 * @property {string} titolo
 * @property {string} focus
 * @property {('lezione'|'quiz'|'caso_pratico'|'verifica_finale')} tipo
 * @property {boolean} kb_disponibile
 */
/**
 * @typedef {Object} Struttura
 * @property {string} titolo_corso
 * @property {string} destinatari
 * @property {number} ore_totali
 * @property {number} n_lezioni
 * @property {number} durata_lezione_min
 * @property {(boolean|'parziale')} elearning
 * @property {string[]} gap_segnalati
 * @property {ModuloStruttura[]} moduli
 * @property {VoceLezione[]} lezioni
 */

// ─── Fase D — Lezione generata (Generazione → Copione/Quiz) ───────────────────
/**
 * @typedef {Object} Lezione
 * @property {number} numero
 * @property {number} modulo
 * @property {string} titolo
 * @property {string} focus
 * @property {('lezione'|'quiz'|'caso_pratico'|'verifica_finale')} tipo
 * @property {string} testo_md          // markdown strutturato (1.400-1.900 parole)
 * @property {number} parole
 * @property {string[]} articoli_usati  // es. ["Art. 16", "Art. 18"]
 * @property {string[]} chunk_usati     // id dei ChunkKB usati
 */
/**
 * @typedef {Object} DomandaQuiz        // formato Question Bank LearnWorlds
 * @property {string} group             // "Lezione N — Titolo"
 * @property {'TMC'} type
 * @property {string} question
 * @property {number} corAns            // 1..4
 * @property {string[]} answers         // 4 opzioni
 */
/**
 * @typedef {Object} Copione            // monologo avatar HeyGen
 * @property {number} numero
 * @property {string} titolo
 * @property {string} testo             // prosa, ~2.500-3.000 parole
 * @property {number} parole
 */

// ─── Fase E — Presentazione (Agente Presentazione → Agenti Social) ────────────
/**
 * @typedef {Object} Presentazione
 * @property {string} corso_id
 * @property {string} testo             // ~1000 caratteri
 */

// ─── Fase F — Asset & Revisione ───────────────────────────────────────────────
/**
 * @typedef {Object} Asset             // riga della tabella asset_corso
 * @property {string} corso_id
 * @property {('corso'|'quiz'|'copione'|'video'|'email'|'presentazione'|'anteprima'|'post')} tipo
 * @property {number} versione
 * @property {string} file_url
 * @property {('generato'|'in_revisione'|'approvato'|'pubblicato')} stato
 */
/**
 * @typedef {Object} Revisione         // riga della tabella revisioni
 * @property {string} asset_id
 * @property {string} file_generato_url
 * @property {string} file_corretto_url
 * @property {string} note
 * @property {string} autore
 */

// ─── Validatori leggeri (runtime) ─────────────────────────────────────────────
export function validaStruttura(s) {
  const err = [];
  if (!s?.titolo_corso) err.push("titolo_corso mancante");
  if (!Array.isArray(s?.lezioni) || s.lezioni.length === 0) err.push("lezioni mancanti");
  if (s?.n_lezioni != null && s.lezioni?.length !== s.n_lezioni) err.push("n_lezioni non coerente con lezioni[]");
  for (const l of s?.lezioni ?? []) {
    if (!TIPI_LEZIONE.includes(l.tipo)) err.push(`lezione ${l.n}: tipo non valido (${l.tipo})`);
  }
  return { ok: err.length === 0, errori: err };
}

export function validaLezione(l) {
  const err = [];
  if (!l?.titolo) err.push("titolo mancante");
  if (!l?.testo_md) err.push("testo_md mancante");
  if (l?.parole != null && (l.parole < 800 || l.parole > 2500)) err.push(`parole fuori range (${l.parole})`);
  return { ok: err.length === 0, errori: err };
}
