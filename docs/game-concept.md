# Respons - Game Concept

> Historical concept snapshot, superseded by the arcade implementation.
> The tile game, capacities, scoring, and pilot below are design history,
> not current features. See the [implemented update](evidence-fitness.md),
> [player guide](player-guide.md), and [development notes](development.md).

Code name: Respons
Working subtitle: Close the Circuit
Owner context: GCX (Global Customer Experience), Microsoft surveys in
Qualtrics, for customers, partners, and employees.

## Source model

Circuit Breaker is a tile placement race. Players build an electric
network, connect items to meet a secret objective, spend dice as
currency, and sabotage rivals, over four rounds. Respons keeps that
structure and swaps the house party for a feedback circuit.

## Core idea

A survey is a circuit. If any stretch is missing, the signal dies there
and no insight reaches a decision. If the circuit is overloaded, the
breaker trips and the audience stops responding at all.

## The board

Eight stations in a loop:

1. Invite
2. Attention
3. Start
4. Complete
5. Insight
6. Action
7. Trust
8. Back to Invite

Each player builds toward a target audience segment. Tiles must connect
in order. A gap is visible to everyone, which is the teaching point:
teams can point to the exact stretch where responses are lost.

## The breaker

Each audience segment has a load capacity printed on its card.

- Invite: +1 load
- Reminder: +1 load each
- Long survey (over 10 minutes): +2 load
- Duplicate invite from another team: +2 load
- Bad timing (quarter close, outage, launch week): +1 load

Exceed capacity and the breaker trips. Flip the segment card to Dark.
A dark segment gives no responses that round and costs 2 Trust to
restore. Three trips on one segment and it is out of the game.

## Tiles players can play

- Right Contact: play on Invite. No load for the first invite.
- Short Core: play on Start. Cuts survey load by 1.
- Mobile First: play on Start or Complete. Removes the mobile breakoff
  penalty.
- Localized: play on Attention or Start. Required for non English
  segments to score full points.
- In Product Moment: play on Invite. Invite lands inside a task the
  person already cares about.
- Sponsor Pre Notice: play on Attention. A known account or team
  contact announces the survey first.
- Save and Resume: play on Complete. A started survey can finish later
  without restarting.
- You Said We Did: play on Action to Trust. Raises the response rate
  of that segment next round, because people saw a result.

## Trip cards (the Fatigue Gremlin)

Drawn at the start of each round, or played by a rival in competitive
mode. In co-op mode they are drawn only.

- Wrong Contact: a segment tile cannot score this round.
- Quarter Close Timing: +2 load on enterprise segments.
- 22 Minute Survey: +2 load, and Complete needs an extra tile.
- English Only: Localized segments score half, rounded down.
- Broken Mobile Layout: Mobile First tiles are disabled this round.
- Duplicate Invite: pick a segment. It gains +2 load from another
  team's survey.
- No Visible Owner: Trust gain this round is zero. Nobody knows who
  will act on the answers.
- Broken Link: one Invite tile is removed.

## Secret objectives

Each player draws one. Examples:

- Partner voices in LATAM, fully localized.
- Frontline employees, mobile only.
- Enterprise customers 30 days after a support case.
- A segment that was over surveyed last quarter: win it back without
  tripping its breaker.
- Employee segment across time zones, with no segment left dark.

## Rounds and currency

Four rounds, one per quarter. Each round players roll six dice and
spend pips to buy tiles, exactly as in the source game. Unspent budget
does not carry over. That forces the real choice GCX faces every
quarter: spend on reach, on quality, or on closing the loop.

## Scoring

Per segment, per round:

- +3 per completed circuit
- +2 if the responding sample matches the segment profile
  (representativeness bonus)
- +1 if Insight is connected to Action in the same round
- +2 Trust bonus the first time You Said We Did is placed
- -1 per point of fatigue debt (load carried above half capacity)
- -3 per breaker trip

Highest score after four rounds wins. A player with the most raw
completions and two dark segments should lose to a player with fewer
completions and a healthy panel. That is by design.

## Two uses

1. Internal game. For GCX intake and training, and for stakeholder
   teams asking for a new survey. They feel the load trade off before
   they spend real audience trust.
2. Respondent facing skin in Qualtrics. Progress lights the circuit
   segment by segment as a person answers. The final screen shows the
   loop closing and states what happens with the input and when they
   will hear back. No game is layered over the questions themselves,
   so answers stay unbiased.

## Pilot

1. Paper prototype inside GCX was proposed; no prototype document
   accompanies this snapshot.
2. Fix balance: trips should hurt, and recovery should be possible.
3. A/B test two respondent facing elements in one live survey: the
   circuit progress bar and the closing screen.
4. Measure completion rate, breakoff point, time to complete, and
   representativeness against the current template. Report the sample
   profile alongside the headline rate, always.
