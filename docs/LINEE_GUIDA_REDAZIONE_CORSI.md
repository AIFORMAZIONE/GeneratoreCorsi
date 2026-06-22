# Linee guida per la redazione dei corsi — AIFormazione

> Documento operativo per l'agente che genera i contenuti dei corsi (testo `corso.docx`).
> Nasce dalla **revisione delle docenti** sul Modulo 1 del Corso Datore di Lavoro (giugno 2026):
> nel file revisionato il **rosso** segnala il testo da correggere, il **verde** la versione corretta.
> Le regole qui sotto traducono quelle correzioni in istruzioni riutilizzabili per tutti i corsi.
> Va letto **insieme** a `GUIDA_GENERAZIONE_CORSI.md` (che resta valida per formato file, template e pipeline).

---

## 1. Principio di fondo: corso = manuale, non divulgazione

Il testo del corso deve leggersi come un **manuale di formazione professionale/giuridico**, non come un articolo divulgativo o una chiacchierata. Il lettore è un adulto (datore di lavoro, dirigente, ecc.) che deve poter usare il testo come riferimento.

Conseguenze pratiche: registro formale, frasi complete, terminologia giuridica corretta, contenuto **esauriente** sul piano normativo.

---

## 2. Registro e tono (regola critica)

- **Impersonale e formale.** Vietato il "tu" e il "Lei", vietate le domande retoriche nel corpo del testo, vietato il tono colloquiale.
- Costruzioni preferite: "Il datore di lavoro è tenuto a…", "La norma prevede che…", "Tale disposizione stabilisce…".

**NO (rosso)** → **SÌ (verde)** — esempi reali dalla revisione:

| NO (da evitare) | SÌ (stile richiesto) |
|---|---|
| "…è il punto di partenza obbligato per chiunque ricopra il ruolo di datore di lavoro." | "…rappresenta il quadro normativo di riferimento per l'adempimento degli obblighi in materia di prevenzione e sicurezza." |
| "Comprendere questa nozione è essenziale, perché determina a chi si estendono gli obblighi: anche un apprendista…" | "La corretta comprensione della nozione di lavoratore assume un'importanza centrale, poiché da essa discende l'applicazione di tutti gli obblighi previsti dal D.lgs. 81/2008…" |
| Frasi sintetiche e discorsive (3-4 righe per concetto) | Trattazione distesa e articolata (paragrafi ampi, sotto-punti dove serve) |

---

## 3. Profondità e ampiezza dei contenuti

Ogni argomento va **sviluppato in profondità**, non riassunto. Dove un istituto ha più requisiti o profili, **articolarlo in sotto-punti** con spiegazione di ciascuno.

Esempio di riferimento (dalla revisione): l'**art. 16 — delega di funzioni** non va trattato in un paragrafo, ma sviluppato come:
- premessa sullo strumento e la sua funzione organizzativa;
- requisiti distinti: **a)** atto scritto con data certa, **b)** professionalità ed esperienza del delegato, **c)** attribuzione dei poteri, **d)** autonomia di spesa, **e)** accettazione scritta;
- per ciascun requisito: cosa prevede la norma, perché, conseguenze pratiche;
- profili ulteriori: pubblicità della delega, obbligo di vigilanza residuo, modello art. 30, subdelega (comma 3-bis), nozione di **"delega apparente"**, richiami alla giurisprudenza;
- esempio pratico risolto + conclusione di sintesi.

Stessa logica per tutti gli istituti rilevanti (art. 17, 18, 19, 25, 28, 29, 30, ecc.).

---

## 4. Esempi pratici = casi SVOLTI, non domande

Questa è una delle correzioni più ricorrenti (rosso su quasi tutti i "caso pratico").

- **NO:** formulare l'esempio come una domanda aperta al lettore ("…quale soluzione dovrebbe considerare per prima, e perché?").
- **SÌ:** presentare uno scenario concreto **e poi svolgerlo**, spiegando la soluzione corretta e la motivazione normativa.

**Esempio NO (rosso):**
> "Un datore di lavoro deve ridurre il rischio di esposizione a polveri… Applicando la gerarchia dell'Art. 15, quale soluzione dovrebbe considerare per prima, e perché le mascherine intervengono solo dopo?"

**Esempio SÌ (verde):**
> "…la soluzione da privilegiare è l'installazione di un impianto di aspirazione, poiché consente di intervenire direttamente alla fonte del rischio… Le mascherine rappresentano invece un DPI e devono essere considerate una misura complementare… In questo modo viene rispettato il principio di dare priorità alle misure di protezione collettiva rispetto a quelle individuali."

Gli esempi possono essere etichettati (es. "Esempio 1", "Caso A / Caso B") e contenere il dettaglio operativo (cosa fa il datore di lavoro, quali misure adotta, quali conseguenze).

---

## 5. Domanda di riflessione: si mantiene

A differenza dell'esempio pratico, la **domanda di riflessione finale** va **conservata** (nel testo revisionato è rimasta). Serve all'autovalutazione del discente. Resta quindi l'unico elemento in forma interrogativa, collocato dopo il caso svolto e prima del riepilogo.

---

## 6. Citazioni normative

- Forma estesa e coerente: **"D.lgs. 81/2008"**, **"art. 16 del D.lgs. 81/2008"**, **"art. 2087 del Codice civile"**.
- Citare i commi quando rilevanti (es. "art. 26, comma 5").
- Quando si introduce un istituto, indicare sempre l'articolo di riferimento.

---

## 7. Uso delle fonti: DB + integrazioni giuridiche ammesse

Il vincolo "usare **solo** il materiale del DB" è stato **allentato dalle docenti**: nel testo corretto hanno aggiunto riferimenti giuridici standard non presenti nei chunk del DB. Quindi:

- **Base:** il materiale del DB (tabelle `argomenti` e `articoli_dlgs`) resta la fonte primaria e va usato.
- **Integrazioni ammesse:** nozioni e riferimenti giuridici consolidati necessari alla completezza, anche se non nel DB. Esempi effettivamente aggiunti dalle docenti:
  - **art. 2043 c.c.** (principio del *neminem laedere*) nella responsabilità civile;
  - il principio della **"delega apparente"** e richiami alla **giurisprudenza**;
  - dettagli su formazione/aggiornamento RLS (32 ore iniziali; aggiornamento 4 ore/anno fino a 50 lavoratori, 8 ore/anno oltre 50).
- **Limite:** le integrazioni devono essere accurate e consolidate (norme, principi, giurisprudenza pacifica), non opinioni o dati inventati. In caso di dubbio su un dato puntuale, preferire formulazioni prudenti.

---

## 8. Cosa NON anticipare

- **RSPP:** in Modulo 1 non approfondire ruoli e responsabilità dell'RSPP; rinviare esplicitamente ("I ruoli e le responsabilità del RSPP verranno affrontati nel Modulo 2."). In generale, evitare di anticipare contenuti assegnati a moduli successivi: usare rinvii ("come si vedrà nella prossima lezione / nel modulo X").

---

## 9. Lunghezza target

I testi sintetici della prima stesura sono risultati **troppo brevi**. Indicazione:
- ogni lezione del `corso.docx` va sviluppata in modo **disteso e completo** (indicativamente diverse migliaia di parole per le lezioni su istituti complessi come delega, art. 18, responsabilità);
- meglio abbondare in completezza e chiarezza che restare schematici;
- mantenere comunque la struttura della lezione (vedi §10), senza trasformarla in un muro di testo indistinto: usare sotto-titoli e sotto-punti.

---

## 10. Struttura della lezione (campi)

Confermata la struttura del template (`GUIDA_GENERAZIONE_CORSI.md` §3 e §6), con queste precisazioni di stile:

1. **Introduzione** — formale, inquadra l'istituto e il suo ruolo nel sistema.
2. **In questa lezione apprenderai** — 3-4 obiettivi.
3. **Pillola informativa** — sintesi normativa di una frase.
4. **Sezioni di approfondimento** — titolate con l'argomento reale; qui va la trattazione distesa e articolata in sotto-punti.
5. **Esempio pratico** — caso **svolto** con soluzione (vedi §4).
6. **Domanda di riflessione** — mantenuta (vedi §5).
7. **Riepilogo** — paragrafo discorsivo formale.

---

## 11. Struttura del corso "Datore di Lavoro 16h" rivista

La revisione ha modificato l'impianto del corso:

- **Aggiunta** una lezione dedicata: **"Il Lavoratore (Artt. 2, 20)"** — obblighi (art. 20), diritti e ruolo attivo del lavoratore nel sistema di prevenzione. Inserita nel Modulo 1.
- Di conseguenza il **Modulo 1 passa da 12 a 13 lezioni** e il corso passa a **49 lezioni totali**, con rinumerazione:
  - **Modulo 1** (Quadro normativo e figure): lezioni 1-13
  - **Modulo 2** (Valutazione rischi e organizzazione): lezioni 14-25
  - **Modulo 3** (Gruppi a rischio, SLC e gestione): lezioni 26-37
  - **Modulo 4** (Strumenti gestionali, comunicazione e rischi specifici): lezioni 38-49

> Nota: la numerazione delle lezioni dei moduli 2-4 va quindi traslata in avanti rispetto alla prima stesura (che era a 48 lezioni). Allineare `struttura_corso.json` e la riga `corsi_generati` quando si rigenera.

---

## 12. Checklist rapida prima di considerare una lezione "pronta"

- [ ] Registro impersonale e formale (niente "tu/Lei", niente domande nel corpo)
- [ ] Istituti sviluppati in profondità, con sotto-punti dove servono
- [ ] Citazioni normative per esteso e con i commi rilevanti
- [ ] Esempio pratico **risolto** (non una domanda)
- [ ] Domanda di riflessione presente, alla fine
- [ ] Nessuna anticipazione di contenuti di altri moduli (RSPP → Modulo 2)
- [ ] Integrazioni giuridiche accurate dove migliorano la completezza
- [ ] Lunghezza adeguata: completo, non schematico
- [ ] Riepilogo discorsivo finale

---

### Riferimenti
- Revisione di partenza: `Corsi Generati/Corso_Datore_Lavoro_16h_2026/Corso modficicato/Modifica Modulo 1 Datore di lavoro.docx`
- Strumento per rileggere le evidenziazioni di una revisione: `Nuova/Agente_Corsi/_estrai_highlight.mjs` (estrae il testo per colore: rosso = da correggere, verde = corretto)
- Formato file / template / pipeline: `docs/GUIDA_GENERAZIONE_CORSI.md`
