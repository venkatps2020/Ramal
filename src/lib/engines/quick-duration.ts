// "Normal" / "Short Duration" quick unit-label lookup.
// Source: Prediction!B90:F91 -- a SEPARATE, simpler calculation from the
// main Timing engine (timing.ts, Prediction!C59:G76). This one just
// answers "which unit, and how many", gated by the Short Timing
// (Prediction!B8) flag: D90/E90/F90 run when B8="No" (Normal), D91/E91/F91
// when B8="Yes" (Short Duration). timing.ts's detailed Days/Months/Years
// aggregation runs unconditionally regardless of B8 -- this is additive,
// not a replacement.
//
// Two real formula bugs were originally found in the shipped workbook,
// confirmed by reading the raw formulas and cross-checking their cached
// values, not assumed:
//
//   1. F90 (NORMAL unit label) used to search the matched Sthir house
//      number against D93, D94, D95, D96 in sequence -- but D93 is blank
//      and D94 is a text label ("Then based on derived above number
//      following would be derived"), not table data. The real
//      Day/Week/Month/Year table lives at D95:D98 (1-4=Day, 5-8=Week,
//      9-12=Month, 13-16=Year). Searching D93:D96 instead of D95:D98
//      could only ever resolve "Day(s)" (house 1-4) or "Week(s)" (house
//      5-8); houses 9-16 always fell through to "" -- Month(s)/Year(s)
//      were unreachable.
//
//      FIXED (2026-08-26, owner decision): the owner corrected the F90
//      formula in the workbook itself to check D95:D98 directly, and
//      asked for this engine to match. Re-verified live against the
//      corrected Excel formula text (not just re-derived independently)
//      before this fix -- see the D95:D98 mapping below.
//
//   2. E91 (SHORT count) sums D86:D89 against E86:E89, one row shifted
//      from E90's correct D85:D88/E85:E88 pairing (D85=D42=tez,
//      D86=D43=vayu, D87=D44=jal, D88=D45=prithvi). E91 therefore excludes
//      the tez/first-symbol contribution (abjad weight 1) entirely and
//      pairs in a blank phantom D89/E89 row instead.
//
//      STILL REPRODUCED FAITHFULLY (not fixed) -- the owner has not asked
//      to correct this one. Excel is this project's primary executable
//      reference (master spec §2); bugs stay unless explicitly corrected.
import { FIGURES } from "@/lib/data/figures";
import { patternsEqual } from "@/lib/engines/figure";
import type { FigurePattern, QuickDurationResult, QuickDurationUnit } from "@/lib/types";

const ABJAD_VALUE = [1, 2, 3, 4] as const; // tez, vayu, jal, prithvi

function matchSthirHouse(resultFigure: FigurePattern): number | null {
  const fig = FIGURES.find((f) => patternsEqual(f.pattern, resultFigure));
  return fig ? fig.id : null;
}

export function computeQuickDuration(resultFigure: FigurePattern, shortTiming: boolean): QuickDurationResult {
  const sthirHouseId = matchSthirHouse(resultFigure);
  if (sthirHouseId === null) {
    return { mode: shortTiming ? "SHORT" : "NORMAL", sthirHouseId: null, count: null, unitLabel: "" };
  }

  if (!shortTiming) {
    // D90/E90/F90 -- E90's SUMIF correctly starts at D85 (=D42, tez), so
    // the count uses the full 4-symbol abjad sum with no bug.
    const count = ABJAD_VALUE.reduce((sum, weight, i) => sum + (resultFigure[i] === "0" ? weight : 0), 0);
    // D95:D98 table (Prediction!D95:E98, corrected 2026-08-26): 1-4=Day(s),
    // 5-8=Week(s), 9-12=Month(s), 13-16=Year(s).
    let unitLabel: QuickDurationUnit = "";
    if (sthirHouseId >= 1 && sthirHouseId <= 4) unitLabel = "Day(s)";
    else if (sthirHouseId >= 5 && sthirHouseId <= 8) unitLabel = "Week(s)";
    else if (sthirHouseId >= 9 && sthirHouseId <= 12) unitLabel = "Month(s)";
    else if (sthirHouseId >= 13 && sthirHouseId <= 16) unitLabel = "Year(s)";
    return { mode: "NORMAL", sthirHouseId, count, unitLabel };
  }

  // D91/E91/F91 -- E91's SUMIF starts at D86 (=D43, vayu), excluding tez
  // (weight 1) entirely -- see Bug 2 above. Weights 2/3/4 still pair with
  // their correct vayu/jal/prithvi positions; only the tez term is missing.
  const count = [2, 3, 4].reduce((sum, weight, i) => sum + (resultFigure[i + 1] === "0" ? weight : 0), 0);
  const unitLabel: QuickDurationUnit = sthirHouseId >= 1 && sthirHouseId <= 7 ? "Minutes" : "Hours";
  return { mode: "SHORT", sthirHouseId, count, unitLabel };
}
