![Dear Valued Customer - a GCX response rate arcade](assets/banner.svg)

# Dear Valued Customer

**Code name: Respons.** A retro arcade training game for Microsoft
Instrument Managers in GCX (Global Customer Experience). It teaches
how to raise customer satisfaction survey response rates: the share
of sent invitations that result in a customer clicking through and
completing the questionnaire.

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
- **A funnel you can watch.** Up to 40 persona sprites walk SENT,
  DELIVERED, OPENED, STARTED, FINISH. A breaker trip stops new sends
  and interrupts anyone still in the funnel. Only completions before
  the trip count.
- **Three scores.** Response rate first, data quality second,
  Insight Value third, and all three gate the win: beat the rate
  target with a gutted or off-agenda survey and you still lose.
  The 64 question bank deals a different instrument every game,
  and a coach, a field guide, and a one-lesson recap teach the
  trade as you play.
- **Six levels.** First Send, The Split (A/B testing), The
  Stakeholder, The Tired List, 45 Languages, The Big Quarter.

## Documentation

| Doc | What it covers |
| --- | --- |
| `docs/player-guide.md` | How to play: controls, budget price table, scoring, level list, tips |
| `docs/requirements-game-design.md` | Requirements and Game Design Description v1.0: the design contract |
| `docs/mechanics-update-v1.1.md` | The v1.1 addendum: budget, bounces, BrightVerify validation, sender reputation, data quality failures |
| `docs/gameplay-concepts.md` | The brainstorm record behind the design |
| `docs/game-concept.md` | The earlier Circuit Breaker framing, kept for history |
| `docs/development.md` | How the single file game is put together, the simulation model, and how to tune balance |
| `docs/deployment.md` | Production hosting, GitHub Actions, packaging, verification, and rollback |
| `CHANGELOG.md` | Version history |

## Repo layout

```text
assets/                README banner, local pixel font, and font license
site/                  Game HTML and Azure static-site configuration
scripts/               Packaging tests and live deployment checks
.github/workflows/     Production deployment from main
docs/                  Design, play, development, deployment docs
```

## Status

- Production updates deploy through GitHub Actions on every push to `main`.
- v1.6 (2026-10-31): breaker send limits, corrected response-rate
  accounting, visible question repairs, distinct A/B variants, and
  offline font rendering. See `CHANGELOG.md` for earlier releases.

Internal training concept. Not a Microsoft product, not affiliated
with any survey platform. Survey results inside the game are
simulated and labeled as such.
