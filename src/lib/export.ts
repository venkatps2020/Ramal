// CSV export of a computed prediction: summary, 16-place Prashna Kundali,
// calculation trace, and Judgement Library results -- the same three things
// shown on the New Prediction page, flattened into one downloadable file.
import { CATEGORY_LABEL, CATEGORY_ORDER, JUDGEMENT_RULES, sthirFigureFor, type JudgementContext } from "@/lib/engines/judgement";
import { FIGURES } from "@/lib/data/figures";
import type { AgamNirgam, FigurePattern, PredictionResult } from "@/lib/types";

export interface PredictionExportInput {
  createdAt: string;
  motherFigureIds: [number, number, number, number];
  questionHouse: number;
  questionType: AgamNirgam;
  shortTiming: boolean;
  gender: "MALE" | "FEMALE";
  result: PredictionResult;
}

function figureLabel(pattern: FigurePattern | null): string {
  if (!pattern) return "";
  const fig = sthirFigureFor(pattern);
  return fig ? `${fig.id} ${fig.sourceName} (${pattern.join(" ")})` : pattern.join(" ");
}

function csvEscape(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csvRow(cells: (string | number)[]): string {
  return cells.map(csvEscape).join(",");
}

/** Builds the full CSV report as a single string (RFC 4180-style quoting, one section per blank-line-separated block). */
export function buildPredictionCsv(input: PredictionExportInput): string {
  const { result } = input;
  const lines: string[] = [];

  lines.push(csvRow(["Ramal Prediction Report"]));
  lines.push(csvRow(["Generated", input.createdAt]));
  lines.push("");

  lines.push(csvRow(["Summary"]));
  lines.push(csvRow(["Field", "Value"]));
  input.motherFigureIds.forEach((id, i) => {
    const fig = FIGURES.find((f) => f.id === id);
    lines.push(csvRow([`Mother Figure ${i + 1}`, fig ? `${fig.id} ${fig.sourceName} (${fig.pattern.join(" ")})` : String(id)]));
  });
  lines.push(csvRow(["House", input.questionHouse]));
  lines.push(csvRow(["Question Type", input.questionType === "AGAM" ? "Agam (incoming)" : "Nirgam (outgoing)"]));
  lines.push(csvRow(["Short Timing", input.shortTiming ? "Yes" : "No"]));
  lines.push(csvRow(["Gender", input.gender === "FEMALE" ? "Female" : "Male"]));
  lines.push(csvRow(["Status", result.status]));
  lines.push(csvRow(["Sthan Bali", result.sthanBali ? "Yes" : "No"]));
  if (result.questionHouseFigure) {
    lines.push(csvRow([`House ${input.questionHouse} Figure`, figureLabel(result.questionHouseFigure)]));
  }
  if (input.questionHouse !== 5 && result.house1Figure) {
    lines.push(csvRow(["House 1 Figure", figureLabel(result.house1Figure)]));
  }
  if (result.resultFigure) {
    lines.push(csvRow(["Result Figure", figureLabel(result.resultFigure)]));
  }

  if (result.timing && !input.shortTiming && result.status === "YES") {
    const t = result.timing;
    if (t.unavailable) {
      lines.push(csvRow(["Timing", "Unavailable -- no Sthir Kundali match"]));
    } else if (t.noPlaceMatch) {
      lines.push(
        csvRow(["Timing", `Result matches Sthir house ${t.sthirHouseId} -- not found among this chart's 16 places`])
      );
      if (result.quickDuration?.unitLabel) {
        lines.push(csvRow(["Quick Duration estimate", `${result.quickDuration.count} ${result.quickDuration.unitLabel}`]));
      }
    } else {
      lines.push(csvRow(["Timing", `${t.totalYears}y ${t.totalMonths}m ${t.totalDays}d`]));
      lines.push(csvRow(["Timing matched places", t.matches.map((m) => m.place).join(", ")]));
    }
  }
  if (result.quickDuration && input.shortTiming && result.status === "YES") {
    const q = result.quickDuration;
    lines.push(csvRow(["Quick Duration", q.sthirHouseId === null ? "Unavailable" : `${q.count} ${q.unitLabel}`]));
  }
  lines.push("");

  if (result.chart) {
    lines.push(csvRow(["16-place Prashna Kundali"]));
    lines.push(csvRow(["Place", "Pattern", "Matched Figure"]));
    for (let place = 1; place <= 16; place++) {
      const pattern = result.chart[place];
      lines.push(csvRow([place, pattern.join(" "), figureLabel(pattern)]));
    }
    lines.push("");
  }

  lines.push(csvRow(["Calculation Trace"]));
  lines.push(csvRow(["Step", "Label", "Detail"]));
  result.trace.forEach((step, i) => {
    lines.push(csvRow([i + 1, step.label, step.detail]));
  });
  lines.push("");

  if (result.chart) {
    const ctx: JudgementContext = { gender: input.gender, motherFigureIds: input.motherFigureIds };
    lines.push(csvRow(["Judgement Library"]));
    lines.push(csvRow(["Item", "Category", "Question", "Answer", "Detail", "Source Status"]));
    for (const cat of CATEGORY_ORDER) {
      const rules = JUDGEMENT_RULES.filter((r) => r.category === cat).sort((a, b) => a.itemNo - b.itemNo);
      for (const rule of rules) {
        const outcome = rule.compute ? rule.compute(result.chart, ctx) : null;
        lines.push(
          csvRow([
            rule.itemNo,
            CATEGORY_LABEL[cat],
            rule.questionEn,
            outcome?.answer ?? "",
            outcome?.detail ?? (rule.sourceNote ? `Not computed -- ${rule.sourceNote}` : ""),
            rule.sourceStatus,
          ])
        );
      }
    }
  }

  return lines.join("\n");
}

/** Triggers a browser download of `content` as `filename` -- same Blob + object-URL pattern as Nameology's bulk-check CSV export. */
export function downloadTextFile(filename: string, mimeType: string, content: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
