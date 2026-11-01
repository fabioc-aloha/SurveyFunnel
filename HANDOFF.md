# Handoff

## Current state

- Public repository: https://github.com/fabioc-aloha/SurveyFunnel
- Production URL: https://nice-mushroom-0bdb0ef0f.6.azurestaticapps.net
- Remote `main` is deployed production: Moog-style soundtrack, IM nameplate on
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

- `npm test` (build-site plus game-features): 83 tests, all passing locally.
- Browser harness (`node scripts/harness/run-all.mjs`): PASS, 3/3 sections
  (build validation, the 83-test Node suite, and the browser suite at
  90/90 checks). Negative controls (`node scripts/harness/self-test.mjs`):
  PASS, 2/2 deliberate defects caught.
- The winnability corpus (`scripts/fixtures/winning-setups.json`) holds 364
  UI-legal winning setups: 65 each for Levels 1, 2, 3, 5, 6 and 39 for
  Level 4, whose ending-goodwill gate rejected the other draws in the searched
  space. Setups are applied through the game's own card handlers in the test;
  the suite asserts the recorded per-level minimums.

## Immediate next actions

1. Continue the staged Quick Challenge expansion from `TODO.md`: stage 2
   (BRD variation pack), then stage 3 (second-wave complication).
2. Final visual pass over every screen once all changes are in.

## Open items (honest status)

- The Moog soundtrack is deployed but still awaits the user's own listen; no
  audio can be verified from the build environment.
- Azure deployment creation and DNS or custom-domain work remain manual.

## Do not redo

- Do not restore the deleted private Survey-Respons repository.
- Do not add a second HTML source of truth; `site/index.html` is the game.
- Do not commit `dist/`, generated screenshots, or Azure deployment secrets.
