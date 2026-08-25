import { describe, it, expect } from "vitest";
import { searchHouses, searchHousesByQuestion } from "@/lib/house-search";
import { HOUSE_INTERPRETATIONS } from "@/lib/data/houses";

describe("searchHouses", () => {
  it("returns all 12 houses in id order when the query is empty", () => {
    const results = searchHouses("");
    expect(results).toHaveLength(12);
    expect(results.map((r) => r.house.id)).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
  });

  it("finds a house by exact number", () => {
    const results = searchHouses("7");
    expect(results[0].house.id).toBe(7);
    expect(results[0].score).toBe(100);
  });

  it("finds House 12 for a keyword like 'thief' ('Fear of thief', specialDerived)", () => {
    const results = searchHouses("thief");
    expect(results[0].house.id).toBe(12);
    expect(results[0].score).toBe(5);
    expect(results[0].matchedField).toContain("interpretive");
  });

  it("ranks a strong-field match above a weak-field match for the same query", () => {
    // Pick a term guaranteed to appear in a strong field for at least one house.
    const results = searchHouses("marriage");
    expect(results.length).toBeGreaterThan(0);
    const scores = results.map((r) => r.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("a term appearing only in specialDerived scores weak-tier, not strong-tier", () => {
    // House 8's specialDerived text ("...Possibilities of love") is the only
    // place "possibilities" appears -- it doesn't occur in any of House 8's
    // strong fields (theme/directItems/primaryQuestionUse), so it must rank
    // as a weak (5), not strong (10), match.
    const results = searchHouses("possibilities");
    const house8 = results.find((r) => r.house.id === 8);
    expect(house8).toBeDefined();
    expect(house8?.score).toBe(5);
    expect(house8?.matchedField).toContain("interpretive");
  });

  it("every house is findable by searching its own primaryTheme verbatim", () => {
    for (const house of HOUSE_INTERPRETATIONS) {
      const term = house.primaryTheme.split(" / ")[0].toLowerCase();
      const results = searchHouses(term);
      expect(results.some((r) => r.house.id === house.id)).toBe(true);
    }
  });

  it("returns no results for a nonsense query", () => {
    expect(searchHouses("zzzznonexistentqueryxyz")).toHaveLength(0);
  });
});

describe("searchHousesByQuestion", () => {
  it("returns nothing for an empty or all-stopword query", () => {
    expect(searchHousesByQuestion("")).toHaveLength(0);
    expect(searchHousesByQuestion("will I get the")).toHaveLength(0);
  });

  it("surfaces House 7 for a marriage question", () => {
    const results = searchHousesByQuestion("will I get married");
    expect(results[0].house.id).toBe(7);
  });

  it("surfaces House 5 as the top match for a children question", () => {
    const results = searchHousesByQuestion("will I have children");
    expect(results[0].house.id).toBe(5);
  });

  it("sums scores across multiple matched tokens, ranking above a single-token match", () => {
    const results = searchHousesByQuestion("will I win the court case");
    const house6 = results.find((r) => r.house.id === 6);
    expect(house6).toBeDefined();
    expect(house6!.matchedTokens.length).toBeGreaterThan(1);
    expect(house6!.score).toBe(results[0].score);
    expect(results[0].house.id).toBe(6);
  });

  it("results are sorted by score descending, house id ascending on ties", () => {
    const results = searchHousesByQuestion("will I get the job");
    const scores = results.map((r) => r.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    // House 4 and House 10 both mention "job" -- both should surface.
    expect(results.map((r) => r.house.id)).toEqual(expect.arrayContaining([4, 10]));
  });
});
