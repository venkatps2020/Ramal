// Timing engine. Source: Prediction!C59:G76 array formulas.
//
// Algorithm (confirmed from the actual array formulas, not just the spec's
// prose description in §15):
//   1. Find the Sthir Kundali house whose fixed pattern equals the final
//      result figure -> that house's Timings Number (Stihir Kundali row16).
//   2. Select the one Timings block for that Timings Number.
//   3. Scan the CURRENT prediction's own 16 constructed places (not the
//      Sthir Kundali) for every place whose pattern also equals the result
//      figure -- there can be zero, one, or several.
//   4. For each such place, read Days/Months/Years from the selected
//      Timings block and sum across all of them.
//   5. Normalize: 30 days = 1 month, 12 months = 1 year (with carry).
//
// Step 3 can legitimately find ZERO matching places -- the result figure
// is guaranteed to match one of the 16 canonical Sthir figures (step 1),
// but nothing guarantees that exact pattern also appears among this
// specific chart's own 16 constructed places. When that happens, matches
// is empty and totalDays/Months/Years are all correctly 0 -- verified
// against Excel's own formula (Prediction!E60:G60 = SUM over the
// IFERROR-blanked D61:G76 rows, which sums to 0 exactly like this does).
// It's real Excel behavior, not a bug -- but "0y 0m 0d" reads as "happens
// immediately" when it actually means "this method found no data", so
// the noPlaceMatch flag lets the UI show Quick Duration's always-
// resolvable estimate instead of a bare zero (owner request, 2026-08-26).
import { FIGURES } from "@/lib/data/figures";
import { TIMING_BLOCKS } from "@/lib/data/timings";
import { patternsEqual } from "@/lib/engines/figure";
import type { FigurePattern, PrashnaChart, TimingResult } from "@/lib/types";

export function computeTiming(resultFigure: FigurePattern, chart: PrashnaChart): TimingResult {
  const sthirMatch = FIGURES.find((f) => patternsEqual(f.pattern, resultFigure));
  if (!sthirMatch) {
    return { timingNumber: -1, matches: [], totalDays: 0, totalMonths: 0, totalYears: 0, unavailable: true, noPlaceMatch: false };
  }

  const block = TIMING_BLOCKS.find((b) => b.timingNumber === sthirMatch.timingNumber);
  if (!block) {
    return {
      timingNumber: sthirMatch.timingNumber,
      matches: [],
      totalDays: 0,
      totalMonths: 0,
      totalYears: 0,
      unavailable: true,
      noPlaceMatch: false,
    };
  }

  const matches: TimingResult["matches"] = [];
  for (let place = 1; place <= 16; place++) {
    if (patternsEqual(chart[place], resultFigure)) {
      const entry = block.entries.find((e) => e.place === place);
      matches.push({
        place,
        days: entry?.days ?? 0,
        months: entry?.months ?? 0,
        years: entry?.years ?? 0,
      });
    }
  }

  const sumDays = matches.reduce((s, m) => s + m.days, 0);
  const sumMonths = matches.reduce((s, m) => s + m.months, 0);
  const sumYears = matches.reduce((s, m) => s + m.years, 0);

  const extraMonthsFromDays = Math.floor(sumDays / 30);
  const totalDays = sumDays % 30;
  const totalMonthsRaw = sumMonths + extraMonthsFromDays;
  const extraYears = Math.floor(totalMonthsRaw / 12);
  const totalMonths = totalMonthsRaw % 12;
  const totalYears = sumYears + extraYears;

  return {
    timingNumber: sthirMatch.timingNumber,
    matches,
    totalDays,
    totalMonths,
    totalYears,
    unavailable: false,
    noPlaceMatch: matches.length === 0,
  };
}
