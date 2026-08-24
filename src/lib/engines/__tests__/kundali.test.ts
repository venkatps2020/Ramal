import { describe, it, expect } from "vitest";
import { buildPrashnaKundali, checkGuards, getFigurePattern } from "@/lib/engines/kundali";
import { FIGURES } from "@/lib/data/figures";

// Real worked example from the shipped Ramal Calculation.xlsx (Prediction!B2:B5,
// rows 29-33), verified cell-by-cell against the workbook's cached values before
// being hardcoded here. See scripts/extract-workbook.ts for provenance.
const WORKBOOK_DRAW: [number, number, number, number] = [2, 8, 4, 9];
const WORKBOOK_CHART = {
  1: ["-", "0", "-", "0"],
  2: ["-", "0", "-", "-"],
  3: ["-", "-", "-", "-"],
  4: ["-", "-", "0", "-"],
  5: ["-", "-", "-", "-"],
  6: ["0", "0", "-", "-"],
  7: ["-", "-", "-", "0"],
  8: ["0", "-", "-", "-"],
  9: ["-", "-", "-", "0"],
  10: ["-", "-", "0", "-"],
  11: ["0", "0", "-", "-"],
  12: ["0", "-", "-", "0"],
  13: ["-", "-", "0", "0"],
  14: ["-", "0", "-", "0"],
  15: ["-", "0", "0", "-"],
  16: ["-", "-", "0", "0"],
};

describe("getFigurePattern", () => {
  it("returns the canonical pattern for a figure id", () => {
    expect(getFigurePattern(1)).toEqual(FIGURES[0].pattern);
  });

  it("throws on an unknown figure id", () => {
    expect(() => getFigurePattern(99)).toThrow();
  });
});

describe("buildPrashnaKundali", () => {
  it("AT-003: accepts a fully-repeated draw as valid input (Places 1-4 all equal the drawn figure)", () => {
    // A fully-repeated draw is accepted (no input-validation rejection); it does
    // not, by itself, guarantee an OK status -- see the guard-triggering test
    // below, where repetition happens to drive Place 15 to all-same.
    const { chart } = buildPrashnaKundali([7, 7, 7, 7]);
    expect(chart[1]).toEqual(getFigurePattern(7));
    expect(chart[2]).toEqual(getFigurePattern(7));
    expect(chart[3]).toEqual(getFigurePattern(7));
    expect(chart[4]).toEqual(getFigurePattern(7));
  });

  it("accepts a partially-repeated draw and reaches OK", () => {
    const { chart, status } = buildPrashnaKundali([7, 7, 3, 12]);
    expect(status).toBe("OK");
    expect(chart[1]).toEqual(getFigurePattern(7));
    expect(chart[2]).toEqual(getFigurePattern(7));
  });

  it("reproduces every one of the 16 places from the workbook's own worked example", () => {
    const { chart, status } = buildPrashnaKundali(WORKBOOK_DRAW);
    expect(status).toBe("OK");
    for (let place = 1; place <= 16; place++) {
      expect(chart[place]).toEqual(WORKBOOK_CHART[place as keyof typeof WORKBOOK_CHART]);
    }
  });

  it("places 5-8 are the row-wise transpose of the four Mother Figures", () => {
    const { chart } = buildPrashnaKundali(WORKBOOK_DRAW);
    const mothers = WORKBOOK_DRAW.map(getFigurePattern);
    expect(chart[5]).toEqual([mothers[0][0], mothers[1][0], mothers[2][0], mothers[3][0]]);
    expect(chart[6]).toEqual([mothers[0][1], mothers[1][1], mothers[2][1], mothers[3][1]]);
    expect(chart[7]).toEqual([mothers[0][2], mothers[1][2], mothers[2][2], mothers[3][2]]);
    expect(chart[8]).toEqual([mothers[0][3], mothers[1][3], mothers[2][3], mothers[3][3]]);
  });

  it("AT-010: flags CANT_PREDICT_TODAY when Place 1 (the first Mother Figure) is all-same", () => {
    // Figure 4 (Jamaat) is the workbook's own all-'-' pattern; drawing it as the
    // first card makes Place 1 itself all-same regardless of the other three cards.
    const { status } = buildPrashnaKundali([4, 1, 1, 1]);
    expect(status).toBe("CANT_PREDICT_TODAY");
  });

  it("AT-010: flags CANT_PREDICT_TODAY when the derived Place 15 is all-same", () => {
    // Verified by exhaustive search over all 16^4 = 65,536 possible draws
    // (see project notes) -- drawing figure 1 four times is one such case.
    const { status, chart } = buildPrashnaKundali([1, 1, 1, 1]);
    expect(chart[15]).toEqual(["0", "0", "0", "0"]);
    expect(status).toBe("CANT_PREDICT_TODAY");
  });

  it("does not flag a known-good draw", () => {
    const { status } = buildPrashnaKundali([1, 1, 1, 2]);
    expect(status).toBe("OK");
  });
});

describe("checkGuards", () => {
  it("AT-009: flags CALCULATION_ERROR on a synthetic 3-identical Place 15", () => {
    expect(checkGuards(["-", "-", "-", "0"], ["-", "0", "-", "0"])).toBe("CALCULATION_ERROR");
    expect(checkGuards(["0", "0", "0", "-"], ["-", "0", "-", "0"])).toBe("CALCULATION_ERROR");
  });

  it("AT-010: flags CANT_PREDICT_TODAY on 4-identical Place 15 or Place 1", () => {
    expect(checkGuards(["-", "-", "-", "-"], ["0", "0", "-", "0"])).toBe("CANT_PREDICT_TODAY");
    expect(checkGuards(["-", "0", "-", "0"], ["0", "0", "0", "0"])).toBe("CANT_PREDICT_TODAY");
  });

  it("returns OK when neither place is 3- or 4-identical", () => {
    expect(checkGuards(["-", "0", "0", "-"], ["-", "0", "-", "0"])).toBe("OK");
  });

  /**
   * Exhaustive property test over the full 16^4 = 65,536 draw space, using the
   * exported guard function so it runs against real constructed charts rather
   * than synthetic patterns. This documents a genuine structural finding: the
   * workbook's own three-identical check (Place 15 only) is never reachable
   * through the transpose + pairwise-addition construction -- Place 15 always
   * lands on an even split (0, 2, or 4 of one symbol), never a 3-1 split. The
   * synthetic test above still exercises the CALCULATION_ERROR branch directly
   * so the guard code itself stays covered.
   */
  it("CALCULATION_ERROR is structurally unreachable via natural draws (documented, not assumed)", () => {
    let calcErrorCount = 0;
    for (let a = 1; a <= 16; a++) {
      for (let b = 1; b <= 16; b++) {
        for (let c = 1; c <= 16; c++) {
          for (let d = 1; d <= 16; d++) {
            const { status } = buildPrashnaKundali([a, b, c, d]);
            if (status === "CALCULATION_ERROR") calcErrorCount++;
          }
        }
      }
    }
    expect(calcErrorCount).toBe(0);
  });
});
