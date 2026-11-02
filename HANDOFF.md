# Handoff

## Current state

- Evidence fitness is deployed at production
  <https://nice-mushroom-0bdb0ef0f.6.azurestaticapps.net>.
  Gameplay release `3661c23` and documentation receipt `f57b0c7` are
  deployed; both receipts are in the [changelog](CHANGELOG.md).
  Later continuity-only updates do not change the game package.
- The meditation reconciled continuity only; no gameplay or test tooling
  was changed. Fixture generation remains a proposal awaiting approval.
- Quick Challenge stages 2 and 3 are already implemented. New Azure
  provisioning and DNS/custom-domain work remain manual and outside
  this release.

## Blocker

The extended CLI browser suite and negative controls remain unverified
here: Puppeteer was unavailable and installation was blocked by package-fetch
policy. Use an approved environment; do not treat deployment or prior
session-browser checks as a passing harness run.

## Next action

Run the existing browser harness and negative controls in an approved
environment, then complete the human checks in [TODO.md](TODO.md).
That file also owns the unimplemented roadmap and the fixture-generator
proposal, which requires separate approval before authoring.

## Verification - 2026-11-01

- Latest relevant Node run:
  `node --test scripts/build-site.test.mjs scripts/game-features.test.mjs`
  passed 94 tests, including 364 legal witnesses and a continuous campaign.
  It was not rerun for these continuity-only edits.
- [Production workflow 41367108944](https://github.com/fabioc-aloha/SurveyFunnel/actions/runs/41367108944)
  passed for `f57b0c7`, including live-package verification; independent
  production verification also passed afterward.
- Integrated-browser mobile/desktop checks passed for the release.
  Exact scope and historical harness results are in the
  [changelog](CHANGELOG.md); full CLI, human audio, physical-device,
  cross-browser, and screen-reader checks remain open in [TODO.md](TODO.md).

## References

- [Implemented release](docs/evidence-fitness.md)
- [Development and fixture balance](docs/development.md)
- [Browser harness and tooling](scripts/harness/README.md)
- [Deployment and hosting](docs/deployment.md)

## Do not redo

- Do not restore the deleted private Survey-Respons repository.
- Do not add a second HTML source of truth; `site/index.html` is the game.
- Do not commit `dist/`, generated screenshots, deployment secrets, or
  ignored local feedback.
