// Best-effort English etymology for the 16 figure names (Lahyan, Jamaat,
// etc.). NOT sourced from Ramal Calculation.xlsx or Ramal-jyotish.pdf --
// neither gives an English translation of the figure names themselves (the
// workbook's own "Meaning" sheet, extracted verbatim into glossary.ts, only
// translates generic terminology: Dakhil/Kharij/Sabit/Munqalib, gender,
// direction, element -- never the proper names). Most entries are Claude's
// own general Arabic/Urdu-etymology guesswork, kept in its own file and
// clearly separate from every other (sourced) field on Figure, and
// confidence-tagged so the UI never presents a guess as verified fact.
// Owner request (2026-08-25): "add english explanation for such words."
//
// Five entries (1 Lahyan, 6 Ukla, 7 Ankeesh, 12 Uputul-Kharij, 14
// Uputul-Dakhil) were originally left "uncertain" -- no confident guess
// could be made -- and were corrected directly by the owner (2026-08-26),
// bumped to "high" confidence on that basis (an owner-supplied translation,
// not a re-derived guess -- same standing as the item 3 troublesome-years
// table and the Dhruvank Questions text elsewhere in this project). The
// owner's translation of the "Uputul" root traces it to "Ataba" (threshold);
// this is a gloss correction, not a change to the sourced `sourceName`
// field itself (Uputul-Kharij/Uputul-Dakhil in figures.ts, unchanged).
export type GlossConfidence = "high" | "medium" | "uncertain";

export interface FigureNameGloss {
  gloss: string;
  confidence: GlossConfidence;
  /** "owner" = supplied/confirmed directly by the project owner, not a re-derived guess. Absent = Claude's own etymology guess (the default/original case for this whole file). */
  source?: "owner";
}

export const FIGURE_NAME_GLOSS: Record<number, FigureNameGloss> = {
  1: { gloss: "“Beard” (laḥyah); traditional Indian association: “Eloquent One”", confidence: "high", source: "owner" },
  2: { gloss: "“The inward grasp” (qabḍ = grasp/seizure + dākhil = inward)", confidence: "medium" },
  3: { gloss: "“The outward grasp” (qabḍ = grasp/seizure + khārij = outward)", confidence: "medium" },
  4: { gloss: "“Group / assembly” (jamā‘ah)", confidence: "high" },
  5: { gloss: "“Joy” (faraḥ)", confidence: "high" },
  6: { gloss: "“Bond / Knot / Closed Circle / Link” (‘uqla)", confidence: "high", source: "owner" },
  7: { gloss: "“Reversed / Inverted / Turned”", confidence: "high", source: "owner" },
  8: { gloss: "“Redness” (ḥamra)", confidence: "high" },
  9: { gloss: "“Whiteness” (bayāḍ)", confidence: "high" },
  10: { gloss: "“The outward victory/support” (nuṣra + khārij = outward)", confidence: "medium" },
  11: { gloss: "“The inward victory/support” (nuṣra + dākhil = inward)", confidence: "medium" },
  12: { gloss: "“Outer Threshold” (Ataba Kharij -- ‘ataba = threshold + khārij = outer)", confidence: "high", source: "owner" },
  13: { gloss: "“Pure / clean” (naqī)", confidence: "medium" },
  14: { gloss: "“Inner Threshold” (Ataba Dakhil -- ‘ataba = threshold + dākhil = inner)", confidence: "high", source: "owner" },
  15: { gloss: "“Conjunction / gathering” (ijtimā‘)", confidence: "high" },
  16: { gloss: "“Path / way” (ṭarīq)", confidence: "high" },
};
