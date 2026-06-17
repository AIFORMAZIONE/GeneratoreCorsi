-- Fix 3 titoli errati pre-esistenti in articoli_dlgs (titolo_articolo). Fonte: D.Lgs. 81/08 (PDF/B&G).
UPDATE articoli_dlgs SET titolo_articolo=$T$Comitato per l'indirizzo e la valutazione delle politiche attive e per il coordinamento nazionale delle attività di vigilanza in materia di salute e sicurezza sul lavoro$T$ WHERE numero_articolo=5;
UPDATE articoli_dlgs SET titolo_articolo=$T$Commissione consultiva permanente per la salute e sicurezza sul lavoro$T$ WHERE numero_articolo=6;
UPDATE articoli_dlgs SET titolo_articolo=$T$Sanzioni concernenti il divieto di assunzione in luoghi esposti$T$ WHERE numero_articolo=286;
