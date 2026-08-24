// Question-result judgement. Source: Prediction!D42:G45 formulas, plus the
// confirming notes at Prediction!row55 ("Alternately for Agam question if
// you get Nirgam answer then it is no") and row56 ("For Nirgam Question if
// it get Agam Answer in Auspicious sheet then also it is No").
//
// IMPORTANT divergence from the master spec's descriptive pseudocode (§14),
// documented rather than silently resolved: the spec's prose describes the
// Agam/Nirgam test as "result.nature in {DAKHIL, SABIT}" / "{KHARIJ,
// MUNQALIB}" -- a 4-symbol figure classification. The actual workbook
// formula (Prediction!G42) tests ONLY the first symbol (tez position) of
// the result figure. Rows 55-56 restate the same rule the other way round,
// in terms of the result figure's own Agam/Nirgam Type (as classified in
// Stihir Kundali!row9): "Agam question + Nirgam-type answer -> No" and
// "Nirgam question + Agam-type answer -> No" -- i.e. exactly the else
// branches below, made explicit rather than left as an implicit fallthrough.
//
// These two phrasings are not independent rules to reconcile: verified
// against all 16 Stihir Kundali figures, first symbol "-" <=> Type "AGAM"
// and first symbol "0" <=> Type "NIRGAM" with zero exceptions (a complete
// bijection), so testing resultFigure[0] directly and looking up the
// matching figure's Type always agree. This engine uses the cheaper
// first-symbol test; resultNature() below exposes the Type-based reading
// for the trace/UI, so the practitioner sees the domain-meaningful framing
// rather than raw "-"/"0" symbols.
import { FIGURES } from "@/lib/data/figures";
import { patternsEqual, addFigure } from "@/lib/engines/figure";
import type { AgamNirgam, AnswerStatus, FigurePattern, PrashnaChart } from "@/lib/types";

export interface JudgementResult {
  questionHouseFigure: FigurePattern;
  house1Figure: FigurePattern;
  resultFigure: FigurePattern;
  sthanBali: boolean;
  /** The Agam/Nirgam Type of the Stihir Kundali figure the result matches, when found. */
  resultType: AgamNirgam | null;
  status: Extract<AnswerStatus, "YES" | "NO">;
}

/** Type of the Sthir figure whose pattern equals the result -- always found for a valid FigurePattern (see data-integrity tests). */
export function resultNature(resultFigure: FigurePattern): AgamNirgam | null {
  return FIGURES.find((f) => patternsEqual(f.pattern, resultFigure))?.type ?? null;
}

/** House 5 is exempt from the House-1 addition (Prediction!D42 IF branch, spec §14 priority 3). */
export function calculateQuestion(
  questionHouse: number,
  questionType: AgamNirgam,
  chart: PrashnaChart
): JudgementResult {
  const questionHouseFigure = chart[questionHouse];
  const house1Figure = chart[1];

  const resultFigure: FigurePattern =
    questionHouse === 5 ? questionHouseFigure : addFigure(questionHouseFigure, house1Figure);

  const sthirFigure = FIGURES.find((f) => f.id === questionHouse);
  if (!sthirFigure) {
    throw new Error(`Question house out of range: ${questionHouse}`);
  }
  const sthanBali = patternsEqual(resultFigure, sthirFigure.pattern);

  let status: "YES" | "NO";
  if (sthanBali) {
    status = "YES";
  } else if (questionType === "AGAM" && resultFigure[0] === "-") {
    status = "YES";
  } else if (questionType === "NIRGAM" && resultFigure[0] === "0") {
    status = "YES";
    // Else branches, made explicit per Prediction!row55-56 rather than left
    // as an implicit fallthrough:
    //   Agam question + Nirgam-type result (row55) -> No
    //   Nirgam question + Agam-type result (row56)  -> No
  } else {
    status = "NO";
  }

  return { questionHouseFigure, house1Figure, resultFigure, sthanBali, resultType: resultNature(resultFigure), status };
}
