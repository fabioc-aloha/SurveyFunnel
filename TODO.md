# Open work

## Regression checks - proposed, awaiting approval

- Decide whether to add a tracked browser regression suite.
  Production CI now includes inline-script syntax and package checks,
  but no browser automation dependencies. The release workflow also
  runs the dependency-free gameplay tests.
- Cover breaker cutoff accounting, interrupted participants, question
  repairs, distinct A/B invitations, local font loading, and MPOR
  first-open/reopen scrolling, focus, and close behavior.
- Run against a freshly loaded page: the first post-edit guide check
  used the old document and failed until the page was reloaded.
- Checks should fail with explicit assertions and preserve the
  framework-free game. Include a guide reopened after scrolling and
  a completion on each side of the breaker cutoff.
- Next decision: approve browser test files, tooling, and any
  dependencies before implementation. Earlier gameplay checks were
  session browser evaluations, not saved tests.
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
  Approve test files, tooling/dependencies, and any workflow changes
  separately before implementation.

## Release verification

- Complete the authorized publication of UAT fixes, difficulty labels,
  terminology corrections, and collapsed QR-border removal.
  The current 38 tests and local browser checks do not verify deployment.
- A human must listen to WebAudio on the live site. Automated checks
  cannot establish that music and effects sound correct.
- Scan the expanded QR with a physical phone and repeat key journeys on
  iOS Safari and Android Chrome. Cross-browser and screen-reader UAT
  remain unverified.
