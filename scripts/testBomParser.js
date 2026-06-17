import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseBomParts } from "../src/utils/bomParser.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pdfPath = path.join(__dirname, "../public/sample-boms/M120-1084_BOM (1).pdf");

async function parseBomPdf() {
  console.log(`Reading PDF: ${pdfPath}\n`);

  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) }).promise;
  console.log(`Total pages: ${pdf.numPages}\n`);

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    console.log(`\n========== PAGE ${pageNum} ==========\n`);

    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    const fullText = textContent.items.map((item) => item.str).join(" ");
    const rows = parseBomParts(fullText, 0, true);

    console.log("BOM Rows from fullText parsing:\n");
    console.log("PartNumber          | Qty    | Description                              | Unit | Category");
    console.log("-".repeat(105));
    for (const row of rows) {
      const desc = (row.description || "").substring(0, 32).padEnd(32);
      console.log(`${row.partNumber.padEnd(19)} | ${String(row.qtyPerUnit).padEnd(6)} | ${desc} | ${row.unit.padEnd(2)} | ${row.category}`);
    }

    console.log(`\nTotal rows parsed: ${rows.length}`);
  }
}

parseBomPdf().catch(console.error);
