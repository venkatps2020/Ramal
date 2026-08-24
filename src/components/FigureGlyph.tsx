import type { FigurePattern } from "@/lib/types";

/** Renders a single figure's four tattva positions as bindu/rekha marks. */
export default function FigureGlyph({ pattern, className }: { pattern: FigurePattern; className?: string }) {
  return (
    <span className={`figure-glyph ${className ?? ""}`} aria-label={pattern.join(" ")}>
      {pattern.map((symbol, i) => (
        <span key={i} className="mark">
          <span className={symbol === "-" ? "rekha" : "bindu"} />
        </span>
      ))}
    </span>
  );
}
