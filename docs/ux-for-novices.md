# UX for Novice Instrument Managers

The player is a novice IM learning the trade. Every screen has to
teach while it plays. These are standing review criteria, not a claim
that every criterion is automated or has passed. Current verification
and gaps are recorded in the [changelog](../CHANGELOG.md) and
[open work](../TODO.md).

## Teaching layer

- **Numbered flow.** Setup stages are numbered to match the three
  levers plus prep. A novice should never wonder what step they
  are on or what comes next.
- **Ready checklist.** Above LAUNCH, a live checklist shows what
  has been decided. It informs; it never blocks. Blocking a novice
  for skipping a step teaches resentment, not method.
- **MPOR (Master Plan of Record).** Every methodology term in the game
  (defect classes, DK/NA, Insight Value, satisficing) is one tap
  away from a plain-language entry. No leaving the game to learn.
- **Report diagnostics.** Reports show observed defects, lost agenda
  topics, and a fix quest. There is no separate coach banner or lesson recap.
- **Evidence before rate.** The campaign names all five independent
  checks, explains the usable sample and required roles before launch,
  and treats response rate as a benchmark. Status includes PASS or HOLD
  text, not color alone.
- **After completion.** CLEAN, MATCH, INTERPRET, PUBLISH, and ACT distinguish
  completed responses from usable evidence. A failed check states why
  publication is withheld and what to change.
- **Audience continuity.** A new instrument retains cohort health and
  contact history; the setup explains the whole-campaign reset boundary.
- **Study requirements.** Consult BRD on the setup screen opens the
  active study's Business Requirement Document: topics, respondent groups,
  acceptance gates, budget, and constraints. Shared game rules stay in MPOR.

## Legibility floor

- Arcade style, human readability: no critical text at tiny sizes,
  status never carried by color alone, real buttons with visible
  focus, mobile touch targets at least 40px, zero horizontal
  overflow at 390px.
- Every disabled control states why it is disabled.
- Motion respects `prefers-reduced-motion` (no shake, no confetti).
- Sound and hints are independent, persisted toggles. Hints off
  hides question explanations, never essential information (tags,
  prices, gates stay). MPOR remains available.

## The test

A build passes UX review only if a cold player can go from the
start screen to a launched round and a read report using nothing
but what the game itself shows them, and can say afterwards what
the evidence checks mean, why completion is not the same as usable
evidence, and one thing they would do differently. Quick Challenge
players should instead be able to explain that drill's BRD objectives.

The [browser harness](../scripts/harness/README.md) covers rendered
journeys and specific layout/event assertions. Cold-player understanding,
screen-reader use, physical-device behavior, and audio still need human
review; a passing Node suite is not evidence that these criteria passed.
