# Handoff

## Current State

Production hosting is the public Free-tier `swa-surveyfunnel-prod` in
`rg-surveyfunnel-prod`, East US 2, under GCX Survey Operations PROD.
GitHub Actions publishes the packaged game from `main`; the production
environment restricts deployment to that branch and holds the app token.
See the latest workflow run for current publication status.

Release scope: Quick Challenge, event-based respondent reactions,
stakeholder dialogue/forecasts, MPOR, active-study BRD, Marge removal,
and collapsible mobile QR. The user authorized commit, push, and deployment.
The existing production workflow is the publication path; check its latest
run rather than assuming a local implementation checkpoint is deployed.

## Blockers

The browser regression suite in [TODO.md](TODO.md) needs approval.
Human listening remains necessary to verify music and effects.

## Next Action

Check the latest production workflow and live game. Complete the human
audio check and resolve the tracked browser-test decision in [TODO.md](TODO.md).

## Verification

`node --test scripts/build-site.test.mjs scripts/game-features.test.mjs`
passed 21 local tests covering packaging, challenge repairs and campaign
isolation, reactions, stakeholder forecasts, stale animation callbacks,
MPOR labels/coaching removal, level/challenge BRD requirements, and QR toggling.
Ten campaign setups matched committed simulation and budget results,
excluding only the added question-ID event metadata.

Local browser checks passed all three challenge wins within 40 credits,
cut/restore, retry/next/back, campaign progress isolation, live reactions,
skipped and fully animated reports, and Level 3/6 stakeholder choices.
Checks at 390px and 1440px found no horizontal overflow or runtime errors.
Reduced-motion play and Field Guide top/focus behavior passed; screenshots
were checked. Human audio listening is still unverified.

The release workflow runs all 21 tests and verifies the five-file package:
HTML, static configuration, font, license, and QR. Live byte/header checks
exclude the host configuration file and verify unpublished docs return 404.
Rendered local QR screenshots decoded to the production URL at both widths.

The push was verified against the remote `main` hash. Default Git
authentication failed; the successful retry used the existing GitHub CLI
credential helper for that command only, without changing Git configuration.
Do not assume the default helper is repaired.

Full balance invariants were not rechecked; the ten baseline comparisons
and targeted gameplay tests are the current regression evidence.

## References

- [Open work](TODO.md)
- [Completed-change history](CHANGELOG.md)
- [Development notes and balance invariants](docs/development.md)
- [Deployment guide](docs/deployment.md)
- [Production game](https://nice-mushroom-0bdb0ef0f.6.azurestaticapps.net)
