import { describe, it, expect } from "vitest";
import { calculateQuestion, resultNature } from "@/lib/engines/prediction";
import { buildPrashnaKundali } from "@/lib/engines/kundali";
import { FIGURES } from "@/lib/data/figures";

const WORKBOOK_DRAW: [number, number, number, number] = [2, 8, 4, 9];

describe("calculateQuestion", () => {
  it("AT-004: House 5 uses its own figure -- House 1 is not added", () => {
    const { chart } = buildPrashnaKundali(WORKBOOK_DRAW);
    const result = calculateQuestion(5, "AGAM", chart);
    expect(result.resultFigure).toEqual(chart[5]);
    expect(result.questionHouseFigure).toEqual(chart[5]);
  });

  it("adds House 1 for every house other than 5", () => {
    const { chart } = buildPrashnaKundali(WORKBOOK_DRAW);
    const result = calculateQuestion(7, "NIRGAM", chart);
    expect(result.resultFigure).not.toEqual(chart[7]);
  });

  it("AT-005: Sthan Bali overrides to YES regardless of Agam/Nirgam", () => {
    // For a fully-repeated draw, Places 1-4 all equal the drawn figure, so for
    // any house in 1-4, Place[house] + Place[1] = X + X = all "-" (addFigure is
    // its own inverse). Figure 4 (Jamaat) is the workbook's unique all-"-"
    // Sthir Kundali pattern, so House 4's result always lands back on its own
    // Sthir figure here -- a real, structurally-guaranteed Sthan Bali case,
    // true for any drawn figure, not just this one.
    const { chart } = buildPrashnaKundali([7, 7, 7, 7]);
    const result = calculateQuestion(4, "NIRGAM", chart);
    expect(result.resultFigure).toEqual(["-", "-", "-", "-"]);
    expect(result.sthanBali).toBe(true);
    expect(result.status).toBe("YES");
  });

  it("AT-006/AT-007: Agam is YES when the result's first symbol is '-', Nirgam when it is '0'", () => {
    const { chart } = buildPrashnaKundali(WORKBOOK_DRAW);
    for (let house = 1; house <= 12; house++) {
      if (house === 5) continue;
      const agam = calculateQuestion(house, "AGAM", chart);
      const nirgam = calculateQuestion(house, "NIRGAM", chart);
      expect(agam.resultFigure).toEqual(nirgam.resultFigure); // same chart, same result
      if (!agam.sthanBali) {
        expect(agam.status).toBe(agam.resultFigure[0] === "-" ? "YES" : "NO");
      }
      if (!nirgam.sthanBali) {
        expect(nirgam.status).toBe(nirgam.resultFigure[0] === "0" ? "YES" : "NO");
      }
    }
  });

  it("AT-008: opposite nature is NO unless Sthan Bali applies", () => {
    const { chart } = buildPrashnaKundali(WORKBOOK_DRAW);
    const result = calculateQuestion(7, "NIRGAM", chart);
    expect(result.sthanBali).toBe(false);
    expect(result.resultFigure[0]).not.toBe("0");
    expect(result.status).toBe("NO");
  });

  it("Prediction!row55: Agam question + Nirgam-type result -> No", () => {
    const { chart } = buildPrashnaKundali(WORKBOOK_DRAW);
    for (let house = 1; house <= 12; house++) {
      if (house === 5) continue;
      const result = calculateQuestion(house, "AGAM", chart);
      if (!result.sthanBali && result.resultType === "NIRGAM") {
        expect(result.status).toBe("NO");
      }
    }
  });

  it("Prediction!row56: Nirgam question + Agam-type result -> No", () => {
    const { chart } = buildPrashnaKundali(WORKBOOK_DRAW);
    for (let house = 1; house <= 12; house++) {
      if (house === 5) continue;
      const result = calculateQuestion(house, "NIRGAM", chart);
      if (!result.sthanBali && result.resultType === "AGAM") {
        expect(result.status).toBe("NO");
      }
    }
  });

  it("resultNature() and the first-symbol test always agree (verified bijection, no exceptions)", () => {
    for (const figure of FIGURES) {
      expect(resultNature(figure.pattern)).toBe(figure.type);
      expect(figure.pattern[0] === "-" ? "AGAM" : "NIRGAM").toBe(figure.type);
    }
  });

  it("throws on a question house outside 1-16", () => {
    const { chart } = buildPrashnaKundali(WORKBOOK_DRAW);
    expect(() => calculateQuestion(99, "AGAM", chart)).toThrow();
  });

  it("reproduces the workbook's own worked example exactly (house 7, Nirgam -> No)", () => {
    const { chart } = buildPrashnaKundali(WORKBOOK_DRAW);
    const result = calculateQuestion(7, "NIRGAM", chart);
    expect(result.questionHouseFigure).toEqual(["-", "-", "-", "0"]);
    expect(result.house1Figure).toEqual(["-", "0", "-", "0"]);
    expect(result.resultFigure).toEqual(["-", "0", "-", "-"]);
    expect(result.sthanBali).toBe(false);
    expect(result.status).toBe("NO");
  });
});
