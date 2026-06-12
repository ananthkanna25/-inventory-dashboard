import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pdfPath = path.join(__dirname, "../public/sample-boms/M120-1084_BOM (1).pdf");

const partNumberPattern = /\b(?:[A-Z]-\d{5}(?:[-/][A-Z0-9]+)*|[A-Z0-9]{6,}(?:[-/][A-Z0-9]+)*)\b/g;

const lowPriorityTerms = [
  "wire",
  "wires",
  "washer",
  "nut",
  "screw",
  "loctite",
  "grease",
  "label",
  "decal",
  "procedure",
  "terminal",
];

const isLowPriority = (text) => {
  const lower = text.toLowerCase();
  return lowPriorityTerms.some((term) => lower.includes(term));
};


async function parseBomPdf() {
  console.log(`Reading PDF: ${pdfPath}\n`);

  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) }).promise;
  console.log(`Total pages: ${pdf.numPages}\n`);

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    console.log(`\n========== PAGE ${pageNum} ==========\n`);

    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Extract full text from PDF
    let fullText = textContent.items.map((item) => item.str).join(" ");

    // Normalize whitespace (preserve word boundaries, no splitting into lines)
    const normalized = fullText
      .replace(/\s+/g, " ")
      .trim();

    // Regex pattern: partNumber level qty description unit
    const partPattern = `(?:${partNumberPattern.source})`;
    const bomRowRegex = new RegExp(
      `\\b(${partPattern})\\s+(\\d+)\\s+(\\d+\\.\\d{4})\\s+(.+?)\\s+(EA|A\\/R|FT)\\b`,
      "gi"
    );

    const rows = [];
    for (const match of normalized.matchAll(bomRowRegex)) {
      const partNumber = match[1].trim();
      const level = Number(match[2]);
      const qtyPerUnit = Number(match[3]);
      let description = match[4].trim();
      const unit = match[5].toUpperCase();

      if (!partNumber || !description) continue;
      if (isLowPriority(description)) continue;

      description = description.replace(/\s*\|\s*/g, " ").replace(/\s{2,}/g, " ").trim();

      if (!description || /^(?:Page|Date|Qty Needed|Units|Component Item Number|Description)/i.test(description)) {
        continue;
      }

      rows.push({
        partNumber,
        level,
        qtyPerUnit,
        description,
        unit,
      });
    }

    console.log("BOM Rows from fullText parsing:\n");
    console.log("PartNumber          | Lvl | Qty    | Description                              | Unit");
    console.log("-".repeat(95));
    for (const row of rows) {
      const desc = (row.description || "").substring(0, 38).padEnd(38);
      console.log(`${row.partNumber.padEnd(19)} | ${String(row.level).padEnd(3)} | ${String(row.qtyPerUnit).padEnd(6)} | ${desc} | ${row.unit}`);
    }

    console.log(`\nTotal rows: ${rows.length}`);
  }
}

parseBomPdf().catch(console.error);
