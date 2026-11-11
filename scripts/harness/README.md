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

The Node suite covers packaging,
gameplay behavior, scoring fixtures, all six levels' legal winnability
corpus, Quick Challenges (cards, twists, and second-wave complications),
the cut floor, fallout piles, the mood machine, modal behavior,
terminology, budgets, and reports. Evidence-fitness regressions cover
exact sample, matching, retention, role, and goodwill boundaries;
high-rate wrong-population failures; below-benchmark usable evidence;
cross-instrument history; and an uninterrupted six-level campaign.
Use runner output for the current test count.

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
  - Full BriteVerify validation
  - Dedupe and suppression on
  - Generic Blast invitation
  - Zero reminders
  - Repair Q3 with its class-correct ANCHOR fix
  - Cut Q5, Q7, Q8, Q10, Q11, and Q12
  - Keep Q1, Q2, Q3, Q4, Q6, and Q9, the recorded full-population
    winning line (fixed winning cost 58 of 120, as recorded in
    `docs/development.md`)
- Launch is enabled, the launch countdown exposes the run controls,
  **Skip to Report** works, and the report contains a grade box and
  verdict.
- The scripted playthrough's verdict is `ROUND WON`.
- The simulation has one record per recipient, with more than 40
  weighted visual cohorts whose membership sums to the full population.
  Group-size badges and the animation summary distinguish these units.
- Live send/completion counters agree with individual event times,
  and the final report retains exact recipient totals without proxy units.
- The report contains all five independent evidence checks, each PASS
  for the recorded winner, and the FINISH-to-ACT processing stages.
- The publication result is ready with a context note disclosing
  simulation limits. Response is a benchmark, not the primary score.
- NEXT LEVEL retains the campaign audience history, with no overflow
  on the new instrument's setup.
- The complete journey ends with no console errors, page errors, or
  failed local requests recorded as evidence.

On a failed check, the suite saves a viewport screenshot under
`results/failures/` and names it for the viewport and check. Screenshots
are not taken for passing checks.

### Feature scenarios

The feature scenarios run once, at the mobile viewport:

- **Cut floor.** Every question, including core cards, can be cut until
  exactly one remains. The final CUT is disabled and grayscale, and a
  further click changes nothing. Restoring a question or adding one
  from the bank enables cutting again; a bank question receives the
  same protection when it becomes the last remaining item.
- **Quick Challenge pile, mood, and second wave.** The challenge seed
  comes from `randomSeedStr()`, which draws four hex digits from
  `Math.random`; it is the only `Math.random` consumer that affects the
  run setup (the others feed audio noise buffers and confetti). The
  scenario stubs `Math.random` to a constant 0.375, pinning seed
  `6666`. That seed was selected by replaying the game's own engine
  offline: for challenge 1 it draws the LIST REALITY complication, and
  the wave-2 run uses the true 9%-invalid list, mailed raw with no
  re-validation bought. It counts individual bounces, not avatars.
  The scenario asserts that the pile strip has five
  columns aligned under the funnel step labels (within 3px), that
  settled bounced figures accumulate in the strip (at least 4 visible),
  that weighted cohort figures persist late in the run while the
  BOUNCED label counts recipients and the envelope fan stays capped,
  and that the final report reads both waves together
  and names the raw wave 2 mailing.
- **Campaign BOUNCE-BACKS and agitation.** A separate Level 1 campaign run (Executive Blast
  segment, Generic Blast invitation, zero reminders, validation
  skipped, instrument as dealt) runs naturally at 2x speed. Its bounced
  recipient share must exceed the 10% agitation threshold, the manager
  must become agitated, and the run must produce a campaign report whose
  DELIVERABILITY AND DATA card carries a BOUNCE-BACKS section: a
  bounced total, simulated `.example` addresses, and a sample table
  with more than its header row. The Quick Challenge final report is a
  two-wave summary and does not carry this section; that is why the
  check lives on the campaign report. The 9%-invalid Quick Challenge
  list is below that mood threshold and is not an agitation assertion.
  Live observers parse comma-formatted recipient counts, not proxy units.

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

Puppeteer and a compatible Chromium browser are test tooling only. They are never game runtime
dependencies, and no package is added to the game for them. Resolution is
explicit: environment override first, then known locations.

The portable configuration is explicit:

- `PUPPETEER_MODULE`: absolute path to the installed package's entry file,
  not its directory. Both `puppeteer` and `puppeteer-core` must expose
  `launch()`.
- `PUPPETEER_EXECUTABLE_PATH`: absolute path to a compatible browser.

The code also probes historical Linux workspace installations, the
repository's optional `scripts/harness/node_modules/puppeteer` location,
and fixed Linux browser paths. These are compatibility fallbacks, not
automatic discovery of every user's browser cache. See
[`loadPuppeteer` and `findChrome`](browser-suite.mjs) for the actual list.
Fresh machines should set both overrides.

If Puppeteer or Chrome is unavailable, the browser section reports that
exact blocker rather than silently skipping the suite.

### What a fresh machine needs

Where package installation is permitted, provision a pinned Puppeteer
installation in a separate tools directory, not in this repository.
The historical Linux integration used Puppeteer 25.16.0; that receipt
does not establish that the current gameplay passed the browser suite.
For example:

```bash
mkdir -p ~/tools/surveyfunnel-harness
cd ~/tools/surveyfunnel-harness
npm init -y
npm install puppeteer@25.16.0
```

The full `puppeteer` package downloads a browser unless configured not
to. Resolve the module and its executable from the tools installation,
then set both overrides before running from the repository root.
`puppeteer-core` downloads no browser; provide a compatible executable.

### Windows with an existing approved installation

Adjust the external tools directory and executable to the installed
locations. This example assumes `puppeteer-core` is already available
there; `require.resolve` returns its actual entry file.

```powershell
Push-Location 'C:\test-tools\surveyfunnel-harness'
$env:PUPPETEER_MODULE = node -p "require.resolve('puppeteer-core')"
Pop-Location
$env:PUPPETEER_EXECUTABLE_PATH = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
node scripts\harness\run-all.mjs
node scripts\harness\self-test.mjs
```

Check browser/Puppeteer compatibility rather than assuming any installed
browser version will work. If installation is blocked by organizational
policy, use an approved test environment; do not change package-fetch or
security policy to make the harness run.

### Verification history

On 2026-11-01 the Windows build and Node sections passed, but the browser
section could not import Puppeteer and its external installation was
refused by package-fetch policy.
Integrated-browser checks separately passed the mobile and desktop
Level 1 journey, evidence scorecard, pipeline, next-instrument history,
and BRD focus behavior. Those checks were not a passing CLI harness result.

On 2026-11-02 the full local harness passed all three sections, including
the complete Node suite and the extended browser scenarios. Both negative
controls also passed. An existing approved Mermaid CLI installation supplied
Puppeteer 25.12.0, with installed Edge 156.0.4314.58 as the browser.
No package installation or policy change was required. The initial browser
run exposed an old 9%-invalid-list agitation expectation and an observer
that did not parse thousands separators; both harness assumptions were
corrected before the successful run. See the [changelog](../../CHANGELOG.md)
for exact totals and additional session-only player-acceptance checks.

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
