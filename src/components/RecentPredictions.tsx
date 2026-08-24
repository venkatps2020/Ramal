"use client";

import { useEffect, useState } from "react";
import { loadHistory, type HistoryEntry } from "@/lib/history";
import { FIGURES } from "@/lib/data/figures";

function figureName(id: number): string {
  return FIGURES.find((f) => f.id === id)?.sourceName ?? `#${id}`;
}

const STATUS_STYLE: Record<HistoryEntry["status"], string> = {
  YES: "text-emerald-700 dark:text-emerald-400",
  NO: "text-red-700 dark:text-red-400",
  CANT_PREDICT_TODAY: "text-amber-700 dark:text-amber-400",
  CALCULATION_ERROR: "text-red-700 dark:text-red-400",
};

export default function RecentPredictions() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setEntries(loadHistory());
  }, []);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-black/50 dark:text-white/50">
        No predictions yet -- run one from New Prediction and it will show up here.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-black/10 dark:divide-white/10">
      {entries.slice(0, 8).map((e) => (
        <li key={e.id} className="flex items-center justify-between py-2 text-sm">
          <div>
            <span className="font-medium">House {e.questionHouse}</span>{" "}
            <span className="text-black/50 dark:text-white/50">
              ({e.questionType.toLowerCase()}) -- {e.motherFigureIds.map(figureName).join(", ")}
            </span>
          </div>
          <span className={`font-mono text-xs uppercase ${STATUS_STYLE[e.status]}`}>
            {e.sthanBali ? "Sthan Bali / " : ""}
            {e.status}
          </span>
        </li>
      ))}
    </ul>
  );
}
