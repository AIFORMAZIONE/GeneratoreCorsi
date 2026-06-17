// Genera copioni_avatar.docx per "Formazione Datore di Lavoro (16h)" — script HeyGen, una sezione per lezione.
// Struttura da docs/GUIDA_GENERAZIONE_CORSI.md sez. 4:
//   Heading1: "Lezione N — Titolo"  |  Heading3: nome del corso  |  paragrafi in prosa conversazionale
//   (no markdown/elenchi/simboli), target ~2000-2800 parole/lezione (~15-20 min a ~140 parole/min).
// I copioni sono caricati a batch da copioni_datore_data/*.mjs: lo script assembla i file presenti,
// ordina per numero e genera il docx. Contenuti fondati sul materiale DB (cfr. corso.docx / struttura_corso.json).
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "copioni_datore_data");
const OUT_DIR = path.join(__dirname, "..", "..", "Corsi Generati", "Corso_Datore_Lavoro_16h_2026");
const NOME_CORSO = "Formazione Datore di Lavoro (16h)";

const COL_H1 = "1F4E79";
const COL_H3 = "2E75B6";

// ─── Caricamento copioni a batch ────────────────────────────────────────────
let copioni = [];
if (fs.existsSync(DATA_DIR)) {
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".mjs")).sort();
  for (const f of files) {
    const mod = await import(pathToFileURL(path.join(DATA_DIR, f)).href);
    if (Array.isArray(mod.default)) copioni.push(...mod.default);
  }
}
// dedup per numero (l'ultimo file vince), poi ordina
const perNumero = new Map();
for (const c of copioni) perNumero.set(c.numero, c);
copioni = [...perNumero.values()].sort((a, b) => a.numero - b.numero);
if (copioni.length === 0) {
  console.error("Nessun file copioni trovato in copioni_datore_data/. Interrompo.");
  process.exit(1);
}

// ─── Helper ─────────────────────────────────────────────────────────────────
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: true,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, color: COL_H1, size: 36 })],
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { after: 200 },
    children: [new TextRun({ text, bold: true, color: COL_H3, size: 24 })],
  });
}
function p(text) {
  return new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text, size: 24 })] });
}

// ─── Costruzione documento ──────────────────────────────────────────────────
const children = [];
children.push(
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: NOME_CORSO, bold: true, color: COL_H1, size: 48 })] }),
  new Paragraph({ spacing: { after: 360 }, children: [new TextRun({ text: "Copioni avatar — script per la narrazione video (una sezione per lezione)", italics: true, color: "888888", size: 22 })] }),
);

let paroleTot = 0;
for (const c of copioni) {
  const numStr = String(c.numero).padStart(2, "0");
  children.push(h1(`Lezione ${numStr} — ${c.titolo}`));
  children.push(h3(NOME_CORSO));
  for (const par of c.paragrafi) {
    children.push(p(par));
    paroleTot += par.split(/\s+/).filter(Boolean).length;
  }
}

const doc = new Document({ sections: [{ children }] });
const buf = await Packer.toBuffer(doc);
fs.mkdirSync(OUT_DIR, { recursive: true });
let outName = "copioni_avatar.docx";
try {
  fs.writeFileSync(path.join(OUT_DIR, outName), buf);
} catch (e) {
  if (e.code === "EBUSY" || e.code === "EPERM") {
    outName = "copioni_avatar_NUOVO.docx";
    fs.writeFileSync(path.join(OUT_DIR, outName), buf);
    console.warn("⚠️  copioni_avatar.docx aperto/bloccato: salvato come copioni_avatar_NUOVO.docx.");
  } else { throw e; }
}
const media = copioni.length ? Math.round(paroleTot / copioni.length) : 0;
console.log(`✅ ${outName} generato — ${copioni.length} copioni, ${paroleTot} parole totali (media ${media}/lezione)`);
