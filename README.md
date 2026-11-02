![Dear Valued Customer - a GCX instrument-management arcade](assets/banner.svg)

# Dear Valued Customer

**Code name: Respons.** A retro arcade training game for Microsoft
Instrument Managers in GCX (Global Customer Experience). Produce
evidence stakeholders can trust and use: balance response, representation,
data integrity, audience sustainability, and operational controls.
Response rate is a benchmark, not the campaign's win condition.

Produced by GCX. Created by Fabio Correa.

Practice space only. Simulated audiences, simulated results, no real
customer data, no real sends.

## Play it

The game uses one HTML file and a bundled pixel font. No server code
or player accounts are required.

- Local: open `site/index.html` in any modern browser.
- Production: <https://nice-mushroom-0bdb0ef0f.6.azurestaticapps.net>.
- Other hosts: run `node scripts/build-site.mjs` and publish `dist/`
  (see `docs/deployment.md`).

A round takes 3 to 5 minutes: pick an audience, prepare the list,
tune the invite, trim the questionnaire, launch, watch the sprites,
read the Drop-off Detective, go again.

## The game in one screen

- **Three levers, always on screen.** AUDIENCE (who gets invited),
  INVITATION (wording and click through appeal), QUESTIONNAIRE
  (length, complexity, answerability). Every action belongs to one.
  Any question may be cut until one remains; the last CUT is gray and
  disabled. Missing BRD coverage still penalizes results.
- **Two budgets.** Goodwill, the audience's patience with you, shown
  as a breaker panel. Credits, one pool of 120 per level (150 in
  Level 6), shared across all your attempts and spent on list
  preparation and execution. You cannot afford everything; that is
  the game.
- **Two ways forward.** After a round: TRY AGAIN and continue the
  level on the credits you have left, improving the process until
  you win or the money runs out, or NEW GAME for a fresh random
  questionnaire. It sounds like a cabinet too: original chiptune
  BGM and event effects, all synthesized inside the file.
- **A funnel you can watch.** Every recipient is simulated individually.
  Sprites show behavior cohorts labeled with their sizes (`×N`); the
  number of groups adapts and can exceed 40. All statistics use actual
  simulation records, not extrapolated animation counts. Cohorts walk
  SENT, DELIVERED, OPENED, STARTED, FINISH. A breaker trip stops new sends
  and interrupts anyone still in the funnel. Only completions before
  the trip count.
- **Five independent evidence checks.** Funnel execution, evidence fitness,
  data integrity, audience sustainability, and operational trust must
  all pass. Only cleaned, account-linked responses count toward the
  mission's sample and role requirements. A high response rate from
  the wrong population loses; a lower rate can yield usable evidence.
  The report continues through cleaning, matching, interpretation,
  publication, and action. Audience health carries across instruments
  until the whole campaign is reset.
  Seeded deals vary the questionnaire after the fixed first instrument;
  draws can repeat. Consult MPOR for the shared rules, BRD for the active
  study, and the report for observed defects and corrective actions.
- **Six levels.** First Send, The Split (A/B testing), The
  Stakeholder, The Tired List, Global Fieldwork, The Big Quarter.

The sample and coverage thresholds are teaching-game rules, not statistical
guarantees. Quick Challenges retain their own response, quality, Insight,
and BRD objectives.

## Documentation

| Doc | What it covers |
| --- | --- |
| [Player guide](docs/player-guide.md) | Controls, prices, evidence checks, mission thresholds, levels, and tips |
| [Evidence-fitness update](docs/evidence-fitness.md) | Implemented changes, campaign/Quick Challenge distinction, and model limits |
| [Question defects](docs/question-defects.md) | Defect classes, class-specific repairs, and post-response exclusions |
| [Novice UX](docs/ux-for-novices.md) | Teaching and accessibility criteria; automated versus human review |
| [Development](docs/development.md) | Simulation, audience continuity, legal winning fixtures, and balance |
| [Browser harness](scripts/harness/README.md) | Coverage, external tooling, Windows setup, and negative controls |
| [Deployment](docs/deployment.md) | CI, static packaging, live verification, and rollback |
| [Open work](TODO.md) | Remaining roadmap and verification gaps |
| [Handoff](HANDOFF.md) | Restart-critical state and next actions |
| [Changelog](CHANGELOG.md) | Completed changes and dated verification evidence |

### Historical designs

These snapshots explain earlier decisions; they do not override the
current player and development guides.

- [Original game concept](docs/game-concept.md)
- [Gameplay brainstorm](docs/gameplay-concepts.md)
- [Version 1.0 requirements](docs/requirements-game-design.md)
- [Version 1.1 mechanics addendum](docs/mechanics-update-v1.1.md)
- [Question-bank and Insight design](docs/question-bank-and-value.md)

## Repo layout

```text
assets/                README banner, local pixel font, and font license
site/                  Game HTML and Azure static-site configuration
scripts/               Packaging, gameplay, browser, and live deployment checks
.github/workflows/     Production deployment from main
docs/                  Design, play, development, deployment docs
```

## Status

- Production updates deploy through GitHub Actions on every push to `main`.
- Current update: five-part evidence fitness, usable-sample and role
  requirements, audience health across instruments, and reporting
  beyond completion. See the [release summary](docs/evidence-fitness.md).
- Gameplay release `3661c23` passed the
  [production workflow](https://github.com/fabioc-aloha/SurveyFunnel/actions/runs/41366863464)
  and independent live-package verification on 2026-11-01.
- Local full-harness and automated player-acceptance checks passed on
  2026-11-02 using existing approved browser tooling. The population and
  cut-rule changes remain unpublished. See the [changelog](CHANGELOG.md)
  for the tested scope and remaining human checks.
- A push is not proof of deployment. Check the
  [production workflow](https://github.com/fabioc-aloha/SurveyFunnel/actions/workflows/deploy-production.yml)
  and its live-package verification for the commit being played.

Internal training concept. Not a Microsoft product, not affiliated
with any survey platform. Survey results inside the game are
simulated and labeled as such.
