/**
 * Agente Generazione Corso — [Owner: A · Fase D]
 * Genera il testo di una lezione (prompt v5) dai chunk KB + articoli D.Lgs.
 * IN:  VoceLezione + { chunks: ChunkKB[], articoli: ArticoloDlgs[], destinatari }
 * OUT: Lezione { testo_md, parole, articoli_usati, chunk_usati }  (1.400-1.900 parole)
 */
/** @returns {Promise<import("../contracts.js").Lezione>} */
export async function generaLezione(voceLezione, { chunks, articoli, destinatari } = {}) {
  throw new Error("TODO[A]: implementare Agente Generazione Corso");
}
