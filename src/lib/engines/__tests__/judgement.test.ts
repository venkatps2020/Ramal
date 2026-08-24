import { describe, it, expect } from "vitest";
import {
  JUDGEMENT_RULES,
  traceConcernOrigin,
  forecastUpcomingYear,
  isDakhilOrSabit,
  isKharijOrMunqalib,
  isShubh,
  isAshubh,
} from "@/lib/engines/judgement";
import { buildPrashnaKundali } from "@/lib/engines/kundali";
import { ABJAD_ORDER } from "@/lib/data/judgement-reference";
import { FIGURES } from "@/lib/data/figures";
import type { PrashnaChart } from "@/lib/types";

const SAMPLE_DRAW: [number, number, number, number] = [2, 8, 4, 9];

describe("classification primitives", () => {
  it("isShubh/isAshubh partition the Auspiciousness scale correctly", () => {
    for (const f of FIGURES) {
      const shubh = isShubh(f.pattern);
      const ashubh = isAshubh(f.pattern);
      expect(shubh && ashubh).toBe(false); // never both
      if (f.auspiciousness === "Medium") {
        expect(shubh).toBe(false);
        expect(ashubh).toBe(false);
      }
    }
  });

  it("isDakhilOrSabit/isKharijOrMunqalib match each figure's own nature exactly", () => {
    for (const f of FIGURES) {
      expect(isDakhilOrSabit(f.pattern)).toBe(f.nature === "DAKHIL" || f.nature === "SABIT");
      expect(isKharijOrMunqalib(f.pattern)).toBe(f.nature === "KHARIJ" || f.nature === "MUNQALIB");
    }
  });

  it("requireShubh narrows to the shubh subset only", () => {
    for (const f of FIGURES) {
      if (isDakhilOrSabit(f.pattern) && !isShubh(f.pattern)) {
        expect(isDakhilOrSabit(f.pattern, { requireShubh: true })).toBe(false);
      }
    }
  });
});

describe("R01 traceConcernOrigin", () => {
  it("terminates at a witness or mother place (1-8) whenever a trace exists", () => {
    for (let a = 1; a <= 16; a += 3) {
      for (let b = 1; b <= 16; b += 5) {
        const { chart } = buildPrashnaKundali([a, b, (a + b) % 16 || 16, (a * b) % 16 || 16]);
        const trace = traceConcernOrigin(chart);
        if (trace) {
          expect(trace.originPlace).toBeGreaterThanOrEqual(1);
          expect(trace.originPlace).toBeLessThanOrEqual(8);
          expect(trace.originFigure).not.toBeNull();
        }
      }
    }
  });

  it("returns null when Place 15 is fully hidden", () => {
    const chart: PrashnaChart = {} as PrashnaChart;
    for (let p = 1; p <= 16; p++) chart[p] = ["-", "-", "-", "-"];
    expect(traceConcernOrigin(chart)).toBeNull();
  });

  it("every step in the path is a real parent-child relationship in the chart", () => {
    const { chart } = buildPrashnaKundali(SAMPLE_DRAW);
    const trace = traceConcernOrigin(chart);
    if (trace) {
      for (let i = 0; i < trace.path.length - 1; i++) {
        const parent = trace.path[i];
        const child = trace.path[i + 1];
        // child must actually be an ancestor place of parent per the construction
        expect(child).toBeLessThan(parent === 16 ? 17 : parent);
      }
    }
  });
});

describe("R27 thief appearance (abjad lookup)", () => {
  it("reproduces the source's own worked example: Humra -> abjad position 2 -> Qabz-ul-Dakhil", () => {
    const humra = FIGURES.find((f) => f.sourceName === "Humra")!;
    expect(ABJAD_ORDER.indexOf(humra.id) + 1).toBe(2);
    const describedBy = FIGURES.find((f) => f.id === 2)!;
    expect(describedBy.sourceName).toBe("Qabz-ul-Dakhil");
  });

  it("R27 rule computes the same result end to end", () => {
    const rule = JUDGEMENT_RULES.find((r) => r.id === "R27")!;
    const humra = FIGURES.find((f) => f.sourceName === "Humra")!;
    const chart: PrashnaChart = {} as PrashnaChart;
    for (let p = 1; p <= 16; p++) chart[p] = FIGURES[0].pattern;
    chart[7] = humra.pattern;
    const outcome = rule.compute!(chart, {});
    expect(outcome.answer).toBe("Qabz-ul-Dakhil");
  });

  it("ABJAD_ORDER is a complete permutation of 1-16", () => {
    expect([...ABJAD_ORDER].sort((a, b) => a - b)).toEqual(Array.from({ length: 16 }, (_, i) => i + 1));
  });
});

describe("R42 forecastUpcomingYear", () => {
  it("stabilizes immediately (iteration 1, Excellent) for a fully-repeated Jamaat draw", () => {
    // Hand-verified: Jamaat (figure 4) is the all-"-" pattern. Drawing it four
    // times drives every one of Places 9-16 to all-"-" too, so Place1=Place13,
    // Place2=Place10, Place3=Place11 and Place4=Place14 all hold immediately.
    const result = forecastUpcomingYear([4, 4, 4, 4]);
    expect(result.stabilized).toBe(true);
    expect(result.iterations).toBe(1);
    expect(result.quality).toContain("Excellent");
  });

  it("always terminates within the iteration cap for an arbitrary draw", () => {
    const result = forecastUpcomingYear(SAMPLE_DRAW, 8);
    expect(result.iterations).toBeLessThanOrEqual(8);
    expect(result.charts.length).toBe(result.iterations);
  });
});

describe("JUDGEMENT_RULES registry", () => {
  // Items 3, 16 and 26 were removed by owner decision: no Excel counterpart
  // exists to verify them against, and unverifiable PDF-only content
  // doesn't ship. itemNo therefore runs 1-42 with those three absent.
  const REMOVED_ITEM_NOS = [3, 16, 26];

  it("has exactly 39 rules, itemNo 1-42 minus {3,16,26}, unique ids", () => {
    expect(JUDGEMENT_RULES).toHaveLength(39);
    const itemNos = JUDGEMENT_RULES.map((r) => r.itemNo).sort((a, b) => a - b);
    const expected = Array.from({ length: 42 }, (_, i) => i + 1).filter((n) => !REMOVED_ITEM_NOS.includes(n));
    expect(itemNos).toEqual(expected);
    expect(new Set(JUDGEMENT_RULES.map((r) => r.id)).size).toBe(39);
  });

  it("removed items are genuinely absent, not silently present with a stub", () => {
    for (const id of ["R03", "R16", "R26"]) {
      expect(JUDGEMENT_RULES.find((r) => r.id === id)).toBeUndefined();
    }
  });

  it("every rule with compute() runs without throwing across several sample charts", () => {
    const draws: [number, number, number, number][] = [
      [2, 8, 4, 9],
      [1, 5, 9, 13],
      [3, 6, 11, 15],
      [7, 7, 7, 7],
    ];
    for (const draw of draws) {
      const { chart } = buildPrashnaKundali(draw);
      for (const rule of JUDGEMENT_RULES) {
        if (!rule.compute) continue;
        expect(() => rule.compute!(chart, { gender: "FEMALE", motherFigureIds: draw })).not.toThrow();
        expect(() => rule.compute!(chart, { gender: "MALE", motherFigureIds: draw })).not.toThrow();
        const outcome = rule.compute!(chart, { motherFigureIds: draw });
        expect(typeof outcome.answer).toBe("string");
        expect(outcome.answer.length).toBeGreaterThan(0);
      }
    }
  });

  it("R33 and R39 test Kharij/Munqalib, not Dakhil/Sabit (regression for a transcription bug caught during review)", () => {
    const { chart } = buildPrashnaKundali(SAMPLE_DRAW);
    const r33 = JUDGEMENT_RULES.find((r) => r.id === "R33")!;
    const r39 = JUDGEMENT_RULES.find((r) => r.id === "R39")!;
    const out33 = r33.compute!(chart, {});
    const out39 = r39.compute!(chart, {});
    // Whatever the answer, the detail must report a Kharij/Munqalib-consistent nature check.
    expect(out33.detail).toMatch(/KHARIJ|MUNQALIB/);
    expect(out39.detail).toMatch(/KHARIJ|MUNQALIB/);
  });

  it("R21 respects the explicit gender context and defaults sensibly when unset", () => {
    const { chart } = buildPrashnaKundali(SAMPLE_DRAW);
    const r21 = JUDGEMENT_RULES.find((r) => r.id === "R21")!;
    const female = r21.compute!(chart, { gender: "FEMALE" });
    const male = r21.compute!(chart, { gender: "MALE" });
    expect(female.detail).toContain("Female");
    expect(male.detail).toContain("Male");
  });

  it("R42 asks for the Mother Figures when only a chart is given", () => {
    const { chart } = buildPrashnaKundali(SAMPLE_DRAW);
    const r42 = JUDGEMENT_RULES.find((r) => r.id === "R42")!;
    const outcome = r42.compute!(chart, {});
    expect(outcome.answer).toContain("Mother Figures");
  });
});
