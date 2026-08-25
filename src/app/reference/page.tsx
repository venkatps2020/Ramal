"use client";

import { useState } from "react";
import StihirKundaliTable from "@/components/StihirKundaliTable";
import HouseExplorer from "@/components/HouseExplorer";
import TimingsChart from "@/components/TimingsChart";
import GlossaryTable from "@/components/GlossaryTable";

const TABS = ["Stihir Kundali", "Houses", "Timings", "Glossary"] as const;
type Tab = (typeof TABS)[number];

export default function ReferencePage() {
  const [tab, setTab] = useState<Tab>("Stihir Kundali");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Reference</h1>
        <p className="mt-1 max-w-prose text-sm text-black/60 dark:text-white/60">
          Static reference material: the 16 canonical figures, the 12 houses, the Timings
          lookup tables, and the glossary.
        </p>
      </div>

      <div className="flex gap-2 border-b border-black/10 dark:border-white/10">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              tab === t
                ? "border-[#3b4a6b] text-[#3b4a6b] dark:border-[#93a6d8] dark:text-[#93a6d8]"
                : "border-transparent text-black/50 hover:text-black/80 dark:text-white/50 dark:hover:text-white/80"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Stihir Kundali" && <StihirKundaliTable />}
      {tab === "Houses" && <HouseExplorer />}
      {tab === "Timings" && <TimingsChart />}
      {tab === "Glossary" && <GlossaryTable />}
    </div>
  );
}
