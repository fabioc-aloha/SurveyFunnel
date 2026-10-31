# UX for Novice Instrument Managers

The player is a novice IM learning the trade. Every screen has to
teach while it plays. These are standing requirements, checked on
every build, not a one-time polish list.

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
the three scores mean and one thing they would do differently.
