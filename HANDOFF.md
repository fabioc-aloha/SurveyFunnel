# Handoff

## Current State

Production hosting is the public Free-tier `swa-surveyfunnel-prod` in
`rg-surveyfunnel-prod`, East US 2, under GCX Survey Operations PROD.
GitHub Actions publishes the packaged game from `main`; the production
environment restricts deployment to that branch and holds the app token.
See the latest workflow run for current publication status.

## Blockers

The browser regression suite in [TODO.md](TODO.md) needs approval.
Human listening remains necessary to verify music and effects.

## Next Action

Check the latest [production workflow](https://github.com/fabioc-aloha/SurveyFunnel/actions/workflows/deploy-production.yml),
then complete the human audio check and resolve the browser-test decision
in [TODO.md](TODO.md).

## Verification

`node --test scripts/build-site.test.mjs` passed three tests covering
inline-script syntax, exact package contents, source bytes, font resolution,
and rejected invalid/missing/external scripts. CI runs these tests and
verifies live HTML/font/license bytes, response headers, and unpublished docs.

Earlier session browser checks passed Field Guide first-open/reopen
`scrollTop === 0`, close-button focus, button close, and Escape close.
These gameplay checks are not yet a tracked browser suite.

The push was verified against the remote `main` hash. Default Git
authentication failed; the successful retry used the existing GitHub CLI
credential helper for that command only, without changing Git configuration.
Do not assume the default helper is repaired.

Full balance invariants were not rechecked during deployment setup.

## References

- [Open work](TODO.md)
- [Completed-change history](CHANGELOG.md)
- [Development notes and balance invariants](docs/development.md)
- [Deployment guide](docs/deployment.md)
- [Production game](https://nice-mushroom-0bdb0ef0f.6.azurestaticapps.net)
