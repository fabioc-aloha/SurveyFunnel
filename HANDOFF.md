# Handoff

## Current state

- Public repository: https://github.com/fabioc-aloha/SurveyFunnel
- Production URL: https://nice-mushroom-0bdb0ef0f.6.azurestaticapps.net
- Remote `main` is deployed production: Moog-style soundtrack, IM nameplate on
  the manager sprite, uniform questionnaire buttons, the cut floor (core
  questions cannot be cut; launches refuse below six kept, three in Quick
  Challenges).
- Local `main` is ahead of remote by the bounce-backs report section and the
  2026-11-01 code-review fix batch (legal winnability fixtures, startRun floor
  guard, bank-add charge fix, dead-code removal, explicit CI build step, audio
  and A/B nits). None of those commits are pushed yet; pushing to `main`
  deploys to production, so the push waits for the user's go.
- The deploy workflow runs an explicit `node scripts/build-site.mjs` step
  before the test suite.

## Test state

- `npm test` (build-site plus game-features): 49 tests, all passing locally.
- The winnability corpus (`scripts/fixtures/winning-setups.json`) holds 364
  UI-legal winning setups: 65 each for Levels 1, 2, 3, 5, 6 and 39 for
  Level 4, whose ending-goodwill gate rejected the other draws in the searched
  space. Setups are applied through the game's own card handlers in the test;
  the suite asserts the recorded per-level minimums.

## Immediate next actions

1. On the user's go, push the local commits to `main` and verify the deploy
   run and the production byte check (`npm run verify:deployment`).
2. Integrate the external browser regression harness
   (`~/workspace/test-harness-survey-funnel/`) into `scripts/harness/` per its
   README, then run it against the final state.
3. Continue the queued feature work in `TODO.md` in the user's order: visible
   bounce-back and unopened piles with reminder drain, then the staged Quick
   Challenge expansion (bigger drills, BRD variation, second wave).
4. Final visual pass over every screen once all changes are in.

## Open items (honest status)

- The Moog soundtrack is deployed but still awaits the user's own listen; no
  audio can be verified from the build environment.
- The browser harness is built and proven (it catches deliberately broken
  copies) but still lives outside the repository.
- Azure deployment creation and DNS or custom-domain work remain manual.

## Do not redo

- Do not restore the deleted private Survey-Respons repository.
- Do not add a second HTML source of truth; `site/index.html` is the game.
- Do not commit `dist/`, generated screenshots, or Azure deployment secrets.
