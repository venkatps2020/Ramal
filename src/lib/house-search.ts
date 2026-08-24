// Keyword search across the "12 Houses" sheet's full text, not just
// primaryTheme. Strong fields (direct source items + the sheet's own
// "Primary Use in Questions" column) rank above weak fields (Expanded
// Items / Special-Derived Associations), because those are explicitly the
// interpretive/derived columns per the data dictionary -- a naive flat
// search would let a hedge like House 1's "not the principal wealth
// house" outrank an actual wealth house on the word "wealth".
import { HOUSE_INTERPRETATIONS } from "@/lib/data/houses";
import type { HouseInterpretation } from "@/lib/types";

export interface HouseSearchResult {
  house: HouseInterpretation;
  score: number;
  matchedField: string | null;
  snippet: string | null;
}

const STRONG_FIELDS: Array<[keyof HouseInterpretation, string]> = [
  ["primaryTheme", "Theme"],
  ["directItems", "Direct items"],
  ["primaryQuestionUse", "Question use"],
];

const WEAK_FIELDS: Array<[keyof HouseInterpretation, string]> = [
  ["healthBody", "Health/Body"],
  ["familyRelationships", "Family"],
  ["moneyMaterial", "Money"],
  ["workCareer", "Work/Career"],
  ["travelMovement", "Travel"],
  ["psychologicalSpiritual", "Psychological"],
  ["expandedItems", "Expanded (interpretive)"],
  ["specialDerived", "Special/Derived (interpretive)"],
];

function snippetAround(text: string, idx: number, matchLen: number, radius = 40): string {
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + matchLen + radius);
  return (start > 0 ? "…" : "") + text.slice(start, end).trim() + (end < text.length ? "…" : "");
}

export function searchHouses(query: string): HouseSearchResult[] {
  const q = query.trim().toLowerCase();

  if (!q) {
    return HOUSE_INTERPRETATIONS.map((house) => ({ house, score: 0, matchedField: null, snippet: null }));
  }

  const results: HouseSearchResult[] = [];

  for (const house of HOUSE_INTERPRETATIONS) {
    let bestScore = 0;
    let bestField: string | null = null;
    let bestSnippet: string | null = null;

    if (String(house.id) === q || `house ${house.id}` === q) {
      bestScore = 100;
      bestField = "House number";
      bestSnippet = `House ${house.id}`;
    }

    for (const [field, label] of STRONG_FIELDS) {
      if (bestScore >= 10) break;
      const text = house[field] as string;
      const idx = text.toLowerCase().indexOf(q);
      if (idx !== -1) {
        bestScore = 10;
        bestField = label;
        bestSnippet = snippetAround(text, idx, q.length);
      }
    }

    if (bestScore < 10) {
      for (const [field, label] of WEAK_FIELDS) {
        const text = house[field] as string;
        const idx = text.toLowerCase().indexOf(q);
        if (idx !== -1) {
          bestScore = 5;
          bestField = label;
          bestSnippet = snippetAround(text, idx, q.length);
          break;
        }
      }
    }

    if (bestScore > 0) {
      results.push({ house, score: bestScore, matchedField: bestField, snippet: bestSnippet });
    }
  }

  return results.sort((a, b) => b.score - a.score || a.house.id - b.house.id);
}
