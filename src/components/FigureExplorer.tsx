"use client";

import { useState } from "react";
import { FIGURES } from "@/lib/data/figures";
import FigureGlyph from "@/components/FigureGlyph";
import FigureDetailPanel from "@/components/FigureDetailPanel";

/** Browsable grid of all 16 canonical figures; click one for its full FigureDetailPanel breakdown. */
export default function FigureExplorer() {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <p className="max-w-prose text-sm text-black/60 dark:text-white/60">
        All 16 canonical Stihir Kundali figures. Pick one to see its full attributes -- lord,
        nature, auspiciousness, timing number, and more.
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {FIGURES.map((figure) => (
          <button
            key={figure.id}
            type="button"
            onClick={() => setSelected((prev) => (prev === figure.id ? null : figure.id))}
            className={`flex items-center gap-2 rounded border p-2 text-left transition ${
              selected === figure.id
                ? "border-[#3b4a6b] bg-[#3b4a6b]/10 dark:border-[#93a6d8] dark:bg-[#93a6d8]/10"
                : "border-black/10 hover:border-[#3b4a6b]/40 dark:border-white/10 dark:hover:border-[#93a6d8]/40"
            }`}
          >
            <FigureGlyph pattern={figure.pattern} className="text-[#3b4a6b] dark:text-[#93a6d8]" />
            <div>
              <p className="text-[11px] uppercase tracking-wide text-black/40 dark:text-white/40">{figure.id}</p>
              <p className="text-sm font-medium text-black/85 dark:text-white/85">{figure.sourceName}</p>
            </div>
          </button>
        ))}
      </div>

      {selected !== null && <FigureDetailPanel figureId={selected} />}
    </div>
  );
}
