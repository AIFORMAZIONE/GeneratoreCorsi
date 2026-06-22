/**
 * Agente Validazione KB — [Owner: A · Fase A]
 * Verifica che ogni chunk della KB sia NON troncato e COERENTE; scrive l'esito in `validazione_kb`.
 * IN:  ChunkKB                         (vedi contracts.js)
 * OUT: ValidazioneKB { esito: ok|scartato|da_rivedere }
 */
// import { ESITI_VALIDAZIONE } from "../contracts.js";

/** @param {import("../contracts.js").ChunkKB} chunk @returns {Promise<import("../contracts.js").ValidazioneKB>} */
export async function validaChunk(chunk) {
  throw new Error("TODO[A]: implementare Agente Validazione KB");
}
