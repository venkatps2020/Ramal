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

const QUESTION_STOPWORDS = new Set([
  "will", "i", "a", "an", "the", "is", "are", "do", "does", "to", "my", "me",
  "of", "in", "on", "for", "and", "or", "be", "it", "this", "that", "there",
  "am", "was", "were", "if", "should", "would", "can", "could", "with", "at",
  "from", "about", "get", "getting", "have", "has", "had", "you", "your",
  "please", "tell", "know", "want", "going", "go", "so", "im",
]);

function tokenizeQuestion(query: string): string[] {
  return Array.from(
    new Set(
      query
        .toLowerCase()
        .replace(/[?.,!]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length >= 3 && !QUESTION_STOPWORDS.has(t))
    )
  );
}

export interface QuestionSearchResult {
  house: HouseInterpretation;
  score: number;
  matchedTokens: string[];
  snippet: string | null;
}

/**
 * Free-text "describe your question" search, e.g. "will I get the job" ->
 * House 10. Unlike searchHouses() (single-term substring match, used by
 * HouseCombobox), this tokenizes the query, drops common stopwords/filler
 * verbs, and scores a house by summing each surviving token's best-field
 * match (strong fields 10, weak fields 5) -- so a sentence with several
 * relevant words outranks one with only an incidental single-word hit.
 * Pure keyword ranking over already-sourced house text, no invented
 * content -- but it's a heuristic, not a guarantee of the single "best"
 * house, which is why the UI shows several ranked suggestions rather than
 * auto-picking one.
 */
export function searchHousesByQuestion(query: string): QuestionSearchResult[] {
  const tokens = tokenizeQuestion(query);
  if (tokens.length === 0) return [];

  const results: QuestionSearchResult[] = [];

  for (const house of HOUSE_INTERPRETATIONS) {
    let score = 0;
    const matchedTokens: string[] = [];
    let bestSnippet: string | null = null;
    let bestTokenScore = 0;

    for (const token of tokens) {
      let tokenScore = 0;
      let tokenSnippet: string | null = null;

      for (const [field] of STRONG_FIELDS) {
        const text = house[field] as string;
        const idx = text.toLowerCase().indexOf(token);
        if (idx !== -1) {
          tokenScore = 10;
          tokenSnippet = snippetAround(text, idx, token.length);
          break;
        }
      }
      if (tokenScore === 0) {
        for (const [field] of WEAK_FIELDS) {
          const text = house[field] as string;
          const idx = text.toLowerCase().indexOf(token);
          if (idx !== -1) {
            tokenScore = 5;
            tokenSnippet = snippetAround(text, idx, token.length);
            break;
          }
        }
      }

      if (tokenScore > 0) {
        score += tokenScore;
        matchedTokens.push(token);
        if (tokenScore > bestTokenScore) {
          bestTokenScore = tokenScore;
          bestSnippet = tokenSnippet;
        }
      }
    }

    if (score > 0) {
      results.push({ house, score, matchedTokens, snippet: bestSnippet });
    }
  }

  return results.sort((a, b) => b.score - a.score || a.house.id - b.house.id);
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
