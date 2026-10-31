# Deployment

The game ships as one self contained HTML file at `site/index.html`.
There is no build step, no backend, no database, and no runtime
configuration. Any static host can serve it. This guide covers the
planned route (Azure Static Web Apps on a custom subdomain, under
the owner's Microsoft account) and two fallbacks.

## What gets deployed

```text
site/index.html     the whole game (HTML, CSS, JS, WebAudio sounds)
```

Deploy the `site/` folder as the web root. The game must be served
over HTTPS, which every route below provides.

## Route A: Azure Static Web Apps (planned)

Done by the owner in the Azure portal and the DNS provider; it
cannot be done from the repo side. Outline:

1. **Create the app.** Azure portal, Create a resource, Static Web
   App. Plan: Free. Deployment source: GitHub, repo
   `fabioc-aloha/SurveyFunnel`, branch `main`.
2. **Build settings.** App location: `site`. Api location: leave
   empty. Output location: leave empty (the file is already built).
   Azure adds a GitHub Actions workflow to the repo; every push to
   `main` redeploys.
3. **First check.** Open the generated `*.azurestaticapps.net` URL
   and play one full round, sound on, before touching DNS.
4. **Custom subdomain.** In the Static Web App, Custom domains, add
   the chosen subdomain (placeholder here: `<game>.correax.com`).
   At the DNS provider, create the CNAME record Azure shows, plus
   the TXT validation record if Azure asks for one. Wait for the
   status to read Validated and for the free managed certificate to
   issue, then browse the subdomain and play a round again.
5. **Access note.** A Static Web App on the Free plan is public to
   anyone with the URL unless authentication is configured. The
   game contains no real data and no internal systems access, so
   public is acceptable by design; if that changes, configure the
   built in authentication before announcing the URL wider.

## Route B: any static file host

Upload `site/index.html` as the index document of any static
website bucket, pages service, or plain web server. Point the
subdomain at it with a CNAME. Nothing in the game depends on the
host.

## Route C: local and offline

Open `site/index.html` from disk. Everything works offline after
first load; there are no external calls at runtime. If the pixel
display font cannot load (restricted networks), the game falls back
to monospace and stays fully playable.

## Updating the game

1. Replace `site/index.html` with the new build.
2. Update `CHANGELOG.md`.
3. Push to `main`. On Route A the workflow redeploys automatically.
4. Hard refresh the subdomain (Ctrl+F5) to beat cache, and play one
   round to smoke test: setup, budget, launch, report, sound
   toggle.

## Pre launch checklist

- [ ] One full round played on the real subdomain, desktop width.
- [ ] One full round played on a phone width screen, no sideways
      scrolling.
- [ ] Sound on and mute toggle both checked in a real browser (the
      build sandbox cannot hear WebAudio; a human ear is required).
- [ ] Report text readable; all results labeled simulated.
- [ ] README banner renders on the repo home page.
