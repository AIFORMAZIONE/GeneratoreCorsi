// Genera corso.docx per "Formazione Datore di Lavoro (16h)" — 48 lezioni, 4 moduli x 12 (20 min/lez).
// Struttura/formato da "File base/Template Corso.docx" (cfr. docs/GUIDA_GENERAZIONE_CORSI.md).
// I contenuti delle lezioni sono caricati a batch da corso_datore_data/lezioni_m{1..4}.mjs:
// lo script genera il docx con i moduli presenti, saltando quelli non ancora prodotti.
// Contenuti fondati esclusivamente sul materiale DB (articoli_dlgs + argomenti), cfr. struttura_corso.json.
import { Document, Packer, Paragraph, TextRun } from "docx";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "corso_datore_data");
const OUT_DIR = path.join(__dirname, "..", "..", "Corsi Generati", "Corso_Datore_Lavoro_16h_2026");

const TITOLO_CORSO = "Formazione Datore di Lavoro (16h)";
const DESTINATARI = "Datori di lavoro che non assumono le funzioni di RSPP (Art. 18 D.Lgs. 81/08)";
const ORE = "16 ore — Accordo Stato-Regioni 17 aprile 2025";
const TOT_LEZIONI = "48 Lezioni (4 moduli da 12)  |  Piattaforma LearnWorlds";

const COL_TITOLO_CORSO = "1F4E79";
const COL_DESTINATARI = "2E75B6";
const COL_META = "666666";
const COL_PIATTAFORMA = "888888";
const COL_HEADING1 = "1F4E79";
const COL_HEADING2 = "2E75B6";
const COL_ESEMPIO = "1B5E20";
const COL_RIFLESSIONE = "4A148C";

const moduli = {
  1: "Modulo 1 — Quadro normativo e figure della prevenzione",
  2: "Modulo 2 — Valutazione dei rischi e organizzazione della prevenzione",
  3: "Modulo 3 — Gruppi a rischio particolare, stress lavoro-correlato e gestione",
  4: "Modulo 4 — Strumenti gestionali, comunicazione e rischi specifici",
};

// ─── Caricamento lezioni a batch ────────────────────────────────────────────
let lezioni = [];
for (const m of [1, 2, 3, 4]) {
  const f = path.join(DATA_DIR, `lezioni_m${m}.mjs`);
  if (fs.existsSync(f)) {
    const mod = await import(pathToFileURL(f).href);
    if (Array.isArray(mod.default)) lezioni.push(...mod.default);
  }
}
lezioni.sort((a, b) => a.numero - b.numero);
if (lezioni.length === 0) {
  console.error("Nessun file lezioni trovato in corso_datore_data/. Interrompo.");
  process.exit(1);
}

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

children.push(
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: TITOLO_CORSO, bold: true, color: COL_TITOLO_CORSO, size: 64 })] }),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: DESTINATARI, color: COL_DESTINATARI, size: 36 })] }),
  new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: ORE, italics: true, color: COL_META, size: 26 })] }),
  new Paragraph({ spacing: { after: 360 }, children: [new TextRun({ text: TOT_LEZIONI, color: COL_PIATTAFORMA })] }),
);

children.push(heading1("Indice del corso"));
let modIndice = 0;
for (const lez of lezioni) {
  if (lez.modulo !== modIndice) {
    modIndice = lez.modulo;
    children.push(new Paragraph({ spacing: { before: 160, after: 80 }, children: [new TextRun({ text: moduli[modIndice], bold: true, color: COL_HEADING1, size: 26 })] }));
  }
  const numStr = String(lez.numero).padStart(2, "0");
  children.push(new Paragraph({
    spacing: { after: 60 },
    children: [new TextRun({ text: `Lezione ${numStr} — ` }), new TextRun({ text: lez.titolo, bold: true, color: COL_DESTINATARI })],
  }));
}

let modCorrente = 0;
let primaLezModulo = true;
for (const lez of lezioni) {
  const numStr = String(lez.numero).padStart(2, "0");
  if (lez.modulo !== modCorrente) {
    modCorrente = lez.modulo;
    children.push(heading1(moduli[modCorrente], { pageBreakBefore: true }));
    primaLezModulo = true;
  }
  children.push(new Paragraph({
    pageBreakBefore: !primaLezModulo,
    spacing: { before: 240, after: 60 },
    children: [new TextRun({ text: `LEZIONE ${numStr}`, bold: true, color: COL_HEADING2, size: 22 })],
  }));
  primaLezModulo = false;
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
fs.mkdirSync(OUT_DIR, { recursive: true });
const moduliPresenti = [...new Set(lezioni.map(l => l.modulo))].sort();
let outName = "corso.docx";
try {
  fs.writeFileSync(path.join(OUT_DIR, outName), buf);
} catch (e) {
  if (e.code === "EBUSY" || e.code === "EPERM") {
    outName = "corso_NUOVO.docx"; // corso.docx aperto in Word: salvo con nome alternativo
    fs.writeFileSync(path.join(OUT_DIR, outName), buf);
    console.warn("⚠️  corso.docx risultava aperto/bloccato: salvato come corso_NUOVO.docx. Chiudi Word e rilancia per sovrascrivere corso.docx.");
  } else { throw e; }
}
console.log(`✅ ${outName} generato — ${lezioni.length} lezioni (moduli presenti: ${moduliPresenti.join(", ")}) in ${OUT_DIR}`);
