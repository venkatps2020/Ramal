"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("ramal.theme", next ? "dark" : "light");
  }

  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight">
          Ramal Astrology
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/new-prediction" className="hover:text-[#3b4a6b] dark:hover:text-[#93a6d8]">
            New Prediction
          </Link>
          <Link href="/reference" className="hover:text-[#3b4a6b] dark:hover:text-[#93a6d8]">
            Reference
          </Link>
          <Link href="/glossary" className="hover:text-[#3b4a6b] dark:hover:text-[#93a6d8]">
            Glossary
          </Link>
          <button
            type="button"
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            className="rounded border border-black/15 px-2 py-1 text-xs uppercase tracking-wide hover:border-black/30 dark:border-white/15 dark:hover:border-white/30"
          >
            {dark ? "Light" : "Dark"}
          </button>
        </div>
      </nav>
    </header>
  );
}
