# Open work

## Browser regression expansion

These are proposed tracked checks. Several were exercised by session-only
automated UAT on 2026-11-02, as recorded in the [changelog](CHANGELOG.md);
that does not make them part of the repository harness. Extending the
tracked harness to this scope still requires a scope/workflow decision.

- Breaker cutoff accounting, interrupted participants, and completions
  on both sides of the cutoff.
- Question repairs, distinct A/B invitations, and local font loading.
- MPOR first-open/reopen scrolling, including reopening after scrolling;
  focus and close behavior.
- BRD level/challenge content and focus; QR mouse/keyboard expansion and
  independent decoding of the rendered full QR.
- An uninterrupted Level 1-to-6 journey through actual controls to Season
  Results; a 35-credit Level 2 retry recovered through successive cost
  reductions; a Level 6 report with 35 credits left that offers no retry.
- Tab/Shift-Tab containment, inert background controls, Escape, opener-focus
  restoration, and cleared affordability warnings.
- Negative cases: over-budget launch refusal, owned-preparation locks,
  and attempt-chain audience locks.

Acceptance conditions: use explicit failing assertions and freshly loaded
pages with expected-screen guards; a stale/reset page must fail rather than
continue. Reuse existing gameplay witnesses rather than duplicate scoring.
Keep the game framework-free, without runtime test dependencies; the browser
checks own rendered controls and event wiring, not a second scoring model.

## Human release checks

- Listen to deployed WebAudio music and effects; automated checks cannot
  establish that the Moog soundtrack sounds correct.
- Scan the expanded QR with a physical phone and repeat key touch journeys
  on iOS Safari and Android Chrome. Cross-browser and screen-reader UAT
  remain unverified.
- Complete owner acceptance after the remaining human checks; automated
  player-acceptance tests do not substitute for that decision.

## Feedback roadmap

The [evidence-fitness first release](docs/evidence-fitness.md) is deployed.
The following features remain unimplemented:

- P1: Agree metric definitions, baselines, owners, QC checkpoints, and
  prospective versus retroactive segment changes as playable decisions.
- P1: Add explicit privacy, security, accessibility, and approval gates;
  the current operational-trust check is not a compliance assessment.
- P1: Expand localization: terminology, translation memory, human linguistic
  review, disputed translations, cultural fit, and response-option validation.
- P1: Design the One Number scenario and a player-authored context note.
- P2: Add a governed AI adviser with acceptance criteria, human approval,
  audit trail, and deterministic measures separate from interpretation.
- P2: Expand cohort health into cross-instrument portfolio decisions:
  individual synthetic contact/response histories, overlaps between pools,
  account hierarchies, and finer sampling/role-specific missions.
- P2: Add causal decision review, rejected-alternative consequences,
  learning assessment, and optional local scorecard export.
- Medallion prep stage phases 2 and 3 (design in
  [docs/medallion-prep-stage.md](docs/medallion-prep-stage.md), phase 1
  shipped 2026-11-10): phase 2 adds the missing-attributes intake
  class, the ATTACH HISTORY Gold enhancement (matching/Insight only,
  per the owner's 2026-11-10 decision), and a season quarantine line;
  phase 3 (separately decided) would make promoted counts the literal
  send base and add a Quick Challenge dirty-Gold complication.
- Per-level surveys phase 5 (design in
  [docs/level-surveys-scope.md](docs/level-surveys-scope.md); all
  seven decisions approved as recommended 2026-11-11; phase 1 built
  2026-11-11: survey data model with transitional legacy fallback,
  per-level BRD, Level 1 Support Experience bank of 36, Level 1
  witnesses regenerated; phase 2 built 2026-11-11: Level 2 Copilot
  Adoption bank of 36, full Level 2 BRD, Level 2 fixed first-play
  instrument, Level 2 witnesses regenerated, fallback narrowed to
  Levels 3-6; phase 3 built locally 2026-11-11: Level 3 Azure
  Cloud Services bank of 36, full Level 3 BRD with the sponsor
  named as the study's stakeholder, Level 3 fixed first-play
  instrument, Level 3 witnesses regenerated, fallback narrowed to
  Levels 4-6; phase 4 built locally 2026-11-11: Level 4 Account
  Team Relationship bank of 36, full Level 4 BRD with the goodwill
  gate and report back as the study's feedback commitment, Level 4
  fixed first-play instrument, Level 4's 39 witnesses regenerated,
  fallback narrowed to Levels 5-6; phase 5a built and pushed
  2026-11-11: Level 5 General Perceptions of Microsoft bank of
  36, full Level 5 BRD, Level 5 fixed first-play instrument and
  65 witnesses regenerated; Level 6 Enterprise Relationship
  Flagship Annual bank of 36, full Level 6 BRD, Level 6 fixed
  first-play instrument and 65 witnesses regenerated; the
  legacy-bank fallback removed, so every campaign level draws
  its own bank, while the legacy 64 entries remain the Quick
  Challenge union source and Level 1's curation origin). The
  Level 5/6 witnesses were regenerated by a session-only
  regeneration in ~/workspace/regen-l5l6 (the worker that
  started phase 5a was stopped mid-run by the owner and its
  regeneration was finished and verified by the parent agent;
  splice preserved all other levels entry-for-entry). Remaining:
  phase 5b, the closing rebalance across all six levels,
  proposed to the owner before anything is tuned, with the six
  balance invariants replayed across the themed season.
  Phase-5 rebalance flags so far: Level 1 seeded range lower
  (53-71 vs 58-93 cr, fixed holds at 58); Level 2 fixed line
  cheaper than its baseline (61 vs 67 cr, seeded 59-67 vs
  64-93); Level 3 seeded winning range widened (59-92 vs 60-89
  cr) and the Azure bank's restriction-dense core makes kept
  restricted items the dominant goodwill cost, which the
  recorded Level 3 fixed line is chosen around; Level 4 fixed
  line cheaper than its baseline (63 vs 76 cr) and seeded range
  narrower (59-75 vs 58-82 cr), with recorded lines ending at
  41-47 goodwill, because the Relationship core is deliberately
  answerable by every seat (see the phase-4 changelog entry
  for the recorded answerability decision); Level 5 fixed line
  72 vs the 70 baseline (seeded 66-85, goodwill 57-72); Level 6
  fixed line 87 vs the 98 baseline (seeded 83-122, goodwill
  26-53).

## Proposed automation - approval required

- Decision: approve or reject a reproducible winning-fixture generator.
  The ad hoc generator changed inactive, unadded bank questions; existing
  card-handler replay caught the resulting cost mismatch. Reproducible
  generation would reduce this risk during future rebalancing.
- Prior art: `game()`, `clickCut()`, `clickSimplify()`, and exact witness
  assertions in [game-features.test.mjs](scripts/game-features.test.mjs).
  Those checks already work; another instruction or skill is not needed.
- Proposed scope, not authorized creation: extract shared VM/action helpers
  into `scripts/game-test-helpers.mjs`, add
  `scripts/generate-winning-setups.mjs`, and update the existing tests.
- Contract: accept levels/seeds and the current corpus; emit only a complete,
  UI-legal corpus with exact report metadata. Preserve coverage, budgets,
  the one-question floor and every acceptance gate; fail before replacing
  fixtures if any required winner is missing.
- Validate the current corpus and deterministic repeat generation; prove
  that inactive bank items stay unchanged and a failed search leaves the
  existing fixture file intact. No repository generator or shared-helper
  module has been created; the population update used session-only action
  replay to regenerate its witnesses.
