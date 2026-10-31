# Open work

## Regression checks - proposed, awaiting approval

- Decide whether to add a tracked browser regression suite.
  Production CI now includes inline-script syntax and package checks,
  but no browser automation dependencies.
- Cover breaker cutoff accounting, interrupted participants, question
  repairs, distinct A/B invitations, local font loading, and Field Guide
  first-open/reopen scrolling, focus, and close behavior.
- Run against a freshly loaded page: the first post-edit guide check
  used the old document and failed until the page was reloaded.
- Checks should fail with explicit assertions and preserve the
  framework-free game. Include a guide reopened after scrolling and
  a completion on each side of the breaker cutoff.
- Next decision: approve browser test files, tooling, and any
  dependencies before implementation. Earlier gameplay checks were
  session browser evaluations, not saved tests.

## Release verification

- A human must listen to WebAudio on the live site. Automated checks
  cannot establish that music and effects sound correct.
