// Four-symbol figure arithmetic. Source: master spec §8 and Dhruwank!B15:Q18
// formulas -- same symbol equal? "-" : "0" rule at every one of the 4 tattva
// positions (tez, vayu, jal, prithvi).
import type { FigurePattern, Symbol } from "@/lib/types";

export function addBit(a: Symbol, b: Symbol): Symbol {
  return a === b ? "-" : "0";
}

export function addFigure(a: FigurePattern, b: FigurePattern): FigurePattern {
  return [addBit(a[0], b[0]), addBit(a[1], b[1]), addBit(a[2], b[2]), addBit(a[3], b[3])];
}

export function patternsEqual(a: FigurePattern, b: FigurePattern): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

export function countSymbol(pattern: FigurePattern, symbol: Symbol): number {
  return pattern.filter((s) => s === symbol).length;
}

export function isAllSame(pattern: FigurePattern): boolean {
  return countSymbol(pattern, "-") === 4 || countSymbol(pattern, "0") === 4;
}
