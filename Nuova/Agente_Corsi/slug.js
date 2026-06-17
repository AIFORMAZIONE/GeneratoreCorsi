/**
 * Slug usato per nomi di file/cartelle a partire dal titolo di un corso.
 * Condiviso tra agent.js e tools.js per mantenere coerente la cartella
 * di output di ogni corso dentro "Corsi Generati/<slug>/".
 */
export function slugCorso(titolo) {
  return titolo
    .replace(/[^a-z0-9àèìòù]/gi, "_")
    .replace(/_+/g, "_")
    .toLowerCase();
}
