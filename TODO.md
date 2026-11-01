# Open work

## Regression checks

- Done: the browser regression suite is tracked at `scripts/harness/`
  and run with `node scripts/harness/run-all.mjs`; negative controls
  run with `node scripts/harness/self-test.mjs`. It covers build
  validation, the Node suite, the Level 1 browser journeys at 390x844
  and 1280x800, the cut floor, the pile strip and mood scenarios, and
  the campaign BOUNCE-BACKS section. Puppeteer and Chrome are external
  test tooling, provisioned as documented in
  `scripts/harness/README.md`; the game stays framework-free and gains
  no runtime dependency. Remaining manual checks are physical devices,
  other browsers, screen reader, and human audio.
- The checks below are still proposed and are not covered by the
  integrated harness yet.
- Cover breaker cutoff accounting, interrupted participants, question
  repairs, distinct A/B invitations, local font loading, and MPOR
  first-open/reopen scrolling, focus, and close behavior.
- Run against a freshly loaded page: the first post-edit guide check
  used the old document and failed until the page was reloaded.
- Checks should fail with explicit assertions and preserve the
  framework-free game. Include a guide reopened after scrolling and
  a completion on each side of the breaker cutoff.
- Earlier gameplay checks for these topics were session browser
  evaluations, not saved tests.
- Include BRD level/challenge content and focus, QR mouse/keyboard
  expansion, and independent decoding of the rendered full QR.
- Include an uninterrupted Level 1-to-6 campaign using actual controls,
  a 35-credit Level 2 retry recovered through successive cost reductions,
  and a Level 6 report with 35 credits left that offers no retry.
- Exercise Tab/Shift-Tab containment, inert background controls, Escape,
  opener-focus restoration, and cleared affordability warnings.
  Start from a freshly loaded game and assert the expected screen before
  interacting; a stale/reset browser page must fail explicitly.
- Reuse the existing gameplay witnesses rather than duplicating scoring.
  Positive case: navigate all six winning reports to Season Results.
  Negative cases: an over-budget setup cannot launch, and owned prep and
  audience locks remain enforced. Node fixtures already cover scoring;
  the proposed browser checks cover rendered controls and event wiring.
  Extending the tracked harness to these topics still needs its own
  scope and workflow decision.

## Release verification

- A human must listen to WebAudio on the live site. Audio v2 shipped 2026-11-01;
  automated checks still cannot establish that music and effects sound correct.
- Scan the expanded QR with a physical phone and repeat key journeys on
  iOS Safari and Android Chrome. Cross-browser and screen-reader UAT
  remain unverified.
