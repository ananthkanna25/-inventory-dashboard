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

const isLowPriorityDescription = (description) => {
  const lower = description.toLowerCase();
  return lowPriorityTerms.some((term) => lower.includes(term));
};

export const getPartMatches = (fullText) => {
  return fullText.match(partNumberPattern) || [];
};

export const getUniqueParts = (partMatches) => {
  return [...new Set(partMatches)];
};

export const sortParts = (parts) => {
  return [...parts].sort((a, b) =>
    a.partNumber.localeCompare(b.partNumber)
  );
};

export const parseBomParts = (fullText, orderQty = 0) => {
  // Normalize whitespace (preserve word boundaries, no splitting into lines)
  const normalized = fullText
    .replace(/\s+/g, " ")
    .trim();

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
    if (isLowPriorityDescription(description)) continue;

    description = description.replace(/\s*\|\s*/g, " ").replace(/\s{2,}/g, " ").trim();

    if (!description || /^(?:Page|Date|Qty Needed|Units|Component Item Number|Description)/i.test(description)) {
      continue;
    }

    rows.push({
      partNumber,
      description,
      qtyPerUnit,
      unit,
      requiredQty: orderQty * qtyPerUnit,
      onHand: 0,
    });
  }

  return rows;
};
