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

Campaign state lives in page memory and resets on reload. Sound and
hint preferences are saved in local storage; the game does not use
cookies or store survey responses.

## The simulation model

Deterministic by design. Given the same instrument, choices, and
starting state, a round replays to the same funnel. Credits, goodwill,
reputation, and owned preparation change on retry, so a retry is not
the same starting state.

Per round, the model runs in this order:

1. **Delivery.** Segment invalid rate, reduced by validation
   (full removes 85% of invalids, partial 55%, with a modeled
   unverifiable remainder). Remainder splits into hard
   and soft bounces. Hard bounce rate drives Sender Reputation.
2. **Opens.** Base open propensity by segment relevance and invite
   variant, adjusted by reputation (spam folder effect), sender,
   why me line, and language match.
3. **Starts.** Click to start conversion, adjusted by the honesty
   of the stated time ask versus the real instrument length.
4. **Completions.** Each persona walks the instrument against two
   clocks: patience (minutes) and knowledge (per question tags).
   Outcomes per question: continue, abandon, escape (if escapes are
   on), or guess. Late survey effects add speeders and straight
   liners; skipped dedupe adds duplicates; open rates can add a
   forwarded response share.
5. **Goodwill and budget.** Spends and earns apply as specified in
   `mechanics-update-v1.1.md`. If goodwill reaches zero, the breaker
   stops new invitations and ends the run for anyone still in the
   funnel. Only completions before the trip count.
6. **Scoring.** Response score scaled to a 20% stretch goal, data
   quality from the deduction table, and Insight Value from agenda
   coverage. Winning requires response strictly above the level target, quality 60+,
   and Insight 60+ (70+ in Level 6); Level 4 also requires ending
   goodwill 35+.

## Balance invariants (test these after any tuning)

1. Lazy Level 1 default run: 2 completions from 40 sent (5%),
   below the 12% target, with a visible bounce problem. This is a
   clear miss, not a near miss.
2. Prepared mid budget run (validation, dedupe, Honest Ask, trim):
   wins inside 120 credits.
3. Unprepared Executive Blast loses, with expensive sends, hard bounces,
   and goodwill loss. It is not uniformly worst on every score.
4. Gutted survey (only Q9 kept): quality and Insight fail, no win.
   A gutted instrument is also unreachable through the controls: core
   questions cannot be cut, the kept count cannot fall below six (or
   the three BRD cards in Quick Challenges), and launch refuses a
   sub-floor instrument.
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
available bank, keeps every core question and at least the instrument
floor, and must pass all scoring gates within the initial budget. The
test applies each setup through the game's own card handlers (repairs
via the fix button, cuts via `applyCut`), never by writing question
state directly, so the corpus proves the scoring engine rewards states
a player can actually reach. Level 4 uses the intended Tired audience,
not a swap to avoid the goodwill constraint; Level 6 uses Executive
Blast.

| Level | Difficulty | Fixed winning cost | Highest winning cost in checked draws | Initial pool |
| --- | --- | --- | --- | --- |
| 1 - First Send | Easy | 58 | 83 | 120 |
| 2 - The Split | Easy | 67 | 83 | 120 |
| 3 - The Stakeholder | Medium | 59 | 89 | 120 |
| 4 - The Tired List | Hard | 62 | 82 | 120 |
| 5 - Global Fieldwork | Medium | 70 | 106 | 120 |
| 6 - The Big Quarter | Hard | 98 | 113 | 150 |

These are verified strategies, not global minimum costs. The corpus was
regenerated under the cut floor: the previous fixtures were legalized
(cut core questions restored with class-correct fixes, kept counts
topped up to the floor), then each seed was searched over legal kept
sets, bank adds, repairs, and combinations of invitation, reminders,
and DK/NA (about 5,800 plan evaluations). It excluded role-restricted
items without a repair: keeping them unnecessarily depleted Level 4
goodwill. A core item can no longer be dropped at all: an unanswerable
core item must be repaired where its class has a fix, carried with
DK/NA escapes, or offset elsewhere in the plan.
All witnesses were replayed through `startRun()` and `showReport()`.
No cost, persona, simulation, or acceptance threshold was weakened.

Difficulty describes decision complexity: introductory levers and optional
A/B comparison are Easy; added burden or multilingual fieldwork is Medium;
low starting goodwill or Executive Blast plus the higher Insight gate is
Hard. Labels appear in level cards, HUD, campaign summary, and BRD.
They are not selectable modes or promises that untouched defaults win.
The seed sample is not an exhaustive guarantee over the random generator.

Response rate is completes/sent, including bounced invitations, not an
AAPOR response rate. Quality and Insight are teaching-game indices.
DK/NA represents item nonresponse, not proof of clean or valid data.
The A/B verdict changes feedback only, not scores.

## Tuning

All rates, costs, and persona numbers sit in one configuration
block at the top of the script. Change numbers there, never inside
the funnel logic. After any change, re run the six invariants above
and record the results in `CHANGELOG.md`.

## Quick Challenge and feedback

Quick Challenge supplies three fixed defective BRD cards plus three
curated non-core extras, the Fresh audience, full validation, dedupe,
suppression, and Honest Ask with no reminders. Its 48-credit budget
(`QUICK_BUDGET`) covers the send (30), invitation (4), all three BRD
repairs (6), and the priciest intended extras line (6), with 2 credits
of headroom; cutting every extra instead totals 43. A win requires all
three BRD repairs, every extra resolved by repair or cut, plus the
usual response, quality, and Insight gates. The challenge floor is its
core count (3), so extras can be cut down to the BRD set and no
further. Unique topics of the three BRD cards form its agenda; the
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

- `mandatory` (one extra id): `cutBlockReason` returns `"required"`
  for that card after the core and floor checks, `quickExtraResolved`
  accepts only `simplify` for it, and the card renders a BRD REQUIRED
  tag with a cut lock line.
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
lines. Twist balance was measured against the engine before the
numbers were fixed: every variant has a winning line inside the
unchanged 48-credit budget, and for each variant a line that wins
under the base rules loses on the twist alone (the intended line
reaches exactly 17.5% against QC1's 17.5% bar and exactly 20%
against QC2's 20% bar; cutting every extra scores quality 93
against QC3's audit bar of 95). Tests pin twists by scanning the
deterministic seeds (`startQCWithVariant`), assert the sweep reaches
all three variants per challenge, and assert the campaign BRD, gate,
and floor carry no twist after leaving a challenge.

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
layout, synthesized audio, or browser accessibility. Manual browser checks
remain necessary for those surfaces.

The setup BRD dialog derives study topics and required personas from
`agendaTopics()` and `TOPIC_KEYS`, and acceptance gates from `curLevel()`
and `insightGate()`. It includes level constraints and the Quick Challenge
repair requirement without modifying campaign or setup state. Keep its
criteria aligned with scoring when adding or changing a level.

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

A level is data, not code: a brief, a target rate, a segment set,
an instrument variant, an event (stakeholder demand, fatigue,
localization), and a Detective voice line set. Follow the shape of
the existing six in `requirements-game-design.md` section 7, and
add the level's own invariant (what a correct strategy must score,
what the trap strategy must score) before shipping it.

## Known limits

- Sound is WebAudio synthesized; it cannot be verified in headless
  test environments. Human ear check is a release step (see the
  deployment checklist).
- The title uses the locally bundled pixel font with a monospace
  fallback; the game makes no external requests and remains playable offline.
- Persona behavior is tuned to feel plausible and teach the right
  trade offs. It is a teaching simulation, not a forecasting model,
  and the game labels its results simulated.
