// Orchestrates the full deterministic pipeline: draw -> Kundali -> guards ->
// judgement -> timing -> trace. Mirrors master spec §16's required trace
// contents. Pure function: same input always produces the same output.
import { buildPrashnaKundali } from "@/lib/engines/kundali";
import { calculateQuestion } from "@/lib/engines/prediction";
import { computeTiming } from "@/lib/engines/timing";
import { computeQuickDuration } from "@/lib/engines/quick-duration";
import { FIGURES } from "@/lib/data/figures";
import type { AgamNirgam, PredictionInput, PredictionResult, TraceStep } from "@/lib/types";

function figureLabel(id: number): string {
  const f = FIGURES.find((fig) => fig.id === id);
  return f ? `${f.sourceName} (#${id})` : `#${id}`;
}

export function runPrediction(input: PredictionInput): PredictionResult {
  const trace: TraceStep[] = [];
  const { draw, questionHouse, questionType } = input;

  trace.push({
    label: "Four Mother Figures drawn",
    detail: draw.figureIds.map((id) => figureLabel(id)).join(", "),
    inputs: { figureIds: draw.figureIds },
  });

  const { chart, status: kundaliStatus } = buildPrashnaKundali(draw.figureIds);

  trace.push({
    label: "Places 1-8 constructed",
    detail: "Places 1-4 = the four Mother Figures; Places 5-8 = the row-wise transpose across them.",
    output: { 1: chart[1], 2: chart[2], 3: chart[3], 4: chart[4], 5: chart[5], 6: chart[6], 7: chart[7], 8: chart[8] },
  });

  trace.push({
    label: "Places 9-16 constructed",
    detail: "9=1+2, 10=3+4, 11=5+6, 12=7+8, 13=9+10, 14=11+12, 15=13+14, 16=15+1 (four-symbol addition).",
    output: { 9: chart[9], 10: chart[10], 11: chart[11], 12: chart[12], 13: chart[13], 14: chart[14], 15: chart[15], 16: chart[16] },
  });

  trace.push({
    label: "Validation guards",
    detail: `Checked Place 15 (three/four-identical) and Place 1 (four-identical). Status: ${kundaliStatus}.`,
    output: { status: kundaliStatus },
  });

  if (kundaliStatus !== "OK") {
    return {
      status: kundaliStatus,
      sthanBali: false,
      questionHouseFigure: null,
      house1Figure: null,
      resultFigure: null,
      timing: null,
      quickDuration: null,
      chart,
      trace,
    };
  }

  if (questionHouse < 1 || questionHouse > 12) {
    trace.push({
      label: "Question house validation failed",
      detail: `House ${questionHouse} is outside the valid 1-12 range for a practitioner question.`,
    });
    return {
      status: "CALCULATION_ERROR",
      sthanBali: false,
      questionHouseFigure: null,
      house1Figure: null,
      resultFigure: null,
      timing: null,
      quickDuration: null,
      chart,
      trace,
    };
  }

  const judgement = calculateQuestion(questionHouse, questionType as AgamNirgam, chart);

  trace.push({
    label: "House-5 exception",
    detail:
      questionHouse === 5
        ? "Question house is 5 -- House 1 is NOT added; the house's own figure is the result."
        : "Question house is not 5 -- result = questionHouseFigure + house1Figure.",
    output: { resultFigure: judgement.resultFigure },
  });

  trace.push({
    label: "Sthan Bali comparison",
    detail: judgement.sthanBali
      ? "Result matches the Sthir Kundali figure for this house -- Sthan Bali applies, answer is YES regardless of Agam/Nirgam."
      : "Result does not match the Sthir Kundali figure for this house -- no Sthan Bali override.",
    output: { sthanBali: judgement.sthanBali },
  });

  trace.push({
    label: "Agam/Nirgam judgement",
    detail: judgement.sthanBali
      ? "Skipped -- already decided by Sthan Bali."
      : `Question type ${questionType}; result figure is Type ${judgement.resultType ?? "unknown"} ` +
        `(first symbol "${judgement.resultFigure[0]}"). ` +
        (questionType === judgement.resultType
          ? `${questionType === "AGAM" ? "Agam" : "Nirgam"} question, ${judgement.resultType.toLowerCase()}-type result -> YES.`
          : `${questionType === "AGAM" ? "Agam" : "Nirgam"} question, ${judgement.resultType?.toLowerCase() ?? "opposite"}-type ` +
            `result -> NO (Prediction!row${questionType === "AGAM" ? "55" : "56"}).`),
    output: { status: judgement.status, resultType: judgement.resultType },
  });

  const timing = computeTiming(judgement.resultFigure, chart);
  const timingPerPlace = timing.matches
    .map((m) => `place ${m.place}: ${m.years}y ${m.months}m ${m.days}d`)
    .join("; ");

  trace.push({
    label: "Timing lookup",
    detail:
      (timing.unavailable
        ? "Result figure did not match any Sthir Kundali figure -- timing unavailable."
        : `Result figure matches Sthir house with Timings Number ${timing.timingNumber}. Found in ${timing.matches.length} place(s) of this chart: ${timing.matches.map((m) => m.place).join(", ") || "none"}.`) +
      (timing.matches.length > 1 ? ` Matched more than one place -- shown separately per place: ${timingPerPlace}.` : ""),
    output: timing,
  });

  trace.push({
    label: "Timing normalization",
    detail:
      "30 days = 1 month, 12 months = 1 year (with carry)." +
      (timing.matches.length > 1 ? ` Summed across ${timing.matches.length} matched places (${timingPerPlace}) before normalizing.` : ""),
    output: { years: timing.totalYears, months: timing.totalMonths, days: timing.totalDays },
  });

  const quickDuration = computeQuickDuration(judgement.resultFigure, input.shortTiming ?? false);

  trace.push({
    label: "Quick duration (Short Timing)",
    detail:
      quickDuration.sthirHouseId === null
        ? "Result figure did not match any Sthir Kundali figure -- quick duration unavailable."
        : quickDuration.unitLabel === ""
          ? `Short Timing = ${(input.shortTiming ?? false) ? "Yes" : "No"}; matched Sthir house ${quickDuration.sthirHouseId} falls outside the workbook's reachable Day(s)/Week(s) range for Normal mode -- Prediction!F90 leaves this blank (a source formula gap, reproduced faithfully; see quick-duration.ts).`
          : `Short Timing = ${(input.shortTiming ?? false) ? "Yes" : "No"} (${quickDuration.mode.toLowerCase()} mode); matched Sthir house ${quickDuration.sthirHouseId} -> ${quickDuration.count} ${quickDuration.unitLabel}.`,
    output: quickDuration,
  });

  return {
    status: judgement.status,
    sthanBali: judgement.sthanBali,
    questionHouseFigure: judgement.questionHouseFigure,
    house1Figure: judgement.house1Figure,
    resultFigure: judgement.resultFigure,
    timing,
    quickDuration,
    chart,
    trace,
  };
}
