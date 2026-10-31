# Question Bank and Insight Value (v1.5 design)

These are design notes, not the current scoring specification.
See the [player guide](player-guide.md) for current rules and
[development notes](development.md) for tested balance and implementation limits.

Fabio's direction, 2026-10-31: the survey structure stays similar
from game to game, but the question bank behind it must be very
large enough to vary the dealt instrument. Repeated seeds can repeat a draw.
The bank mixes
well-designed questions, methodologically incorrect questions, and
low-value questions that turn respondents off. The starting length of
the survey is a variable. And the goal is twofold: the response
rate AND business-valuable insight. A fast survey full of junk
questions is a loss with good response numbers.

## The bank (60+ questions)

Every bank question carries metadata:

- **Topic**: the business question it informs (see the agenda).
- **Tier**: WELL-DESIGNED, DEFECTIVE (one of the 11 defect classes
  in `question-defects.md`), LOW-VALUE, or FILLER.
- **Answerable by**: which personas can actually answer it.
- **Time**: seconds of respondent burden.
- **Redundancy group**: questions that ask the same thing twice.

Tier mix (approximate): 40% well-designed, 35% defective, 15%
low-value, 10% filler.

**Low-value questions** are a gameplay tier (internal key `stupid`).
They contribute no agenda insight. Some also have leading wording or
unsupported assumptions: vanity items ("How awesome are we, 1 to 10?"), blame items
("Why did you fail to read the manual?"), nosy irrelevancies
(income for a support survey), trivia the respondent never sees,
and exact duplicates of an earlier question. They carry zero
insight credit, cost goodwill in the funnel, and their fix is
almost always CUT. Respondents can smell them, and the game should
let players smell them too.

## Instrument generation

- **Same skeleton every game** (the structure Fabio expects):
  outcome core first, driver questions, one diagnostics block, the
  sensitive item late, one open-text closer, demographics last.
  This follows question-order practice: engaging and easy first,
  sensitive and demographic last.
- **Variable composition and length**: the seed draws 9 to 16
  questions into the skeleton from the bank. The brief states the
  dealt length ("The field office draft runs 14 questions").
- Level 1 keeps a hand-tuned default instrument for first play;
  every New Game deals fresh.

## The business agenda and Insight Value

Each level brief names required topics, for example: resolution
quality, customer effort, product reliability, renewal risk. The
third score, **Insight Value (0-100)**, credits a required topic
only when a question covering it is:

1. in the final instrument,
2. methodologically sound (clean, or defective and correctly
   fixed; an unfixed defect earns credit scaled down by the
   contamination the run actually showed),
3. answerable by the audience that was sent the survey,
4. answered by a finisher mix that includes the personas the
   topic is about (an exec topic answered only by end users is
   discounted).

Duplicates of a topic add a small increment the second time and
near zero the third. Non-required topics add small bonus credit.
Low-value questions add none and can subtract.

**Current win condition:** response strictly above target AND
Data Quality at 60+ AND Insight Value at 60+ (70+ in Level 6).
Level 4 also requires ending goodwill 35+.
These are game indices, not validated research metrics; response rate
uses completes/sent rather than AAPOR eligibility dispositions.
The report gains a VALUE panel: for every required topic,
ANSWERED CREDIBLY, ANSWERED WITH SUSPECT DATA, or LOST, with the
reason. "Fast and useless" becomes a named outcome: the run can
win the rate and still fail the level on value.

## Methodology anchors

- **Tourangeau's response process** (comprehension, retrieval,
  judgment, response mapping) organizes the defect classes:
  jargon, double-barreled, and negatives break comprehension;
  vague timeframes and recall overload break retrieval; leading
  and sensitive items distort judgment; broken options and grids
  break response mapping.
- **Groves and Peytcheva (2008)**: across 59 studies, response rate
  was a poor predictor of nonresponse bias (R-squared about 0.04).
  Who responds matters more than how many. That is the scientific
  spine of the Insight Value score and the finisher-mix rule.
- **Krosnick (1991)**: burden and difficulty drive satisficing,
  which is why length is a value variable, not just a rate one.
- **Pew Research Center**: one concept per question, neutral
  wording, pretesting. **Dillman**: respondent burden and the
  social exchange of the invitation.
