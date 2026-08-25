"use client";

import { useEffect, useState } from "react";
import { runPrediction } from "@/lib/engines/predict";
import { sthirFigureFor } from "@/lib/engines/judgement";
import { FIGURES } from "@/lib/data/figures";
import { loadHistory, saveHistoryEntry, type HistoryEntry } from "@/lib/history";
import FigureGlyph from "@/components/FigureGlyph";
import HouseCombobox from "@/components/HouseCombobox";
import HouseDetailPanel from "@/components/HouseDetailPanel";
import PrashnaKundaliChart from "@/components/PrashnaKundaliChart";
import JudgementResults from "@/components/JudgementResults";
import QuestionSearch from "@/components/QuestionSearch";
import HistorySummary from "@/components/HistorySummary";
import type { AgamNirgam, FigurePattern, PredictionResult } from "@/lib/types";

const STATUS_LABEL: Record<PredictionResult["status"], string> = {
  YES: "Yes",
  NO: "No",
  CANT_PREDICT_TODAY: "Can't Predict Today",
  CALCULATION_ERROR: "Calculation Error",
};

const STATUS_STYLE: Record<PredictionResult["status"], string> = {
  YES: "bg-emerald-600/10 text-emerald-800 border-emerald-600/30 dark:text-emerald-300",
  NO: "bg-black/5 text-black/70 border-black/20 dark:bg-white/5 dark:text-white/70 dark:border-white/20",
  CANT_PREDICT_TODAY: "bg-amber-500/10 text-amber-800 border-amber-500/30 dark:text-amber-300",
  CALCULATION_ERROR: "bg-red-600/10 text-red-800 border-red-600/30 dark:text-red-300",
};

function figureById(id: number) {
  return FIGURES.find((f) => f.id === id)!;
}

function shakalName(pattern: FigurePattern | null): string {
  if (!pattern) return "?";
  return sthirFigureFor(pattern)?.sourceName ?? "?";
}

function randomFigureId(): number {
  return Math.floor(Math.random() * 16) + 1;
}

export default function NewPredictionPage() {
  const [figureIds, setFigureIds] = useState<[number, number, number, number]>([1, 2, 3, 4]);
  const [questionHouse, setQuestionHouse] = useState(1);
  const [questionType, setQuestionType] = useState<AgamNirgam>("AGAM");
  const [shortTiming, setShortTiming] = useState(false);
  const [gender, setGender] = useState<"FEMALE" | "MALE">("FEMALE");
  const [houseDetailOpen, setHouseDetailOpen] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [traceOpen, setTraceOpen] = useState(false);
  const [judgementOpen, setJudgementOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  function setFigureAt(index: number, id: number) {
    setFigureIds((prev) => {
      const next = [...prev] as [number, number, number, number];
      next[index] = id;
      return next;
    });
  }

  function drawRandom() {
    setFigureIds([randomFigureId(), randomFigureId(), randomFigureId(), randomFigureId()]);
  }

  function calculate() {
    const r = runPrediction({ draw: { figureIds }, questionHouse, questionType, shortTiming });
    setResult(r);
    setTraceOpen(false);
    setHistory(
      saveHistoryEntry({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        motherFigureIds: figureIds,
        questionHouse,
        questionType,
        status: r.status,
        sthanBali: r.sthanBali,
        timingSummary: r.timing && !r.timing.unavailable
          ? `${r.timing.totalYears}y ${r.timing.totalMonths}m ${r.timing.totalDays}d`
          : null,
      })
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">New Prediction</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Draw the four Mother Figures, choose the question&apos;s house and type, then calculate.
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Four Mother Figures</h2>
          <button
            type="button"
            onClick={drawRandom}
            className="rounded border border-black/15 px-3 py-1.5 text-xs uppercase tracking-wide hover:border-black/30 dark:border-white/15 dark:hover:border-white/30"
          >
            Draw random
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {figureIds.map((id, i) => (
            <div key={i} className="rounded border border-black/10 p-3 dark:border-white/10">
              <label className="block text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
                Card {i + 1}
              </label>
              <select
                value={id}
                onChange={(e) => setFigureAt(i, Number(e.target.value))}
                className="mt-1 w-full rounded border border-black/15 bg-transparent px-2 py-1 text-sm dark:border-white/15"
              >
                {FIGURES.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.id} -- {f.sourceName}
                  </option>
                ))}
              </select>
              <div className="mt-2 flex justify-center text-[#3b4a6b] dark:text-[#93a6d8]">
                <FigureGlyph pattern={figureById(id).pattern} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-black/45 dark:text-white/45">
          Repetition is allowed -- the same figure may be drawn more than once.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Question</h2>
        <QuestionSearch onSelect={setQuestionHouse} />
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wide text-black/50 dark:text-white/50">House</label>
            <div className="mt-1">
              <HouseCombobox value={questionHouse} onChange={setQuestionHouse} />
            </div>
            <button
              type="button"
              onClick={() => setHouseDetailOpen((v) => !v)}
              className="mt-1 text-xs font-medium uppercase tracking-wide text-[#3b4a6b] dark:text-[#93a6d8]"
            >
              {houseDetailOpen ? "Hide house detail" : "Show house detail"}
            </button>
            {houseDetailOpen && <HouseDetailPanel houseId={questionHouse} />}
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-black/50 dark:text-white/50">Type</label>
            <div className="mt-1 flex gap-2">
              {(["AGAM", "NIRGAM"] as AgamNirgam[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setQuestionType(t)}
                  className={`rounded border px-3 py-1.5 text-sm ${
                    questionType === t
                      ? "border-[#3b4a6b] bg-[#3b4a6b]/10 text-[#3b4a6b] dark:border-[#93a6d8] dark:text-[#93a6d8]"
                      : "border-black/15 dark:border-white/15"
                  }`}
                >
                  {t === "AGAM" ? "Agam (incoming)" : "Nirgam (outgoing)"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
              Short Timing (within one day)
            </label>
            <button
              type="button"
              onClick={() => setShortTiming((v) => !v)}
              className={`mt-1 rounded border px-3 py-1.5 text-sm ${
                shortTiming
                  ? "border-[#3b4a6b] bg-[#3b4a6b]/10 text-[#3b4a6b] dark:border-[#93a6d8] dark:text-[#93a6d8]"
                  : "border-black/15 dark:border-white/15"
              }`}
            >
              {shortTiming ? "Yes" : "No"}
            </button>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
              Gender (for Judgement Library item 21)
            </label>
            <div className="mt-1 flex gap-2">
              {(["FEMALE", "MALE"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`rounded border px-3 py-1.5 text-sm ${
                    gender === g
                      ? "border-[#3b4a6b] bg-[#3b4a6b]/10 text-[#3b4a6b] dark:border-[#93a6d8] dark:text-[#93a6d8]"
                      : "border-black/15 dark:border-white/15"
                  }`}
                >
                  {g === "FEMALE" ? "Female" : "Male"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={calculate}
        className="rounded bg-[#3b4a6b] px-5 py-2 text-sm font-medium text-white hover:bg-[#2f3c58]"
      >
        Calculate
      </button>

      {result && (
        <section className="space-y-5 rounded border border-black/10 p-5 dark:border-white/10">
          {(!result.resultFigure || result.sthanBali) && (
            <div className="flex flex-wrap items-center gap-3">
              {!result.resultFigure && (
                <span className={`rounded border px-3 py-1 font-mono text-sm uppercase ${STATUS_STYLE[result.status]}`}>
                  {STATUS_LABEL[result.status]}
                </span>
              )}
              {result.sthanBali && (
                <span className="rounded border border-[#8a6a3c]/40 bg-[#8a6a3c]/10 px-3 py-1 text-xs uppercase tracking-wide text-[#8a6a3c]">
                  Sthan Bali
                </span>
              )}
            </div>
          )}

          {result.chart && (
            <div>
              <h3 className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
                16-place Prashna Kundali
              </h3>
              <div className="mt-2">
                <PrashnaKundaliChart chart={result.chart} />
              </div>
            </div>
          )}

          {result.resultFigure && (
            <div>
              <h3 className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">Result figure</h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                <span className="flex items-center gap-1.5 rounded border border-black/10 px-2 py-1 dark:border-white/10">
                  <FigureGlyph pattern={result.questionHouseFigure!} className="text-[#3b4a6b] dark:text-[#93a6d8]" />
                  House {questionHouse}: {shakalName(result.questionHouseFigure)}
                </span>
                {questionHouse !== 5 && (
                  <>
                    <span className="text-black/40 dark:text-white/40">+</span>
                    <span className="flex items-center gap-1.5 rounded border border-black/10 px-2 py-1 dark:border-white/10">
                      <FigureGlyph pattern={result.house1Figure!} className="text-[#3b4a6b] dark:text-[#93a6d8]" />
                      House 1: {shakalName(result.house1Figure)}
                    </span>
                  </>
                )}
                <span className="text-black/40 dark:text-white/40">=</span>
                <span className="flex items-center gap-1.5 rounded border border-[#3b4a6b]/30 bg-[#3b4a6b]/5 px-2 py-1 dark:border-[#93a6d8]/30 dark:bg-[#93a6d8]/10">
                  <FigureGlyph pattern={result.resultFigure} className="text-[#3b4a6b] dark:text-[#93a6d8]" />
                  Result: {shakalName(result.resultFigure)}
                </span>
              </div>
              {questionHouse === 5 && (
                <p className="mt-1 text-xs italic text-black/45 dark:text-white/45">
                  House 5 is exempt from adding House 1 -- the house&apos;s own figure is the result.
                </p>
              )}
              <div className="mt-1 flex items-center gap-3">
                <span className="font-mono text-sm">{result.resultFigure.join(" ")}</span>
              </div>
              <p
                className={`mt-2 text-base font-bold ${
                  result.status === "YES" ? "text-emerald-700 dark:text-emerald-400" : "text-black/80 dark:text-white/80"
                }`}
              >
                Final Outcome: {STATUS_LABEL[result.status]}
              </p>
              {result.status === "NO" && (
                <p className="mt-1 text-xs italic text-black/45 dark:text-white/45">
                  Timing is not shown when the answer is No.
                </p>
              )}
            </div>
          )}

          {result.timing && !shortTiming && result.status === "YES" && (
            <div>
              <h3 className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
                Timing (Short Timing: No)
              </h3>
              {result.timing.unavailable ? (
                <p className="mt-1 text-sm text-black/60 dark:text-white/60">Unavailable -- no Sthir Kundali match.</p>
              ) : result.timing.noPlaceMatch ? (
                <>
                  <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                    Result figure matches Sthir house {result.timing.sthirHouseId} (Timings Number{" "}
                    {result.timing.timingNumber}) -- not available in this Prashna Kundali chart (matches no place
                    among the current 16).
                  </p>
                  {result.quickDuration && result.quickDuration.unitLabel && (
                    <p className="mt-1 font-mono text-sm">
                      Quick Duration estimate: {result.quickDuration.count} {result.quickDuration.unitLabel}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="mt-1 font-mono text-sm">
                    {result.timing.totalYears}y {result.timing.totalMonths}m {result.timing.totalDays}d
                  </p>
                  <p className="mt-1 text-xs text-black/50 dark:text-white/50">
                    Result figure matches Sthir house {result.timing.sthirHouseId} (Timings Number{" "}
                    {result.timing.timingNumber}) -- found in Prashna Kundali place
                    {result.timing.matches.length === 1 ? "" : "s"}{" "}
                    {result.timing.matches.map((m) => m.place).join(", ")}.
                  </p>
                </>
              )}
            </div>
          )}

          {result.quickDuration && shortTiming && result.status === "YES" && (
            <div>
              <h3 className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
                Quick duration (Short Timing: Yes)
              </h3>
              {result.quickDuration.sthirHouseId === null ? (
                <p className="mt-1 text-sm text-black/60 dark:text-white/60">Unavailable -- no Sthir Kundali match.</p>
              ) : (
                <p className="mt-1 font-mono text-sm">
                  {result.quickDuration.count} {result.quickDuration.unitLabel}
                </p>
              )}
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={() => setTraceOpen((v) => !v)}
              className="text-xs font-medium uppercase tracking-wide text-[#3b4a6b] dark:text-[#93a6d8]"
            >
              {traceOpen ? "Hide calculation trace" : "Show calculation trace"}
            </button>
            {traceOpen && (
              <ol className="mt-3 space-y-2 border-l border-black/10 pl-4 dark:border-white/10">
                {result.trace.map((step, i) => (
                  <li key={i} className="text-sm">
                    <div className="font-medium">{step.label}</div>
                    <div className="whitespace-pre-line text-black/60 dark:text-white/60">{step.detail}</div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {result.chart && (
            <div>
              <button
                type="button"
                onClick={() => setJudgementOpen((v) => !v)}
                className="text-xs font-medium uppercase tracking-wide text-[#3b4a6b] dark:text-[#93a6d8]"
              >
                {judgementOpen ? "Hide Judgement Library" : "Show Judgement Library"}
              </button>
              <p className="mt-1 text-xs text-black/45 dark:text-white/45">
                40 practical judgement rules (loans, property, marriage, theft, and more) computed
                live against these same four Mother Figures.
              </p>
              {judgementOpen && (
                <div className="mt-3">
                  <JudgementResults chart={result.chart} ctx={{ gender, motherFigureIds: figureIds }} />
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <HistorySummary entries={history} />
    </div>
  );
}
