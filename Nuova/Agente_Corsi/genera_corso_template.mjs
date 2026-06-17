// Genera corso.docx seguendo la struttura/formato di "File base/Template Corso.docx":
// copertina, indice del corso, e per ogni lezione:
// LEZIONE NN / Titolo / Introduzione / In questa lezione apprenderai / Pillola informativa /
// Accordion (sezioni di approfondimento) / Esempio pratico / Domanda di riflessione / Riepilogo
import { Document, Packer, Paragraph, TextRun } from "docx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PILOT_DIR = path.join(__dirname, "..", "..", "Corsi Generati", "Corso_Form_Datore_2026_PILOT_v2");

const TITOLO_CORSO = "Formazione Datore di Lavoro (16h)";
const DESTINATARI = "Datori di lavoro (Art. 18 D.Lgs. 81/08)";
const ORE = "16 ore";
const TOT_LEZIONI = "64 Lezioni  |  Piattaforma LearnWorlds";

// Colori/dimensioni ricavati da File base/Template Corso.docx
const COL_TITOLO_CORSO = "1F4E79";
const COL_DESTINATARI = "2E75B6";
const COL_META = "666666";
const COL_PIATTAFORMA = "888888";
const COL_HEADING1 = "1F4E79";
const COL_HEADING2 = "2E75B6";
const COL_ESEMPIO = "1B5E20";
const COL_RIFLESSIONE = "4A148C";

const lezioni = [
  {
    numero: 7,
    modulo: 1,
    titolo: "La delega di funzioni: requisiti e limiti",
    introduzione: "Nelle organizzazioni di medie e grandi dimensioni il Datore di Lavoro non può occuparsi personalmente di ogni aspetto della sicurezza: per questo il D.Lgs. 81/08 prevede la delega di funzioni, strumento che consente di trasferire compiti e responsabilità a soggetti competenti. Non è una scappatoia per gli obblighi di legge: è un atto formale, regolato dall'Art. 16, che deve rispettare requisiti precisi pena la nullità. Comprendere come costruire una delega valida, quali poteri trasferire e quali obblighi restano al Datore di Lavoro è essenziale per chi gestisce un'azienda articolata in più funzioni o sedi. Vedremo forma, contenuti e limiti della delega, con focus sulle novità del D.Lgs. 159/2025 sulla lettera e) dell'Art. 16.",
    imparerai: [
      "Riconoscere i requisiti formali e sostanziali per una delega di funzioni valida (Art. 16)",
      "Distinguere tra obblighi delegabili e non delegabili del Datore di Lavoro (Artt. 17 e 18)",
      "Valutare i limiti dell'obbligo di vigilanza che permane in capo al delegante",
    ],
    daSapere: "La delega è valida solo se scritta, con data certa, accettata per iscritto dal delegato (Art. 16, lett. a ed e).",
    sezioni: [
      {
        titolo: "La forma scritta e i requisiti del delegato",
        testo: "La delega di funzioni, per produrre effetti giuridici, deve risultare da un atto scritto recante data certa: non basta un accordo verbale o una prassi organizzativa, serve un documento datato e verificabile. Il delegato deve inoltre possedere i requisiti di professionalità ed esperienza richiesti dalla specifica natura delle funzioni affidate: non basta nominare una persona di fiducia, occorre che abbia competenze tecniche adeguate al ruolo. Questo doppio requisito — forma scritta e idoneità professionale — è il primo filtro di validità previsto dalla legge. Se manca, la delega è inefficace e gli obblighi restano al Datore di Lavoro, con le relative conseguenze sanzionatorie. È buona prassi predisporre un atto strutturato che documenti competenze ed esperienza del delegato.",
      },
      {
        titolo: "I poteri trasferiti e l'accettazione del delegato",
        testo: "Perché la delega sia effettiva, non basta il \"nome\": occorre che attribuisca al delegato i poteri di organizzazione, gestione e controllo necessari per svolgere le funzioni delegate, oltre all'autonomia di spesa per attuarle (ad esempio per acquistare DPI o servizi di formazione). Senza questi poteri reali, la delega resta \"sulla carta\" e non sposta la responsabilità, perché il delegato non avrebbe i mezzi per agire. Un elemento reso ancora più centrale dal D.Lgs. 159/2025, che interviene sulla lettera e) dell'Art. 16, è l'accettazione scritta del delegato: la delega non è un atto unilaterale, ma un accordo consapevolmente accettato da chi ne assume gli oneri, riducendo contestazioni sulla volontarietà dell'incarico. Alla delega, infine, va data adeguata pubblicità interna, affinché lavoratori e RLS sappiano a chi rivolgersi.",
      },
      {
        titolo: "L'obbligo di vigilanza e i limiti alla delega",
        testo: "Anche quando la delega è formalmente perfetta, il Datore di Lavoro non si \"libera\" del tutto: l'Art. 16, comma 3, stabilisce che la delega non esclude l'obbligo di vigilanza del delegante sul corretto espletamento delle funzioni trasferite. Il Datore di Lavoro deve assicurarsi che il delegato svolga i compiti assegnati, tramite verifiche periodiche, audit interni o flussi informativi strutturati. La legge indica una via efficace per assolvere a questo obbligo: l'adozione di un Modello di Organizzazione e Gestione con sistema di verifica e controllo (Art. 30, comma 4). Va inoltre ricordato, ai sensi dell'Art. 17, che restano sempre non delegabili la valutazione di tutti i rischi con elaborazione del DVR e la designazione dell'RSPP: il \"nucleo duro\" delle responsabilità datoriali.",
      },
    ],
    casoPratico: "Un'azienda con tre stabilimenti delega al responsabile di ogni sito la gestione della sicurezza, incluse le decisioni su DPI e squadre di emergenza. Il Datore di Lavoro predispone un atto scritto datato, ma omette la controfirma per accettazione e non prevede budget autonomo per acquisti urgenti. Dopo un infortunio, emerge che il delegato non aveva mai potuto acquistare i DPI mancanti. Quali elementi della delega risultano carenti rispetto all'Art. 16, e quali conseguenze ne derivano per la responsabilità del Datore di Lavoro?",
    domandaRiflessione: "Le deleghe di funzioni adottate nella tua organizzazione rispettano tutti i requisiti dell'Art. 16 — forma scritta, accettazione del delegato, poteri reali e autonomia di spesa? Come viene esercitata in concreto la vigilanza sul delegato?",
    riepilogo: "La delega di funzioni è valida solo se risulta da un atto scritto con data certa ed è accettata per iscritto dal delegato, come richiesto dall'Art. 16 (lett. a ed e, anche alla luce del D.Lgs. 159/2025). Il delegato deve possedere professionalità ed esperienza adeguate e ricevere poteri organizzativi, gestionali, di controllo e un'autonomia di spesa realmente esercitabile. La delega, però, non elimina l'obbligo di vigilanza del Datore di Lavoro, che può essere assolto tramite un Modello di Organizzazione e Gestione con sistema di verifica e controllo (Art. 30, comma 4). Restano infine sempre non delegabili la valutazione dei rischi con elaborazione del DVR e la designazione dell'RSPP (Art. 17).",
  },
  {
    numero: 30,
    modulo: 2,
    titolo: "Appalti e DUVRI: obblighi del committente",
    introduzione: "Affidare lavori, servizi o forniture a imprese esterne o a lavoratori autonomi è una prassi quotidiana per moltissime aziende, ma comporta responsabilità precise per il datore di lavoro committente. Quando più imprese operano negli stessi spazi, i rischi non riguardano più solo i lavoratori di ciascuna azienda, ma anche le cosiddette \"interferenze\" tra le diverse attività. L'Art. 26 del D.Lgs. 81/08 disciplina in modo dettagliato questi obblighi, dalla verifica dei requisiti dell'appaltatore alla gestione economica della sicurezza nei contratti. Conoscere questi adempimenti non è solo un dovere formale: significa prevenire infortuni, evitare la nullità dei contratti e tutelarsi da responsabilità solidali in caso di danni ai lavoratori dell'appaltatore.",
    imparerai: [
      "Verificare l'idoneità tecnico-professionale delle imprese appaltatrici e dei lavoratori autonomi",
      "Redigere e gestire il DUVRI (Documento Unico di Valutazione dei Rischi da Interferenze)",
      "Indicare correttamente i costi della sicurezza nei contratti d'appalto, distinguendoli da quelli soggetti a ribasso",
    ],
    daSapere: "I costi della sicurezza relativi ai rischi da interferenza devono essere indicati nei contratti d'appalto e non sono soggetti a ribasso (Art. 26, comma 5).",
    sezioni: [
      {
        titolo: "La verifica dell'idoneità tecnico-professionale",
        testo: "Prima di affidare lavori, servizi o forniture all'interno della propria azienda, il datore di lavoro committente deve verificare l'idoneità tecnico-professionale dell'impresa appaltatrice o del lavoratore autonomo (Art. 26, comma 1, lett. a). In attesa del decreto attuativo previsto dalla norma, questa verifica si effettua acquisendo il certificato di iscrizione alla Camera di Commercio e l'autocertificazione dell'impresa o del lavoratore autonomo sul possesso dei requisiti richiesti. Il committente deve inoltre fornire all'appaltatore informazioni dettagliate sui rischi specifici presenti nell'ambiente di lavoro e sulle misure di prevenzione ed emergenza adottate (lett. b). Si tratta di un primo filtro fondamentale: un'impresa priva dei requisiti minimi rappresenta un rischio aggiuntivo per tutti coloro che operano nello stesso luogo di lavoro. Da segnalare anche la novità introdotta dalla L. 203/2024 (comma 8-bis): le imprese appaltatrici e subappaltatrici devono comunicare al committente il nominativo del personale che svolge la funzione di preposto.",
      },
      {
        titolo: "Il DUVRI: cooperazione e coordinamento tra imprese",
        testo: "Quando più datori di lavoro operano nello stesso ambiente, l'Art. 26 (commi 2 e 3) impone di cooperare nell'attuazione delle misure di prevenzione e di coordinarsi per eliminare i rischi dovuti alle interferenze tra le diverse attività. Lo strumento principale per questo coordinamento è il DUVRI, il Documento Unico di Valutazione dei Rischi da Interferenze: il committente lo elabora indicando le misure adottate per eliminare o, ove non possibile, ridurre al minimo tali rischi, e lo allega al contratto di appalto, aggiornandolo in funzione dell'evoluzione dei lavori. Il DUVRI, tuttavia, non è sempre obbligatorio: il comma 3-bis esclude i servizi di natura intellettuale, le mere forniture di materiali o attrezzature e i lavori di durata non superiore a cinque uomini-giorno, salvo che comportino rischi particolari (incendio elevato, ambienti confinati, agenti cancerogeni o biologici, amianto, atmosfere esplosive). La sua mancanza, quando dovuto, può comportare la nullità del contratto d'appalto: un motivo in più per non sottovalutarne la redazione.",
      },
      {
        titolo: "Costi della sicurezza e responsabilità solidale",
        testo: "Un aspetto spesso trascurato riguarda gli aspetti economici: l'Art. 26, comma 5, stabilisce che nei contratti di appalto, subappalto e somministrazione devono essere specificamente indicati, a pena di nullità, i costi relativi alla sicurezza connessi allo specifico appalto, e tali costi non sono soggetti a ribasso d'asta. Questo significa che la concorrenza tra imprese appaltatrici non può mai tradursi in una riduzione delle risorse destinate alla sicurezza. Inoltre, il comma 4 prevede che il committente risponda in solido con l'appaltatore (e con eventuali subappaltatori) per i danni non indennizzati dall'INAIL subiti dai lavoratori di queste imprese. Per i cantieri temporanei o mobili, dal 1° ottobre 2024 si aggiunge l'obbligo della patente a crediti (Art. 27): le imprese e i lavoratori autonomi devono possedere requisiti minimi (DURC, DVR, iscrizione camerale, designazione RSPP) per poter operare, pena sanzioni e esclusione dai lavori pubblici.",
      },
    ],
    casoPratico: "Un'azienda manifatturiera affida la manutenzione straordinaria di un impianto a una ditta esterna, con interventi previsti per due settimane all'interno del reparto produttivo, in presenza dei lavoratori dell'azienda committente. Il responsabile acquisti vorrebbe procedere rapidamente firmando solo l'ordine di acquisto, senza ulteriori adempimenti. Quali verifiche e quali documenti dovrebbe predisporre il datore di lavoro committente prima dell'inizio dei lavori, e perché in questo caso il DUVRI non può essere evitato?",
    domandaRiflessione: "Nei contratti di appalto della tua azienda i costi della sicurezza sono sempre indicati specificamente e non soggetti a ribasso, e viene verificata l'idoneità tecnico-professionale degli appaltatori prima dell'inizio dei lavori?",
    riepilogo: "Prima di affidare lavori, servizi o forniture, il committente deve verificare l'idoneità tecnico-professionale di imprese appaltatrici e lavoratori autonomi (Art. 26, comma 1). Il DUVRI individua e riduce i rischi da interferenza tra le diverse imprese e va allegato al contratto, salvo le esclusioni previste dal comma 3-bis per servizi intellettuali, mere forniture e lavori di durata non superiore a cinque uomini-giorno senza rischi particolari. I costi della sicurezza devono essere indicati specificamente nei contratti e non sono soggetti a ribasso, a pena di nullità (Art. 26, comma 5). Il committente risponde infine in solido con l'appaltatore per i danni non coperti da INAIL e, nei cantieri temporanei o mobili, deve verificare il possesso della patente a crediti (Art. 27).",
  },
  {
    numero: 39,
    modulo: 3,
    titolo: "Il RLS: nomina, poteri e diritti",
    introduzione: "Il Rappresentante dei Lavoratori per la Sicurezza (RLS) è una delle figure cardine del sistema di prevenzione disegnato dal D.Lgs. 81/08: rappresenta la voce dei lavoratori sui temi della salute e sicurezza e dialoga direttamente con il Datore di Lavoro, l'RSPP e il Medico Competente. Per chi ha responsabilità organizzative, conoscere con precisione come viene eletto o designato l'RLS, quanti rappresentanti devono essere presenti in azienda e quali diritti la legge gli riconosce non è un dettaglio formale, ma una condizione essenziale per costruire un sistema di prevenzione realmente partecipato. Una gestione corretta del rapporto con l'RLS riduce il contenzioso, migliora il clima aziendale e rafforza l'efficacia delle misure di prevenzione. In questa lezione vedremo gli articoli 47-50 del D.Lgs. 81/08, che disciplinano nomina, numero, attribuzioni e diritti del RLS.",
    imparerai: [
      "Riconoscere le modalità di elezione o designazione del RLS previste dagli artt. 47-48",
      "Determinare il numero di RLS richiesto in base alla dimensione aziendale",
      "Individuare i diritti di accesso, consultazione e informazione del RLS e i relativi obblighi del Datore di Lavoro",
    ],
    daSapere: "Il numero minimo di RLS è 1 fino a 200 lavoratori, 3 da 201 a 1000, 6 oltre 1000 (artt. 47-50, D.Lgs. 81/08).",
    sezioni: [
      {
        titolo: "Nomina ed elezione del RLS",
        testo: "L'art. 47 stabilisce che in tutte le aziende, senza eccezioni legate alla dimensione, deve essere eletto o designato un rappresentante dei lavoratori per la sicurezza. Le modalità cambiano in funzione del numero di dipendenti: nelle aziende fino a 15 lavoratori l'RLS è di norma eletto direttamente dai lavoratori al loro interno, oppure può essere individuato a livello territoriale o di comparto secondo l'art. 48; nelle aziende con più di 15 lavoratori, invece, l'elezione o designazione avviene nell'ambito delle rappresentanze sindacali aziendali e, in loro assenza, direttamente tra i lavoratori. Il mandato dell'RLS dura in genere 3 anni, secondo quanto stabilito dalla contrattazione collettiva, che disciplina anche tempi e strumenti per l'esercizio delle funzioni. Per il Datore di Lavoro è importante verificare che l'elezione sia avvenuta correttamente e che i nominativi degli RLS siano comunicati e aggiornati nel DVR e nei documenti aziendali. Quando in azienda non viene eletto alcun RLS, le sue funzioni sono svolte dal Rappresentante dei Lavoratori per la Sicurezza Territoriale (RLST), come previsto dall'art. 48.",
      },
      {
        titolo: "Il numero di RLS in funzione delle dimensioni aziendali",
        testo: "La normativa collega il numero di rappresentanti alla dimensione dell'organico, per garantire una rappresentanza proporzionata e capillare. Nelle aziende fino a 200 lavoratori è prevista la presenza di almeno 1 RLS; nelle aziende da 201 a 1000 lavoratori il numero minimo sale a 3; oltre i 1000 lavoratori sono richiesti almeno 6 rappresentanti. Per i contesti produttivi più complessi, caratterizzati dalla compresenza di più aziende o cantieri (porti, centri intermodali, impianti siderurgici, grandi cantieri), l'art. 49 prevede inoltre la figura del Rappresentante dei Lavoratori per la Sicurezza di sito produttivo, individuato tra gli RLS delle aziende operanti nello stesso sito. Per il Datore di Lavoro, calcolare correttamente il numero di RLS necessari significa evitare carenze di rappresentanza che potrebbero essere contestate in sede di vigilanza e, soprattutto, garantire che il dialogo con i lavoratori sia effettivo e non solo formale.",
      },
      {
        titolo: "Diritti di accesso, consultazione e informazione (art. 50)",
        testo: "L'art. 50 elenca in modo dettagliato le attribuzioni dell'RLS, che costituiscono altrettanti obblighi corrispondenti per il Datore di Lavoro. L'RLS ha diritto di accedere ai luoghi di lavoro in cui si svolgono le lavorazioni, di essere consultato preventivamente e tempestivamente sulla valutazione dei rischi e sull'elaborazione del DVR, sulla designazione del RSPP, degli addetti alle emergenze e del Medico Competente, e sull'organizzazione della formazione prevista dall'art. 37. Ha inoltre diritto a ricevere la documentazione aziendale relativa alla valutazione dei rischi, alle sostanze pericolose, alle attrezzature e all'organizzazione del lavoro, nonché le informazioni provenienti dagli organi di vigilanza. L'RLS riceve una formazione specifica non inferiore a quella prevista dall'art. 37 (32 ore per rischio alto, 16 per rischio medio, 12 per rischio basso, con aggiornamenti annuali) e dispone di un monte ore retribuito, di norma non inferiore a 40 ore annue, per svolgere il proprio ruolo. Partecipa infine alla riunione periodica annuale prevista dall'art. 35, può formulare osservazioni durante le visite degli organi di vigilanza e, se ritiene inadeguate le misure di prevenzione adottate, può fare ricorso alle autorità competenti.",
      },
    ],
    casoPratico: "In un'azienda manifatturiera di 250 dipendenti, il Datore di Lavoro deve aggiornare il DVR a seguito dell'introduzione di un nuovo macchinario. Convoca l'RLS per la consultazione preventiva prevista dall'art. 50, gli fornisce la documentazione tecnica e il piano di valutazione del rischio rumore, e fissa la data della riunione periodica annuale a cui parteciperanno anche RSPP e Medico Competente. L'azienda, avendo 250 lavoratori, deve garantire la presenza di almeno 3 RLS: verificando i registri, il Datore di Lavoro si accorge che è stato eletto un solo rappresentante. Quali rischi corre l'azienda continuando ad operare con un numero di RLS insufficiente rispetto a quanto previsto dalla normativa?",
    domandaRiflessione: "Nella tua azienda l'RLS viene consultato in modo preventivo e tempestivo su DVR, formazione e nomine chiave, oppure solo informato dopo le decisioni? Il numero di RLS eletti è coerente con quanto previsto per il numero di lavoratori presenti?",
    riepilogo: "L'art. 47 impone l'elezione o la designazione dell'RLS in tutte le aziende, con modalità diverse sopra e sotto i 15 lavoratori. Il numero minimo di rappresentanti è proporzionato alla dimensione aziendale: almeno 1 fino a 200 lavoratori, almeno 3 fino a 1000, almeno 6 oltre i 1000. L'art. 50 attribuisce all'RLS diritti di accesso ai luoghi di lavoro, consultazione preventiva su DVR, formazione e designazioni chiave, oltre alla ricezione di informazioni e documentazione aziendale. In assenza di un RLS aziendale opera il Rappresentante dei Lavoratori per la Sicurezza Territoriale (RLST, art. 48), mentre nei siti produttivi complessi è prevista la figura del RLS di sito produttivo (art. 49).",
  },
];

// ─── Helper per paragrafi in stile "Template Corso.docx" ───────────────────

function heading1(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 360, after: 180 },
    pageBreakBefore: !!opts.pageBreakBefore,
    children: [new TextRun({ text, bold: true, color: COL_HEADING1, size: 40 })],
  });
}

function heading2(text) {
  return new Paragraph({
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, color: COL_HEADING2, size: 28 })],
  });
}

function body(text) {
  return new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text })] });
}

function bullet(text) {
  return new Paragraph({ bullet: { level: 0 }, spacing: { after: 80 }, children: [new TextRun({ text })] });
}

function inlineLabel(emoji, label, color) {
  return new Paragraph({
    spacing: { before: 120, after: 60 },
    children: [new TextRun({ text: `${emoji} ${label}: `, bold: true, color })],
  });
}

function lezioneTitolo(text) {
  return new Paragraph({
    spacing: { after: 240 },
    children: [new TextRun({ text, bold: true, color: COL_HEADING1, size: 44 })],
  });
}

// ─── Costruzione documento ──────────────────────────────────────────────────

const children = [];

// Copertina
children.push(
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: TITOLO_CORSO, bold: true, color: COL_TITOLO_CORSO, size: 64 })] }),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: DESTINATARI, color: COL_DESTINATARI, size: 36 })] }),
  new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: ORE, italics: true, color: COL_META, size: 26 })] }),
  new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: TOT_LEZIONI, color: COL_PIATTAFORMA })] }),
  new Paragraph({ spacing: { after: 360 }, children: [new TextRun({ text: "Documento pilota — 3 lezioni di esempio (su 64 totali)", italics: true, color: COL_PIATTAFORMA })] }),
);

// Indice del corso
children.push(heading1("Indice del corso"));
for (const lez of lezioni) {
  const numStr = String(lez.numero).padStart(2, "0");
  children.push(
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: `Lezione ${numStr} — ` }),
        new TextRun({ text: lez.titolo, bold: true, color: COL_DESTINATARI }),
      ],
    }),
  );
}

// Sezioni per lezione
for (const lez of lezioni) {
  const numStr = String(lez.numero).padStart(2, "0");

  children.push(
    new Paragraph({
      pageBreakBefore: true,
      spacing: { before: 0, after: 60 },
      children: [new TextRun({ text: `LEZIONE ${numStr}`, bold: true, color: COL_HEADING2, size: 22 })],
    }),
  );
  children.push(lezioneTitolo(lez.titolo));

  children.push(heading2("Introduzione"));
  children.push(body(lez.introduzione));

  children.push(heading2("In questa lezione apprenderai:"));
  for (const item of lez.imparerai) children.push(bullet(item));

  children.push(inlineLabel("💡", "Pillola informativa", COL_HEADING2));
  children.push(body(lez.daSapere));

  for (const sezione of lez.sezioni) {
    children.push(heading2(sezione.titolo));
    children.push(body(sezione.testo));
  }

  children.push(inlineLabel("🔍", "Esempio pratico", COL_ESEMPIO));
  children.push(body(lez.casoPratico));

  children.push(inlineLabel("💭", "Domanda di riflessione", COL_RIFLESSIONE));
  children.push(body(lez.domandaRiflessione));

  children.push(heading2("Riepilogo"));
  children.push(body(lez.riepilogo));
}

const doc = new Document({ sections: [{ children }] });

const buf = await Packer.toBuffer(doc);
fs.writeFileSync(path.join(PILOT_DIR, "corso.docx"), buf);
console.log("✅ corso.docx riscritto seguendo il template di File base/Template Corso.docx");
