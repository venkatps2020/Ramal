// Prediction history, client-side only -- mirrors Nameology's localStorage
// analysis-history pattern. No backend, no database (see project plan).
"use client";

import type { AgamNirgam, AnswerStatus } from "@/lib/types";

export interface HistoryEntry {
  id: string;
  createdAt: string;
  motherFigureIds: [number, number, number, number];
  questionHouse: number;
  questionType: AgamNirgam;
  shortTiming: boolean;
  status: AnswerStatus;
  sthanBali: boolean;
  timingSummary: string | null;
}

const KEY = "ramal.predictionHistory.v1";
const MAX_ENTRIES = 10;

/** Loads history, trimming (and persisting the trim) if more than MAX_ENTRIES were saved under an older, higher cap. */
export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const entries = raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
    if (entries.length > MAX_ENTRIES) {
      const trimmed = entries.slice(0, MAX_ENTRIES);
      window.localStorage.setItem(KEY, JSON.stringify(trimmed));
      return trimmed;
    }
    return entries;
  } catch {
    return [];
  }
}

export function saveHistoryEntry(entry: HistoryEntry): HistoryEntry[] {
  const existing = loadHistory();
  const next = [entry, ...existing].slice(0, MAX_ENTRIES);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  }
  return next;
}

export function clearHistory(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(KEY);
  }
}
