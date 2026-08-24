import { describe, it, expect } from "vitest";
import { runPrediction } from "@/lib/engines/predict";

/**
 * End-to-end reproduction of the one fully worked, cell-by-cell verifiable
 * example shipped inside Ramal Calculation.xlsx (Prediction!B2:G76). Every
 * expected value below was cross-checked against the workbook's own cached
 * calculated values before being hardcoded here -- this is the project's
 * Phase 8 "known Excel fixture chart" regression anchor.
 */
describe("runPrediction -- workbook benchmark (cards 2,8,4,9; house 7; Nirgam)", () => {
  const result = runPrediction({
    draw: { figureIds: [2, 8, 4, 9] },
    questionHouse: 7,
    questionType: "NIRGAM",
  });

  it("passes all validation guards", () => {
    expect(result.status).toBe("NO");
  });

  it("computes the exact figures the workbook computed", () => {
    expect(result.questionHouseFigure).toEqual(["-", "-", "-", "0"]);
    expect(result.house1Figure).toEqual(["-", "0", "-", "0"]);
    expect(result.resultFigure).toEqual(["-", "0", "-", "-"]);
  });

  it("does not trigger Sthan Bali", () => {
    expect(result.sthanBali).toBe(false);
  });

  it("computes the exact timing the workbook computed", () => {
    expect(result.timing).not.toBeNull();
    expect(result.timing?.timingNumber).toBe(3);
    expect(result.timing?.matches).toEqual([{ place: 2, days: 0, months: 2, years: 0 }]);
    expect(result.timing?.totalYears).toBe(0);
    expect(result.timing?.totalMonths).toBe(2);
    expect(result.timing?.totalDays).toBe(0);
  });

  it("produces a non-empty, ordered calculation trace", () => {
    expect(result.trace.length).toBeGreaterThanOrEqual(8);
    expect(result.trace[0].label).toBe("Four Mother Figures drawn");
  });

  it("computes the exact NORMAL quick duration the workbook computed (Prediction!D90:F90)", () => {
    const normal = runPrediction({
      draw: { figureIds: [2, 8, 4, 9] },
      questionHouse: 7,
      questionType: "NIRGAM",
      shortTiming: false,
    });
    expect(normal.quickDuration).toEqual({ mode: "NORMAL", sthirHouseId: 8, count: 2, unitLabel: "Week(s)" });
  });

  it("computes the exact SHORT quick duration for the same result figure (Prediction!D91:F91)", () => {
    const short = runPrediction({
      draw: { figureIds: [2, 8, 4, 9] },
      questionHouse: 7,
      questionType: "NIRGAM",
      shortTiming: true,
    });
    expect(short.quickDuration).toEqual({ mode: "SHORT", sthirHouseId: 8, count: 2, unitLabel: "Hours" });
  });
});

describe("runPrediction -- timing trace with multiple matched places", () => {
  // Draw [1,1,1,2], House 1, Agam: a real case where the result figure
  // coincidentally appears at two different places (7 and 9) in the same
  // 16-place chart, each contributing a different Days/Months/Years entry
  // from the Timings block before they're summed and normalized.
  const result = runPrediction({
    draw: { figureIds: [1, 1, 1, 2] },
    questionHouse: 1,
    questionType: "AGAM",
  });

  it("finds more than one matched place", () => {
    expect(result.timing?.matches).toEqual([
      { place: 7, days: 0, months: 8, years: 1 },
      { place: 9, days: 0, months: 2, years: 2 },
    ]);
  });

  it("lists each matched place separately in the Timing lookup trace step", () => {
    const step = result.trace.find((s) => s.label === "Timing lookup");
    expect(step?.detail).toContain("Matched more than one place -- shown separately per place:");
    expect(step?.detail).toContain("place 7: 1y 8m 0d");
    expect(step?.detail).toContain("place 9: 2y 2m 0d");
  });

  it("shows the per-place breakdown in the Timing normalization trace step too", () => {
    const step = result.trace.find((s) => s.label === "Timing normalization");
    expect(step?.detail).toContain("Summed across 2 matched places");
    expect(step?.detail).toContain("place 7: 1y 8m 0d");
    expect(step?.detail).toContain("place 9: 2y 2m 0d");
  });
});

describe("runPrediction -- guard short-circuits", () => {
  it("returns CANT_PREDICT_TODAY without a judgement when Place 1 is all-same", () => {
    const result = runPrediction({
      draw: { figureIds: [4, 1, 1, 1] },
      questionHouse: 7,
      questionType: "AGAM",
    });
    expect(result.status).toBe("CANT_PREDICT_TODAY");
    expect(result.resultFigure).toBeNull();
    expect(result.timing).toBeNull();
    expect(result.quickDuration).toBeNull();
  });

  it("returns CALCULATION_ERROR for a question house outside 1-12", () => {
    const result = runPrediction({
      draw: { figureIds: [2, 8, 4, 9] },
      questionHouse: 14,
      questionType: "AGAM",
    });
    expect(result.status).toBe("CALCULATION_ERROR");
  });
});
