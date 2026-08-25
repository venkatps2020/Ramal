"use client";

import { useState } from "react";
import { TIMING_BLOCKS } from "@/lib/data/timings";

/** All 16 Timings blocks (one per Sthir figure), each a 16-place Days/Months/Years table. Collapsed per-block by default. */
export default function TimingsChart() {
  const [openBlock, setOpenBlock] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <p className="max-w-prose text-sm text-black/60 dark:text-white/60">
        The 16 Timings blocks used by the Timing lookup: each block belongs to one Sthir figure
        (by its Timings Number) and lists Days/Months/Years for every one of the 16 possible
        Prashna Kundali places the result figure could be found at.
      </p>

      <div className="divide-y divide-black/10 rounded border border-black/10 dark:divide-white/10 dark:border-white/10">
        {TIMING_BLOCKS.map((block) => {
          const open = openBlock === block.timingNumber;
          return (
            <div key={block.timingNumber}>
              <button
                type="button"
                onClick={() => setOpenBlock((prev) => (prev === block.timingNumber ? null : block.timingNumber))}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/5"
              >
                <span>
                  <span className="font-medium">Timings Number {block.timingNumber}</span>{" "}
                  <span className="text-black/60 dark:text-white/60">
                    &middot; {block.shakalName} &middot; original house {block.originalHouse}
                  </span>
                </span>
                <span className="text-xs uppercase tracking-wide text-[#3b4a6b] dark:text-[#93a6d8]">
                  {open ? "Hide" : "Show"}
                </span>
              </button>
              {open && (
                <div className="overflow-x-auto px-3 pb-3">
                  <table className="w-full min-w-[420px] text-sm">
                    <thead>
                      <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wide text-black/50 dark:border-white/10 dark:text-white/50">
                        <th className="px-2 py-1">Place</th>
                        <th className="px-2 py-1">Years</th>
                        <th className="px-2 py-1">Months</th>
                        <th className="px-2 py-1">Days</th>
                      </tr>
                    </thead>
                    <tbody>
                      {block.entries.map((entry) => (
                        <tr key={entry.place} className="border-b border-black/5 last:border-0 dark:border-white/5">
                          <td className="px-2 py-1 font-mono">{entry.place}</td>
                          <td className="px-2 py-1">{entry.years}</td>
                          <td className="px-2 py-1">{entry.months}</td>
                          <td className="px-2 py-1">{entry.days}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
