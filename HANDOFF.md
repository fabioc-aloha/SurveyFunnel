# Handoff

## Current state

- Gameplay release `b45bb69` is committed, pushed to `main`, and deployed:
  - Any question may be cut except the last, whose CUT is gray/disabled.
    Missing BRD coverage still penalizes results.
  - Statistics use individual simulated recipients. Animation uses adaptive,
    labeled cohorts and an independent exact progress timeline. Quality
    deductions are rate-based; study gates and budgets are unchanged.
- Production is
  <https://nice-mushroom-0bdb0ef0f.6.azurestaticapps.net>.
  [Workflow 41490330923](https://github.com/fabioc-aloha/SurveyFunnel/actions/runs/41490330923)
  passed deployment and live-package verification. Independent package
  verification and production browser checks also passed. This
  documentation receipt does not change the game package.
- A persistent fixture generator remains a proposal awaiting approval.
  Population witnesses were regenerated using session-only action replay;
  no repository generator or shared test-helper module was created.
- Quick Challenge stages 2 and 3 are already implemented. New Azure
  provisioning and DNS/custom-domain work remain manual and outside
  this release.
- Local, not yet pushed: medallion prep stage phase 1 (derived list
  health) is built and committed on top of the design commit. Step 2
  is Bronze / Silver / Gold, campaign invalid rates are derived from
  a dealt intake mix, and the witness corpus was regenerated at the
  same 364 setups with unchanged minimum credits-to-win. Full local
  gates pass (build, Node suite, browser harness with the new
  medallion scenario). Production still runs `b45bb69` plus the
  2026-11-10 copy, favicon, and design commits until this is pushed.

## Acceptance boundary

The full local harness, negative controls, and automated player journeys
now pass using existing approved Puppeteer/Edge tooling. No installation
or policy change was needed. Physical-device, screen-reader, human audio,
and owner acceptance remain open in [TODO.md](TODO.md).

## Next action

Run the remaining human checks in [TODO.md](TODO.md); that file also owns the
unimplemented roadmap and fixture-generator approval decision. Production
verification must be repeated after any future deployment.

## Verification - 2026-11-02

- `node scripts/harness/run-all.mjs` passed all three sections:
  packaging, 109 Node tests (including all 364 regenerated witnesses),
  and 119 real-browser checks. `node scripts/harness/self-test.mjs`
  caught both deliberate defects. Outputs are in ignored harness results.
- The initial browser failure was an obsolete below-threshold agitation
  expectation. It now tests an above-threshold Executive Blast; the live
  observer also has an explicit thousands-separator regression check.
  No game-source change was required.
- Separate session-only UAT passed 143 assertions: complete six-level
  campaigns at 390px/1280px, all three Quick Challenges, natural 20,000-person
  reduced-motion progress, exact individual/cohort accounting, and BRD cuts
  down to one disabled gray CUT. This did not install repository automation.
- Additional browser-tool checks covered modal/keyboard behavior, local fonts
  and sound controls, QR expansion, breaker accounting, owned prep, and retry
  recovery. Screenshots of the mobile run, disabled CUT, and desktop finale
  were visually reviewed. Human-only acceptance is not established by these.
- Full-harness and UAT game hashes matched:
  `a5cdb86909d5cd3cdad1760a3cc4621f8cef53994f7d987bb57a41240f19db38`.
- Changed-file editor diagnostics, harness syntax, and whitespace checks
  passed. All 75 local links and 3 anchors resolve across 20 tracked
  Markdown files. Generated results and private feedback remain ignored.
- [Production workflow 41490330923](https://github.com/fabioc-aloha/SurveyFunnel/actions/runs/41490330923)
  passed for `b45bb69`, including live-package verification. Independent
  `node scripts/verify-deployment.mjs` matched production HTML, font,
  license, QR, response headers, and unpublished-document checks.
- Production browser journeys at 390px and 1280px each verified 10,000
  recipients partitioned into 183 animation groups, nonzero intermediate
  counters matching individual events, and 1,154 completions with ROUND WON
  and all five evidence checks passing. No overflow or runtime errors
  occurred. A separate cut-to-one check confirmed native disabled CUT
  and `grayscale(1)` after the rendered card settled.
- Exact historical verification is in the [changelog](CHANGELOG.md);
  remaining human audio, physical-device, cross-browser, and screen-reader
  checks are in [TODO.md](TODO.md).

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
