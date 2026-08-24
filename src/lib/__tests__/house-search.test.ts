import { describe, it, expect } from "vitest";
import { searchHouses } from "@/lib/house-search";
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

  it("finds House 12 for a direct-item keyword like 'thief' ('Fear of thief', directItems)", () => {
    const results = searchHouses("thief");
    expect(results[0].house.id).toBe(12);
    expect(results[0].score).toBe(10);
  });

  it("ranks a strong-field match above a weak-field match for the same query", () => {
    // Pick a term guaranteed to appear in a strong field for at least one house.
    const results = searchHouses("marriage");
    expect(results.length).toBeGreaterThan(0);
    const scores = results.map((r) => r.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("a term appearing only in expandedItems/specialDerived scores weak-tier, not strong-tier", () => {
    // House 8's specialDerived text ("...use cautiously and never as a
    // literal standalone prediction") is the source's own hedge language --
    // "cautiously" doesn't appear in any of House 8's strong fields
    // (theme/directItems/primaryQuestionUse), so it must rank as a weak (5),
    // not strong (10), match.
    const results = searchHouses("cautiously");
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
