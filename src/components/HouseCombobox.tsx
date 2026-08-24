"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { searchHouses } from "@/lib/house-search";
import { HOUSE_INTERPRETATIONS } from "@/lib/data/houses";

export default function HouseCombobox({ value, onChange }: { value: number; onChange: (id: number) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = HOUSE_INTERPRETATIONS.find((h) => h.id === value) ?? HOUSE_INTERPRETATIONS[0];
  const results = useMemo(() => searchHouses(query), [query]);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  useEffect(() => setActiveIndex(0), [query, open]);

  function choose(id: number) {
    onChange(id);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[activeIndex];
      if (r) choose(r.house.id);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={rootRef} className="relative w-full sm:w-96">
      <input
        ref={inputRef}
        role="combobox"
        aria-expanded={open}
        aria-controls="house-combobox-listbox"
        aria-autocomplete="list"
        type="text"
        value={open ? query : `House ${selected.id} -- ${selected.primaryTheme}`}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Search by keyword (e.g. debt, thief, promotion)..."
        className="w-full rounded border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/15"
      />
      {open && (
        <ul
          id="house-combobox-listbox"
          role="listbox"
          className="absolute z-10 mt-1 max-h-80 w-full overflow-y-auto rounded border border-black/15 bg-[#f7f4eb] shadow-lg dark:border-white/15 dark:bg-[#201d16]"
        >
          {results.length === 0 && (
            <li className="px-3 py-2 text-sm text-black/50 dark:text-white/50">No houses match &quot;{query}&quot;.</li>
          )}
          {results.map((r, i) => (
            <li
              key={r.house.id}
              role="option"
              aria-selected={r.house.id === value}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(r.house.id);
              }}
              className={`cursor-pointer px-3 py-2 text-sm ${
                i === activeIndex ? "bg-[#3b4a6b]/10 dark:bg-[#93a6d8]/10" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">
                  House {r.house.id} -- {r.house.primaryTheme}
                </span>
                {r.matchedField && (
                  <span className="shrink-0 rounded border border-black/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-black/50 dark:border-white/15 dark:text-white/50">
                    {r.matchedField}
                  </span>
                )}
              </div>
              {r.snippet && <div className="mt-0.5 text-xs text-black/50 dark:text-white/50">{r.snippet}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
