// Best-effort English etymology for the 16 figure names (Lahyan, Jamaat,
// etc.). NOT sourced from Ramal Calculation.xlsx or Ramal-jyotish.pdf --
// neither gives an English translation of the figure names themselves (the
// workbook's own "Meaning" sheet, extracted verbatim into glossary.ts, only
// translates generic terminology: Dakhil/Kharij/Sabit/Munqalib, gender,
// direction, element -- never the proper names). This is Claude's own
// general Arabic/Urdu-etymology guesswork, kept in its own file and clearly
// separate from every other (sourced) field on Figure, and confidence-
// tagged so the UI never presents a guess as verified fact. Owner request
// (2026-08-25): "add english explanation for such words."
export type GlossConfidence = "high" | "medium" | "uncertain";

export interface FigureNameGloss {
  gloss: string;
  confidence: GlossConfidence;
}

export const FIGURE_NAME_GLOSS: Record<number, FigureNameGloss> = {
  1: { gloss: "No confident translation identified", confidence: "uncertain" },
  2: { gloss: "“The inward grasp” (qabḍ = grasp/seizure + dākhil = inward)", confidence: "medium" },
  3: { gloss: "“The outward grasp” (qabḍ = grasp/seizure + khārij = outward)", confidence: "medium" },
  4: { gloss: "“Group / assembly” (jamā‘ah)", confidence: "high" },
  5: { gloss: "“Joy” (faraḥ)", confidence: "high" },
  6: { gloss: "Possibly “knot / restraint” (‘uqla)", confidence: "uncertain" },
  7: { gloss: "No confident translation identified", confidence: "uncertain" },
  8: { gloss: "“Redness” (ḥamra)", confidence: "high" },
  9: { gloss: "“Whiteness” (bayāḍ)", confidence: "high" },
  10: { gloss: "“The outward victory/support” (nuṣra + khārij = outward)", confidence: "medium" },
  11: { gloss: "“The inward victory/support” (nuṣra + dākhil = inward)", confidence: "medium" },
  12: { gloss: "No confident translation identified for the root “Uputul”", confidence: "uncertain" },
  13: { gloss: "“Pure / clean” (naqī)", confidence: "medium" },
  14: { gloss: "No confident translation identified for the root “Uputul”", confidence: "uncertain" },
  15: { gloss: "“Conjunction / gathering” (ijtimā‘)", confidence: "high" },
  16: { gloss: "“Path / way” (ṭarīq)", confidence: "high" },
};
