# Development Notes

## Shape of the build

The game is one HTML file (`site/index.html`) with inline CSS and
JavaScript and WebAudio generated sound. There is no framework, no
bundler, and no server. That is a deployment decision, not an
oversight: the game can be hosted statically or opened from disk.
The title font is bundled in `assets/`; keep it alongside `site/`
for offline play. The game sends no survey data.

Production packaging and syntax checks use Node without npm dependencies:
`node --test scripts/build-site.test.mjs`. The package contains only the
game, static-host configuration, font, and license. See
[deployment guidance](deployment.md) for CI/CD and live verification.

Campaign state lives in page memory and resets on reload. Sound and
hint preferences are saved in local storage; the game does not use
cookies or store survey responses.

## The simulation model

Deterministic by design. Given the same level and the same choices,
a round replays to the same funnel (with tiny jitter that never
flips an outcome). That property is load bearing: it makes rounds
comparable, workshops discussable, and balance testable.

Per round, the model runs in this order:

1. **Delivery.** Segment invalid rate, reduced by validation
   (full removes about 90% of invalids, partial about half, a
   catch all remainder always survives). Remainder splits into hard
   and soft bounces. Hard bounce rate drives Sender Reputation.
2. **Opens.** Base open propensity by segment relevance and invite
   variant, adjusted by reputation (spam folder effect), sender,
   why me line, and language match.
3. **Starts.** Click to start conversion, adjusted by the honesty
   of the stated time ask versus the real instrument length.
4. **Completions.** Each persona walks the instrument against two
   clocks: patience (minutes) and knowledge (per question tags).
   Outcomes per question: continue, abandon, escape (if escapes are
   on), or guess. Late survey effects add speeders and straight
   liners; skipped dedupe adds duplicates; open rates can add a
   forwarded response share.
5. **Goodwill and budget.** Spends and earns apply as specified in
   `mechanics-update-v1.1.md`. If goodwill reaches zero, the breaker
   stops new invitations and ends the run for anyone still in the
   funnel. Only completions before the trip count.
6. **Scoring.** Response score against the level target, data
   quality from the deduction table, and Insight Value from agenda
   coverage. Winning requires the response target, quality 60+,
   and Insight 60+ (70+ in Level 6); Level 4 also requires ending
   goodwill 35+.

## Balance invariants (test these after any tuning)

1. Lazy Level 1 default run: 2 completions from 40 sent (5%),
   below the 12% target, with a visible bounce problem. This is a
   clear miss, not a near miss.
2. Prepared mid budget run (validation, dedupe, Honest Ask, trim):
   wins inside 120 credits.
3. Executive Blast with no validation: worst run on the board.
4. Gutted survey (below the 6 question core): high rate, quality
   fail, no win.
5. Validation alone, bad questionnaire kept: still loses.
6. Identical choices replay identically.

## Tuning

All rates, costs, and persona numbers sit in one configuration
block at the top of the script. Change numbers there, never inside
the funnel logic. After any change, re run the six invariants above
and record the results in `CHANGELOG.md`.

## Adding a level

A level is data, not code: a brief, a target rate, a segment set,
an instrument variant, an event (stakeholder demand, fatigue,
localization), and a Detective voice line set. Follow the shape of
the existing six in `requirements-game-design.md` section 7, and
add the level's own invariant (what a correct strategy must score,
what the trap strategy must score) before shipping it.

## Known limits

- Sound is WebAudio synthesized; it cannot be verified in headless
  test environments. Human ear check is a release step (see the
  deployment checklist).
- The title uses the locally bundled pixel font with a monospace
  fallback; the game makes no external requests and remains playable offline.
- Persona behavior is tuned to feel plausible and teach the right
  trade offs. It is a teaching simulation, not a forecasting model,
  and the game labels its results simulated.
