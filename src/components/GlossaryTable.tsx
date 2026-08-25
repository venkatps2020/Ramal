import { GLOSSARY } from "@/lib/data/glossary";
import { GLOSSARY_TRANSLITERATION } from "@/lib/data/glossary-transliteration";

/** Read-only table of GLOSSARY terms, each with a bracketed Roman-script transliteration. */
export default function GlossaryTable() {
  return (
    <div className="space-y-6">
      <p className="max-w-prose text-sm text-black/60 dark:text-white/60">
        Terminology and technical terms used throughout the app, with their English meanings.
        Roman-script transliterations in brackets are a hand-added reading aid, not part of the
        original source terms.
      </p>

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
                <td className="px-3 py-2 font-medium">
                  {entry.term}
                  {GLOSSARY_TRANSLITERATION[i] && (
                    <span className="ml-1 font-normal text-black/45 dark:text-white/45">
                      ({GLOSSARY_TRANSLITERATION[i]})
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-black/70 dark:text-white/70">{entry.meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
