# Handoff

## Current State

UAT fixes, initial-budget winnability checks, approved difficulty labels,
player terminology corrections, and collapsed QR-border removal deployed
successfully in gameplay commit `f8b2fac`. Release evidence is preserved in
[CHANGELOG.md](CHANGELOG.md).

Audio v2 landed locally on 2026-11-01 (4-bar soundtrack, drums, echo, compressor master chain, layered SFX, music ducking; audio APIs unchanged; build and 38 tests pass) and awaits push; the human listen stays open in [TODO.md](TODO.md).

The existing [production workflow](.github/workflows/deploy-production.yml)
deploys the five-file static package on pushes to `main`.
[Run 41236593589](https://github.com/fabioc-aloha/SurveyFunnel/actions/runs/41236593589)
passed deployment and live verification for `f8b2fac`. The following
documentation-only commit records that verification without changing the
game package; check its workflow before assuming publication is complete.
See [deployment guidance](docs/deployment.md) for the hosting target.

## Blockers

The tracked browser-suite proposal still needs approval; human audio, physical-phone QR/touch,
cross-browser, and screen-reader checks remain open in [TODO.md](TODO.md).

## Next Action

Complete the remaining human audio and physical-device checks and resolve
the tracked browser-suite approval decision in [TODO.md](TODO.md).

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

Independent post-deployment verification matched live HTML, font, license,
QR bytes, security/MIME headers, and unpublished-document 404s.
A live uninterrupted six-level campaign reached Season Results with 6/6
wins and no runtime errors. MPOR/BRD keyboard focus restoration, inert
background controls, terminology, difficulty labels, the finale's 70+
Insight HUD, and the collapsed 0px QR border passed live checks.

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
