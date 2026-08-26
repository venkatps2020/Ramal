import { describe, it, expect } from "vitest";
import { buildPredictionCsv } from "@/lib/export";
import { runPrediction } from "@/lib/engines/predict";
import { JUDGEMENT_RULES } from "@/lib/engines/judgement";

const SAMPLE_DRAW: [number, number, number, number] = [2, 8, 4, 9];

function sampleInput() {
  const result = runPrediction({
    draw: { figureIds: SAMPLE_DRAW },
    questionHouse: 7,
    questionType: "NIRGAM",
  });
  return {
    createdAt: "2026-08-27T00:00:00.000Z",
    motherFigureIds: SAMPLE_DRAW,
    questionHouse: 7,
    questionType: "NIRGAM" as const,
    shortTiming: false,
    gender: "FEMALE" as const,
    result,
  };
}

describe("buildPredictionCsv", () => {
  it("includes the summary, chart, trace, and all Judgement Library rows", () => {
    const csv = buildPredictionCsv(sampleInput());
    expect(csv).toContain("Ramal Prediction Report");
    expect(csv).toContain("Summary");
    expect(csv).toContain("House,7");
    expect(csv).toContain("16-place Prashna Kundali");
    expect(csv).toContain("Calculation Trace");
    expect(csv).toContain("Judgement Library");

    const judgementSection = csv.split("Judgement Library\n")[1];
    const judgementRows = judgementSection.split("\n").slice(1).filter((line) => line.length > 0);
    expect(judgementRows.length).toBe(JUDGEMENT_RULES.length);
  });

  it("quotes fields containing commas, quotes, or newlines per RFC 4180", () => {
    const csv = buildPredictionCsv(sampleInput());
    // Trace details are multi-clause sentences; at least one contains a comma and must be quoted.
    const traceSection = csv.split("Calculation Trace")[1].split("Judgement Library")[0];
    expect(traceSection).toMatch(/"[^"]*,[^"]*"/);
  });

  it("is deterministic for the same input", () => {
    const input = sampleInput();
    expect(buildPredictionCsv(input)).toBe(buildPredictionCsv(input));
  });
});
