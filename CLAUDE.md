# Ramal

Ramal Astrology (Arabic geomancy) prediction tool: draw four figures, ask a
question, get a deterministic Yes/No answer with full calculation trace,
reproducing `Ramal Calculation.xlsx` exactly.

Built the same way as the sibling project `Nameology/nameology-app`: Next.js
App Router, TypeScript, Tailwind, Vitest, engines-first with exhaustive
tests before UI, no backend, no database -- reference data ships as static
TypeScript modules, prediction history lives in `localStorage`.

## Project structure

```
src/
  app/
    page.tsx                 -- Home page
    new-prediction/page.tsx  -- Draw figures, ask question, calculate, view trace,
                                 Judgement Library (same chart, collapsed by default) --
                                 the only place the Judgement Library is reachable, see below
    layout.tsx                -- Root layout, dark mode init
  components/
    layout/Navbar.tsx
    FigureGlyph.tsx           -- Renders a 4-symbol pattern as bindu/rekha marks
    HouseCombobox.tsx          -- Searchable House picker (see "House search" below)
    HouseDetailPanel.tsx       -- Direct vs. Interpretive breakdown for one house,
                                   organized "By category" (see below)
    JudgementResults.tsx       -- Category-grouped rendering of all 40 rules, used by
                                   new-prediction/page.tsx (kept as its own component even
                                   with one caller -- see below for why)
    PrashnaKundaliChart.tsx    -- Traditional 8/4/4 Stihir Kundali layout (see below)
    StihirKundaliTable.tsx     -- Full 16-figure reference table, collapsed by default,
                                   includes an unverified "English gloss" column (see below)
  lib/
    house-search.ts            -- Keyword ranking across all "12 Houses" sheet fields
    engines/
      figure.ts                -- addBit/addFigure (4-symbol XOR-style addition)
      kundali.ts                -- 16-place construction + validation guards
      prediction.ts             -- House-5 exception, Sthan Bali, Agam/Nirgam judgement
      timing.ts                 -- Timing lookup + 30-day/12-month normalization
      quick-duration.ts         -- Short Timing quick unit lookup (Prediction!B90:F91)
      predict.ts                -- Orchestrates the full pipeline + calculation trace
      judgement.ts              -- The 40-rule practical judgement library (PDF-sourced)
      __tests__/                -- 92 Vitest tests: exhaustive combinations,
                                    a real cell-verified workbook benchmark, guards,
                                    the judgement rule registry
    data/
      house-ppt-notes.ts        -- PPT slides 24-35 (Houses 1-12), phrase-split verbatim.
                                    Kept as retained source data (data-integrity.test.ts
                                    still checks it) but no longer rendered anywhere in
                                    the UI -- see "House Detail panel layout" below.
      figures.ts, houses.ts, timings.ts, questions.ts, glossary.ts
      -- all generated from Ramal Calculation.xlsx by scripts still in
         /private/tmp .../scratchpad/extract.py during this build; re-run
         extraction against a fresh workbook export by adapting that script
         (not yet wired into `npm run extract-data`).
      judgement-reference.ts   -- Abjad order + life-expectancy/troublesome-years
                                   tables for the judgement library
                                   (authority: Ramal-jyotish.pdf, not the workbook)
      special-derived-categories.ts, question-use-categories.ts
      -- hand-authored editorial mappings (NOT generated, NOT sourced) that sort a
         house's specialDerived/primaryQuestionUse items into HouseDetailPanel's "By
         category" buckets -- see "House Detail panel layout" below.
      figure-name-glosses.ts   -- Best-effort, explicitly-unverified English etymology
                                   for the 16 figure names -- see below.
    history.ts                 -- localStorage prediction history (client-only)
    types/index.ts
scripts/
  oracle.py                  -- Independent re-implementation of the engine, written
                                 fresh from the raw Excel formula text (not copied from
                                 the TS code) -- see "Excel regression oracle" below.
  oracle-diff.mts            -- Streams oracle.py's output into the real TS engine
                                 and diffs every field.
```

## Key implementation findings (source: actual workbook formulas, not just the docx spec)

These were confirmed directly from `Ramal Calculation.xlsx`'s array formulas
and a fully cell-verified worked example (cards 2,8,4,9; house 7; Nirgam --
see `benchmark.test.ts`), not assumed from the descriptive master spec:

- **Places 5-8 construction**: the row-wise transpose across the four Mother
  Figures (Place 5 = row 1/tez of mothers 1-4, Place 6 = row 2/vayu, Place 7
  = row 3/jal, Place 8 = row 4/prithvi) -- confirmed from
  `Prediction!J30:M33`'s array formulas.
- **Agam/Nirgam judgement diverges from the docx spec's own pseudocode.**
  The spec's prose describes a 4-symbol "nature" test (Dakhil/Sabit vs
  Kharij/Munqalib). The actual workbook formula (`Prediction!G42`) tests
  **only the first symbol** (tez position) of the result figure: Agam is
  YES only when it's `"-"`, Nirgam only when it's `"0"`. `Prediction!row55`
  and `row56` restate the else-branches of this same rule in terms of the
  result figure's own Agam/Nirgam Type ("Agam question + Nirgam answer ->
  No", "Nirgam question + Agam answer -> No") -- confirmed by the owner and
  verified as a complete bijection across all 16 Stihir Kundali figures
  (zero exceptions: first symbol `"-"` always means Type `AGAM`, `"0"`
  always means Type `NIRGAM`), so both phrasings are the same rule, not two
  rules to reconcile. `prediction.ts` implements the first-symbol test and
  exposes `resultNature()` so the trace/UI can show the Type-based framing.
- **Validation guard scope is narrow and literal**, not "every place":
  the workbook only ever checks Place 15 for the three-identical
  `CALCULATION_ERROR`, and Place 15 OR Place 1 for the four-identical
  `CANT_PREDICT_TODAY`. Implemented exactly that way in `kundali.ts`.
- **The three-identical guard is structurally unreachable** through natural
  draws -- an exhaustive test over all 16^4 = 65,536 possible draws (in
  `kundali.test.ts`) finds zero cases where Place 15 ends up 3-identical.
  The guard code is still implemented and unit-tested directly (it's cheap
  insurance if construction logic or a future manual-entry mode changes
  this), but don't expect to trigger it via the UI's draw flow.
- **Timing aggregation** scans the *current* prediction's own 16 constructed
  places (not the Sthir Kundali) for every place whose pattern coincidentally
  equals the result figure, sums Days/Months/Years from the one Timings
  block selected by the result's Timings Number, then normalizes (30
  days/month, 12 months/year, with carry). Confirmed from
  `Prediction!D61:G76`'s array formulas.

## Excel regression oracle (`npm run validate:oracle`)

Everything above was originally confirmed against exactly one real worked
example baked into the workbook (cards 2,8,4,9; house 7; Nirgam --
`benchmark.test.ts`). That's real cell-verified evidence, but it's one
data point. `scripts/oracle.py` is a second, independent implementation of
the whole engine (chart construction, guards, judgement, timing), written
directly from the raw Excel formula text pulled fresh via `openpyxl` --
not copied from or derived out of the TypeScript code, specifically so a
transcription mistake made once wouldn't just get silently repeated in a
second write-up.

`scripts/oracle-diff.mts` streams the oracle's output into the real
shipped engine (`buildPrashnaKundali` / `calculateQuestion` /
`computeTiming`, the exact same modules the app runs) and diffs every
field. Run:

```bash
npm run validate:oracle
```

**Last run (2026-08-24): all 1,572,864 possible (draw, house, type)
combinations -- the full 16^4 x 12 x 2 space, not a sample -- agree
exactly between the two independent implementations, including both
Normal- and Short-mode Quick Duration. Zero mismatches.**
`figures.ts` and `timings.ts` were separately cross-checked against a
fresh independent read of the workbook too (both PASS, all 16
figures/blocks match byte-for-byte). Re-run this after any change to
`kundali.ts`, `prediction.ts`, `timing.ts`, or `quick-duration.ts` -- it
takes about 15-20 seconds and it's the strongest correctness signal in the
repo, stronger than the hand-picked benchmark test alone.

**Gotcha hit and fixed while building this**: the diff script originally
compared object-valued fields with raw `JSON.stringify`, which is
key-order sensitive -- Python's `sort_keys=True` output and JS object
literal insertion order don't match, so every `quickDuration*` case
false-positived as a mismatch even though the values were identical.
Fixed with an order-independent `stableStringify` helper in
`oracle-diff.mts`. Worth remembering if a future field addition here
starts throwing suspicious 100%-mismatch runs -- check the comparison
method before assuming the engine is wrong.

## Quick Duration / Short Timing (`Prediction!B90:F91`)

A **separate, simpler** calculation from the main Timing engine above
(`Prediction!C59:G76`) -- this one just answers "which unit (Day(s) /
Week(s) / Month(s) / Year(s), or Minutes / Hours) and how many", gated by
the Short Timing flag (`Prediction!B8`). It runs *alongside* the detailed
engine, not instead of it -- both are always computed and shown.

This one was missed on the first pass: an initial exhaustive search for
any formula referencing `B8` came back with zero hits and was reported as
such, which was wrong -- the search's own filters were too narrow (it
required a `$B$8`/`!B8`/leading-`B8` pattern that a plain `B8="No"`
comparison inside a larger formula doesn't match). The owner pointed
directly at `B90:F91` and a broader raw-text search confirmed the real
formulas immediately. Worth remembering: a "zero hits" search result is
only as good as the search terms, especially across a 140-row, 25-column
sheet with mixed input/formula/label rows.

Implemented in `engines/quick-duration.ts`, reproducing **two confirmed
real bugs in the shipped workbook** faithfully (not silently corrected --
Excel is this project's primary executable reference):

- **`F90` (Normal mode unit label) is off by two rows.** It searches the
  matched Sthir house number against `D93`, `D94`, `D95`, `D96` in
  sequence -- but `D93` is blank and `D94` is a text label, not table
  data. The real Day/Week/Month/Year table lives at `D95:D98`. Houses 1-4
  and 5-8 happen to still resolve correctly (`D95`/`D96` are, respectively,
  the 3rd and 4th checks in the broken cascade and coincide with the real
  Day(s)/Week(s) rows), but houses 9-16 (Month(s)/Year(s)) are
  unreachable -- every branch fails and `F90` falls through to `""`.
- **`E91` (Short mode count) is off by one row.** It sums `D86:D89`
  against `E86:E89` instead of mirroring `E90`'s correct `D85:D88`/
  `E85:E88`, so it excludes the tez/first-symbol contribution (abjad
  weight 1) entirely and pairs in a blank phantom row instead.

Both were verified against the workbook's own cached values before being
implemented (house 8, cards 2/8/4/9: `E90` cached `2`, `F90` cached
`"Week(s)"` -- matches exactly) and are covered by the exhaustive oracle
above, not just the unit tests.

## Judgement Library (40 rules, `Ramal-jyotish.pdf` "फलादेश"/"प्रगत रमल")

Authority here is the PDF (conceptual/source material per master spec §2),
not the workbook -- unlike everything else in this app. Every rule was
re-transcribed from the source pages a second time (not just the first
orientation pass) before being encoded, and each carries a `sourceStatus`
(`SOURCE_DIRECT` / `SOURCE_DERIVED`) per the master spec's own Appendix C
provenance model.

**All 40 shipped rules are computed live** against a chart built from four
drawn Mother Figures, using shared primitives (`isDakhilOrSabit`,
`isKharijOrMunqalib`, `isShubh`, house merges via `addFigure`) plus a few
bespoke algorithms:

- **Item 1** (जातक की मनचिंता -- what is the querent really worried about)
  traces Place 15's first revealed tattva back through the construction
  chain to a witness place, then reads that place's own Sthir Kundali
  identity. Verified against the source's own worked example (15 -> 14 ->
  11 -> 5, landing on Sthir house 8).
- **Item 3** (कष्टकारक साल -- troublesome years) is a direct lookup on
  whichever figure lands in Place 1 (the first Mother Figure), via
  `TROUBLESOME_YEARS_TABLE` in `judgement-reference.ts`. Restored
  2026-08-25 after initially being removed for illegible source glyphs
  (see below) -- the owner supplied a page-13 transcription with each of
  the source's six shakal groups hand-encoded as an explicit 4-digit bit
  pattern ("-" = 1, "0" = 0), which was matched 1:1 against all 16
  `FIGURES` patterns with zero ambiguity and zero leftover, confirming
  both the age-lists (some values corrected from the original hard-to-read
  scan, e.g. 48 not 58 in the first group) and which figures each list
  applies to.
- **Item 27** (thief's appearance) uses a *different* 16-figure ordering
  than the normal Stihir house order (`ABJAD_ORDER` in
  `judgement-reference.ts`) -- verified exactly against the source's own
  worked example (Humra -> abjad position 2 -> Sthir house 2 =
  Qabz-ul-Dakhil).
- **Item 42** (upcoming year quality) iteratively feeds Places 13/10/11/14
  back in as new Mother Figures 1/2/3/4 until Places 1/2/3/4 equal Places
  13/10/11/14 simultaneously ("Sabit Kundali"), with year quality depending
  on which iteration stabilizes. Verified two ways: a hand-derived fixture
  (drawing Jamaat four times stabilizes immediately, iteration 1) and the
  source's own worked example's *prose* (not its hand-drawn diagrams, which
  were deliberately not transcribed -- same glyph-legibility risk that
  originally blocked item 3, see below): it states in words that the chart stabilizes
  at iteration 4 with quality शुभ/Auspicious, matching this engine's
  `i === 4` bucket exactly.

**Items 16 and 26 remain removed entirely**, by explicit owner decision
(2026-08-24): neither has an Excel counterpart to verify against, and per
the owner's standing rule that verified Excel data is the final authority,
unverifiable PDF-only content doesn't ship rather than staying
half-implemented. (Item 3 was in this category too until it was restored
2026-08-25 -- see above.) What blocks each of the remaining two, for
whoever revisits this:

- **Item 16** (number of children) maps a planetary lord to a count but the
  source only lists 5 of the 9 possible lords (Sun=4, Moon=2, Jupiter=3,
  Venus=6, Saturn=1 -- Mercury/Mars/Rahu/Ketu unlisted). Checked and ruled
  out "the missing 4 lords never occur here" as an explanation -- all 9
  lords are structurally possible outcomes.
- **Item 26** (thief inside/outside) -- the source's own phrasing ("count
  hidden tattvas... add the revealed tattva count... divide by 3") sums to
  a mathematical constant (total cell count) regardless of the chart, so it
  can't be the rule as transcribed.

**Caught and fixed during review**: items 33 and 39 were first implemented
testing Dakhil/Sabit like most of the other rules, but the source actually
specifies Kharij/Munqalib for both. The regression test in
`judgement.test.ts` ("R33 and R39 test Kharij/Munqalib...") exists
specifically to catch this class of transcription slip again.

## Judgement Library on the New Prediction page (`JudgementResults.tsx`)

Per owner request (2026-08-25, "given that these are predictions based on
4 chosen mother figures, can these not appear below the Calculation
trace"): the 40-rule Judgement Library renders on `new-prediction/page.tsx`,
directly below "Show calculation trace", behind its own "Show Judgement
Library" toggle (collapsed by default). It runs against `result.chart` --
the exact same 16-place chart the Yes/No prediction and timing were
computed from, built from the same four drawn Mother Figures -- not a
second independent draw.

`new-prediction/page.tsx` also gained a **Gender** input (Female/Male
toggle, defaults to Female), placed in the initial input form right after
Short Timing per owner instruction -- it's only read by Judgement item 21
("Will a second marriage be beneficial?"); every other rule ignores it.

**There used to be a separate `/judgement` page** with its own
four-figure picker and "Draw random" button, reachable from a "Judgement
Library" nav tab -- removed by owner decision (2026-08-25, "can we remove
Judgement Library tab?") once the same results became reachable from New
Prediction, since maintaining a second entry point to the same 40 rules
was redundant. The category-grouped rendering (13 categories, one card
per rule with question/answer/detail/`sourceStatus` pill) had already
been extracted into a standalone `JudgementResults` component (`chart` +
`ctx: JudgementContext` props) before the `/judgement` page was removed,
so removing the page was just deleting `app/judgement/` and the Navbar
link -- `JudgementResults` itself needed no changes and is kept as its
own component rather than inlined back into `new-prediction/page.tsx`,
in case a second entry point is wanted again later.

**Trade-off worth knowing**: the standalone page let you see all 40
answers from just four figures, with no house/question/Short Timing
needed. On New Prediction, the Judgement Library section only appears
*after* clicking Calculate (it's nested inside the `result &&` block),
so reaching it now always requires filling in House/Type first even
though the Judgement Library itself never reads those two fields.

## Figure name English glosses (`StihirKundaliTable.tsx`)

Owner asked (2026-08-25, "can you add english explanation for such
words") for an English translation of the 16 figure names (Lahyan,
Jamaat, Faraha, ...). Neither `Ramal Calculation.xlsx`'s own "Meaning"
sheet (extracted verbatim into `glossary.ts`) nor `Ramal-jyotish.pdf`
translates the proper names themselves -- the workbook's glossary only
covers generic terminology (Dakhil/Kharij/Sabit/Munqalib, gender,
direction, element). So there's no sourced translation to pull from,
unlike everything else in this app.

`figure-name-glosses.ts` holds Claude's own best-effort Arabic/Urdu
etymology guesses instead, each tagged `high` / `medium` / `uncertain`
confidence, rendered as a new "English gloss" column in
`StihirKundaliTable` styled progressively lighter/italic the less
confident it is (e.g. Faraha = "Joy", high confidence, renders plainly;
Lahyan/Ankeesh/Uputul-* show "No confident translation identified" in
muted italics rather than a fabricated guess). An explicit caveat line
above the table states the column is not sourced data. Kept in its own
file, never merged into `figures.ts`'s `meaning` field (which *is*
sourced, from the workbook's Dakhil/Kharij/Sabit/Munqalib scale) so the
two are never confused.

## House search (`lib/house-search.ts`)

`HOUSE_INTERPRETATIONS` (`lib/data/houses.ts`) is generated from
`Ramal_12_Houses_Clean_Consolidated_v1.xlsx` (sheet "12 Houses - Summary"),
**not** the older "12 Houses" sheet of `Ramal Calculation.xlsx` -- see
"House data source" below for why and what changed. `HouseCombobox`
surfaces keyword search across every field; `HouseDetailPanel` shows the
full breakdown for whichever house is selected, with Direct fields (green
badge) visibly separated from Interpretive fields (amber badge) --
matching master spec §13's explicit requirement not to blur direct and
derived material together.

`searchHouses()` ranks `primaryTheme`/`directItems`/`primaryQuestionUse`
(score 10, "strong" fields) above the other 7 fields (score 5, "weak" --
`healthBody`, `familyRelationships`, `moneyMaterial`, `workCareer`,
`travelMovement`, `psychologicalSpiritual`, `specialDerived`;
`expandedItems` is currently always empty, see below) rather than treating
all text as equal, and always shows the matched snippet so the
practitioner sees *why* a house was suggested instead of trusting a
black-box rank. Verified in `house-search.test.ts` against the real
source text (not invented examples): searching "thief" surfaces House 12
(`Fear of thief`, now in `specialDerived`) at score 5; searching
"possibilities" surfaces House 8's `specialDerived` ("Possibilities of
love") at score 5, correctly tagged interpretive.

## House data source (`lib/data/houses.ts`)

As of 2026-08-24, house-meaning content comes from
`Ramal_12_Houses_Clean_Consolidated_v1.xlsx` (repo-sibling directory, not
checked into `ramal-app/`), an audited, explicitly de-duplicated 12-house
reference the owner supplied specifically to replace the older, messier
"12 Houses" sheet content. Its own `Source & Notes`/`README` sheets
document real corrections this fixes, verified present in the regenerated
data:

- **House 4 = Father, House 10 = Mother** for this Ramal lineage (not the
  usual Vedic allocation). The old data had this backwards/blended --
  House 4's `familyRelationships` used to read "Mother; father in some
  Ramal-derived interpretations...", House 10's read a mis-slotted
  livelihood sentence instead of anything about a parent at all.
- **House 12's canonical figure is Uputul Kharij**, not Nukhtul Dakhil --
  the PPT slide text itself is inconsistent here; the workbook's audited
  cross-reference resolves it this way (already matched the old data, so
  no change needed, but now explicitly documented instead of assumed).

Mapping from the workbook's "12 Houses - Summary" columns onto
`HouseInterpretation`:

| Workbook column | Field |
|---|---|
| Ramal Figure | `figureName` |
| Core Theme | `primaryTheme`, and also `directItems` (theme split on `" / "` into short tags, e.g. "Partner / Marriage / Business Partnership" -> "Partner; Marriage; Business Partnership") |
| Health / Body ... Primary Question Use | the matching 8 category fields, each bullet-list cell (`"• a\n• b"`) joined `"a; b"` to match the existing `splitItems()` convention |
| *(none)* | `expandedItems` -- always `""` now. The old field was exactly the redundant, not-properly-separated derived layer this consolidated source's own editorial rules ("duplicates removed", "derived items not silently promoted to direct rules") were built to eliminate; since it's always empty it simply never renders anywhere in `HouseDetailPanel`, so no UI change was needed for it specifically. |
| *(none)* | `secondarySupportingHouses` -- kept verbatim from the old data; the new source doesn't cover cross-house references, and none was supplied to replace it with. |

Regenerating: re-run the extraction (`openpyxl`, `data_only=True`, sheet
`"12 Houses - Summary"`, rows 2-13) and hand-verify the diff against this
table before replacing `houses.ts` -- do not regenerate from the `"12
Houses - List"` sheet's per-house blocks, they're the same content
reformatted, not a second source to cross-check against.

## Prashna Kundali display (`PrashnaKundaliChart.tsx`)

Replaced the original sequential 4x4 grid with the traditional layout the
PDF and PPT both use consistently throughout the source material (e.g.
`1 to 16 - updated 18.1.24.pptx` slide 21's "रमल स्थिर कुंडली" diagram):
read right-to-left, tapering from an 8-place row down to a 4-place row
split 1-2-1, with each block labeled by its named division:

```
Row 1 (8-wide):  8  7  6  5  |  4  3  2  1
                 Places 5-8 -- Binhat  |  Places 1-4 -- Umhat
Row 2 (4-wide):  12  11  |  10  9
                 Places 9-12 -- Mudbalidat
Row 3 (4-wide):  14  |  16  15  |  13
                 Places 13-16 -- Jaydat / Jawaydat
```

Row 3 is rendered as two stacked rows (14, 13 on top; 16, 15 below,
narrowed and centered) rather than attempting the source's literal
converging-triangle line art or a single flat 4-column row -- per owner
request, to keep 15/16 visually close together underneath 13/14.

## House PPT notes (`lib/data/house-ppt-notes.ts`)

A second, separate house-description source: `1 to 16 - updated
18.1.24.pptx` slides 24-35 (Houses 1-12), each slide's own narrative
prose, phrase-split on its line breaks and preserved verbatim (including
the source's own typos, e.g. House 2's "condition of the sick perso,n").
Generated programmatically from the pptx (not hand-transcribed) via a
one-off extraction script, the same discipline used for every other data
file in this project.

Authority is the PPT (source/conceptual per master spec §2), distinct
from the Excel-sourced Direct tier. Originally shown as its own
separately-badged sub-section, then merged into a "What this house
covers" section alongside `directItems` -- but per owner decision
(2026-08-25, "What this house covers is not required as it is already
available in drop down") that whole section, PPT phrases included, was
**removed from `HouseDetailPanel` entirely**: `HouseCombobox`'s search
snippet already surfaces the same kind of coverage text when picking a
house, so a second, static copy of it inside the detail panel was
redundant. `house-ppt-notes.ts` itself is untouched and still exercised
by `data-integrity.test.ts` -- only its UI rendering was dropped. See
"House Detail panel layout" below for what the panel shows today.

## House Detail panel layout (`HouseDetailPanel.tsx`)

Went through several rounds of readability/content feedback -- worth
knowing the end state so a future "make it more readable" or "simplify
this" request doesn't re-litigate settled decisions:

1. First pass split the dense source paragraphs into scannable pieces at
   all (semicolon-joined sheet cells were rendered as one dense
   paragraph originally).
2. Second pass ("What this house covers and PPT source are same, merge
   them") merged the Direct and PPT tiers into one section, and switched
   "Used for questions about" from wrapped chips to a one-per-line list.
3. Third pass ("format the show house detail... item below other or
   something better") replaced the remaining wrapped-pill chip layout
   (`TagList`) everywhere in the panel with a single `ItemList`
   component: every field renders as a vertical list, one item per line,
   each with a small tone-colored marker dot (green = Direct, amber =
   Interpretive) instead of a colored pill background -- chips read as a
   tag cloud, a vertical list reads top-to-bottom like normal content.
   Sections are grouped into one bordered card with dividers
   (`divide-y`) instead of separate floating blocks, and a header (house
   number, figure name, `primaryTheme`) was added since nothing inside
   the panel previously restated which house it was for.
4. Fourth pass (2026-08-25, "What this house covers is not required...")
   dropped the whole merged Direct+PPT section -- see "House PPT notes"
   above.
5. Fifth pass (2026-08-25, "items in special / derived associations can
   be classified within By Category", then "take Used for questions
   about, rephrase them as bullets and add under categories") moved both
   remaining standalone sections into "By category" instead of listing
   them separately:
   - `specialDerived` items are sorted into whichever of the six
     category buckets (Health/Body, Family, Money, Work/Career, Travel,
     Psychological) fits best, via a hand-classified lookup in
     `special-derived-categories.ts` (keyed by houseId + normalized item
     text). They render as amber "Interpretive" items directly under
     that category's own green "Direct" items, same `ItemList`, two
     tones -- not blurred together per master spec §13.
   - `primaryQuestionUse` items go through the same treatment via
     `question-use-categories.ts`, but are *also* rewritten from question
     form ("Will I get money?") into a bullet phrase ("Getting money")
     for the merge -- and rendered with the **green "Direct" tone**,
     because `primaryQuestionUse` is itself a Direct-tier workbook
     column, same as the category fields; only its *phrasing* changed,
     not its provenance.
   - Both lookups are keyed defensively: any item that doesn't match
     (e.g. after `houses.ts` regenerates with different phrasing) falls
     back to a small list in the panel's collapsible "Interpretive"
     section rather than silently disappearing. As of 2026-08-25 every
     item across all 12 houses matches -- the fallback currently renders
     nothing, verified with a one-off coverage script during that change.

The now-dead "Expanded items" subsection (always empty since the house
data migration, see below) was dropped rather than kept as a permanent
"Nothing beyond what's already shown above." fixture. What remains behind
the collapsible "Interpretive" toggle today is just "Secondary supporting
houses" (plain text field) plus the two fallback lists above, which are
normally empty.

## `suppressHydrationWarning` on both `<html>` and `<body>` (`layout.tsx`)

Two separate, confirmed causes, not one -- don't remove either without
re-diagnosing:

1. **`<html>`**: the dark-mode flash-prevention script adds `class="dark"`
   synchronously, before React hydrates. Reproduced by emulating a dark
   `colorScheme` in Playwright; the diff was exactly `<html lang="en"
   className="dark">`.
2. **`<body>`**: a browser (Comet, in the reported case) injects its own
   attributes (`inject_newsvd`, `inject_vt_svd`) onto `<body>` before
   hydration -- confirmed absent from this entire codebase (`grep` came
   back empty), then reproduced deliberately by injecting those exact
   attribute names via Playwright's `addInitScript` (which runs before any
   page script, the same timing a real extension gets) and confirming zero
   hydration warnings once the attribute was present, matching the real
   report's own diff verbatim.

Both are the officially-recommended fix for their respective failure mode
(theme-flash-prevention scripts and browser-extension DOM injection are
Next.js's own two documented causes for this warning), scoped to the one
element actually being modified rather than suppressed globally. If a
*third* hydration report comes in, verify with the same method before
assuming it's covered: reproduce it deliberately (dark-mode emulation or
`addInitScript` attribute injection, whichever fits), confirm the fix
resolves that exact reproduction, don't just add `suppressHydrationWarning`
somewhere and hope.

## Deferred by owner decision

**Dhruvank is out of scope.** `lib/data/questions.ts` imports the
`Dhruvank Questions` sheet as inert reference data only (`dhruvankRaw`,
never read by any engine code) -- required anyway by "all seven sheets
imported and retained." No interpretation engine, enum, or feature flag
exists for it. Do not build one without the owner's explicit go-ahead; see
the project's implementation-plan artifact for the full rationale.

## Not yet built (see project plan for the full phased roadmap)

- Excel import/versioning/admin approval workflow (spec §18) -- v1 ships
  the workbook's data pre-extracted as static TS, not a runtime importer.
- Question search / natural-language classification (spec §12-13).
- House Explorer, Figure reference pages, Glossary UI.
- Electron packaging (Nameology has this; not yet wired up here).
- PDF export, CSV export.
- Judgement Library item 42's diagram-level fixture (currently verified via
  the source's prose only, not a cell-by-cell diagram match -- see above).

## Dev commands

```bash
npm run dev      # Dev server at http://localhost:3001
npm run build    # Production build
npm run start    # Serve production build (also port 3001)
npm test         # Run all 92 Vitest tests
npm run test:watch
npm run validate:oracle  # Independent Excel-formula cross-check, all 1,572,864 cases (~15s)
```

**Port is pinned to 3001, not Next's default 3000.** Nameology also
defaults to 3000 and is a PWA with its own service worker (`sw.js`,
offline caching) -- if both apps ever run on the same port, the browser
treats them as the same origin, and Nameology's service worker can keep
serving cached Nameology content at `localhost:3000` even when Ramal's
server is what's actually running there. Pinning Ramal to 3001 avoids the
origin collision entirely rather than requiring a manual service-worker
unregister every time it recurs.
