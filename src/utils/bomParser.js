const partNumberPattern = /\b(?:[A-Z]-\d+(?:[-/.][A-Z0-9]+)*|[A-Z]\d+[-/]\d+(?:[-/.][A-Z0-9]+)*|\d+[A-Z]\d*(?:[-/][A-Z0-9]+)*|\d+-[A-Z]+)\b/g;

const pageHeaderPatterns = /^(?:Date|Page|PQ Controls|Indented Bill of Material|Component Item Number|Qty Needed|Units|Description)/i;

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

const dedupeRowsByPartNumber = (rows) => {
  const rowsByPartNumber = new Map();
  for (const row of rows) {
    if (!rowsByPartNumber.has(row.partNumber)) {
      rowsByPartNumber.set(row.partNumber, row);
    }
  }
  return [...rowsByPartNumber.values()];
};

export const parseBomParts = (fullText, orderQty = 0, debug = false) => {
  return parseBomRows(fullText, orderQty, debug);
};

export const parseBomRows = (fullText, orderQty = 0, debug = false) => {
  const normalized = fullText
    .replace(/\s+/g, " ")
    .trim();

  const allPartMatches = normalized.match(partNumberPattern) || [];
  if (debug) {
    console.log(`[BOM Parser] Total part number candidates: ${allPartMatches.length}`);
  }

  const partPattern = `(?:${partNumberPattern.source})`;
  
  // Find all row starts: partNumber level qty
  const rowStartRegex = new RegExp(
    `\\b(${partPattern})\\s+(\\d{1,2})\\s+(\\d+(?:\\.\\d{1,4})?)`,
    "g"
  );

  const rows = [];
  const skipped = [];
  const matches = [];
  
  // Collect all matches
  let match;
  while ((match = rowStartRegex.exec(normalized)) !== null) {
    matches.push(match);
  }

  // Process each match - description extends until next row start
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const partNumber = match[1].trim();
    const level = Number(match[2]);
    const qtyPerUnit = Number(match[3]);
    
    // Find where description starts (after qty)
    const descStart = match.index + match[0].length;
    let descEnd = normalized.length;
    
    // Description ends at next row start
    if (i + 1 < matches.length) {
      descEnd = matches[i + 1].index;
    }
    
    // Also check for Date: or Page: markers
    const endMarkerMatch = /\bDate:|Page:/i.exec(normalized.substring(descStart));
    if (endMarkerMatch) {
      descEnd = Math.min(descEnd, descStart + endMarkerMatch.index);
    }
    
    let fullDesc = normalized.substring(descStart, descEnd).trim();
    
    if (!fullDesc) {
      if (debug) skipped.push({ partNumber, description: "[empty]", reason: "No description found" });
      continue;
    }

    // Extract unit from the description
    const unitMatch = /\s+(EA|A\/R|FT)\b/.exec(fullDesc);
    let unit = "EA";
    let description = fullDesc;
    
    if (unitMatch) {
      unit = unitMatch[1];
      description = fullDesc.substring(0, unitMatch.index).trim();
    }

    if (!description) {
      if (debug) skipped.push({ partNumber, description: "[empty]", reason: "Description is empty after extracting unit" });
      continue;
    }

    description = description.replace(/\s*\|\s*/g, " ").replace(/\s{2,}/g, " ").trim();

    if (!description) {
      if (debug) skipped.push({ partNumber, description: "[empty]", reason: "Description is empty after normalization" });
      continue;
    }

    if (pageHeaderPatterns.test(description)) {
      if (debug) skipped.push({ partNumber, description, reason: "Page header pattern" });
      continue;
    }

    rows.push({
      partNumber,
      level,
      qtyPerUnit,
      description,
      unit,
      requiredQty: orderQty * qtyPerUnit,
      onHand: 0,
      category: getPartCategory({
        partNumber,
        description,
      }),
    });
  }

  const dedupedRows = dedupeRowsByPartNumber(rows);
  
  if (debug) {
    console.log(`[BOM Parser] Total parsed rows: ${rows.length}`);
    console.log(`[BOM Parser] Final rows count: ${dedupedRows.length}`);
    if (skipped.length > 0) {
      console.log(`[BOM Parser] Skipped candidates (${skipped.length}):`);
      skipped.forEach(({ partNumber, description, reason }) => {
        console.log(`  - ${partNumber} | ${description} -> ${reason}`);
      });
    }
  }

  return dedupedRows;
};
export const getPartCategory = (part) => {
  const description = part.description.toLowerCase();

  if (
    description.includes("electrical") ||
    description.includes("circuit") ||
    description.includes("switch") ||
    description.includes("pot") ||
    description.includes("pcb") ||
    description.includes("board")
  ) {
    return "Electrical";
  }

  if (
    description.includes("housing") ||
    description.includes("shaft") ||
    description.includes("gear") ||
    description.includes("cam") ||
    description.includes("knob") ||
    description.includes("plate") ||
    description.includes("spring") ||
    description.includes("sleeve") ||
    description.includes("ring") ||
    description.includes("gasket") ||
    description.includes("plug")
  ) {
    return "Mechanical";
  }

  if (
    description.includes("assy") ||
    description.includes("assembly") ||
    description.includes("subassembly")
  ) {
    return "Sub Assembly";
  }

  if (
    description.includes("screw") ||
    description.includes("washer") ||
    description.includes("nut") ||
    description.includes("fastener") ||
    description.includes("spacer")
  ) {
    return "Hardware";
  }

  if (
    description.includes("wire") ||
    description.includes("cable") ||
    description.includes("terminal")
  ) {
    return "Wires";
  }

  if (
    description.includes("grease") ||
    description.includes("loctite") ||
    description.includes("label") ||
    description.includes("decal") ||
    description.includes("adhesive") ||
    description.includes("tape")
  ) {
    return "Consumable";
  }

  return "Other";
};