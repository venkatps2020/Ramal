// Hand-classified mapping of each house's `specialDerived` phrases (see
// houses.ts) onto the same six category fields used by HouseDetailPanel's
// "By category" section. specialDerived items don't carry a category tag in
// the source workbook -- this is an editorial placement decision (owner
// request: "items in special / derived associations can be classified
// within By Category"), not sourced data, so it lives here rather than in
// the generated houses.ts.
//
// Keyed by houseId -> normalized item text -> category field. Any
// specialDerived item that isn't found here (e.g. after houses.ts is
// regenerated with different phrasing) falls back to being listed under the
// panel's collapsible "Interpretive" section instead of silently vanishing
// -- see HouseDetailPanel.tsx.
import type { HouseInterpretation } from "@/lib/types";

export type CategoryField = keyof Pick<
  HouseInterpretation,
  "healthBody" | "familyRelationships" | "moneyMaterial" | "workCareer" | "travelMovement" | "psychologicalSpiritual"
>;

function normalize(item: string): string {
  return item.toLowerCase().replace(/\s+/g, " ").trim().replace(/[.,]$/, "");
}

function toMap(entries: Array<[string, CategoryField]>): Record<string, CategoryField> {
  const out: Record<string, CategoryField> = {};
  for (const [item, field] of entries) out[normalize(item)] = field;
  return out;
}

export const SPECIAL_DERIVED_CATEGORY: Record<number, Record<string, CategoryField>> = {
  1: toMap([
    ["Medicine", "healthBody"],
    ["Diet", "healthBody"],
    ["Present condition of the querent", "healthBody"],
    ["Personal position in relation to opponent", "psychologicalSpiritual"],
    ["Context / place of the Ramal question", "travelMovement"],
  ]),
  2: toMap([
    ["Medicine", "healthBody"],
    ["Friend's father", "familyRelationships"],
    ["Secret enemy's brother", "familyRelationships"],
    ["Children of friends", "familyRelationships"],
    ["Daughter's friends", "familyRelationships"],
    ["Messengers", "workCareer"],
    ["Royal palace / king's illness", "healthBody"],
  ]),
  3: toMap([
    ["Correspondence and signatures", "workCareer"],
    ["Phone / internet / social media", "workCareer"],
    ["Messages", "workCareer"],
    ["Relations with colleagues", "workCareer"],
    ["Official contacts / authority-related matters", "workCareer"],
  ]),
  4: toMap([
    ["Trees / plants", "moneyMaterial"],
    ["Water bodies: river, pond, tank, pool", "travelMovement"],
    ["Pets / domesticated animals", "familyRelationships"],
    ["Government / political-administrative matters", "workCareer"],
    ["Succession", "moneyMaterial"],
  ]),
  5: toMap([
    ["Love relationship", "familyRelationships"],
    ["Sensuality", "psychologicalSpiritual"],
    ["Fun / pleasure", "psychologicalSpiritual"],
    ["Accuracy of news", "psychologicalSpiritual"],
    ["Ancestral wealth", "moneyMaterial"],
    ["Child of a friend / related derived readings", "familyRelationships"],
  ]),
  6: toMap([
    ["Enemies", "psychologicalSpiritual"],
    ["Weapons", "psychologicalSpiritual"],
    ["Small animals", "healthBody"],
    ["Poison", "healthBody"],
    ["Black magic / sorcery", "psychologicalSpiritual"],
    ["Litigation / dispute context", "workCareer"],
  ]),
  7: toMap([
    ["War / conflict", "psychologicalSpiritual"],
    ["Debate", "workCareer"],
    ["Opponent / competitor", "workCareer"],
    ["Purity of women", "familyRelationships"],
  ]),
  8: toMap([
    ["Place of death / longevity matters", "healthBody"],
    ["Enemy", "psychologicalSpiritual"],
    ["Property", "moneyMaterial"],
    ["Hidden matters", "psychologicalSpiritual"],
    ["Possibilities of love", "familyRelationships"],
  ]),
  9: toMap([
    ["Good luck", "psychologicalSpiritual"],
    ["Fame", "psychologicalSpiritual"],
    ["Adoption", "familyRelationships"],
    ["Sannyasa / renunciation", "psychologicalSpiritual"],
    ["Dreams", "psychologicalSpiritual"],
    ["Book / treatise writing", "workCareer"],
    ["Father's debt", "moneyMaterial"],
  ]),
  10: toMap([
    ["King / state", "workCareer"],
    ["Command", "workCareer"],
    ["Government", "workCareer"],
    ["Honour", "psychologicalSpiritual"],
    ["Public standing", "psychologicalSpiritual"],
    ["Competitive examinations", "workCareer"],
    ["Political / administrative success", "workCareer"],
  ]),
  11: toMap([
    ["Friends", "familyRelationships"],
    ["Father's death", "familyRelationships"],
    ["King's treasury", "moneyMaterial"],
    ["Spouse of progeny", "familyRelationships"],
  ]),
  12: toMap([
    ["Imprisonment", "workCareer"],
    ["Fear of thief", "psychologicalSpiritual"],
    ["Hospital / institution", "healthBody"],
    ["Foreign lands", "travelMovement"],
    ["Punishment", "workCareer"],
    ["Thieves", "psychologicalSpiritual"],
    ["Spiritual release", "psychologicalSpiritual"],
  ]),
};

export { normalize as normalizeSpecialDerivedItem };
