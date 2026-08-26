// Judgement rule library: Ramal-jyotish.pdf, "फलादेश" (items 1-15 preamble
// rules) and "प्रगत रमल" (items 1-42, page-numbered separately in the
// source as its own 1-42 sequence -- this file uses that "प्रगत रमल"
// numbering throughout, cited as itemNo).
//
// Authority: this is PDF/conceptual source material (master spec §2), not
// the workbook. Every rule below is transcribed from the source text kept
// alongside it in comments.
//
// Items 16 (संतान संख्या) and 26 (चोर घर का या बाहर का) were originally
// removed by owner decision -- their source text couldn't be fully
// verified against Ramal Calculation.xlsx (no Excel counterpart exists for
// either), and per the owner's standing rule that verified Excel data is
// the final authority, unverifiable PDF-only content doesn't ship
// half-implemented. Item 3 (कष्टकारक साल) was removed for the same reason
// initially (the source page's hand-drawn shakal glyphs were illegible),
// then restored once the owner supplied a page-13 transcription with each
// shakal hand-encoded as an explicit bit-pattern -- see
// TROUBLESOME_YEARS_TABLE in judgement-reference.ts.
//
// Items 16 and 26 were restored 2026-08-26, both tagged
// sourceStatus: "NEEDS_CONFIRMATION" rather than SOURCE_DIRECT (the first
// rules in this file to use that tier): item 16 covers 7 of 9 planetary
// lords (6 direct from the book, 1 -- Mars -- from an independent
// alternate source; Rahu/Ketu still unknown), and item 26 uses an
// alternate-source formula since the book's own formula is confirmed
// mathematically degenerate. See CHILDREN_COUNT_BY_LORD_BOOK/_ALT in
// judgement-reference.ts and each rule's own sourceNote for the full
// provenance breakdown.
import { FIGURES } from "@/lib/data/figures";
import {
  ABJAD_ORDER,
  AGE_EXPECTANCY_TABLE,
  CHILDREN_COUNT_BY_LORD_ALT,
  CHILDREN_COUNT_BY_LORD_BOOK,
  TROUBLESOME_YEARS_TABLE,
} from "@/lib/data/judgement-reference";
import { addFigure, patternsEqual } from "@/lib/engines/figure";
import { buildPrashnaKundali } from "@/lib/engines/kundali";
import type { Figure, FigureNature, FigurePattern, PrashnaChart } from "@/lib/types";

// ---------------------------------------------------------------------------
// Classification primitives
// ---------------------------------------------------------------------------

const SHUBH_LEVELS = new Set(["Very Auspicious", "Auspicious", "Moderately Auspicious"]);
const ASHUBH_LEVELS = new Set(["Inauspicious", "Very Inauspicious", "Moderately Inauspicious"]);

/** SOURCE_DERIVED bucketing of the workbook's 6-level Auspiciousness scale into shubh/ashubh/neutral. */
export function sthirFigureFor(pattern: FigurePattern): Figure | null {
  return FIGURES.find((f) => patternsEqual(f.pattern, pattern)) ?? null;
}

export function natureOf(pattern: FigurePattern): FigureNature | null {
  return sthirFigureFor(pattern)?.nature ?? null;
}

export function isShubh(pattern: FigurePattern): boolean {
  const a = sthirFigureFor(pattern)?.auspiciousness;
  return a ? SHUBH_LEVELS.has(a) : false;
}

export function isAshubh(pattern: FigurePattern): boolean {
  const a = sthirFigureFor(pattern)?.auspiciousness;
  return a ? ASHUBH_LEVELS.has(a) : false;
}

export function isDakhilOrSabit(pattern: FigurePattern, opts: { requireShubh?: boolean } = {}): boolean {
  const n = natureOf(pattern);
  if (n !== "DAKHIL" && n !== "SABIT") return false;
  return opts.requireShubh ? isShubh(pattern) : true;
}

export function isKharijOrMunqalib(pattern: FigurePattern, opts: { requireShubh?: boolean } = {}): boolean {
  const n = natureOf(pattern);
  if (n !== "KHARIJ" && n !== "MUNQALIB") return false;
  return opts.requireShubh ? isShubh(pattern) : true;
}

function merge(chart: PrashnaChart, a: number, b: number): FigurePattern {
  return addFigure(chart[a], chart[b]);
}

function countBindu(patterns: FigurePattern[]): number {
  return patterns.reduce((s, p) => s + p.filter((x) => x === "0").length, 0);
}
function countRekha(patterns: FigurePattern[]): number {
  return patterns.reduce((s, p) => s + p.filter((x) => x === "-").length, 0);
}
function chartPlaces(chart: PrashnaChart, places: number[]): FigurePattern[] {
  return places.map((p) => chart[p]);
}
function allPlaces(chart: PrashnaChart): FigurePattern[] {
  return chartPlaces(chart, Array.from({ length: 16 }, (_, i) => i + 1));
}

const LORD_TO_WEEKDAY: Record<string, string> = {
  Sun: "Sunday",
  Moon: "Monday",
  Mars: "Tuesday",
  Mercury: "Wednesday",
  Jupiter: "Thursday",
  Venus: "Friday",
  Saturn: "Saturday",
  // Rahu/Ketu explicitly overridden in the source text (item 9):
  Rahu: "Saturday",
  Ketu: "Tuesday",
};

// ---------------------------------------------------------------------------
// Item 1: जातक की मनचिंता -- trace the origin of Place 15's first revealed
// (bindu) tattva back through the construction chain to a witness/mother
// place, then read that place's own Sthir Kundali identity as the querent's
// real underlying concern. Verified against the source's own worked
// example: Place 15's first bindu is at the Vayu position -> traces
// 15->14->11->5, and Place 5's pattern there matches Sthir house 8.
// ---------------------------------------------------------------------------

const PAIR_PARENTS: Record<number, [number, number]> = {
  16: [15, 1],
  15: [13, 14],
  14: [11, 12],
  13: [9, 10],
  12: [7, 8],
  11: [5, 6],
  10: [3, 4],
  9: [1, 2],
};

export interface ConcernTrace {
  originPlace: number;
  originFigure: Figure | null;
  path: number[];
}

export function traceConcernOrigin(chart: PrashnaChart): ConcernTrace | null {
  const start = chart[15];
  const pos = start.findIndex((s) => s === "0");
  if (pos === -1) return null; // Place 15 fully hidden -- source gives no rule for this case.

  const path = [15];
  let current = 15;
  while (current in PAIR_PARENTS) {
    const [p, q] = PAIR_PARENTS[current];
    // Exactly one parent has "0" at this position -- addBit("-","-")="-" and
    // addBit("0","0")="-", so a "0" child always has exactly one "0" parent.
    const next = chart[p][pos] === "0" ? p : q;
    path.push(next);
    current = next;
  }
  return { originPlace: current, originFigure: sthirFigureFor(chart[current]), path };
}

// ---------------------------------------------------------------------------
// Item 42: आनेवाला साल -- iteratively rebuild the chart from its own Places
// 13/10/11/14 (fed back in as new Mother Figures 1/2/3/4) until Place 1 =
// Place 13, Place 2 = Place 10, Place 3 = Place 11 and Place 4 = Place 14
// simultaneously ("Sabit Kundali"). Quality of the coming year depends on
// which iteration achieves this.
// ---------------------------------------------------------------------------

function isSabitStable(chart: PrashnaChart): boolean {
  return (
    patternsEqual(chart[1], chart[13]) &&
    patternsEqual(chart[2], chart[10]) &&
    patternsEqual(chart[3], chart[11]) &&
    patternsEqual(chart[4], chart[14])
  );
}

export interface SabitKundaliResult {
  iterations: number;
  stabilized: boolean;
  quality: string;
  charts: PrashnaChart[];
}

export function forecastUpcomingYear(
  motherFigureIds: [number, number, number, number],
  maxIterations = 8
): SabitKundaliResult {
  let ids = motherFigureIds;
  const charts: PrashnaChart[] = [];
  for (let i = 1; i <= maxIterations; i++) {
    const { chart } = buildPrashnaKundali(ids);
    charts.push(chart);
    if (isSabitStable(chart)) {
      const quality =
        i <= 2
          ? "Excellent"
          : i === 3
            ? "Good"
            : i === 4
              ? "Auspicious"
              : i === 5
                ? "Medium"
                : "Very Difficult";
      return { iterations: i, stabilized: true, quality, charts };
    }
    const nextFigures = [chart[13], chart[10], chart[11], chart[14]].map(sthirFigureFor);
    if (nextFigures.some((f) => f === null)) break; // structurally unreachable -- every pattern matches a figure
    ids = nextFigures.map((f) => f!.id) as [number, number, number, number];
  }
  return { iterations: maxIterations, stabilized: false, quality: "did not stabilize within iteration cap", charts };
}

// ---------------------------------------------------------------------------
// Rule registry
// ---------------------------------------------------------------------------

export type JudgementCategory =
  | "self"
  | "money"
  | "property"
  | "siblings"
  | "children"
  | "disease_enemies"
  | "marriage"
  | "death"
  | "fortune"
  | "career"
  | "income_wishes"
  | "expenditure_legal"
  | "theft";

export type SourceStatus = "SOURCE_DIRECT" | "SOURCE_DERIVED" | "NEEDS_CONFIRMATION";

export interface JudgementContext {
  gender?: "MALE" | "FEMALE";
  motherFigureIds?: [number, number, number, number];
}

export interface JudgementOutcome {
  answer: string;
  detail: string;
}

export interface JudgementRule {
  id: string;
  itemNo: number;
  questionHi: string;
  questionEn: string;
  category: JudgementCategory;
  sourceStatus: SourceStatus;
  sourceNote?: string;
  compute?: (chart: PrashnaChart, ctx: JudgementContext) => JudgementOutcome;
}

function natureTestRule(opts: {
  id: string;
  itemNo: number;
  questionHi: string;
  questionEn: string;
  category: JudgementCategory;
  houses: [number, number] | [number, number, number, number]; // 2 houses (single merge) or 4 (two-step A/B merge)
  test: "dakhil_sabit" | "kharij_munqalib";
  requireShubh?: boolean;
  yes: string;
  no: string;
  sourceStatus?: SourceStatus;
}): JudgementRule {
  return {
    id: opts.id,
    itemNo: opts.itemNo,
    questionHi: opts.questionHi,
    questionEn: opts.questionEn,
    category: opts.category,
    sourceStatus: opts.sourceStatus ?? "SOURCE_DIRECT",
    compute: (chart) => {
      let result: FigurePattern;
      if (opts.houses.length === 2) {
        result = merge(chart, opts.houses[0], opts.houses[1]);
      } else {
        const [h1, h2, h3, h4] = opts.houses;
        const a = merge(chart, h1, h2);
        const b = merge(chart, h3, h4);
        result = addFigure(a, b);
      }
      const pass =
        opts.test === "dakhil_sabit"
          ? isDakhilOrSabit(result, { requireShubh: opts.requireShubh })
          : isKharijOrMunqalib(result, { requireShubh: opts.requireShubh });
      const fig = sthirFigureFor(result);
      return {
        answer: pass ? opts.yes : opts.no,
        detail: `Result figure: ${fig?.sourceName ?? "?"} (${result.join(" ")}), nature ${natureOf(result) ?? "?"}${opts.requireShubh ? `, auspiciousness ${fig?.auspiciousness ?? "?"}` : ""}.`,
      };
    },
  };
}

/** Display order for categories; shared between JudgementResults (UI) and the CSV/PDF export. */
export const CATEGORY_ORDER: JudgementCategory[] = [
  "self",
  "money",
  "property",
  "siblings",
  "children",
  "marriage",
  "disease_enemies",
  "death",
  "fortune",
  "career",
  "income_wishes",
  "expenditure_legal",
  "theft",
];

export const CATEGORY_LABEL: Record<JudgementCategory, string> = {
  self: "Self / General",
  money: "Money",
  property: "Property",
  siblings: "Siblings",
  children: "Children",
  disease_enemies: "Disease & Enemies",
  marriage: "Marriage & Relationships",
  death: "Death & Missing Persons",
  fortune: "Fortune & Luck",
  career: "Career & Work",
  income_wishes: "Income & Wishes",
  expenditure_legal: "Expenditure, Legal & Jail",
  theft: "Theft",
};

export const JUDGEMENT_RULES: JudgementRule[] = [
  {
    id: "R01",
    itemNo: 1,
    questionHi: "जातक की मनचिंता",
    questionEn: "What is the querent really worried about?",
    category: "self",
    sourceStatus: "SOURCE_DIRECT",
    compute: (chart) => {
      const trace = traceConcernOrigin(chart);
      if (!trace) {
        return { answer: "Cannot trace", detail: "Place 15 is fully hidden -- the source gives no rule for this case." };
      }
      const name = trace.originFigure?.sourceName ?? "?";
      return {
        answer: `House ${trace.originFigure?.id ?? "?"} (${name})`,
        detail: `Traced Place 15's first revealed tattva through ${trace.path.join(" -> ")}.`,
      };
    },
  },
  {
    id: "R02",
    itemNo: 2,
    questionHi: "आयु मर्यादा",
    questionEn: "Life expectancy",
    category: "self",
    sourceStatus: "SOURCE_DIRECT",
    compute: (chart) => {
      const result = merge(chart, 1, 4);
      const nature = natureOf(result);
      const key = `${nature}:${isShubh(result) ? "shubh" : "ashubh"}`;
      const row = nature ? AGE_EXPECTANCY_TABLE[key] : undefined;
      return {
        answer: row ? `${row.age}, health ${row.health}` : "Neutral auspiciousness -- source table only covers shubh/ashubh",
        detail: `Merge of House 1 + House 4: nature ${nature ?? "?"}.`,
      };
    },
  },
  {
    id: "R03",
    itemNo: 3,
    questionHi: "कष्टकारक साल",
    questionEn: "Which years will be troublesome?",
    category: "self",
    sourceStatus: "SOURCE_DIRECT",
    sourceNote:
      "Owner-supplied page-13 transcription, each shakal hand-encoded as a bit-pattern and matched 1:1 against all 16 FIGURES (2026-08-25).",
    compute: (chart) => {
      const place1 = chart[1];
      const fig = sthirFigureFor(place1);
      const ages = fig ? TROUBLESOME_YEARS_TABLE[fig.id] : undefined;
      return {
        answer: ages ? ages.join(", ") : "Cannot determine",
        detail: `Place 1: ${fig?.sourceName ?? "?"} (${place1.join(" ")}).`,
      };
    },
  },
  natureTestRule({
    id: "R04",
    itemNo: 4,
    questionHi: "माँगा हुवा धन मिलेगा क्या?",
    questionEn: "Will borrowed/requested money be received?",
    category: "money",
    houses: [1, 2],
    test: "dakhil_sabit",
    yes: "Will be received (Dakhil = quickly)",
    no: "No",
  }),
  natureTestRule({
    id: "R05",
    itemNo: 5,
    questionHi: "खरीदी करे या ना करे?",
    questionEn: "Should I buy?",
    category: "money",
    houses: [7, 8],
    test: "dakhil_sabit",
    yes: "Go ahead",
    no: "Don't",
  }),
  natureTestRule({
    id: "R06",
    itemNo: 6,
    questionHi: "बिक्री करे या ना करें?",
    questionEn: "Should I sell?",
    category: "money",
    houses: [1, 2],
    test: "dakhil_sabit",
    yes: "Go ahead",
    no: "Don't",
  }),
  {
    id: "R07",
    itemNo: 7,
    questionHi: "स्नेह रखे तो नतीजा क्या होगा?",
    questionEn: "If affection is kept, what results?",
    category: "marriage",
    sourceStatus: "SOURCE_DERIVED",
    sourceNote: "Source doesn't explicitly scope the count to all 16 places; assumed here, matching item 20's usage.",
    compute: (chart) => {
      const total = countBindu(allPlaces(chart));
      const r = total % 4;
      const map: Record<number, string> = { 1: "Enmity", 2: "Friendship", 3: "Artificial (transactional)", 0: "Deceit" };
      return { answer: map[r], detail: `Total revealed (bindu) tattvas across all 16 places = ${total}, mod 4 = ${r}.` };
    },
  },
  {
    id: "R08",
    itemNo: 8,
    questionHi: "खतका जवाब आएगा क्या?",
    questionEn: "Will there be a reply to the letter?",
    category: "money",
    sourceStatus: "SOURCE_DIRECT",
    compute: (chart) => {
      const h5 = chart[5];
      const fig = sthirFigureFor(h5);
      const pass = isDakhilOrSabit(h5) || fig?.sourceName === "Faraha";
      return { answer: pass ? "Yes, a reply will come" : "No", detail: `House 5 figure: ${fig?.sourceName ?? "?"}, nature ${natureOf(h5) ?? "?"}.` };
    },
  },
  {
    id: "R09",
    itemNo: 9,
    questionHi: "भाग्यकारक दिन कौनसा?",
    questionEn: "Which day is auspicious?",
    category: "fortune",
    sourceStatus: "SOURCE_DIRECT",
    compute: (chart) => {
      const result = merge(chart, 2, 11);
      const fig = sthirFigureFor(result);
      const day = fig ? LORD_TO_WEEKDAY[fig.lord] : undefined;
      return { answer: day ?? "Unknown lord", detail: `Merge of House 2 + House 11 -> ${fig?.sourceName ?? "?"}, lord ${fig?.lord ?? "?"}.` };
    },
  },
  natureTestRule({
    id: "R10",
    itemNo: 10,
    questionHi: "भाई-बहन से सुख मिलेगा या नहीं?",
    questionEn: "Will there be happiness with siblings?",
    category: "siblings",
    houses: [1, 3],
    test: "dakhil_sabit",
    requireShubh: true,
    yes: "Yes",
    no: "No",
    sourceStatus: "SOURCE_DERIVED",
  }),
  natureTestRule({
    id: "R11",
    itemNo: 11,
    questionHi: "यह मकान खरीदी करे या ना करें?",
    questionEn: "Should I buy this house?",
    category: "property",
    houses: [4, 8],
    test: "dakhil_sabit",
    requireShubh: true,
    yes: "Buy it",
    no: "Don't",
    sourceStatus: "SOURCE_DERIVED",
  }),
  natureTestRule({
    id: "R12",
    itemNo: 12,
    questionHi: "खरेदी किये हुए मकान में रहना सही है या नहीं?",
    questionEn: "Is it right to live in the house I bought?",
    category: "property",
    houses: [1, 4, 2, 10],
    test: "dakhil_sabit",
    requireShubh: true,
    yes: "Yes, right to stay",
    no: "No",
    sourceStatus: "SOURCE_DERIVED",
  }),
  natureTestRule({
    id: "R13",
    itemNo: 13,
    questionHi: "प्लॉट (खाली जगह) खरेदी करे या ना करें?",
    questionEn: "Should I buy this plot?",
    category: "property",
    houses: [1, 4],
    test: "dakhil_sabit",
    requireShubh: true,
    yes: "Buy it",
    no: "Don't",
    sourceStatus: "SOURCE_DERIVED",
  }),
  {
    id: "R14",
    itemNo: 14,
    questionHi: "बोअर को पानी लगेगा अथवा नहीं?",
    questionEn: "Will the borewell find water?",
    category: "property",
    sourceStatus: "SOURCE_DIRECT",
    compute: (chart) => {
      const result = merge(chart, 1, 4);
      const fig = sthirFigureFor(result);
      const pass = isDakhilOrSabit(result) || fig?.sourceName === "Tariq";
      return { answer: pass ? "Water will be found" : "No", detail: `Merge of House 1 + House 4 -> ${fig?.sourceName ?? "?"}.` };
    },
  },
  {
    id: "R15",
    itemNo: 15,
    questionHi: "संतान पैदा होगी?",
    questionEn: "Will there be a child?",
    category: "children",
    sourceStatus: "SOURCE_DIRECT",
    compute: (chart) => {
      const a = chart[5];
      const b = merge(chart, 1, 7);
      const result = addFigure(a, b);
      const pass = isDakhilOrSabit(result);
      return { answer: pass ? "Yes" : "No", detail: `House 5 merged with (House 1 + House 7): nature ${natureOf(result) ?? "?"}.` };
    },
  },
  {
    id: "R16",
    itemNo: 16,
    questionHi: "संतान संख्या कितनी होगी?",
    questionEn: "How many children will there be?",
    category: "children",
    sourceStatus: "NEEDS_CONFIRMATION",
    sourceNote:
      "Uses the same trace-to-origin method as item 1 (Ramal-jyotish.pdf p.15: \"whichever figure results from the 15th-place trace, its lord gives the count\"). Six lord counts are direct from the book (Sun=4, Moon=5, Mercury=2, Jupiter=3, Venus=6, Saturn=1 -- corrected 2026-08-26, an earlier transcription had Mercury missing entirely and Moon's value wrong, see CLAUDE.md). Mars=4 is from a different, independent source, not this book (owner-supplied 2026-08-26). Rahu and Ketu remain unknown -- both are structurally reachable outcomes of traceConcernOrigin (checked), so this stays NEEDS_CONFIRMATION until they're found.",
    compute: (chart) => {
      const trace = traceConcernOrigin(chart);
      if (!trace || !trace.originFigure) {
        return { answer: "Cannot trace", detail: "Place 15 is fully hidden -- the source gives no rule for this case." };
      }
      const lord = trace.originFigure.lord;
      const fromBook = CHILDREN_COUNT_BY_LORD_BOOK[lord];
      const count = fromBook ?? CHILDREN_COUNT_BY_LORD_ALT[lord];
      if (count === undefined) {
        return {
          answer: "Not yet known",
          detail: `Traced to ${trace.originFigure.sourceName} (lord: ${lord}) -- no source value for this lord yet.`,
        };
      }
      return {
        answer: `${count}`,
        detail: `Traced to ${trace.originFigure.sourceName} (lord: ${lord})${
          fromBook === undefined ? " -- value from an alternate source, not Ramal-jyotish.pdf itself" : ""
        }.`,
      };
    },
  },
  {
    id: "R17",
    itemNo: 17,
    questionHi: "प्रेम में सफलता मिलेगी?",
    questionEn: "Will there be success in love?",
    category: "marriage",
    sourceStatus: "SOURCE_DIRECT",
    compute: (chart) => {
      const h5 = chart[5];
      const fig = sthirFigureFor(h5);
      if (isDakhilOrSabit(h5, { requireShubh: true })) return { answer: "Success", detail: `House 5: ${fig?.sourceName}, shubh ${natureOf(h5)}.` };
      if (isDakhilOrSabit(h5)) return { answer: "Success, but only with hard effort", detail: `House 5: ${fig?.sourceName}, ashubh ${natureOf(h5)}.` };
      if (fig?.sourceName === "Faraha") return { answer: "Success (Faraha exception)", detail: "House 5 is Faraha -- succeeds despite being Munqalib." };
      return { answer: "No", detail: `House 5: ${fig?.sourceName ?? "?"}.` };
    },
  },
  {
    id: "R18",
    itemNo: 18,
    questionHi: "शेअर्स-सट्टे में आज लाभ होगा अथवा नहीं?",
    questionEn: "Will there be profit in shares/speculation today?",
    category: "money",
    sourceStatus: "SOURCE_DIRECT",
    compute: (chart) => {
      const h5 = chart[5];
      const fig = sthirFigureFor(h5);
      if (isDakhilOrSabit(h5, { requireShubh: true })) return { answer: "Profit", detail: `House 5: ${fig?.sourceName}.` };
      if (isDakhilOrSabit(h5)) return { answer: "Profit, but small", detail: `House 5: ${fig?.sourceName}, ashubh.` };
      if (fig?.sourceName === "Faraha") return { answer: "Profit (Faraha exception)", detail: "House 5 is Faraha." };
      return { answer: "No profit", detail: `House 5: ${fig?.sourceName ?? "?"}.` };
    },
  },
  {
    id: "R19",
    itemNo: 19,
    questionHi: "क्या बीमारी चली आयेगी?",
    questionEn: "Will the illness go away?",
    category: "disease_enemies",
    sourceStatus: "SOURCE_DIRECT",
    compute: (chart) => {
      const result = merge(chart, 6, 1);
      const pass = isKharijOrMunqalib(result);
      return { answer: pass ? "Illness will go away" : "No", detail: `Merge of House 6 + House 1: nature ${natureOf(result) ?? "?"}.` };
    },
  },
  {
    id: "R20",
    itemNo: 20,
    questionHi: "अतीगंभीर हालात का मरीज जीवित रहेगा या नहीं?",
    questionEn: "Will a critically ill patient survive?",
    category: "disease_enemies",
    sourceStatus: "SOURCE_DIRECT",
    compute: (chart) => {
      const places = allPlaces(chart);
      const fireAir = places.reduce((s, p) => s + (p[0] === "0" ? 1 : 0) + (p[1] === "0" ? 1 : 0), 0);
      const waterEarth = places.reduce((s, p) => s + (p[2] === "0" ? 1 : 0) + (p[3] === "0" ? 1 : 0), 0);
      return {
        answer: fireAir > waterEarth ? "Will survive" : "Grave risk",
        detail: `Fire+Air revealed count = ${fireAir}, Water+Earth revealed count = ${waterEarth}.`,
      };
    },
  },
  {
    id: "R21",
    itemNo: 21,
    questionHi: "दूसरी शादी करने से लाभ होगा या नहीं?",
    questionEn: "Will a second marriage be beneficial?",
    category: "marriage",
    sourceStatus: "SOURCE_DIRECT",
    compute: (chart, ctx) => {
      const female = ctx.gender !== "MALE"; // default to the female-form computation if unspecified
      const a = female ? merge(chart, 1, 4) : merge(chart, 1, 7);
      const b = female ? merge(chart, 1, 7) : merge(chart, 1, 10);
      const result = addFigure(a, b);
      const pass = isDakhilOrSabit(result, { requireShubh: true });
      return {
        answer: pass ? "Beneficial" : "No",
        detail: `${female ? "Female" : "Male"} formula: nature ${natureOf(result) ?? "?"}. Set gender in context to be explicit.`,
      };
    },
  },
  natureTestRule({
    id: "R22",
    itemNo: 22,
    questionHi: "इच्छित व्यक्ति के साथ शादी होगी अथवा नहीं?",
    questionEn: "Will I marry the person I want?",
    category: "marriage",
    houses: [1, 11, 1, 7],
    test: "dakhil_sabit",
    requireShubh: true,
    yes: "Yes",
    no: "No",
    sourceStatus: "SOURCE_DERIVED",
  }),
  {
    id: "R23",
    itemNo: 23,
    questionHi: "लापता व्यक्ति जिंदा है या नहीं?",
    questionEn: "Is the missing person alive?",
    category: "death",
    sourceStatus: "SOURCE_DIRECT",
    compute: (chart) => {
      const total = countBindu(chartPlaces(chart, Array.from({ length: 15 }, (_, i) => i + 1)));
      return { answer: total > 32 ? "Alive" : "Not confirmed alive", detail: `Revealed tattvas across Places 1-15 = ${total} (threshold 32).` };
    },
  },
  {
    id: "R24",
    itemNo: 24,
    questionHi: "लापता व्यक्ति जिंदा है तो घर वापीस आयेगा अथवा नहीं?",
    questionEn: "If alive, will the missing person return home?",
    category: "death",
    sourceStatus: "SOURCE_DERIVED",
    sourceNote: "Source specifies this should use a fresh redraw for this specific follow-up question, not the original chart.",
    compute: (chart) => {
      const result = merge(chart, 3, 1);
      const pass = isDakhilOrSabit(result, { requireShubh: true });
      return { answer: pass ? "Will return" : "No", detail: `Merge of House 3 + House 1: nature ${natureOf(result) ?? "?"}.` };
    },
  },
  {
    id: "R25",
    itemNo: 25,
    questionHi: "चोरी हुई है या नहीं?",
    questionEn: "Did a theft actually happen?",
    category: "theft",
    sourceStatus: "SOURCE_DIRECT",
    compute: (chart) => {
      const h7 = chart[7];
      const guardNames = ["Humra", "Naqi", "Qabz-ul-Kharij", "Uputul-Kharij"];
      const fig = sthirFigureFor(h7);
      const notStolen = fig && guardNames.includes(fig.sourceName);
      return {
        answer: notStolen ? "No theft -- look for it at home" : "Theft occurred",
        detail: `House 7: ${fig?.sourceName ?? "?"}.`,
      };
    },
  },
  {
    id: "R26",
    itemNo: 26,
    questionHi: "अगर चोरी हुई है तो चोर घर का या बाहर का है?",
    questionEn: "If a theft happened, is the thief a household member, a neighbour, or an outsider?",
    category: "theft",
    sourceStatus: "NEEDS_CONFIRMATION",
    sourceNote:
      "The book's own formula (Ramal-jyotish.pdf p.16: hidden-tattva count + revealed-tattva count, divide by 3) is mathematically degenerate -- 16 places x 4 symbols = 64 total, always, regardless of the chart, so it always gives remainder 1 (re-verified 2026-08-26: the operative word is definitely \"add\"/मेल करें, not a misread of \"subtract\"). Owner supplied an alternate formula from a different, independent source instead (2026-08-26): (hidden-tattva count x 2) + revealed-tattva count, divide by 3 -- verified computationally to actually vary by chart (0/1/2), unlike the book's version. Not confirmed against the primary Ramal-jyotish.pdf lineage this app otherwise follows -- ships flagged NEEDS_CONFIRMATION pending that.",
    compute: (chart) => {
      const places = allPlaces(chart);
      const hidden = countRekha(places);
      const revealed = countBindu(places);
      const remainder = (hidden * 2 + revealed) % 3;
      const answer = remainder === 1 ? "Thief is a household/own person" : remainder === 2 ? "Thief is a neighbour" : "Thief is an outsider";
      return {
        answer,
        detail: `Hidden tattvas (rekha): ${hidden}, revealed tattvas (bindu): ${revealed}. (${hidden}x2 + ${revealed}) mod 3 = ${remainder}.`,
      };
    },
  },
  {
    id: "R27",
    itemNo: 27,
    questionHi: "चोरी हुई है तो चोर का स्वरूप कैसा है?",
    questionEn: "What does the thief look like?",
    category: "theft",
    sourceStatus: "SOURCE_DIRECT",
    sourceNote: "Verified against the source's own worked example (Humra -> abjad position 2 -> Sthir house 2 = Qabz-ul-Dakhil).",
    compute: (chart) => {
      const h7 = chart[7];
      const fig7 = sthirFigureFor(h7);
      if (!fig7) return { answer: "Unknown", detail: "House 7 did not match a canonical figure." };
      const abjadPos = ABJAD_ORDER.indexOf(fig7.id) + 1;
      const describedBy = FIGURES.find((f) => f.id === abjadPos);
      return {
        answer: describedBy?.sourceName ?? "Unknown",
        detail: `House 7 (${fig7.sourceName}) is at abjad position ${abjadPos} -> described by Sthir house ${abjadPos}'s figure: gender ${describedBy?.gender}, element ${describedBy?.element}, meaning "${describedBy?.meaning}".`,
      };
    },
  },
  natureTestRule({
    id: "R28",
    itemNo: 28,
    questionHi: "चोरी मिलेगी?",
    questionEn: "Will the stolen item be recovered?",
    category: "theft",
    houses: [2, 11, 1, 14],
    test: "dakhil_sabit",
    yes: "Will be recovered",
    no: "No",
  }),
  {
    id: "R29",
    itemNo: 29,
    questionHi: "चोर मिलेगा अथवा नहीं?",
    questionEn: "Will the thief be found?",
    category: "theft",
    sourceStatus: "SOURCE_DERIVED",
    sourceNote: "Source only states the remainder-1 (not-found) case explicitly; found/not-found is treated as a complement here.",
    compute: (chart) => {
      const total = countBindu(allPlaces(chart));
      const r = total % 2;
      return { answer: r === 1 ? "Thief will not be found" : "Thief will be found", detail: `Revealed tattvas across all 16 places = ${total}, mod 2 = ${r}.` };
    },
  },
  {
    id: "R30",
    itemNo: 30,
    questionHi: "चोर फिलहाल कहाँ है?",
    questionEn: "Where is the thief right now?",
    category: "theft",
    sourceStatus: "SOURCE_DIRECT",
    compute: (chart) => {
      const result = merge(chart, 1, 3);
      const pass = isKharijOrMunqalib(result);
      return { answer: pass ? "Has left the village/area" : "Still nearby", detail: `Merge of House 1 + House 3: nature ${natureOf(result) ?? "?"}.` };
    },
  },
  {
    id: "R31",
    itemNo: 31,
    questionHi: "चोर कौनसी दिशा में गया?",
    questionEn: "Which direction did the thief go?",
    category: "theft",
    sourceStatus: "SOURCE_DIRECT",
    compute: (chart) => {
      const fig = sthirFigureFor(chart[7]);
      return { answer: fig?.direction ?? "Unknown", detail: `House 7: ${fig?.sourceName ?? "?"}.` };
    },
  },
  {
    id: "R32",
    itemNo: 32,
    questionHi: "कर्जा मिलेगा या नहीं?",
    questionEn: "Will the loan be approved?",
    category: "money",
    sourceStatus: "SOURCE_DIRECT",
    compute: (chart) => {
      const result = merge(chart, 1, 6);
      if (isDakhilOrSabit(result, { requireShubh: true })) return { answer: "Will get it easily", detail: `nature ${natureOf(result)}.` };
      if (isDakhilOrSabit(result)) return { answer: "Difficult and delayed", detail: `nature ${natureOf(result)}, ashubh.` };
      return { answer: "No", detail: `nature ${natureOf(result) ?? "?"}.` };
    },
  },
  natureTestRule({
    id: "R33",
    itemNo: 33,
    questionHi: "कर्जा चला जायेगा अथवा नहीं?",
    questionEn: "Will the debt go away?",
    category: "money",
    houses: [1, 12],
    test: "kharij_munqalib",
    yes: "Will go away",
    no: "No",
    sourceStatus: "SOURCE_DERIVED",
  }),
  {
    id: "R34",
    itemNo: 34,
    questionHi: "सपने का फल अच्छा है या बुरा?",
    questionEn: "Is the dream's meaning good or bad?",
    category: "fortune",
    sourceStatus: "SOURCE_DIRECT",
    compute: (chart) => {
      const result = merge(chart, 1, 9);
      return { answer: isShubh(result) ? "Good/auspicious" : "Not favourable", detail: `Merge of House 1 + House 9, auspiciousness ${sthirFigureFor(result)?.auspiciousness ?? "?"}.` };
    },
  },
  {
    id: "R35",
    itemNo: 35,
    questionHi: "अभी का कामकाज अच्छा है या उसमें बदलाव करें?",
    questionEn: "Is my current work good, or should I change it?",
    category: "career",
    sourceStatus: "SOURCE_DERIVED",
    compute: (chart) => {
      const a = merge(chart, 1, 10);
      const b = merge(chart, 1, 4);
      const result = addFigure(a, b);
      if (isDakhilOrSabit(result, { requireShubh: true })) return { answer: "Good as is -- no need to change", detail: `nature ${natureOf(result)}.` };
      return { answer: "Change would be beneficial", detail: `nature ${natureOf(result) ?? "?"}.` };
    },
  },
  {
    id: "R36",
    itemNo: 36,
    questionHi: "मुकदमा जीत जायेगा या नहीं?",
    questionEn: "Will the court case be won?",
    category: "expenditure_legal",
    sourceStatus: "SOURCE_DERIVED",
    compute: (chart) => {
      const a = merge(chart, 1, 9);
      const b = merge(chart, 3, 10);
      const result = addFigure(a, b);
      const pass = isDakhilOrSabit(result, { requireShubh: true });
      const best = pass && (patternsEqual(result, chart[1]) || patternsEqual(result, chart[15]));
      return {
        answer: pass ? (best ? "Win -- best possible outcome" : "Win") : "No",
        detail: `nature ${natureOf(result) ?? "?"}${best ? "; result also matches House 1 or House 15" : ""}.`,
      };
    },
  },
  {
    id: "R37",
    itemNo: 37,
    questionHi: "इच्छापूर्ती होगी?",
    questionEn: "Will my wish be fulfilled?",
    category: "income_wishes",
    sourceStatus: "SOURCE_DIRECT",
    compute: (chart) => {
      const simple = merge(chart, 1, 11);
      const simplePass = isDakhilOrSabit(simple, { requireShubh: true });
      const a = merge(chart, 1, 11);
      const b = merge(chart, 1, 12);
      const result = addFigure(a, b);
      const appears = Array.from({ length: 16 }, (_, i) => i + 1).some((p) => patternsEqual(chart[p], result));
      return {
        answer: appears || simplePass ? "Wish will be fulfilled" : "No",
        detail: `Two-step merge appears in chart: ${appears}. Simple method (House 1 + House 11 shubh Dakhil/Sabit): ${simplePass}.`,
      };
    },
  },
  {
    id: "R38",
    itemNo: 38,
    questionHi: "साझेदारी करें या ना करें?",
    questionEn: "Should I enter this partnership?",
    category: "income_wishes",
    sourceStatus: "SOURCE_DERIVED",
    compute: (chart) => {
      const a = merge(chart, 11, 1);
      const b = merge(chart, 3, 1);
      const result = addFigure(a, b);
      const pass = isDakhilOrSabit(result, { requireShubh: true }) || isKharijOrMunqalib(result, { requireShubh: true });
      return { answer: pass ? "Go ahead" : "No", detail: `nature ${natureOf(result) ?? "?"}, auspiciousness ${sthirFigureFor(result)?.auspiciousness ?? "?"}.` };
    },
  },
  natureTestRule({
    id: "R39",
    itemNo: 39,
    questionHi: "कैदी छूटेगा अथवा नहीं?",
    questionEn: "Will the prisoner be released?",
    category: "expenditure_legal",
    houses: [1, 12],
    test: "kharij_munqalib",
    yes: "Will be released",
    no: "No",
    sourceStatus: "SOURCE_DERIVED",
  }),
  {
    id: "R40",
    itemNo: 40,
    questionHi: "कर्जा/उधार/पैसा देना या नहीं?",
    questionEn: "Should I lend this money?",
    category: "expenditure_legal",
    sourceStatus: "SOURCE_DIRECT",
    compute: (chart) => {
      const result = merge(chart, 1, 12);
      return { answer: isShubh(result) ? "Safe to lend" : "Risky", detail: `Merge of House 1 + House 12, auspiciousness ${sthirFigureFor(result)?.auspiciousness ?? "?"}.` };
    },
  },
  {
    id: "R41",
    itemNo: 41,
    questionHi: "आज का दिन कैसा रहेगा?",
    questionEn: "How will today go?",
    category: "self",
    sourceStatus: "SOURCE_DIRECT",
    compute: (chart) => {
      const result = merge(chart, 1, 11);
      return { answer: isShubh(result) ? "Beneficial" : "Loss-prone", detail: `Merge of House 1 + House 11, auspiciousness ${sthirFigureFor(result)?.auspiciousness ?? "?"}.` };
    },
  },
  {
    id: "R42",
    itemNo: 42,
    questionHi: "आनेवाला साल कैसा रहेगा?",
    questionEn: "How will the coming year go?",
    category: "fortune",
    sourceStatus: "SOURCE_DIRECT",
    sourceNote:
      "Iteration/quality semantics confirmed against the source's own worked example (Ramal-jyotish.pdf p.18), now anchored to its actual Kundali #1 draw (2026-08-26, see judgement.test.ts): the diagram-confirmed Mother Figures (Lahyan, Humra, Nusrat-ul-Kharij, Bayaz) reproduce places 1-6 exactly, and running them through this engine's own construction independently lands on iteration 4, quality Auspicious -- matching the source's stated conclusion. Places 7-16 of the hand-drawn diagram could not be independently reconciled (all 8 addFigure relationships failed when checked purely against the owner's own transcription, ruling out isolated typos -- a scan-legibility issue, not an algorithm bug, since kundali.ts is separately oracle-verified across all 1,572,864 cases) -- this is not a cell-by-cell diagram match, but reproducing the final answer from the diagram-confirmed starting figures is a stronger, more direct check than the prose-only citation this replaced.",
    compute: (_chart, ctx) => {
      if (!ctx.motherFigureIds) {
        return { answer: "Needs the original four Mother Figures", detail: "This rule rebuilds the chart iteratively and needs the draw, not just the resulting chart." };
      }
      const result = forecastUpcomingYear(ctx.motherFigureIds);
      return {
        answer: result.stabilized ? result.quality : "Did not stabilize",
        detail: `Stabilized ${result.stabilized ? `at iteration ${result.iterations}` : `within ${result.iterations} iterations (cap reached)`}.`,
      };
    },
  },
];
