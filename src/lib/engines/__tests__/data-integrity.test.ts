import { describe, it, expect } from "vitest";
import { FIGURES } from "@/lib/data/figures";
import { TIMING_BLOCKS } from "@/lib/data/timings";
import { HOUSE_INTERPRETATIONS } from "@/lib/data/houses";
import { HOUSE_PPT_NOTES } from "@/lib/data/house-ppt-notes";
import { QUESTION_MASTER } from "@/lib/data/questions";
import { GLOSSARY } from "@/lib/data/glossary";

describe("FIGURES (Stihir Kundali)", () => {
  it("has exactly 16 figures, ids 1-16", () => {
    expect(FIGURES).toHaveLength(16);
    expect(FIGURES.map((f) => f.id).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 16 }, (_, i) => i + 1)
    );
  });

  it("covers all 16 possible 4-symbol patterns exactly once", () => {
    const seen = new Set(FIGURES.map((f) => f.pattern.join("")));
    expect(seen.size).toBe(16);
  });

  it("assigns every Timings Number 1-16 exactly once", () => {
    const nums = FIGURES.map((f) => f.timingNumber).sort((a, b) => a - b);
    expect(nums).toEqual(Array.from({ length: 16 }, (_, i) => i + 1));
  });

  it("only uses the four documented AGAM/NIRGAM and DAKHIL/KHARIJ/SABIT/MUNQALIB values", () => {
    for (const f of FIGURES) {
      expect(["AGAM", "NIRGAM"]).toContain(f.type);
      expect(["DAKHIL", "KHARIJ", "SABIT", "MUNQALIB"]).toContain(f.nature);
    }
  });
});

describe("TIMING_BLOCKS", () => {
  it("has exactly 16 blocks, one per Timings Number", () => {
    expect(TIMING_BLOCKS).toHaveLength(16);
    expect(TIMING_BLOCKS.map((b) => b.timingNumber).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 16 }, (_, i) => i + 1)
    );
  });

  it("every block covers all 16 places exactly once", () => {
    for (const block of TIMING_BLOCKS) {
      expect(block.entries).toHaveLength(16);
      const places = block.entries.map((e) => e.place).sort((a, b) => a - b);
      expect(places).toEqual(Array.from({ length: 16 }, (_, i) => i + 1));
    }
  });

  it("every entry has non-negative Days/Months/Years", () => {
    for (const block of TIMING_BLOCKS) {
      for (const e of block.entries) {
        expect(e.days).toBeGreaterThanOrEqual(0);
        expect(e.months).toBeGreaterThanOrEqual(0);
        expect(e.years).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe("HOUSE_INTERPRETATIONS", () => {
  it("has exactly 12 houses, ids 1-12", () => {
    expect(HOUSE_INTERPRETATIONS).toHaveLength(12);
    expect(HOUSE_INTERPRETATIONS.map((h) => h.id).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 12 }, (_, i) => i + 1)
    );
  });
});

describe("HOUSE_PPT_NOTES (PPT slides 24-35, source/conceptual per master spec §2)", () => {
  it("has exactly 12 entries, houseId 1-12 each once, slideNumber 24-35 matching houseId+23", () => {
    expect(HOUSE_PPT_NOTES).toHaveLength(12);
    const ids = HOUSE_PPT_NOTES.map((n) => n.houseId).sort((a, b) => a - b);
    expect(ids).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
    for (const n of HOUSE_PPT_NOTES) {
      expect(n.slideNumber).toBe(n.houseId + 23);
      expect(n.title.length).toBeGreaterThan(0);
      expect(n.phrases.length).toBeGreaterThan(0);
      for (const phrase of n.phrases) {
        expect(phrase.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe("QUESTION_MASTER (Dhruvank Questions -- imported as inert reference data only)", () => {
  it("is non-empty and every row has a house in 1-12 and question text", () => {
    expect(QUESTION_MASTER.length).toBeGreaterThan(0);
    for (const q of QUESTION_MASTER) {
      expect(q.house).toBeGreaterThanOrEqual(1);
      expect(q.house).toBeLessThanOrEqual(12);
      expect(q.text.length).toBeGreaterThan(0);
    }
  });
});

describe("GLOSSARY", () => {
  it("is non-empty and every term has a meaning", () => {
    expect(GLOSSARY.length).toBeGreaterThan(0);
    for (const t of GLOSSARY) {
      expect(t.term.length).toBeGreaterThan(0);
      expect(t.meaning.length).toBeGreaterThan(0);
    }
  });
});
