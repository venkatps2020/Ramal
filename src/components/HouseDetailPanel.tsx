"use client";

import { useState } from "react";
import { HOUSE_INTERPRETATIONS } from "@/lib/data/houses";
import { HOUSE_PPT_NOTES } from "@/lib/data/house-ppt-notes";
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

function Badge({ tone, children }: { tone: "direct" | "interpretive" | "ppt"; children: React.ReactNode }) {
  const styles = {
    direct: "border-emerald-600/40 text-emerald-700 dark:text-emerald-400",
    interpretive: "border-[#8a6a3c]/40 text-[#8a6a3c]",
    ppt: "border-[#3b4a6b]/40 text-[#3b4a6b] dark:border-[#93a6d8]/40 dark:text-[#93a6d8]",
  }[tone];
  return <span className={`rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${styles}`}>{children}</span>;
}

function TagList({ items, tone = "neutral" }: { items: string[]; tone?: "neutral" | "ppt" }) {
  if (items.length === 0) return null;
  const styles =
    tone === "ppt"
      ? "border-[#3b4a6b]/30 bg-[#3b4a6b]/[0.04] text-[#3b4a6b] dark:border-[#93a6d8]/30 dark:bg-[#93a6d8]/[0.06] dark:text-[#93a6d8]"
      : "border-black/10 bg-black/[0.03] text-black/75 dark:border-white/10 dark:bg-white/5 dark:text-white/75";
  return (
    <div className="mt-1 flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span key={i} className={`rounded-full border px-2 py-0.5 text-xs ${styles}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

function StackedList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-1 space-y-1">
      {items.map((item, i) => (
        <li
          key={i}
          className="rounded border border-black/10 bg-black/[0.02] px-2.5 py-1 text-black/75 dark:border-white/10 dark:bg-white/5 dark:text-white/75"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="mt-1 text-xs italic text-black/40 dark:text-white/40">Nothing beyond what&apos;s already shown above.</p>;
  return (
    <ul className="mt-1 list-disc space-y-0.5 pl-4 text-black/70 dark:text-white/70">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export default function HouseDetailPanel({ houseId }: { houseId: number }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const house = HOUSE_INTERPRETATIONS.find((h) => h.id === houseId);
  const pptNote = HOUSE_PPT_NOTES.find((n) => n.houseId === houseId);
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

  const directItems = dedupeText(house.directItems);
  const pptItems = pptNote ? dedupe(pptNote.phrases) : [];
  const questionUseItems = dedupeText(house.primaryQuestionUse);
  const categoryItems = CATEGORIES.map(([label, field]) => [label, dedupeText(house[field] as string)] as const).filter(
    ([, items]) => items.length > 0
  );
  const expandedItems = dedupeText(house.expandedItems);
  const specialItems = dedupeText(house.specialDerived);

  return (
    <div className="mt-3 space-y-4 rounded border border-black/10 p-4 text-sm dark:border-white/10">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="direct">Direct</Badge>
          {pptNote && <Badge tone="ppt">PPT &middot; slide {pptNote.slideNumber}</Badge>}
          <h4 className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">What this house covers</h4>
        </div>
        <TagList items={directItems} />
        <TagList items={pptItems} tone="ppt" />
      </div>

      <div>
        <div className="flex items-center gap-2">
          <Badge tone="direct">Direct</Badge>
          <h4 className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">Used for questions about</h4>
        </div>
        <StackedList items={questionUseItems} />
      </div>

      {categoryItems.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {categoryItems.map(([label, items]) => (
            <div key={label}>
              <h4 className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">{label}</h4>
              <TagList items={items} />
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-black/10 pt-3 dark:border-white/10">
        <button type="button" onClick={() => setMoreOpen((v) => !v)} className="flex items-center gap-2 text-left">
          <Badge tone="interpretive">Interpretive</Badge>
          <h4 className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
            {moreOpen ? "Hide" : "Show"} expanded &amp; derived associations
          </h4>
        </button>
        {moreOpen && (
          <div className="mt-2 space-y-3">
            <div>
              <h5 className="text-[11px] uppercase tracking-wide text-black/40 dark:text-white/40">
                Expanded items (new beyond what&apos;s shown above)
              </h5>
              <BulletList items={expandedItems} />
            </div>
            <div>
              <h5 className="text-[11px] uppercase tracking-wide text-black/40 dark:text-white/40">
                Special / derived associations
              </h5>
              <BulletList items={specialItems} />
            </div>
            <div>
              <h5 className="text-[11px] uppercase tracking-wide text-black/40 dark:text-white/40">
                Secondary supporting houses
              </h5>
              <p className="mt-0.5 text-black/70 dark:text-white/70">{house.secondarySupportingHouses}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
