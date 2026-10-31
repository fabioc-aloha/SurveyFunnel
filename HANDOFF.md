# Handoff

## Current State

UAT fixes, initial-budget winnability checks, approved difficulty labels,
player terminology corrections, and collapsed QR-border removal are ready
for the user-authorized commit, push, and deployment. Publication is not
yet verified. Implementation and prior release evidence
are preserved in [CHANGELOG.md](CHANGELOG.md).

The existing [production workflow](.github/workflows/deploy-production.yml)
deploys the five-file static package on pushes to `main`. The last recorded
release is gameplay commit `3df78b8` followed by documentation commit
`58af2ed`; current production was not rechecked during meditation.
See [deployment guidance](docs/deployment.md) for the hosting target.

## Blockers

The tracked browser-suite proposal still needs approval; human audio, physical-phone QR/touch,
cross-browser, and screen-reader checks remain open in [TODO.md](TODO.md).

## Next Action

Commit and push the approved changes, then use the existing production
workflow and verify the deployed package and gameplay.
Do not treat local acceptance as deployment evidence.

## Verification

Latest local command:
`node --test scripts/build-site.test.mjs scripts/game-features.test.mjs`
passed 38 tests, including 390 winning launches/reports: fixed starts plus
64 seeded draws per level, all within initial budgets. This is sampled,
not exhaustive random coverage. Scope and difficulty rationale are in
[development notes](docs/development.md).

Local browser checks passed an uninterrupted six-level campaign, retry
recovery, the finale's audience-specific minimum send cost, modal keyboard
containment and opener restoration, and 390px/1440px layout checks.
These are manual/session checks, not a tracked browser suite.
All three inline scripts and the five-file package passed validation.

Default Git authentication failed during the prior release; the existing
GitHub CLI helper worked when selected for that push only. Git configuration
was not changed; do not assume the default helper is repaired.

## References

- [Open work and approval decisions](TODO.md)
- [Completed-change history and release evidence](CHANGELOG.md)
- [Game structure and balance invariants](docs/development.md)
- [Current player guidance](docs/player-guide.md)
- [Deployment and live verification](docs/deployment.md)
- [Production game](https://nice-mushroom-0bdb0ef0f.6.azurestaticapps.net)
