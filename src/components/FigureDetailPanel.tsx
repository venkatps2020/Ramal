import { FIGURES } from "@/lib/data/figures";
import { FIGURE_NAME_GLOSS, type GlossConfidence } from "@/lib/data/figure-name-glosses";
import FigureGlyph from "@/components/FigureGlyph";

const GLOSS_STYLE: Record<GlossConfidence, string> = {
  high: "text-black/60 dark:text-white/60",
  medium: "text-black/45 dark:text-white/45",
  uncertain: "italic text-black/35 dark:text-white/35",
};

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-black/40 dark:text-white/40">{label}</p>
      <p className="mt-0.5 text-sm text-black/85 dark:text-white/85">{value}</p>
    </div>
  );
}

/** Full attribute breakdown for one of the 16 canonical Stihir Kundali figures. */
export default function FigureDetailPanel({ figureId }: { figureId: number }) {
  const figure = FIGURES.find((f) => f.id === figureId);
  if (!figure) return null;
  const gloss = FIGURE_NAME_GLOSS[figure.id];

  return (
    <div className="mt-3 divide-y divide-black/10 rounded-lg border border-black/10 dark:divide-white/10 dark:border-white/10">
      <div className="flex items-start gap-4 p-4">
        <FigureGlyph pattern={figure.pattern} className="mt-0.5 text-[#3b4a6b] dark:text-[#93a6d8]" />
        <div>
          <p className="text-[11px] uppercase tracking-wide text-black/40 dark:text-white/40">
            Figure {figure.id} &middot; Sthir house {figure.id}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-black/85 dark:text-white/85">{figure.sourceName}</p>
          {gloss && (
            <p className={`mt-0.5 text-xs ${GLOSS_STYLE[gloss.confidence]}`}>
              {gloss.gloss}
              <span className="ml-1 italic text-black/35 dark:text-white/35">(unverified etymology)</span>
            </p>
          )}
          <p className="mt-1 font-mono text-xs text-black/50 dark:text-white/50">{figure.pattern.join(" ")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3">
        <Field label="Lord" value={figure.lord} />
        <Field label="Type" value={figure.type === "AGAM" ? "Agam" : "Nirgam"} />
        <Field label="Nature" value={figure.nature} />
        <Field label="Auspiciousness" value={figure.auspiciousness} />
        <Field label="Raashi" value={figure.raashi} />
        <Field label="Gender" value={figure.gender} />
        <Field label="Direction" value={figure.direction} />
        <Field label="Element" value={figure.element} />
        <Field label="Timings Number" value={figure.timingNumber} />
      </div>

      <div className="p-4">
        <p className="text-[11px] uppercase tracking-wide text-black/40 dark:text-white/40">Meaning</p>
        <p className="mt-0.5 text-sm text-black/80 dark:text-white/80">{figure.meaning}</p>
      </div>
    </div>
  );
}
