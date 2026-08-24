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
    page.tsx                 -- Home page, recent predictions
    new-prediction/page.tsx  -- Draw figures, ask question, calculate, view trace
    judgement/page.tsx        -- Judgement Library: 39 PDF rules computed live
    layout.tsx                -- Root layout, dark mode init
  components/
    layout/Navbar.tsx
    FigureGlyph.tsx           -- Renders a 4-symbol pattern as bindu/rekha marks
    RecentPredictions.tsx
  lib/
    engines/
      figure.ts                -- addBit/addFigure (4-symbol XOR-style addition)
      kundali.ts                -- 16-place construction + validation guards
      prediction.ts             -- House-5 exception, Sthan Bali, Agam/Nirgam judgement
      timing.ts                 -- Timing lookup + 30-day/12-month normalization
      predict.ts                -- Orchestrates the full pipeline + calculation trace
      judgement.ts              -- The 42-rule practical judgement library (PDF-sourced)
      __tests__/                -- 70 Vitest tests: exhaustive combinations,
                                    a real cell-verified workbook benchmark, guards,
                                    the judgement rule registry
    data/
      figures.ts, houses.ts, timings.ts, questions.ts, glossary.ts
      -- all generated from Ramal Calculation.xlsx by scripts still in
         /private/tmp .../scratchpad/extract.py during this build; re-run
         extraction against a fresh workbook export by adapting that script
         (not yet wired into `npm run extract-data`).
      judgement-reference.ts   -- Abjad order + age table for the judgement library
                                   (authority: Ramal-jyotish.pdf, not the workbook)
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
exactly between the two independent implementations. Zero mismatches.**
`figures.ts` and `timings.ts` were separately cross-checked against a
fresh independent read of the workbook too (both PASS, all 16
figures/blocks match byte-for-byte). Re-run this after any change to
`kundali.ts`, `prediction.ts`, or `timing.ts` -- it takes about 15 seconds
and it's the strongest correctness signal in the repo, stronger than the
hand-picked benchmark test alone.

## Judgement Library (39 rules, `Ramal-jyotish.pdf` "फलादेश"/"प्रगत रमल")

Authority here is the PDF (conceptual/source material per master spec §2),
not the workbook -- unlike everything else in this app. Every rule was
re-transcribed from the source pages a second time (not just the first
orientation pass) before being encoded, and each carries a `sourceStatus`
(`SOURCE_DIRECT` / `SOURCE_DERIVED`) per the master spec's own Appendix C
provenance model.

**All 39 shipped rules are computed live** against a chart built from four
drawn Mother Figures, using shared primitives (`isDakhilOrSabit`,
`isKharijOrMunqalib`, `isShubh`, house merges via `addFigure`) plus a few
bespoke algorithms:

- **Item 1** (जातक की मनचिंता -- what is the querent really worried about)
  traces Place 15's first revealed tattva back through the construction
  chain to a witness place, then reads that place's own Sthir Kundali
  identity. Verified against the source's own worked example (15 -> 14 ->
  11 -> 5, landing on Sthir house 8).
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
  were deliberately not transcribed -- same glyph-legibility risk as the
  three removed items below): it states in words that the chart stabilizes
  at iteration 4 with quality शुभ/Auspicious, matching this engine's
  `i === 4` bucket exactly.

**Items 3, 16, and 26 were removed entirely**, by explicit owner decision
(2026-08-24): none of the three has an Excel counterpart to verify
against, and per the owner's standing rule that verified Excel data is the
final authority, unverifiable PDF-only content doesn't ship rather than
staying half-implemented. What blocked each, for whoever revisits this:

- **Item 3** (difficult years) groups figures using hand-drawn symbols
  rendered in a compressed 2-row inline notation (unlike the rest of the
  document's full 4-row blocks) -- only one figure (Tariq, the all-dot
  pattern) was legible with confidence. The age-lists themselves *were*
  legible: `[8,12,16,24,32,42,58,62,66,74,82]` /
  `[12,16,24,28,32,42,64,66,68,70,84]` / `[12,20,23,27,28,36,45,60,71,80]` /
  `[14,16,28,20,22,27,34,39,64,66,69,70,82]` /
  `[6,14,18,20,22,26,34,44,56,64,69,70,72,77]` -- if these ever get a
  figure-name mapping from the owner, re-adding this rule is straightforward.
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
npm run dev      # Dev server at http://localhost:3000
npm run build    # Production build
npm run start    # Serve production build
npm test         # Run all 70 Vitest tests
npm run test:watch
npm run validate:oracle  # Independent Excel-formula cross-check, all 1,572,864 cases (~15s)
```
