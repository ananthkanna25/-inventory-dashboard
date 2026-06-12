export const getPartMatches = (fullText) => {
  return fullText.match(/[A-Z]-\d{5}(?:[-/][A-Z0-9]+)*/g) || [];
};

export const getUniqueParts = (partMatches) => {
  return [...new Set(partMatches)];
};
export const sortParts = (parts) => {
  return [...parts].sort((a, b) =>
    a.partNumber.localeCompare(b.partNumber)
  );
};