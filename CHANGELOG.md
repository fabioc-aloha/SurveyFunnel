# Changelog

## 2026-11-14 - Process-consistency Phase F: reminders go to non-completers (G27)

- Phase F of the approved process-consistency program
  (docs/process-consistency-scope.md), completing the
  FIELDWORK stage's reminder rule: reminder waves go to
  everyone who has not completed yet, per the funnel
  standard, not only to people who never opened.
- Non-openers get another open chance, as before. Starters
  who dropped partway (patience, knowledge, or mobile
  causes; a recipient who never started cannot resume)
  now roll 0.18 per bought wave to resume where they left
  off and finish. The finish block was extracted as
  finalizeFinish so a resumed recipient finishes through
  the same path as a first-pass finisher. With no waves
  bought, no resume rolls are drawn and runs are identical
  to the pre-retargeting engine.
- The mid-field checkpoint's early wave applies both
  paths to the first half on the checkpoint stream
  (reopen at 0.22, resume at 0.18).
- On screen, the reminded state is a gold ring on the
  recipient's sprite wherever the recipient sits; the
  REMINDER SENT stamp no longer stamps the UNOPENED pile,
  and the reminder beat log states the non-completer rule.
  Setup copy and the report's unopened paragraph state
  the same rule, and the report names how many dropped
  starters came back on a reminder and finished.
- Breaker correction found by the closing gate: in the
  raw simulation a recipient can resume at a moment after
  the goodwill breaker has already stopped the run; the
  breaker pass then erases the resume's events but left
  the resumed flag set, so the tally and the wave model
  reported recoveries that never counted (917 of 934
  flagged resumes in the pinned Executive Blast run). The
  breaker pass now clears a resume whose reminded moment
  falls after the stop, and the tally's resumed count
  covers only resumed finishers, which is what the
  report's sentence claims. A regression test pins both.
- The witness corpus was fully regenerated for the new
  mechanics (390 setups, every seed won; the program's
  one full regeneration, decision 6): L1 fixed 62,
  seeded 56-78, goodwill 59-72; L2 fixed 66, seeded
  61-92, goodwill 49-70; L3 fixed 62, seeded 60-95,
  goodwill 2-58; L4 fixed 63, seeded 62-77, goodwill
  36-43; L5 fixed 72, seeded 66-100, goodwill 47-68;
  L6 fixed 87, seeded 84-117, goodwill 23-44.
- Gates at ship: node suite 165/165; browser harness
  PASS 3/3, 156/156.
- Five-surface pass: player guide and development notes
  updated (the non-completer rule, the checkpoint's
  dropped starters, the resume mechanic, the breaker
  correction). The Fishbowl and MPOR overlays and the
  level BRDs state no reminder targeting rule, so they
  needed no text change. The program's only remaining
  phase is Phase D (G4 sampling), riding on medallion
  phase 3.

## 2026-11-13 - Process-consistency Phase E: the mid-field checkpoint (G13) and the 72-hour clock (G6)

- Phase E of the approved process-consistency program
  (docs/process-consistency-scope.md), completing the
  FIELDWORK stage: a campaign send is no longer one-shot.
- The run engine is split at the median recipient
  (buildRunStart / simulateRange / simulateFromOpen /
  finishRun; buildRun composes them in one pass, unchanged
  for Quick Challenges and the witness replay). A campaign
  launch simulates the first half, pauses on a MID-FIELD
  CHECKPOINT card (interim funnel, hard-bounce rate so far,
  projected completes), and sends the second half on the
  player's command.
- Holding reproduces the one-shot run bit for bit: an
  invariant test compares every respondent and the full
  tally between the composed and split paths, so the 390
  recorded winners replay unchanged and no regeneration
  was needed.
- The one bounded action (decision 4): fire the next
  reminder wave now. It re-rolls the first half's
  non-openers on a separate checkpoint stream (2,050
  unopened inboxes on the reference Level 1 play) and the
  second half mails with one fewer wave: a timing trade,
  not a free wave. The report's deliverability card tells
  the story either way.
- The 72-hour permission window (the G6 remainder) binds
  at the same checkpoint. Fieldwork runs two days plus a
  day per reminder wave; past day 3 the player re-checks
  permission (4 cr, charged to the attempt) or lets it
  lapse, in which case people who opted out during
  fieldwork (a 5 percent index-derived slice of the second
  half, from the daily refresh) are mailed anyway and
  operational trust fails on the angry count, as it does
  when the scrub is skipped. The BRD now states the window
  and the day rule.
- Consistency pass: the player guide gains the checkpoint
  in its After a round section, and the development notes
  record the split engine, the fire trade, and the clock.
  The browser suite passes campaign launches through the
  checkpoint (hold) via a new helper.
- Verification: Node suite 162/162 (four new tests: the
  bit-for-bit hold invariant, the fire trade, the clock
  binding and lapse, and the launch flow pausing and
  continuing); browser harness PASS 3/3 at 156/156 checks.
  The checkpoint card was screenshotted on Level 1 at
  390px and read.

## 2026-11-13 - Process-consistency Phase C: BRD intake (G1)

- Phase C of the approved process-consistency program
  (docs/process-consistency-scope.md), completing the
  COMMISSION stage: the BRD is no longer read-only. The
  player signs it before building anything.
- A Step 0 COMMISSION panel opens the setup screen. Two
  choices, both binding: precision (standard minimums, or
  extended, the minimum usable base raised by half) and one
  topic exception (a required topic demoted to
  should-answer, negotiated with the survey's sponsor).
  Sponsor, audience, and decision stay fixed per level, as
  the survey records state them.
- The commission prints in the BRD as an AS COMMISSIONED
  block, and the report's acceptance card scores against
  the commissioned values: its minimum-base row reads the
  commissioned minimum, the demoted topic's row is
  annotated as the negotiated exception, and an As
  commissioned row records the contract.
- The demoted topic leaves the topics gate in operational
  trust (the trust detail names the exception either way),
  but reporting never relaxes: its finding still reads
  CANNOT SAY when the topic does not answer credibly.
- Invariant, pinned by a test: with the default commission
  (standard, no exception), every level's mission is
  exactly the shipped one (minimums 750 / 1,000 / 1,000 /
  675 / 900 / 1,500, pools and roles unchanged), so the
  390 recorded winners replay unchanged. A second test
  shows extended precision binding (the standard winning
  base of 894 fails fitness against a commissioned 1,125),
  and a third shows the exception flipping a level whose
  only failure was the demoted topic.
- Consistency pass: the player guide gains step 0 in its
  walkthrough, and the development notes record the
  commission mechanics and the invariant.
- Verification: Node suite 158/158 (three new tests);
  browser harness PASS 3/3 at 156/156 checks. The Step 0
  panel was screenshotted on Level 1 setup at 390px and
  read.

## 2026-11-13 - Process-consistency Phase B: simulated findings (G8) and within-cell reading (G14)

- Phase B of the approved process-consistency program
  (docs/process-consistency-scope.md), completing the
  INTERPRET stage: the report no longer stops at a score.
  The BRD's decision questions now get answers.
- Each survey record gains a `decisions` map: one decision
  question per agenda topic, decomposed from its purpose
  text, on a stated scale (percent favorable-style shares,
  or a 0 to 10 mean where the question reads as a score).
- `computeFindings(evidence, run, c)` observes a latent
  value seeded per topic and instrument through the topic's
  usable base (the matched respondents who could answer the
  topic's representing question; `computeInsight` now
  records that question and its contamination on each
  topic). Observation noise is calibrated so the scatter of
  repeated reads matches the printed margin. Findings are
  deterministic for a given run.
- A topic that is not ANSWERED CREDIBLY reads CANNOT SAY and
  gets no number, tied to the topics gate. An unfixed defect
  on the representing question biases the estimate the way
  it biases real data (leading pushes up, double-barreled
  pulls to the middle, broken options scatter) and the
  finding carries the warning.
- G14: each finding also reads within cells, the topic's
  key personas against everyone else, each cell with its
  base and margin; a cell under 30 usable responses reads
  "too thin to read" instead of printing a number.
- Findings render in a FINDINGS card after the
  dispositions, join the BRD acceptance card as one row per
  decision question, join the scorecard export, and the ACT
  line quotes the first answerable finding as the headline.
  Findings gate nothing in v1 (program decision 1): they
  are consequences, read and quoted. The cleaning filter
  shared by evidence and findings is extracted as
  `cleanAndMatch(run)`; behavior is unchanged.
- Consistency pass: the player guide (the Findings card and
  the scorecard contents), the development notes (the
  findings model), and the MPOR overlay's pipeline paragraph
  (INTERPRET) all describe the stage.
- Verification: Node suite 155/155 (three new tests cover
  the full findings path on a won run, the cannot-say
  branches, and the leading-bias plus thin-cell rules);
  browser harness PASS 3/3 at 156/156 checks. No scoring,
  prices, or win rules changed, so no witnesses were
  regenerated; the 390 recorded winners replay unchanged.
  The FINDINGS card was screenshotted on a won Level 1
  report at 390px and read.

## 2026-11-13 - Process-consistency Phase A: the scorecard export (G16) and the declared-winner consequence (G23)

- Phase A of the approved process-consistency program
  (docs/process-consistency-scope.md), completing the ACT
  stage remainders: the report becomes a file the player can
  hand to a sponsor, and a declared A/B winner stops being
  free.
- G16: the report carries a DOWNLOAD SCORECARD button. It
  saves a Markdown file with the mission, the key numbers,
  the five checks, the BRD acceptance rows, the final
  dispositions with RR3 and RR4, and the context note. The
  file renders from the same builders as the HTML cards
  (brdAcceptanceRows, dispositionData, contextNoteText), so
  the export and the page cannot drift. Simulated findings
  join the export in Phase B, when they exist.
- G23: declaring a winner against a TOO CLOSE TO CALL
  verdict sets a campaign flag. The next stakeholder debrief
  names it ("a winner was declared on a gap inside the
  uncertainty range"), the ACT step of that same report
  recommends re-running the split at adequate size, and the
  season grade names it for the rest of the campaign. No
  score changes; the consequence is reputational, which is
  the honest kind for this act. The flags clear only on a
  full campaign reset.
- Consistency pass: the player guide (the scorecard, and the
  Level 2 record), the development notes (flag mechanics and
  the shared builders), and the MPOR overlay's PUBLISH to
  ACT paragraph all describe both changes.
- Verification: Node suite 152/152 (two new tests cover the
  export contents and the naming chain); browser harness
  PASS 3/3 at 156/156 checks. No scoring changed, so no
  witnesses were regenerated. The export was generated from
  a won Level 1 run and read in full (its dispositions sum
  to the sent base), and the button was screenshotted on
  the report at 390px.

## 2026-11-13 - Gap-fix wave: the BRD's own rules now hold the send (G9, G5, G6, G2, G18, G12, G15, G17, G21, G22, G23, G19, G20)

- The owner directed applying as many fixes as possible from
  the Copilot survey lifecycle gap review (12 November). The
  scoring changes shipped as one batch with a single witness
  regeneration, as planned. The remaining gap items are the
  phase-sized builds in the approved process-consistency
  program (docs/process-consistency-scope.md): scorecard
  export and the declared-winner consequence first, then
  simulated findings.
- G9: operational trust now requires every BRD required topic
  to be ANSWERED CREDIBLY. A run that loses a required topic
  can no longer win, and the check names the topics that were
  not answered credibly.
- G5: the evidence check enforces the BRD audience window
  where the BRD states a testable one. Level 1's survey covers
  cases closed in the last 30 days, so the Stale list (45 days)
  and Executive Blast (no case window) fail the fitness check
  on Level 1, and the segment cards say so before the send.
  Other levels' BRDs define audiences by role and offer, which
  the segment mixes already represent, so no window is
  enforced there.
- G6: permission is a gate, not a tax. A send without the
  suppression scrub now fails operational trust when anyone on
  the list had opted out or was recently surveyed, and the
  scrub itself removes those records before the send: the
  report's frame counts them as suppressed and they never
  enter the sent base.
- G2: acceptance reads from the BRD instead of a uniform role
  rule. Level 3 requires people who run workloads (IT decision
  makers or frontline technicians) at 30% of the usable base;
  Level 4 requires decision makers (executives or IT decision
  makers) at 15% (one combined bloc: the tired list is exactly
  10% executive before attrition, so split floors would sit on
  a knife's edge, and the per-topic gates still force
  executive and ITDM evidence on Level 4's trust topics).
  Levels 1, 2, and 5 keep technician 10% plus end user 10%;
  Level 6 keeps its 50% executive/ITDM rule. Level 5's fitness
  check also requires every language group in the usable base
  to contribute at least 5% of it. Minimum samples are
  unchanged, and the fitness detail now states the margin of
  error on the usable base.
- G18: cleaning no longer removes guessed completions. They
  stay in the usable base, exactly as an undetectable guess
  would in a real study, and are priced in Quality and Insight
  instead. The CLEAN stage line, the MPOR overlay, the player
  guide, and the development notes all say the same thing.
- G12: the Honest Ask time promise is the player's choice
  (3, 5, 8, or 10 minutes), and goodwill and quality read the
  chosen promise. The Known Name goodwill earn now requires a
  prior contact in the audience pool; on a first contact it no
  longer claims "You told us, we fixed it" and earns nothing.
- G15: the report carries a BRD ACCEPTANCE card scoring the
  run line by line against the document that commissioned it:
  the decision, one row per required topic, the audience rule,
  the minimum base and roles with the margin of error, the
  audience health constraint, the stakeholder row on Levels 3
  and 6, and the language row on Level 5.
- G17: the report carries a FINAL DISPOSITIONS card in AAPOR
  categories (Complete, Partial, Refusal and break-off,
  Non-contact, Other, Unknown eligibility) whose rows sum to
  the sent base by construction, with the game response rate,
  AAPOR RR3 and RR4 (equal here; the game counts no usable
  partials), and the stated eligibility estimate.
- G21: the report-back lever is available on any level once
  the audience pool has been contacted before; Level 4's lever
  is unchanged. G22: the stakeholder debrief for a rotated
  instrument states the per-module base (about half the
  completions). G23 display half: the A/B panel shows a
  planning estimate per arm and the uncertainty gap under
  which the report reads TOO CLOSE TO CALL; the cross-level
  consequence is in the process-consistency program. G19:
  Level 6's purpose states the flagship fields once a year and
  a re-send reaches the same executives at full goodwill cost.
  G20 wording half: Level 5's purpose states the real study
  fields in more than 45 languages and the simulation
  compresses them into five language groups.
- Witnesses: the full corpus was regenerated under the new
  rules, all 390 setups (65 per level), zero seeds lost.
  Level 4 now wins on all 65 deals (it had 39 under the old
  rules; its recorded minimum rises to 65). Fixed lines:
  Level 1 62 cr (was 58), Level 2 66 cr (unchanged), Level 3
  62 cr (was 69), Level 4 63 cr (unchanged), Level 5 72 cr
  (unchanged), Level 6 87 cr (unchanged). Seeded ranges:
  56-78, 61-108, 60-89, 62-77, 66-100, 84-127 against pools of
  120 (150 on Level 6); no pool changed.
- Verification: Node suite 150/150 (four new gap-wave tests
  cover the gates, the report cards, the promise choice, and
  the report-back availability); browser harness PASS 3/3 at
  156/156 checks; the report's BRD ACCEPTANCE and FINAL
  DISPOSITIONS cards and the Level 1 Stale card's window line
  screenshotted at 390px and read.

## 2026-11-12 - Copy fixes from the Copilot gap review (G7, G24, G26, G28)

- The owner approved shipping the zero-cost fixes from the
  Copilot survey lifecycle gap review (12 November): the items
  that change words and defaults only, with no scoring change,
  so every recorded winning line replays as before.
- G7: audiences and invitations speak the level's own survey.
  The Honest Ask now reads its sender from the survey's sponsor
  and its subject from the survey ("From: the AI Adoption team ·
  5 minutes on how you use M365 Copilot" on Level 2), and the
  Fresh and Stale list cards take the survey's family name,
  timing line, and blurb (Copilot, Azure, Accounts, Global).
  Level 1 text is unchanged, and Quick Challenges keep the
  drill text. Segment mechanics, mixes, prices, and invite
  rates are untouched.
- G24: a new attempt chain now starts on the free Generic
  invite with no reminder preselected, instead of Known Name
  (10 cr) plus one reminder (8 cr). Every spend is a choice.
  Two tests that exercised the old defaults now set the invite
  explicitly; their assertions are unchanged.
- G26: the development notes now describe the start model as
  the code runs it (fixed start conversion per invite; the
  Honest Ask time promise enforced through goodwill and
  quality), replacing a sentence that said starts respond to
  the honesty of the time ask.
- G28: the campaign report flags hard bounces at or above the
  team's 2% investigate line, before the existing reputation
  penalties at 5% and 10%. Advisory only; no threshold moved.
- Verification: Node suite 146/146 (two new tests cover the
  per-survey copy, the unspent default, and the 2% line on hot
  and calm runs); browser harness PASS 3/3 at 156/156 checks;
  Level 2 setup screenshotted at 390px with the new sender,
  subject, and list copy rendering and no errors.

## 2026-11-12 - Each level's BRD is visible throughout setup

- At the owner's direction, the per-level BRDs (which already
  existed, one per level, since the per-level surveys project)
  are now easy to find. The owner reported not seeing them in
  some levels, so this release changes visibility only; no BRD
  content changed, and the shared front section stays shared,
  as approved in the per-level design.
- Four entry points, all labeled "? BRD" in gold: a top bar
  button that works from any screen and opens the selected
  level's BRD; the setup screen's own button; a notice under
  the setup banner ("THIS LEVEL HAS ITS OWN BRD", naming the
  survey, with its own button); and a button beside the agenda
  heading, which now reads "BRD REQUIRED TOPICS". The launch
  checklist heading also points at the level's own BRD.
  Opening the BRD from any entry point returns focus to that
  control on close, and opening it never changes setup state.
- Verification: Node suite 144/144 including a new visibility
  test covering all six levels; browser harness PASS 3/3 with
  156/156 checks, including the top bar opening the selected
  BRD from the start screen and Escape restoring focus.
  Screenshots at 390px showed the gold button prominent in the
  top bar and the banner notice clear, with zero page errors
  and no horizontal overflow.

## 2026-11-12 - Level 2 product named M365 Copilot

- At the owner's direction, the Level 2 product is called
  M365 Copilot everywhere it was called "the AI assistant" or
  "the assistant": all 36 bank stems, the repair rewrites, two
  flag texts, the survey record (label M365 COPILOT / AI
  ADOPTION, title M365 Copilot Adoption Survey), and the BRD
  purpose line. 52 product references renamed; no other level
  used the word. The sponsor stays "the AI Adoption team" (a
  team name, not the product).
- Names only: no stem meaning, defect class, timing, cost, or
  fixture changed, so every recorded winning line replays as
  before. Test pins updated to the new label and title in the
  Node suite and the browser suite; both pass in full.

## 2026-11-12 - Mobile QR code now encodes the short link

- At the owner's direction, the title screen's mobile-player QR
  code (assets/play-mobile-qr.svg) now encodes
  https://aka.ms/dvc instead of the production URL. The asset
  keeps its exact format (49x49 modules, version 6, the game's
  cream and ink colors, single-path SVG) and its geometry on the
  title screen. The adjacent "Open game on mobile" link still
  points at the production URL, as the build test pins it; only
  the QR payload changed.
- Verification: the new asset was decoded independently before
  shipping (ZXing, from the SVG's own module data) and again from
  a screenshot of the QR as rendered in the game; both read
  exactly https://aka.ms/dvc. The previous asset decoded to the
  production URL by the same method, confirming the swap.

## 2026-11-11 - Per-level surveys phase 5b: closing rebalance

- Design: [docs/level-surveys-scope.md](docs/level-surveys-scope.md),
  phase 5. The full themed witness corpus (364 setups) was
  re-verified against the recorded pre-migration baselines
  (fixed lines 58, 67, 69, 76, 70, 98; pools 120, and 150 on
  Level 6), the six balance invariants replayed through the
  suite, and each level's flag dispositioned below. Per the
  scope doc, tuning levers are question times and defect mix
  inside a level's own bank; no pool changed.
- Level 2 tuned. Its recorded lines were the season's outlier:
  every winning line used zero reminders and the fixed line won
  on the free generic invite. Six substantive clean items now
  carry realistic respondent times (Q205, Q206, Q207, Q208,
  Q223 at 1.0 min; the open-text Q231 at 1.5), while the 1-5
  ratings stay at 0.5. Two probe regenerations established what
  the times can and cannot do: at both the shipped dose and a
  doubled dose (1.5 / 2.0), the cheapest winning line stayed at
  60 cr before the A/B setup is counted, because a winning
  line's floor is set by the send and list-preparation economy;
  the doubled dose only halved the winning-line space (219 to
  122 lines on the fixed instrument) and was rejected. The
  shipped dose stands as burden realism: a kept Copilot
  instrument now takes long enough that invite and trimming
  choices register in completion. The Level 2 corpus was
  regenerated through the real card handlers with the
  canonical replay state (the A/B setup bought, as the suite
  replays it): fixed line 66 cr against the 67 cr baseline,
  seeded lines 60-86 cr, recorded lines ending at 50-76
  goodwill. An early regeneration run with the A/B setup off
  produced costs 6 cr low across the level; the suite's replay
  caught the mismatch on the fixed instrument and the corpus
  was regenerated, which is recorded here rather than silently
  replaced.
- Levels left untuned, with reasons. Level 1: fixed line holds
  at its 58 cr baseline and the level is the season's EASY
  opener; its lower seeded range (53-71) was accepted at phase
  1. Level 3: fixed line holds at 69; the seeded maximum moved
  +3 (92 vs 89), inside the recorded-line methodology's
  variance. Level 4: its fixed line is cheaper (63 vs 76)
  because the Relationship core is answerable by every seat
  under the recorded phase-4 design decision, and the level's
  binding difficulty is its goodwill gate (only 39 of 65
  searched setups win at all); cost tuning would fight a
  decision, not a drift. Level 5: fixed line 72 vs the 70
  baseline, inside variance. Level 6: the fixed line is
  efficient (87 vs 98) but the seeded distribution is healthy
  (83-122, mean 96, a 64% mean pool share against the
  baseline's 65%), so the flagship's difficulty stands.
- Verification: build validates; the Node suite passes 143/143
  with zero failures, including every level's recorded-setup
  replay, the six balance invariants, and the continuous
  six-level campaign; the full harness passes 3/3 with browser
  checks 152/152. The per-level surveys project is complete:
  every campaign level runs its own survey, bank, and BRD, and
  the closing rebalance is recorded above.

## 2026-11-11 - Per-level surveys phase 5a: Level 5 Perceptions and Level 6 Flagship banks, fallback removed

- Design: [docs/level-surveys-scope.md](docs/level-surveys-scope.md),
  phase 5a. Levels 5 (Global Fieldwork) and 6 (The Big Quarter)
  migrate from the legacy shared bank to their own surveys, and
  the transitional legacy fallback is removed: every campaign
  level now draws its own bank. Level 5 and 6 mechanics are
  unchanged (the multilingual list, localization review and the
  localized invite at 4 cr, the by-language funnel on Level 5;
  the 150 cr pool, Insight gate 70, and Executive Blast on
  Level 6).
- Level 5 bank: 36 newly authored entries (ids 501-536; 0
  reused) for the General Perceptions of Microsoft Survey.
  Structure follows the scope doc's derivation: sections
  A4/B18/C6/D2/E2/F4; 14 clean, 13 defective, 5 stupid, 4
  filler; core set of 7, all clean, with a creditable core
  question on every agenda topic. Defect coverage is 10 of the
  11 classes; the theme-natural classes from the scope doc's
  Level 5 rationale are doubled (LEADING, VAGUE TIMEFRAME,
  DOUBLE-BARRELED). The one omission is recorded in the bank's
  header comment: RECALL OVERLOAD (a perception has no events
  to recall; the class is covered on Levels 1 to 4, on Level 6,
  and in the drills). Answerability inverts the other surveys:
  the object is the respondent's own perception, so perception
  items are answerable by every seat, and the bank's single
  BEYOND KNOWLEDGE item (Q517) is a factual claim smuggled into
  a perception survey, beyond knowledge for every seat equally.
  No brand claim is asserted as fact anywhere in the bank;
  flattery appears only as labeled LEADING and vanity traps.
  The Level 5 BRD is written in full (sponsor: the Brand and
  Perceptions research team; the constraints carry the
  localization reality: fielding in 45+ languages, localization
  review checks that each version still asks the same
  question, and response is read by language group). Level 5
  deals a curated fixed 12 from its own bank on first play.
- Level 6 bank: 36 newly authored entries (ids 601-636; 0
  reused) for the Enterprise Relationship Flagship Annual
  Survey. Same derived structure; core set of 7, all clean,
  with a creditable core question on every agenda topic. Per
  decision 3, the flagship has its own bank mixing the
  relationship subjects of Level 4 and the perception subjects
  of Level 5; some stems are adapted from those banks, but the
  draw never mixes banks. Defect coverage is 10 of the 11
  classes; the doubled classes are SENSITIVE NO ASSURANCE,
  GRID BURDEN, and RECALL OVERLOAD. The one omission is
  recorded in the bank's header comment: VAGUE TIMEFRAME (the
  flagship's items are anchored to the agreement term and the
  annual cycle by construction; the class is covered on Levels
  1, 2, and 4 and in the drills). Answerability is the tightest
  of the six: executives answer strategy, value, and renewal
  intent, commercial specifics sit with Partner Admin seats,
  and operational detail is beyond the executive seats. On the
  phase-4 reasoning, the core set itself is answerable by
  every seat, and the seat pattern is expressed through the
  topic-to-persona keys; restrictions live on non-core items.
  The Level 6 BRD is written in full (sponsor: the Enterprise
  Relationship team; one fielding a year, read alongside
  account records, never instead of them). Level 6 deals a
  curated fixed 12 from its own bank on first play. All six
  survey records are now written in full.
- Fallback removal: `bankForLevel` carries no legacy fallback.
  The legacy 64 entries remain in `QUESTION_BANK` as the Quick
  Challenge union source and Level 1's curation origin; the
  drills deal by id, never through `bankForLevel`, and Quick
  Challenge behavior is unchanged.
- Witnesses: the Level 5 and Level 6 corpora were regenerated
  through the real card handlers (65 setups each: the fixed
  first-play instrument plus 64 seeded instruments), and the
  splice asserted every other level's entries identical before
  and after. Level 5: fixed line 72 cr against the 70 cr
  pre-migration baseline, seeded lines 66-85 cr, recorded lines
  ending at 57-72 goodwill. Level 6: fixed line 87 cr against
  the 98 cr baseline, seeded lines 83-122 cr, recorded lines
  ending at 26-53 goodwill. The Level 5 regeneration completed
  under the build worker; the worker was then stopped at the
  owner's direction and the Level 6 regeneration, the splice,
  and the final gates were finished and verified by the parent
  agent. No tuning and no pool changes in this phase; the cost
  deltas against baseline (Level 5 +2 fixed, Level 6 -11
  fixed) are recorded in TODO.md as phase-5b rebalance flags.
- Verification: build validates (3 inline scripts, 8 packaged
  files); the Node suite passes with zero failures, including
  the per-level bank tests (structure, defect floor, core
  coverage, QC union integrity, fallback absence) and the
  continuous six-level campaign; the full harness passes 3/3
  with browser checks 152/152, including the survey-identity
  scenario extended to Levels 5 and 6. Screenshots of the
  Level 5 and 6 setup screens and BRDs at 390 px were reviewed
  by eye; the survey names render on the setup banner and in
  the BRD title.

## 2026-11-11 - Per-level surveys phase 4: Level 4 Account Team Relationship bank and BRD

- Design: [docs/level-surveys-scope.md](docs/level-surveys-scope.md),
  phase 4. Level 4 (The Tired List) migrated from the legacy shared
  bank to its own survey, the Account Team Relationship Survey.
  Level 4 mechanics are unchanged: the Tired segment starts at
  goodwill 25, the win requires ending goodwill 35 or higher, the
  Report back line (3 cr) stays this study's feedback commitment,
  and pricing and targets behave as before.
- Level 4 bank: 36 newly authored entries (ids 401-436; 0 reused).
  Structure follows the scope doc's derivation: sections
  A4/B18/C6/D2/E2/F4; 14 clean, 13 defective, 5 stupid, 4 filler;
  core set of 6, all clean, with at least two creditable questions
  on each of the survey's five agenda topics (account team
  responsiveness, trust and candor, business value delivered,
  escalation handling, renewal intent). Defect coverage is 10 of
  the 11 classes; the theme-natural classes from the scope doc's
  Level 4 rationale are doubled (SENSITIVE NO ASSURANCE, LEADING,
  VAGUE TIMEFRAME). The one omission is recorded in the bank's
  header comment: DOUBLE NEGATIVE (negation-stacked wording lives
  in agreement and consent text, not in relationship experience
  items); the class is covered on Levels 1 and 2 and in the
  drills. The items are phrased as a real relationship instrument
  phrases them, and the subject is a subject of measurement,
  never promotion: no marketing claims and no facts about any
  real account or person; every item is generic to the
  respondent's own account team.
- Answerability, one recorded design decision: the scope doc's
  Level 4 pattern is expressed through the topic-to-persona keys
  (trust, business value, and renewal intent credit only from
  executive and IT decision maker evidence; escalation handling
  only from the frontline and end-user seats that lived the
  tickets), while the core set itself is answerable by every
  seat, deliberately. This level's goodwill economy cannot carry
  a restricted backbone: a kept restricted item charges 6
  goodwill per persona group that cannot answer it, the Tired
  list starts at 25, and the win requires ending at 35 or
  higher. An authoring pass with the core restricted to the
  pattern's seats produced no winning line for the fixed deal at
  all: keeping the backbone spent 54 goodwill on unanswerability
  alone and tripped the breaker before the rate could build.
  Seat restrictions therefore live where they teach, on the
  non-core clean items Q411 and Q424, the jargon item Q416, and
  the beyond-knowledge trap Q417, each a visible, priced decision
  in the goodwill forecast. Candor, not knowledge, is the design
  risk on this survey: the sensitive items ask respondents to
  judge a team they must keep working with.
- Level 4 BRD: the survey record is complete (sponsor: the
  Account Management team; purpose; audience with the seat
  pattern and the repeated-surveying condition; required topics
  with per-survey topic-to-persona keys; success measures
  through the unchanged mission numbers). The constraints state
  the level's defining conditions as study conditions: the
  audience has been surveyed three times this quarter, the win
  requires ending goodwill 35 or higher, and report back is the
  feedback commitment that protects response on the next cycle.
  The evidence mission purpose for Level 4 is rewritten to the
  survey.
- Fixed first play: Level 4 now deals a curated 12 from its own
  bank (6 core) when no seed is recorded, through
  `fixedInstrumentForLevel`. The transitional fallback now
  covers Levels 5-6 only and returns the legacy pool exactly as
  phase 3 left it, so their deals and witnesses are unchanged.
- Witnesses: Level 4's 39 winning setups (fixed plus its 38
  seeded draws; this level's corpus is 39, not 65) were
  regenerated through the real handlers against the Relationship
  bank. The recorded fixed line costs 63 cr against the 76 cr
  baseline: it keeps all six core questions, buys the Honest Ask
  invite and report back, and ends at 47 goodwill with quality
  95 and Insight 100 (the old fixed line ended at 40 goodwill).
  64 winning lines existed for the fixed deal; the cheapest was
  59 cr. Seeded winning lines cost 59-75 cr against the old
  58-82 cr range. Recorded lines end at 41-47 goodwill, all
  clear of the 35 gate, and the fixed line's 47 also carries
  into the continuous six-level campaign, which passes. No pool
  changed and no tuning was applied. The cheaper Level 4
  (fixed line down 13, seeded top down 7) is flagged for the
  phase-5 rebalance alongside the Level 2 and Level 3 flags.
  Other levels' fixtures are entry-for-entry identical.
- Coverage: four new Node tests (Level 4 bank structure with the
  defect-coverage floor and doubled classes, Level 4 fixed
  instrument, Level 4 BRD rendering with the goodwill gate and
  the report-back commitment, Insight against Level 4 topics),
  the fallback test extended to the narrowed pool, the phase-1
  BRD test and the phase-2 fixed-instrument test re-pointed to
  Level 5 as the remaining unmigrated example, the
  goodwill-ledger test re-based on the Level 4 fixed core set,
  and the browser survey-identity scenario extended to the
  Level 4 BRD. Gates: build, Node suite (135), full harness
  PASS 3/3 (browser 150/150).

## 2026-11-11 - Per-level surveys phase 3: Level 3 Azure Cloud Services bank and BRD

- Design: [docs/level-surveys-scope.md](docs/level-surveys-scope.md),
  phase 3. Level 3 (The Stakeholder) migrated from the legacy shared
  bank to its own survey, the Azure Cloud Services Survey. Level 3
  mechanics are unchanged: the stakeholder event (Accept 10 /
  Rotate 4 / Push Back 0), pricing, and targets all behave as
  before.
- Level 3 bank: 36 newly authored entries (ids 301-336; 0 reused).
  Structure follows the scope doc's derivation: sections
  A4/B18/C6/D2/E2/F4; 14 clean, 13 defective, 5 stupid, 4 filler;
  core set of 7, all clean, with at least two creditable questions
  on each of the survey's four agenda topics (service reliability,
  cost visibility, migration effort, capability gaps). Defect
  coverage is 9 of the 11 classes; the theme-natural classes are
  doubled (JARGON, BEYOND KNOWLEDGE, GRID BURDEN, RECALL OVERLOAD).
  The two omissions are recorded in the bank's header comment:
  VAGUE TIMEFRAME (this bank's items ride on dated operational
  windows such as the last incident or the last billing cycle) and
  DOUBLE NEGATIVE (negation-stacked items live in agreement and
  consent text, not platform experience items); both classes are
  covered on Levels 1 and 2 and in the drills. Answerability is
  the densest of any bank, per the scope doc's Level 3 pattern:
  IT decision makers and technical seats answer architecture,
  reliability, and migration; cost visibility splits (whether
  costs are visible sits with IT decision makers, the figures
  with admin seats); end users cannot answer tenancy, region, or
  SKU items at all. The subject is a subject of measurement,
  never promotion: no marketing claims, no invented product
  facts, SLAs, or roadmap promises.
- Level 3 BRD: the survey record is complete (sponsor: the Azure
  product team; purpose; audience with the answerability pattern;
  required topics with per-survey topic-to-persona keys; success
  measures through the unchanged mission numbers). The
  constraints name the sponsor as this study's stakeholder: the
  demand for eight extra questions is the sponsor's own, and
  extra-topic answers are not simulated or scored. The evidence
  mission purpose for Level 3 is rewritten to the survey.
- Fixed first play: Level 3 now deals a curated 12 from its own
  bank (6 core) when no seed is recorded, through
  `fixedInstrumentForLevel`. The transitional fallback now covers
  Levels 4-6 only and returns the legacy pool exactly as phase 2
  left it, so their deals and witnesses are unchanged.
- Witnesses: Level 3's 65 winning setups (fixed plus the same 64
  seeds) were regenerated through the real handlers against the
  Azure bank. The recorded fixed line costs 69 cr, the same as
  the recorded baseline, but it is a different line, chosen for
  goodwill: the cheapest winning lines (62 cr) keep all six dealt
  core questions and end at 22 goodwill, because the bank's
  restriction-dense core charges 6 goodwill per affected persona
  group on each kept restricted item (18 each on Q302, Q306,
  Q307), and that ending starves Level 4's audience gate in the
  continuous campaign. The recorded line keeps one restricted
  core item (Q306, cost visibility), covers migration effort
  with the repaired bank add Q325 (answerable by everyone, no
  goodwill charge), and ends at 58 goodwill with quality 78 and
  Insight 100. Seeded winning lines cost 59-92 cr against the
  old 60-89 cr range. No pool changed. The seeded-range shift
  and the bank's goodwill profile are flagged for the phase-5
  rebalance. Other levels' fixtures are entry-for-entry
  identical.
- Coverage: four new Node tests (Level 3 bank structure with the
  defect-coverage floor and doubled classes, Level 3 fixed
  instrument, Level 3 BRD rendering with the sponsor named as
  stakeholder, Insight against Level 3 topics), the fallback
  test extended to the narrowed pool, the phase-1 and phase-2
  BRD and fixed-instrument tests re-pointed to Level 4 as the
  remaining unmigrated example, the goodwill-forecast test
  re-based on the Azure fixed instrument, and the browser
  survey-identity scenario extended to the Level 3 BRD. Gates:
  build, Node suite (131), full harness PASS 3/3 (browser
  149/149).

## 2026-11-11 - Per-level surveys phase 2: Level 2 Copilot Adoption bank and BRD

- Design: [docs/level-surveys-scope.md](docs/level-surveys-scope.md),
  phase 2. Level 2 (The Split) migrated from the legacy shared bank
  to its own survey, the Copilot Adoption Survey. Level 2 mechanics
  are unchanged: the A/B invitation test, the TOO CLOSE TO CALL
  verdict, pricing, and targets all behave as before.
- Level 2 bank: 36 newly authored entries (ids 201-236; 0 reused),
  appended after the legacy bank so legacy pool order is untouched.
  Structure follows the scope doc's derivation: sections
  A4/B18/C6/D2/E2/F4; 14 clean, 13 defective, 5 stupid, 4 filler;
  core set of 7, all clean, with a creditable core question on each
  of the survey's five agenda topics (adoption breadth, workflow
  impact, trust in output, output quality, enablement gap). Defect
  coverage is 10 of the 11 classes; the theme-natural classes are
  doubled (JARGON, BEYOND KNOWLEDGE, LEADING). GRID BURDEN is the
  one omission, recorded in the bank's header comment: rating
  matrices belong to the platform-survey genre, not to an adoption
  instrument. Answerability follows the scope doc's Level 2
  pattern: end users and frontline staff are the strong respondents
  on usage, output, and workflow; executives cannot answer
  daily-use detail; IT decision makers carry rollout and
  enablement; budget figures sit with Partner Admin seats and
  pre-release model facts with no seat on the list. The instrument
  treats its subject as a subject of measurement, never as
  promotion: no capability claims or feature promises; hype
  wording appears only as labeled LEADING and vanity traps.
- Level 2 BRD: the survey record is complete (sponsor: the AI
  Adoption team; purpose; audience with the answerability pattern;
  required topics with per-survey topic-to-persona keys; success
  measures through the unchanged mission numbers). The constraints
  carry the A/B design note: two invitation variants against the
  same instrument, the comparison is about the invitation, and the
  study reports uncertainty rather than assuming a winner. The
  evidence mission purpose for Level 2 is rewritten to the survey.
- Fixed first play: Level 2 now deals a curated 12 from its own
  bank (6 core) when no seed is recorded, through
  `fixedInstrumentForLevel`; unmigrated levels keep the legacy
  fixed instrument. The transitional fallback now covers Levels
  3-6 only and returns the legacy pool exactly as phase 1 left it,
  so their deals and witnesses are unchanged.
- Witnesses: Level 2's 65 winning setups (fixed plus the same 64
  seeds) were regenerated through the real handlers against the
  Copilot bank. The fixed line now costs 61 cr against the recorded
  67 cr baseline, and seeded winning lines cost 59-67 cr against
  the old 64-93 cr range: the themed bank's minimal lines are
  cheaper, chiefly because its core set is all clean and its five
  agenda topics each carry a creditable core question. No pool
  changed. Other levels' fixtures are byte-identical.
- Coverage: four new Node tests (Level 2 bank structure with the
  defect-coverage floor and doubled classes, Level 2 fixed
  instrument, Level 2 BRD rendering, Insight against Level 2
  topics), the fallback test extended to the narrowed pool, and
  the browser survey-identity scenario updated to the migrated
  Level 2 BRD. Gates: build, Node suite (127), full harness
  (browser 148/148).

## 2026-11-11 - Per-level surveys phase 1: data model, per-level BRD, Level 1 Support bank

- Design: [docs/level-surveys-scope.md](docs/level-surveys-scope.md).
  The owner approved the level-to-survey mapping and all seven open
  decisions as recommended on 2026-11-11; the scope doc records the
  decisions as the build specification.
- Data model: every bank entry now carries a `survey` field naming
  its level's bank (0 = legacy shared bank). `bankForLevel(level)`
  is the single lookup the deal and the add bank read. Level 1 is
  migrated; Levels 2-6 resolve to the full legacy shared bank
  through the transitional fallback, so their deals are unchanged.
  Question ids are never renumbered, and the Quick Challenges,
  which deal by id from the union bank, are byte-identical.
- Level 1 Support Experience bank: 36 entries curated from the
  existing support bank (36 reused, 0 newly authored; the bank
  already was this survey). Structure follows the scope doc's
  derivation: sections A4/B18/C6/D2/E2/F4; 15 clean, 12 defective,
  5 stupid, 4 filler; core set of 8 with a creditable core question
  on every agenda topic; all 11 defect classes present, with
  SENSITIVE NO ASSURANCE doubled. The fixed first-play instrument
  (ids 1-12) is a subset of the bank.
- Per-level BRD: `openBRD` now assembles the campaign document from
  a shared front section (five-checks acceptance language,
  segment-driven list preparation, closing note) plus the current
  level's own study from its `SURVEYS` record (name, sponsor,
  purpose, audience, required topics, constraints, success
  measures). Level 1's Support Experience BRD is written in full;
  Levels 2-6 render their current topics and constraints through
  the same model until their phases. The generic purpose sentence
  is retired. The Quick Challenge BRD is unchanged. Insight now
  reads topic-to-persona keys from the level's survey record.
- Naming (decision 6): level cards read "LEVEL 1 · EASY · FIRST
  SEND · SUPPORT EXPERIENCE", the setup banner and HUD name the
  survey, and the BRD title carries the survey name. The existing
  difficulty-label pins are kept, so the card line keeps its
  difficulty segment.
- Witnesses: Level 1's 64 seeded winning setups were regenerated
  through the real card handlers against the curated bank; the
  fixed-instrument entry is untouched and replays byte-identically
  (58 cr, the recorded baseline). Seeded winning lines now cost
  53-71 cr, against 58-93 cr before the migration: the curated
  bank is denser in core and agenda-clean questions. No pool
  changed. Other levels' fixtures are byte-identical.
- Coverage: six new Node tests (bank structure, fallback, QC id
  preservation, per-level BRD rendering, naming, Insight against
  Level 1 topics) and a new browser scenario for survey identity
  at both viewports. Gates: build, Node suite, full harness.

## 2026-11-11 - Fact-check fixes: BriteVerify name, accept_all label, catch-all scope, guide prices

- The email validator is Validity's BriteVerify; game copy and the
  player guide spelled it "BrightVerify". Renamed everywhere it is
  a present-tense product reference: the validation labels and the
  budget panel in site/index.html, docs/player-guide.md, and the
  harness README. Historical records keep the old spelling: this
  changelog's older entries, the dated mechanics doc, captured UAT
  artifacts, and the audit's own evidence quotes.
- The bounce-back cause label for catch-all survivors no longer
  claims the validator marked the address deliverable. It now
  reads: "Accept-all pass · BriteVerify flagged it accept_all: the
  domain accepts all mail, so the mailbox itself stays unconfirmed".
- The "catch-all residue" note in the bounce-backs report is
  scoped to hard bounces. The full-validation cause line splits
  hard and soft bounces, soft bounces get their own accurate
  description in the note (real mailboxes, full or temporarily
  failing; validation cannot prevent them), and the partial-tier
  validation verdict names the riskiest-half scan as a reason
  invalids got through.
- Player guide price table: the send row now covers every
  30-credit segment (was "Fresh or Stale"); added the two missing
  rows, Localized invite (Level 5) at 4 cr and Report back line
  (Level 4) at 3 cr. Every other price in the table re-verified
  against budgetMath and the code constants; no other mismatch.
- Dispositions for each finding are recorded in
  docs/fact-check-2026-11-11.md. Gates: node suite 117/117, full
  harness PASS 3/3 (browser 141/141).

## 2026-11-11 - Fishbowl help document alongside MPOR and BRD

- New third reference overlay, FISHBOWL · HOW A SURVEY LIST IS
  BUILT, in the same family as MPOR and the BRD: same dialog
  mechanics (inert background, focus containment, Escape close,
  opener-focus restoration) through the shared reference code.
- Two entry points open the one overlay: a "? FISHBOWL" button in
  the topbar next to "Consult MPOR", and a "? HOW THE LIST FLOWS
  (FISHBOWL)" button in the Step 2 list-preparation area.
- Eight sections in pipeline order (Sources, Bronze, Silver,
  Gold · Contact Master, Sampling, Permission, The Send,
  Responses and Disposition), grounded in the owner's documented
  real system, plus a closing "Why it matters" note. Where the
  game simplifies (daily refresh, validation tiers, the 72-hour
  permission clock, the compressed wave report), the section
  says so in one line instead of claiming the model.
- Coverage: node tests for the overlay's sections, both entry
  points, and focus restoration to either opener; browser checks
  for both entry points, focus containment, Escape, and overflow
  at 390px and desktop. No gameplay, economy, or scoring change.

## 2026-11-11 - Fact-check audit (documentation only)

- Read-only audit of every checkable factual claim in the game copy,
  the player guide, and the design docs:
  [docs/fact-check-2026-11-11.md](docs/fact-check-2026-11-11.md).
  32 claims graded: 26 supported, 1 wrong, 3 misleading,
  2 unverifiable. No game code, tests, or copy changed.
- Headline results: no named citation's number is wrong (Groves and
  Peytcheva 2008 verified at 59 studies, R-squared about 0.04);
  no copy states a game abstraction as a real-world fact; the
  player guide's price table omits two priced actions (Report back
  line, 3 cr; Localized invite, 4 cr). The validator's name is
  misspelled "BrightVerify" for BriteVerify in the game copy and
  the player guide. Fixes are recorded in the audit doc, not applied.

## 2026-11-10 - Medallion prep stage, phase 1: derived list health

- Step 2 rebuilt as BUILD THE LIST with Bronze / Silver / Gold
  panels. Each campaign segment now deals a deterministic intake mix
  (same-system duplicates, second-source duplicates, fixable broken,
  unfixable broken, stale), jittered per level and instrument seed
  and shown as counts on the panel and the segment card.
- New Silver actions: CONSOLIDATE (4 cr) merges second-source
  duplicates; REPAIR ADDRESSES (5 cr) fixes fixable addresses and
  quarantines the unfixable. DEDUPE is absorbed into Silver at the
  same 4 cr; the old Step 2 dedupe toggle is gone. Suppression and
  validation stay as Gold checks. Silver purchases are owned and
  delta-charged like all prep.
- Campaign list health is now derived, replacing the static segment
  invalid rates: stale plus unrepaired broken, divided by the
  promoted share. Base-mix endpoints before validation: Fresh 5.0%
  no work / 3.2% full Silver, Stale 9.5% / 6.1%, Executive Blast
  16.0% / 10.6%, Tired 5.0% / 3.8%, Global 7.0% / 4.4%. Unmerged
  duplicates reach the run scaled by their remaining share. Quick
  Challenges are unchanged: no stage, provided list prep, the
  provided-list rate model.
- The campaign report gains a LIST PREPARATION ledger (Bronze in,
  Silver merges, repairs and quarantine, Gold promoted count, list
  health at launch); the BRD gains a LIST PREPARATION section with
  the dealt mix and per-action consequences; the field guide gains
  entries for the layers, dedupe vs consolidation, repair vs
  validation, quarantine, and derived list health.
- Balance: the witness corpus was regenerated through the game's
  real handlers under the derived-rate model at the same size (364
  setups). Minimum and fixed credits-to-win are unchanged on every
  level; 14 setups absorbed added Silver work (mostly CONSOLIDATE).
  No prices or pools changed. Five new Node tests cover the intake
  draw, the derived endpoints, skip consequences, and Silver
  charging; the browser harness gains a medallion scenario for the
  layer panels and the report ledger.

## 2026-11-10 - Medallion prep stage design (documentation only)

- Added [docs/medallion-prep-stage.md](docs/medallion-prep-stage.md):
  a scoped design proposal for a playable list-preparation stage
  (Bronze, Silver, Gold) that rebuilds Step 2. It covers the intake
  draw and its defect classes, Silver and Gold actions with proposed
  prices, absorption of the dedupe toggle, derived list health
  replacing the static segment invalid rates, per-level and Quick
  Challenge treatment, the report's list-preparation ledger, teaching
  goals, three build phases, and seven open decisions for the owner.
  Every number in the document is labeled a proposal.
- Documentation only: no game code, tests, or balance changed, and
  the deployment package is unchanged.

## 2026-11-10 - Favicon and apple touch icon

- Added site icons drawn from the game's own IM sprite: the MGR_NORMAL
  head and shoulders (headset visible) on the cabinet background
  (#141826), as `favicon.svg`, `favicon-32x32.png`, and an opaque
  180x180 `apple-touch-icon.png`. Replaced the empty `data:,` icon
  placeholder in the page head with the three icon links, and added
  the icon files to the deployment package (now 8 files).

## 2026-11-10 - Gameplay copy diet

- Shortened copy on the gameplay surfaces only: title and level select,
  the four setup stages, Quick Challenge setup, the run screen, and the
  stakeholder, complication, retry, and level-failed dialogs. Tutorial
  prose that duplicates the BRD, the report, or the field guide was
  removed from gameplay screens; those three surfaces keep every word.
- The setup readout now shows a short evidence-plan summary (new
  `evidenceSummaryText()`); the full plan still renders verbatim in the
  BRD from the unchanged `evidenceRequirementsHTML()`. Carried
  audience-history counts stay in the readout because the next send is
  planned against them.
- Measured visible gameplay copy (scripted pass at 1280x800: title,
  HUD, Level 1 setup, run screen at a fixed moment, Quick Challenge
  setup): 3,342 words before, 2,358 after (-29%). The remaining text is
  question text, prices, segment and card data rows, and state
  readouts, which the change brief protects. Full before/after list:
  [docs/copy-diet-2026-11-10.md](docs/copy-diet-2026-11-10.md).
- Three Node test pins updated to the new copy (checklist floor row,
  level-failed cheapest-send line, reminder label). No mechanics,
  prices, budgets, scoring, simulation, audio, or layout changed.
- Gates: build validation passed, Node suite 109/109, tracked harness
  PASS 3/3 with browser checks 119/119. Committed locally only; not yet
  pushed or deployed.

## 2026-11-02 - Population and cut-rule release deployed

- Pushed gameplay release `b45bb69` directly to `main`.
  [Production workflow 41490330923](https://github.com/fabioc-aloha/SurveyFunnel/actions/runs/41490330923)
  passed build, Node tests, deployment, and live-package verification.
- An independent `node scripts/verify-deployment.mjs` run matched
  production HTML, font, license, QR, response headers, and
  unpublished-document checks.
- Production browser journeys passed at 390px and 1280px. Each used
  10,000 individual recipients and 183 animation groups, reconciled
  nonzero intermediate counters against individual events, and reported
  1,154 completions, ROUND WON, and five passing evidence checks.
  No horizontal overflow or runtime errors occurred.
- A production cut-to-one check confirmed native disabled CUT and
  `grayscale(1)` after the rendered card settled. No game change was needed.
- Updated the README and handoff to record publication. This
  documentation-only receipt leaves the verified game package unchanged.
  Human audio, physical-device, cross-browser, screen-reader, and owner
  acceptance checks remain open in [TODO.md](TODO.md).

## 2026-11-02 - Full regression and automated player acceptance

- The complete tracked harness passed all three sections: production-package
  validation, 109 Node tests (including every winning witness), and 119 browser
  checks at mobile and desktop sizes. Both deliberate-defect negative controls
  caught their intended overflow and page-error failures.
- Resolved the earlier tooling blocker using Puppeteer 25.12.0 from an
  existing approved installation and Edge 156.0.4314.58. No package was
  installed and no package-fetch policy changed.
- The first browser run passed 115 of 116 checks. Its agitation assertion
  still expected a 9%-invalid list to cross the new 10% recipient threshold;
  that assertion now runs on a raw Executive Blast that demonstrably exceeds
  the threshold. Corrected the live observer to parse comma-formatted
  recipient counts, with an explicit above-999 regression assertion.
  No gameplay rules or thresholds changed during this verification.
- Separate session-only automated UAT passed 143 assertions across five
  scenarios: uninterrupted six-level campaigns through real controls at
  390px and 1280px, a naturally completed 20,000-recipient reduced-motion run
  with exact intermediate counts, all three Quick Challenges with campaign
  isolation, and BRD cuts down to the protected final question.
- Additional browser-tool checks passed MPOR/BRD focus, Tab/Shift-Tab
  containment, inert backgrounds, Escape and opener restoration, MPOR
  reopened scrolling, mouse/keyboard QR expansion, font loading, sound/hint
  controls, owned-preparation locks, audience locks, and successive retry
  cost reductions. A breaker run counted 15,159 actual sends and 4,841
  unsent recipients from a population of 20,000; its counters reconciled.
- Visual review confirmed the gray disabled CUT and mobile live counts,
  cohort labels, and desktop finale scorecard. No overflow or runtime errors
  occurred in the passing journeys. Game-source hashes matched before/after
  the complete harness and the separate UAT run.
- Removed the resolved tooling blocker from current documentation. Physical
  phone/QR, Safari/Android Chrome, screen-reader, human audio review, and owner
  acceptance remain open. These local checks preceded publication;
  production verification is recorded above.

## 2026-11-02 - Count every simulated recipient

- Replaced the 40-person statistical proxy with one synthetic record per
  audience recipient. Live counters follow individual events; final reports,
  A/B results, cleaning, usable samples, and audience history use those same
  records. Breaker-stopped invitations are not counted as sent.
- Animation now groups recipients with similar visible behavior into
  representative cohorts, labeled with their group size. The group count can
  exceed 40; changing visual density does not change statistical results.
  Cohort trajectories illustrate behavior rather than every member's timing.
- Converted guessed-completion and duplicate deductions to recipient rates,
  preserving their per-capita weight. Core-question penalties, BRD acceptance,
  evidence gates, and budgets remain unchanged. Percentages retain enough
  precision to distinguish one recipient in a 20,000-person audience.
- Cached the original pixel artwork as SVG images and batched pile geometry
  measurements to support the larger animation without runtime dependencies.
- Regenerated all 364 existing winning witnesses through legal card actions,
  preserving every sampled instrument. All 109 Node tests pass, including the
  continuous campaign, individual-population contracts, renderer independence,
  exact live counts, and the earlier cut-rule regressions.
- Local headless Edge checks passed at 390px and 1280px with 10,000- and
  20,000-recipient audiences: exact live/final totals, A/B accounting, expected
  verdicts, and no horizontal overflow or runtime errors. The five scenarios
  used 183-424 visual groups; unprepared stress runs averaged approximately
  17-24 ms between frames. These are local measurements, not physical-device
  guarantees or a passing CLI harness run.
- Updated the current player, evidence, development, and harness guides.
  The initial full Puppeteer run was blocked by missing tooling; the later
  successful run and publication receipt are recorded above.

## 2026-11-02 - Cut any question except the last

- Campaign and Quick Challenge players may cut any question, including
  core, mandatory-BRD, and late-added cards. The only structural cut
  restriction is keeping one question. The last CUT button is disabled
  and grayscale; restoring or adding a question enables cutting again.
  Both launch paths reject an empty instrument without charging it.
- Cutting permission does not remove study requirements. Missing core
  items retain their quality deduction, missing agenda coverage lowers
  Insight, and unmet mandatory BRD requirements prevent a challenge win.
  A cut required late item is explicitly NOT MET rather than falsely
  reported as fielded.
- Updated setup/MPOR copy, current guides, and the tracked browser scenario.
  All 97 Node tests pass, including the 364 unchanged winning witnesses,
  the continuous campaign, and cut/BRD-penalty regressions. The focused
  specifications failed against the old locks before implementation.
- Integrated-browser checks passed at 390px and 1280px: arbitrary/core
  cuts down to one, native disabled/grayscale appearance, refused final
  cut, real restore/bank controls, one-question launches, and penalized
  reports for missing campaign/Quick Challenge coverage. No overflow or
  runtime errors occurred.
- The tracked browser script passes syntax validation, but its CLI run
  was initially blocked by unavailable Puppeteer; the later UAT entry above
  records the successful full run. Publication is recorded above.

## 2026-11-01 - Documentation and publication audit

- Updated the README and every design/play/development/deployment guide
  for the evidence-fitness release, including a public
  [implementation summary](docs/evidence-fitness.md).
- Distinguished historical concepts and contracts from current rules
  without rewriting the original design rationale. Corrected stale
  coaching, fixture-coverage, core-cutting, CI-build, and browser-tooling
  claims, and added Windows harness configuration.
- Kept source feedback local and excluded from publication. Public
  documentation describes implemented behavior and its limits only.
- Gameplay release `3661c23` was pushed directly to `main`.
  [Production workflow 41366863464](https://github.com/fabioc-aloha/SurveyFunnel/actions/runs/41366863464)
  passed build, Node tests, deployment, and live-package verification.
  An independent `node scripts/verify-deployment.mjs` run also matched
  live HTML, font, license, QR, headers, and unpublished-document checks.
- This documentation-only follow-up records that receipt without changing
  the game package. The full CLI browser limitation remains open; a green
  deployment does not close it or the remaining human checks.
- Documentation receipt `f57b0c7` also passed
  [production workflow 41367108944](https://github.com/fabioc-aloha/SurveyFunnel/actions/runs/41367108944),
  including live-package verification. Independent production verification
  passed again afterward; no additional gameplay changes were pending.

## 2026-11-01 - Evidence fitness: first feedback release

- Implemented the [evidence-fitness first release](docs/evidence-fitness.md).
  The campaign now
  requires five independent checks: funnel execution, evidence fitness,
  data integrity, audience sustainability, and operational trust.
  Response rate is a mission-specific diagnostic benchmark, not a
  campaign win gate. Winning grades use the weakest quality, usable
  Insight, or cleaning-retention result rather than averaged rate.
- Added minimum usable samples, required audience pools and role shares,
  and invited-account matching. Post-response processing removes
  duplicate, junk, speeder, straight-lined, and guessed responses once
  each, excludes unmatched forwarded responses, then recomputes Insight.
  Rejected responses cannot satisfy coverage or agenda requirements.
- The report continues FINISH, CLEAN, MATCH, INTERPRET, PUBLISH, ACT.
  Failed checks withhold publication and name next actions; ready
  evidence includes a baseline and limitations note. HUD, setup, BRD,
  MPOR, README banner, and the player/development guides describe the same goal.
  Sample thresholds are simulation rules, not statistical guarantees.
- Campaign audience pools now retain health, send/instrument history,
  suppression overrides, and role response counts across instruments.
  Repeated contact costs goodwill and can reduce opens. Changing the
  instrument does not clear history; a whole-campaign reset does.
  Quick Challenges retain their own objectives and isolated state.
- Regenerated all 364 existing UI-legal winning witnesses without reducing
  the sampled instrument set. Added gate-boundary, wrong-population,
  below-benchmark usable-evidence, cleaning, account matching, persistence,
  Quick Challenge isolation, and continuous six-level campaign tests.
  The continuous Level 4 strategy changed to preserve its 35-goodwill
  gate; no budget, core lock, or instrument floor was relaxed.
- Extended the tracked browser journeys with five-check, pipeline,
  disclosure, benchmark, and cross-instrument history assertions.
  All 94 Node tests passed, including the 364 witnesses and continuous
  campaign. Browser-tool checks passed real-control Level 1 winners
  at 390px and 1280px, the scorecard layout, pipeline, next-instrument
  history, BRD requirements, and keyboard focus restoration, without
  overflow or runtime errors. The full CLI browser harness remains blocked here: Puppeteer
  was absent and the external test-only install was refused by the
  environment's package-fetch policy. No runtime dependency was added.
- Governance, detailed compliance, richer localization, portfolio
  granularity, AI advice, and learning assessment remain explicitly
  tracked in [TODO.md](TODO.md). The verification above was local;
  production confirmation is a separate publishing-workflow result.

## 2026-11-01 - Report verdict messages in plain words

- The three manager captions on the round report now state the
  facts first, in plain words. The win caption ("Clean send. The
  manager approves, and so does the breaker panel.") left a
  first-time player asking what it meant, and whether the campaign
  had been stopped by a detected condition; it now reads: "The send
  finished and met every target: the response rate beat the level
  target, data quality and Insight passed their gates, and the
  audience's goodwill never hit zero, so nothing was cut short.
  That is a clean send." The breaker-trip caption now names the
  cause ("Goodwill reached zero mid-send, so the breaker tripped
  and the send stopped... The goodwill ledger below shows what
  spent it."), and the loss caption drops the leak metaphor ("The
  send finished, but it missed its targets. The report below shows
  where responses were lost and which fix recovers the most.").
  The grade stamp for a lost round now reads TARGET MISSED instead
  of NOT YET. No numbers, thresholds, or rules changed; the rest
  of the report's verdict lines were audited against the same
  first-read test and already state their facts plainly (the FAST
  AND USELESS verdict paragraph defines its own stamp, the twist
  lines print the bar and the measured value, the bounce-backs
  lines explain catch-all in place), so they are unchanged.

## 2026-11-01 - Run screen: distinct gave-up glyph; phone question chips collapse

- The opened-then-bounced drop has its own mark. The return arrow
  (↩) meant two events at once: an email bounce-back at the DELIVERED
  gate (which piles in the strip) and a respondent who opened the
  invite, never started, and dropped on the spot mid-track. In a
  zero-bounce run the second kind's arrows read as bounce-backs
  refusing to pile. The drop now shows the envelope crossed out
  (✉✗, sized like the two-envelope duplicate mark): saw the mail,
  gave up. ↩ appears only on bounced sprites, in flight and settled
  in the pile. Event names, causes, counts, and copy are unchanged;
  only the icon moved.
- Phone widths (620px and under) no longer fan the question chips.
  A dozen Q-chips spread across the survey stretch overlapped into
  unreadable mush at 390px. The fan is still rendered, and CSS swaps
  it for one summary strip in the same header zone: "12 QUESTIONS ·
  7 FLAGGED", carrying the fan's counts (questions kept, questions
  still flagged, in the fan's red when any are). The strip hangs
  from the fan's right end and grows left, so it never reaches the
  finish flag. What the summary drops: the per-question identities
  and positions along the stretch. The chips were never interactive,
  and neither is the strip. Desktop keeps the fan exactly as it was;
  the header zone height is unchanged, with no overflow and no page
  errors at 390px.

## 2026-11-01 - Final visual pass: layout and copy fixes

- Gate labels at phone widths: at 9px the five labels clipped and
  collided at 390px (INVITED lost its first letters off the track's
  left edge, DELIVERED and OPENED ran together, FINISH touched the
  right edge). At 620px and under they now render at 7px with
  tightened letter spacing, and INVITED plus its pile column shift
  8px right together, keeping the label-to-column alignment the
  harness measures. All five labels sit fully inside the track with
  clear gaps; desktop is unchanged.
- The run-screen manager figure stands 30px lower in the track. Its
  head used to sit on the dashed gate line under the INVITED label,
  with the SENDING... stamp across its face. The figure, nameplate,
  moods, and agitation are unchanged, just lower; the stamp now
  clears the head at both widths.
- Report and challenge buttons (.againbtn) gain line-height: 1.6.
  Wrapped labels (TRY AGAIN with credits left; the complication
  card's SET UP WAVE 2 and DECLINE buttons at 390px) were clipped
  against the button's bottom edge; they now fit inside it.
- The fallout piles read as piles at small counts. PILE_SPOTS was a
  wide fan: 1-3 settled figures landed as strays spread across the
  column and did not read as a pile. The spots are now ordered as a
  heap (center-bottom first, then flanks, then stacked rows with
  overlap), so 2-6 bounces mound up under the BOUNCED label. The
  12-figure cap, exact label counts, and strip height are unchanged.
  A settle audit across Fresh, Stale, and Blast runs confirms every
  bounced sprite ends the run settled in the strip: the piled count
  equals min(12, BOUNCED) in every run, with no bounce sprite left
  standing mid-track.
- The sound panel's Music and SFX labels are now single flex units,
  so a label's name and slider can no longer split across rows when
  the panel wraps.
- Copy untangles, same facts and numbers throughout: the field
  guide's Quick Challenge wall of text is now four short paragraphs;
  the launch checklist header reads "THIS LIST ONLY INFORMS · THE
  BUTTON ENFORCES THE BUDGET AND THE MINIMUM INSTRUMENT"; the
  deliverability line parenthesizes its hard/soft bounce causes; the
  suppression-skipped, bounce-backs, and wave-2 banner sentences are
  split shorter; the validation sub-line splits at the catch-all
  clause; the GUESSES card says "on a question"; and the BEYOND
  KNOWLEDGE card no longer states its no-wording-fix resolution
  twice (the class explain dropped the sentence the card tail
  already carries).
- No gameplay, economy, scoring, or audio changes. Build validation,
  the node suite (83/83), and the browser harness (90/90 checks,
  PASS 3/3) stay green.

## 2026-11-01 - IM character redrawn at 3x resolution

- The manager's four mood maps (NORMAL, PUMP, SAD, AGITATED) are
  redrawn at 3x resolution: 42x39 cells (42x33 for SAD), up from
  14x13 (14x11). Same character throughout: same hair, skin tone,
  teal shirt, desk, and the same red headset in the same position,
  with the mic boom ending beside the mouth. The extra resolution
  goes into the face: shaped hair with strand highlights and a
  widow's peak, eyebrows, eyes with a glint, a nose, sideburns and
  ears under the cups, a polo collar, and a chest pocket with a pen
  on the desk side, a paper sheet with text lines and the red mug.
- Expressions carry more detail per mood: NORMAL keeps a slight
  closed-mouth smile; PUMP keeps its arms-up pose with raised brows
  and an open grin; SAD bows the face under a fringe with grief
  brows, closed eyes, and a downturned mouth; AGITATED keeps the
  segmented scowl with its center notch and gritted teeth, now with
  a hard stare and shadowed bags. AGITATED still derives from
  NORMAL: only the brow, stare, and teeth rows differ.
- Consistency is asserted in the suite: exact dimensions and uniform
  row widths, and headset parity - the R-family cells (R plus its
  new dark shade r) in the head rows occupy identical coordinates
  in all four maps, so the head and headset sit at the same top
  rows in every mood.
- PAL gains four shade letters (h hair highlight, s skin shadow,
  r headset dark red, b teal shade); every existing letter's color
  is unchanged.
- Rendering keeps the figure's on-screen footprint identical
  (56x52 at setup and run, 70x65 at report): a new setPixelMgr
  renders the manager maps at a third of the legacy cell size, and
  pixelHTML now snaps cell edges to whole device pixels so the
  fractional cells tile crisply instead of antialiasing (the
  identity at integer cell sizes). Respondent sprites and every
  other pixel map are untouched. Node suite 83/83 and the browser
  harness (90/90 checks, nameplate and agitated-class assertions
  included) stay green.

## 2026-11-01 - Browser regression harness integrated

- The browser regression harness is now tracked in the repository at
  `scripts/harness/` (`run-all.mjs`, `browser-suite.mjs`,
  `self-test.mjs`, and a README adapted to the in-repo location). The
  external copy at `~/workspace/test-harness-survey-funnel/` stays in
  place as the historical original; the repo copy is canonical.
  Generated output under `scripts/harness/results/` is git-ignored.
- The Level 1 browser fixture was legalized for the cut floor: Q3 is
  core, so the scripted playthrough repairs it with ANCHOR and cuts
  Q5, Q7, Q8, Q10, Q11, and Q12, keeping exactly the six core
  questions (the legal fixed winning line, 58 of 120 credits).
- New browser coverage for what shipped after the harness was built:
  a cut-floor scenario (core CUT controls locked and disabled, cutting
  stops at the six-question floor, the floor note announces the locked
  minimum, and a locked cut attempt changes nothing); a Quick
  Challenge second-wave scenario pinned to seed 6666 (LIST REALITY,
  wave 2 mailed raw against the true 9%-invalid list) proving the
  pile strip's five columns sit under the funnel step labels, settled
  bounced figures accumulate and persist late in the run in step with
  the BOUNCED count and envelope fan, and the manager figure turns
  agitated during the high-bounce run; and a campaign scenario proving
  the report's BOUNCE-BACKS section lists simulated bounced addresses
  on a bouncing run. The Quick Challenge final report is a two-wave
  summary and carries no BOUNCE-BACKS section, so that check lives on
  the campaign report.
- Provisioning is explicit, never assumed: Puppeteer and Chrome are
  test tooling only, resolved by environment override first
  (`PUPPETEER_MODULE`, `PUPPETEER_EXECUTABLE_PATH`), then known
  workspace installs and Puppeteer cache builds, with fresh-machine
  install commands documented in `scripts/harness/README.md` and
  `docs/development.md`. No game dependency was added.
- Official verdict against the shipped game: `node
  scripts/harness/run-all.mjs` PASS, 3/3 sections (build validation;
  Node suite 83/83; browser suite 90/90 checks at 390x844 and
  1280x800 plus the feature scenarios). `node
  scripts/harness/self-test.mjs` PASS, 2/2: the deliberately broken
  copies (2000px horizontal overflow and a throwing page-error script)
  were both caught with the expected failed checks. No defect in the
  shipped game was found; `site/index.html` is unchanged.

## 2026-11-01 - The IM reacts live to run events

- The run-screen manager now reacts to the blast while it happens,
  driven by a mood state machine fed only by quantities the run
  already tracks; nothing feeds back into the simulation, the tally,
  or scoring. The baseline is pace: the run's own finish schedule
  sets the window, the finishes needed to beat the target are
  floor(target x sent) + 1 from the tally and the level target, and
  the face leans PUMP when ahead, SAD when behind late in the
  window, and settles on the outcome as the window closes.
- Event reactions on top of the baseline: a cluster of three
  finishes inside 1600 ms or a reminder wave recovering several of
  the unopened cheers (PUMP); five seconds without a finish
  mid-window while still short sours (SAD); the bounce pile
  crossing 4 settled bounces agitates, crossing 8 escalates, as do
  DOMAIN REPUTATION AT RISK, bursts of mid-survey abandonments,
  guesser and speeder/straight-liner bursts, an opted-out
  respondent mailed anyway, and duplicate envelopes (AGITATED).
  Holds run 1.5 / 2 / 2.5 s by severity; higher severity interrupts
  at once, otherwise a 1000 ms dwell stops flicker, and expiry
  returns to the pace baseline. A breaker trip locks the face on
  SAD for the rest of the run, matching the report's end-state face.
- AGITATED is a fourth pixel map in the same 14 x 13 frame as
  NORMAL and PUMP: furrowed brows and a gritted-teeth mouth, with
  the headset, body, and desk cells identical to NORMAL (the three
  existing maps are byte-unchanged), plus a small jitter on the
  figure while agitated. Under prefers-reduced-motion the jitter
  is off and the face alone carries it. The IM nameplate stays
  attached in every mood, and the report keeps its existing
  end-state faces.
- Tests: the machine is covered as a unit (pace baseline, exact
  bounce thresholds at 4 and 8, cluster and drought, burst
  detection, reminder and reputation reactions, arbitration,
  trip lock) and against real built runs (needed count and finish
  window read off the pinned configurations); the pinned tally
  test passes unmodified. Verified in headless Chrome against the
  built package: PUMP, SAD, and AGITATED captured from real runs
  (Fresh/full, Stale/partial, Executive Blast with validation
  skipped), each face reading distinctly with zero page errors.

## 2026-11-01 - Bounce pile: bounced sprites stay and pile up

- Fixed a live-play defect: bounced sprites travelled down into the
  run screen's pile strip and then faded to invisible (`.sprite.piling`
  transitioned opacity to 0), so the bounce pile never accumulated
  anything but the small envelope glyphs and did not read as a pile.
  Bounced sprites now settle into the BOUNCED column and stay for the
  rest of the run, return markers up: the pile is the settled figures
  themselves and visibly grows bounce by bounce.
- One settled figure per glyph-fan slot. A later bounce on an occupied
  slot lands on top of the figure already there and buries it (the
  buried element leaves the DOM once the landing finishes), so the
  strip never holds more than the fan's twelve figures while the
  BOUNCED · N label keeps the exact count. Pile counts, the tally, and
  every other engine number are untouched.
- Never-opened sprites keep the old fade, now scoped to a `.pilefade`
  modifier: the unopened pile is its envelope fan, which already grows
  on deliveries and drains on opens, so the body fading into its
  envelope reads correctly there. Under prefers-reduced-motion both
  routes land instantly; settled figures persist at full opacity.
- A regression test pins the behaviour (the settled rule carries no
  fade, thirteen routed bounces leave twelve settled figures with the
  first buried, the never-opened route keeps its fade); it fails on
  the pre-fix file and passes now. Verified in headless Chrome at
  desktop and 390 px: a 10-bounce Executive Blast run's pile grows
  from 4 settled figures to all 10, both labels stay legible, zero
  horizontal overflow.

## 2026-11-01 - Quick Challenges, stage 3 of 3: the second wave

- A challenge no longer always ends at its first report. Most runs
  now draw a complication after the wave 1 report, from the same run
  seed and machinery as the BRD twist (`quickComplicationDraw`,
  `"qccomp|<index>|<seed>"`); about one run in four stays clean. The
  card is a stakeholder interruption with three flavors: LIST
  REALITY (the extract behind the send was nine months old, so the
  list really runs 9% invalid, and the provided validation was run
  against the stated extract and does not carry), THE LATE QUESTION
  (a named stakeholder — Legal, the sponsor, Support leadership, or
  Compliance, rotating by draw — adds one real defective bank
  question that cannot be cut: repair it or carry it as written),
  and SECOND PUSH (the sponsor wants the non-openers mailed again;
  it fields as reminder waves at the book's 8 cr and −5 goodwill per
  wave, and the card says so when the pool cannot fund it).
- Accepting opens a wave 2 setup on the same 48-credit pool, which
  never refills: the accounting freezes at wave 1's launched
  configuration and credits back the bought batch
  (`QUICK_BASE_COST`), so only wave 2's own actions are charged
  (repairs, cuts, validation tiers, reminder waves), all priced and
  capped by the existing budget machinery. Wave 1's ending goodwill
  and reputation carry into wave 2, and re-send fatigue applies.
  Declining is free and leaves the wave 1 report as the final
  result, with the decision recorded on the card.
- Wave 2 is a genuine second run through the existing simulation
  under the updated configuration, not a scripted outcome. The
  final report prints wave 1, the complication and the choice made,
  wave 2, and a combined line: the verdict sums both waves'
  completions and sends for the response rate, reads quality and
  Insight from the final instrument's wave, and re-checks the BRD
  repairs, the scored extras, and the stage-2 twist (which still
  gates) against the final instrument. A wave 1 loss can be rescued
  and a wave 1 win can be put at risk by the player's own choices:
  the tests prove a rescuing line per flavor inside the pool, a
  losing line per flavor, an audit-bar win flipped by carrying the
  late card broken (quality 100 → 83 against the 95 bar) and held
  by repairing it, exact cross-wave accounting with no double
  charge, and the unfunded-push refusal. Suite: 71 tests.

## 2026-11-01 - Quick Challenges, stage 2 of 3: the BRD variation pack

- Every Quick Challenge run now draws one BRD twist from the run
  seed, so the same six cards no longer have one memorized answer.
  The draw reuses the instrument draw's machinery (`hashStr` +
  `mulberry` over `"qcvar|<index>|<seed>"`): the same seed always
  deals the same brief, the seed is printed in the BRD, and a retry
  draws a fresh brief. `startQuickChallenge` accepts an optional
  seed; the twist is stored on `state.quickChallenge` and resolved
  by `quickVariant()`. The twist never reseeds the run simulation,
  so stage-1 lines keep their exact scores.
- Three twists per challenge, across three lever families. The
  stakeholder demands make one extra required (kept and repaired,
  its cut refused with reason `"required"`): QC1's Q26 (the
  sponsor's question), QC2's Q7 grid (the scorecard's only input),
  QC3's Q12 (Compliance's security item). The raised bars: QC1's
  reporting threshold (response strictly above 17.5%), QC2's reach
  bar (above 20%), QC3's audit bar (data quality 95+). The time
  ceilings, read from the engine's `estMinutes` on the repaired
  instrument: QC1's short shift (1.5 min), QC2's four-minute
  ceiling, QC3's one-minute rule (1.1 min).
- Enforcement is real, not cosmetic: a mandatory extra resolves
  only by its repair in `quickExtraResolved` and re-checks in the
  verdict; a ratebar raises the target through `curLevel()` so the
  HUD, BRD, and verdict read one bar; the audit gate flows through
  `quickQualityGate()`; a time ceiling compares the launched
  instrument's estimated minutes. The BRD prints a BRD TWIST
  section with the brief and seed, the acceptance criteria gain the
  twist line and the effective bars, the challenge banner repeats
  the acceptance line, and the report prints a twist verdict
  (MET / NOT MET with the measured value) next to the BRD repairs
  and extras resolved lines.
- Balance was measured on the engine before the numbers were set:
  every variant has a winning line inside the unchanged 48-credit
  budget, and for each variant a base-winning line loses on the
  twist alone. The intended lines reach exactly 17.5% and 20%
  against the two response bars, read 1.88 / 5.0 / 1.25 minutes
  against the three ceilings, and cutting every extra scores
  quality 93 against the audit bar of 95; the cutting lines win
  the rate and ceiling twists, the repair lines win the audit bar
  and the mandatory twists. Four new tests (61 total) pin twists
  by seed scan, prove the sweep reaches all three variants per
  challenge, drive both a violating and a winning line per twist
  through the card handlers, and prove no twist leaks into the
  campaign BRD, gates, or floor. The MPOR Quick Challenge section
  and both guides document the system.

## 2026-11-01 - Fallout piles move to a bottom strip under their funnel steps

- The bounce and unopened piles no longer sit up at the funnel
  gates inside the sprite traffic. The run track keeps its five
  step labels across the top, and a new PILE STRIP runs along the
  bottom of the track: five quiet columns positioned from the same
  GATE_X gate map, so each column lines up under its step label at
  every width. The BOUNCED pile lives in the DELIVERED column, the
  UNOPENED pile in the OPENED column; the other columns stay empty.
- Sprite routing now matches the layout: a sprite that bounces at
  the DELIVERED gate slides down into the bounce pile and settles
  onto its glyph fan, and a delivered-but-unopened envelope drops
  the same way into the unopened pile. The landing point is measured
  from the rendered stack, so the phone layout (scaled-down fans,
  the unopened pile lifted one label-height with its label above
  its stack) lands sprites correctly too. Opens still draw the
  unopened pile down, and the REMINDER SENT stamp still anchors
  over the unopened pile, now in the strip.
- Counts and model are unchanged: bounced = hard + soft bounces,
  unopened = delivered minus opened, glyph cap 12, exact counts in
  the labels. The strip fits the track at desktop and 390px with
  zero horizontal overflow; at phone widths the two labels measure
  clear of each other and of both glyph fans. Under
  prefers-reduced-motion, sprites settle into the piles instantly.

## 2026-11-01 - Quick Challenges, stage 1 of 3: six-card drills with real cut decisions

- Each Quick Challenge now deals six questions instead of three: its
  three signature BRD cards (still forced core) plus three curated
  non-core extras, so cutting becomes a judgment in the drill, not
  just repair. QC1 adds Q26 (LEADING), Q57 (stupid, vanity), and Q22
  (BROKEN OPTIONS); QC2 adds Q7 (GRID BURDEN), Q51 (WORDY STEM), and
  Q68 (filler); QC3 adds Q12 (SENSITIVE NO ASSURANCE), Q23 (BEYOND
  KNOWLEDGE, no wording fix), and Q60 (stupid, nosy). Every challenge
  carries at least one clear CUT candidate and at least one
  fix-or-keep call in its teaching theme.
- The challenge floor is now the instrument's core count (3):
  extras can be cut down to the BRD set and no further, and the floor
  note says so. Campaign floors are unchanged (six, or the dealt
  size). The cut guard itself is untouched.
- Budget re-derived as the named constant `QUICK_BUDGET = 48`: base
  34 (send 30 + Honest Ask 4) + signature repairs 6 + the priciest
  intended extras line 6, plus 2 credits of headroom. The intended
  lines total 45, 46, and 44; cutting every extra totals 43 on all
  three challenges. Both lines win per challenge, verified through
  the game's own card handlers in the test suite.
- A win now requires all three BRD repairs plus every extra
  resolved (defective: repair or cut; low-value: cut; clean: keep or
  cut). The challenge report shows BRD repairs and extras resolved
  as separate counts. The agenda stays the BRD's alone: extras are
  scope creep, never agenda topics, and the BRD, the challenge
  banner, and MPOR now say the drill includes questions the BRD did
  not ask for. Stages 2 (BRD variation) and 3 (second wave) are not
  in this build.

## 2026-11-01 - Fallout piles: bounces and unopened mail pile up where they happen

- The run screen now shows the funnel's fallout as it resolves: a
  BOUNCED pile of returned envelopes grows at the DELIVERED gate,
  and an UNOPENED pile accumulates at the OPENED gate for delivered
  mail nobody opened. Glyphs cap at 12 per pile; the labels keep the
  exact counts, driven by the same gate and drop events the tally
  counts, so a pile can never disagree with the report.
- Reminder emails read as what they are. The invite-stage control
  now says each wave goes only to people who have not opened yet
  (8 cr and -5 goodwill per wave, unchanged), and during the run
  each bought wave fires a visible REMINDER SENT beat as its first
  recovered open lands. Presentation only: the simulation is
  untouched, and a regression test pins the run tallies to the
  pre-change engine's numbers.
- The report's deliverability card prints the run's unopened count
  (UNOPENED · N sat in inboxes), from the same tally as the piles.

## 2026-11-01 - Code review fixes: the proof now matches the game

- The winnability corpus was regenerated from UI-legal lines only:
  364 verified legal winners (65 per level except Level 4, whose
  ending-goodwill gate admits 39 of its 65 draws in the searched
  space). The winnability test now applies every setup through the
  game's legal action paths, cuts included, and asserts per-level
  minimums, so a green suite once again means a player can reach
  the wins it proves. docs/development.md's balance notes were
  corrected to match shipped behavior.
- startRun itself now refuses a sub-floor instrument (no state
  change, no charge), backing the launch button's refusal; Quick
  Challenges are exempt because their cards are all core and
  uncuttable, and their report owns degenerate states.
- Bank adds joined the budget diff: cutting an added question and
  restoring one cut in an earlier attempt now charge the priced
  1 cr each, as the cut tray always promised. A regression test
  covers the add, cut, restore sequence across attempts.
- Dead code removed (mnote, cutCount, allQuestionPool); the deploy
  workflow builds the site package explicitly instead of relying on
  a test side effect; smaller review nits: the A/B too-close flag
  resets per report, the finale harmony no longer bends the lead's
  glide, the Quick Challenge base cost is a named constant, and the
  stakeholder full-price rule and the draw seed's scope are now
  documented where they live.

## 2026-11-01 - Bounce-backs: the report names the addresses that came back

- The run report's DELIVERABILITY AND DATA card gains a BOUNCE-BACKS
  section: the header gives the run's bounced total with its hard and
  soft split, followed by a sample of up to 8 individual bounced
  addresses, each with its bounce type, its reason (mailbox not found,
  domain not found, mailbox full, temporary server failure), and the
  cause from the validation story: a catch-all pass when full
  BrightVerify validation still let it through, "never checked" when
  validation was skipped, and a split of the two under partial
  validation. A "+ N more" line keeps the sample plus remainder
  exactly equal to the total; a zero-bounce run renders a clean
  "No bounce-backs" line instead.
- The counts are not a second simulation: they are rounded from the
  same sprite tally, at the same scale, with the same rounding the
  funnel paragraph prints, and soft is total minus hard so the split
  always sums to the printed total. Partial-validation causes follow
  the engine's survivor model (survivors are 45% of the raw invalid
  rate; the 15-point catch-all floor is 1/3 of them, the unchecked
  remainder 2/3). Addresses are generated deterministically from the
  run's own seed, stored on the run so re-renders show the same list,
  and use fictional .example domains throughout.
- Five new tests (48 total) cover reconciliation against the funnel
  for skip/full/partial runs, the cause rules, determinism, the
  8-entry cap with exact remainder, and the zero-bounce clean state.

## 2026-11-01 - Question buttons: one line when it fits, no overflow when it stacks

- The verb and its price now share one line whenever they fit
  (desktop CUT · 1, ANCHOR · 2), instead of the price always being
  forced onto its own line by the column layout. The button is a
  wrapping row: at phone width a long verb wraps between its words
  and the price drops below it, centered.
- This also fixes the worst case the browser harness caught: Q12's
  ADD PRIVACY LINE (three label lines plus the price) overflowed its
  60px button's content box by 2px. Measured after the fix at 390px,
  every questionnaire action button has scrollHeight within 1px of
  clientHeight, and every button keeps the uniform 60px height.

## 2026-11-01 - Questionnaire cut floor: the instrument cannot be emptied

- A player could CUT every question and still launch an empty
  instrument. That is now impossible: CORE questions can never be cut
  (their CUT button renders disabled with the reason on the button and
  a LOCKED · CORE line on the card), and cutting stops at a floor of
  6 kept questions (the floor is the dealt size itself in modes that
  deal fewer, so the 3-card Quick Challenges are fully locked).
- The guard lives in the cut action itself, not only in the buttons,
  so no caller can bypass it; a refused cut changes nothing and
  charges nothing. RESTORE and ADD FROM BANK lift the instrument off
  the floor and re-enable cutting.
- A stage-level note states the minimum and flags the at-minimum
  state; the launch checklist gains an instrument-size row, and a
  sub-floor instrument (reachable only by direct state edits) leaves
  the LAUNCH button disabled with "TOO FEW QUESTIONS · MIN 6".
- Five regression tests drive the game's own CUT handler: core
  lockout, the floor holding under repeated attempts, restore/add
  re-enabling cuts, the checklist/launch refusal, the floor branch
  itself on a low-core instrument, and the Quick Challenge floor
  formula. They fail on the pre-fix game and pass now (43 tests
  total).

## 2026-11-01 - Moog-first soundtrack: A minor synth funk

- The chiptune soundtrack is replaced with a brand-new composition
  written for a Minimoog-style synth: A minor synth funk at 120 BPM.
  A syncopated 64-step bassline (saw plus sine sub-oscillator through
  an enveloped lowpass) carries the track; the lead is sparse, with
  portamento between close notes and a resonant filter whose peak
  opens bar by bar (1500 to 2700 Hz) across the loop.
- All music voices run through a gentle soft-saturation bus. The run
  variant's arp is now filtered sawtooth plucks; setup stays sparse
  (even-step bass, lead in bars 1 and 3, softer filter); run6 keeps
  its +4 harmony lead, now in the same Moog voice. Drums, the title
  echo, and every audio function signature are unchanged.
- Build validation and all 38 tests pass. As always, a human listen
  on the live site is the real check.

## 2026-11-01 - Nameplate reads IM only

- The manager desk nameplate now reads just "IM" (never spelled
  out) in all three placements: setup launch bar, run track, and
  the round report.
- The plate shrinks to fit the short text (a 48px minimum so it
  still reads as a plate); the brass styling, border, pixel font,
  and letter-spacing are unchanged. Build validation and all 38
  tests pass.

## 2026-11-01 - Questionnaire action buttons: tidy, even rows

- The per-question action row (KEEP, the class fix verb, CUT, and
  the disabled NO WORDING FIX) no longer wraps raggedly. The pixel
  font now gets an explicit line-height on these buttons (wrapped
  labels previously overlapped and clipped), buttons share a
  uniform 60px height, and flex min-width no longer lets the
  longest word steal width from its neighbours.
- The fix button takes a deliberately wider share of the row, and
  the price suffix (for example "· 2") sits on its own smaller
  line under the verb instead of wrapping mid-label. Button text,
  prices, and behaviour are unchanged.
- Verified in headless Chrome at 390px and 1000px before and
  after. Build validation and all 38 tests pass.

## 2026-11-01 - Manager legibility: headset sprite and IM nameplate

- The three manager mood sprites (normal, pumped, sad) now wear a
  red headset: a band over the hair, ear cups at both sides of the
  head, and a microphone boom ending beside the mouth. Sprite
  dimensions are unchanged, so nothing in the layout shifts.
- A desk nameplate reading "IM · INSTRUMENT MANAGER" now sits
  beneath the manager figure on the setup launch bar, the run
  track, and the round report: dark engraved plate, light border,
  letter-spaced pixel font.
- No gameplay, balance, or audio changes. Build validation and
  all 38 tests pass.

## 2026-11-01 - New main theme: 132 BPM animated composition

- The v2 main theme was replaced wholesale after the first human
  listen rejected it: a new 32-eighth-note lead over C, G, Am, F
  (one chord per bar), with bar 4 ending on a pickup back into
  bar 1.
- Tempo up from 112 to 132 BPM. The bass is now a pulsing octave
  drive in title and run, thinned to slots 0, 2, 4, 6 in setup,
  and the title echo is retimed to a dotted eighth at the new
  tempo.
- The v2 machinery is unchanged: drums, echo, compressor chain,
  scheduler, and the title/setup/run/run6 variants. No SFX,
  gameplay, or API changes. Build validation and all 38 tests
  pass. The second human listen remains open (see TODO).

## 2026-11-01 - Audio v2: soundtrack and SFX improvement

- Music loop doubled to 4 bars (C, F, Am, G) with an A/B lead phrase
  (detuned dual square through a lowpass), a moving bass line, kick,
  snare, and accent hats, a dotted-eighth echo on the title variant,
  and the setup/run/run6 variants kept distinct.
- All audio now routes through a shared compressor master chain and
  an SFX bus. Signatures gained click-free attacks, bell partials on
  the ding and chime, layered coin/spend/buzz/fanfare/alarm/stamp
  voices, and music ducking under the biggest effects.
- No gameplay, balance, or API changes: every audio function kept
  its name and call semantics. Build validation and all 38 tests
  pass. The human listen on the live site remains open (see TODO).

## 2026-10-31 - UAT fixes, difficulty and terminology release

- Gameplay commit `f8b2fac` deployed successfully in
  [run 41236593589](https://github.com/fabioc-aloha/SurveyFunnel/actions/runs/41236593589).
  All 38 tests passed locally and in the production workflow.
- Independent verification matched live package bytes, security/MIME
  headers, and unpublished-document 404s. A live uninterrupted campaign
  reached Season Results with 6/6 wins and no runtime errors. Live checks
  also passed difficulty/terminology labels, the finale HUD, MPOR/BRD
  keyboard focus restoration and inert background, and the 0px collapsed
  QR border. Human audio and physical-device checks remain open.

- Fixed missing post-win navigation, multi-control retry budget recovery,
  and Executive Blast retries offered below its 45-credit batch cost.
- MPOR and BRD now keep keyboard focus inside the active dialog, make
  background controls inert, and restore opener focus on close.
- Affordability and warning labels refresh when other controls change
  costs; owned preparation and attempt-chain audience locks remain.
  Reminder listeners are registered once rather than during rendering.
- Added approved Easy labels to Levels 1/2, Medium to 3/5, and Hard to 4/6.
  Cards, HUD, BRD, and campaign summary agree. The finale HUD shows its
  actual Insight 70+ gate.
- Renamed Level 5 Global Fieldwork and described its five modeled language
  groups. Corrected renewal and self-service item wording, kept deliberate
  questionnaire defects, and replaced player-facing "stupid" tier labels
  with low-value terminology without changing their scoring.
- Clarified item nonresponse, the simplified response-rate denominator,
  teaching-game indices, deterministic replay, conditional privacy lines,
  and the unscored A/B verdict. Updated current player guidance and
  marked historical bank-design notes as design rather than current rules.
- Goodwill ledger separates report-back restoration, invitation rewards,
  and stakeholder penalties. The collapsed QR icon has no outer border;
  the expanded panel keeps its frame.
- All 38 tests pass, including 390 winning setups through actual launch
  and report scoring: six fixed starts and 384 seeded draws. Every witness
  fits the initial budget; Level 4 retains Tired and Level 6 Executive Blast.
  No simulation rates, costs, or acceptance gates were weakened.
- Browser checks passed the uninterrupted six-level campaign through
  Season Results, actual 35-credit retry recovery, the finale's
  35-credit/no-retry case, dialog keyboard behavior, and computed QR/layout
  checks at 390px and 1440px. The desktop title capture was inspected.
- Authorized publication is verified for the gameplay commit above.
  Human audio, physical-phone,
  cross-browser, and screen-reader checks remain in [TODO.md](TODO.md).

## 2026-10-31 - Gameplay release

- Gameplay commit `3df78b8` deployed successfully in
  [production run 41231850728](https://github.com/fabioc-aloha/SurveyFunnel/actions/runs/41231850728).
- All 21 tests passed locally and in CI. Independent post-deployment
  verification matched live asset bytes, MIME/security headers, and
  unpublished-document 404s.
- Live browser checks passed QR layout at 390px and 1440px CSS widths,
  mouse/keyboard toggling, MPOR/BRD top and focus behavior, and a
  repaired 40-credit challenge win. A desktop screenshot was inspected.
- Human audio listening and approval for a tracked browser suite remain
  open in [TODO.md](TODO.md).

### 2026-10-31 - Continuity reconciliation

- Preserved the previous handoff's release evidence here before pruning it.
  Gameplay commit `3df78b8` was followed by documentation commit `58af2ed`;
  [run 41232048723](https://github.com/fabioc-aloha/SurveyFunnel/actions/runs/41232048723)
  succeeded without changing the game package. These are prior observations,
  not a new live-deployment check.
- The earlier release's ten campaign setups matched committed budgets and
  simulation results apart from question-ID event metadata. Local checks
  covered all three challenge wins, cut/restore, retry/next/back, campaign
  isolation, reactions, skipped/full animation, stakeholder choices,
  reduced-motion play, and 390px/1440px layouts.
- Prior live checks matched package bytes and headers, unpublished docs
  returned 404, and QR keyboard/mouse behavior and MPOR/BRD focus passed.
  A live repaired challenge used 40 credits with 17.5% response, quality 94,
  and Insight 100. Human audio listening was not verified.
- Default Git authentication failed during that release. A command-scoped
  GitHub CLI credential helper succeeded without changing Git configuration;
  do not assume the default helper is repaired.
- The balance audit initially found no witness for 13 Level 4 draws because
  its candidate plans kept unanswerable core items. Expanding the strategies
  found wins on the intended Tired list without weakening gates. The
  persisted 390-witness tests now check actual launch/report outcomes;
  failure of a fixed witness is not proof that no other strategy can win.
- Repeated browser probes encountered a stale or reset page. The pending
  browser-suite proposal now includes fresh-page assertions and actual
  campaign navigation, retry recovery, and modal keyboard behavior.
  Existing Node tests do not emulate browser focus or event wiring.
- No new skill or behavioral rule was justified. Retained the existing
  browser-suite approval decision and all publication/human-check tasks;
  no capability, episodic record, or native memory was created.

### 2026-10-31 - Release authorization and continuity

- Authorized publication of the gameplay, MPOR/BRD, coaching removal,
  and collapsible QR changes through the existing production workflow.
  The entries below record local implementation checkpoints, not the
  final deployment status; the release evidence above records publication.
- Reconciled the task list and shortened handoff after preserving
  implementation evidence here. No new skill, episodic record, or
  native memory was created.
- Existing feature tests cover the demonstrated challenge-win,
  forecast, and stale-callback failures. The remaining recommendation
  is a tracked browser suite in the existing backlog, pending approval.

### 2026-10-31 - Collapsible mobile QR (local only)

- The mobile QR defaults to a 49px icon. Click to expand the 196px
  mobile player panel; click again to collapse. The production link is
  separate so toggling never opens another page.
- Mouse and Enter/Space toggling passed at 390px and 1440px, with no
  horizontal overflow. All 21 gameplay/package tests passed.
- Changes remain local and uncommitted.

### 2026-10-31 - Study BRD (local only)

- Added **? Consult BRD** to setup, replacing the removed coaching
  banner with an on-demand Business Requirement Document.
- The active level or challenge determines required topics, respondent
  groups, acceptance gates, budget, and study constraints. MPOR remains
  the shared rules reference.
- All 20 gameplay/package tests passed. Browser checks at 390px and
  1440px passed opening/reopening at the top, Escape/button close,
  restored button focus, and unchanged setup state.
- Changes remain local; nothing is committed, pushed, or deployed.

### 2026-10-31 - Mobile QR portal (local only)

- Added a clickable arcade-themed QR panel left of the start-screen
  title, with teal/gold framing and pixel-font labels. On narrow screens
  it sits below the title without horizontal overflow.
- Bundled a static SVG encoding the production URL, with H error
  correction and a four-module quiet zone. No external QR service,
  runtime library, or image request is needed.
- Included the QR in production packaging and live byte/MIME checks.
- All 19 gameplay/package tests passed. Actual browser QR screenshots
  at 390px and 1440px independently decoded to the exact production URL.
- Changes remain local; nothing is committed, pushed, or deployed.

### 2026-10-31 - MPOR and coaching removal (local only)

- Renamed the in-game guide button to **? Consult MPOR** and the
  dialog to **MPOR (Master Plan of Record)**. Opening, scrolling,
  focus, and closing behavior are unchanged.
- Removed Marge's setup banner and report lesson recap as requested,
  including their unused styles and scripting. Detective diagnostics,
  fix quests, checklist, and scoring remain.
- Updated player and novice UX guidance. The combined test command
  passed 19 tests, including the guide label and coaching removal.
- Changes remain local; nothing is committed, pushed, or deployed.

### 2026-10-31 - Quick Challenge and game feedback (local only)

- Added three Quick Challenges: three defective cards, prepared audience
  and invitation, 40 credits, and one launch. All three repairs and the
  response, quality, and Insight gates are required to win.
- Retry starts fresh; Next changes scenarios; returning to levels restores
  campaign state without awarding progress or spending campaign credits.
- Added paced respondent reactions from actual simulated events and a
  short report selection. Reactions add no randomness or scoring penalties.
- Added stakeholder dialogue, live cost/minute/goodwill forecasts,
  disabled unaffordable choices, and a results-based debrief in Levels 3
  and 6. Existing trade-offs are unchanged; extras remain modeled burden.
- Fixed forecast handling of owned stakeholder choices and Honest Ask
  time-promise penalties. Cuts now apply before launch, and stale cut or
  countdown callbacks cannot change a restored campaign or restart a run.
- Added dependency-free gameplay tests to the local production workflow
  definition. The combined gameplay/package command passed 18 tests.
  Ten campaign setups matched committed simulation and budget results;
  the comparison excluded only new question-ID event metadata.
- Browser checks passed all three repaired challenge wins, cut/restore,
  fresh retry, next/back navigation, unchanged campaign progress, live
  reactions, skipped and fully animated reports, and stakeholder controls
  at 390px and 1440px. Reduced-motion play and Field Guide top/focus
  behavior also passed. Screenshots were checked for readability.
- These changes are not committed, pushed, or deployed. Human audio
  listening remains unverified.

### 2026-10-31 - Production deployment automation

- Created dedicated Free-tier Azure Static Web Apps hosting in
  GCX Prod, East US 2, with a public HTTPS hostname.
- Added GitHub Actions deployment from `main`, restricted to the
  production environment, with pinned actions and an app-scoped secret.
- Added dependency-free packaging tests and live checks for deployed
  bytes, font MIME type, response headers, and unpublished documentation.
- Normalized packaged text to LF so Windows and Linux produce identical
  deployed bytes, while preserving the binary font.
- Updated hosting, packaging, rollback, local font, and scoring guidance.
- First [production workflow](https://github.com/fabioc-aloha/SurveyFunnel/actions/runs/41228243143)
  passed packaging, deployment, and live checks. Independent Windows
  verification passed after line-ending normalization.
- Live browser checks passed local font loading, Field Guide first-open
  and reopen behavior, and a 390px-wide setup/launch/report round without
  horizontal overflow or JavaScript runtime errors. Human audio listening
  remains a release check.

### 2026-10-31 - Start screen and Field Guide

- Updated the producer branding and creator credit.
- Removed introductory and footer copy from the start screen.
  Centralized instructions and simulation/privacy information in
  the Field Guide.
- Bundled the pixel title font and its license locally.
- Field Guide opens at the top, including after scrolling and
  reopening, without losing keyboard focus on the close button.
- Included these changes and the v1.6 fixes in commit `8f05952`,
  pushed to `main`. Deployment was not verified.
- Browser checks passed for first-open and reopened guide scroll
  position, close-button focus, button close, and Escape close.
  All three inline scripts passed `node --check`; `git diff --check`
  passed. These checks are not yet a tracked regression suite.

## v1.6 - 2026-10-31 - Breaker and instrument fixes

- Goodwill breaker trips stop future invitations at the stated
  cutoff and stop everyone still in the funnel. Only completions
  before the trip count. Reports count response rate and A/B sample
  sizes from invitations actually sent.
- Question repairs now show the corrected wording or split items in
  the instrument.
- A/B arms cannot use the same invite. Removed the external font
  requests and retained the local monospace fallback.
- Updated the documented Level 6 budget and measured Level 1
  default outcome.

## v1.5 - 2026-10-31 - Big bank, Insight Value, novice UX

- Question bank expanded to 64: 26 clean, 22 defective (two per
  defect class), 10 stupid turn-off items, 6 filler. Instruments
  deal 9 to 16 questions into the same A-F skeleton by seed.
- Insight Value, the third score: per level agendas of required
  topics, credited only when asked soundly, answerable by the
  audience, and answered by the right personas. Winning now needs
  rate, quality 60+, and Insight 60+ (70+ in the finale). A run
  that passes rate and quality but fails Insight is stamped FAST
  AND USELESS, and the report verdicts every topic.
- Novice learning layer: Marge the coach (one tip per stage),
  numbered setup steps, a non-blocking ready checklist, an in-game
  field guide, a ONE LESSON recap per report, and a hints toggle.

## v1.4 - 2026-10-31 - Defect taxonomy audit

- Every question carries one of 11 research-grounded defect
  classes (or is a labeled clean control), its text genuinely
  exhibits the defect, and its fix button is the class-correct
  remedy at its price. Beyond Knowledge has no wording fix.
- Detective diagnostics report each defect OBSERVED with real
  counts or LATENT, and data quality flags trace to their classes.

## v1.3 - 2026-10-31 - Two option flow and soundtrack

- Two options after every round: TRY AGAIN continues the level on
  a shared, non refilling credit pool (prep purchases, instrument
  edits, goodwill, and reputation persist; each new send, per send
  invite, reminders, and new edits are charged again; re-sends cost
  4 goodwill; segment locked mid chain), or NEW GAME restarts with
  a new random questionnaire.
- Random questionnaires: 18 question bank, draw 12, traps
  reassigned, times jittered, reproducible INSTRUMENT #XXXX seed
  in setup. Level 1 keeps its hand tuned instrument for first play.
- Budget under 30 credits with the target unmet ends the level as
  FAILED; won levels record a budget bonus.
- Original procedural chiptune BGM (title, setup, run variants of
  one motif, Level 6 harmony) and a full event wired effects set,
  with a SOUND panel, M key mute, saved preferences, and preview
  buttons. All audio synthesized in the single file.

## v1.2 - 2026-10-31 - Full campaign, deployment ready

- Six level campaign: First Send, The Split (A/B test move), The
  Stakeholder, The Tired List, 45 Languages, The Big Quarter, with
  level unlocks and season scoring.
- Cabinet banner for the README (`assets/banner.svg`).
- Documentation set completed: player guide, deployment guide
  (Azure Static Web Apps plus fallbacks), development notes.
- Game packaged as a deployable single file at `site/index.html`.

## v1.1 - 2026-10-31 - Dear Valued Customer

- The game gets its name: **Dear Valued Customer** (code name
  Respons in small print).
- Polish pass: start screen, 3-2-1 launch countdown, 1x / 2x run
  speed, cabinet shake on breaker trip, win confetti, best grade
  tracker, patience warning on the trim screen, persona legend
  during the run, animated grade stamp.
- Campaign budget: 120 credits per round across preparation and
  execution, itemized, with budget grey outs.
- Deliverability: segment List Health, a DELIVERED gate with hard
  and soft bounces, Sender Reputation meter and domain reputation
  warning.
- Email validation step labeled Validate emails (BrightVerify):
  skip, partial, or full, with the catch all caveat stated in game.
- Data quality failures named and priced: guessers, speeders,
  straight liners, duplicates, forwarded responses, junk open text.
- Drop-off Detective gains a Deliverability and Data section.

## v1.0 - 2026-10-30 - Proof of concept

- One full round: 3 segments, 3 invites, priced reminders, 12
  question trim with Keep / Simplify / Cut and escapes, sprite
  funnel, Drop-off Detective report, response and quality scores
  with the quality gated win rule.
- Verified: deterministic replay, lazy run near miss at 10%, well
  trimmed run wins at 20%, gutted survey fails on quality,
  Executive Blast trips the breaker.
