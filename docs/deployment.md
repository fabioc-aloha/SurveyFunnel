# Deployment

The game has no backend, database, or runtime configuration. Production
uses Azure Static Web Apps and GitHub Actions. A dependency-free Node
script validates the inline JavaScript and packages the game with its
local font.

## Production target

| Setting | Value |
| --- | --- |
| Subscription | GCX Survey Operations PROD |
| Subscription ID | `f938d574-06bc-48b4-9b7b-2ed21e60c5f1` |
| Resource group | `rg-surveyfunnel-prod` |
| Static Web App | `swa-surveyfunnel-prod` |
| Region | East US 2 |
| Plan | Free; no SLA |
| Access | Public; no login required |
| URL | <https://nice-mushroom-0bdb0ef0f.6.azurestaticapps.net> |

Free hosting is subject to subscription-wide bandwidth and app quotas.
No custom domain, backend, or paid hosting resource is configured.

## What gets deployed

```text
dist/index.html                    game (HTML, CSS, JS, WebAudio)
dist/staticwebapp.config.json      response headers and font MIME type
dist/assets/press-start-2p.ttf      pixel title font
dist/assets/OFL-Press-Start-2P.txt   font license
dist/assets/play-mobile-qr.svg     production URL QR code
```

Deploy `dist/` as the web root, not `site/` or the repository root.
The font URL resolves to `/assets/press-start-2p.ttf`. Repository
documentation, agent guidance, and the README banner are not included
in the hosted web root. The GitHub repository and tracked documentation
are public; excluding a file from `dist/` does not make it private.
Private local notes must remain ignored and unstaged.

## Continuous deployment

[Deploy production](../.github/workflows/deploy-production.yml) runs on
every push to `main`, or manually through GitHub Actions on `main`.

1. Check out the commit and set up Node 22.
2. Explicitly build with `node scripts/build-site.mjs`, then run
   `node --test scripts/build-site.test.mjs scripts/game-features.test.mjs`.
   Tests cover the independent evidence gates, sample/role/account boundaries,
   audience carryover, continuous campaign, legal winning fixtures,
   Quick Challenge rules and campaign isolation, event-based reactions,
   stakeholder forecasts, and default replay behavior. They also
   validate all inline scripts, reject missing/external scripts, and check
   the exact package contents, normalized source bytes, font path, and license. Text files
   use LF line endings on every platform; the font remains binary.
3. Check that the production deployment credential is present without
   printing its value.
4. Upload the prebuilt `dist/` package using Azure's deployment action.
   No Oryx build or API deployment runs.
5. Verify the live HTML, font, license, and QR code against the packaged bytes,
   check response headers and MIME types, and confirm repository docs
   return HTTP 404. Retry transient deployment propagation failures;
   persistent failures mark the workflow failed.

   CI does not run the Puppeteer browser harness. A green deployment
   workflow establishes build, Node-test, and live-package verification;
   it does not establish a passing browser suite, physical-device review,
   screen-reader review, or human audio check.

The workflow has read-only repository permissions. Actions are pinned to
commit SHAs, and production deployments are serialized. The GitHub
`production` environment allows only the `main` branch. Its
`AZURE_STATIC_WEB_APPS_API_TOKEN` secret is scoped to this Static Web App;
the workflow does not need an Azure subscription credential.

To rotate the deployment token, reset it in the Static Web App and replace
the environment secret using a secure input to `gh secret set`.
Never place the token in source, logs, or a command-line argument.

Local validation requires Node 22 or later:

```powershell
node --test scripts\build-site.test.mjs scripts\game-features.test.mjs
node scripts\verify-deployment.mjs https://nice-mushroom-0bdb0ef0f.6.azurestaticapps.net
```

The second command verifies that production matches the locally packaged
commit. It should fail if local changes have not yet been deployed.

## Route B: any static file host

Run `node scripts/build-site.mjs` and upload the contents of `dist/`
to an HTTPS static host. The Azure configuration is platform-specific;
configure equivalent headers and font MIME types on another host.

## Route C: local and offline

Open `site/index.html` from disk with the adjacent `assets/` folder intact.
The title uses the bundled pixel font, with a monospace fallback.
The game makes no external runtime calls.

The start-screen QR defaults to a tiny icon. Click to expand the scannable
mobile player panel, and click again to collapse it. The expanded panel
also offers a production link, even during offline play.
Its SVG is bundled locally; no QR service or runtime generator is used.
If the production hostname changes, regenerate the QR and update its link.

## Updating the game

1. Edit the game or assets and run the local gameplay and packaging tests.
2. Run the [browser harness](../scripts/harness/README.md) and negative
   controls where approved tooling is available. If blocked, record the
   exact limitation; do not report the suite as passed.
3. Update current documentation and `CHANGELOG.md`, inspect staged files
   for private notes or generated output, then commit and push to `main`.
4. Match the production workflow to the pushed commit and wait for its
   live-package verification to succeed.
5. Play a round on the live URL and check sound in a real browser.

To roll back, revert the faulty commit and push the revert to `main`.
The same workflow validates and deploys the restored version. A failed
post-deployment check reports failure but does not automatically roll back.

## Pre launch checklist

- [ ] One full round played on the production URL, desktop width.
- [ ] One full round played on a phone width screen, no sideways
      scrolling.
- [ ] Sound on and mute toggle both checked in a real browser (the
      build sandbox cannot hear WebAudio; a human ear is required).
- [ ] Report text readable; all five evidence checks and post-response
      stages present; response is a benchmark, not a campaign win gate.
- [ ] Context note explains the usable response base and simulation limits.
- [ ] README banner renders on the repo home page.
