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
