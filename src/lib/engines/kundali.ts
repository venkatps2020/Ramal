// 16-place Prashna Kundali construction.
//
// Places 1-4: the four Mother Figures, in draw order (Prediction!B2:B5).
// Places 5-8: the "witness" transpose -- read horizontally across the four
//   Mother Figures' rows (Prediction!J30:M33, traced back to Q30:Q33 etc.).
//   Place 5 = row 1 (tez) of mothers 1-4, Place 6 = row 2 (vayu), Place 7 =
//   row 3 (jal), Place 8 = row 4 (prithvi). Confirmed directly from the
//   workbook's array formulas, not inferred from the handwritten notes alone.
// Places 9-16: pairwise addFigure per master spec §10 / Prediction!B34:Q34
//   labels (9=1+2, 10=3+4, 11=5+6, 12=7+8, 13=9+10, 14=11+12, 15=13+14,
//   16=15+1). The 16=15+1 rule is workbook-current and flagged versioned/
//   configurable per spec §30.
import { FIGURES } from "@/lib/data/figures";
import { addFigure, countSymbol } from "@/lib/engines/figure";
import type { FigurePattern, PrashnaChart, Symbol } from "@/lib/types";

export type KundaliStatus = "OK" | "CALCULATION_ERROR" | "CANT_PREDICT_TODAY";

export interface KundaliResult {
  chart: PrashnaChart;
  status: KundaliStatus;
}

export function getFigurePattern(figureId: number): FigurePattern {
  const figure = FIGURES.find((f) => f.id === figureId);
  if (!figure) {
    throw new Error(`Unknown figure id: ${figureId}`);
  }
  return figure.pattern;
}

function transposeRow(mothers: FigurePattern[], rowIndex: number): FigurePattern {
  return [
    mothers[0][rowIndex],
    mothers[1][rowIndex],
    mothers[2][rowIndex],
    mothers[3][rowIndex],
  ];
}

/**
 * Guard scope is deliberately narrow and literal: the workbook (Prediction!
 * C35/C36) only ever checks Place 15 for the three-identical error, and
 * Place 15 OR Place 1 for the four-identical guard -- not every constructed
 * place. Master spec §30/§11 flags this scope as an open owner decision;
 * this implementation matches the workbook exactly rather than generalizing
 * silently.
 */
export function checkGuards(place15: FigurePattern, place1: FigurePattern): KundaliStatus {
  const threeIdentical = (p: FigurePattern) => countSymbol(p, "0") === 3 || countSymbol(p, "-") === 3;
  const fourIdentical = (p: FigurePattern) => countSymbol(p, "0") === 4 || countSymbol(p, "-") === 4;

  if (threeIdentical(place15)) return "CALCULATION_ERROR";
  if (fourIdentical(place15) || fourIdentical(place1)) return "CANT_PREDICT_TODAY";
  return "OK";
}

export function buildPrashnaKundali(motherFigureIds: [number, number, number, number]): KundaliResult {
  const mothers = motherFigureIds.map(getFigurePattern);
  const chart: PrashnaChart = {};

  chart[1] = mothers[0];
  chart[2] = mothers[1];
  chart[3] = mothers[2];
  chart[4] = mothers[3];

  chart[5] = transposeRow(mothers, 0);
  chart[6] = transposeRow(mothers, 1);
  chart[7] = transposeRow(mothers, 2);
  chart[8] = transposeRow(mothers, 3);

  chart[9] = addFigure(chart[1], chart[2]);
  chart[10] = addFigure(chart[3], chart[4]);
  chart[11] = addFigure(chart[5], chart[6]);
  chart[12] = addFigure(chart[7], chart[8]);
  chart[13] = addFigure(chart[9], chart[10]);
  chart[14] = addFigure(chart[11], chart[12]);
  chart[15] = addFigure(chart[13], chart[14]);
  chart[16] = addFigure(chart[15], chart[1]);

  const status = checkGuards(chart[15], chart[1]);
  return { chart, status };
}

export type { Symbol };
