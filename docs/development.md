# Development Notes

## Shape of the build

The game is one HTML file (`site/index.html`) with inline CSS and
JavaScript and WebAudio generated sound. There is no framework, no
bundler, and no server. That is a deployment decision, not an
oversight: the game can be hosted statically or opened from disk.
The title font is bundled in `assets/`; keep it alongside `site/`
for offline play. The game sends no survey data.

Gameplay, packaging, and syntax checks use Node without npm dependencies:
`node --test scripts/build-site.test.mjs scripts/game-features.test.mjs`.
The package contains only the
game, static-host configuration, font, license, and mobile QR code. See
[deployment guidance](deployment.md) for CI/CD and live verification.

## Regression harness

The tracked browser regression harness lives in `scripts/harness/` (the
external copy at `~/workspace/test-harness-survey-funnel/` is the
historical original). Run the full harness from the repository root:

```bash
node scripts/harness/run-all.mjs
```

It runs three sections in order: the build validation above, the Node
suite, and a headless-Chrome browser suite. The browser suite
drives the real game at 390x844 and 1280x800: the title, setup, run, and
report screens with no console or page errors and no horizontal
overflow, questionnaire button geometry, the manager nameplate, and a
scripted legal Level 1 playthrough that wins. Feature scenarios at the
mobile viewport cover the one-question floor (all questions can be cut
until the final CUT becomes gray and disabled, with restore/bank recovery), the Quick Challenge second
wave against the revealed stale list (pile strip columns aligned under
the funnel steps, settled bounced figures accumulating and persisting),
and a raw Executive Blast that crosses the recipient-based 10% bounce
threshold, agitates the manager, finishes naturally, and renders the
campaign report's BOUNCE-BACKS section. Observers parse comma-formatted
individual counts. Negative
controls are separate:

```bash
node scripts/harness/self-test.mjs
```

The standard Level 1 journeys also assert all five evidence checks,
the FINISH-to-ACT pipeline, the publication/context note, diagnostic
response benchmark, and audience history on the next instrument.
These assertions are tracked in the harness, not substitutes for the
Node tests of gate boundaries and a continuous six-level campaign.

The self-test copies the game, deliberately breaks the copies (a
2000px-wide overflow element and a throwing script), and passes only if
the browser suite catches each defect with the expected failed check.

Puppeteer and a compatible Chromium browser are test tooling only,
never game dependencies. The [harness guide](../scripts/harness/README.md)
owns provisioning, Windows commands, environment overrides, and exact
coverage. Fresh machines should provide explicit module and executable
paths rather than rely on historical Linux discovery locations.
Results and failure screenshots land in the ignored
`scripts/harness/results/` directory. Missing or policy-blocked tooling
is a failed/blocked browser section, not a skip or a pass; see the
[changelog](../CHANGELOG.md) for dated verification.

Campaign state lives in page memory and resets on reload. Sound and
hint preferences are saved in local storage; the game does not use
cookies or store survey responses.

## The simulation model

Deterministic by design. Given the same instrument, choices, and
starting state, a round replays to the same funnel. Credits, goodwill,
reputation, and owned preparation change on retry, so a retry is not
the same starting state.

### Population and animation contracts

`buildRun()` generates `run.respondents`: one record per member of the
selected segment, including recipients stopped before sending by the
breaker. `tally`, evidence processing, A/B/language reports, and portfolio
response totals read these records. There is no `n / 40` result multiplier.
Population sizes must be positive integers.

`run.sprites` is a separate display model. `groupRespondents()` groups
matching personas, A/B arms, outcomes, drop causes/questions, reminder
routes, and visible quality/behavior cues. Latent response flags stay
in the individual records rather than multiplying otherwise identical
visual groups. Large cohorts split at
`ceil(population / targetUnits)`, with a default target of 160; this is
not a hard group limit. Behavioral diversity can produce more groups.
Each cohort lists its members and count and animates a median member's
example trajectory. Every recipient belongs to exactly one cohort.
Unsent cohorts do not enter the track.

The `×N` badge is a cohort size, not a statistical expansion factor.
Changing the display target must not change respondent data, outcomes,
sample size, quality, Insight, or verdict. Cohort motion is illustrative;
it is not the event time of every member. Pixel art reuses a cached
inline SVG image per persona color rather than one DOM element per
pixel, so larger cohort counts do not multiply pixel-node layout work.
No new runtime dependency or hosted image asset is needed.

`buildProgressTimeline()` sorts individual statistical events into
cumulative snapshots. `populationProgress()` reads the exact state at a
virtual time; live completion, send, guess, bounce, and unopened counters
do not depend on visual arrivals. Skip/report uses the final snapshot.
The breaker removes events after its cutoff before either model is built.
Mood thresholds use recipient rates, not fixed counts of rendered sprites.
Percentages display up to three decimals; verdicts use unrounded ratios.

Per round, the model runs in this order:

1. **Delivery.** The campaign invalid rate is derived, never stored:
   each segment carries a Bronze intake mix of five record classes
   (same-system duplicates, second-source duplicates, fixable broken,
   unfixable broken, stale), jittered deterministically per level and
   instrument seed. Silver work removes classes (DEDUPE merges
   same-system duplicates, CONSOLIDATE merges second-source
   duplicates, REPAIR fixes fixable addresses and quarantines the
   unfixable); the derived rate is stale plus unrepaired broken,
   divided by the promoted share. Validation then reduces that rate
   (full removes 85% of invalids, partial 55%, with a modeled
   unverifiable remainder). Remainder splits into hard
   and soft bounces. Hard bounce rate drives Sender Reputation.
   Quick Challenges keep the provided-list rate instead (the stored
   segment rate, or the revealed true rate after a LIST REALITY
   complication).
2. **Opens.** Base open propensity by segment relevance and invite
   variant, adjusted by reputation (spam folder effect), sender,
   why me line, and language match.
3. **Starts.** Click-to-start conversion is fixed per invitation
   variant. The stated time ask is enforced on the Honest Ask
   through goodwill and quality instead: overrun its 5-minute
   promise and the send spends 3 goodwill and loses 2 quality
   points per minute over (rounded up); hit it and the send earns
   the invitation's goodwill.
4. **Completions.** Each recipient follows their persona through the instrument against two
   clocks: patience (minutes) and knowledge (per question tags).
   Outcomes per question: continue, abandon, escape (if escapes are
   on), or guess. Late survey effects add speeders and straight
   liners; duplicates still unmerged after Silver work add duplicate
   envelopes and duplicate responses, scaled by the remaining
   duplicate share of the intake; open rates can add a
   forwarded response share.
5. **Goodwill and budget.** Spends and earns use `goodwillMath()` and
   the current [player guide](player-guide.md). If goodwill reaches zero, the breaker
   stops new invitations and ends the run for anyone still in the
   funnel. Only completions before the trip count.
6. **Evidence processing.** After FINISH, remove duplicate, junk, speeder,
   and straight-lined completions in that order, counting each
   rejection once. Guessed completions stay in the usable base (real
   cleaning cannot detect a guess) and are counted on the evidence
   object as `containedGuesses` for the report. MATCH then excludes forwarded responses, whose invited
   account is unknown. Non-forwarded completions receive synthetic account
   identifiers; this is a teaching model, not an external account lookup.
   Recompute Insight using the matched records, so rejected roles cannot
   earn credit.
7. **Scoring and action.** `evaluateEvidence` returns five independent
   checks: funnel execution, evidence fitness, data integrity, audience
   sustainability, and operational trust. The campaign wins only if every
   check passes. The report follows CLEAN, MATCH, INTERPRET, PUBLISH,
   and ACT; failures withhold publication and name corrective actions.
   Passing reports disclose their baseline and simulation limits.

## Evidence fitness and audience continuity

`evidenceMission()` defines each mission's required audience pool,
minimum usable sample, and role shares. Mission minima are 750, 1,000,
1,000, 675, 900, and 1,500 simulated responses for Levels 1-6.
Levels 1-4 require the Support pool, Level 5 Global, and Level 6
Leadership. Levels 1, 2, and 5 require technicians and end users each at 10%+
of the usable base; Level 3 requires people who run workloads (IT
decision makers or frontline technicians) together at 30%+; Level 4
requires decision makers (executives or IT decision makers) together
at 15%+; the finale requires executives and IT decision makers
together at 50%+. Each required group needs at least one respondent.
Level 1 also enforces its BRD eligibility window (the list's timing
must fall within 30 days of the triggering event, read from the
segment's `touchDays` against the survey record's `eligibilityDays`),
and Level 5 requires every language group present in the usable base
at 5%+. Operational trust additionally fails when any opted-out or
recently surveyed person was mailed (suppression off), and requires
every required topic ANSWERED CREDIBLY, not merely scored. The
suppression scrub removes its records before the send (fate
`suppressed`, counted in the tally, excluded from sent). The Honest
Ask time promise is player-set (3, 5, 8, or 10 minutes, default 5)
via `state.promiseMinutes`, read through `effectivePromise()`; the
Known Name goodwill earn requires a prior contact in the audience
portfolio.
Account matching must retain at least 80% of cleaned completions.

Quality must be 60+. `qualityAssessment()` uses the guessed-completion
rate per invited recipient with weight 160, and the duplicate-completion
rate with weight 120, rounded to points. These preserve per-capita game
calibration without making larger populations automatically fail.
Other respondent-quality deductions remain completion-share based;
instrument deductions, including 10 per missing core item, are unchanged.
At least 60% of completions must survive cleaning; excluding damaged
responses does not erase the quality penalties. Usable Insight must
be 60+ (70+ in the finale). Validation and dedupe are operational
requirements; a Global audience also requires localization review and
a localized invitation. The breaker must hold. Goodwill must remain
above zero, or at least 35 in Level 4. Response rate is diagnostic,
never a campaign win gate. Winning grades use the weakest of quality,
usable Insight, and cleaning retention rather than averaging rate.

`state.audiencePortfolio` records health, sends, instruments, suppression
overrides, and completed individual-response totals by role. Fresh, Stale,
and Tired share Support; Global and Executive Blast are separate pools.
This models cohort exposure, not individual repeat respondents, account
hierarchies, or overlapping membership between pools. All records are
synthetic page-memory state. A new level or instrument retains them;
`resetCampaignNewGame()` and page reload clear them. Quick Challenges
neither read nor modify the campaign portfolio.

The next instrument starts from the lower of its segment's baseline
and the pool's saved health, minus contact fatigue: one per previous
send with suppression, two without, capped at eight. A retry instead
keeps the existing four-point fatigue charge. Recontacting a pool
without suppression fails sustainability. Health scales campaign open
propensity by `clamp(start / segmentBaseline, 0.5, 1)` without reseeding
the RNG. Only report finalization records a send; previews and repeated
report calls do not consume audience health.

These are explicit game rules. Counts are individual simulated records,
not extrapolations from avatars or empirical observations; passing the thresholds does
not establish statistical adequacy, population representativeness,
privacy compliance, or construct validity. Detailed governance and
compliance gates remain separate roadmap work in `TODO.md`.

## Balance invariants (test these after any tuning)

1. The default Level 1 full-audience run remains below its response
   benchmark and fails evidence acceptance. Do not preserve a lucky
   forty-person draw as the balancing target.
2. The recorded fixed Level 1 strategy passes every evidence check
   within its initial budget, through the real card handlers.
3. Unprepared Executive Blast loses, with expensive sends, hard bounces,
   and goodwill loss. It is not uniformly worst on every score.
4. A one-question instrument is reachable and can launch in either mode.
   The final CUT is gray and disabled; restoring or adding a question
   enables cuts again. Missing core and BRD coverage still penalizes
   quality/Insight, and unmet mandatory requirements prevent a challenge
   win. Both the cut action and launch path refuse an empty instrument.
5. Validation alone, bad questionnaire kept: still loses.
6. Identical choices replay identically.

## Initial-budget winnability and difficulty

The regression suite launches and scores 364 UI-legal winning setups
through the actual game. Fixtures are in
[`scripts/fixtures/winning-setups.json`](../scripts/fixtures/winning-setups.json).
Levels 1, 2, 3, 5, and 6 each supply the fixed instrument plus all 64
seeded draws (`0000` through `003F`); Level 4 supplies 39 lines (the
fixed start plus 38 draws), because its goodwill gate rejected the
remaining draws in the searched space. Each setup starts at attempt 1
with zero previous spend, uses only dealt cards and the level's
available bank, respects the one-question floor, and must pass all
scoring gates within the initial budget. Core cuts are permitted and
retain their quality deduction; the fixture records the actual kept set. The
test applies each setup through the game's own card handlers (repairs
via the fix button, cuts via `applyCut`), never by writing question
state directly, so the corpus proves the scoring engine rewards states
a player can actually reach. Level 4 uses the intended Tired audience,
not a swap to avoid the goodwill constraint; Level 6 uses Executive
Blast.

| Level | Difficulty | Fixed winning cost | Highest winning cost in checked draws | Initial pool |
| --- | --- | --- | --- | --- |
| 1 - First Send | Easy | 58 | 93 | 120 |
| 2 - The Split | Easy | 67 | 93 | 120 |
| 3 - The Stakeholder | Medium | 69 | 89 | 120 |
| 4 - The Tired List | Hard | 76 | 82 | 120 |
| 5 - Global Fieldwork | Medium | 70 | 106 | 120 |
| 6 - The Big Quarter | Hard | 98 | 120 | 150 |

These are verified strategies, not global minimum costs. The corpus
was regenerated under the full-population evidence checks without dropping any of the
364 previously sampled instruments. Repairs, kept sets, bank additions,
invitations, reminders, and DK/NA were searched again. The corpus was
regenerated again on 2026-11-10 under the medallion derived-rate
model (fixtures now also record the CONSOLIDATE and REPAIR Silver
purchases): the same 364 instruments, fixed and highest winning costs
unchanged on every level, with 14 setups absorbing added Silver work
(mostly CONSOLIDATE at 4 cr) to stay legal winners. Every witness is
replayed through the card handlers, `startRun()`, and `showReport()`,
with exact assertions for cost, individual sends/completions, rate,
quality, usable Insight, usable sample, goodwill, and every gate. Independent witnesses start with an
empty portfolio; a separate uninterrupted six-level test preserves it.
The continuous Level 4 line uses Honest Ask and one reminder rather
than weakening its 35-goodwill rule. Strategies may trade a core-cut
quality penalty for other useful coverage; core cuts are not forbidden. The current
floor is one question in both modes; budgets and study objectives remain
unchanged.

Difficulty describes decision complexity: introductory levers and optional
A/B comparison are Easy; added burden or multilingual fieldwork is Medium;
low starting goodwill or Executive Blast plus the higher Insight gate is
Hard. Labels appear in level cards, HUD, campaign summary, and BRD.
They are not selectable modes or promises that untouched defaults win.
The seed sample is not an exhaustive guarantee over the random generator.

Response rate is completes/sent, including bounced invitations, not an
AAPOR response rate. Quality and Insight are teaching-game indices.
DK/NA represents item nonresponse, not proof of clean or valid data.
The A/B verdict changes feedback only, not scores. Declaring a
winner against a TOO CLOSE TO CALL verdict sets the campaign flag
`abDeclaredClose`: the next stakeholder debrief names it once
(`abCloseNamed`), the ACT step of that report recommends
re-running the split at adequate size, and the season grade names
it for the rest of the campaign. Both flags clear only on a full
campaign reset. The report's scorecard export
(`scorecardText`) renders the mission, the five checks, the BRD
acceptance rows, the AAPOR dispositions, and the context note as
Markdown from the same row and data builders the HTML cards use
(`brdAcceptanceRows`, `dispositionData`, `contextNoteText`), so
the file and the page cannot drift.

## Tuning

Start with the data tables in `site/index.html` and the mission rules
in `evidenceMission()`. Some simulation and acceptance constants remain
inside their calculation helpers; keep the player guide, BRD, HUD,
report, and tests aligned when changing them. After tuning, replay
the invariants and recorded winners, the continuous campaign, and the
applicable browser journeys. Record actual verification in `CHANGELOG.md`.

## Quick Challenge and feedback

Quick Challenge supplies three fixed defective BRD cards plus three
curated non-core extras, the Fresh audience, full validation, dedupe,
suppression, and Honest Ask with no reminders. Its 48-credit budget
(`QUICK_BUDGET`) covers the send (30), invitation (4), all three BRD
repairs (6), and the priciest intended extras line (6), with 2 credits
of headroom; cutting every extra instead totals 43. A win requires all
three BRD repairs, every extra resolved by repair or cut, plus the
drill-specific response, quality, and Insight gates, not the campaign
evidence checks. The challenge floor is one question, just like the
campaign. Core and required cards may be cut, but their acceptance
requirements remain. Unique topics of the three BRD cards form its agenda; the
extras are scope creep and never carry agenda topics.

Each scenario has a curated deterministic seed (`QC01`, `QC02`, `QC03`).
Tests require both winning lines per scenario (resolve the extras, or
cut them all) to win within budget through the card handlers, and
prevent wins for unrepaired BRD cards or unresolved extras. Retry starts fresh. A saved
campaign state is restored on exit; Quick reports bypass campaign awards,
attempt history, and carried credits, goodwill, and reputation.

Stage 2 adds a BRD variation pack: each challenge carries three
`variants` (twists) in `QUICK_CHALLENGES`, and `startQuickChallenge`
draws one per run from the run seed via `quickVariantIndex`, the same
`hashStr` + `mulberry` machinery as the instrument draw
(`"qcvar|<index>|<seed>"`). The same seed always deals the same
brief; an omitted seed draws a fresh one with `randomSeedStr()`. The
seed and variant index live on `state.quickChallenge`; `quickVariant()`
resolves the active twist. The twist never reseeds the run simulation
(`instrumentSeed` is unchanged), so every stage-1 line keeps its exact
scores; it only tightens acceptance:

- `mandatory` (one extra id): the card renders a BRD REQUIRED tag.
  Its cut is permitted above the one-question floor, but
  `quickExtraResolved` accepts only `simplify` for it and
  `quickVariantCheck` marks a cut NOT MET.
- `ratebar` (a target above 0.12): `curLevel()` returns the raised
  target, so the HUD, the BRD acceptance line, and the verdict all
  read the same bar. Percentages print through `targetPct`, which
  keeps one decimal (17.5%).
- `qualitygate` (95): `quickQualityGate()` feeds the verdict, the
  HUD gates line, and the BRD acceptance line; it is 60 everywhere
  outside a qualitygate twist, campaign included.
- `timecap` (minutes): the verdict requires
  `estMinutes() <= maxMinutes` at report time, the engine's own
  length model (repaired times, splits included).

`showReport`'s Quick Challenge branch computes its verdict from the
effective bars plus `quickVariantCheck(rate, quality).met`, and
`showQuickReport` prints a BRD twist line (name, acceptance, MET or
NOT MET, and the measured detail) next to the repairs and extras
lines. Every variant has a full-population winning line inside the
unchanged 48-credit budget. Rate/quality negative cases construct
individual records at the strict rate boundary or below the audit
gate, rather than depending on random flags in a forty-person draw.
Time-ceiling negatives still use the actual instrument length.
Tests pin twists by scanning the
deterministic seeds (`startQCWithVariant`), assert the sweep reaches
all three variants per challenge, and assert the campaign BRD, gate,
and floor carry no twist after leaving a challenge.

Stage 3 adds the second wave: a complication round after the wave 1
report. `quickComplicationDraw` draws from the run seed with the same
machinery (`"qccomp|<index>|<seed>"`): about one run in four draws
nothing; the rest draw one of three flavors (LIST REALITY, THE LATE
QUESTION, SECOND PUSH). The draw lives on `state.quickChallenge`
(`comp`, plus `wave`, `wave1`, `lateQid`, `compChoice` once played).
Declining (`declineQuickComplication`) is free and leaves the wave 1
report final. Accepting (`acceptQuickComplication`) freezes the pool
at wave 1's launched configuration (baseline = the launched
snapshot, `spentBefore` = wave 1's cost minus `QUICK_BASE_COST`), so
wave 2 re-uses the batch already bought and `budgetMath` charges
only wave 2's own actions (new edits, validation, reminder waves)
under the same `BUDGET_TOTAL` guard; wave 1's ending goodwill and
reputation carry, and `attempt` becomes 2 (re-send fatigue applies).

- LIST REALITY: the segment is swapped for a clone at the true 9%
  invalid rate (`QUICK_TRUE_INVALID`) and the provided validation is
  voided (state and baseline reset to `skip`), so wave 2 buys its
  own tier at book prices against the real list. Segment cards lock
  for all of wave 2: the wave mails the wave 1 list as it stands.
- THE LATE QUESTION: one defective bank card from `QUICK_LATE_POOL`
  (rotating named sources: Legal, the sponsor, Support leadership,
  Compliance; never a card the challenge already dealt) is appended
  to the instrument. Cutting it is permitted above the one-question
  floor, but the final structural acceptance check requires it to be
  fielded, repaired or as written. The report explicitly marks a cut
  required late item NOT MET. It remains outside `quickScoredExtras`;
  repairs are optional, but omission is not a successful response to
  the request.
- SECOND PUSH: accepting presets `state.reminders = 1` (8 cr, −5
  goodwill, the book's reminder-wave constants); a second wave can
  be added in the invitation step. If the pool cannot fund the first
  wave, the card says so and accept refuses.

Wave 2 is a genuine second `buildRun` under the updated
configuration (its `choiceKey` differs through the changed levers).
`showReport`'s challenge branch records wave 1 (rate, quality,
Insight, verdict, cost, tally counts) and, on the wave 2 report,
computes the final verdict: the combined rate (both waves'
completions over both waves' sends) against the effective target,
wave 2's quality and Insight against their gates, and the
structural rules plus `quickVariantCheck(combRate, quality)`
against the final instrument. `showQuickFinalReport` prints wave 1,
the complication and the choice made, wave 2, and the combined
line. Balance follows from the stage-1 arithmetic (a complete
instrument costs at least 43 of the 48) plus wave 2's invite line:
tests prove a rescuing line per flavor inside the pool, a losing
line per flavor, the audit-bar win flipped by a carried late card
and held by its repair, and the unfunded-push refusal.

Respondent reactions read existing events and question IDs. They draw no
random numbers and change no simulation outcome. The live bubble is paced
at most once per 2.5 seconds; report samples contain at most four distinct
reactions. Delivery failures have no respondent voice.

Stakeholder choices share the existing cost, minute, and goodwill values.
Forecasts use the same baseline-aware budget and goodwill calculations as
the actual choice, including Honest Ask time-promise penalties. Extras
remain modeled burden, not new cards or scored agenda topics.

`scripts/game-features.test.mjs` executes the first two inline scripts in
a Node VM with a minimal DOM facade. It checks game behavior, not rendered
layout, synthesized audio, or browser accessibility. The tracked browser
harness (see Regression harness above) defines rendered layout and
event-wiring checks in headless Chromium. Coverage must be distinguished
from a successful run on the current source; missing tooling can block it.
Manual checks also remain necessary for physical phones, iOS Safari,
Android Chrome, screen readers, cold-player comprehension, and audio.

The setup BRD dialog derives study topics and required personas from
`agendaTopics()` and `TOPIC_KEYS`, and acceptance gates from `curLevel()`
and `insightGate()`, with campaign sample, pool, and role requirements
from `evidenceMission()` aligned to `evaluateEvidence()`.
It includes level constraints and the Quick Challenge
repair requirement without modifying campaign or setup state. Keep its
criteria aligned with scoring when adding or changing a level.

BRD entry points are the top-bar `? BRD`, the setup-top `? BRD`, the
level banner's own-BRD link, and the agenda panel's `? BRD`. They call
`openBRD(openerId)` with their own id so modal focus returns to the
control the player used.

MPOR and BRD share modal focus management: background controls are inert,
Tab and Shift-Tab stay inside the active dialog, Escape closes it, and
closing restores focus to the opener. Browser checks remain necessary
because the Node DOM facade does not emulate keyboard navigation.

Budget-recovery controls allow equal-cost or cheaper choices while a
retry is over budget. Cost increases beyond the pool remain blocked;
owned preparation and the attempt-chain audience lock remain enforced.
Affordability and warning text refresh after other controls change costs.
Retry requires the locked audience's batch cost (45 for Executive Blast),
not an assumed 30-credit minimum. Winning reports always offer navigation.

## Mobile QR

The title-screen portal uses `assets/play-mobile-qr.svg`, linking to the
production hostname. It is a static QR with H error correction, a
four-module quiet zone, and dark modules on a light background. The arcade
frame sits outside the QR. It defaults to a 49px icon; clicking expands
the full 196px QR panel, and clicking again collapses it. Both sizes use
an integer module scale. Scan the expanded version. Regenerate the QR
if the production URL changes.

The portal appears left of the title on desktop and below it on narrow
screens. Generation used the local Python `qrcode` library; independent
decoding uses `zxingcpp`. Neither is a game or CI runtime dependency.

## Adding a level

Adding a level requires more than a data entry. Update `LEVELS`,
`LEVEL_AGENDA`, `evidenceMission()`, audience availability, and any
level-specific budget or event rules. Navigation, unlocking, and season
completion currently contain six-level boundaries; update those too
before extending the campaign. Keep response benchmarks separate from
evidence acceptance requirements. Add legal winning fixtures,
wrong-population and failed-control cases, continuous-campaign coverage,
and rendered navigation checks before shipping.

## Known limits

- Sound is WebAudio synthesized; it cannot be verified in headless
  test environments. Human ear check is a release step (see the
  deployment checklist).
- The title uses the locally bundled pixel font with a monospace
  fallback; the game makes no external requests and remains playable offline.
- Persona behavior is tuned to feel plausible and teach the right
  trade offs. It is a teaching simulation, not a forecasting model,
  and the game labels its results simulated.
