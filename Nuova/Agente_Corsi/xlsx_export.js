/**
 * Export quiz in formato XLSX compatibile con l'import "Question Bank" di LearnWorlds.
 *
 * IMPORTANTE: il file deve usare la shared string table di Excel (xl/sharedStrings.xml,
 * celle t="s"). I file generati con stringhe inline (t="inlineStr", es. output diretto
 * di openpyxl) vengono rifiutati dall'importer di LearnWorlds. ExcelJS scrive di
 * default con shared strings, quindi va bene così.
 *
 * Inoltre le colonne CorrectExplanation/IncorrectExplanation vanno lasciate VUOTE:
 * se valorizzate, l'upload del file su LearnWorlds fallisce (verificato manualmente).
 */

import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

const HEADERS = [
  "Group", "Type", "Question", "CorAns",
  "Answer1", "Answer2", "Answer3", "Answer4", "Answer5",
  "Answer6", "Answer7", "Answer8", "Answer9", "Answer10",
  "CorrectExplanation", "IncorrectExplanation",
];

const COL_WIDTHS = [17.43, 7.14, 76.43, 5.71, 15.71, 15.71, 15.71, 15.71, 15.71, 15.71, 15.71, 15.71, 15.71, 15.43, 15.43, 17.71];

/**
 * @param {Array<object>} righe - righe in formato LearnWorlds (Group, Type, Question, CorAns, Answer1-10, ...)
 * @param {string} percorso - path completo del file .xlsx da scrivere
 */
export async function esportaQuizXlsx(righe, percorso) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Questions");

  ws.columns = COL_WIDTHS.map(width => ({ width }));

  const headerRow = ws.addRow(HEADERS);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };

  for (const r of righe) {
    ws.addRow(HEADERS.map(h => {
      // CorrectExplanation/IncorrectExplanation sempre vuote (vedi nota in testa al file)
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
  return percorso;
}
