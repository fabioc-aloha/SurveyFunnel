# Question Defects: Field Guide

The questionnaire in Dear Valued Customer is a teaching instrument.
Each repairable question carries one primary defect from questionnaire
design practice and an in-game repair. The simulation models associated
measurement risks; it does not establish a unique cause for real survey data.
This guide is the contract between the game's questions, its
Drop-off Detective diagnostics, and its fix buttons.

## The defect classes

| # | Defect | What it looks like | Symptom in the funnel | Correct fix (price) |
| --- | --- | --- | --- | --- |
| 1 | Double-barreled | Two judgments, one answer ("support was fast and knowledgeable") | Hesitation, mid-scale mush, guesses | SPLIT into two questions (3) or cut one clause |
| 2 | Leading | Wording pushes an answer ("How excellent was...") | Inflated top-box scores, acquiescence | NEUTRALIZE the wording (2) |
| 3 | Jargon / acronym | Undefined terms (SLA, MTTR) a respondent may not share | Guesses from whoever lacks the term | DEFINE in plain words (2) |
| 4 | Vague timeframe | "Recently", "often", no recall window | Incomparable answers, quality loss | ANCHOR it ("in the last 30 days") (2) |
| 5 | Recall overload | Counting events over 12 months | Estimation guesses, busy personas bail | SHORTEN the window (2) |
| 6 | Beyond knowledge | Asking an end user for org-wide figures | Forced guesses, or escape if DK exists | CUT it (1), or add DK / NA escapes (2) |
| 7 | Double negative | "Do you disagree that support was not..." | Misreads, inconsistent answers | REWORD positive (2) |
| 8 | Broken options | Ranges that overlap, or no option that fits | Forced wrong picks, junk "Other" text | FIX the options (2) |
| 9 | Grid burden | A long rating matrix, worst on mobile | Straightlining, mobile abandonment | BREAK UP the grid (3) or cut rows |
| 10 | Sensitive, no assurance | Performance or security question, no confidentiality line | Refusals, socially desirable answers | ADD a privacy line (2) |
| 11 | Wordy stem | A paragraph where a sentence would do | Reading fatigue, satisficing | SIMPLIFY (2) |

Some questions are clean controls. They still impose respondent burden.
Core questions cannot be cut through the controls, and launches require
the minimum instrument size. Non-core cuts can lose agenda coverage.
Low-value items are a separate gameplay tier, not a claim that their
wording is methodologically sound.

## Rules the game enforces

- A fix only counts when it matches the defect. Simplifying a
  double-barreled question does not un-barrel it; simplifying a
  beyond-knowledge question does not give the respondent knowledge.
  The trim screen labels every fix button with the correct verb.
- The repair buttons are deliberately constrained teaching actions.
  Real revisions can combine wording changes, routing, response-option
  design, and pretesting. DK and NA permit different forms of item
  nonresponse; they do not validate answers.
- A confidentiality or privacy statement must describe actual
  protections. The game's example privacy lines are conditional, not
  promises that a researcher can insert without checking.
- Diagnostics stay honest. The Detective links a defect to a
  symptom only when the run produced that symptom (counts shown).
  A defect with no observed symptom is reported as a latent
  measurement risk, never as observed damage.
- Data quality flags trace to causes: guesses point at knowledge,
  jargon, and vagueness; straightlining points at grid burden;
  speeding points at total length; junk open text points at broken
  options; suspect top-box points at leading wording.
- In the campaign, cleaning removes duplicate, junk, speeder,
  straight-lined, and guessed responses once each, in that order.
  Account matching then excludes unmatched forwarded responses.
  Removed responses cannot satisfy role coverage or earn Insight.
- Other observed flags still affect the raw quality score and
  question-level diagnostics; not every flag removes a whole response.
  A repair cannot make an excluded response usable retroactively.
  See the [player guide](player-guide.md#scoring-and-winning) for the
  independent quality, retention, matching, and sample requirements.
- Quick Challenges retain their own response, quality, Insight, and
  BRD objectives rather than the campaign's evidence scorecard.

## Sources

- Pew Research Center, Questionnaire Design / Writing Survey
  Questions: ask one thing at a time, neutral rather than loaded
  wording, watch acquiescence and social desirability.
- Cochran (CDC), Survey Design: spell out acronyms, give a
  specific time frame for recall, avoid double-barreled questions,
  negative items, and biased items; response choices exhaustive
  and mutually exclusive.
- Krosnick (1991), satisficing theory, and the NORC / JMIR
  literature on its observable indicators: straightlining,
  speeding, and "don't know" misuse as data quality signals.
