# Changelog

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
