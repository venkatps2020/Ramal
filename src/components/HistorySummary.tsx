"use client";

import { useState } from "react";
import { FIGURES } from "@/lib/data/figures";
import { HOUSE_INTERPRETATIONS } from "@/lib/data/houses";
import type { HistoryEntry } from "@/lib/history";

const STATUS_LABEL: Record<string, string> = {
  YES: "Yes",
  NO: "No",
  CANT_PREDICT_TODAY: "Can't Predict Today",
  CALCULATION_ERROR: "Calculation Error",
};

/** dd/mm/yyyy, fixed format regardless of browser locale (unlike toLocaleDateString()). */
function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Collapsed-by-default list of the last 10 saved predictions (history itself is capped at 10), shown at the bottom of New Prediction. */
export default function HistorySummary({ entries }: { entries: HistoryEntry[] }) {
  const [open, setOpen] = useState(false);
  if (entries.length === 0) return null;

  return (
    <section className="rounded border border-black/10 p-4 dark:border-white/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs font-medium uppercase tracking-wide text-[#3b4a6b] dark:text-[#93a6d8]"
      >
        {open ? "Hide" : "Show"} recent predictions ({entries.length})
      </button>
      {open && (
        <ul className="mt-3 space-y-2">
          {entries.map((entry) => {
            const house = HOUSE_INTERPRETATIONS.find((h) => h.id === entry.questionHouse);
            const figureNames = entry.motherFigureIds
              .map((id) => `${id} ${FIGURES.find((f) => f.id === id)?.sourceName ?? "?"}`)
              .join(", ");
            return (
              <li key={entry.id} className="rounded border border-black/10 p-2 text-sm dark:border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">
                    House {entry.questionHouse} -- {house?.primaryTheme ?? "?"}
                  </span>
                  <span className="text-xs text-black/50 dark:text-white/50">{formatDate(entry.createdAt)}</span>
                </div>
                <p className="mt-0.5 text-xs text-black/60 dark:text-white/60">
                  {figureNames} &middot; {entry.questionType} &middot; Short Timing:{" "}
                  {entry.shortTiming ? "Yes" : "No"} &middot; {STATUS_LABEL[entry.status] ?? entry.status}
                  {entry.sthanBali && " · Sthan Bali"}
                  {entry.timingSummary && ` · ${entry.timingSummary}`}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
