import { GLOSSARY } from "@/lib/data/glossary";

export default function GlossaryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Glossary</h1>
        <p className="mt-1 max-w-prose text-sm text-black/60 dark:text-white/60">
          Terminology from the &quot;Meaning&quot; sheet of <code>Ramal Calculation.xlsx</code> -- the
          workbook&apos;s own English translations of its Hindi column headers and technical terms.
        </p>
      </div>

      <div className="overflow-hidden rounded border border-black/10 dark:border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wide text-black/50 dark:border-white/10 dark:text-white/50">
              <th className="px-3 py-2">Term</th>
              <th className="px-3 py-2">Meaning</th>
            </tr>
          </thead>
          <tbody>
            {GLOSSARY.map((entry, i) => (
              <tr key={i} className="border-b border-black/5 last:border-0 dark:border-white/5">
                <td className="px-3 py-2 font-medium">{entry.term}</td>
                <td className="px-3 py-2 text-black/70 dark:text-white/70">{entry.meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
