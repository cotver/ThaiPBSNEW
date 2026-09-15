export function buildSlugLookupKeys(value: string): string[] {
  const decodedValues = [value];

  // Next normally provides a decoded route param, but copied URLs and legacy
  // records can contain one or two additional layers of percent encoding.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const current = decodedValues.at(-1) || "";

    try {
      const decoded = decodeURIComponent(current);
      if (decoded === current) break;
      decodedValues.push(decoded);
    } catch {
      break;
    }
  }

  const keys = new Set<string>();

  for (const decoded of decodedValues) {
    const whitespaceVariants = [decoded, decoded.trim(), decoded.trim().replace(/\s+/gu, " ")];

    for (const whitespaceVariant of whitespaceVariants) {
      for (const unicodeVariant of [
        whitespaceVariant,
        whitespaceVariant.normalize("NFC"),
        whitespaceVariant.normalize("NFD"),
      ]) {
        if (!unicodeVariant) continue;

        keys.add(unicodeVariant);
        keys.add(unicodeVariant.replace(/ /g, "%20"));
        keys.add(encodeURIComponent(unicodeVariant));
      }
    }
  }

  return [...keys];
}
