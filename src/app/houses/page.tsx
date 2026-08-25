"use client";

import { useState } from "react";
import { HOUSE_INTERPRETATIONS } from "@/lib/data/houses";
import HouseDetailPanel from "@/components/HouseDetailPanel";

export default function HouseExplorerPage() {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">House Explorer</h1>
        <p className="mt-1 max-w-prose text-sm text-black/60 dark:text-white/60">
          All 12 houses of the Prashna Kundali. Pick one to see its full breakdown -- Direct source
          fields (green) and Interpretive fields (amber) organized by category.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
        {HOUSE_INTERPRETATIONS.map((house) => (
          <button
            key={house.id}
            type="button"
            onClick={() => setSelected((prev) => (prev === house.id ? null : house.id))}
            className={`rounded border p-3 text-left transition ${
              selected === house.id
                ? "border-[#3b4a6b] bg-[#3b4a6b]/10 dark:border-[#93a6d8] dark:bg-[#93a6d8]/10"
                : "border-black/10 hover:border-[#3b4a6b]/40 dark:border-white/10 dark:hover:border-[#93a6d8]/40"
            }`}
          >
            <p className="text-[11px] uppercase tracking-wide text-black/40 dark:text-white/40">
              House {house.id} &middot; {house.figureName}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-black/85 dark:text-white/85">{house.primaryTheme}</p>
          </button>
        ))}
      </div>

      {selected !== null && <HouseDetailPanel houseId={selected} />}
    </div>
  );
}
