"use client";

import { useMemo, useState } from "react";
import { searchHousesByQuestion } from "@/lib/house-search";

/** Free-text "describe your question" search that suggests candidate houses, e.g. "will I get the job" -> House 10. */
export default function QuestionSearch({ onSelect }: { onSelect: (houseId: number) => void }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchHousesByQuestion(query).slice(0, 5), [query]);

  return (
    <div className="rounded border border-black/10 p-3 dark:border-white/10">
      <label className="block text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
        Describe your question
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="e.g. &quot;will I get the job&quot; or &quot;will I have children&quot;"
        className="mt-1 w-full rounded border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/15"
      />
      {query.trim() && (
        <div className="mt-2 space-y-1.5">
          {results.length === 0 ? (
            <p className="text-xs text-black/45 dark:text-white/45">
              No house matched those words -- try the House search below instead.
            </p>
          ) : (
            results.map((r) => (
              <button
                key={r.house.id}
                type="button"
                onClick={() => onSelect(r.house.id)}
                className="block w-full rounded border border-black/10 p-2 text-left text-sm hover:border-[#3b4a6b]/40 dark:border-white/10 dark:hover:border-[#93a6d8]/40"
              >
                <span className="font-medium">
                  House {r.house.id} -- {r.house.primaryTheme}
                </span>
                {r.snippet && (
                  <span className="mt-0.5 block text-xs text-black/50 dark:text-white/50">{r.snippet}</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
      <p className="mt-2 text-[11px] italic text-black/40 dark:text-white/40">
        A keyword-ranking suggestion, not a guaranteed single "right" house -- pick whichever fits your question, or
        use the House search below directly.
      </p>
    </div>
  );
}
