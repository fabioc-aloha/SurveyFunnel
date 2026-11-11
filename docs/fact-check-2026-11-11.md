# Game fact-check audit, 2026-11-11

Read-only audit of every checkable factual claim in the player-facing copy
(site/index.html: field guide, BRD, setup panels, report templates),
docs/player-guide.md, and the design docs' real-world claims. Audited at
local HEAD 59ccbd6 (same content as production 41e831c5). No game code,
tests, or copy were changed by this audit.

Method: each claim graded against its proper source of truth, in the
owner's order: primary source, practitioner-measured, third-party study
(named and dated), competitor-published (bias noted), estimate,
unverified. A claim is only marked checked if the source was actually
opened during the audit. Web sources were opened on 2026-11-11.

## Headline answers

1. **Is any named citation's number wrong? No.** The only statistic any
   citation carries is Groves and Peytcheva (2008): 59 studies and
   R-squared about 0.04. Both figures are exactly what the paper says
   (see finding A1).
2. **Does any copy state a game abstraction as if it were a real-world
   fact? No.** Results are framed as simulated everywhere they appear,
   and level targets are labeled game benchmarks, never industry
   benchmarks. The nearest misses are two wordings about the email
   validator in the report's bounce-back panel (findings B2 and B3),
   which are vendor-behavior claims, not simulation claims.
3. **Does the player guide match the code on every price? No.** Every
   price the guide lists is correct, but its price table omits two
   priced actions that exist in the game: the Report back line (3 cr,
   Level 4) and the Localized invite (4 cr, Level 5). See finding D2.

## Totals

32 claims graded: 26 SUPPORTED, 1 WRONG, 3 MISLEADING, 2 UNVERIFIABLE.

| Class | Checked | Supported | Wrong | Misleading | Unverifiable |
| --- | --- | --- | --- | --- | --- |
| A. Research citations | 9 | 7 | 0 | 0 | 2 |
| B. Vendor behavior (BriteVerify) | 4 | 1 | 1 | 2 | 0 |
| C. Owner-scale facts | 2 | 2 | 0 | 0 | 0 |
| D. Game describing itself | 14 | 13 | 0 | 1 | 0 |
| E. Simulation honesty | 3 | 3 | 0 | 0 | 0 |

## Findings: WRONG

### B1. The validator's name is misspelled everywhere it appears

- Claim: the product is called "BrightVerify" (5 occurrences in
  site/index.html: the budget panel prep line in budgetMath, both
  validation rows in renderPrep, BB_CAUSE_LABEL, and the bounceBacksHTML
  cause line; 2 in docs/player-guide.md lines 65 and 121; 3 in
  docs/mechanics-update-v1.1.md lines 12 and 141-142). The correct
  spelling, "BriteVerify", appears 0 times in site/index.html and the
  player guide.
- Source checked: Validity's own documentation at knowledge.validity.com
  ("Verify"; "What do the different statuses in List Validation mean?").
  The product is BriteVerify, by Validity.
- Minimal fix: rename "BrightVerify" to "BriteVerify" in site/index.html
  and docs/player-guide.md (the mechanics update is a historical doc;
  fixing it is optional).

## Findings: MISLEADING

### B2. Bounce-back label says the validator "marked it deliverable"

- Claim: "Catch-all pass · BrightVerify marked it deliverable because
  the domain accepts all mail" (site/index.html, BB_CAUSE_LABEL).
- Source checked: knowledge.validity.com, List Validation statuses.
  BriteVerify does not mark accept-all addresses deliverable or valid.
  It returns a separate status, accept_all, classed as Risky:
  "Indicates that this domain always says their email addresses are
  valid, even if they aren't... Proceed with caution. We consider this
  a risky email, and there's a fair chance it will bounce."
- Minimal fix: relabel to "Accept-all pass · BriteVerify flagged it
  accept_all: the domain accepts all mail, so the mailbox itself stays
  unconfirmed."

### B3. Full-validation note calls every remaining bounce "catch-all residue"

- Claim: "Validation removed every address it could verify. What is
  left is the catch-all residue: real lists keep a small share of these
  no matter how well they are cleaned" (site/index.html,
  bounceBacksHTML, full-validation note). The note is printed for all
  bounces, including soft bounces (mailbox full, temporary server
  failure), which are not invalid addresses and not catch-all residue.
- Source checked: the game's own bounce model in computeBounceBacks,
  which lists soft bounces with mailbox-state reasons; Validity's
  status definitions (accept_all concerns address existence, not
  mailbox state).
- Minimal fix: scope the note to hard bounces, e.g. "The hard bounces
  left are the catch-all residue..."

### D2. Player guide price table omits two priced actions

- Claim: the price table in docs/player-guide.md ("Prices", following
  line 116) presents itself as the game's price list. It has no row
  for the Report back line or the Localized invite, and neither action
  is mentioned anywhere else in the guide.
- Source checked: site/index.html budgetMath (rbCharge 3 at line 1912,
  langCharge 4 at line 1913), the Level 4 panel ("REPORT BACK LINE ·
  3 CR", line 2081), and report copy quoting both prices (3 cr at
  line 3705, 4 cr at line 3711). Every price the table does list was
  verified against the code and is correct (see D1).
- Minimal fix: add two rows, "Report back line (Level 4) | 3" and
  "Localized invite (Level 5) | 4". Minor related gap: the send row
  says "Fresh or Stale, 30"; Tired and Global also cost 30, so no
  number is wrong, but the row could read "any segment except
  Executive Blast".

## UNVERIFIABLE

- **A8. "The NORC / JMIR literature" on satisficing indicators**
  (docs/question-defects.md, Sources). No specific work is named, so
  there is nothing to open. The indicators themselves (straightlining,
  speeding, "don't know" misuse) are consistent with the literature;
  straightlining (nondifferentiation) and DK responding are named in
  Krosnick (1991) itself. Fix if desired: name one specific paper.
- **A9. AAPOR definitional contrast** (MPOR in site/index.html: the
  game's response rate is "not an AAPOR response rate: eligibility and
  full case dispositions are not modeled"; similar mentions in
  docs/player-guide.md and docs/development.md). AAPOR's Standard
  Definitions were not opened during this audit, so the contrast is
  recorded as unverified rather than checked. Risk is low: the copy
  claims less than the standard, not more.

## SUPPORTED claims (compact ledger)

| # | Claim | Location | Source checked |
| --- | --- | --- | --- |
| A1 | Groves and Peytcheva (2008): across 59 studies, response rate was a poor predictor of nonresponse bias (R-squared about 0.04) | docs/question-bank-and-value.md, Methodology anchors | The paper itself, Public Opinion Quarterly 72(2), 167-189, p. 174, via verbatim quotation in Nix et al. (2017) and the annotated bibliography at homes.ori.org; study count and 959 estimates corroborated by the Scottish Government methods review (gov.scot). The publisher page returned 403 on direct open; the figure rests on two independent verbatim quotations of the primary text. Note: the R-squared is from a naive OLS fit of response rate against absolute relative nonresponse bias; the game's plain rendering is fair. |
| A2 | Krosnick (1991): burden and difficulty drive satisficing | docs/question-bank-and-value.md; docs/question-defects.md; site/index.html flag rows | Publisher abstract, Wiley Online Library: Krosnick, "Response strategies for coping with the cognitive demands of attitude measures in surveys", Applied Cognitive Psychology 5(3), 213-236 (1991). Satisficing under cognitive effort, with task difficulty a named factor. |
| A3 | Satisficing indicators: straightlining, speeding, DK misuse | docs/question-defects.md, Sources; site/index.html DEFECT_INFO header comment | Krosnick (1991) abstract names nondifferentiation (straightlining) and saying "don't know". Speeding is a later operationalization; the doc sentence attributes the indicators jointly to Krosnick and the NORC / JMIR literature, which covers it (see A8). |
| A4 | Pew: one concept per question, neutral wording, pretesting; one thing at a time, watch acquiescence and social desirability | docs/question-bank-and-value.md; docs/question-defects.md | Pew Research Center, "Writing Survey Questions" (pewresearch.org), opened in full: "ask only one question at a time... (known as double-barreled questions)", exhaustive and mutually exclusive options, double negatives and jargon to avoid, acquiescence bias named, "Pretesting a survey is an essential step". |
| A5 | Tourangeau's response process: comprehension, retrieval, judgment, response mapping; defect classes mapped to stages | docs/question-bank-and-value.md, Methodology anchors | Tourangeau, Rips and Rasinski (2000), The Psychology of Survey Response, Cambridge University Press, Table 1.1: Comprehension, Retrieval, Judgment, Response (map judgment onto response category; edit response). The game's class-to-stage mapping is a fair application of the framework. |
| A6 | Dillman: respondent burden and the social exchange of the invitation | docs/question-bank-and-value.md, Methodology anchors | Dillman, Smyth and Christian (2014), Tailored Design Method, ch. 1: the method is built on social exchange (rewards, costs, trust); corroborated by the SESRC summary at Washington State University, Dillman's own center (sesrc.wsu.edu). |
| A7 | "Cochran (CDC), Survey Design": spell out acronyms, specific recall time frame, avoid double-barreled, negative, and biased items; choices exhaustive and mutually exclusive | docs/question-defects.md, Sources; site/index.html DEFECT_INFO comment and Q55 flagTxt ("CDC canon") | The deck "Survey Design: Designing Questionnaires" by Ronda L. Cochran, MPH, CDC (Division of Healthcare Quality Promotion), checked via a third-party mirror (slidetodoc.com); every listed rule appears in it. Note: this is Ronda Cochran of the CDC, not William G. Cochran; expanding the citation to the full name would prevent the common misreading. |
| B4 | Catch-all domains cannot be verified; a small share of invalids always survives validation | site/index.html renderPrep, report validation verdict, bounceBacksHTML | knowledge.validity.com: accept_all means the domain "always says their email addresses are valid, even if they aren't", the address may be removed by a firewall or bounce later (including delayed bounces); statuses are valid, invalid, accept_all, unknown. |
| C1 | GCX sends about 3.5M survey invitations a year, in 45+ languages | docs/gameplay-concepts.md section 1; docs/requirements-game-design.md section 2 | The owner's stated facts as recorded in the repo. Both docs say invitations, not participants, matching the owner's correction; the requirements doc labels it "Scale flavor, used in copy only". The figures do not appear in player-facing site copy at all (grep of site/index.html), so nothing in the game overstates them. |
| C2 | No other GCX scale claim in copy | site/index.html segment cards | Segment sizes (9,000 to 20,000) are fictional scenario lists inside a labeled simulation, not real-world scale claims. |
| D1 | Every price listed in the player guide table | docs/player-guide.md price table vs site/index.html | budgetMath, validationCostFor, STAKE_CHOICES, DEFECT_INFO: sends 30 / 45 (Blast); validation 6 / 12, full 18 on Blast; dedupe 4; consolidate 4; repair 5; suppression 4; localization review 8; invites 0 / 4 / 10; reminder 8 each; SPLIT and BREAK UP 3; other class repairs 2; cut 1; add from bank 3; escapes 2; A/B setup 6. |
| D3 | BRD derived-rate formula in words: invalid records (stale plus unrepaired broken) divided by promoted records | site/index.html BRD and field guide; docs/medallion-prep-stage.md section 3 | intakeDerived in site/index.html implements exactly (stale + unrepaired) / promotedShare. The medallion doc's endpoint table matches the dealt intake mixes in SEGMENTS: Fresh 5.0% no work / 3.2% full Silver, Stale 9.5 / 6.1, Blast 16.0 / 10.6, Tired 5.0 / 3.8, Global 7.0 / 4.4. |
| D4 | Validation tier behavior: partial scans the riskiest half, full the whole list; a small share always survives | site/index.html renderPrep, effInvalidRate, computeBounceBacks | Multipliers in code: partial 0.45, full 0.15 of the base invalid rate; the catch-all floor (0.15) always survives. The bounce-back cause split for partial (1/3 catch-all, 2/3 unscanned) matches 0.15 / 0.45 exactly. |
| D5 | Sender reputation: hard bounces over 5% cut opens about 15%; over 10% halve opens and raise DOMAIN REPUTATION AT RISK; reputation starts at 90 | docs/player-guide.md; site/index.html report copy and repBanner | repMath in site/index.html: expected hard rate = effective invalid rate x 0.7; over 5% gives openFactor 0.85; over 10% gives 0.5 and atRisk. Note: the trigger is the expected rate, while report copy says "ran over"; at these list sizes the realized rate sits within about half a point of the expected one, so the wording is fair. |
| D6 | Goodwill costs as stated: reminders -5 per wave, suppression skip -6, questions past the 6-question lean core -2 each, unanswerable questions -6 per affected persona group, stakeholder choices 0 / 3 / 10 | site/index.html setup copy, goodwill ledger, STAKE_CHOICES | goodwillMath and STAKE_CHOICES in site/index.html match each figure; the report ledger prints the same rates it charges. |
| D7 | Reminder effects: waves go only to non-openers, 8 cr and -5 goodwill each; report prices recovered completions "for 5 goodwill" | site/index.html invite step, report worthLine | buildRun applies an independent recovery roll per wave to non-openers only; worthLine reports the run's actual recovered counts against the 5-goodwill cost. No numeric recovery rate is promised to the player, so there is no figure to falsify. |
| D8 | Report "saved about N bounces" arithmetic | site/index.html showReport, validation verdict | savedBounce = (baseInvalidRate() - effInvalidRate()) x segment size, where the base is now the derived rate under the player's Silver work; the skip-tier verdict uses the same base against the full-validation floor (x 0.15). The arithmetic matches the engine's own model and is printed with an "about" marker. |
| D9 | Quick Challenge budget arithmetic: 48 total; send 30, Honest Ask 4, three BRD repairs 6 | docs/player-guide.md; site/index.html MPOR and QUICK_BUDGET comment | QUICK_BASE_COST 34 (30 + 4) plus signature repairs 6 plus priciest extras line 6 plus 2 headroom = 48; cutting every extra costs 43. Guide, MPOR, and code comment agree. |
| D10 | Quick Challenge wave 2: "the pool never refills, and only wave 2's own actions are charged" | docs/player-guide.md; site/index.html MPOR | acceptQuickComplication sets spentBefore to wave 1 cost minus QUICK_BASE_COST, so the base batch (send + invitation) is paid once across both waves and wave 2's net pool charge is its own new actions only; the wave 2 budget panel prints exactly that figure. Mechanism documented in docs/development.md. |
| D11 | Mission minimums and evidence gates: minimum usable N 750 / 1000 / 1000 / 675 / 900 / 1500 by level; match 80%+; retain 60%+; quality 60+; Insight 60+ (70+ in Level 6) | docs/player-guide.md; site/index.html BRD (evidenceRequirementsHTML) | evidenceMission and evaluateEvidence in site/index.html use the same figures; the BRD text and the guide table agree. |
| D12 | Quality weights: guessed and duplicate deductions weighted 160 and 120 per invited recipient | docs/player-guide.md (scoring section) vs site/index.html qualityAssessment | qGuess = 160 x guessed / invited; qDup = 120 x duplicates / invited, exactly as the guide states. |
| D13 | Stakeholder choices: Show the Evidence 0 cr, Negotiate Modules 4 cr (+1 minute, -3 goodwill), Accept the Request 10 cr (+4 minutes, -10 goodwill) | docs/player-guide.md; site/index.html STAKE_CHOICES and stakeholder debrief | STAKE_CHOICES carries the same costs, minutes, and goodwill; the report debrief restates the same figures. |
| D14 | Report back line: restores +18 goodwill if the instrument is short (7 kept or fewer), else +8 | site/index.html Level 4 panel and report copy | goodwillMath earnReport implements +18 / +8 on the same condition. |
| E1 | Simulation disclaimers present where results are shown | site/index.html MPOR ("SIMULATION AND PRIVACY"), report ("THE FUNNEL · SIMULATED" simnote), bounce-backs simnote, Quick Challenge reports ("All results simulated.") | Read in place. The funnel simnote also states the animation uses labeled behavior groups and "no result is multiplied from an animation sample", which matches the population model in code. |
| E2 | Scores and rates are not presented as research metrics or industry benchmarks | site/index.html MPOR; docs/evidence-fitness.md | MPOR: the rate is "the game's simplified measure, not an AAPOR response rate"; "Data quality and Insight Value are teaching-game indices, not validated research metrics." Level targets are labeled RESPONSE BENCHMARK and "not a win gate" in the report. evidence-fitness.md: "Passing does not establish statistical precision, representativeness, construct validity, privacy compliance, or research readiness." |
| E3 | No real-world response-rate or outcome claim is stated as fact | site/index.html passim; docs passim | Persona patience minutes, segment mixes, and intake percentages are presented as scenario parameters of fictional lists; the BRD states mission minimums "are mission rules, not confidence or representativeness guarantees". |

## Observations (not graded)

- The report's LIST PREPARATION ledger prints a "Promoted to the
  contact master (Gold)" count derived from the promoted share, while
  the funnel's INVITED line counts every record in. The engine models
  merges through duplicate behavior rather than headcount; literal
  send counts are phase 3 in the approved medallion scope
  (docs/medallion-prep-stage.md). Neither figure claims to equal the
  other, so this is recorded as an observation, not a finding.
- The fixed-instrument Stale segment blurb says "six weeks on" while
  its timing field says "45 days after a closed support case". 45 days
  is six weeks and three days; both describe the same scenario field
  pair (Fresh timing is 3 days, Stale history is "last surveyed 6
  weeks ago"). Not graded: flavor text, no factual payload.

## Fix dispositions (2026-11-11)

The four findings below were fixed in commit `87f6a51` ("fix:
fact-check findings — BriteVerify name, accept_all label, catch-all
note scope, guide prices"). The findings text above is unchanged;
this section records what was done about each one.

- **B1 (WRONG) — FIXED.** "BrightVerify" renamed to "BriteVerify"
  (Validity's product) in site/index.html (5 occurrences: the budget
  panel prep label, both renderPrep validation rows, the
  BB_CAUSE_LABEL catchall entry, and the full-validation cause
  line), docs/player-guide.md (2: the Step 2 prose and the price
  table row), and scripts/harness/README.md (1, a living document
  describing the playthrough). Grep after the fix: zero
  "BrightVerify" in site/index.html, docs/player-guide.md, and
  scripts/harness/README.md. Deliberately left unchanged, as
  historical records: docs/mechanics-update-v1.1.md (3, dated
  design doc), CHANGELOG.md history entries (3), the captured UAT
  artifacts under docs/session-artifact-recovery/ (12), and this
  audit's own findings text (3, evidence quotes).
- **B2 (MISLEADING) — FIXED.** The catch-all cause label no longer
  claims a deliverable marking. Before: "Catch-all pass ·
  BrightVerify marked it deliverable because the domain accepts all
  mail". After: "Accept-all pass · BriteVerify flagged it
  accept_all: the domain accepts all mail, so the mailbox itself
  stays unconfirmed". Both required facts survive: accept_all is a
  separate status, and the mailbox itself stays unconfirmed.
- **B3 (MISLEADING) — FIXED.** The "catch-all residue" claim is now
  scoped to hard bounces everywhere it appears. The full-tier note
  reads "The hard bounces left are the catch-all residue"; the
  full-validation cause line composes conditionally, giving hard
  bounces the catch-all explanation and soft bounces their own
  ("real mailboxes that refused this send (mailbox full, temporary
  failure); validation cannot prevent those"); every note branch
  appends a soft-bounce sentence when soft bounces occurred; and
  the report's validation verdict for the partial tier now reads
  "because partial validation scanned only the riskiest half, and
  catch-all domains cannot be verified at any tier". The engine's
  cause model (counts and cause keys) is unchanged; the audit
  graded that split supported (D4).
- **D2 (MISLEADING) — FIXED.** Player guide price table: the send
  row now reads "Send: any segment except Executive Blast | 30"
  (was "Fresh or Stale", omitting Tired and Global, also 30); added
  "| Localized invite (Level 5) | 4 |" and "| Report back line
  (Level 4) | 3 |". Every other price in the table was re-verified
  against budgetMath and the code constants (sends 30 / 45;
  validation 6 / 12, 18 on Blast; dedupe 4; consolidate 4; repair
  5; suppression 4; localization review 8; invites 0 / 4 / 10;
  reminder 8; SPLIT and BREAK UP 3; other class repairs 2; cut 1;
  add from bank 3; escapes 2; A/B test setup 6). No other mismatch
  found.
- **A8, A9 (UNVERIFIABLE) — NOT FIXED.** Out of the approved fix
  scope; no change made.

Gates at the fix commit: build validation passes; node suite
117/117; full harness PASS 3/3 with browser checks 141/141. No
test pins needed updating: no test pinned the changed strings.
