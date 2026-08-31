/** Splits on newlines and/or commas so both "one per line" and "Voc 1, Voc 2, ..." pastes work. */
export const parseManualItems = (text: string): string[] =>
  Array.from(new Set(text.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)));
