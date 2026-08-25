"use client";

import { useMemo, useState } from "react";
import { buildPrashnaKundali } from "@/lib/engines/kundali";
import { FIGURES } from "@/lib/data/figures";
import FigureGlyph from "@/components/FigureGlyph";
import JudgementResults from "@/components/JudgementResults";

function randomFigureId(): number {
  return Math.floor(Math.random() * 16) + 1;
}

export default function JudgementLibraryPage() {
  const [figureIds, setFigureIds] = useState<[number, number, number, number]>([1, 2, 3, 4]);
  const [gender, setGender] = useState<"FEMALE" | "MALE">("FEMALE");

  const { chart, status } = useMemo(() => buildPrashnaKundali(figureIds), [figureIds]);

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
          40 practical judgement rules from the source PDF (loans, property, marriage, theft,
          court cases, and more), computed live against one chart. Two source items (number of
          children, thief inside/outside) were dropped by owner decision -- their source text has
          no Excel counterpart to verify against.
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
                    {f.id} -- {f.sourceName}
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

      <JudgementResults chart={chart} ctx={{ gender, motherFigureIds: figureIds }} />
    </div>
  );
}
