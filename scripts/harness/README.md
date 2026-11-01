# Dear Valued Customer - Browser Regression Harness

This directory is the tracked, canonical copy of the SurveyFunnel test
harness. It combines the repository's build validation and Node tests with
a real headless-Chrome regression suite.

The historical original lives outside the repository at
`~/workspace/test-harness-survey-funnel/`. Keep it as the record of how the
harness was first built and proven; make future harness changes here.

The harness does not change game source files. One integration note
matters: the repository's own `scripts/build-site.mjs` regenerates the
repository's ignored `dist/` directory, as it already does in normal
development and CI.

## Files

- `run-all.mjs` - the single entry point. It runs build validation, the
  existing Node suite, and the browser suite; writes a combined summary;
  and exits nonzero if any section fails.
- `browser-suite.mjs` - the headless-Chrome suite. It can also run alone.
- `self-test.mjs` - negative controls. It copies the game, deliberately
  breaks the copies, and proves that the browser suite catches the
  defects.
- `results/` - generated output. It is ignored by git. `run-all.mjs`
  replaces this directory on each full run.

## Run it

From the repository root:

```bash
node scripts/harness/run-all.mjs
```

Run the negative controls separately:

```bash
node scripts/harness/self-test.mjs
```

Use another checkout or a copied game tree with either the environment
variable or the command-line argument:

```bash
GAME_DIR=/path/to/SurveyFunnel node scripts/harness/run-all.mjs
node scripts/harness/run-all.mjs --game-dir /path/to/SurveyFunnel
```

When the harness lives at `scripts/harness/` inside the game repository,
its default game directory is the repository root two levels up, provided
that root contains `site/index.html`. `GAME_DIR` and `--game-dir` override
that detection.

The browser suite can skip the longer feature scenarios when a caller only
needs the core journeys:

```bash
node scripts/harness/browser-suite.mjs --no-scenarios
```

The self-test uses that flag for its negative controls.

## What `run-all.mjs` runs

### 1. Build validation

```bash
node <GAME_DIR>/scripts/build-site.mjs
```

This uses the game's validator and packager. It checks all inline scripts
and the five-file deployment package.

### 2. Existing Node suite

```bash
node --test \
  <GAME_DIR>/scripts/build-site.test.mjs \
  <GAME_DIR>/scripts/game-features.test.mjs
```

At integration time this suite contains 83 tests covering packaging,
gameplay behavior, scoring fixtures, all six levels' legal winnability
corpus, Quick Challenges (cards, twists, and second-wave complications),
the cut floor, fallout piles, the mood machine, modal behavior,
terminology, budgets, and reports.

### 3. Browser regression suite

The browser suite launches headless Chrome with Puppeteer and loads
`<GAME_DIR>/site/index.html` from `file://`. It runs the complete Level 1
journey at:

- `390x844` (mobile)
- `1280x800` (desktop)

For each viewport it asserts:

- The title screen loads with no console errors and no page errors.
- There is no horizontal document overflow on the title, setup, run, or
  report screens.
- The title screen's real **Play Selected Level** button opens setup.
- Setup Steps 1-4 and the question-card grid can be scrolled into view
  with the game's own layout.
- Every questionnaire `.qbtn` action is present, at least 40px high,
  level with the other buttons in its action row within 2px, and not
  clipped according to `scrollWidth <= clientWidth + 1` and
  `scrollHeight <= clientHeight + 1`.
- The escapes switch is at least 40px high and unclipped.
- Restore buttons created by cutting questions are at least 40px high and
  unclipped.
- The setup, run, and report manager nameplates exist, are visible, and
  read exactly `IM`.
- A deterministic Level 1 playthrough can be configured entirely through
  DOM clicks:
  - Fresh audience
  - Full BrightVerify validation
  - Dedupe and suppression on
  - Generic Blast invitation
  - Zero reminders
  - Repair Q3 with its class-correct ANCHOR fix
  - Cut Q5, Q7, Q8, Q10, Q11, and Q12
  - Keep Q1, Q2, Q3, Q4, Q6, and Q9, the legal post-cut-floor fixture
    line (fixed winning cost 58 of 120, as recorded in
    `docs/development.md`)
- Launch is enabled, the launch countdown exposes the run controls,
  **Skip to Report** works, and the report contains a grade box and
  verdict.
- The scripted playthrough's verdict is `ROUND WON`.
- The complete journey ends with no console errors, page errors, or
  failed local requests recorded as evidence.

On a failed check, the suite saves a viewport screenshot under
`results/failures/` and names it for the viewport and check. Screenshots
are not taken for passing checks.

### Feature scenarios

The feature scenarios run once, at the mobile viewport:

- **Cut floor.** Core questions render a locked, disabled CUT control.
  Cutting through the real buttons stops at exactly the six core
  questions of the fixed Level 1 instrument (Q1, Q2, Q3, Q4, Q6, Q9);
  no CUT button stays enabled, the floor note announces the locked
  minimum instrument, and clicking a locked CUT afterward changes
  nothing.
- **Quick Challenge pile, mood, and second wave.** The challenge seed
  comes from `randomSeedStr()`, which draws four hex digits from
  `Math.random`; it is the only `Math.random` consumer that affects the
  run setup (the others feed audio noise buffers and confetti). The
  scenario stubs `Math.random` to a constant 0.375, pinning seed
  `6666`. That seed was selected by replaying the game's own engine
  offline: for challenge 1 it draws the LIST REALITY complication, and
  under the intended instrument line the wave-2 run against the true
  9%-invalid list, mailed raw with no re-validation bought, bounces 5
  of the 40 sprites. The scenario asserts that the pile strip has five
  columns aligned under the funnel step labels (within 3px), that
  settled bounced figures accumulate in the strip (at least 4 visible),
  that they persist late in the run and match the BOUNCED count and the
  envelope fan, that the manager figure carries the agitated class
  during the run, and that the final report reads both waves together
  and names the raw wave 2 mailing.
- **Campaign BOUNCE-BACKS.** A separate Level 1 campaign run (Stale
  segment, Generic Blast invitation, zero reminders, validation
  skipped, instrument as dealt; the engine replay of that configuration
  bounces 6 of 40 sprites) must produce a campaign report whose
  DELIVERABILITY AND DATA card carries a BOUNCE-BACKS section: a
  bounced total, simulated `.example` addresses, and a sample table
  with more than its header row. The Quick Challenge final report is a
  two-wave summary and does not carry this section; that is why the
  check lives on the campaign report.

## Results

A full run writes:

- `results/results.json` - combined section results, source hashes
  before and after the run, browser totals, failed browser checks, and
  output tails.
- `results/browser-results.json` - every browser check, including
  evidence and screenshot paths for failures.
- `results/failures/*.png` - failure screenshots only.

The source hashes matter when `site/index.html` is being edited
concurrently: if the before/after SHA-256 values differ, the results
describe the states the individual sections encountered during that run
and should be re-run after the edit settles.

## Browser and Puppeteer provisioning

Puppeteer and Chrome are test tooling only. They are never game runtime
dependencies, and no package is added to the game for them. Resolution is
explicit: environment override first, then known locations.

The browser suite resolves the Puppeteer module in this order:

1. `PUPPETEER_MODULE`, if set.
2. The TDD workspace's existing Puppeteer installation
   (`~/workspace/tdd-2e-build/root2/applied-ai/defensible-decision-2e/node_modules/puppeteer`).
3. `~/workspace/le-2e/node_modules/puppeteer`, if present.
4. `scripts/harness/node_modules/puppeteer`, if later installed there.

Chrome discovery uses, in order:

1. `PUPPETEER_EXECUTABLE_PATH`, if set.
2. The Puppeteer cache's Chrome 149 build
   (`~/.cache/puppeteer/chrome/linux-149.0.7827.22/chrome-linux64/chrome`).
3. The Puppeteer cache's Chrome 155 build
   (`~/.cache/puppeteer/chrome/linux-155.0.8059.79/chrome-linux64/chrome`).
4. `/opt/meta-chromium/chrome`.

Overrides look like this:

```bash
PUPPETEER_MODULE=/path/to/node_modules/puppeteer/lib/puppeteer/puppeteer.js \
PUPPETEER_EXECUTABLE_PATH=/path/to/chrome \
node scripts/harness/run-all.mjs
```

If Puppeteer or Chrome is unavailable, the browser section reports that
exact blocker rather than silently skipping the suite.

### What a fresh machine needs

Install Puppeteer into a separate, pinned tools directory (not into this
repository) and point the harness at it. The version observed working in
this environment on 2026-11-01 is Puppeteer 25.16.0, with Puppeteer
Chrome cache builds `linux-149.0.7827.22` and `linux-155.0.8059.79`
present:

```bash
mkdir -p ~/tools/surveyfunnel-harness
cd ~/tools/surveyfunnel-harness
npm init -y
npm install puppeteer@25.16.0
```

Installing the full `puppeteer` package also downloads a Chrome build
into `~/.cache/puppeteer/`, which the harness then finds on its own. Run
from the repository root with the module override:

```bash
PUPPETEER_MODULE=$HOME/tools/surveyfunnel-harness/node_modules/puppeteer/lib/puppeteer/puppeteer.js \
node scripts/harness/run-all.mjs
```

If you install `puppeteer-core` instead, it downloads no browser: also
set `PUPPETEER_EXECUTABLE_PATH` to a Chrome or Chromium executable you
provide.

## Negative controls: proving failures are real

Run:

```bash
node scripts/harness/self-test.mjs
```

The self-test makes two disposable copies of the game under
`results/self-test/`:

1. `horizontal-overflow` adds a 2000px-wide element to the copied page.
2. `page-error` adds a script that throws
   `HARNESS_DELIBERATE_PAGE_ERROR`.

For each copy it runs the browser suite at `390x844` with
`--no-scenarios`. The self-test passes only when:

- the child browser suite exits nonzero; and
- its JSON contains the expected failed overflow or error check.

It writes `results/self-test/self-test-results.json` plus each broken
copy's browser results and screenshots. This distinguishes a real game
failure from a harness that merely reports success or fails for the
wrong reason.

## Scope and limits

- The browser journey automates Level 1 end to end, plus the feature
  scenarios above. The existing Node suite covers the six-level scoring
  fixtures and the other gameplay systems.
- The suite checks rendered layout and event wiring in Chrome. It does
  not replace physical-phone, iOS Safari, Android Chrome, screen-reader,
  or human WebAudio checks.
- Audio is exercised only insofar as normal clicks initialize it without
  page errors. The harness cannot judge whether music or effects sound
  good.
- Apart from the pinned `Math.random` stub in the Quick Challenge
  scenario, the suite uses the game's visible controls. It does not call
  internal game functions to configure a playthrough.
