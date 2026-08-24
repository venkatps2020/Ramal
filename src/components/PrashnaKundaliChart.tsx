import { FIGURES } from "@/lib/data/figures";
import { patternsEqual } from "@/lib/engines/figure";
import FigureGlyph from "@/components/FigureGlyph";
import type { PrashnaChart } from "@/lib/types";

// Traditional Ramal Stihir Kundali layout (matches the PDF/PPT source
// material's own presentation, e.g. "1 to 16 - updated 18.1.24.pptx" slide
// 21): read right-to-left, tapering from 8 places wide down to a 2x2 block
// (14, 13 on top; 16, 15 below). Places within each row/division are
// grouped exactly as the source groups them:
//   Places 1-4   -- Umhat division
//   Places 5-8   -- Binhat division
//   Places 9-12  -- Mudbalidat division
//   Places 13-16 -- Jaydat/Jawaydat division
const ROW1 = [8, 7, 6, 5, 4, 3, 2, 1];
const ROW2 = [12, 11, 10, 9];
const ROW3_TOP = [14, 13];
const ROW3_BOTTOM = [16, 15];

function Cell({ place, chart }: { place: number; chart: PrashnaChart }) {
  const pattern = chart[place];
  const match = FIGURES.find((f) => patternsEqual(f.pattern, pattern));
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-2 py-3 text-center">
      <span className="font-mono text-xs font-semibold text-black/45 dark:text-white/45">{place}</span>
      <FigureGlyph pattern={pattern} className="text-[#3b4a6b] dark:text-[#93a6d8]" />
      <span className="text-[11px] leading-tight text-black/60 dark:text-white/60">{match?.sourceName ?? "?"}</span>
    </div>
  );
}

function DivisionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2 py-1.5 text-center text-[10px] uppercase tracking-wide text-black/40 dark:text-white/40">
      {children}
    </p>
  );
}

export default function PrashnaKundaliChart({ chart }: { chart: PrashnaChart }) {
  return (
    <div className="overflow-x-auto rounded border border-black/10 dark:border-white/10">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-8 divide-x divide-black/10 border-b border-black/10 dark:divide-white/10 dark:border-white/10">
          {ROW1.map((p) => (
            <Cell key={p} place={p} chart={chart} />
          ))}
        </div>
        <div className="grid grid-cols-2 divide-x divide-black/10 border-b border-black/10 dark:divide-white/10 dark:border-white/10">
          <DivisionLabel>Places 5-8 -- Binhat division</DivisionLabel>
          <DivisionLabel>Places 1-4 -- Umhat division</DivisionLabel>
        </div>

        <div className="grid grid-cols-4 divide-x divide-black/10 border-b border-black/10 dark:divide-white/10 dark:border-white/10">
          {ROW2.map((p) => (
            <Cell key={p} place={p} chart={chart} />
          ))}
        </div>
        <div className="border-b border-black/10 dark:border-white/10">
          <DivisionLabel>Places 9-12 -- Mudbalidat division</DivisionLabel>
        </div>

        <div className="grid grid-cols-2 divide-x divide-black/10 border-b border-black/10 dark:divide-white/10 dark:border-white/10">
          {ROW3_TOP.map((p) => (
            <Cell key={p} place={p} chart={chart} />
          ))}
        </div>
        <div className="grid grid-cols-2 divide-x divide-black/10 dark:divide-white/10">
          {ROW3_BOTTOM.map((p) => (
            <Cell key={p} place={p} chart={chart} />
          ))}
        </div>
        <DivisionLabel>Places 13-16 -- Jaydat / Jawaydat division</DivisionLabel>
      </div>
    </div>
  );
}
