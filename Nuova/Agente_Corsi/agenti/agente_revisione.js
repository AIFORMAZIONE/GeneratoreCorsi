/**
 * Agente Revisione — [Owner: A · Fase F]
 * Confronta file generato vs file corretto dall'umano, estrae pattern di correzione
 * e propone aggiornamenti ai prompt/regole degli altri agenti (feedback loop).
 * IN:  { file_generato, file_corretto, tipo }   OUT: { pattern[], suggerimenti_prompt[] }
 */
export async function analizzaRevisione({ fileGenerato, fileCorretto, tipo } = {}) {
  throw new Error("TODO[A]: implementare Agente Revisione");
}
