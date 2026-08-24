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
  status: AnswerStatus;
  sthanBali: boolean;
  timingSummary: string | null;
}

const KEY = "ramal.predictionHistory.v1";
const MAX_ENTRIES = 50;

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
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
