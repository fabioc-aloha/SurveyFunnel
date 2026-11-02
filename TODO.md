# Open work

## Verification blocker

- Run the extended tracked browser harness and negative controls in an
  approved environment with Puppeteer available:
  `node scripts/harness/run-all.mjs` and
  `node scripts/harness/self-test.mjs`.
- The Windows run was blocked by missing tooling and package-fetch policy.
  Integrated-browser checks and a green deployment do not close this item.
  Use the [harness guide](scripts/harness/README.md) for provisioning and
  current coverage; completed integration and dated results remain in the
  [changelog](CHANGELOG.md).

## Browser regression expansion

These are proposed saved checks, not claims that earlier session-browser
evaluations are automated. Extending the tracked harness to this scope
still requires a scope/workflow decision.

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
  core locks, floors, and every acceptance gate; fail before replacing
  fixtures if any required winner is missing.
- Validate the current corpus and deterministic repeat generation; prove
  that inactive bank items stay unchanged and a failed search leaves the
  existing fixture file intact. No tooling files have been created.
