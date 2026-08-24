import { HOUSE_INTERPRETATIONS } from "@/lib/data/houses";
import type { HouseInterpretation } from "@/lib/types";

const DIRECT_CATEGORIES: Array<[string, keyof HouseInterpretation]> = [
  ["Health / Body", "healthBody"],
  ["Family / Relationships", "familyRelationships"],
  ["Money / Material", "moneyMaterial"],
  ["Work / Career", "workCareer"],
  ["Travel / Movement", "travelMovement"],
  ["Psychological / Spiritual", "psychologicalSpiritual"],
];

export default function HouseDetailPanel({ houseId }: { houseId: number }) {
  const house = HOUSE_INTERPRETATIONS.find((h) => h.id === houseId);
  if (!house) return null;

  return (
    <div className="mt-3 space-y-4 rounded border border-black/10 p-4 text-sm dark:border-white/10">
      <div>
        <div className="flex items-center gap-2">
          <span className="rounded border border-emerald-600/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
            Direct
          </span>
          <h4 className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">Direct items</h4>
        </div>
        <p className="mt-1 text-black/80 dark:text-white/80">{house.directItems}</p>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <span className="rounded border border-emerald-600/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
            Direct
          </span>
          <h4 className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">Primary use in questions</h4>
        </div>
        <p className="mt-1 text-black/80 dark:text-white/80">{house.primaryQuestionUse}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {DIRECT_CATEGORIES.map(([label, field]) => (
          <div key={field}>
            <h4 className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">{label}</h4>
            <p className="mt-0.5 text-black/70 dark:text-white/70">{house[field] as string}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center gap-2">
          <span className="rounded border border-[#8a6a3c]/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[#8a6a3c]">
            Interpretive
          </span>
          <h4 className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">Expanded items</h4>
        </div>
        <p className="mt-1 text-black/70 dark:text-white/70">{house.expandedItems}</p>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <span className="rounded border border-[#8a6a3c]/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[#8a6a3c]">
            Interpretive
          </span>
          <h4 className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">Special / derived associations</h4>
        </div>
        <p className="mt-1 text-black/70 dark:text-white/70">{house.specialDerived}</p>
      </div>

      <div>
        <h4 className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">Secondary supporting houses</h4>
        <p className="mt-0.5 text-black/70 dark:text-white/70">{house.secondarySupportingHouses}</p>
      </div>
    </div>
  );
}
