"use client";

import { useMemo, useState } from "react";
import { buildPrashnaKundali } from "@/lib/engines/kundali";
import { JUDGEMENT_RULES, type JudgementCategory } from "@/lib/engines/judgement";
import { FIGURES } from "@/lib/data/figures";
import FigureGlyph from "@/components/FigureGlyph";

const CATEGORY_LABEL: Record<JudgementCategory, string> = {
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

const CATEGORY_ORDER: JudgementCategory[] = [
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

const STATUS_PILL: Record<string, string> = {
  SOURCE_DIRECT: "border-emerald-600/40 text-emerald-700 dark:text-emerald-400",
  SOURCE_DERIVED: "border-[#8a6a3c]/40 text-[#8a6a3c]",
  NEEDS_CONFIRMATION: "border-red-600/40 text-red-700 dark:text-red-400",
};

function randomFigureId(): number {
  return Math.floor(Math.random() * 16) + 1;
}

export default function JudgementLibraryPage() {
  const [figureIds, setFigureIds] = useState<[number, number, number, number]>([1, 2, 3, 4]);
  const [gender, setGender] = useState<"FEMALE" | "MALE">("FEMALE");

  const { chart, status } = useMemo(() => buildPrashnaKundali(figureIds), [figureIds]);

  const categories = Array.from(new Set(CATEGORY_ORDER));

  function setFigureAt(index: number, id: number) {
    setFigureIds((prev) => {
      const next = [...prev] as [number, number, number, number];
      next[index] = id;
      return next;
    });
  }

  function drawRandom() {
    setFigureIds([randomFigureId(), randomFigureId(), randomFigureId(), randomFigureId()]);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Judgement Library</h1>
        <p className="mt-1 max-w-prose text-sm text-black/60 dark:text-white/60">
          39 practical judgement rules from the source PDF (loans, property, marriage, theft,
          court cases, and more), computed live against one chart. Three source items (difficult
          years, number of children, thief inside/outside) were dropped by owner decision -- their
          source text has no Excel counterpart to verify against.
        </p>
      </div>

      <section className="space-y-3 rounded border border-black/10 p-4 dark:border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-black/60 dark:text-white/60">
            Four Mother Figures
          </h2>
          <button
            type="button"
            onClick={drawRandom}
            className="rounded border border-black/15 px-3 py-1 text-xs uppercase tracking-wide hover:border-black/30 dark:border-white/15"
          >
            Draw random
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {figureIds.map((id, i) => (
            <div key={i} className="flex items-center gap-2 rounded border border-black/10 p-2 dark:border-white/10">
              <select
                value={id}
                onChange={(e) => setFigureAt(i, Number(e.target.value))}
                className="w-full rounded border border-black/15 bg-transparent px-1.5 py-1 text-xs dark:border-white/15"
              >
                {FIGURES.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.sourceName}
                  </option>
                ))}
              </select>
              <FigureGlyph pattern={FIGURES.find((f) => f.id === id)!.pattern} className="text-[#3b4a6b] dark:text-[#93a6d8]" />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-black/50 dark:text-white/50">Gender (for R21):</span>
          {(["FEMALE", "MALE"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              className={`rounded border px-2 py-1 text-xs ${
                gender === g
                  ? "border-[#3b4a6b] bg-[#3b4a6b]/10 text-[#3b4a6b] dark:border-[#93a6d8] dark:text-[#93a6d8]"
                  : "border-black/15 dark:border-white/15"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
        {status !== "OK" && (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Note: this draw triggers the main engine&apos;s {status} guard. Judgement Library rules
            still compute against the raw chart regardless (item 42 in particular ignores the guard by
            source design), so results are shown, but treat them as illustrative for this specific draw.
          </p>
        )}
      </section>

      {categories.map((cat) => {
        const rules = JUDGEMENT_RULES.filter((r) => r.category === cat).sort((a, b) => a.itemNo - b.itemNo);
        if (rules.length === 0) return null;
        return (
          <section key={cat} className="space-y-3">
            <h2 className="font-display text-lg font-semibold">{CATEGORY_LABEL[cat]}</h2>
            <div className="space-y-2">
              {rules.map((rule) => {
                const outcome = rule.compute ? rule.compute(chart, { gender, motherFigureIds: figureIds }) : null;
                return (
                  <div key={rule.id} className="rounded border border-black/10 p-3 dark:border-white/10">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <span className="mono text-xs text-black/40 dark:text-white/40">#{rule.itemNo}</span>{" "}
                        <span className="font-medium">{rule.questionEn}</span>
                        <div className="text-xs text-black/45 dark:text-white/45">{rule.questionHi}</div>
                      </div>
                      <span className={`rounded border px-2 py-0.5 text-[10px] uppercase tracking-wide ${STATUS_PILL[rule.sourceStatus]}`}>
                        {rule.sourceStatus.replace("_", " ")}
                      </span>
                    </div>
                    {outcome ? (
                      <div className="mt-2 text-sm">
                        <span className="font-medium text-[#3b4a6b] dark:text-[#93a6d8]">{outcome.answer}</span>
                        <p className="mt-0.5 text-xs text-black/50 dark:text-white/50">{outcome.detail}</p>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-black/50 dark:text-white/50">
                        Not computed -- {rule.sourceNote}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
