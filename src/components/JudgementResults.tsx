"use client";

import { JUDGEMENT_RULES, type JudgementCategory, type JudgementContext } from "@/lib/engines/judgement";
import type { PrashnaChart } from "@/lib/types";

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

function categoryAnchor(cat: JudgementCategory): string {
  return `judgement-cat-${cat}`;
}

/** All 40 Judgement Library rules, computed live against one chart and grouped by category. Shared between /judgement and the New Prediction trace. */
export default function JudgementResults({ chart, ctx }: { chart: PrashnaChart; ctx: JudgementContext }) {
  const presentCategories = CATEGORY_ORDER.filter((cat) => JUDGEMENT_RULES.some((r) => r.category === cat));

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-1.5 border-b border-black/10 pb-3 dark:border-white/10" aria-label="Jump to category">
        {presentCategories.map((cat) => (
          <a
            key={cat}
            href={`#${categoryAnchor(cat)}`}
            className="rounded border border-black/15 px-2 py-1 text-[11px] uppercase tracking-wide hover:border-[#3b4a6b]/40 hover:text-[#3b4a6b] dark:border-white/15 dark:hover:border-[#93a6d8]/40 dark:hover:text-[#93a6d8]"
          >
            {CATEGORY_LABEL[cat]}
          </a>
        ))}
      </nav>
      {CATEGORY_ORDER.map((cat) => {
        const rules = JUDGEMENT_RULES.filter((r) => r.category === cat).sort((a, b) => a.itemNo - b.itemNo);
        if (rules.length === 0) return null;
        return (
          <section key={cat} id={categoryAnchor(cat)} className="scroll-mt-4 space-y-3">
            <h3 className="font-display text-base font-semibold">{CATEGORY_LABEL[cat]}</h3>
            <div className="space-y-2">
              {rules.map((rule) => {
                const outcome = rule.compute ? rule.compute(chart, ctx) : null;
                return (
                  <div key={rule.id} className="rounded border border-black/10 p-3 dark:border-white/10">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <span className="mono text-xs text-black/40 dark:text-white/40">#{rule.itemNo}</span>{" "}
                        <span className="font-medium">{rule.questionEn}</span>
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
