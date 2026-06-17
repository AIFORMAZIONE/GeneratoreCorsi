// Converte i file .txt del pilota PILOT_v2 nei formati ufficiali:
// corso.docx, copioni_avatar.docx, quiz.xlsx
import { Document, Packer, Paragraph, HeadingLevel } from "docx";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PILOT_DIR = path.join(__dirname, "..", "..", "Corsi Generati", "Corso_Form_Datore_2026_PILOT_v2");
const TITOLO_CORSO = "Formazione Datore di Lavoro (16h)";

// ─── Parsing helpers ──────────────────────────────────────────────────────

function splitLezioni(testo, headerRegex) {
  const blocchi = [];
  const matches = [...testo.matchAll(headerRegex)];
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const start = m.index + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : testo.length;
    blocchi.push({ groups: m.slice(1), corpo: testo.slice(start, end).trim() });
  }
  return blocchi;
}

// ─── 1. corso.docx ──────────────────────────────────────────────────────────

function buildCorsoDocx(testo) {
  const headerRegex = /={10,}\nLEZIONE (\d+) — Modulo (\d+) — (.+?)\n={10,}\n/g;
  const lezioni = splitLezioni(testo, headerRegex);

  const children = [
    new Paragraph({ text: TITOLO_CORSO, heading: HeadingLevel.TITLE }),
    new Paragraph({ text: "Pilota v2 — testi e-learning delle lezioni", spacing: { after: 400 } }),
  ];

  for (const { groups, corpo } of lezioni) {
    const [n, modulo, titolo] = groups;
    children.push(new Paragraph({ text: `Lezione ${n} — ${titolo}`, heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ text: `Modulo ${modulo} — ${TITOLO_CORSO}`, heading: HeadingLevel.HEADING_3 }));

    for (const riga of corpo.split("\n")) {
      const r = riga.trim();
      if (!r) continue;
      if (r.startsWith("## ")) continue; // ridondante con l'header già scritto
      if (r.startsWith("### ")) {
        children.push(new Paragraph({ text: r.replace(/^###\s*/, ""), heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }));
      } else if (r.startsWith("- ")) {
        children.push(new Paragraph({ text: r.replace(/^-\s*/, ""), bullet: { level: 0 } }));
      } else {
        children.push(new Paragraph({ text: r, spacing: { after: 120 } }));
      }
    }
  }

  return new Document({ sections: [{ children }] });
}

// ─── 2. copioni_avatar.docx ──────────────────────────────────────────────────

function buildCopioniDocx(testo) {
  const headerRegex = /={10,}\nLEZIONE (\d+) — (.+?)\n={10,}\n/g;
  const lezioni = splitLezioni(testo, headerRegex).filter(b => !b.groups[1].startsWith("Copioni"));

  const children = [
    new Paragraph({ text: "Copioni Avatar — " + TITOLO_CORSO, heading: HeadingLevel.TITLE }),
    new Paragraph({ text: "Pilota v2 — formato HeyGen, discorsivo, ~2500-3000 parole/lezione", spacing: { after: 400 } }),
  ];

  for (const { groups, corpo } of lezioni) {
    const [n, titolo] = groups;
    children.push(new Paragraph({ text: `Lezione ${n} — ${titolo}`, heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ text: TITOLO_CORSO, heading: HeadingLevel.HEADING_3 }));
    children.push(new Paragraph({ text: "" }));

    const paragrafi = corpo.split(/\n+/).filter(p => p.trim().length > 0);
    for (const p of paragrafi) {
      children.push(new Paragraph({ text: p.trim(), spacing: { after: 200 } }));
    }
  }

  return new Document({ sections: [{ children }] });
}

// ─── 3. quiz.xlsx ──────────────────────────────────────────────────────────

const HEADERS = [
  "Group", "Type", "Question", "CorAns",
  "Answer1", "Answer2", "Answer3", "Answer4", "Answer5",
  "Answer6", "Answer7", "Answer8", "Answer9", "Answer10",
  "CorrectExplanation", "IncorrectExplanation",
];
const COL_WIDTHS = [17.43, 7.14, 76.43, 5.71, 15.71, 15.71, 15.71, 15.71, 15.71, 15.71, 15.71, 15.71, 15.71, 15.43, 15.43, 17.71];

function parseQuizTesto(testo) {
  const headerRegex = /={10,}\nQUIZ — LEZIONE (\d+): (.+?)\n={10,}\n/g;
  const lezioni = splitLezioni(testo, headerRegex);

  const righe = [];
  for (const { groups, corpo } of lezioni) {
    const [n, titolo] = groups;
    const domandeBlocchi = corpo.split(/\n(?=Domanda \d+\n)/).filter(b => b.trim());

    for (const blocco of domandeBlocchi) {
      const righeBlocco = blocco.split("\n").filter(r => r.trim());
      // riga 0: "Domanda N" -> skip
      const domanda = righeBlocco[1];
      const opzioni = [];
      let idx = 2;
      while (idx < righeBlocco.length && /^\d\.\s/.test(righeBlocco[idx])) {
        opzioni.push(righeBlocco[idx].replace(/^\d\.\s*/, ""));
        idx++;
      }
      const corAnsMatch = righeBlocco[idx].match(/Risposta corretta:\s*(\d)/);
      const corAns = corAnsMatch ? parseInt(corAnsMatch[1], 10) : 1;

      righe.push({
        Group: `Lezione ${n} — ${titolo}`,
        Type: "TMC",
        Question: domanda,
        CorAns: corAns,
        Answer1: opzioni[0] ?? null,
        Answer2: opzioni[1] ?? null,
        Answer3: opzioni[2] ?? null,
        Answer4: opzioni[3] ?? null,
      });
    }
  }
  return righe;
}

async function buildQuizXlsx(righe, percorso) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Questions");
  ws.columns = COL_WIDTHS.map(width => ({ width }));

  const headerRow = ws.addRow(HEADERS);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };

  for (const r of righe) {
    ws.addRow(HEADERS.map(h => {
      if (h === "CorrectExplanation" || h === "IncorrectExplanation") return null;
      return r[h] ?? null;
    }));
  }

  ws.eachRow(row => {
    row.eachCell(cell => {
      cell.alignment = { wrapText: true, vertical: "top" };
    });
  });

  fs.mkdirSync(path.dirname(percorso), { recursive: true });
  await wb.xlsx.writeFile(percorso);
}

// ─── Main ────────────────────────────────────────────────────────────────

async function main() {
  const corsoTxt = fs.readFileSync(path.join(PILOT_DIR, "corso_lezioni.txt"), "utf8");
  const copioniTxt = fs.readFileSync(path.join(PILOT_DIR, "copioni_avatar.txt"), "utf8");
  const quizTxt = fs.readFileSync(path.join(PILOT_DIR, "quiz.txt"), "utf8");

  const corsoDoc = buildCorsoDocx(corsoTxt);
  const corsoBuf = await Packer.toBuffer(corsoDoc);
  fs.writeFileSync(path.join(PILOT_DIR, "corso.docx"), corsoBuf);
  console.log("✅ corso.docx scritto");

  const copioniDoc = buildCopioniDocx(copioniTxt);
  const copioniBuf = await Packer.toBuffer(copioniDoc);
  fs.writeFileSync(path.join(PILOT_DIR, "copioni_avatar.docx"), copioniBuf);
  console.log("✅ copioni_avatar.docx scritto");

  const righeQuiz = parseQuizTesto(quizTxt);
  await buildQuizXlsx(righeQuiz, path.join(PILOT_DIR, "quiz.xlsx"));
  console.log(`✅ quiz.xlsx scritto (${righeQuiz.length} domande)`);
}

main().catch(e => { console.error(e); process.exit(1); });
