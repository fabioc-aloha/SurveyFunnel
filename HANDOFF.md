# Handoff

## Current state

- The evidence-fitness first release is implemented. Its public summary
  is `docs/evidence-fitness.md`; preserved release history is in
  `CHANGELOG.md`, and remaining roadmap work is in `TODO.md`.
- Direct publication to `main` was requested. Check the production
  workflow for the current commit before assuming deployment succeeded.
- Public repository: https://github.com/fabioc-aloha/SurveyFunnel
- Production URL: https://nice-mushroom-0bdb0ef0f.6.azurestaticapps.net
- Preserved features include the Moog-style soundtrack, IM nameplate on
  the manager sprite, uniform questionnaire buttons, the cut floor (core
  questions cannot be cut; launches refuse below six kept, three in Quick
  Challenges), the bounce-backs report section, the 2026-11-01 code-review fix
  batch (legal winnability fixtures, startRun floor guard, bank-add charge
  fix, dead-code removal, explicit CI build step, audio and A/B nits), the
  run-screen piles, Quick Challenge stage 1 (six-card drills), and the pile
  relayout (bottom strip, one pile column under each funnel step label).
- The deploy workflow runs an explicit `node scripts/build-site.mjs` step
  before the test suite.

## Test state

- Run `node --test scripts/build-site.test.mjs scripts/game-features.test.mjs`
  for packaging, gate boundaries, all recorded winners, and a continuous
  six-level campaign. All 94 tests pass locally, including all 364
  recorded legal winners.
- Full browser harness: build and Node sections pass; browser section is
  BLOCKED, not passed. Puppeteer is absent on this Windows machine, and
  installing external test-only tooling was refused by the package-fetch
  policy. The historical 90/90 browser result and negative controls
  predate these gameplay changes.
- Integrated-browser checks passed real-control Level 1 winners at
  390px and 1280px, all five checks, publication pipeline, history
  on the next instrument, BRD requirements, and restored keyboard focus.
  No horizontal overflow or runtime errors occurred; a screenshot
  confirmed the mobile scorecard layout. This is not the tracked harness
  or a cross-browser sign-off.
- The winnability corpus (`scripts/fixtures/winning-setups.json`) holds 364
  UI-legal winning setups: 65 each for Levels 1, 2, 3, 5, 6 and 39 for
  Level 4, whose ending-goodwill gate rejected the other draws in the searched
  space. Setups are applied through the game's own card handlers in the test;
  the suite asserts the recorded per-level minimums.

## Immediate next actions

1. Check the current commit's production workflow and live-package
   verification. Run the extended browser harness and negative controls
   in an approved environment with Puppeteer available; the recorded
   limitation remains open. Quick Challenge stages 2 and 3 are implemented.
2. Choose the next feedback-roadmap item from `TODO.md`; governance,
   localization, and AI changes are not included in this first release.

## Open items (honest status)

- The Moog soundtrack is deployed but still awaits the user's own listen; no
  audio can be verified from the build environment.
- Azure deployment creation and DNS or custom-domain work remain manual.

## Do not redo

- Do not restore the deleted private Survey-Respons repository.
- Do not add a second HTML source of truth; `site/index.html` is the game.
- Do not commit `dist/`, generated screenshots, deployment secrets, or
  ignored local feedback.
