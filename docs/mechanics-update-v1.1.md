# Respons - Mechanics Update v1.1

Addendum to `requirements-game-design.md` v1.0.
Requested by Fabio, 2026-10-31: add data quality issues, email
bounces, email validation (BrightVerify), and a limited campaign
budget covering preparation and execution. Trade offs are the point.

## 1. Design rule (unchanged)

Three levers stay: AUDIENCE, INVITATION, QUESTIONNAIRE. Nothing below
adds a fourth lever. List preparation lives inside the AUDIENCE
lever. Budget is a resource spent across all three, not a lever.

## 2. The campaign budget (new resource)

- Each round starts with 120 credits. The budget bar sits at the top
  of the setup screen and updates live with every choice. Unspent
  credits do not carry into the next round.
- Every meaningful action has a price, so the player allocates
  instead of maximizing everything:

| Action | Cost | Phase |
| --- | --- | --- |
| Send to Fresh or Stale segment | 30 | Execution |
| Send to Executive Blast (bigger list) | 45 | Execution |
| Email validation, full list | 12 (18 on Blast) | Preparation |
| Email validation, partial (riskiest half) | 6 | Preparation |
| Dedupe pass | 4 | Preparation |
| Suppression scrub (opt outs, surveyed in last 30 days) | 4 | Preparation |
| Localization review | 8 | Preparation |
| Honest Ask invite (copy work) | 4 | Execution |
| Known Name invite (coordination) | 10 | Execution |
| Generic Blast invite | 0 | Execution |
| Reminder, each | 8 | Execution |
| Simplify a question, each | 2 | Preparation |
| Cut a question, each | 1 | Preparation |
| Add a question from the optional bank, each | 3 | Preparation |
| Keep a question (do nothing) | 0 | Preparation |
| Add escapes (DK / NA) | 2 | Preparation |
| A/B test setup (Level 2) | 6 | Preparation |
| Stakeholder event: Rotate modules | 4 | Preparation |
| Stakeholder event: Accept the extras | 10 | Preparation |
| Report back line (Level 4 invite element) | 3 | Execution |
| Localized invite (Level 5, on top of localization review) | 4 | Execution |

Pricing rule (Fabio, 2026-10-31): every activity costs credit.
Simplify, add, remove, validate, scrub, remind: if the player does
it, it is priced. Doing nothing is the only free baseline (Keep a
question, the Generic invite). Prices apply to the final
configuration at launch, never per click, so changing your mind
before launch refunds the difference. The banner for this design
was also approved by Fabio on 2026-10-31.

Worked pressure: Blast (45) + full validation (18) + Known Name (10)
+ 2 reminders (16) + localization (8) + 3 simplifies (6) = 103 of
120. It fits, barely, and leaves nothing for error. A Fresh send with
light prep lands near 60 and wastes the rest. The tension is
reach versus hygiene versus polish, priced in the open.
- Overspend is impossible: choices grey out when the budget cannot
  cover them, and the bar shows what blocked them.

## 3. List health and bounces (AUDIENCE lever)

Each segment card gains a List Health line: the share of addresses
that are stale or invalid, and when the list was last cleaned.

- Fresh Support: 3% invalid, cleaned recently.
- Stale Support: 9% invalid.
- Executive Blast: 16% invalid, list assembled from old exports,
  never cleaned. The trap pick gets trapier.

The funnel gains a gate before OPENED: SENT, then DELIVERED.

- Bounced invites show as returned envelopes at the DELIVERED gate,
  split into hard bounces (address dead) and soft bounces (mailbox
  full, temporary).
- A bounce is a double loss: the send credit for that address is
  wasted, and hard bounces damage the Sender Reputation meter.
- Sender Reputation is a new meter next to goodwill. Start 90.
  Hard bounce rate above 5% of sends: reputation drops, and opens
  across the whole round fall because more mail lands in spam.
  Above 10%: a warning event fires ("Domain reputation at risk")
  and the open rate penalty doubles. In the POC the meter lives
  inside the round; in the full game it persists across rounds.
- Email validation (the BrightVerify step, labeled in game as
  "Validate emails (BrightVerify)") removes most invalid addresses
  before the send: full validation removes about 90% of the invalid
  share, partial about half. A small remainder survives validation,
  because catch all domains cannot be verified. The game says this
  out loud in the prep tooltip, since it is the real behavior.
- Skipping the suppression scrub has its own price: a few opted out
  or just surveyed contacts receive the invite anyway, shown as
  angry sprites at the INVITED gate, with a goodwill hit and a
  Detective callout. Skipping dedupe lets duplicate invites through:
  the same sprite gets two envelopes, answers once at best, and
  goodwill drops.

## 4. Data quality issues (inside the existing Quality score)

The Data Quality score gains named failure types, each with a cause
the player controls:

- Guessers: already in v1.0 (unanswerable question, no escape).
- Speeders: finish implausibly fast. Rate rises when the instrument
  is long and low relevance, because people click through to end it.
  Flagged completions count at half value in the quality math.
- Straight liners: same answer down a long grid. Keeping the heavy
  grid question raises their share; simplifying it lowers it.
- Duplicates: same respondent counted twice when dedupe was skipped.
- Forwarded link: the invite reaches someone outside the segment,
  their answers land in the data and hurt Sample Fit (shown in the
  report, scored under Data Quality).
- Junk open text: a share of open text answers are gibberish when
  patience ran out before the final question.

Quality deductions (added to the v1.0 table, all shown line by line
in the report): minus 2 per speeder, minus 2 per straight liner,
minus 3 per duplicate, minus 2 per forwarded response. Rates, not
counts, are displayed to the player (for example "7% speeders").

## 5. Drop-off Detective gains a section

Between the goodwill ledger and the guesses, the report adds
DELIVERABILITY AND DATA:

- Delivered versus bounced, hard and soft split, bounce rate.
- Sender Reputation before and after, with the open rate effect in
  plain words.
- Validation verdict: what validation would have saved, priced, if
  the player skipped it ("Validation at 12 credits would have
  removed most of the 1,600 dead addresses that bounced").
- Data quality flags with rates and their fixes, each mapped to a
  preparation buy or a lever.

## 6. Balance guards (must still hold after this update)

1. The default lazy run still near misses, and now also shows a
   visible bounce problem the player chose not to pay to fix.
2. A well prepared mid budget run still wins: validation plus
   dedupe plus an honest invite plus a trim must fit under 120.
3. Executive Blast without validation is the worst run in the game:
   bounce storm, reputation tanked, breaker at risk.
4. Validation alone cannot win a round. Hygiene fixes delivery,
   it does not fix an unanswerable questionnaire.
5. Zero prep spend remains possible and visibly punished, mostly
   through reputation and duplicates, not through hidden math.
