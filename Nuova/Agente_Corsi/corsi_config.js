/**
 * Configurazione normativa dei corsi di formazione sulla sicurezza sul lavoro.
 * Fonte: Accordo Stato-Regioni 2025 (Allegato A) + D.Lgs. 81/08 + DM 2/9/2021 + DM 388/2003.
 *
 * Struttura per corso:
 *   id                   → identificativo univoco usato come chiave
 *   titolo               → nome ufficiale del corso
 *   destinatari          → figura professionale target
 *   riferimento          → norma di riferimento
 *   ore_totali           → durata minima complessiva (ore)
 *   durata_lezione_min   → durata target per ogni lezione e-learning (minuti)
 *   lezioni_suggerite    → n. lezioni = ore_totali × 60 / durata_lezione_min
 *   moduli               → array di moduli con nome, ore, argomenti, e-learning consentito
 *   struttura_suggerita  → elenco completo delle lezioni con modulo, titolo e focus
 *   elearning            → se il corso (o parte) è erogabile in e-learning
 *   aggiornamento        → cadenza e durata dell'aggiornamento obbligatorio
 *   prerequisiti         → corsi da aver completato prima
 *   note                 → vincoli o specifiche particolari
 *
 * FORMULA LEZIONI:
 *   ore × 4 = lezioni da 15 min  |  ore × 3 = lezioni da 20 min
 *   Ogni lezione include: testo ~500-800 parole + copione avatar ~2500-3000 parole (10-15 min a 300 p/min)
 */

export const CORSI_CONFIG = {

  // ─────────────────────────────────────────────────────────────────────────────
  // LAVORATORI
  // ─────────────────────────────────────────────────────────────────────────────

  formazione_lavoratori_basso: {
    id: "formazione_lavoratori_basso",
    titolo: "Formazione Lavoratori — Rischio Basso",
    destinatari: "Lavoratori dipendenti in aziende a rischio basso (ATECO allegato IV)",
    riferimento: "Art. 37 D.Lgs. 81/08 — Accordo SR 2025 punto 2.1",
    ore_totali: 8,
    elearning: true,
    moduli: [
      {
        nome: "Formazione Generale",
        ore: 4,
        elearning: true,
        note: "Credito formativo permanente: non va ripetuta se già frequentata",
        argomenti: [
          "Concetti di pericolo, rischio e danno",
          "Prevenzione e protezione",
          "Organizzazione della prevenzione aziendale e sistema partecipazione lavoratori (D.Lgs. 81/08)",
          "Diritti, doveri e sanzioni per i vari soggetti aziendali",
          "Organi di vigilanza, controllo e assistenza (ASL, INL, VVF, INAIL)",
        ],
      },
      {
        nome: "Formazione Specifica — Rischio Basso",
        ore: 4,
        elearning: true,
        note: "Consentita in e-learning per rischio basso; per lavoratori esposti a rischio medio/alto non consentita",
        argomenti: [
          "Rischi infortunistici: meccanici, elettrici, macchine, attrezzature, cadute dall'alto",
          "Rischi chimici, biologici, fisici (rumore, vibrazioni, microclima, illuminazione)",
          "Videoterminali e movimentazione manuale carichi",
          "DPI: scelta, uso, manutenzione",
          "Ambienti di lavoro e segnaletica di sicurezza",
          "Stress lavoro-correlato e fattori psicosociali",
          "Emergenze: procedure esodo, incendio, primo soccorso",
          "Incidenti e infortuni mancati (near miss)",
        ],
      },
    ],
    aggiornamento: {
      cadenza_anni: 5,
      ore: 6,
      elearning: true,
      note: "Anche quando cambiano mansioni, attrezzature o sostanze pericolose",
    },
    prerequisiti: [],
    quiz: {
      n_domande_corso: 30,
      n_domande_aggiornamento: 10,
      soglia_superamento: 70,
      note: "Test a risposta multipla (≥3 opzioni), somministrabile in e-learning",
    },
    durata_lezione_min: 15,
    lezioni_suggerite: 32, // 8h × 4 lezioni/ora (15 min cad.)
    note: "32 lezioni da ~15 min: 16 per la parte generale + 16 per la specifica.",
  },

  formazione_lavoratori_medio: {
    id: "formazione_lavoratori_medio",
    titolo: "Formazione Lavoratori — Rischio Medio",
    destinatari: "Lavoratori dipendenti in aziende a rischio medio (ATECO allegato IV)",
    riferimento: "Art. 37 D.Lgs. 81/08 — Accordo SR 2025 punto 2.1",
    ore_totali: 12,
    elearning: "parziale",
    moduli: [
      {
        nome: "Formazione Generale",
        ore: 4,
        elearning: true,
        note: "Credito formativo permanente",
        argomenti: [
          "Concetti di pericolo, rischio e danno",
          "Prevenzione e protezione",
          "Organizzazione prevenzione aziendale",
          "Diritti, doveri e sanzioni",
          "Organi di vigilanza",
        ],
      },
      {
        nome: "Formazione Specifica — Rischio Medio",
        ore: 8,
        elearning: false,
        note: "Non consentita in e-learning per rischio medio (salvo progetti regionali specifici)",
        argomenti: [
          "Rischi specifici del settore (ATECO di riferimento)",
          "Rischi meccanici, elettrici, macchine, attrezzature",
          "Agenti chimici, biologici, fisici (rumore, vibrazioni, radiazioni, microclima)",
          "Movimentazione carichi, videoterminali",
          "DPI specifici del settore",
          "Ambienti di lavoro, segnaletica",
          "Stress lavoro-correlato, ergonomia",
          "Emergenze, incendio, primo soccorso",
        ],
      },
    ],
    aggiornamento: {
      cadenza_anni: 5,
      ore: 6,
      elearning: true,
    },
    prerequisiti: [],
    quiz: {
      n_domande_corso: 30,
      n_domande_aggiornamento: 10,
      soglia_superamento: 70,
    },
    durata_lezione_min: 15,
    lezioni_suggerite: 48, // 12h × 4 lezioni/ora
    note: "48 lezioni da ~15 min: 16 per la parte generale + 32 per la specifica.",
  },

  formazione_lavoratori_alto: {
    id: "formazione_lavoratori_alto",
    titolo: "Formazione Lavoratori — Rischio Alto",
    destinatari: "Lavoratori dipendenti in aziende a rischio alto (ATECO allegato IV)",
    riferimento: "Art. 37 D.Lgs. 81/08 — Accordo SR 2025 punto 2.1",
    ore_totali: 16,
    elearning: "parziale",
    moduli: [
      {
        nome: "Formazione Generale",
        ore: 4,
        elearning: true,
        note: "Credito formativo permanente",
        argomenti: [
          "Concetti di pericolo, rischio e danno",
          "Prevenzione e protezione",
          "Organizzazione prevenzione aziendale",
          "Diritti, doveri e sanzioni",
          "Organi di vigilanza",
        ],
      },
      {
        nome: "Formazione Specifica — Rischio Alto",
        ore: 12,
        elearning: false,
        argomenti: [
          "Analisi infortuni e malattie professionali del settore",
          "Rischi meccanici, elettrici, macchine, attrezzature, cadute dall'alto",
          "Agenti chimici, cancerogeni, mutageni, amianto",
          "Agenti biologici",
          "Agenti fisici: rumore, vibrazioni, radiazioni, CEM, microclima",
          "Ambienti confinati e sospetti di inquinamento",
          "Movimentazione carichi, ergonomia, VDT",
          "DPI specifici del settore ad alto rischio",
          "Gestione emergenze, incendio, primo soccorso avanzato",
          "Stress lavoro-correlato, rischi psicosociali",
          "Segnaletica, procedure di sicurezza specifiche",
          "Casi pratici e infortuni mancati",
        ],
      },
    ],
    aggiornamento: {
      cadenza_anni: 5,
      ore: 6,
      elearning: true,
    },
    prerequisiti: [],
    quiz: {
      n_domande_corso: 30,
      n_domande_aggiornamento: 10,
      soglia_superamento: 70,
    },
    durata_lezione_min: 15,
    lezioni_suggerite: 64, // 16h × 4 lezioni/ora
    note: "64 lezioni da ~15 min: 16 per la parte generale + 48 per la specifica.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // PREPOSTI
  // ─────────────────────────────────────────────────────────────────────────────

  formazione_preposti: {
    id: "formazione_preposti",
    titolo: "Formazione Preposti",
    destinatari: "Preposti (capi reparto, caposquadra, responsabili di turno, ecc.)",
    riferimento: "Art. 19 D.Lgs. 81/08 — Accordo SR 2025 punto 2.2 — valido anche ex Art. 97 c.3-ter",
    ore_totali: 12,
    elearning: false,
    moduli: [
      {
        nome: "Giuridico Normativo",
        ore: 3,
        elearning: false,
        argomenti: [
          "Individuazione del preposto e preposto di fatto",
          "Compiti e obblighi del preposto (Art. 19 D.Lgs. 81/08)",
          "Relazioni con le altre figure della prevenzione aziendale",
          "Responsabilità penale e civile del preposto",
          "Delega di funzioni — condizioni e limiti (Art. 16)",
        ],
      },
      {
        nome: "Gestione e Organizzazione della Sicurezza",
        ore: 3,
        elearning: false,
        argomenti: [
          "Sovraintendenza e vigilanza sull'osservanza delle misure di sicurezza",
          "Interruzione dell'attività in caso di pericolo grave e immediato",
          "Informazione e segnalazione al datore di lavoro",
          "Obblighi connessi ai contratti di appalto e subappalto",
          "Comunicazione con datore di lavoro, dirigenti e SPP",
        ],
      },
      {
        nome: "Valutazione dei Rischi e Controllo",
        ore: 4,
        elearning: false,
        argomenti: [
          "Misure di prevenzione e protezione adottate in azienda (DVR)",
          "Rischi specifici del contesto operativo del preposto",
          "Gestione dei contratti d'opera, somministrazione e subappalti",
          "Modalità operative e di intervento del preposto",
          "Infortuni mancati: importanza della segnalazione",
        ],
      },
      {
        nome: "Comunicazione e Informazione",
        ore: 2,
        elearning: false,
        argomenti: [
          "Tecniche di comunicazione con i lavoratori (neoassunti, somministrati, stranieri)",
          "Strumenti di sensibilizzazione dei lavoratori alla sicurezza",
          "Gestione dei gruppi di lavoro e dei conflitti",
        ],
      },
    ],
    aggiornamento: {
      cadenza_anni: 2,
      ore: 6,
      elearning: false,
      note: "Ogni qualvolta vi siano evoluzioni dei rischi o nuovi rischi; al cambio di reparto o processo produttivo",
    },
    prerequisiti: ["formazione_lavoratori_basso", "formazione_lavoratori_medio", "formazione_lavoratori_alto"],
    quiz: {
      n_domande_corso: 30,
      n_domande_aggiornamento: 10,
      soglia_superamento: 70,
      modalita: "Colloquio o test",
    },
    durata_lezione_min: 15,
    lezioni_suggerite: 48, // 12h × 4 lezioni/ora
    note: "48 lezioni da ~15 min. E-learning NON consentito né per corso né per aggiornamento.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // DIRIGENTI
  // ─────────────────────────────────────────────────────────────────────────────

  formazione_dirigenti: {
    id: "formazione_dirigenti",
    titolo: "Formazione Dirigenti",
    destinatari: "Dirigenti con delega in materia di sicurezza (Art. 18 D.Lgs. 81/08)",
    riferimento: "Art. 18 D.Lgs. 81/08 — Accordo SR 2025 punto 2.3 — valido anche ex Art. 97 c.3-ter + modulo cantieri",
    ore_totali: 12,
    elearning: true,
    moduli: [
      {
        nome: "Giuridico Normativo",
        ore: 4,
        elearning: true,
        argomenti: [
          "Sistema legislativo in materia di SSL: D.Lgs. 81/08 e normativa UE",
          "Soggetti del sistema di prevenzione aziendale: compiti, obblighi, responsabilità",
          "Delega di funzioni: condizioni e limiti (Art. 16)",
          "Responsabilità civile e penale del dirigente",
          "Responsabilità amministrativa D.Lgs. 231/01",
          "Prevenzione violenza e molestie sul lavoro (ILO C190)",
          "Inserimento lavoratori disabili",
          "Organi di vigilanza: ASL, INL, VVF, INAIL — procedure ispettive",
        ],
      },
      {
        nome: "Gestione e Organizzazione della Sicurezza",
        ore: 4,
        elearning: true,
        argomenti: [
          "Organizzazione e gestione dei processi di SSL",
          "Modelli di organizzazione e gestione (Art. 30 D.Lgs. 81/08 — D.Lgs. 231/01)",
          "Sistemi di gestione SSL: ISO 45001, Linee guida UNI INAIL",
          "Valutazione dei rischi e DVR: metodologia, contenuti, aggiornamento",
          "Gestione del rischio interferenziale e DUVRI (Art. 26)",
          "Organizzazione emergenze, primo soccorso, appalti, riunioni periodiche",
          "Sorveglianza sanitaria e medico competente",
          "Costi della mancata sicurezza e benefici della sicurezza",
        ],
      },
      {
        nome: "Compiti Specifici del Dirigente",
        ore: 2,
        elearning: true,
        argomenti: [
          "Misure tecniche, organizzative e procedurali di prevenzione nel contesto del dirigente",
          "Obblighi connessi ai contratti di appalto e DUVRI",
          "Organizzazione della prevenzione incendi e delle emergenze",
          "Formazione, informazione e consultazione dei lavoratori (Art. 37)",
          "Gestione dei gruppi di lavoro e dei conflitti",
          "Consultazione e partecipazione dei rappresentanti dei lavoratori (RLS)",
        ],
      },
      {
        nome: "Comunicazione e Formazione",
        ore: 2,
        elearning: true,
        argomenti: [
          "Tecniche e strumenti di comunicazione e informazione",
          "Obblighi formativi per i diversi soggetti aziendali",
          "Gestione dei gruppi di lavoro",
          "Consultazione e partecipazione dei RLS",
        ],
      },
    ],
    modulo_aggiuntivo_cantieri: {
      nome: "Modulo Aggiuntivo Cantieri",
      ore: 6,
      elearning: true,
      note: "Obbligatorio per dirigenti che operano in cantieri temporanei e mobili (Art. 97 c.3-ter)",
      argomenti: [
        "Organizzazione del cantiere e rapporti tra i soggetti",
        "PSC (Piano Sicurezza e Coordinamento) e POS (Piano Operativo Sicurezza): contenuti",
        "Verifica condizioni di sicurezza dei lavori affidati",
        "Applicazione disposizioni e prescrizioni del PSC",
        "Coordinamento interventi Art. 95-96 D.Lgs. 81/08",
        "Cronoprogramma dei lavori",
      ],
    },
    aggiornamento: {
      cadenza_anni: 5,
      ore: 6,
      elearning: true,
    },
    prerequisiti: [],
    quiz: {
      n_domande_corso: 30,
      n_domande_aggiornamento: 10,
      soglia_superamento: 70,
      modalita: "Colloquio o test",
    },
    durata_lezione_min: 15,
    lezioni_suggerite: 48, // 12h × 4 lezioni/ora
    note: "48 lezioni da ~15 min. E-learning consentito.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // DATORE DI LAVORO
  // ─────────────────────────────────────────────────────────────────────────────

  formazione_datore_lavoro: {
    id: "formazione_datore_lavoro",
    titolo: "Formazione Datore di Lavoro (16h)",
    destinatari: "Datori di lavoro (Art. 18 D.Lgs. 81/08)",
    riferimento: "Accordo SR 2025 punto 3 — valido anche ex Art. 97 c.3-ter + modulo cantieri",
    ore_totali: 16,
    elearning: true,
    moduli: [
      {
        nome: "Giuridico Normativo",
        ore: 5,
        elearning: true,
        argomenti: [
          "Soggetti del sistema di prevenzione aziendale: compiti, obblighi, responsabilità (D.Lgs. 81/08)",
          "La delega di funzioni: condizioni e limiti (Art. 16)",
          "Responsabilità civile e penale del datore di lavoro",
          "Responsabilità amministrativa D.Lgs. 231/01 (nel settore privato)",
          "Prevenzione violenza e molestie sul lavoro (ILO C190 — Art. 26 D.Lgs. 198/2006)",
          "Inserimento lavoratori disabili (D.Lgs. 213/2003, DL 76/2013)",
          "Organi di vigilanza: ASL, INL, VVF, INAIL — procedure ispettive",
          "Sanzioni per il datore di lavoro (Art. 55-61 D.Lgs. 81/08)",
        ],
      },
      {
        nome: "Organizzazione e Gestione della SSL",
        ore: 8,
        elearning: true,
        argomenti: [
          "Misure organizzative e gestionali di tutela (Art. 15 e Art. 30 D.Lgs. 81/08)",
          "Standard tecnico-strutturali: attrezzature, impianti, luoghi di lavoro, agenti chimici/fisici/biologici",
          "Valutazione dei rischi (Art. 28-29): oggetto, metodologia, DVR — contenuti e aggiornamento",
          "Rischi particolari: stress lavoro-correlato, gravidanza, differenze di genere/età",
          "Gestione del rischio interferenziale: DUVRI (Art. 26)",
          "Organizzazione emergenze, primo soccorso, appalti, riunioni periodiche (Art. 35)",
          "Sorveglianza sanitaria e medico competente (Art. 25, 38-41)",
          "Informazione, formazione, addestramento (Art. 37 — Accordo SR 2025)",
          "Vigilanza e verifica periodica dell'applicazione delle procedure",
          "Modelli di organizzazione volontaria: SGSL, ISO 45001, MOG 231/01 (Art. 30)",
          "Costi della mancata sicurezza e benefici della sicurezza",
          "Sistema di Prevenzione e Protezione: RSPP, ASPP (Art. 31-34)",
        ],
      },
      {
        nome: "Comunicazione e Strumenti",
        ore: 3,
        elearning: true,
        argomenti: [
          "Tecniche e strumenti di comunicazione e informazione in azienda",
          "Riunione periodica di sicurezza (Art. 35): gestione e contenuti",
          "Consultazione e partecipazione RLS (Art. 47-52)",
          "Near miss e cultura della sicurezza",
          "Casi pratici e responsabilità del datore di lavoro RSPP",
        ],
      },
    ],
    modulo_aggiuntivo_cantieri: {
      nome: "Modulo Aggiuntivo Cantieri",
      ore: 6,
      elearning: true,
      note: "Obbligatorio per datori di lavoro dell'impresa affidataria (Art. 97 c.3-ter)",
      argomenti: [
        "Soggetti definiti dal Titolo IV Capo I: obblighi e responsabilità",
        "Organizzazione del cantiere e rapporti tra soggetti",
        "PSC e POS: finalità, tempi, contenuti",
        "Misure generali di tutela (Art. 95 D.Lgs. 81/08)",
        "Obblighi Art. 96 (datore di lavoro, dirigenti, preposti nei cantieri)",
        "Cronoprogramma dei lavori",
        "Analisi ed esempi PSC e POS",
      ],
    },
    aggiornamento: {
      cadenza_anni: 5,
      ore: 6,
      elearning: true,
      note: "Include tematiche del modulo cantieri se il datore lo ha frequentato",
    },
    prerequisiti: [],
    quiz: {
      n_domande_corso: 30,
      n_domande_aggiornamento: 10,
      soglia_superamento: 70,
      modalita: "Colloquio o test",
    },
    durata_lezione_min: 15,
    lezioni_suggerite: 64, // 16h × 4 lezioni/ora (15 min cad.)
    struttura_suggerita: [
      // ── MODULO 1 — Il sistema normativo e le responsabilità (4h = 16 lezioni) ──
      { modulo: 1, n: 1,  titolo: "Benvenuto e presentazione del corso", focus: "Obiettivi formativi, struttura, modalità di verifica" },
      { modulo: 1, n: 2,  titolo: "Il D.Lgs. 81/08: storia, struttura e principi", focus: "Evoluzione normativa, testo unico, principi di prevenzione" },
      { modulo: 1, n: 3,  titolo: "Le figure della prevenzione: panoramica del sistema", focus: "Datore, dirigente, preposto, RSPP, MC, RLS, lavoratori — ruoli e relazioni" },
      { modulo: 1, n: 4,  titolo: "Il datore di lavoro: chi è e cosa deve fare", focus: "Definizione Art. 2, Art. 17 — obblighi non delegabili (DVR e RSPP)" },
      { modulo: 1, n: 5,  titolo: "Gli obblighi del datore di lavoro — parte 1", focus: "Art. 18 c.1 lett. a-g: nomina MC, formazione, DPI, sorveglianza" },
      { modulo: 1, n: 6,  titolo: "Gli obblighi del datore di lavoro — parte 2", focus: "Art. 18 c.1 lett. h-r: comunicazioni INAIL, riunione periodica, appalti" },
      { modulo: 1, n: 7,  titolo: "La delega di funzioni: requisiti e limiti", focus: "Art. 16: forma scritta, accettazione, poteri, DL 159/2025 lett. e)" },
      { modulo: 1, n: 8,  titolo: "Dirigenti e preposti: compiti e responsabilità", focus: "Art. 18-19: obblighi di vigilanza, interruzione attività, segnalazione" },
      { modulo: 1, n: 9,  titolo: "Responsabilità penale del datore di lavoro", focus: "Colpa, causalità, posizione di garanzia, casistica giurisprudenziale" },
      { modulo: 1, n: 10, titolo: "D.Lgs. 231/01: la responsabilità amministrativa dell'ente", focus: "Reati presupposto SSL, MOG esimente, Organismo di Vigilanza" },
      { modulo: 1, n: 11, titolo: "Violenza e molestie sul lavoro", focus: "ILO C190, Art. 26 D.Lgs. 198/2006, codice di condotta, procedure interne" },
      { modulo: 1, n: 12, titolo: "Inserimento lavoratori disabili e accomodamenti ragionevoli", focus: "L. 68/99, D.Lgs. 213/2003, idoneità mansione, DL 76/2013 art. 9" },
      { modulo: 1, n: 13, titolo: "Organi di vigilanza: ASL, INL, VVF, INAIL", focus: "Ruoli, competenze, coordinamento, procedure ispettive" },
      { modulo: 1, n: 14, titolo: "Come gestire un'ispezione: diritti e obblighi", focus: "Procedura ispettiva, prescrizione, sospensione attività, ricorsi" },
      { modulo: 1, n: 15, titolo: "Le sanzioni per il datore di lavoro (Art. 55-61)", focus: "Sanzioni penali, amministrative, decurtazione crediti patente" },
      { modulo: 1, n: 16, titolo: "Quiz di fine modulo 1", focus: "Verifica intermedia — 10 domande, soglia 70%" },

      // ── MODULO 2 — Valutazione dei rischi e DVR (4h = 16 lezioni) ──
      { modulo: 2, n: 17, titolo: "Cos'è la valutazione dei rischi", focus: "Art. 28: oggetto, criteri generali, tutti i rischi compresi interferenziali" },
      { modulo: 2, n: 18, titolo: "Metodologia di valutazione: criteri e strumenti", focus: "Art. 29: probabilità × danno, procedure semplificate PMI, criteri INAIL" },
      { modulo: 2, n: 19, titolo: "Il DVR: contenuti obbligatori", focus: "Art. 28 c.2: relazione, misure, programma, nominativi figure" },
      { modulo: 2, n: 20, titolo: "Il DVR: redazione, firme e conservazione", focus: "Art. 53-54, data certa, accesso RLS, documentazione tecnico-amministrativa" },
      { modulo: 2, n: 21, titolo: "Aggiornamento del DVR: quando e come", focus: "Art. 29 c.3: variazioni organizzative, infortuni, evoluzione tecnologica" },
      { modulo: 2, n: 22, titolo: "Rischi fisici: rumore e vibrazioni", focus: "Titolo VIII D.Lgs. 81/08, valori limite, misure tecniche e organizzative" },
      { modulo: 2, n: 23, titolo: "Rischi fisici: microclima, illuminazione, CEM", focus: "Benessere termico, requisiti minimi luoghi di lavoro, esposizione CEM" },
      { modulo: 2, n: 24, titolo: "Rischi chimici: classificazione, SDS e misure", focus: "Titolo IX D.Lgs. 81/08, CLP/GHS, valutazione agenti chimici pericolosi" },
      { modulo: 2, n: 25, titolo: "Rischi biologici: classificazione e misure", focus: "Titolo X D.Lgs. 81/08, gruppi 1-4, misure di contenimento, sorveglianza" },
      { modulo: 2, n: 26, titolo: "Stress lavoro-correlato: metodologia e valutazione", focus: "Accordo europeo 8/10/2004, metodo INAIL, indicatori sentinella" },
      { modulo: 2, n: 27, titolo: "Rischi psicosociali: molestie, aggressioni, burnout", focus: "Riconoscimento, prevenzione, procedure di gestione, responsabilità datore" },
      { modulo: 2, n: 28, titolo: "VDT, movimentazione carichi e ergonomia", focus: "Titolo VI-VII D.Lgs. 81/08, NIOSH, OCRA, sorveglianza sanitaria VDT" },
      { modulo: 2, n: 29, titolo: "Tutele specifiche: gravidanza, genere, età, stranieri", focus: "D.Lgs. 151/2001, Art. 28 c.1, lavoratori sensibili, misure di protezione" },
      { modulo: 2, n: 30, titolo: "Appalti e DUVRI: obblighi del committente", focus: "Art. 26: verifica idoneità, DUVRI, costi sicurezza non soggetti a ribasso" },
      { modulo: 2, n: 31, titolo: "Qualificazione delle imprese: sistema crediti e patente", focus: "Art. 27: patente a crediti, congruità manodopera, requisiti imprese" },
      { modulo: 2, n: 32, titolo: "Quiz di fine modulo 2", focus: "Verifica intermedia — 10 domande, soglia 70%" },

      // ── MODULO 3 — Organizzazione della sicurezza (4h = 16 lezioni) ──
      { modulo: 3, n: 33, titolo: "Il Servizio di Prevenzione e Protezione", focus: "Art. 31: composizione, risorse, funzioni; SPP interno vs esterno" },
      { modulo: 3, n: 34, titolo: "RSPP: requisiti, nomina e compiti", focus: "Art. 32-33: titoli, esperienza, capacità professionali" },
      { modulo: 3, n: 35, titolo: "Il datore di lavoro come RSPP (Art. 34)", focus: "Condizioni di accesso, corso obbligatorio, limiti settoriali" },
      { modulo: 3, n: 36, titolo: "Il Medico Competente: quando è obbligatorio", focus: "Art. 25 c.1: obbligo di nomina, rapporto con il datore" },
      { modulo: 3, n: 37, titolo: "Titoli e svolgimento dell'attività del MC", focus: "Art. 38-39: requisiti, incompatibilità, rapporto con SSN" },
      { modulo: 3, n: 38, titolo: "La sorveglianza sanitaria: visite e giudizi di idoneità", focus: "Art. 41: tipologie visita, giudizi, ricorsi, cartelle sanitarie" },
      { modulo: 3, n: 39, titolo: "Il RLS: nomina, poteri e diritti", focus: "Art. 47-50: elezione, numero RLS, diritti di accesso e consultazione" },
      { modulo: 3, n: 40, titolo: "Il RLS territoriale e di sito produttivo", focus: "Art. 48-49: RLST, RLSS — quando si applica, fondi bilaterali" },
      { modulo: 3, n: 41, titolo: "La riunione periodica di sicurezza", focus: "Art. 35: quando convocarla, ordine del giorno, verbale, partecipanti obbligatori" },
      { modulo: 3, n: 42, titolo: "Addetti emergenze: antincendio e primo soccorso", focus: "Art. 45-46, DM 388/2003, DM GSA 2021: nomina, formazione, numero minimo" },
      { modulo: 3, n: 43, titolo: "Il piano di emergenza e di evacuazione", focus: "Contenuti minimi, vie di esodo, figure di emergenza, esercitazioni annuali" },
      { modulo: 3, n: 44, titolo: "DPI: obblighi del datore, scelta e consegna", focus: "Art. 74-79: categorie DPI, criteri scelta, registro consegne, manutenzione" },
      { modulo: 3, n: 45, titolo: "Segnaletica di sicurezza: obblighi e tipologie", focus: "Titolo V D.Lgs. 81/08: segnali di divieto, obbligo, avvertimento, emergenza" },
      { modulo: 3, n: 46, titolo: "SGSL e ISO 45001: i sistemi di gestione volontari", focus: "Art. 30, ciclo PDCA, struttura ISO 45001, integrazione con ISO 9001/14001" },
      { modulo: 3, n: 47, titolo: "MOG 231/01 e l'efficacia esimente", focus: "Linee guida UNI INAIL, asseverazione, procedure semplificate PMI (DM 13/02/2014)" },
      { modulo: 3, n: 48, titolo: "Quiz di fine modulo 3", focus: "Verifica intermedia — 10 domande, soglia 70%" },

      // ── MODULO 4 — Formazione, comunicazione e casi pratici (4h = 16 lezioni) ──
      { modulo: 4, n: 49, titolo: "Formazione obbligatoria dei lavoratori", focus: "Art. 37, Accordo SR 2025: durata, contenuti, crediti formativi, e-learning" },
      { modulo: 4, n: 50, titolo: "Formazione di preposti, dirigenti e figure SSL", focus: "Accordo SR 2025: durata, moduli, aggiornamenti, prerequisiti di ciascuna figura" },
      { modulo: 4, n: 51, titolo: "Comunicazione efficace in materia di sicurezza", focus: "Tecniche di comunicazione, linguaggi visivi, comunicazione interculturale" },
      { modulo: 4, n: 52, titolo: "Near miss: definizione, importanza e gestione", focus: "Piramide di Bird, procedure di segnalazione, analisi causa radice" },
      { modulo: 4, n: 53, titolo: "La cultura della sicurezza in azienda", focus: "Modello di Reason, safety climate, leadership per la sicurezza, change management" },
      { modulo: 4, n: 54, titolo: "Costi della mancata sicurezza e benefici della prevenzione", focus: "Costi diretti/indiretti infortuni, ROI della prevenzione, dati INAIL" },
      { modulo: 4, n: 55, titolo: "Caso pratico 1 — PMI: DVR e ruolo del datore RSPP", focus: "Azienda 15 dip.: dalla valutazione rischi alla nomina figure SSL" },
      { modulo: 4, n: 56, titolo: "Caso pratico 2 — Appalto con interferenze: il DUVRI", focus: "Appalto pulizie + manutenzione: stesura DUVRI, coordinamento, responsabilità" },
      { modulo: 4, n: 57, titolo: "Caso pratico 3 — Infortunio sul lavoro: analisi e risposta", focus: "Infortunio con assenza: primo soccorso, denuncia INAIL, analisi causa" },
      { modulo: 4, n: 58, titolo: "Caso pratico 4 — Ispezione ASL/INL: come prepararsi", focus: "Checklist documentale, comportamento durante l'ispezione, prescrizioni e ricorsi" },
      { modulo: 4, n: 59, titolo: "Caso pratico 5 — Stress lavoro-correlato: valutazione e azioni", focus: "Applicazione metodo INAIL, indicatori, piano di azione, coinvolgimento RLS" },
      { modulo: 4, n: 60, titolo: "Caso pratico 6 — D.Lgs. 231: costruzione del MOG", focus: "Mappatura reati SSL, OdV, procedure operative, audit interno" },
      { modulo: 4, n: 61, titolo: "Lavoratori disabili e diversity nella SSL", focus: "Accomodamenti ragionevoli, piano emergenza inclusivo, accessibilità" },
      { modulo: 4, n: 62, titolo: "Riepilogo del corso: i punti chiave per il datore", focus: "Autovalutazione, check-list operativa post-corso, piano di miglioramento" },
      { modulo: 4, n: 63, titolo: "Preparazione alla verifica finale", focus: "Sintesi dei 4 moduli, domande tipo, strategie di risposta" },
      { modulo: 4, n: 64, titolo: "Verifica finale", focus: "Test 30 domande a risposta multipla (3 opzioni), soglia 70%, Accordo SR 2025" },
    ],
    note: "64 lezioni da ~15 min (video 10-15 min + testo 500-800 parole). 16 lezioni per modulo. E-learning consentito.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // DATORE DI LAVORO CHE SVOLGE I COMPITI DI RSPP (Art. 34)
  // ─────────────────────────────────────────────────────────────────────────────

  datore_rspp: {
    id: "datore_rspp",
    titolo: "Datore di Lavoro RSPP — Modulo Comune (Art. 34)",
    destinatari: "Datori di lavoro che svolgono direttamente i compiti di RSPP",
    riferimento: "Art. 34 D.Lgs. 81/08 — Accordo SR 2025 punto 4",
    ore_totali: 8,
    elearning: false,
    moduli: [
      {
        nome: "Il processo di valutazione: criteri e metodologie",
        ore: 3,
        elearning: false,
        argomenti: [
          "Criteri e strumenti per l'individuazione e valutazione dei rischi",
          "Struttura e contenuti del DVR",
          "Analisi degli infortuni mancati e modalità di accadimento",
          "Gestione della documentazione tecnico-amministrativa",
          "Procedure semplificate per la redazione del DVR (PMI)",
        ],
      },
      {
        nome: "Fattori di rischio e misure di prevenzione",
        ore: 4,
        elearning: false,
        argomenti: [
          "Luoghi di lavoro: requisiti e rischi",
          "Attrezzature di lavoro",
          "Movimentazione manuale dei carichi",
          "VDT (videoterminali)",
          "Agenti fisici: rumore, vibrazioni, microclima, CEM",
          "Sostanze pericolose e agenti chimici",
          "Agenti biologici",
          "Atmosfere esplosive (ATEX)",
          "Stress lavoro-correlato e fattori psicosociali",
          "Rischi collegati a genere, età, provenienza",
          "DPI e segnaletica di sicurezza",
        ],
      },
      {
        nome: "Esercitazione",
        ore: 1,
        elearning: false,
        argomenti: [
          "Predisposizione DVR per caso concreto (settore ATECO di riferimento)",
        ],
      },
    ],
    aggiornamento: {
      cadenza_anni: 5,
      ore: 8,
      elearning: true,
      note: "Include tematiche dei moduli specialistici se frequentati",
    },
    prerequisiti: ["formazione_datore_lavoro"],
    quiz: {
      n_domande_corso: 30,
      n_domande_aggiornamento: 10,
      soglia_superamento: 70,
      modalita: "Colloquio o test",
    },
    note: "E-learning NON consentito per il corso base. Moduli specialistici aggiuntivi per: Agricoltura (16h), Pesca (12h), Costruzioni (16h), Chimico-Petrolchimico (16h).",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // AGGIORNAMENTO RLS (fonte: Art. 37 c.11 D.Lgs. 81/08 — non nell'Accordo SR 2025)
  // ─────────────────────────────────────────────────────────────────────────────

  aggiornamento_rls: {
    id: "aggiornamento_rls",
    titolo: "Aggiornamento RLS (8h annuale)",
    destinatari: "Rappresentanti dei Lavoratori per la Sicurezza",
    riferimento: "Art. 37 comma 11 D.Lgs. 81/08 (NON nell'Accordo SR 2025 — disciplina separata)",
    ore_totali: 8,
    elearning: true,
    moduli: [
      {
        nome: "Normativa e aggiornamenti legislativi",
        ore: 2,
        elearning: true,
        argomenti: [
          "Novità normative in materia di SSL",
          "Ruolo e compiti del RLS (Art. 47-52 D.Lgs. 81/08)",
          "Diritti di accesso, consultazione e informazione del RLS",
          "Riunione periodica: contenuti, diritti del RLS, verbali",
        ],
      },
      {
        nome: "Valutazione dei rischi e DVR",
        ore: 2,
        elearning: true,
        argomenti: [
          "Partecipazione del RLS alla valutazione dei rischi",
          "DVR: lettura, analisi, proposte migliorative",
          "Rischi specifici aziendali: stress lavoro-correlato, infortuni mancati",
          "Sorveglianza sanitaria: ruolo del RLS",
        ],
      },
      {
        nome: "Rischi specifici e DPI",
        ore: 2,
        elearning: true,
        argomenti: [
          "Aggiornamenti tecnici su rischi specifici (fisici, chimici, biologici)",
          "DPI: scelta, adeguatezza, uso corretto",
          "Videoterminali, movimentazione carichi, microclima",
          "Segnaletica e comunicazione della sicurezza",
        ],
      },
      {
        nome: "Comunicazione e casi pratici",
        ore: 2,
        elearning: true,
        argomenti: [
          "Tecniche di segnalazione dei rischi e near miss",
          "Cultura della sicurezza in azienda",
          "Comunicazione efficace tra RLS e datore di lavoro",
          "Casi reali e analisi di situazioni di rischio",
        ],
      },
    ],
    aggiornamento: {
      cadenza_anni: 1,
      ore: 8,
      elearning: true,
      note: "Aggiornamento annuale obbligatorio (8h/anno per tutte le aziende)",
    },
    prerequisiti: [],
    quiz: {
      n_domande_corso: 30,
      n_domande_aggiornamento: 10,
      soglia_superamento: 70,
    },
    durata_lezione_min: 15,
    lezioni_suggerite: 32, // 8h × 4 lezioni/ora
    note: "32 lezioni da ~15 min. Corso iniziale RLS: 32h (128 lezioni). E-learning consentito. Non regolato dall'Accordo SR 2025.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // ADDETTI ANTINCENDIO (fonte: DM 2/9/2021 — non nell'Accordo SR 2025)
  // ─────────────────────────────────────────────────────────────────────────────

  antincendio_basso: {
    id: "antincendio_basso",
    titolo: "Addetti Antincendio — Rischio Basso (4h)",
    destinatari: "Addetti alla prevenzione incendi in aziende a rischio di incendio basso",
    riferimento: "DM 2/9/2021 (Decreto GSA) — Art. 46 D.Lgs. 81/08 (NON nell'Accordo SR 2025)",
    ore_totali: 4,
    elearning: "parziale",
    moduli: [
      {
        nome: "Teoria (2h)",
        ore: 2,
        elearning: true,
        argomenti: [
          "Il fuoco e la combustione: triangolo del fuoco, classi di incendio",
          "Sostanze estinguenti: acqua, CO2, polvere, schiuma",
          "Effetti dell'incendio sull'uomo: tossicità dei fumi, calore, visibilità",
          "Misure di prevenzione incendi: spazi e percorsi, segnaletica",
          "Procedure per la gestione dell'emergenza: piano di evacuazione",
          "Chiamata ai soccorsi e composizione del numero di emergenza",
        ],
      },
      {
        nome: "Pratica (2h)",
        ore: 2,
        elearning: false,
        note: "La parte pratica DEVE essere svolta in presenza",
        argomenti: [
          "Esercitazione pratica con estintore portatile su focolari tipo A e B",
          "Utilizzo dell'idrante (se presente in azienda)",
          "Simulazione evacuazione e uso dei percorsi di esodo",
        ],
      },
    ],
    aggiornamento: {
      cadenza_anni: 3,
      ore: 2,
      elearning: "parziale",
      note: "Aggiornamento ogni 3 anni (DM GSA). 1h teoria + 1h pratica.",
    },
    prerequisiti: [],
    quiz: {
      n_domande_corso: 15,
      soglia_superamento: 70,
    },
    note: "Parte teorica erogabile in e-learning; parte pratica obbligatoriamente in presenza.",
  },

  antincendio_medio: {
    id: "antincendio_medio",
    titolo: "Addetti Antincendio — Rischio Medio (8h)",
    destinatari: "Addetti alla prevenzione incendi in aziende a rischio di incendio medio",
    riferimento: "DM 2/9/2021 (Decreto GSA) — Art. 46 D.Lgs. 81/08",
    ore_totali: 8,
    elearning: "parziale",
    moduli: [
      {
        nome: "Teoria (4h)",
        ore: 4,
        elearning: true,
        argomenti: [
          "Il fuoco e la combustione (approfondito): triangolo, tetragono, classi di incendio A-F",
          "Comportamento al fuoco dei materiali e carichi d'incendio",
          "Sostanze estinguenti e mezzi di estinzione (estintori, idranti, impianti fissi)",
          "Effetti dell'incendio sull'uomo: tossicità fumi, IDLH, curve di risposta",
          "Misure di prevenzione incendi: compartimentazione, vie di esodo, porte REI",
          "Piano di emergenza: struttura, ruoli, procedure di evacuazione",
          "Impianti di rilevazione, segnalazione e allarme",
          "Chiamata ai soccorsi, coordinamento con VVF",
        ],
      },
      {
        nome: "Pratica (4h)",
        ore: 4,
        elearning: false,
        note: "Obbligatoriamente in presenza",
        argomenti: [
          "Esercitazione con estintori su focolari tipo A, B, C",
          "Utilizzo degli idranti",
          "Simulazione piano di emergenza e evacuazione guidata",
          "Utilizzo DPI antincendio (guanti, maschera)",
        ],
      },
    ],
    aggiornamento: {
      cadenza_anni: 3,
      ore: 5,
      elearning: "parziale",
    },
    prerequisiti: [],
    durata_lezione_min: 15,
    lezioni_suggerite: 16, // 4h × 4 lezioni/ora (solo parte teorica; la pratica è in presenza)
    note: "16 lezioni da ~15 min per la parte teorica; parte pratica (2h) in presenza obbligatoria.",
  },

  antincendio_alto: {
    id: "antincendio_alto",
    titolo: "Addetti Antincendio — Rischio Alto (16h)",
    destinatari: "Addetti alla prevenzione incendi in aziende a rischio di incendio elevato",
    riferimento: "DM 2/9/2021 (Decreto GSA) — Art. 46 D.Lgs. 81/08",
    ore_totali: 16,
    elearning: "parziale",
    moduli: [
      {
        nome: "Teoria (8h)",
        ore: 8,
        elearning: true,
        argomenti: [
          "Chimica e fisica della combustione avanzata",
          "Classificazione incendi e comportamento al fuoco dei materiali",
          "Sistemi di protezione attiva e passiva",
          "Impianti di rilevazione, allarme, estinzione automatica (sprinkler, gas, polvere)",
          "ATEX: atmosfere esplosive, zone ATEX, classificazione apparecchi",
          "Piano di emergenza e evacuazione: redazione, ruoli, procedure",
          "Coordinamento con VVF e servizi di soccorso",
          "Normativa vigente: DM 3/8/2015 (Codice Prevenzione Incendi), CPI",
        ],
      },
      {
        nome: "Pratica (8h)",
        ore: 8,
        elearning: false,
        note: "Obbligatoriamente in presenza presso struttura VVF o area attrezzata",
        argomenti: [
          "Esercitazioni con mezzi di estinzione portatili e carrellati",
          "Utilizzo degli impianti fissi di estinzione",
          "Utilizzo di autoprotettori e DPI ad alta protezione",
          "Simulazione di scenari di incendio complessi",
          "Esercitazione coordinamento evacuazione edificio",
        ],
      },
    ],
    aggiornamento: {
      cadenza_anni: 3,
      ore: 8,
      elearning: "parziale",
    },
    prerequisiti: [],
    durata_lezione_min: 15,
    lezioni_suggerite: 32, // 8h × 4 (teorica e-learning + pratica in presenza)
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // ADDETTI PRIMO SOCCORSO (fonte: DM 388/2003 — non nell'Accordo SR 2025)
  // ─────────────────────────────────────────────────────────────────────────────

  primo_soccorso_bc: {
    id: "primo_soccorso_bc",
    titolo: "Addetti al Primo Soccorso — Gruppi B e C (12h)",
    destinatari: "Addetti al primo soccorso aziendale in aziende dei gruppi B e C (DM 388/2003)",
    riferimento: "DM 388/2003 — Art. 45 D.Lgs. 81/08 (NON nell'Accordo SR 2025)",
    ore_totali: 12,
    elearning: "parziale",
    moduli: [
      {
        nome: "Modulo 1 — Allertare il sistema di soccorso (1h)",
        ore: 1,
        elearning: true,
        argomenti: [
          "Cause e circostanze degli infortuni sul lavoro",
          "Numero unico emergenza 112 e NUE",
          "Ruolo dell'addetto al primo soccorso aziendale",
          "Modulistica per l'infortunio (denuncia INAIL)",
        ],
      },
      {
        nome: "Modulo 2 — Riconoscere l'emergenza e intervenire (3h)",
        ore: 3,
        elearning: true,
        argomenti: [
          "Valutazione dello scenario e sicurezza del soccorritore",
          "Valutazione primaria (ABCDE): coscienza, respiro, circolo",
          "Posizione laterale di sicurezza (PLS)",
          "Ostruzione delle vie aeree (manovra di Heimlich)",
          "Emorragie: pressione diretta, tamponamento",
          "Shock: riconoscimento e primi interventi",
        ],
      },
      {
        nome: "Modulo 3 — Supporto vitale di base BLS (4h pratica)",
        ore: 4,
        elearning: false,
        note: "Obbligatoriamente in presenza con manichino",
        argomenti: [
          "RCP (Rianimazione Cardio-Polmonare): tecnica 30:2",
          "Utilizzo del DAE (Defibrillatore Automatico Esterno)",
          "Gestione arresto cardiaco nell'adulto e nel bambino",
          "Esercitazioni pratiche BLS con feedback immediato",
        ],
      },
      {
        nome: "Modulo 4 — Traumi, intossicazioni, emergenze specifiche (4h)",
        ore: 4,
        elearning: "parziale",
        argomenti: [
          "Traumi: contusioni, fratture, lussazioni, lesioni spinali",
          "Lesioni da agenti fisici: ustioni, ipotermia, elettrocuzione",
          "Intossicazioni: sostanze chimiche, fumi, gas",
          "Emergenze mediche: crisi epilettica, ipoglicemia, sincope",
          "Movimentazione del traumatizzato",
          "Utilizzo della cassetta di pronto soccorso (DM 388/2003 Allegato 1-2)",
        ],
      },
    ],
    aggiornamento: {
      cadenza_anni: 3,
      ore: 4,
      elearning: "parziale",
    },
    prerequisiti: [],
    lezioni_suggerite: 8,
    note: "Gruppi B e C (aziende con ≥3 dipendenti, non classificate gruppo A). Parte BLS obbligatoriamente in presenza.",
  },

  primo_soccorso_a: {
    id: "primo_soccorso_a",
    titolo: "Addetti al Primo Soccorso — Gruppo A (16h)",
    destinatari: "Addetti al primo soccorso in aziende del gruppo A (rischio alto, industrie estrattive, ecc.)",
    riferimento: "DM 388/2003 — Art. 45 D.Lgs. 81/08",
    ore_totali: 16,
    elearning: "parziale",
    moduli: [
      {
        nome: "Modulo 1 — Allertare e ruolo dell'addetto (1h)",
        ore: 1,
        elearning: true,
        argomenti: ["Come allertare il sistema di soccorso", "Ruolo dell'addetto PS gruppo A", "Modulistica INAIL"],
      },
      {
        nome: "Modulo 2 — Valutazione e intervento (3h)",
        ore: 3,
        elearning: true,
        argomenti: ["Valutazione primaria e secondaria", "Gestione delle vie aeree", "Emorragie e shock", "PLS"],
      },
      {
        nome: "Modulo 3 — BLS avanzato (6h pratica)",
        ore: 6,
        elearning: false,
        argomenti: [
          "RCP adulto e pediatrico",
          "DAE — uso e manutenzione",
          "Manovre di disostruzione (adulto e bambino)",
          "Esercitazioni BLS con manichino e feedback",
        ],
      },
      {
        nome: "Modulo 4 — Emergenze specifiche settore alto rischio (6h)",
        ore: 6,
        elearning: "parziale",
        argomenti: [
          "Traumi gravi: fratture, politrauma, lesioni spinali",
          "Intossicazioni da agenti chimici e gas pericolosi",
          "Emergenze da agenti fisici: ustioni chimiche, elettrocuzione ad alta tensione",
          "Ipotermia e colpo di calore in ambienti estremi",
          "Tecniche di movimentazione e immobilizzazione avanzate",
          "Utilizzo della barella e dei presidi di immobilizzazione",
        ],
      },
    ],
    aggiornamento: {
      cadenza_anni: 3,
      ore: 6,
      elearning: "parziale",
    },
    prerequisiti: [],
    durata_lezione_min: 15,
    lezioni_suggerite: 48, // 16h × 4 (teorica + pratica in presenza)
  },

};

// ─── Mappa veloce: id → config ────────────────────────────────────────────────

export function getCorsoConfig(id) {
  return CORSI_CONFIG[id] ?? null;
}

// ─── Lista corsi disponibili ──────────────────────────────────────────────────

export function listCorsi() {
  return Object.values(CORSI_CONFIG).map(c => ({
    id: c.id,
    titolo: c.titolo,
    destinatari: c.destinatari,
    ore_totali: c.ore_totali,
    elearning: c.elearning,
    lezioni_suggerite: c.lezioni_suggerite ?? c.ore_totali,
  }));
}

// ─── Corsi compatibili con e-learning (totale o parziale) ────────────────────

export function corsiElearning() {
  return Object.values(CORSI_CONFIG).filter(c => c.elearning !== false);
}
