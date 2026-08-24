import { describe, it, expect } from "vitest";
import { addBit, addFigure, patternsEqual, countSymbol, isAllSame } from "@/lib/engines/figure";
import type { FigurePattern, Symbol } from "@/lib/types";

const SYMBOLS: Symbol[] = ["-", "0"];

describe("addBit", () => {
  it("returns '-' when both symbols are equal (AT-001)", () => {
    expect(addBit("-", "-")).toBe("-");
    expect(addBit("0", "0")).toBe("-");
  });

  it("returns '0' when symbols differ (AT-002)", () => {
    expect(addBit("-", "0")).toBe("0");
    expect(addBit("0", "-")).toBe("0");
  });
});

describe("addFigure", () => {
  it("AT-001: ---- + ---- = ----", () => {
    expect(addFigure(["-", "-", "-", "-"], ["-", "-", "-", "-"])).toEqual(["-", "-", "-", "-"]);
  });

  it("AT-002: ---- + 0000 = 0000", () => {
    expect(addFigure(["-", "-", "-", "-"], ["0", "0", "0", "0"])).toEqual(["0", "0", "0", "0"]);
  });

  it("is commutative and matches the truth table for all 4x4 = 256 symbol pairs", () => {
    for (const a of allPatterns()) {
      for (const b of allPatterns()) {
        const forward = addFigure(a, b);
        const backward = addFigure(b, a);
        expect(forward).toEqual(backward);
        for (let i = 0; i < 4; i++) {
          expect(forward[i]).toBe(a[i] === b[i] ? "-" : "0");
        }
      }
    }
  });

  it("is its own inverse: (a + b) + b = a for every pattern pair", () => {
    for (const a of allPatterns()) {
      for (const b of allPatterns()) {
        expect(addFigure(addFigure(a, b), b)).toEqual(a);
      }
    }
  });
});

describe("patternsEqual / countSymbol / isAllSame", () => {
  it("detects equal and unequal patterns", () => {
    expect(patternsEqual(["-", "0", "-", "0"], ["-", "0", "-", "0"])).toBe(true);
    expect(patternsEqual(["-", "0", "-", "0"], ["-", "0", "-", "-"])).toBe(false);
  });

  it("counts symbol occurrences", () => {
    expect(countSymbol(["-", "-", "0", "-"], "-")).toBe(3);
    expect(countSymbol(["-", "-", "0", "-"], "0")).toBe(1);
  });

  it("flags all-same patterns in either symbol", () => {
    expect(isAllSame(["-", "-", "-", "-"])).toBe(true);
    expect(isAllSame(["0", "0", "0", "0"])).toBe(true);
    expect(isAllSame(["-", "-", "-", "0"])).toBe(false);
  });
});

function allPatterns(): FigurePattern[] {
  const patterns: FigurePattern[] = [];
  for (const a of SYMBOLS) {
    for (const b of SYMBOLS) {
      for (const c of SYMBOLS) {
        for (const d of SYMBOLS) {
          patterns.push([a, b, c, d]);
        }
      }
    }
  }
  return patterns;
}
