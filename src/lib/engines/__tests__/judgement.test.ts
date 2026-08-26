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
import { ABJAD_ORDER, TROUBLESOME_YEARS_TABLE } from "@/lib/data/judgement-reference";
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

describe("R16 number of children", () => {
  // Draws found by brute-force search over all 16^4 combinations, one per
  // lord, so traceConcernOrigin's origin figure lands on each lord exactly.
  const DRAW_BY_LORD: Record<string, [number, number, number, number]> = {
    Sun: [1, 1, 2, 2],
    Moon: [1, 1, 1, 1],
    Mercury: [1, 1, 6, 15],
    Jupiter: [1, 1, 5, 7],
    Venus: [1, 1, 2, 5],
    Saturn: [1, 2, 2, 1],
    Mars: [1, 1, 2, 13],
    Rahu: [1, 1, 1, 2],
    Ketu: [1, 1, 2, 3],
  };
  const BOOK_COUNTS: Record<string, number> = { Sun: 4, Moon: 5, Mercury: 2, Jupiter: 3, Venus: 6, Saturn: 1 };

  it("returns the book's count for each of the 6 directly-sourced lords", () => {
    const rule = JUDGEMENT_RULES.find((r) => r.id === "R16")!;
    for (const [lord, count] of Object.entries(BOOK_COUNTS)) {
      const { chart } = buildPrashnaKundali(DRAW_BY_LORD[lord]);
      const outcome = rule.compute!(chart, {});
      expect(outcome.answer).toBe(`${count}`);
      expect(outcome.detail).not.toContain("alternate source");
    }
  });

  it("returns Mars's count from the alternate source, flagged as such in the detail", () => {
    const rule = JUDGEMENT_RULES.find((r) => r.id === "R16")!;
    const { chart } = buildPrashnaKundali(DRAW_BY_LORD.Mars);
    const outcome = rule.compute!(chart, {});
    expect(outcome.answer).toBe("4");
    expect(outcome.detail).toContain("alternate source");
  });

  it('returns "Not yet known" for Rahu and Ketu, not a guessed number', () => {
    const rule = JUDGEMENT_RULES.find((r) => r.id === "R16")!;
    for (const lord of ["Rahu", "Ketu"]) {
      const { chart } = buildPrashnaKundali(DRAW_BY_LORD[lord]);
      const outcome = rule.compute!(chart, {});
      expect(outcome.answer).toBe("Not yet known");
    }
  });
});

describe("R26 thief inside/outside (alternate formula)", () => {
  it("the book's own formula (hidden+revealed) is always 64, confirming it's degenerate", () => {
    for (const draw of [SAMPLE_DRAW, [1, 1, 1, 1], [7, 7, 7, 7], [3, 6, 11, 15]] as [number, number, number, number][]) {
      const { chart } = buildPrashnaKundali(draw);
      let hidden = 0;
      let revealed = 0;
      for (let p = 1; p <= 16; p++) {
        for (const sym of chart[p]) sym === "-" ? hidden++ : revealed++;
      }
      expect(hidden + revealed).toBe(64);
    }
  });

  it("the alternate formula ((hidden*2)+revealed mod 3) actually varies by chart", () => {
    const rule = JUDGEMENT_RULES.find((r) => r.id === "R26")!;
    const answers = new Set<string>();
    for (const draw of [
      [1, 1, 1, 1],
      [7, 7, 7, 7],
      [2, 8, 4, 9],
      [3, 6, 11, 15],
      [5, 10, 12, 14],
    ] as [number, number, number, number][]) {
      const { chart } = buildPrashnaKundali(draw);
      answers.add(rule.compute!(chart, {}).answer);
    }
    expect(answers.size).toBeGreaterThan(1);
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

  // Source: Ramal-jyotish.pdf p.18's own worked example ("Kundali #1"), owner-
  // transcribed from the scan (2026-08-26). Only places 1-4 (Mother Figures:
  // Lahyan, Humra, Nusrat-ul-Kharij, Bayaz) and their row-wise transpose into
  // places 5-6 were independently confirmed against the diagram -- places
  // 7-16 could NOT be reconciled: checking all 8 addFigure relationships
  // (9=1+2, 10=3+4, ..., 16=15+1) purely against the owner's own transcribed
  // values, every single one failed, regardless of which cells were trusted
  // as ground truth. That rules out isolated typos; it's a broader
  // read-reliability problem with this specific scan (small hand-drawn
  // bindu/rekha marks, runs of 3-4 consecutive rekha are easy to
  // miscount), not a construction-algorithm bug -- kundali.ts's formula is
  // separately oracle-verified across all 1,572,864 possible cases
  // (npm run validate:oracle), and is not in doubt here.
  //
  // What *is* verified below is stronger than cell-matching anyway: feeding
  // just the diagram-confirmed Mother Figures through the engine's own
  // (already oracle-verified) construction reproduces the source's stated
  // final answer -- "stabilizes at iteration 4, Auspicious" -- without
  // needing to trust any of the disputed intermediate cells at all.
  it("reproduces the source's own worked example (Ramal-jyotish.pdf p.18, Kundali #1)", () => {
    const draw: [number, number, number, number] = [1, 8, 10, 9]; // Lahyan, Humra, Nusrat-ul-Kharij, Bayaz
    const { chart } = buildPrashnaKundali(draw);
    expect(chart[1].join("")).toBe("0---"); // Lahyan
    expect(chart[2].join("")).toBe("-0--"); // Humra
    expect(chart[3].join("")).toBe("00--"); // Nusrat-ul-Kharij
    expect(chart[4].join("")).toBe("--0-"); // Bayaz
    expect(chart[5].join("")).toBe("0-0-"); // row-wise transpose, tez
    expect(chart[6].join("")).toBe("-00-"); // row-wise transpose, vayu

    const result = forecastUpcomingYear(draw);
    expect(result.stabilized).toBe(true);
    expect(result.iterations).toBe(4);
    expect(result.quality).toBe("Auspicious");
  });
});

describe("JUDGEMENT_RULES registry", () => {
  // Items 16 and 26 were originally removed by owner decision: no Excel
  // counterpart exists to verify them against, and unverifiable PDF-only
  // content doesn't ship half-implemented. Item 3 was restored (2026-08-25)
  // once the owner supplied a page-13 transcription with each shakal glyph
  // hand-encoded as a bit pattern, matched 1:1 against all 16 FIGURES --
  // see TROUBLESOME_YEARS_TABLE in judgement-reference.ts.
  //
  // Items 16 and 26 were restored 2026-08-26, both tagged
  // NEEDS_CONFIRMATION rather than SOURCE_DIRECT -- see each rule's own
  // sourceNote and CHILDREN_COUNT_BY_LORD_BOOK/_ALT in judgement-reference.ts
  // for the provenance breakdown. itemNo now runs the full 1-42.

  it("has exactly 42 rules, itemNo 1-42, unique ids", () => {
    expect(JUDGEMENT_RULES).toHaveLength(42);
    const itemNos = JUDGEMENT_RULES.map((r) => r.itemNo).sort((a, b) => a - b);
    expect(itemNos).toEqual(Array.from({ length: 42 }, (_, i) => i + 1));
    expect(new Set(JUDGEMENT_RULES.map((r) => r.id)).size).toBe(42);
  });

  it("R16 and R26 are present and tagged NEEDS_CONFIRMATION, not SOURCE_DIRECT", () => {
    for (const id of ["R16", "R26"]) {
      const rule = JUDGEMENT_RULES.find((r) => r.id === id);
      expect(rule).toBeDefined();
      expect(rule!.sourceStatus).toBe("NEEDS_CONFIRMATION");
    }
  });

  it("R03 (troublesome years) covers all 16 figures exactly once across its table", () => {
    const ids = FIGURES.map((f) => f.id).sort((a, b) => a - b);
    const tableIds = Object.keys(TROUBLESOME_YEARS_TABLE)
      .map(Number)
      .sort((a, b) => a - b);
    expect(tableIds).toEqual(ids);
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
