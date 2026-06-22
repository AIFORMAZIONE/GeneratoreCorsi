/**
 * Orchestratore — [Owner: A]
 * Coordina la pipeline: Struttura → Generazione → (Copione ∥ Quiz) → Presentazione.
 * Genera le lezioni a gruppi di 3 in parallelo; logga costi/token.
 * NB: importa gli agenti da ./agenti/* e le integrazioni da ./integrazioni/*.
 */
// import { generaLezione } from "./agenti/agente_generazione.js";
// import { generaQuiz } from "./agenti/agente_quiz.js";
// import { generaCopione } from "./agenti/agente_copione.js";

export async function eseguiPipeline(struttura, opzioni = {}) {
  throw new Error("TODO[A]: implementare orchestratore pipeline");
}
