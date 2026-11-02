# Respons - Requirements and Game Design Description

> Historical v1.0 contract. The original response-rate objective,
> scoring, scope limits, and proof-of-concept assumptions below have
> been superseded. Current requirements are documented in the
> [implemented update](evidence-fitness.md), [player guide](player-guide.md),
> and [development notes](development.md).

Version 1.0, 2026-10-30. Approved direction: Fabio Correa, by voice,
2026-10-30. Status: POC build authorized on this spec.
Companion doc: `gameplay-concepts.md` (the brainstorm record). Where
the two differed at that stage, this document governed the build.

## 1. Concept

Respons is a retro arcade style game that teaches Microsoft
Instrument Managers how to raise customer satisfaction survey
response rates.

It mirrors the Circuit Breaker cabinet: short, loud, replayable
rounds; one clear skill per round; instant feedback. The player sits,
in pixel form, at an instrument manager's desk. In front of the desk
is a track. Customer sprites walk the track from INVITED to FINISH.
Every design choice the player makes changes how many sprites finish,
where the rest wander off, and what the game says about why.

Format decision, locked for now:

- Web build first. One static web page, no accounts, no stored data.
- Handheld port later, only if the web version passes the fun gate in
  section 11. The POC is the gate. Nobody designs for handheld until
  the gate is passed.

## 2. Players and setting

- Player: an internal Microsoft Instrument Manager, the person who
  runs a customer satisfaction survey. The questionnaire is the
  instrument.
- Setting: a training and practice space. Simulated audiences only.
- Hard rule: no real customer data, no real email addresses, no real
  survey content, no connection to any live survey platform.
- Scale flavor, used in copy only: GCX sends about 3.5M survey
  invitations a year, in 45+ languages. The game is platform
  agnostic. Qualtrics XM is the real platform at work and is never a
  game mechanic, a level name, or a piece of art.

## 3. Objective

Raise the response rate: the share of invited customers who click
through the invitation email and complete the questionnaire.

The player learns, by playing, that response rate is won or lost in
exactly three places. Fabio's three levers, on screen at all times
as the game's three control panels:

1. AUDIENCE: who gets invited.
2. INVITATION: wording and click through appeal.
3. QUESTIONNAIRE: length, complexity, and whether the person asked
   can actually answer each question.

Any feature that fits no lever is out of scope.

## 4. Core loop (one campaign round, target 3 to 5 minutes)

1. BRIEF: a one line stakeholder request and a target. Example:
   "Support satisfaction, post case, beat 12% response rate."
2. AUDIENCE: pick 1 of 3 segments. Each shows size, persona mix,
   relevance, contact history, and starting goodwill.
3. INVITATION: pick 1 of 3 invite variants, and toggle reminders
   (0, 1, or 2). Each variant shows its subject line, sender, stated
   time ask, and whether it carries a why me line.
4. QUESTIONNAIRE: the instrument starts at 12 questions. The player
   trims, simplifies, or keeps each flagged question, and decides on
   escape options ("Don't know" / "Not applicable"). A live readout
   shows estimated minutes and goodwill cost before launch.
5. LAUNCH: press the big LAUNCH button. The funnel plays out in
   sprites (section 5). Sound on: launch jingle, then dings as
   sprites finish.
6. REPORT: Drop-off Detective report (section 8) and the two scores
   (section 9). One fix quest is issued for the next round.
7. GO AGAIN: replay the same round with the lesson applied, or move
   to the next level. Replay is one click. The game is built for
   "one more try."

## 5. The sprite funnel (signature scene)

- A horizontal track with four gates: INVITED, OPENED, STARTED,
  FINISH.
- 40 customer sprites spawn at INVITED, one per persona in the
  segment's mix, color coded by persona, each with a tiny patience
  meter overhead while inside the survey stretch.
- Between gates, sprites that drop off wander down off the track,
  with a small icon over the spot where they quit: an envelope icon
  for never opened, a clock for patience ran out, a question mark
  for a question they could not answer, a phone for mobile friction.
- Inside the survey stretch (STARTED to FINISH), question markers
  line the track. A sprite whose persona cannot answer the marked
  question stalls there: it either wanders off (abandon), shakes and
  turns grey, then finishes as a guess (data quality hit), or takes
  the side exit marked DK/NA if the player added escape options.
- Sprites reaching FINISH jump, flash, and trigger the completion
  ding. A running counter tallies completions like an arcade score.
- The animation runs about 20 to 30 seconds and is skippable to the
  report. It must never block a player who wants the numbers.

## 6. Mechanics

### 6.1 Goodwill budget (the breaker)

- Each segment carries goodwill, 0 to 100, shown as a breaker panel
  meter beside the segment. It persists across levels in the full
  game. In the POC it is shown and spent within the round.
- Spends: each question beyond a 6 question lean core costs 2. Each
  reminder costs 5. Each unanswerable question kept in the
  instrument costs 6 per affected persona group. English only into a
  non English segment costs 8.
- Earns: finishing at or under the stated time ask earns 5. A why me
  invite line earns 4. Closing the loop (a report back line in the
  invite) earns 4. Good timings (invite inside 7 days of the trigger
  event) earn 4.
- At zero goodwill the breaker trips: sprites stop spawning for that
  segment and the round ends early with the trip shown on the panel.
  In the POC, tripping caps the completion count and is called out
  in the report by name.

### 6.2 Personas (patience and knowledge)

| Persona | Sprite color | Patience (min) | Can answer | Cannot answer |
| --- | --- | --- | --- | --- |
| Busy executive | Gold | 2 | Outcomes, cost, overall satisfaction | Ticket detail, config facts |
| Frontline technician | Blue | 4, interruption prone | Product behavior, failure detail | Contract, licensing, spend |
| Partner admin | Green | 6 | Portal, licensing, entitlements | End user daily experience |
| IT decision maker | Purple | 5 | Architecture, deployment choices | Daily end user friction |
| End user | Orange | 5 | Own workflow, own friction | Org decisions, budgets |

Simulation rules:

- Patience is a clock. Total questionnaire time above a persona's
  patience makes abandonment likely from that point on, rising with
  each extra minute.
- Knowledge is a map. A question tagged outside the persona's map is
  an abandonment risk at that marker: without an escape option, 50%
  abandon and 50% guess (simulated split, tuned for teaching). With
  an escape option, most take the exit and still finish, with clean
  data.
- The same questionnaire must play visibly differently per persona.
  That difference is the lesson.

### 6.3 A/B test move

- Available from level 2 in the full game. In the POC it appears as
  a locked cabinet slot marked "LEVEL 2" so reviewers see the slot,
  and one optional comparison is shown in the report when the player
  replays with a different invite: this round versus last round.
- Full mechanic, specified now so the POC data model allows it:
  split the segment in two random halves, change exactly one
  variable, read both funnels, and accept "too close to call" when
  the gap is inside the uncertainty range for the sample size.

### 6.4 Questionnaire actions

Each flagged question card offers three moves:

- KEEP: full time cost, full goodwill cost, full data value.
- SIMPLIFY: half the time cost, plain language, slightly lower data
  value. Shown as the card getting shorter and brighter.
- CUT: no cost, no data. The card flies off the deck, arcade style.

Plus one global toggle: ADD ESCAPES (Don't know / Not applicable).
Costs a little time, removes most guessing, raises completion for
personas facing an unanswerable question.

### 6.5 Invitation variants (POC set)

1. GENERIC BLAST: generic sender, vague subject, no time ask, no
   why me. Cheap, low opens, goodwill neutral.
2. HONEST ASK: team sender, subject states the real minutes, why me
   line present. Higher opens, earns goodwill if the survey matches
   the stated time, spends extra goodwill if it overruns.
3. KNOWN NAME: a named sender the segment knows, why me line, closing
   the loop line. Highest opens, earns goodwill, costs coordination:
   only one use per round in the full game.

Reminders: each reminder converts a share of non openers and non
finishers, and spends 5 goodwill. The report prices each reminder.

### 6.6 Audience segments (POC set)

1. SUPPORT, FRESH: customers 3 days after a closed support case.
   High relevance, high goodwill (72). Mix heavy on technicians and
   end users.
2. SUPPORT, STALE: same population at 45 days. Same size, relevance
   faded, goodwill 58. The same choices score visibly worse.
3. EXECUTIVE BLAST: a broad list, low relevance, heavy on busy
   executives, goodwill 49, already surveyed twice this quarter. The
   trap pick: biggest N, worst rate.

## 7. Levels and progression (full game shape, POC proves level 1)

- Level 1, FIRST SEND: one clean segment, one trap question. Teaches
  the loop and the funnel. (POC scope.)
- Level 2, THE SPLIT: unlocks the A/B test move.
- Level 3, THE STAKEHOLDER: mid build, a stakeholder demands 8 extra
  questions. Accept, push back, or rotate modules.
- Level 4, THE TIRED LIST: a fatigued segment, low goodwill. Teaches
  recovery: short pulse plus closing the loop.
- Level 5, 45 LANGUAGES: the largest drop is a localization failure,
  visible only when the funnel is read by language.
- Level 6, THE BIG QUARTER: mixed segments, compounding goodwill,
  season scoring.

Difficulty raises persona impatience, lowers starting goodwill, and
adds questions that look valuable and are unanswerable for the
segment picked. Difficulty never raises reading load or hides the
reason for a drop. The Detective always tells the truth.

## 8. Drop-off Detective report (required content)

After every launch, in this order:

1. Funnel numbers: invites, opens, starts, completions, response
   rate, completion rate. Simulated and labeled simulated.
2. The three largest drops, each with: the gate or question, the
   persona most affected, the cause in one plain sentence, and the
   lever that fixes it (AUDIENCE, INVITATION, or QUESTIONNAIRE).
3. The goodwill ledger: what was spent, what was earned, the ending
   balance, and whether a reminder was worth its price.
4. Guesses flagged: how many completions were guesses at an
   unanswerable question, and what they cost on the quality score.
5. One fix quest for the next try, drawn from the largest
   recoverable drop.

## 9. Scoring

Two scores, always shown together. Fabio's rule: completion first,
quality second, and quality gates the win.

- RESPONSE SCORE (headline, 0 to 100): completions as a share of
  invites, scaled against the level target. Beating the target with
  rate alone maxes this score.
- DATA QUALITY SCORE (0 to 100): starts at 100. Minus 4 per guessed
  completion. Minus 3 per kept question that no persona in the
  segment can answer. Minus 2 per minute the real length overruns
  the invite's stated time ask. Plus 5 if escapes are on and used.
- WIN RULE: a round is won only when Response beats the target AND
  Quality is 60 or higher. A one question survey can post a huge
  rate and still fail, because cutting below the 6 question core
  drops Quality by 10 per missing core question. Gutting the survey
  is a losing strategy by construction.
- Grade: S, A, B, C, or TRY AGAIN, arcade style, with a fanfare only
  on a win.

## 10. Art and sound direction

Art:

- Pixel art, chunky and readable, 16 bit arcade cabinet feel. A
  limited palette: dark cabinet background, bright gate colors, five
  persona sprite colors from section 6.2.
- The hero set piece: a pixel instrument manager at a desk on the
  left of the track, who stamps the invite, hits LAUNCH with an
  oversized button, and reacts: fist pump on a win, head in hands
  when the breaker trips.
- Customer sprites: simple walk cycle toward FINISH, a wander off
  animation for drop off, a jump and flash at FINISH.
- Type: a pixel or monospace display face for scores and gates,
  plain readable type for report text. Report legibility beats
  theme. No tiny pixel text for anything a player must learn from.
- Motion is the feedback: every choice visibly changes the track,
  the meters, or the deck before launch, so the player predicts the
  run and then checks the prediction.

Sound (WebAudio, no audio files, mute toggle always visible):

- Launch jingle: short rising arpeggio.
- Completion ding: a coin style ding per sprite finish, rising in
  pitch as the combo grows.
- Wander off: a soft descending slide.
- Breaker trip: a buzz and a clunk.
- Win fanfare: 1 second, only on a win. Lose sting: short, never
  mocking.
- All sounds short, quiet by default, and off if the player mutes
  once. Sound is feedback, never decoration layered over reading.

Controls: mouse or touch. Big click targets. Keyboard optional:
number keys pick cards, space launches. A full round must be
playable with no instructions beyond the on screen prompts.

## 11. What the proof of concept must prove (the gate)

The POC implements one full round (level 1) with all three segments,
all three invites, a 12 question instrument with trims, the sprite
funnel, the Detective report, and both scores. It passes the gate
only if all six hold in Fabio's review:

1. FUN: a reviewer plays a second round without being asked.
2. LEGIBLE FUNNEL: after one round, the reviewer can say where the
   biggest drop happened and why, in their own words.
3. LEVER CLARITY: the reviewer can name which lever fixes that drop,
   unprompted.
4. PERSONA LESSON LANDS: the reviewer notices that the same survey
   played differently for executives and technicians.
5. NO GUTTING: a reviewer who cuts the survey to almost nothing sees
   a high rate and a failed quality gate, and understands why.
6. ROUND TIME: a full round, animation included, finishes inside
   5 minutes, and a replay inside 3.

Fail any one and the POC gets one revision round against that
criterion before the handheld conversation. Pass all six and the
handheld port becomes a real planning topic.

## 12. Technical requirements (POC)

- Single static web artifact. No backend, no accounts, no storage,
  no external calls at runtime.
- Runs in a desktop browser at 1280 px wide and remains playable on
  a phone width screen.
- Deterministic simulation with a visible seed concept: the same
  choices replay to near identical results, so rounds are comparable
  and workshop discussion is possible. Small random jitter is fine;
  contradictory outcomes on identical choices are not.
- All numbers labeled simulated, in the report and on the score
  screen.
- Accessible basics: color is never the only signal (persona icons
  differ in shape as well), mute works, animation is skippable,
  report text is real text.

## 13. Out of scope

- No real data, real sends, or platform integration of any kind.
- No handheld build, art pass, or store anything in the POC.
- No accounts, leaderboards, or saved seasons in the POC.
- No Microsoft product promotion. This is an internal training
  concept. Microsoft appears only as the employer's context.
- No incentives mechanic aimed at real respondents. In game
  incentives are not in v1 at all.

## 14. Risks and guardrails

- Teaching the wrong lesson: the sim must never reward misleading
  subject lines, hidden length, or pressure reminders without a
  visible goodwill price. Every dark pattern is priced on screen.
- False precision: lifts are shown as simulated outcomes on round
  numbers, never as promised real world percentages.
- Insider drift: copy stays in Instrument Manager language
  (instrument, segment, wave) and avoids program specific jargon a
  new hire would not know.
