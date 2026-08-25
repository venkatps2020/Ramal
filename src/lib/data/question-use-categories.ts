// Hand-classified mapping of each house's `primaryQuestionUse` phrases (see
// houses.ts) onto the same six category fields used by HouseDetailPanel's
// "By category" section, with each question-form sentence rewritten as a
// short bullet phrase for display. Editorial placement + rephrasing, not
// sourced data -- primaryQuestionUse itself is still Direct-tier (it's a
// workbook column, same as the category fields), the rewrite only changes
// "Will I get money?" -> "Getting money" for scannability, not the meaning.
// Owner request: merge "Used for questions about" into By category instead
// of a separate section, same treatment as specialDerived (see
// special-derived-categories.ts).
//
// Keyed by houseId -> normalized original question text -> { field, bullet }.
// Any primaryQuestionUse item that isn't found here (e.g. after houses.ts is
// regenerated with different phrasing) falls back to a small "Used for
// questions about" list in the panel's collapsible section, in its original
// question form, rather than silently disappearing.
import type { HouseInterpretation } from "@/lib/types";
import { normalizeSpecialDerivedItem as normalize } from "@/lib/data/special-derived-categories";

export type CategoryField = keyof Pick<
  HouseInterpretation,
  "healthBody" | "familyRelationships" | "moneyMaterial" | "workCareer" | "travelMovement" | "psychologicalSpiritual"
>;

interface Entry {
  field: CategoryField;
  bullet: string;
}

function toMap(entries: Array<[string, CategoryField, string]>): Record<string, Entry> {
  const out: Record<string, Entry> = {};
  for (const [original, field, bullet] of entries) out[normalize(original)] = { field, bullet };
  return out;
}

export const QUESTION_USE_CATEGORY: Record<number, Record<string, Entry>> = {
  1: toMap([
    ["Overall health / condition", "healthBody", "Overall health / condition"],
    ["Will I succeed in an undertaking?", "workCareer", "Success of a new undertaking"],
    ["Will I get money / profit?", "moneyMaterial", "Money / profit"],
    ["Will a new work begin successfully?", "workCareer", "Successful start of new work"],
  ]),
  2: toMap([
    ["Will I get money?", "moneyMaterial", "Getting money"],
    ["Will I make a profit?", "moneyMaterial", "Making a profit"],
    ["Will I get a loan?", "moneyMaterial", "Getting a loan"],
    ["Will debt / finances improve?", "moneyMaterial", "Improvement in debt / finances"],
    ["Will a marriage be finalised?", "familyRelationships", "Finalising a marriage"],
  ]),
  3: toMap([
    ["Relationship with brother / sister?", "familyRelationships", "Relationship with brother / sister"],
    ["Will I receive or send the expected message?", "workCareer", "Receiving or sending an expected message"],
    ["Will a document / communication succeed?", "workCareer", "Success of a document / communication"],
    ["Will I make the short journey?", "travelMovement", "Making the short journey"],
  ]),
  4: toMap([
    ["Will I get / retain property?", "moneyMaterial", "Getting / retaining property"],
    ["Will the house / vehicle matter succeed?", "moneyMaterial", "Success of a house / vehicle matter"],
    ["Will I get a government job / promotion?", "workCareer", "Getting a government job / promotion"],
    ["Will there be peace at home?", "familyRelationships", "Peace at home"],
    ["How is the father / parental matter?", "familyRelationships", "Father / parental matter"],
  ]),
  5: toMap([
    ["Will I get a child?", "familyRelationships", "Getting a child"],
    ["How is the child's education?", "familyRelationships", "Child's education"],
    ["Will a love relationship succeed?", "familyRelationships", "Success of a love relationship"],
    ["Will I succeed in a creative / speculative activity?", "workCareer", "Success in a creative / speculative activity"],
    ["Will the expected news be accurate?", "psychologicalSpiritual", "Accuracy of expected news"],
  ]),
  6: toMap([
    ["Will I recover from disease?", "healthBody", "Recovery from disease"],
    ["Will I overcome an enemy?", "psychologicalSpiritual", "Overcoming an enemy"],
    ["Will debt reduce?", "moneyMaterial", "Reduction in debt"],
    ["Will I get / retain a servant or service?", "workCareer", "Getting / retaining a servant or service"],
    ["Will I win a dispute / court matter?", "workCareer", "Winning a dispute / court matter"],
  ]),
  7: toMap([
    ["Will I get married?", "familyRelationships", "Getting married"],
    ["Will the relationship remain harmonious?", "familyRelationships", "Harmony in the relationship"],
    ["Will the partnership succeed?", "workCareer", "Success of the partnership"],
    ["Will I win against an opponent?", "psychologicalSpiritual", "Winning against an opponent"],
    ["Will a contract / agreement succeed?", "workCareer", "Success of a contract / agreement"],
  ]),
  8: toMap([
    ["Questions about hidden matters", "psychologicalSpiritual", "Hidden matters"],
    ["Inheritance / joint money", "moneyMaterial", "Inheritance / joint money"],
    ["Sudden change or crisis", "psychologicalSpiritual", "Sudden change or crisis"],
    ["Serious obstacles", "psychologicalSpiritual", "Serious obstacles"],
    ["Longevity-related questions", "healthBody", "Longevity"],
  ]),
  9: toMap([
    ["Will my journey be successful?", "travelMovement", "Success of the journey"],
    ["Will I succeed in higher education?", "workCareer", "Success in higher education"],
    ["Is the dream auspicious / meaningful?", "psychologicalSpiritual", "Auspiciousness / meaning of a dream"],
    ["Will fortune favour the matter?", "psychologicalSpiritual", "Fortune favouring the matter"],
  ]),
  10: toMap([
    ["Will I get a good job?", "workCareer", "Getting a good job"],
    ["Will I succeed in business?", "workCareer", "Success in business"],
    ["Will I get a promotion / high post?", "workCareer", "Getting a promotion / high post"],
    ["Will I succeed in an election / official matter?", "workCareer", "Success in an election / official matter"],
    ["Will my professional reputation improve?", "psychologicalSpiritual", "Improvement in professional reputation"],
  ]),
  11: toMap([
    ["Will I make a profit?", "moneyMaterial", "Making a profit"],
    ["Will my wish be fulfilled?", "psychologicalSpiritual", "Fulfilment of a wish"],
    ["Will I receive recognition / certificate?", "workCareer", "Receiving recognition / a certificate"],
    ["Will friends support me?", "familyRelationships", "Support from friends"],
    ["Will gains come from the matter?", "moneyMaterial", "Gains from the matter"],
  ]),
  12: toMap([
    ["Will I go on a foreign tour?", "travelMovement", "Going on a foreign tour"],
    ["Will debt reduce / end?", "moneyMaterial", "Reduction / end of debt"],
    ["Will I be released from a restriction?", "psychologicalSpiritual", "Release from a restriction"],
    ["Will hospitalisation / confinement end?", "healthBody", "End of hospitalisation / confinement"],
    ["Will expenses or losses reduce?", "moneyMaterial", "Reduction in expenses or losses"],
  ]),
};
