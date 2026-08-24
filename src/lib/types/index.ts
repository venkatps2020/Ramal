// Core domain types for the Ramal calculation engine.
// Mirrors the canonical schema in the master specification (Appendix A) at the
// type level; no database layer exists yet -- reference data ships as static
// modules under lib/data, matching Nameology's "no backend" methodology.

/** A single Ramal symbol: "-" (rekha / hidden) or "0" (bindu / revealed). */
export type Symbol = "-" | "0";

/** The four tattva positions of a figure, top to bottom: Fire, Air, Water, Earth. */
export type FigurePattern = [Symbol, Symbol, Symbol, Symbol];

export type AgamNirgam = "AGAM" | "NIRGAM";
export type FigureNature = "DAKHIL" | "KHARIJ" | "SABIT" | "MUNQALIB";

/** One of the 16 canonical Shakals, keyed 1-16 exactly as Stihir Kundali houses. */
export interface Figure {
  id: number;
  pattern: FigurePattern;
  sourceName: string;
  lord: string;
  auspiciousness: string;
  type: AgamNirgam;
  raashi: string;
  nature: FigureNature;
  meaning: string;
  gender: string;
  direction: string;
  element: string;
  /** Cross-reference into TIMING_BLOCKS. */
  timingNumber: number;
}

export interface TimingEntry {
  place: number;
  days: number;
  months: number;
  years: number;
}

export interface TimingBlock {
  timingNumber: number;
  originalHouse: number;
  shakalName: string;
  entries: TimingEntry[];
}

export interface HouseInterpretation {
  id: number;
  figureName: string;
  primaryTheme: string;
  directItems: string;
  expandedItems: string;
  healthBody: string;
  familyRelationships: string;
  moneyMaterial: string;
  workCareer: string;
  travelMovement: string;
  psychologicalSpiritual: string;
  specialDerived: string;
  primaryQuestionUse: string;
  secondarySupportingHouses: string;
}

/**
 * Raw Dhruvank Questions catalogue row. `dhruvankRaw` is preserved verbatim
 * as NEEDS_CONFIRMATION reference data only -- see "Dhruvank -- deferred" in
 * the project plan. It must never be read by the calculation engine.
 */
export interface QuestionMasterEntry {
  house: number;
  theme: string;
  text: string;
  dhruvankRaw: string | null;
}

export interface GlossaryTerm {
  term: string;
  meaning: string;
}

/** The 16-place Prashna Kundali, indexed by house number 1-16. */
export type PrashnaChart = Record<number, FigurePattern>;

export type AnswerStatus = "YES" | "NO" | "CANT_PREDICT_TODAY" | "CALCULATION_ERROR";

export interface FourFigureDraw {
  /** Figure IDs (1-16) for the four Mother Figures, in draw order. Repeats allowed. */
  figureIds: [number, number, number, number];
}

export interface PredictionInput {
  draw: FourFigureDraw;
  questionHouse: number;
  questionType: AgamNirgam;
}

export interface TraceStep {
  label: string;
  detail: string;
  inputs?: Record<string, unknown>;
  output?: unknown;
}

export interface TimingResult {
  timingNumber: number;
  matches: Array<{ place: number; days: number; months: number; years: number }>;
  totalDays: number;
  totalMonths: number;
  totalYears: number;
  /** True when no matching pattern was found in the Sthir Kundali at all. */
  unavailable: boolean;
}

export interface PredictionResult {
  status: AnswerStatus;
  sthanBali: boolean;
  questionHouseFigure: FigurePattern | null;
  house1Figure: FigurePattern | null;
  resultFigure: FigurePattern | null;
  timing: TimingResult | null;
  chart: PrashnaChart | null;
  trace: TraceStep[];
}
