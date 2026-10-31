# SurveyFunnel

Project home for **Respons**, a retro arcade style training game for
Microsoft Instrument Managers in GCX (Global Customer Experience).
The game teaches how to raise customer satisfaction survey response
rates: the share of invited customers who click through the
invitation email and complete the questionnaire.

Practice space only. Simulated audiences, no real customer data.

## Start here

- `docs/requirements-game-design.md` - Requirements and Game Design
  Description v1.0 (2026-10-30): concept, players, objective, core
  loop, mechanics, scoring, levels, art and sound direction, and the
  6 gate criteria the proof of concept must pass.
- `docs/gameplay-concepts.md` - the brainstorm record: campaign
  rounds, goodwill budget, personas, A/B testing, Drop-off Detective.
- `docs/game-concept.md` - the earlier Circuit Breaker framing,
  kept for history.
- `game/respons-poc.html` - the playable web proof of concept, one
  full Level 1 round as a single self contained HTML file. Open it in
  a browser and play.

## The three levers

Every mechanic belongs to one of these, by design:

1. Audience selection: who gets invited.
2. The invitation: wording and click through appeal.
3. The questionnaire: length, complexity, answerability.

## Status

- 2026-10-30: requirements doc approved direction, web POC built and
  verified in balance checks (untouched survey near misses at 10%,
  a well trimmed survey wins at 20%, a gutted survey fails on data
  quality). The 6 gate criteria await the owner's playtest.
- Web first. A handheld port is a later decision, only if the web
  version proves fun.
