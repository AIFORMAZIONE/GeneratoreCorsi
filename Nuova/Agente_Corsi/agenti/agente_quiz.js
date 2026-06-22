/**
 * Agente Quiz — [Owner: A · Fase D]
 * Genera domande a risposta multipla (formato Question Bank LearnWorlds).
 * IN:  Lezione (o aggregato modulo) + regole quiz (da corsi_config.js)
 * OUT: DomandaQuiz[]   →  export XLSX (ExcelJS, shared strings)
 */
/** @returns {Promise<import("../contracts.js").DomandaQuiz[]>} */
export async function generaQuiz(lezioneOModulo, regole = {}) {
  throw new Error("TODO[A]: implementare Agente Quiz");
}
