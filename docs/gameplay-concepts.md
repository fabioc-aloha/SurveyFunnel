# Respons - Gameplay Concepts

> Historical brainstorm, 2026-10-30. Features and scoring below were
> proposals at that time, not a description of today's build. See the
> [implemented update](evidence-fitness.md), [player guide](player-guide.md),
> and [development notes](development.md) for current behavior.

Draft for Fabio's review, 2026-10-30; nothing had been built at that stage.
It superseded the competitive tile framing in `game-concept.md` where the
two differ. The circuit and breaker imagery stays, as visual language
for goodwill and drop off.

## 1. Who plays, and what winning means

Player: a Microsoft Instrument Manager, the person who runs a customer
satisfaction survey. In GCX language the questionnaire is the
instrument.

Job in the game: launch simulated survey campaigns and lift the
response rate, meaning the share of invited customers who click
through the invitation email and complete the survey.

It is a practice space. No real customer data, no real sends, no
consequence for a failed round except a burned simulated audience and
a clear explanation of why it burned.

Context the simulation is scaled on, stated once so the numbers feel
real: GCX sends about 3.5M survey invitations a year, in 45+ languages.
The game itself stays platform agnostic. Qualtrics XM is the real
platform at work; the game never names a vendor feature as a mechanic.

## 2. The three levers (the whole game)

Every player action belongs to one lever. Keeping the scope to three
is the discipline.

1. Audience selection: who gets invited.
2. The invitation: wording and click through appeal.
3. The questionnaire: length, complexity, and answerability.

If a proposed feature fits none of the three, it stays out of v1.

## 3. Core loop: the campaign round

One round is one survey launch, about 5 minutes of play.

1. Brief: a stakeholder request arrives. Example: measure satisfaction
   after support cases, this quarter, in six markets.
2. Pick an audience segment (Lever 1).
3. Tune the invitation (Lever 2).
4. Build or trim the questionnaire (Lever 3).
5. Send: the simulation runs.
6. Funnel report: invites sent, opens, starts, completions, with the
   drop off points marked.
7. Drop-off Detective debrief (section 7).
8. Carry forward: goodwill, fatigue, and sample history persist into
   the next round.

A season is 6 rounds across mixed segments. Choices compound. A
segment blasted in round 1 answers round 4 at a lower rate unless the
player repaired goodwill in between.

## 4. Lever 1: audience selection

Each segment card shows:

- Size and persona mix
- Relevance: how many members had the experience being measured
- Recency: time since the trigger event (support case closed,
  onboarding finished, renewal signed)
- Contact history: surveys received in the last 90 days
- Languages needed
- Goodwill level carried in

Trade offs the player must feel:

- Broad blast: large N, low relevance, low rate, high goodwill spend
  across the whole segment.
- Tight targeting: smaller N, high relevance, high rate. Risk: the
  sample skews, and the Sample Fit score (section 9) falls.
- Right person problem: surveying the account owner about a hands on
  experience the technician lived. Relevance reads zero for that
  persona, however good the invite is.
- Re surveying a fatigued segment can still be the right call, if the
  player pays for it with a shorter instrument and a visible closing
  of the loop from the last wave.

## 5. Lever 2: the invitation

The player assembles the invite from real choices, each with a cost
and an effect:

- Sender: a named person the customer knows, a product team alias,
  or a generic survey mailbox. Known sender raises opens and costs
  coordination time.
- Subject line: pick from variants or assemble one. Honest time ask
  ("4 minutes") beats a vague ask. A subject that overpromises raises
  opens and lowers completions, because people feel misled at page 1.
- Why me: one sentence tying the invite to the customer's own recent
  experience. This is the strongest single click lever in the game.
- What happens with answers: name the decision the survey feeds and
  when customers hear back. Feeds Trust and the next round.
- Deadline and reminders: each reminder recovers some non responders
  and spends goodwill from everyone who already answered or decided
  to pass. Reminder timing is a choice, not a default.
- Language: invite in the customer's language, or English only with a
  penalty the player can see before sending.

## 6. Lever 3: the questionnaire

The instrument is built from question cards. Each card shows:

- Time cost in seconds
- Knowledge tag: who can actually answer this (see personas, section 8)
- Complexity: single choice, grid or matrix, ranking, open text
- Decision value: what decision this question informs
- Plain language rating

Player actions:

- Trim: cut a question, save time, lose that data point.
- Simplify: split a double barreled question, replace jargon, shorten
  a grid. Costs build time, lowers abandonment.
- Add an escape: "Don't know" or "Not applicable" options. Completion
  rises and junk answers fall, because people stop guessing.
- Rotate modules (added mechanic): split optional question blocks
  across random sub samples. Every topic gets covered, nobody answers
  everything, per person length stays short. This is a real
  methodology lever and the game should teach it early.
- Localize properly: a literal translation card is cheap and raises
  abandonment in that language. A reviewed localization costs more
  and removes the penalty.

The stakeholder pushback event: mid build, the stakeholder asks to
add 8 more questions "while we are asking anyway." The player can
accept and spend goodwill, push back and spend stakeholder trust, or
move the extras into a rotating module. There is no free option. This
one event teaches the length trade off better than any tutorial text.

## 7. Drop-off Detective (the feedback system)

After each send, the funnel is clickable. Every drop point gives a
cause in plain words, tied to a persona and a question.

Worked example (simulated numbers):

- Invites sent: 10,000
- Opens: 3,100 (31%)
- Starts: 1,850 (60% of opens)
- Completions: 920 (50% of starts)
- Response rate: 9.2%

Detective findings on that round:

- Opens low for the executive persona: subject line gave no reason
  tied to their experience. Lever 2 fix.
- 38% of technician starts quit at Q14. Q14 asks for contract values
  only a partner admin can see. The question was unanswerable for the
  persona being asked. Lever 3 fix: retarget the question or add an
  escape.
- Grid fatigue: the Q9 matrix took a median 90 seconds on mobile.
  Starts on phones quit at twice the rate of desktop starts there.
- Reminder 2 recovered 140 completions and cost 6 goodwill across
  the segment. The report prices the reminder, so the player decides
  if it was worth it.

The debrief ends with one suggested fix quest for the next round,
generated from the largest recoverable drop. The player can take a
different path; the game tracks whether the diagnosed drop moved.

## 8. Personas and goodwill (the engine under all three levers)

Personas make the same instrument play differently.

| Persona | Patience | Knows | Cannot answer | Channel |
| --- | --- | --- | --- | --- |
| Busy executive | About 2 minutes, low tolerance for detail | Outcomes, cost, strategic fit | Operational detail, ticket level facts | Desktop, between meetings |
| Frontline technician | Short, interruption driven | Hands on product behavior, failure detail | Contract and licensing terms | Mobile, often mid task |
| Partner admin | Moderate | Portal, licensing, entitlements across customers | End user day to day experience | Desktop |
| IT decision maker | Moderate | Architecture, deployment, vendor choices | Daily end user friction | Desktop |
| End user | Varies | Own daily workflow and friction | Org level decisions, spend | Mixed |

Two persona rules drive the simulation:

1. Patience is a clock. When a persona's time budget runs out mid
   survey, they abandon at that question. The funnel shows where.
2. Knowledge is a map. A question tagged outside a persona's map has
   three outcomes: abandon, pick the escape option if one exists, or
   guess. Guesses complete the survey and damage the Data Quality
   score, which is worse than an honest abandonment. The game says so.

Goodwill is the breaker panel, restated:

- Each segment carries a goodwill meter, 0 to 100, across the season.
- Every extra question beyond a lean core spends it. Every repeat
  invite and reminder spends it. An unanswerable question spends a
  lot, because it tells the respondent their time was not respected.
- Shorter instruments, a clear why me, an honest time ask, and
  reporting back what changed last time earn it back.
- At zero, the breaker trips: the segment stops opening invites for
  the rest of the season, and the player must run a recovery round
  (short pulse, visible closing of the loop) or work other segments.

## 9. A/B testing mechanic

Unlocks in round 2, after the player has run one campaign clean.

- Split a segment into two random halves.
- Change one variable only: subject line, sender, time ask, survey
  length, or one question's wording. The game blocks a second change
  and explains why.
- Results show both rates with an uncertainty range, plus the sample
  size behind each.
- Small differences on small samples read as "too close to call,"
  and the game rewards the player for accepting that answer and
  running a larger test, instead of declaring a false winner.
- A confirmed winner becomes the player's saved template for the
  rest of the season, so good methodology compounds.

## 10. Scoring (Respons Score)

Per round, then totaled for the season:

- Response rate and completion rate: the headline.
- Sample Fit: how closely the responding sample matches the intended
  audience profile. A high rate from the wrong people scores low.
- Data Quality: completions minus guessed answers, mis targeted
  questions, and speeding flags.
- Goodwill Remaining: the season is scored on the audience's health
  at the end, so burning a segment for one big round loses.

Leaderboards, if used in a workshop, rank on Sample Fit and Data
Quality first. Rate alone never tops the board.

## 11. Modes

1. Solo practice: 10 minute scenarios, one segment, one problem
   (low opens, mid survey abandonment, fatigued audience).
2. Workshop mode: teams get the identical scenario and seed, make
   their choices, then compare funnels side by side in debrief. The
   learning lives in why the funnels differ.
3. Scenario of the week: one shared scenario for all Instrument
   Managers, rotating through the drop off patterns GCX sees most.
   Same seed, so results are comparable and discussable.

## 12. Added concepts worth testing

- Preview as a persona: before sending, walk the instrument as a
  chosen persona in a 60 second simulation. The player watches the
  patience clock drain and hits the same wall the persona will hit.
- The stakeholder negotiation in section 6, as a recurring role, with
  a stakeholder trust meter alongside goodwill.
- Language as a first class path: one scenario per season where the
  largest drop is a localization problem, findable only by reading
  the funnel by language.
- Recovery campaign as a playable round type, not a penalty screen:
  win back a dark segment with a 3 question pulse and a report back.

## 13. Simulation honesty

- All results are simulated ranges, tuned to feel plausible, and
  labeled simulated in the game.
- The simulation rewards directionally sound practice. It never
  presents a tactic as a guaranteed lift with a precise percentage.
- Persona behavior comes from aggregate patterns, never from real
  customer records.

## 14. Open questions for Fabio

1. Solo first, or workshop first? Section 11 orders solo first
   because it is cheaper to test, but the workshop may be where the
   value is.
2. Should stakeholder trust be a full second meter, or an event only?
3. Is the A/B test a round 2 unlock, or core from the start, given it
   is real methodology practice and not a bonus feature?
