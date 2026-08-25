"use client";

import { useState } from "react";
import { FIGURES } from "@/lib/data/figures";
import { FIGURE_NAME_GLOSS, type GlossConfidence } from "@/lib/data/figure-name-glosses";
import { patternsEqual } from "@/lib/engines/figure";
import FigureGlyph from "@/components/FigureGlyph";
import type { PrashnaChart } from "@/lib/types";

const GLOSS_STYLE: Record<GlossConfidence, string> = {
  high: "text-black/60 dark:text-white/60",
  medium: "text-black/45 dark:text-white/45",
  uncertain: "italic text-black/35 dark:text-white/35",
};

/** Full "Stihir Kundali" sheet reference table: the 16 fixed canonical figures. Collapsed by default. */
export default function StihirKundaliTable({ chart }: { chart?: PrashnaChart | null }) {
  const [open, setOpen] = useState(false);

  function matchedPlaces(figureId: number): number[] {
    if (!chart) return [];
    const pattern = FIGURES.find((f) => f.id === figureId)!.pattern;
    const places: number[] = [];
    for (let place = 1; place <= 16; place++) {
      if (patternsEqual(chart[place], pattern)) places.push(place);
    }
    return places;
  }

  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-semibold">Stihir Kundali (reference)</h2>
      <p className="mt-1 text-sm text-black/60 dark:text-white/60">
        The 16 canonical figures, fixed and unchanging -- exactly as in the &quot;Stihir Kundali&quot; sheet of{" "}
        <code>Ramal Calculation.xlsx</code>.
        {chart && " Rows highlighted below appear somewhere in the current 16-place Prashna Kundali."}
      </p>
      <p className="mt-1 text-xs text-black/45 dark:text-white/45">
        &quot;English gloss&quot; below is <span className="italic">not</span> sourced from the workbook or PDF -- neither
        translates the figure names themselves. It&apos;s a best-effort Arabic/Urdu etymology guess, shown lighter/italic
        the less confident it is.
      </p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-2 text-xs font-medium uppercase tracking-wide text-[#3b4a6b] dark:text-[#93a6d8]"
      >
        {open ? "Hide table" : "Show table"}
      </button>
      {open && (
      <div className="mt-3 overflow-x-auto rounded border border-black/10 dark:border-white/10">
        <table className="w-full min-w-[1180px] text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wide text-black/50 dark:border-white/10 dark:text-white/50">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Figure</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">English gloss</th>
              <th className="px-3 py-2">Pattern</th>
              <th className="px-3 py-2">Lord</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Nature</th>
              <th className="px-3 py-2">Auspiciousness</th>
              <th className="px-3 py-2">Gender</th>
              <th className="px-3 py-2">Direction</th>
              <th className="px-3 py-2">Element</th>
              <th className="px-3 py-2">Raashi</th>
              <th className="px-3 py-2">Timing #</th>
              {chart && <th className="px-3 py-2">Places</th>}
            </tr>
          </thead>
          <tbody>
            {FIGURES.map((f) => {
              const places = matchedPlaces(f.id);
              const isMatch = places.length > 0;
              return (
                <tr
                  key={f.id}
                  className={`border-b border-black/5 last:border-0 dark:border-white/5 ${
                    isMatch ? "bg-[#3b4a6b]/5 dark:bg-[#93a6d8]/10" : ""
                  }`}
                >
                  <td className="px-3 py-2 text-black/50 dark:text-white/50">{f.id}</td>
                  <td className="px-3 py-2 text-[#3b4a6b] dark:text-[#93a6d8]">
                    <FigureGlyph pattern={f.pattern} />
                  </td>
                  <td className="px-3 py-2 font-medium">{f.sourceName}</td>
                  <td className={`px-3 py-2 text-xs ${GLOSS_STYLE[FIGURE_NAME_GLOSS[f.id].confidence]}`}>
                    {FIGURE_NAME_GLOSS[f.id].gloss}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{f.pattern.join(" ")}</td>
                  <td className="px-3 py-2">{f.lord}</td>
                  <td className="px-3 py-2">{f.type}</td>
                  <td className="px-3 py-2">{f.nature}</td>
                  <td className="px-3 py-2">{f.auspiciousness}</td>
                  <td className="px-3 py-2">{f.gender}</td>
                  <td className="px-3 py-2">{f.direction}</td>
                  <td className="px-3 py-2">{f.element}</td>
                  <td className="px-3 py-2">{f.raashi}</td>
                  <td className="px-3 py-2 font-mono">{f.timingNumber}</td>
                  {chart && (
                    <td className="px-3 py-2 font-mono text-xs text-[#3b4a6b] dark:text-[#93a6d8]">
                      {places.join(", ")}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
    </section>
  );
}
