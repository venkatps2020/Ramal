import { describe, it, expect } from "vitest";
import { computeQuickDuration } from "@/lib/engines/quick-duration";
import { FIGURES } from "@/lib/data/figures";

// Real cached values from the workbook's own worked example (Prediction!
// B2:B5 = 2,8,4,9; result figure D42:D45 = -,0,-,-; matched Sthir house
// D90 = 8): E90 cached 2, F90 cached "Week(s)".
const BENCHMARK_RESULT_FIGURE = ["-", "0", "-", "-"] as const;

describe("computeQuickDuration -- NORMAL mode (Prediction!D90:F90)", () => {
  it("reproduces the workbook's own cached values exactly", () => {
    const r = computeQuickDuration(BENCHMARK_RESULT_FIGURE as never, false);
    expect(r.mode).toBe("NORMAL");
    expect(r.sthirHouseId).toBe(8);
    expect(r.count).toBe(2);
    expect(r.unitLabel).toBe("Week(s)");
  });

  it("resolves Day(s) for houses 1-4 and Week(s) for houses 5-8", () => {
    for (const fig of FIGURES) {
      const r = computeQuickDuration(fig.pattern, false);
      if (fig.id >= 1 && fig.id <= 4) expect(r.unitLabel).toBe("Day(s)");
      if (fig.id >= 5 && fig.id <= 8) expect(r.unitLabel).toBe("Week(s)");
    }
  });

  it("resolves Month(s) for houses 9-12 and Year(s) for houses 13-16 (fixed 2026-08-26, Prediction!D95:D98)", () => {
    // Prediction!F90 originally searched D93:D96 instead of D95:D98, so houses
    // 9-16 always fell through to a blank unit label. The owner fixed F90 in
    // the workbook itself to check D95:D98 directly; this mirrors that fix,
    // re-verified against the corrected live formula text before changing.
    for (const fig of FIGURES) {
      const r = computeQuickDuration(fig.pattern, false);
      if (fig.id >= 9 && fig.id <= 12) expect(r.unitLabel).toBe("Month(s)");
      if (fig.id >= 13 && fig.id <= 16) expect(r.unitLabel).toBe("Year(s)");
    }
  });

  it("count is the full 4-symbol abjad sum (tez=1, vayu=2, jal=3, prithvi=4)", () => {
    // Lahyan: 0,-,-,- -> only tez revealed -> count 1
    const lahyan = FIGURES.find((f) => f.sourceName === "Lahyan")!;
    expect(computeQuickDuration(lahyan.pattern, false).count).toBe(1);
    // Tariq: 0,0,0,0 -> all revealed -> count 1+2+3+4=10
    const tariq = FIGURES.find((f) => f.sourceName === "Tariq")!;
    expect(computeQuickDuration(tariq.pattern, false).count).toBe(10);
  });
});

describe("computeQuickDuration -- SHORT mode (Prediction!D91:F91)", () => {
  it("resolves Minutes for houses 1-7 and Hours for houses 8-16 (Prediction!D105/D106)", () => {
    for (const fig of FIGURES) {
      const r = computeQuickDuration(fig.pattern, true);
      if (fig.id >= 1 && fig.id <= 7) expect(r.unitLabel).toBe("Minutes");
      if (fig.id >= 8 && fig.id <= 16) expect(r.unitLabel).toBe("Hours");
    }
  });

  it("BUG (reproduced faithfully): excludes the tez/first-symbol contribution -- Prediction!E91 sums the wrong rows", () => {
    // Lahyan: 0,-,-,- -> tez is the ONLY revealed symbol. NORMAL mode counts
    // it (count=1); SHORT mode's shifted SUMIF never sees tez at all (count=0).
    const lahyan = FIGURES.find((f) => f.sourceName === "Lahyan")!;
    expect(computeQuickDuration(lahyan.pattern, false).count).toBe(1);
    expect(computeQuickDuration(lahyan.pattern, true).count).toBe(0);
  });

  it("count uses weights 2/3/4 for vayu/jal/prithvi when SHORT, matching NORMAL wherever tez is hidden", () => {
    // Benchmark figure has tez hidden ("-"), so excluding it changes nothing here.
    const r = computeQuickDuration(BENCHMARK_RESULT_FIGURE as never, true);
    expect(r.mode).toBe("SHORT");
    expect(r.sthirHouseId).toBe(8);
    expect(r.count).toBe(2);
    expect(r.unitLabel).toBe("Hours"); // house 8 -> Hours per D106, unlike NORMAL's Week(s)
  });
});

describe("computeQuickDuration -- structural guarantees", () => {
  it("every one of the 16 canonical figures matches its own house (no 'No Match' case in practice)", () => {
    for (const fig of FIGURES) {
      expect(computeQuickDuration(fig.pattern, false).sthirHouseId).toBe(fig.id);
      expect(computeQuickDuration(fig.pattern, true).sthirHouseId).toBe(fig.id);
    }
  });
});
