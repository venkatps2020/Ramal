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
                                 the only place the Judgement Library is reachable, see below.
                                 Also: natural-language question search, recent-predictions
                                 summary at the bottom -- see "New Prediction page additions" below.
    reference/page.tsx        -- Reference: five-tab static reference material (Stihir
                                 Kundali, Figures, Houses, Timings, Glossary) -- see
                                 "Reference tab" below
    layout.tsx                -- Root layout, dark mode init
  components/
    layout/Navbar.tsx
    FigureGlyph.tsx           -- Renders a 4-symbol pattern as bindu/rekha marks
    HouseCombobox.tsx          -- Searchable House picker (see "House search" below)
    HouseDetailPanel.tsx       -- Direct vs. Interpretive breakdown for one house,
                                   organized "By category" (see below); also used by
                                   HouseExplorer
    HouseExplorer.tsx          -- Browsable grid of all 12 houses -> HouseDetailPanel;
                                   the "Houses" tab of reference/page.tsx (see below)
    FigureDetailPanel.tsx       -- Full attribute breakdown for one of the 16 canonical
                                   figures (lord, nature, auspiciousness, timing number,
                                   etc.); also used by FigureExplorer
    FigureExplorer.tsx          -- Browsable grid of all 16 figures -> FigureDetailPanel;
                                   the "Figures" tab of reference/page.tsx (see below)
    TimingsChart.tsx           -- All 16 Timings blocks, each a collapsed-by-default
                                   16-place Days/Months/Years table; the "Timings" tab of
                                   reference/page.tsx (see below)
    JudgementResults.tsx       -- Category-grouped rendering of all 42 rules, used by
                                   new-prediction/page.tsx (kept as its own component even
                                   with one caller -- see below for why); includes a
                                   category jump-nav (see "New Prediction page additions")
    QuestionSearch.tsx          -- "Describe your question" free-text house suggester
                                   (see "New Prediction page additions" below)
    HistorySummary.tsx          -- Collapsed last-10-predictions list
                                   (see "New Prediction page additions" below)
    PrashnaKundaliChart.tsx    -- Traditional 8/4/4 Stihir Kundali layout (see below)
    StihirKundaliTable.tsx     -- Full 16-figure reference table, collapsed by default,
                                   includes an unverified "English gloss" column (see
                                   below); the "Stihir Kundali" tab of reference/page.tsx
                                   -- no longer rendered on New Prediction, see below
    GlossaryTable.tsx           -- Term -> Meaning table with Roman transliteration;
                                   the "Glossary" tab of reference/page.tsx (see below)
  lib/
    house-search.ts            -- Keyword ranking across all "12 Houses" sheet fields
                                   (searchHouses, single-term) plus a natural-language
                                   multi-word variant (searchHousesByQuestion) -- see
                                   "New Prediction page additions" below
    engines/
      figure.ts                -- addBit/addFigure (4-symbol XOR-style addition)
      kundali.ts                -- 16-place construction + validation guards
      prediction.ts             -- House-5 exception, Sthan Bali, Agam/Nirgam judgement
      timing.ts                 -- Timing lookup + 30-day/12-month normalization
      quick-duration.ts         -- Short Timing quick unit lookup (Prediction!B90:F91)
      predict.ts                -- Orchestrates the full pipeline + calculation trace
      judgement.ts              -- The 42-rule practical judgement library (PDF-sourced)
      __tests__/                -- 100 Vitest tests: exhaustive combinations,
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
         (not yet wired into `npm run extract-data`). questions.ts's
         QUESTION_MASTER.text is shown on House Detail as of 2026-08-26 --
         see "Dhruvank Questions on House Detail" below; its dhruvankRaw
         field is still unused.
      judgement-reference.ts   -- Abjad order + life-expectancy/troublesome-years
                                   tables for the judgement library
                                   (authority: Ramal-jyotish.pdf, not the workbook)
      special-derived-categories.ts, question-use-categories.ts
      -- hand-authored editorial mappings (NOT generated, NOT sourced) that sort a
         house's specialDerived/primaryQuestionUse items into HouseDetailPanel's "By
         category" buckets -- see "House Detail panel layout" below.
      figure-name-glosses.ts   -- Best-effort, explicitly-unverified English etymology
                                   for the 16 figure names -- see below.
      glossary-transliteration.ts -- Hand-authored Roman-script transliteration of
                                   glossary.ts's 34 Hindi/Marathi terms -- see below.
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

**Last run (2026-08-26, after the `F90` unit-label fix -- see "Quick
Duration / Short Timing" below): all 1,572,864 possible (draw, house,
type) combinations -- the full 16^4 x 12 x 2 space, not a sample -- agree
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

Implemented in `engines/quick-duration.ts`. One real formula bug was
found in the shipped workbook and has since been fixed there; a second
thing that looked like a bug on first read turned out to be intended
behavior, confirmed directly with the owner rather than assumed either
way:

- **`F90` (Normal mode unit label) was off by two rows -- FIXED
  2026-08-26.** It used to search the matched Sthir house number against
  `D93`, `D94`, `D95`, `D96` in sequence -- but `D93` is blank and `D94`
  is a text label, not table data. The real Day/Week/Month/Year table
  lives at `D95:D98`. Houses 1-4 and 5-8 happened to still resolve
  correctly (`D95`/`D96` are, respectively, the 3rd and 4th checks in the
  broken cascade and coincide with the real Day(s)/Week(s) rows), but
  houses 9-16 (Month(s)/Year(s)) were unreachable -- every branch failed
  and `F90` fell through to `""`. The owner corrected the `F90` formula
  in the workbook itself to check `D95:D98` directly; this was
  re-verified live against the corrected formula text (not just
  re-derived independently) before `quick-duration.ts` and `oracle.py`
  were both updated to match -- see "Timing: zero matching places in the
  current chart" below for the investigation that surfaced this.
- **`E91` (Short mode count) sums `D86:D89`/`E86:E89`, one row shifted
  from `E90`'s `D85:D88`/`E85:E88` pairing, excluding the tez/first-
  symbol contribution (abjad weight 1) entirely -- CONFIRMED CORRECT,
  NOT A BUG (owner, 2026-08-26, "E91 is correct in excel").** Originally
  logged as a suspected off-by-one bug on 2026-08-25; re-checked directly
  against both the live open workbook and the saved file on 2026-08-26
  (not assumed) -- `D89`/`E89` are genuinely blank on both, and the
  formula text is unchanged from the original read, so nothing was
  silently fixed and missed. The owner then confirmed the asymmetry
  itself is intentional: Short mode is allowed to weight the four
  symbols differently from Normal mode, not obligated to mirror `E90`'s
  pairing. No code change was needed -- `quick-duration.ts` already
  reproduced this exact formula; only the "bug" framing in code comments,
  tests, and this file was corrected.

Both were verified against the workbook's own cached values or formula
text before any conclusion was reached, and both paths are covered by
the exhaustive oracle above (`oracle.py`'s `compute_quick_duration` was
updated in lockstep with the `F90` fix -- re-run confirmed all 1,572,864
cases still agree).

## Timing: zero matching places in the current chart (`noPlaceMatch`)

The main Timing engine (`timing.ts`, `Prediction!C59:G76`) can
legitimately find **zero** places in the current chart matching the
result figure -- the result figure is guaranteed to match one of the 16
canonical Sthir figures, but nothing guarantees that pattern also
appears among *this specific* chart's own 16 constructed places. When
that happens, `totalDays`/`totalMonths`/`totalYears` are all correctly
`0` (verified live against Excel's actual formula, `Prediction!E60:G60 =
SUM(E61:E76)+...` over `D61:G76` cells that are each
`IFERROR(...,"")`-blanked when nothing matches -- `SUM` over blanks is
`0`, so Excel shows the same 0y/0m/0d). This isn't a TS-vs-Excel
divergence.

It's still misleading on its own, though -- "0 years 0 months 0 days"
reads as "happens immediately," not "this method found no data". Per
owner request (2026-08-26, investigating why draw `2,13,14,5` / House 3 /
Agam didn't show the expected "3 months"), `TimingResult` now carries a
`noPlaceMatch: boolean` flag (true exactly when `matches.length === 0`
but the figure did match a Sthir figure), and
`new-prediction/page.tsx`'s Timing block uses it to show Quick Duration's
estimate instead of a bare zero. That example is the regression anchor
in `benchmark.test.ts`: draw `2,13,14,5`, House 3, Agam -> result figure
matches Sthir house 9 (Bayaz) but appears nowhere in that chart's 16
places -> `noPlaceMatch: true`, and Quick Duration correctly resolves
`{ count: 3, unitLabel: "Month(s)" }` once the `F90` fix above was in
place (before the fix, this case would have shown a blank unit label
too, doubly unhelpful).

`TimingResult` also gained a top-level `sthirHouseId` (the matched Sthir
figure/house 1-16, mirroring `QuickDurationResult`'s own field of the
same name) per a follow-up owner request (2026-08-26): the "Timing
lookup" trace step and the New Prediction UI used to only cite the
*Timings Number* (`Prediction!C60`, a derived value -- e.g. Jamaat's
Timings Number is 13, not 4), which isn't the same number as the actual
matched Sthir house and was easy to misread as one. Both now state the
Sthir house explicitly, alongside the Timings Number and the exact
Prashna Kundali place numbers it was found at -- or, when
`noPlaceMatch`, say plainly "not available in this Prashna Kundali
chart" instead of listing zero places.

When more than one place matches, the per-place breakdown renders one
line per place plus a `Total:` line (using the already-normalized
`timing.totalYears/Months/Days`, not a naive re-sum of the displayed
per-place values -- e.g. 4m + 9m = 13m must carry to 1y 1m, matching
what `computeTiming`'s own carry logic already produces) -- owner
request (2026-08-26, "make this ... one below the other totalling to
final period"). The trace step's `detail` string uses real `\n`
separators; `new-prediction/page.tsx`'s trace rendering needed
`whitespace-pre-line` added (browsers collapse bare `\n` otherwise) --
that class applies to every trace step's detail div, harmless for
single-line steps.

**No "Excel"/"workbook"/cell-reference language in end-user-facing
text.** Per owner request (2026-08-26, "need not reference excel in the
app"): the home page, Glossary, House Explorer, Stihir Kundali table, and
the calculation trace text (`predict.ts`'s trace `detail` strings, which
render directly in the UI) no longer mention `Ramal Calculation.xlsx`,
"workbook", or `Prediction!<cell>` citations -- those stay in code
comments and this file, which are developer-facing, not user-facing.
Two now-dead UI branches were removed in the same pass rather than just
reworded: `quickDuration.unitLabel === ""` can only happen when
`sthirHouseId` is also `null` (already caught by the branch above it)
now that the `F90` fix means every house 1-16 resolves *some* unit --
the "not resolvable" text and its "workbook formula" citation were
unreachable dead code, not just Excel-flavored wording.

## Glossary transliteration (`glossary-transliteration.ts`)

`glossary.ts`'s 34 terms are Hindi/Marathi (Devanagari script only,
generated from the source, do not hand-edit); the Meaning column already
gives an English *translation*, but readers who can't read Devanagari
had no way to even pronounce the term itself. Per owner request
(2026-08-26, "in the glossary for term in hindi write in brackets in
english"), `glossary-transliteration.ts` adds a Roman-script
*transliteration* (not translation -- e.g. "स्थान क्र." -> "Sthan Kr.",
still meaning "Place / Position Number" per the existing Meaning
column) shown in brackets next to each term. Hand-authored, not sourced
(the workbook has no romanization column) -- kept in its own file rather
than added to `glossary.ts`, same discipline as `figure-name-glosses.ts`.
Indexed positionally, same order as `GLOSSARY` -- if `glossary.ts` is
ever regenerated with reordered/added rows, this file needs updating by
hand to match, there's no defensive fallback here (only 34 short, static
entries, low regeneration risk in practice).

## Judgement Library (42 rules, `Ramal-jyotish.pdf` "फलादेश"/"प्रगत रमल")

Authority here is the PDF (conceptual/source material per master spec §2),
not the workbook -- unlike everything else in this app. Every rule was
re-transcribed from the source pages a second time (not just the first
orientation pass) before being encoded, and each carries a `sourceStatus`
(`SOURCE_DIRECT` / `SOURCE_DERIVED` / `NEEDS_CONFIRMATION` -- the last used
for the first time 2026-08-26, by items 16 and 26, see below) per the
master spec's own Appendix C provenance model.

**All 42 shipped rules are computed live** against a chart built from four
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
  on which iteration stabilizes. Verified three ways: a hand-derived fixture
  (drawing Jamaat four times stabilizes immediately, iteration 1); the
  source's own worked example's prose (Ramal-jyotish.pdf p.18: it states in
  words that the chart stabilizes at iteration 4 with quality शुभ/Auspicious,
  matching this engine's `i === 4` bucket exactly); and, as of 2026-08-26,
  the same worked example's actual starting draw (see
  `judgement.test.ts`'s "reproduces the source's own worked example" case) --
  the owner transcribed p.18's four hand-drawn Kundali diagrams from the
  scan, which confirmed Kundali #1's Mother Figures (Lahyan, Humra,
  Nusrat-ul-Kharij, Bayaz) and their row-wise transpose (Places 1-6) exactly
  against `buildPrashnaKundali`, and running that same draw through
  `forecastUpcomingYear` independently lands on iteration 4, Auspicious --
  matching the source's stated conclusion. Places 7-16 of that diagram could
  NOT be reconciled: checking all 8 `addFigure` relationships purely against
  the owner's own transcription (no assumption about the draw needed) found
  every single one failed, ruling out isolated transcription typos --
  concluded to be a scan-legibility problem (small hand-drawn bindu/rekha
  marks, runs of 3-4 consecutive rekha are easy to miscount), not a
  construction bug, since `kundali.ts` is separately oracle-verified across
  all 1,572,864 possible cases. So this still isn't a cell-by-cell diagram
  match of the full 16-place chart, but reproducing the source's own final
  answer from its diagram-confirmed starting figures, via the engine's own
  already-verified construction, is a strictly stronger check than the
  prose-only citation it replaces.

**Items 16 and 26 were restored 2026-08-26**, both tagged
`sourceStatus: "NEEDS_CONFIRMATION"` -- the first rules in this file to
actually use that tier (it existed in the `SourceStatus` type from the
start but nothing used it until these two). They were originally removed
entirely by owner decision (2026-08-24): neither has an Excel counterpart
to verify against, and per the owner's standing rule that verified Excel
data is the final authority, unverifiable PDF-only content doesn't ship
half-implemented. (Item 3 was in this category too until it was restored
2026-08-25 -- see above.) What changed for each:

- **Item 16** (`R16`, number of children, `Ramal-jyotish.pdf` p.15) maps a
  planetary lord -- via the same `traceConcernOrigin` method item 1 uses --
  to a child count. This file previously said only 5 of 9 lords are listed
  (Sun=4, Moon=2, Jupiter=3, Venus=6, Saturn=1) -- **that was itself a
  transcription error**, re-verified 2026-08-26 directly against the scan
  at high zoom (right up against the paragraph's own box border, so
  nothing was truncated). The source actually lists **six** lords: Sun=4,
  Moon=**5**, **Mercury=2** (previously missing entirely -- its value had
  been misattributed to Moon), Jupiter=3, Venus=6, Saturn=1 -- all six now
  in `CHILDREN_COUNT_BY_LORD_BOOK` (`judgement-reference.ts`). The owner
  separately supplied Mars=4 from a different, independent Ramal source
  (not this book) -- kept in its own `CHILDREN_COUNT_BY_LORD_ALT` table,
  never merged into the book table, and `R16`'s own `compute()` flags it
  explicitly in the per-draw `detail` string ("value from an alternate
  source, not Ramal-jyotish.pdf itself") whenever that specific lord comes
  up, not just in the rule-level `sourceNote`. Rahu and Ketu are still
  genuinely unknown -- checked and ruled out "they never occur here" as an
  explanation (all 9 lords, including Rahu/Ketu, are structurally possible
  outcomes) -- `R16` returns `"Not yet known"` for those two rather than
  guessing, tested explicitly in `judgement.test.ts`.
- **Item 26** (`R26`, thief inside/outside, `Ramal-jyotish.pdf` p.16) --
  the book's own phrasing ("count hidden tattvas... add [मेल करें,
  re-confirmed 2026-08-26 -- not a misread of "subtract"] the revealed
  tattva count... divide by 3") sums to a mathematical constant (16 places
  x 4 symbols = 64, always) regardless of the chart, so it can't be the
  rule as transcribed -- confirmed computationally in `judgement.test.ts`.
  The owner supplied an alternate formula from a different, independent
  source instead: `(hidden-tattva count x 2) + revealed-tattva count`,
  divide by 3 -- verified computationally to actually vary by chart (0/1/2
  remainders across sample draws, not always 1), so `R26` implements that
  formula instead of the book's. Not confirmed against the primary
  Ramal-jyotish.pdf lineage this app otherwise follows, hence
  `NEEDS_CONFIRMATION` rather than `SOURCE_DIRECT`.

**Caught and fixed during review**: items 33 and 39 were first implemented
testing Dakhil/Sabit like most of the other rules, but the source actually
specifies Kharij/Munqalib for both. The regression test in
`judgement.test.ts` ("R33 and R39 test Kharij/Munqalib...") exists
specifically to catch this class of transcription slip again.

## Judgement Library on the New Prediction page (`JudgementResults.tsx`)

Per owner request (2026-08-25, "given that these are predictions based on
4 chosen mother figures, can these not appear below the Calculation
trace"): the 42-rule Judgement Library renders on `new-prediction/page.tsx`,
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
Prediction, since maintaining a second entry point to the same 42 rules
was redundant. The category-grouped rendering (13 categories, one card
per rule with question/answer/detail/`sourceStatus` pill) had already
been extracted into a standalone `JudgementResults` component (`chart` +
`ctx: JudgementContext` props) before the `/judgement` page was removed,
so removing the page was just deleting `app/judgement/` and the Navbar
link -- `JudgementResults` itself needed no changes and is kept as its
own component rather than inlined back into `new-prediction/page.tsx`,
in case a second entry point is wanted again later.

**Trade-off worth knowing**: the standalone page let you see all 42
answers from just four figures, with no house/question/Short Timing
needed. On New Prediction, the Judgement Library section only appears
*after* clicking Calculate (it's nested inside the `result &&` block),
so reaching it now always requires filling in House/Type first even
though the Judgement Library itself never reads those two fields.
Confirmed acceptable by the owner (2026-08-26, "it is fine") -- don't
"fix" this by hoisting the Judgement Library out of the `result &&`
block without checking first, it was a deliberate trade-off, not an
oversight.

## New Prediction page additions (`QuestionSearch.tsx`, `HistorySummary.tsx`, `JudgementResults.tsx`)

Three small features added together (2026-08-26, owner's enhancement list):

**Natural-language question search (`QuestionSearch.tsx` +
`searchHousesByQuestion` in `house-search.ts`)** -- a "Describe your
question" free-text box above the House field, e.g. typing "will I get
the job" surfaces House 10 (and House 4, which also mentions a
government job -- see below) as suggestions instead of requiring you to
already know which house covers your topic. This is a **new function**,
not a reuse of the existing `searchHouses()` (which `HouseCombobox`
still uses) -- `searchHouses()` does a single-term substring match, so a
full sentence like "will I get the job" would zero-match it verbatim
(the stored text is "Will I get a *good* job?", not a substring of the
query or vice versa). `searchHousesByQuestion()` instead: tokenizes the
query, drops a curated stopword list of filler words ("will", "i", "get",
"the", etc. -- deliberately excludes "get" since nearly every house's
`primaryQuestionUse` starts with "Will I get..."), then scores each
house by summing every surviving token's best-field match (strong fields
+10, weak fields +5) rather than stopping at the first hit -- so a
multi-word match outranks an incidental single-word one (verified in
`house-search.test.ts`, e.g. "will I win the court case" scores House 6
higher than a single-token match elsewhere because both "win" and
"court" hit).

This is pure keyword-ranking over already-sourced house text, not
invented content -- but it's explicitly a heuristic, not a guaranteed
single "correct" house: "will I get the job" ties House 4 and House 10
at score 10 (both genuinely mention a job in their own
`primaryQuestionUse`), so the UI shows up to 5 ranked suggestions with
snippets to click, rather than silently auto-picking one and hiding the
ambiguity.

**Result figure "working" display (`new-prediction/page.tsx`)** -- per
owner request (2026-08-26), the Result figure block now shows the actual
component figures, not just the final answer: `House {N}:
{questionHouseFigure's shakal name}` + `House 1: {house1Figure's shakal
name}` = `Result: {resultFigure's shakal name}`, each with its own
glyph, using `sthirFigureFor()` (already exported from `judgement.ts`)
to name each pattern -- no engine changes, `questionHouseFigure` and
`house1Figure` were already on `PredictionResult`, just not surfaced in
the UI before. **House 5 shows only `House 5: ... = Result: ...`, no "+
House 1"** -- per the house-5 exception (`prediction.ts`:
`questionHouse === 5 ? questionHouseFigure : addFigure(...)`), House 1
is never added for House 5, so `questionHouseFigure` and `resultFigure`
are *always* identical there; showing the addition anyway would
misrepresent the rule. Sanity-checked directly (not just by reading the
code): for draw `2,8,4,9`, House 5's `questionHouseFigure` and
`resultFigure` both resolve to Jamaat, byte-identical.

**Recent-predictions summary (`HistorySummary.tsx`)** -- a collapsed
"Show recent predictions (N)" toggle at the very bottom of
`new-prediction/page.tsx`, listing the last 10 saved entries (figures
shown with their numeric IDs alongside names, e.g. "2 Kabjatul Dakhil" --
added 2026-08-26 per owner request; house, type, status, timing). This
closes a real gap, not just an
enhancement: `saveHistoryEntry()` was still being called on every
Calculate all along (recording to `localStorage`), but nothing displayed
it after `RecentPredictions.tsx` was deleted earlier in this session
(see the "Remove Recent predictions" history) -- history was being
silently recorded with zero way to view it. `new-prediction/page.tsx`
now lifts a `history` state (`loadHistory()` on mount, refreshed from
`saveHistoryEntry()`'s own return value after each Calculate) and passes
it down, rather than `HistorySummary` reading `localStorage` itself, so
it stays in sync without a second read on every render.

**History cap lowered to 10, with active pruning (`history.ts`,
`HistorySummary.tsx`, 2026-08-26 owner request "keep only last 10 and
delete previous history")**: `MAX_ENTRIES` changed from 50 to 10, and
`loadHistory()` now actively trims and re-persists to `localStorage` any
time it finds more than 10 stored (not just a future-save-only cap) --
so entries saved under the old 50-cap get pruned the next time the page
loads, not just capped going forward. Also added per this request:
`HistoryEntry` gained a `shortTiming: boolean` field (not previously
recorded at all -- older stored entries won't have it, `HistorySummary`
falls back to `entry.shortTiming ? "Yes" : "No"`, so a missing/undefined
value reads as "No" rather than crashing), shown alongside Question
Type. House number was already shown (`House {questionHouse} --
{theme}`); the date now uses a fixed `dd/mm/yyyy` format
(`formatDate()`, hand-rolled from `getDate()`/`getMonth()`/
`getFullYear()`) instead of `toLocaleString()`, which was both
locale-dependent (not necessarily dd/mm/yyyy for every browser) and
included a time-of-day that wasn't asked for.

Verified end-to-end, not just by reading the code: seeded 15 fake
entries directly into a real browser's `localStorage` via Playwright
(simulating history saved under the old 50-cap), loaded
`new-prediction/page.tsx`, and confirmed both the UI ("Show recent
predictions (10)") and `localStorage` itself (re-read after load) held
exactly 10 -- the other 5 were genuinely deleted, not just hidden from
the list.

**"Clear history" button (2026-08-26)** -- `clearHistory()` existed in
`history.ts` since this file was first written but nothing ever called
it (flagged in the project plan as a real gap, not an enhancement idea).
`HistorySummary` now takes an `onClear` prop and renders a "Clear
history" button next to the "Show/Hide recent predictions" toggle
(visible whenever the section is, not just when expanded); clicking it
asks for confirmation (`window.confirm`, since this is an irreversible
full wipe of `localStorage` with no undo) before calling `onClear`.
`new-prediction/page.tsx` wires this to `clearAllHistory()`, which calls
`clearHistory()` and resets its own `history` state to `[]` in the same
step, so the section disappears immediately (same `entries.length ===
0` guard `HistorySummary` already had) rather than needing a reload.
Verified end-to-end with Playwright: seeded history via `localStorage`,
clicked Clear history, confirmed the dialog, and confirmed both
`localStorage` and the UI were empty afterward.

**Judgement Library category jump-nav (`JudgementResults.tsx`)** -- a
row of pill links at the top of the 42-rule list (one per category that
actually has rules), each an anchor (`#judgement-cat-<key>`) to that
category's section, since scrolling through all 13 categories/42 rules
in one long list was the "smaller UX polish" flagged when this
enhancement list was first discussed.

**Default House field (2026-08-26)**: `questionHouse` initializes to `1`,
not `7`. The old default of 7 had no documented reason anywhere (not the
workbook's benchmark example, which uses house 7 but different figures
and Nirgam not Agam; not mentioned in the master spec) -- confirmed via
`git log -S` that it's been `useState(7)` since this page's very first
commit with no explanatory message, i.e. an arbitrary placeholder from
initial scaffolding, not a deliberate choice worth preserving.

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
confident it is (e.g. Faraha = "Joy", high confidence, renders plainly).
An explicit caveat line above the table states the column is mostly not
sourced data. Kept in its own file, never merged into `figures.ts`'s
`meaning` field (which *is* sourced, from the workbook's
Dakhil/Kharij/Sabit/Munqalib scale) so the two are never confused.

**Five entries corrected by the owner directly (2026-08-26)**: Lahyan
(1), Ukla (6), Ankeesh (7), Uputul-Kharij (12), and Uputul-Dakhil (14)
were originally left `uncertain` ("No confident translation
identified") -- no confident guess could be made for these five. The
owner supplied direct translations (Lahyan = "Beard", traditional
Indian association "Eloquent One"; Ukla = "Bond / Knot / Closed Circle
/ Link"; Ankeesh = "Reversed / Inverted / Turned"; Uputul-Kharij =
"Outer Threshold", tracing the "Uputul" root to "Ataba" = threshold;
Uputul-Dakhil = "Inner Threshold" likewise), which `FigureNameGloss`
now records with a `source: "owner"` field (distinct from the
`confidence` tier) -- bumped to `high` confidence on that basis, same
standing as the item 3 troublesome-years table and the Dhruvank
Questions text elsewhere in this project (an owner-supplied
correction, not a re-derived guess). Both `FigureDetailPanel` and
`StihirKundaliTable` render an explicit "(owner-confirmed)" tag next to
these five instead of the blanket "(unverified etymology)" every other
entry still carries, so the UI doesn't misrepresent an owner-confirmed
translation as an unverified guess. This is a gloss-only correction --
`figures.ts`'s own sourced `sourceName` field (Uputul-Kharij /
Uputul-Dakhil, etc.) is untouched.

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

`searchHousesByQuestion()` is a separate multi-word function in the same
file, for the New Prediction page's natural-language search -- see "New
Prediction page additions" above for how it differs from `searchHouses()`.

## Reference tab (`reference/page.tsx`)

A single page with five internal tabs (`useState`, not separate routes)
-- **Stihir Kundali**, **Figures**, **Houses**, **Timings**, **Glossary**
-- consolidating this app's static reference material in one place.
First three (Stihir Kundali/Houses/Timings) per owner request
(2026-08-26, "Create reference tab move - Stihir Kundali (reference)
under it, second option can be houses and third timings chart"); Glossary
added the same day as a follow-up ("can you get the glossary under
Reference"); Figures added the same day too, from the "Not yet built"
list's "Figure reference pages" item ("add the figure reference pages"):

- **Stihir Kundali** tab renders `StihirKundaliTable` with no `chart`
  prop -- pure reference now, not cross-highlighted against a live
  prediction. It used to sit at the bottom of `new-prediction/page.tsx`
  (highlighting which of the 16 figures appeared in the *current*
  chart); that highlighting capability is now unused, moved away
  entirely per the explicit "move" instruction, not kept as a duplicate.
- **Figures** tab renders `FigureExplorer` -> `FigureDetailPanel`, the
  figure-side counterpart to House Explorer: a grid of all 16 canonical
  figures that, on click, shows one figure's full attributes (lord,
  type, nature, auspiciousness, raashi, gender, direction, element,
  Timings Number, meaning), plus the same unverified "English gloss"
  already shown in `StihirKundaliTable` (confidence-styled, reused from
  `figure-name-glosses.ts` rather than duplicated). Distinct from the
  Stihir Kundali tab's dense one-row-per-figure table -- same underlying
  data, different browsing shape (drill into one figure vs. scan all 16
  at once), same relationship House Explorer already has to the Houses
  data.
- **Houses** tab renders `HouseExplorer` (extracted from the former
  standalone `houses/page.tsx`, which is deleted -- `/houses` now
  404s). Pure composition, no new data or logic: a grid of the 12
  houses (id, figure name, theme) that, on click, renders the exact
  same `HouseDetailPanel` already used on New Prediction, so the two
  stay in sync automatically.
- **Timings** tab renders the new `TimingsChart` -- all 16 Timings
  blocks (`timings.ts`), each collapsed by default, expanding to a
  16-row Place/Years/Months/Days table. This data existed and was
  fully used by the Timing engine already; it just had no reference UI
  of its own before this.
- **Glossary** tab renders `GlossaryTable` (extracted from the former
  standalone `glossary/page.tsx`, which is deleted -- `/glossary` now
  404s, same treatment as Houses). A read-only table of `GLOSSARY`
  (`lib/data/glossary.ts`, 34 Hindi/Marathi-term-to-English-translation
  pairs), each with a bracketed Roman-script transliteration -- see
  "Glossary transliteration" above.

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

6. Sixth pass (2026-08-26, "can you make it in 3 columns"): the "By
   category" grid went from `sm:grid-cols-2` to `sm:grid-cols-3`
   directly (not a stepped `sm:...-2 lg:...-3`) -- there are 6
   categories, so 3 columns x 2 rows reads cleanly without an
   intermediate 2-column stop most viewports would only pass through
   briefly.

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

## Dhruvank Questions on House Detail (`HouseDetailPanel.tsx`)

**Partially unblocked 2026-08-26** -- previously fully out of scope (see
below for what's still deferred). Owner asked to review the `Dhruvank
Questions` sheet's house-wise questions and add them to House Detail;
after confirming there's no way to compute real answers from them (see
next paragraph), the owner asked for the question *text* to be shown as
reference bullets, which is what's implemented now: a new "Dhruvank
Questions" section (grey "Reference" badge, distinct from green
Direct/amber Interpretive) lists `QUESTION_MASTER` entries filtered by
`house === houseId`, text only.

**The `dhruvankRaw` numeric code (e.g. "2,5,2") is still never shown or
used anywhere.** Investigated directly in the source workbook before
deciding this (not assumed): the `Dhruvank Questions` sheet itself has no
formula or legend for what those three numbers mean, and the separate
"Dhruwank" sheet -- despite the similar name -- turned out to be a
generic tutorial walkthrough of the *same* main Prediction-sheet method
already implemented in this app (house + house-1 addition, Agam/Nirgam,
Sthan Bali, guards, a Day/Week/Month/Year table identical in structure to
Quick Duration's), not an explanation of the Dhruvank Questions triplets
specifically. So the numeric code stays undecoded and unused -- showing
it, or computing anything from it, would mean presenting a guess as a
real answer, which this project has consistently refused to do (see
items 16/26, and this same investigation when the owner asked "is it
possible to add these questions in judgement library" -- answer: not
without knowing what the numbers reference). `lib/data/questions.ts`'s
own header comment (do not hand-edit) still correctly describes
`dhruvankRaw` as `NEEDS_CONFIRMATION`, never read by any engine code.

Do not build a Dhruvank interpretation engine (Judgement Library rules,
computed answers, etc.) without the owner supplying the missing decoding
key first -- that part of the original deferral still stands.

## PDF/CSV export of a computed prediction (`lib/export.ts`, `new-prediction/page.tsx`)

Two buttons ("Download CSV" / "Export PDF") appear in the result section
once a prediction has been calculated, per the owner's queued 2026-08-27
enhancement list. Both export the same three things shown on-screen: the
16-place Prashna Kundali, the calculation trace, and all 42 Judgement
Library results (computed against the same chart/ctx, not re-drawn) --
plus a summary block (Mother Figures, house, type, Short Timing, gender,
status, timing).

**CSV** (`buildPredictionCsv` in `lib/export.ts`, RFC 4180-quoted, tested
in `lib/__tests__/export.test.ts`): one string, four blank-line-separated
sections (Summary / 16-place Prashna Kundali / Calculation Trace /
Judgement Library), downloaded via the same Blob + object-URL pattern
Nameology's bulk-check page already uses (`downloadTextFile`) -- no new
dependency. `CATEGORY_LABEL`/`CATEGORY_ORDER` were moved from
`JudgementResults.tsx` into `judgement.ts` so both the UI and the export
share one canonical category list instead of duplicating it.

**PDF** (`exportPdf` in `new-prediction/page.tsx`): no PDF library --
reuses the browser's own print-to-PDF (`window.print()`), since the
report is just the page's own already-rendered chart/trace/Judgement
Library content and adding a dependency (jsPDF, html2canvas) to
re-render the same thing as vector/canvas output would be pure
duplication for no benefit. `print:hidden` (Tailwind's built-in print
variant, no custom CSS needed beyond `@page { margin: 1.5cm }` in
`globals.css`) hides the Navbar, all input controls, toggle buttons, and
History Summary; a `hidden print:block` block shows a print-only report
header (generated timestamp + the input parameters, since the normal
input controls are hidden). Two things `exportPdf` must force before
printing, restored after: it expands Trace/Judgement Library (normally
collapsed toggles) and strips the `dark` class from `<html>` regardless
of current theme (dark-mode text on a printer's forced-white background
would be unreadable) -- **restoring both on the `afterprint` window
event, not after `window.print()` returns**, since `print()`'s return
isn't a reliable "dialog closed" signal in every browser; restoring on a
`setTimeout` after `print()` was tried first and verified (via Playwright
with `window.print` mocked as a no-op, which doesn't block) to
prematurely collapse the sections before the real dialog even had a
chance to render them.

Verified end-to-end with Playwright (not just unit tests): drove the
real UI (draw 2,8,4,9, house 7, Nirgam -- the same benchmark draw as
`benchmark.test.ts`), clicked Download CSV and confirmed the downloaded
file's content byte-matches the chart/trace already verified elsewhere,
then clicked Export PDF and screenshotted the page in `emulateMedia:
"print"` mode -- confirmed the Navbar/inputs/toggles are gone and the
chart, result figure, full trace, and all 42 Judgement Library rules
(across all 13 categories) render on one continuous printable page.

## Not yet built (see project plan for the full phased roadmap)

- Excel import/versioning/admin approval workflow (spec §18) -- v1 ships
  the workbook's data pre-extracted as static TS, not a runtime importer.
- Electron packaging -- **not a standalone Ramal wrapper.** Per owner
  decision (2026-08-26), Ramal will eventually be integrated into
  Nameology's existing Electron app (`Nameology/nameology-app`) as a
  separate tab there, rather than getting its own `electron/` +
  `electron-builder` setup. See Nameology's own
  `next.config.ts` (`output: 'export'`), `electron/main.js` (custom
  `app://` protocol + CSP injection), and `electron/preload.js` for how
  that shell already works -- whoever does the integration should reuse
  that shell rather than rebuilding it for Ramal.
## Dev commands

```bash
npm run dev      # Dev server at http://localhost:3001
npm run build    # Production build
npm run start    # Serve production build (also port 3001)
npm test         # Run all 100 Vitest tests
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
