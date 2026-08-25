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

/**
 * Item 3 (कष्टकारक साल / troublesome years), keyed by figure id 1-16.
 * Source (Ramal-jyotish.pdf p.13) gives six groups of shakal glyphs, each
 * with its own troublesome-age list, for whichever figure lands in Place 1
 * (the first Mother Figure). The glyphs themselves were illegible in the
 * original scan (see CLAUDE.md/judgement.ts history) -- this table was
 * rebuilt from a page-13 transcription the owner supplied with each shakal
 * hand-encoded as a 4-digit bit string ("-" = 1, "0" = 0, tez/vayu/jal/
 * prithvi order), then matched 1:1 against FIGURES' own patterns: all 16
 * figures accounted for exactly once, zero ambiguity, zero leftover.
 */
export const TROUBLESOME_YEARS_TABLE: Record<number, number[]> = {
  // Rule 1 -- Lahyan(1), Faraha(5), Bayaz(9), Tariq(16)
  1: [8, 12, 16, 24, 32, 42, 48, 62, 66, 74, 82],
  5: [8, 12, 16, 24, 32, 42, 48, 62, 66, 74, 82],
  9: [8, 12, 16, 24, 32, 42, 48, 62, 66, 74, 82],
  16: [8, 12, 16, 24, 32, 42, 48, 62, 66, 74, 82],
  // Rule 2 -- Qabz-ul-Dakhil(2), Ukla(6), Nusrat-ul-Kharij(10), Uputul-Dakhil(14)
  2: [12, 16, 24, 28, 32, 42, 64, 66, 68, 78, 84],
  6: [12, 16, 24, 28, 32, 42, 64, 66, 68, 78, 84],
  10: [12, 16, 24, 28, 32, 42, 64, 66, 68, 78, 84],
  14: [12, 16, 24, 28, 32, 42, 64, 66, 68, 78, 84],
  // Rule 3 -- Ankeesh(7), Ijtima(15)
  7: [8, 12, 16, 24, 28, 32, 42, 48, 62, 74, 82],
  15: [8, 12, 16, 24, 28, 32, 42, 48, 62, 74, 82],
  // Rule 4 -- Jamaat(4), Humra(8), Uputul-Kharij(12), Naqi(13)
  4: [12, 20, 23, 27, 28, 36, 44, 60, 69, 70],
  8: [12, 20, 23, 27, 28, 36, 44, 60, 69, 70],
  12: [12, 20, 23, 27, 28, 36, 44, 60, 69, 70],
  13: [12, 20, 23, 27, 28, 36, 44, 60, 69, 70],
  // Rule 5 -- Qabz-ul-Kharij(3)
  3: [14, 16, 18, 20, 22, 26, 34, 38, 64, 66, 68, 70, 82],
  // Rule 6 -- Nusrat-ul-Dakhil(11)
  11: [6, 14, 18, 20, 22, 26, 34, 46, 48, 64, 68, 70, 73, 77],
};

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
