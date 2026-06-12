const partNumberPattern = /\b(?:[A-Z]-\d{5}(?:[-/][A-Z0-9]+)*|[A-Z0-9]{6,}(?:[-/][A-Z0-9]+)*)\b/g;

const headerStopPhrases = [
  "Date:",
  "Date",
  "Page",
  "PQ Controls",
  "Indented Bill of Material",
  "Component Item Number",
  "Qty Needed",
  "Units",
  "Bill of Material",
  "Description / Comment",
  "Description/Comment",
];

const headerSkipWords = [
  "component item number",
  "description",
  "qty needed",
  "units",
  "bill of material",
  "page",
  "date",
  "pq controls",
  "indented bill of material",
  "subassembly",
];

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
  const normalized = fullText.replace(/\r\n?/g, "\n");
  const matches = [...normalized.matchAll(partNumberPattern)]
    .filter((match) => {
      const token = match[0].trim();
      if (!token || token.length < 5) return false;
      if (!/\d/.test(token)) return false;
      const lowerToken = token.toLowerCase();
      return !headerSkipWords.includes(lowerToken);
    });

  const uniqueMatches = [];
  const seen = new Set();
  for (const match of matches) {
    if (!seen.has(match[0])) {
      seen.add(match[0]);
      uniqueMatches.push({ partNumber: match[0], index: match.index });
    }
  }

  const rows = [];
  for (let i = 0; i < uniqueMatches.length; i++) {
    const current = uniqueMatches[i];
    const next = uniqueMatches[i + 1];
    const chunk = normalized.slice(current.index, next ? next.index : normalized.length);
    const row = parseBomChunk(current.partNumber, chunk, orderQty);
    if (row && !isLowPriorityDescription(row.description)) {
      rows.push(row);
    }
  }

  return rows;
};

const parseBomChunk = (partNumber, chunk, orderQty) => {
  let body = chunk.replace(partNumber, "").trim();

  const stopPattern = new RegExp(`\\b(?:${headerStopPhrases.map(escapeRegExp).join("|")})\\b`, "i");
  const stopMatch = stopPattern.exec(body);
  if (stopMatch) {
    body = body.slice(0, stopMatch.index).trim();
  }

  body = body.replace(/\s+/g, " ").trim();
  if (!body) return null;

  const qtyInfo = parseQtyPerUnit(body);
  let description = body;
  if (qtyInfo.matchText) {
    description = description.replace(qtyInfo.matchText, "");
  }

  description = description.replace(/^\d+\s*/, "");
  description = description.replace(/\b(EA|PC|PCS|Each|EA\.|PC\.)\b/gi, "");
  description = description.replace(/(?:Component Item Number|Description\s*\/\s*Comment|Description\/Comment|Qty Needed|Units|Bill of Material|Page|Date|PQ Controls|Indented Bill of Material)/gi, "");
  description = description.replace(/\s{2,}/g, " ").trim();
  description = description.replace(/(?:Date:|Page|PQ Controls|Indented Bill of Material|Component Item Number|Qty Needed).*/gi, "").trim();

  if (!description || description.length < 3) return null;
  const lowerDescription = description.toLowerCase();
  if (headerSkipWords.some((word) => lowerDescription.includes(word))) return null;

  return {
    partNumber,
    description,
    qtyPerUnit: qtyInfo.value,
    requiredQty: orderQty * qtyInfo.value,
    onHand: 0,
  };
};

const parseQtyPerUnit = (text) => {
  const decimalMatch = text.match(/\b\d+\.\d{4}\b/);
  if (decimalMatch) {
    return { value: Number(decimalMatch[0]), matchText: decimalMatch[0] };
  }

  const integerMatch = text.match(/\b\d+\b/);
  if (integerMatch) {
    return { value: Number(integerMatch[0]), matchText: integerMatch[0] };
  }

  return { value: 1, matchText: "" };
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
