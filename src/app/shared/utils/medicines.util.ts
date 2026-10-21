/** One prescribed medicine, as shown in a row of the prescription table */
export interface MedicineRow {
  name: string;
  dosage?: string;
}

/**
 * Turns the record's `medicine` and `doses` text into one row per medicine.
 * Current format: one medicine per line, with the doses on matching lines.
 * Older records used ";" or "," between medicines; a dose may itself contain commas
 * ("1 tablet, twice daily"), so doses are only split on commas when the counts line up.
 */
export function parseMedicines(medicine?: string | null, doses?: string | null): MedicineRow[] {
  const names = splitItems(medicine, true);
  if (names.length === 0) return [];

  // One dose line per medicine: keep empty lines so a medicine without a dose doesn't take the next one's
  const doseText = String(doses ?? '').replace(/\r/g, '').trim();
  let dosages = doseText.includes('\n') ? doseText.split('\n').map(s => s.trim()) : splitItems(doses, false);
  if (dosages.length === 1 && names.length > 1) {
    const byComma = dosages[0].split(',').map(s => s.trim()).filter(Boolean);
    if (byComma.length === names.length) dosages = byComma;
  }

  return names.map((name, i) => ({
    name,
    dosage: dosages[i] || (dosages.length === 1 ? dosages[0] : undefined)
  }));
}

function splitItems(text: string | null | undefined, allowComma: boolean): string[] {
  const value = String(text ?? '').trim();
  if (!value) return [];
  const clean = (parts: string[]) => parts.map(s => s.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim()).filter(Boolean);

  const lines = clean(value.split(/\r?\n/));
  if (lines.length > 1) return lines;
  const bySemicolon = clean(value.split(';'));
  if (bySemicolon.length > 1) return bySemicolon;
  return allowComma ? clean(value.split(',')) : lines;
}
