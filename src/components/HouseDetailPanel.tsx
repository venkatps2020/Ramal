"use client";

import { useState } from "react";
import { HOUSE_INTERPRETATIONS } from "@/lib/data/houses";
import { SPECIAL_DERIVED_CATEGORY, normalizeSpecialDerivedItem } from "@/lib/data/special-derived-categories";
import { QUESTION_USE_CATEGORY } from "@/lib/data/question-use-categories";
import { QUESTION_MASTER } from "@/lib/data/questions";
import type { HouseInterpretation } from "@/lib/types";

const CATEGORIES: Array<[string, keyof HouseInterpretation]> = [
  ["Health / Body", "healthBody"],
  ["Family", "familyRelationships"],
  ["Money", "moneyMaterial"],
  ["Work / Career", "workCareer"],
  ["Travel", "travelMovement"],
  ["Psychological", "psychologicalSpiritual"],
];

/** These fields are semicolon-joined lists in the source sheet -- split into scannable items. */
function splitItems(text: string): string[] {
  return text
    .split(";")
    .map((s) => s.trim().replace(/\.$/, ""))
    .filter(Boolean);
}

function normalize(item: string): string {
  return item.toLowerCase().replace(/\s+/g, " ").trim().replace(/[.,]$/, "");
}

type Tone = "direct" | "interpretive" | "reference";

const TONE_STYLES: Record<Tone, { badge: string; dot: string }> = {
  direct: { badge: "border-emerald-600/40 text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-600 dark:bg-emerald-400" },
  interpretive: { badge: "border-[#8a6a3c]/40 text-[#8a6a3c]", dot: "bg-[#8a6a3c]" },
  reference: { badge: "border-black/25 text-black/55 dark:border-white/25 dark:text-white/55", dot: "bg-black/40 dark:bg-white/40" },
};

function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={`rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${TONE_STYLES[tone].badge}`}>
      {children}
    </span>
  );
}

/** One item per line, each with a small tone-colored marker -- easier to scan than wrapped pills. */
function ItemList({ items, tone = "direct" }: { items: string[]; tone?: Tone }) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-[13px] leading-snug text-black/80 dark:text-white/80">
          <span className={`mt-1.5 h-1.5 w-1.5 flex-none rounded-full ${TONE_STYLES[tone].dot}`} aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function HouseDetailPanel({ houseId }: { houseId: number }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const house = HOUSE_INTERPRETATIONS.find((h) => h.id === houseId);
  if (!house) return null;

  // Dedupe exact (normalized) repeats across the whole panel, in display
  // priority order -- expandedItems in particular tends to re-concatenate
  // phrases that already appear verbatim in the category fields above it,
  // and the PPT phrases often restate the same coverage as directItems.
  const seen = new Set<string>();
  function dedupe(items: string[]): string[] {
    const out: string[] = [];
    for (const item of items) {
      const key = normalize(item);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
    return out;
  }
  function dedupeText(text: string): string[] {
    return dedupe(splitItems(text));
  }

  // specialDerived and primaryQuestionUse items both get sorted into the
  // same "By category" buckets (owner request) instead of listed
  // separately -- classified by SPECIAL_DERIVED_CATEGORY /
  // QUESTION_USE_CATEGORY, keyed by normalized item text; question-use
  // items are also rewritten from question form ("Will I get money?") into
  // a bullet phrase ("Getting money"). Anything that doesn't match a
  // lookup (e.g. after houses.ts regenerates with different phrasing)
  // falls back to the collapsible section below rather than silently
  // disappearing.
  const specialDerivedByField = new Map<keyof HouseInterpretation, string[]>();
  const uncategorizedSpecialItems: string[] = [];
  for (const item of splitItems(house.specialDerived)) {
    const field = SPECIAL_DERIVED_CATEGORY[house.id]?.[normalizeSpecialDerivedItem(item)];
    if (field) {
      const bucket = specialDerivedByField.get(field) ?? [];
      bucket.push(item);
      specialDerivedByField.set(field, bucket);
    } else {
      uncategorizedSpecialItems.push(item);
    }
  }

  const questionUseByField = new Map<keyof HouseInterpretation, string[]>();
  const uncategorizedQuestionItems: string[] = [];
  for (const item of splitItems(house.primaryQuestionUse)) {
    const entry = QUESTION_USE_CATEGORY[house.id]?.[normalizeSpecialDerivedItem(item)];
    if (entry) {
      const bucket = questionUseByField.get(entry.field) ?? [];
      bucket.push(entry.bullet);
      questionUseByField.set(entry.field, bucket);
    } else {
      uncategorizedQuestionItems.push(item);
    }
  }

  const categoryItems = CATEGORIES.map(([label, field]) => {
    const direct = [...dedupeText(house[field] as string), ...dedupe(questionUseByField.get(field) ?? [])];
    const interpretive = dedupe(specialDerivedByField.get(field) ?? []);
    return [label, direct, interpretive] as const;
  }).filter(([, direct, interpretive]) => direct.length > 0 || interpretive.length > 0);

  const specialItems = dedupe(uncategorizedSpecialItems);
  const questionItems = dedupe(uncategorizedQuestionItems);

  // Dhruvank Questions sheet -- kept independent of the shared dedupe pass
  // above (a separate sheet, not part of the "12 Houses" data those items
  // come from). Only the question text is shown; the sheet's own
  // "Dhruvank" numeric code (e.g. "2,5,2") is undecoded -- no formula or
  // legend anywhere in the source explains what it means -- so it's never
  // surfaced here, per the same discipline that keeps unverified content
  // out of the Judgement Library.
  const dhruvankQuestions = QUESTION_MASTER.filter((q) => q.house === house.id).map((q) => q.text);

  return (
    <div className="mt-3 divide-y divide-black/10 rounded-lg border border-black/10 dark:divide-white/10 dark:border-white/10">
      <div className="p-4">
        <p className="text-[11px] uppercase tracking-wide text-black/40 dark:text-white/40">
          House {house.id} &middot; {house.figureName}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-black/85 dark:text-white/85">{house.primaryTheme}</p>
      </div>

      {categoryItems.length > 0 && (
        <div className="p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-black/55 dark:text-white/55">By category</h4>
          <div className="mt-2 grid gap-4 sm:grid-cols-3">
            {categoryItems.map(([label, direct, interpretive]) => (
              <div key={label}>
                <h5 className="text-[11px] font-semibold uppercase tracking-wide text-black/45 dark:text-white/45">{label}</h5>
                <ItemList items={direct} tone="direct" />
                <ItemList items={interpretive} tone="interpretive" />
              </div>
            ))}
          </div>
        </div>
      )}

      {dhruvankQuestions.length > 0 && (
        <div className="p-4">
          <div className="flex items-center gap-2">
            <Badge tone="reference">Reference</Badge>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-black/55 dark:text-white/55">
              Dhruvank Questions
            </h4>
          </div>
          <ItemList items={dhruvankQuestions} tone="reference" />
          <p className="mt-2 text-[11px] italic text-black/40 dark:text-white/40">
            From the source workbook&apos;s &quot;Dhruvank Questions&quot; sheet -- question wording only. The
            sheet&apos;s own numeric code per question is undecoded (no formula or legend explains it), so it
            isn&apos;t shown and these aren&apos;t computed answers.
          </p>
        </div>
      )}

      <div className="p-4">
        <button type="button" onClick={() => setMoreOpen((v) => !v)} className="flex items-center gap-2 text-left">
          <Badge tone="interpretive">Interpretive</Badge>
          <span className="text-xs font-semibold uppercase tracking-wide text-black/55 dark:text-white/55">
            {moreOpen ? "Hide" : "Show"} secondary supporting houses
          </span>
        </button>
        {moreOpen && (
          <div className="mt-3 space-y-4">
            {specialItems.length > 0 && (
              <div>
                <h5 className="text-[11px] font-semibold uppercase tracking-wide text-black/45 dark:text-white/45">
                  Special / derived associations
                </h5>
                <ItemList items={specialItems} tone="interpretive" />
              </div>
            )}
            {questionItems.length > 0 && (
              <div>
                <h5 className="text-[11px] font-semibold uppercase tracking-wide text-black/45 dark:text-white/45">
                  Used for questions about
                </h5>
                <ItemList items={questionItems} tone="direct" />
              </div>
            )}
            <div>
              <h5 className="text-[11px] font-semibold uppercase tracking-wide text-black/45 dark:text-white/45">
                Secondary supporting houses
              </h5>
              <p className="mt-1 text-[13px] leading-snug text-black/80 dark:text-white/80">{house.secondarySupportingHouses}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
