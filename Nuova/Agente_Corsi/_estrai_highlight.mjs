// Estrae dal docx le porzioni di testo evidenziate (w:highlight), raggruppate per colore.
import fs from "fs";
import path from "path";
import JSZip from "jszip";

const file = process.argv[2];
const buf = fs.readFileSync(file);
const zip = await JSZip.loadAsync(buf);
const xml = await zip.file("word/document.xml").async("string");

// Spezza in run <w:r ...> ... </w:r>
const runs = xml.match(/<w:r\b[\s\S]*?<\/w:r>/g) || [];
const out = []; // {color, text}
for (const r of runs) {
  const hl = r.match(/<w:highlight\s+w:val="([^"]+)"/);
  const color = hl ? hl[1] : "none";
  // testo: tutti i <w:t>...</w:t>
  const texts = [...r.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map(m => m[1]);
  const text = texts.join("")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
  if (text.length === 0) continue;
  if (out.length && out[out.length - 1].color === color) out[out.length - 1].text += text;
  else out.push({ color, text });
}

function dump(colorMatch, label) {
  const items = out.filter(o => colorMatch.includes(o.color));
  console.log(`\n========== ${label} (${items.length} frammenti) ==========`);
  items.forEach((it, i) => console.log(`\n[${i + 1}] (${it.color})\n${it.text.trim()}`));
}

dump(["red", "darkRed", "magenta"], "ROSSO (sbagliate)");
dump(["green", "darkGreen", "brightGreen"], "VERDE (corrette)");
dump(["yellow", "cyan", "blue", "darkYellow"], "ALTRI COLORI");
console.log(`\n========== Totale run evidenziati: ${out.filter(o=>o.color!=="none").length} ==========`);
