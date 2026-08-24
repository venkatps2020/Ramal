// Reference data for the judgement rule library (Ramal-jyotish.pdf, "फलादेश"
// and "प्रगत रमल" sections, items 1-42). Kept separate from the Excel-derived
// data in this folder because its authority is the PDF (conceptual/source
// material per master spec §2), not the workbook.

/**
 * Item 27's "abjad order" -- a DIFFERENT 16-figure sequence than the normal
 * Stihir Kundali house order, used only for the thief-appearance lookup.
 * Verified against the source's own worked example (Humra at abjad
 * position 2 -> Sthir house 2 = Qabz-ul-Dakhil, matching the text exactly).
 * Index i (0-based) = abjad position i+1 -> figure id.
 */
export const ABJAD_ORDER: number[] = [1, 8, 10, 9, 3, 15, 12, 7, 6, 2, 5, 11, 13, 14, 16, 4];

/** Item 2 (आयु मर्यादा / life expectancy), keyed by [nature, isShubh]. */
export const AGE_EXPECTANCY_TABLE: Record<string, { age: string; health: string }> = {
  "DAKHIL:shubh": { age: "80+ years", health: "good" },
  "DAKHIL:ashubh": { age: "80+ years", health: "so-so (नरमगरम)" },
  "SABIT:shubh": { age: "70+ years", health: "good" },
  "SABIT:ashubh": { age: "70+ years", health: "so-so (नरमगरम)" },
  "MUNQALIB:shubh": { age: "50+ years", health: "good" },
  "MUNQALIB:ashubh": { age: "50+ years", health: "so-so (नरमगरम)" },
  "KHARIJ:shubh": { age: "short life span", health: "ok" },
  "KHARIJ:ashubh": { age: "short life span", health: "poor" },
};
