# Changelog

## Unreleased

### 2026-10-31 - Production deployment automation

- Created dedicated Free-tier Azure Static Web Apps hosting in
  GCX Prod, East US 2, with a public HTTPS hostname.
- Added GitHub Actions deployment from `main`, restricted to the
  production environment, with pinned actions and an app-scoped secret.
- Added dependency-free packaging tests and live checks for deployed
  bytes, font MIME type, response headers, and unpublished documentation.
- Updated hosting, packaging, rollback, local font, and scoring guidance.

### 2026-10-31 - Start screen and Field Guide

- Updated the producer branding and creator credit.
- Removed introductory and footer copy from the start screen.
  Centralized instructions and simulation/privacy information in
  the Field Guide.
- Bundled the pixel title font and its license locally.
- Field Guide opens at the top, including after scrolling and
  reopening, without losing keyboard focus on the close button.
- Included these changes and the v1.6 fixes in commit `8f05952`,
  pushed to `main`. Deployment was not verified.
- Browser checks passed for first-open and reopened guide scroll
  position, close-button focus, button close, and Escape close.
  All three inline scripts passed `node --check`; `git diff --check`
  passed. These checks are not yet a tracked regression suite.

## v1.6 - 2026-10-31 - Breaker and instrument fixes

- Goodwill breaker trips stop future invitations at the stated
  cutoff and stop everyone still in the funnel. Only completions
  before the trip count. Reports count response rate and A/B sample
  sizes from invitations actually sent.
- Question repairs now show the corrected wording or split items in
  the instrument.
- A/B arms cannot use the same invite. Removed the external font
  requests and retained the local monospace fallback.
- Updated the documented Level 6 budget and measured Level 1
  default outcome.

## v1.5 - 2026-10-31 - Big bank, Insight Value, novice UX

- Question bank expanded to 64: 26 clean, 22 defective (two per
  defect class), 10 stupid turn-off items, 6 filler. Instruments
  deal 9 to 16 questions into the same A-F skeleton by seed.
- Insight Value, the third score: per level agendas of required
  topics, credited only when asked soundly, answerable by the
  audience, and answered by the right personas. Winning now needs
  rate, quality 60+, and Insight 60+ (70+ in the finale). A run
  that passes rate and quality but fails Insight is stamped FAST
  AND USELESS, and the report verdicts every topic.
- Novice learning layer: Marge the coach (one tip per stage),
  numbered setup steps, a non-blocking ready checklist, an in-game
  field guide, a ONE LESSON recap per report, and a hints toggle.

## v1.4 - 2026-10-31 - Defect taxonomy audit

- Every question carries one of 11 research-grounded defect
  classes (or is a labeled clean control), its text genuinely
  exhibits the defect, and its fix button is the class-correct
  remedy at its price. Beyond Knowledge has no wording fix.
- Detective diagnostics report each defect OBSERVED with real
  counts or LATENT, and data quality flags trace to their classes.

## v1.3 - 2026-10-31 - Two option flow and soundtrack

- Two options after every round: TRY AGAIN continues the level on
  a shared, non refilling credit pool (prep purchases, instrument
  edits, goodwill, and reputation persist; each new send, per send
  invite, reminders, and new edits are charged again; re-sends cost
  4 goodwill; segment locked mid chain), or NEW GAME restarts with
  a new random questionnaire.
- Random questionnaires: 18 question bank, draw 12, traps
  reassigned, times jittered, reproducible INSTRUMENT #XXXX seed
  in setup. Level 1 keeps its hand tuned instrument for first play.
- Budget under 30 credits with the target unmet ends the level as
  FAILED; won levels record a budget bonus.
- Original procedural chiptune BGM (title, setup, run variants of
  one motif, Level 6 harmony) and a full event wired effects set,
  with a SOUND panel, M key mute, saved preferences, and preview
  buttons. All audio synthesized in the single file.

## v1.2 - 2026-10-31 - Full campaign, deployment ready

- Six level campaign: First Send, The Split (A/B test move), The
  Stakeholder, The Tired List, 45 Languages, The Big Quarter, with
  level unlocks and season scoring.
- Cabinet banner for the README (`assets/banner.svg`).
- Documentation set completed: player guide, deployment guide
  (Azure Static Web Apps plus fallbacks), development notes.
- Game packaged as a deployable single file at `site/index.html`.

## v1.1 - 2026-10-31 - Dear Valued Customer

- The game gets its name: **Dear Valued Customer** (code name
  Respons in small print).
- Polish pass: start screen, 3-2-1 launch countdown, 1x / 2x run
  speed, cabinet shake on breaker trip, win confetti, best grade
  tracker, patience warning on the trim screen, persona legend
  during the run, animated grade stamp.
- Campaign budget: 120 credits per round across preparation and
  execution, itemized, with budget grey outs.
- Deliverability: segment List Health, a DELIVERED gate with hard
  and soft bounces, Sender Reputation meter and domain reputation
  warning.
- Email validation step labeled Validate emails (BrightVerify):
  skip, partial, or full, with the catch all caveat stated in game.
- Data quality failures named and priced: guessers, speeders,
  straight liners, duplicates, forwarded responses, junk open text.
- Drop-off Detective gains a Deliverability and Data section.

## v1.0 - 2026-10-30 - Proof of concept

- One full round: 3 segments, 3 invites, priced reminders, 12
  question trim with Keep / Simplify / Cut and escapes, sprite
  funnel, Drop-off Detective report, response and quality scores
  with the quality gated win rule.
- Verified: deterministic replay, lazy run near miss at 10%, well
  trimmed run wins at 20%, gutted survey fails on quality,
  Executive Blast trips the breaker.
