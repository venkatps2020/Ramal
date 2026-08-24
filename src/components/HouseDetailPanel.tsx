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

type Tone = "direct" | "interpretive" | "ppt";

const TONE_STYLES: Record<Tone, { badge: string; dot: string }> = {
  direct: { badge: "border-emerald-600/40 text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-600 dark:bg-emerald-400" },
  interpretive: { badge: "border-[#8a6a3c]/40 text-[#8a6a3c]", dot: "bg-[#8a6a3c]" },
  ppt: {
    badge: "border-[#3b4a6b]/40 text-[#3b4a6b] dark:border-[#93a6d8]/40 dark:text-[#93a6d8]",
    dot: "bg-[#3b4a6b] dark:bg-[#93a6d8]",
  },
};

function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={`rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${TONE_STYLES[tone].badge}`}>
      {children}
    </span>
  );
}

function SectionHeading({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <Badge tone={tone}>{tone === "ppt" ? "PPT" : tone === "direct" ? "Direct" : "Interpretive"}</Badge>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-black/55 dark:text-white/55">{children}</h4>
    </div>
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

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs italic text-black/40 dark:text-white/40">{children}</p>;
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
  const specialItems = dedupeText(house.specialDerived);

  return (
    <div className="mt-3 divide-y divide-black/10 rounded-lg border border-black/10 dark:divide-white/10 dark:border-white/10">
      <div className="p-4">
        <p className="text-[11px] uppercase tracking-wide text-black/40 dark:text-white/40">
          House {house.id} &middot; {house.figureName}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-black/85 dark:text-white/85">{house.primaryTheme}</p>
      </div>

      <div className="p-4">
        <SectionHeading tone="direct">What this house covers</SectionHeading>
        <ItemList items={directItems} tone="direct" />
        {pptNote && pptItems.length > 0 && (
          <>
            <p className="mt-3 text-[10px] uppercase tracking-wide text-black/40 dark:text-white/40">
              Also per PPT &middot; slide {pptNote.slideNumber}
            </p>
            <ItemList items={pptItems} tone="ppt" />
          </>
        )}
      </div>

      <div className="p-4">
        <SectionHeading tone="direct">Used for questions about</SectionHeading>
        <ItemList items={questionUseItems} tone="direct" />
      </div>

      {categoryItems.length > 0 && (
        <div className="p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-black/55 dark:text-white/55">By category</h4>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            {categoryItems.map(([label, items]) => (
              <div key={label}>
                <h5 className="text-[11px] font-semibold uppercase tracking-wide text-black/45 dark:text-white/45">{label}</h5>
                <ItemList items={items} tone="direct" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4">
        <button type="button" onClick={() => setMoreOpen((v) => !v)} className="flex items-center gap-2 text-left">
          <Badge tone="interpretive">Interpretive</Badge>
          <span className="text-xs font-semibold uppercase tracking-wide text-black/55 dark:text-white/55">
            {moreOpen ? "Hide" : "Show"} special / derived associations
          </span>
        </button>
        {moreOpen && (
          <div className="mt-3 space-y-4">
            <div>
              <h5 className="text-[11px] font-semibold uppercase tracking-wide text-black/45 dark:text-white/45">
                Special / derived associations
              </h5>
              {specialItems.length > 0 ? (
                <ItemList items={specialItems} tone="interpretive" />
              ) : (
                <EmptyNote>Nothing beyond what&apos;s already shown above.</EmptyNote>
              )}
            </div>
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
