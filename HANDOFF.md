# Handoff

## Current state

- Gameplay release `b45bb69` is committed, pushed to `main`, and deployed:
  - Any question may be cut except the last, whose CUT is gray/disabled.
    Missing BRD coverage still penalizes results.
  - Statistics use individual simulated recipients. Animation uses adaptive,
    labeled cohorts and an independent exact progress timeline. Quality
    deductions are rate-based; study gates and budgets are unchanged.
- Production is
  <https://nice-mushroom-0bdb0ef0f.6.azurestaticapps.net>.
  [Workflow 41490330923](https://github.com/fabioc-aloha/SurveyFunnel/actions/runs/41490330923)
  passed deployment and live-package verification. Independent package
  verification and production browser checks also passed. This
  documentation receipt does not change the game package.
- A persistent fixture generator remains a proposal awaiting approval.
  Population witnesses were regenerated using session-only action replay;
  no repository generator or shared test-helper module was created.
- Quick Challenge stages 2 and 3 are already implemented. New Azure
  provisioning and DNS/custom-domain work remain manual and outside
  this release.
- Production also carries the 2026-11-10/11 releases pushed after
  `b45bb69`: the gameplay copy diet, the favicon set, medallion prep
  stage phase 1 (Step 2 as Bronze / Silver / Gold with derived list
  health), the Fishbowl help overlay, and the fact-check fixes
  (BriteVerify name, accept_all label, catch-all scope, guide
  prices), deployed as `c8a1c01b` and live-verified 2026-11-11.
- Per-level surveys phases 1 to 5b are pushed and deployed
  (design in [docs/level-surveys-scope.md](docs/level-surveys-scope.md),
  all seven decisions approved as recommended 2026-11-11). Each
  level now has a survey identity: bank entries carry a `survey`
  field, Level 1 draws its own curated 36-entry Support
  Experience bank, Level 2 draws its own newly authored 36-entry
  M365 Copilot Adoption bank (ids 201-236), Level 3 draws its own
  newly authored 36-entry Azure Cloud Services bank (ids
  301-336), Level 4 draws its own newly authored 36-entry
  Account Team Relationship bank (ids 401-436), Level 5 draws
  its own newly authored 36-entry General Perceptions of
  Microsoft bank (ids 501-536), and Level 6 draws its own newly
  authored 36-entry Enterprise Relationship Flagship Annual
  bank (ids 601-636). The legacy-bank fallback is removed:
  every campaign level draws its own bank, and the legacy 64
  entries remain the Quick Challenge union source (the drills
  deal by id and are byte-identical) and Level 1's curation
  origin. The BRD assembles from a per-level survey record
  (shared front section plus the level's own study); all six
  BRDs are written in full, the generic purpose sentence is
  retired. Level cards, the setup banner, the HUD, and the BRD
  title name the survey. Every level deals a curated fixed 12
  from its own bank on first play. Witnesses were regenerated
  per migrated level (Level 1: fixed line byte-identical at
  58 cr, seeded lines 53-71 cr against the old 58-93 range;
  Level 2: fixed line 66 cr against the 67 cr baseline after
  the phase-5b time calibration, seeded lines 60-86 cr against
  the old 64-93 range; Level 3: fixed
  line 69 cr, the same cost as its baseline but a
  goodwill-lean line ending at 58 goodwill, seeded lines 59-92
  cr against the old 60-89 range; Level 4: 39 setups, fixed
  line 63 cr against the 76 cr baseline ending at 47 goodwill,
  seeded lines 59-75 cr against the old 58-82 range, recorded
  lines ending at 41-47 goodwill; Level 5: fixed line 72 cr
  against the 70 cr baseline, seeded lines 66-85 cr, goodwill
  57-72; Level 6: fixed line 87 cr against the 98 cr baseline,
  seeded lines 83-122 cr, goodwill 26-53; no pool changed).
  One recorded design decision in phase 4, repeated in phase
  5a's flagship: the core set is answerable by every seat by
  design, because this level's goodwill economy cannot carry a
  restricted backbone; the scope doc's seat pattern is
  expressed through the topic-to-persona keys instead (see the
  phase-4 changelog entry). Full local gates pass (build, Node
  suite green with zero failures, browser harness 152/152 with
  the survey-identity scenario covering Levels 1 to 6).
  Phase 5b, the closing rebalance, is built and deployed: only
  Level 2 was tuned (realistic respondent times on its
  substantive clean items, witnesses regenerated); the other
  levels were re-verified against their baselines and left
  untuned with dispositions in the changelog. The per-level
  surveys project is complete.
- BRD visibility release (2026-11-12): the owner reported not
  seeing the per-level BRDs in some levels, so the BRD is now
  reachable from four labeled "? BRD" entry points (top bar on
  any screen, setup button, a banner notice naming the level's
  own BRD, and the agenda heading, now "BRD REQUIRED TOPICS").
  Visibility only; no BRD content changed. Gates: Node suite
  144/144, browser harness PASS 3/3 at 156/156 checks.
- Gap-review copy fixes (2026-11-12): from the Copilot survey
  lifecycle gap review, the owner approved the zero-cost items.
  G7: the Honest Ask sender and subject and the Fresh/Stale list
  name, timing, and blurb now come from the level's survey
  record (Quick Challenges keep the drill text). G24: a new
  attempt chain starts on the free Generic invite with no
  reminder preselected. G26: development notes aligned to the
  start model the code runs. G28: the report flags hard bounces
  at or above the team's 2% investigate line (advisory only).
  No scoring changed; no witnesses regenerated. Gates: Node
  suite 146/146, browser harness PASS 3/3 at 156/156 checks.
- Gap-fix wave (2026-11-13): the owner directed applying as
  many gap fixes as possible, and the scoring items shipped as
  one batch with a single witness regeneration, as planned.
  G9: operational trust requires every required topic ANSWERED
  CREDIBLY. G5: the fitness check enforces the BRD audience
  window where the BRD states a testable one (Level 1's 30
  days; other levels define audiences by role and offer). G6:
  skipping the suppression scrub fails trust when opted-out or
  recently surveyed people would be mailed, and the scrub now
  removes those records before the send (counted as suppressed
  in the frame, never in the sent base). G2: role rules read
  from the BRD (Level 3: workload runners at 30%; Level 4:
  decision makers at 15% combined; Level 5 adds a 5% floor per
  language group in the usable base). G18: guessed completions
  stay in the usable base and are priced in Quality and
  Insight; cleaning no longer removes them. G12: the Honest
  Ask promise is the player's choice (3/5/8/10 minutes) and
  the Known Name earn requires a prior pool contact. Display
  additions: BRD ACCEPTANCE and FINAL DISPOSITIONS (AAPOR)
  report cards (G15, G17), report-back on any contacted pool
  (G21), rotated-module base in the debrief (G22), the A/B
  planning estimate (G23 display half), and the Level 5 and 6
  purpose corrections (G19, G20). Witnesses regenerated in
  full: 390 setups, 65 per level, zero seeds lost; Level 4 now
  wins all 65 deals (was 39; its test minimum is 65). Fixed
  lines: 62, 66, 62, 63, 72, 87 cr against the 58, 66, 69, 63,
  72, 87 of the per-level corpus; no pool changed. Gates: Node
  suite 150/150, browser harness PASS 3/3 at 156/156 checks.
  The remaining gap items are the phase-sized builds in the
  approved process-consistency program
  (docs/process-consistency-scope.md, all six decisions approved
  2026-11-12): Phase A is the scorecard export (G16) and the
  declared-winner consequence (G23); then simulated findings
  (G8, G14), BRD intake (G1), sampling (G4), the mid-field
  checkpoint with the 72-hour clock (G13, G6 remainder), and
  reminder retargeting last (G27). Outside the program: G3,
  G10, G11 (needs the owner's design call), G25, and medallion
  phases 2-3.
- Process-consistency Phase E (2026-11-13): G13 mid-field
  checkpoint and the G6 72-hour clock are live. The run
  engine is split at the median recipient (buildRunStart /
  simulateRange / simulateFromOpen / finishRun; buildRun
  composes them one-shot for QC and the witness replay).
  Campaign launches pause on a checkpoint card: interim
  funnel, projection, one action (hold, or fire the next
  reminder wave early at the first half's non-openers,
  costing the second half a wave). Hold is bit-for-bit
  identical to the one-shot run (invariant test), so no
  witnesses regenerated. Fieldwork days = 2 + reminders;
  past day 3 the permission window binds: re-check for
  4 cr or lapse and mail the second half's fresh opt-outs
  (angry, trust fails). Gates: Node suite 162/162, browser
  harness PASS 3/3 at 156/156 checks. Remaining in the
  program: Phase D sampling (G4, rides on medallion
  phase 3 literal counts) and Phase F reminder
  retargeting (G27).
- Process-consistency Phase C (2026-11-13): G1 BRD intake
  is live. A Step 0 COMMISSION panel (state.commission,
  reset per chain) sets precision (standard, or extended at
  1.5 times the base minimum) and at most one topic demoted
  to should-answer, negotiated with the sponsor. The BRD
  prints an AS COMMISSIONED block; the acceptance card
  scores against the commissioned values; the demoted topic
  leaves the topics gate but its finding still reads CANNOT
  SAY when not credible. Default commission reproduces the
  shipped missions exactly (invariant test, all six levels);
  no witnesses regenerated. Gates: Node suite 158/158,
  browser harness PASS 3/3 at 156/156 checks. Remaining in
  the program: Phase D sampling (G4, rides on medallion
  phase 3 literal counts), Phase E checkpoint (G13) with
  the 72-hour clock, Phase F reminder retargeting (G27).
- Process-consistency Phase B (2026-11-13): G8 simulated
  findings are live. Every survey record carries decision
  questions (one per agenda topic, from its purpose text);
  `computeFindings` observes a per-topic, per-instrument
  latent value through the run's usable base with
  margin-calibrated noise. Topics that are not ANSWERED
  CREDIBLY read CANNOT SAY; unfixed defects on the
  representing question bias the read (leading up,
  double-barreled to the middle, broken options scattered)
  with a printed warning. G14 reads each finding within
  cells (key personas vs the rest; under 30 usable is too
  thin to read). Findings render after the dispositions,
  join the acceptance card and the scorecard export, and
  the ACT line quotes the headline finding. They gate
  nothing in v1. Gates: Node suite 155/155, browser harness
  PASS 3/3 at 156/156 checks; no witnesses regenerated.
  Next in the program: Phase C, BRD intake (G1).
- Process-consistency Phase A (2026-11-13): G16, the report's
  DOWNLOAD SCORECARD button saves a Markdown scorecard
  (mission, key numbers, five checks, BRD acceptance rows,
  AAPOR dispositions with RR3/RR4, context note) rendered from
  the same builders as the HTML cards. G23, declaring an A/B
  winner against a TOO CLOSE TO CALL verdict sets a campaign
  flag: the next stakeholder debrief names it once, that
  report's ACT step recommends re-running the split at
  adequate size, and the season grade names it for the rest of
  the campaign; no score change; flags clear only on a full
  campaign reset. No scoring changed and no witnesses were
  regenerated. Gates: Node suite 152/152, browser harness PASS
  3/3 at 156/156 checks. Next in the program: Phase B,
  simulated findings (G8) with within-cell reading (G14);
  findings also join the scorecard export there.

## Acceptance boundary

The full local harness, negative controls, and automated player journeys
now pass using existing approved Puppeteer/Edge tooling. No installation
or policy change was needed. Physical-device, screen-reader, human audio,
and owner acceptance remain open in [TODO.md](TODO.md).

## Next action

Run the remaining human checks in [TODO.md](TODO.md); that file also owns the
unimplemented roadmap and fixture-generator approval decision. Production
verification must be repeated after any future deployment.

## Verification - 2026-11-02

- `node scripts/harness/run-all.mjs` passed all three sections:
  packaging, 109 Node tests (including all 364 regenerated witnesses),
  and 119 real-browser checks. `node scripts/harness/self-test.mjs`
  caught both deliberate defects. Outputs are in ignored harness results.
- The initial browser failure was an obsolete below-threshold agitation
  expectation. It now tests an above-threshold Executive Blast; the live
  observer also has an explicit thousands-separator regression check.
  No game-source change was required.
- Separate session-only UAT passed 143 assertions: complete six-level
  campaigns at 390px/1280px, all three Quick Challenges, natural 20,000-person
  reduced-motion progress, exact individual/cohort accounting, and BRD cuts
  down to one disabled gray CUT. This did not install repository automation.
- Additional browser-tool checks covered modal/keyboard behavior, local fonts
  and sound controls, QR expansion, breaker accounting, owned prep, and retry
  recovery. Screenshots of the mobile run, disabled CUT, and desktop finale
  were visually reviewed. Human-only acceptance is not established by these.
- Full-harness and UAT game hashes matched:
  `a5cdb86909d5cd3cdad1760a3cc4621f8cef53994f7d987bb57a41240f19db38`.
- Changed-file editor diagnostics, harness syntax, and whitespace checks
  passed. All 75 local links and 3 anchors resolve across 20 tracked
  Markdown files. Generated results and private feedback remain ignored.
- [Production workflow 41490330923](https://github.com/fabioc-aloha/SurveyFunnel/actions/runs/41490330923)
  passed for `b45bb69`, including live-package verification. Independent
  `node scripts/verify-deployment.mjs` matched production HTML, font,
  license, QR, response headers, and unpublished-document checks.
- Production browser journeys at 390px and 1280px each verified 10,000
  recipients partitioned into 183 animation groups, nonzero intermediate
  counters matching individual events, and 1,154 completions with ROUND WON
  and all five evidence checks passing. No overflow or runtime errors
  occurred. A separate cut-to-one check confirmed native disabled CUT
  and `grayscale(1)` after the rendered card settled.
- Exact historical verification is in the [changelog](CHANGELOG.md);
  remaining human audio, physical-device, cross-browser, and screen-reader
  checks are in [TODO.md](TODO.md).

## References

- [Implemented release](docs/evidence-fitness.md)
- [Development and fixture balance](docs/development.md)
- [Browser harness and tooling](scripts/harness/README.md)
- [Deployment and hosting](docs/deployment.md)

## Do not redo

- Do not restore the deleted private Survey-Respons repository.
- Do not add a second HTML source of truth; `site/index.html` is the game.
- Do not commit `dist/`, generated screenshots, deployment secrets, or
  ignored local feedback.
