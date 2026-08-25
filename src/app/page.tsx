import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-10">
      <section>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Ramal Astrology</h1>
        <p className="mt-2 max-w-prose text-black/70 dark:text-white/70">
          Draw four figures, ask a question, and get a deterministic Yes/No answer with full
          working shown -- the sixteen-place Prashna Kundali, the Sthan Bali check, the
          Agam/Nirgam judgement, and the timing calculation.
        </p>
      </section>

      <Link
        href="/new-prediction"
        className="block rounded border border-black/10 bg-white/60 p-5 shadow-sm transition hover:border-[#3b4a6b]/40 dark:border-white/10 dark:bg-white/5"
      >
        <h2 className="font-display text-xl font-semibold">New Prediction</h2>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Draw or enter four Mother Figures, pick a house and question type, and calculate.
        </p>
      </Link>
    </div>
  );
}
