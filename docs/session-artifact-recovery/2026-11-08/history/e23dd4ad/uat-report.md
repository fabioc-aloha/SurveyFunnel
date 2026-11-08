> Historical recovery; not a current verdict or authorization to execute helpers.

# SurveyFunnel UAT - 2026-10-31

## Decision

**NOT ACCEPTED for full player sign-off.** Five confirmed defects:
three high-severity gameplay blockers and two medium-severity keyboard
accessibility defects. No fixes, commits, or deployments were performed
as part of this UAT.

This is browser-led acceptance testing, not a human stakeholder sign-off.
The existing 21 regression tests passed, but they did not catch the
campaign navigation and retry blockers found here.

## Scope and method

- Tested the current local game, including the unpublished QR-border change,
  and the public Azure production release.
- Used real rendered DOM, native browser clicks/keyboard actions, and DOM
  click handlers. Some long-page pointer actions could not finish their
  stability checks in the integrated browser; their handlers were tested
  programmatically instead.
- The Level 1 winning journey used normal controls. Later levels used
  explicit `selectLevel` fixtures to bypass missing report navigation.
  Their setup, launch, scoring, and reports were then exercised through
  actual UI handlers. These results do NOT establish that a player can
  naturally complete a six-level campaign.
- All three inline script SHA-256 hashes matched between local and production.
  The local QR-border CSS intentionally differs from production.
- Measured responsive layout at CSS widths 320, 390, 768, and 1440.
- Executed:
  `node --test scripts\build-site.test.mjs scripts\game-features.test.mjs`
  Result: 21 passed, 0 failed.

## Confirmed findings

| ID | Severity | Finding | Evidence / source |
| --- | --- | --- | --- |
| UAT-01 | HIGH | Winning report does not offer campaign or next-level navigation | Level 1 won with S, 27.5% response, and 72/120 credits spent. Level 2 unlocked internally, but the only visible buttons were MPOR, mute, Try Again, and New Game. Reproduced on production. [Report navigation](../../../../../site/index.html). |
| UAT-02 | HIGH | An affordable retry cannot be configured | Level 2 victory spent 85/120 credits, leaving 35. Retry inherits Known Name and one reminder: 48 credits. Generic alone costs 38 and zero reminders alone costs 40, so both cheaper controls are disabled. Their combination costs 30 and is affordable, but cannot be reached. [Invitation affordability](../../../../../site/index.html), [reminder affordability](../../../../../site/index.html). |
| UAT-03 | HIGH | Level 6 offers an impossible retry | A 115-credit finale launch leaves 35/150 credits. Report offers Try Again instead of recognizing that the only allowed audience costs 45 per send. Retry setup cannot launch, even with Generic and no reminders. [Hardcoded retry threshold](../../../../../site/index.html). |
| UAT-04 | MEDIUM | MPOR and BRD do not contain keyboard focus | After opening either dialog, Tab from its focused close button reaches the background MPOR button. Background controls remain keyboard-accessible while a modal is open. MPOR behavior also reproduced on production. [Dialog handlers](../../../../../site/index.html). |
| UAT-05 | MEDIUM | MPOR does not restore focus when closed | Open MPOR and press Escape: focus remains on hidden guideClose, which has no client rectangles. Clicking its close button leaves focus on the document body rather than the opener. BRD correctly restores brdBtn. [MPOR close](../../../../../site/index.html). |

### Reproduction setups

**UAT-01:** Fresh; Full validation, dedupe, suppression; Honest Ask;
one reminder; escapes on. Keep Q1/Q2/Q3/Q4/Q6/Q9, repair Q3, cut the others.
Launch and skip to report. Victory spends 72 credits and offers no
next-level/campaign action while 48 credits remain.

**UAT-02:** Level 2 fixture; Fresh; Full validation, dedupe, suppression;
Known Name; one reminder; A/B on with a distinct B; escapes off.
Keep Q1/Q2/Q3/Q4/Q6/Q8, repair Q3 and Q8, cut the others.
Victory spends 85 credits. Choose Try Again. Generic and zero reminders
are both disabled despite their combined 30-credit setup fitting the
35-credit remaining pool.

**UAT-03:** Level 6 fixture; Executive Blast; Full validation, dedupe,
suppression, localization review; Known Name; two reminders; escapes on;
Show the Evidence. Keep Q1/Q2/Q4/Q6/Q9/Q11, repair Q11, cut the others.
Launch spends 115 credits. Try Again enters a setup with 35 credits left,
but the minimum send is 45 credits.

## Coverage matrix

| Area | Result | Evidence |
| --- | --- | --- |
| Title, QR, responsive layout | PARTIAL | Local tiny QR border is 0; Enter/Space expansion/collapse work; font and QR load. Title, expanded QR, all six setups, MPOR, BRD, and A/B reports have no measured horizontal overflow or off-screen buttons at 320/390/768/1440 CSS widths. Desktop rendered QR independently decoded correctly. Fresh mobile screenshot decoding was inconclusive because the host capture and layout viewports disagreed. |
| MPOR/BRD | FAIL | All six study agendas, targets, budgets, Insight gates, and challenge repair requirements match the model. Opening/reopening resets scroll; BRD restores focus. UAT-04 and UAT-05 prevent keyboard acceptance. |
| Setup controls | PASS, with retry exceptions | Validation, dedupe, invitation changes, repair/keep, cut/restore, and bank ADD/remove charge/refund correctly before launch. Stakeholder accept/rotate/pushback forecasts match resulting costs. Retry exceptions are UAT-02/UAT-03. |
| Six-level campaign | FAIL | All six individual prepared levels won; season summary correctly displayed 6/6. Normal campaign progression blocked by UAT-01. Later-level entries and season-summary entry required fixtures. |
| Retry / reset | FAIL | Spending, history, goodwill and segment locks carry; a 112/120-credit chain correctly shows Level Failed. New Game resets a level's pool/history and changes its instrument; campaign New Game resets wins/unlocks/pool. UAT-02/UAT-03 block legitimate retry flows. |
| Quick Challenges | PASS | All three unrepaired scenarios fail; all three repaired scenarios win at exactly 40 credits. Retry resets repairs, Next selects successive scenarios, exit restores the saved campaign's level, seed, cards, spending and history exactly. Cut-only strategy fails. |
| Simulation / scoring | PASS for tested cases | Default 2/40 loses; prepared Level 1 wins within 120; validation alone still loses; gutted survey has high response but quality/Insight fail. Five repeated runs are identical. Stage counts are monotonic. Breaker tally matches independently counted pre-cutoff finish events. |
| Animation / reactions | PASS | Full 2x challenge animation matches skipped result at 7/40. Countdown clears, 40 sprites appear, live reactions occur. Skip during countdown then retry stays in setup after three seconds. Duplicate report generation does not change it. Reduced-motion case has no confetti. Reports contain at most four reactions. |
| Audio / preferences | PARTIAL | AudioContext runs; music gain/timer initialize; preview/fanfare handlers respond. Music/SFX/hints, 12%/34% volumes and mute persist across reload. M toggles mute but ignores range input. Original tested preferences restored. Sound quality needs a human ear. |
| Production | PASS for release checks | HTTPS 200; nosniff; frame DENY; SVG image/svg+xml; QR 200; internal development doc 404 as expected; pixel font loads; no observed pageerror in the monitored production checks. Live winning navigation and modal focus defects reproduced. Expected doc 404 emits a resource console message, not an application runtime failure. |

## Prepared level results

These are individual level tests, not a successful uninterrupted campaign.
Level 1 was also exercised on production. Levels 2-6 used explicit entry
fixtures because of UAT-01.

| Level | Credits | Response | Quality | Insight | Grade |
| --- | --- | --- | --- | --- | --- |
| 1 | 72 / 120 | 27.5% | 88 | 100 | S |
| 2 | 85 / 120 | 37.5% | 90 | 100 | S |
| 3 | 68 / 120 | 40% | 90 | 100 | S |
| 4 | 83 / 120 | 35% | 83 | 100 | S |
| 5 | 88 / 120 | 40% | 98 | 100 | S |
| 6 | 97 / 150 | 27.5% | 81 | 84 | S |

- Level 2: A/B report renders; selected A and B remain different.
  Generic versus Honest Ask on the default instrument produced
  Too Close to Call; both accept/reject feedback controls responded.
- Levels 3/6: all three stakeholder responses were exercised before launch.
- Level 4: report-back enabled; ending goodwill 41 passes the 35 gate.
- Level 5: localization review and localized invitation enabled.
- Level 6: Executive Blast, Show the Evidence; Insight 84 passes the 70 gate.

## Challenge results

| Scenario | Credits | Completed / sent | Quality | Insight | Result |
| --- | --- | --- | --- | --- | --- |
| Say What You Mean | 40 / 40 | 7 / 40 | 94 in animated report | 100 | Won |
| Less Work, Better Answers | 40 / 40 | 10 / 40 | Passed 60 gate | 100 | Won |
| Make It Safe to Answer | 40 / 40 | 8 / 40 | Passed 60 gate | 100 | Won |

All-cut challenge: 12/40 completions, Insight 0, no win.
All three unrepaired scenarios: no win.
Each repaired report sampled four reactions; no campaign history or
awards were introduced by challenges.

## Negative / balance checks

| Setup | Completed / sent | Quality | Insight | Outcome |
| --- | --- | --- | --- | --- |
| Lazy Level 1 default | 2 / 40 | 0 | 2 | Lost |
| Validation only, questionnaire kept | 7 / 40 | 3 | 100 | Lost despite response passing |
| Gutted questionnaire, Q9 only | 14 / 40 | 50 | 25 | Lost despite 35% response |
| Unprepared Level 6 Blast | 4 / 40 | 2 | 44 | Lost |
| Tired list, long instrument, two reminders | 0 / 31 | 100 | 6 | Breaker; 16 interrupted, 9 never sent |

Compared the same default Level 1 instrument across Fresh, Stale and Blast:
Fresh 5% response / quality 0 / 48 credits / ending goodwill 28;
Stale 2.5% / quality 50 / 48 credits / ending goodwill 14;
Blast 5% / quality 31 / 63 credits / ending goodwill 5.
Blast has the worst cost, goodwill and hard-bounce results, but is not
uniformly worst on response or quality. The development note's
"worst run on the board" invariant needs a defined ranking metric before
it can receive a single quantitative pass/fail.

Twenty-four generated-instrument samples (four seeds across six levels)
passed repeatability, 9-16 unique cards, and skeleton ordering.
This is not exhaustive proof of winnability for every random seed.

## Remaining human / platform acceptance

- Listen to unmuted background music, effects, win fanfare and breaker sound.
- Scan the expanded QR with a physical phone; desktop software decoding
  passed, but fresh mobile screenshot decoding was inconclusive.
- Repeat touch/keyboard journeys on actual iOS Safari and Android Chrome.
- Cross-browser and screen-reader checks were not performed.
- Retest the five findings after fixes, without level-entry fixtures.
- Publish the local QR-border change only through a separately authorized
  release; it is not yet on production.

## Recommendation

Fix UAT-01/UAT-02/UAT-03 before acceptance. Fix both dialog keyboard
defects in the same acceptance cycle. Add regression coverage for
visible post-win navigation, affordable multi-control retry recovery,
audience-specific minimum retry cost, modal focus containment, and
focus restoration. Then repeat the uninterrupted six-level journey
and the remaining human checks.

## Local remediation and balance retest - 2026-10-31

The original findings above remain the record of the pre-fix UAT.
The user subsequently authorized fixing discovered issues and approved
the difficulty and terminology corrections. Nothing in this remediation
has been committed, pushed, or deployed.

- UAT-01: fixed. Actual Level 1 play, followed by Next Level through all
  six studies, reached Season Results with 6/6 wins. No level-entry
  fixtures were used for this uninterrupted campaign.
- UAT-02: fixed. An actual Level 2 first launch cost 85 credits, leaving
  35. On retry, Generic reduced total pool spend from 133 to 123 while
  still over budget; zero reminders then reduced it to 115 and enabled
  launch. The affordable Honest Ask warning cleared. Owned dedupe and
  the audience lock remained enforced.
- UAT-03: fixed. A separate Level 6 boundary check used an explicit
  fixed-level entry, then actual setup controls and launch. It won at
  115/150 credits, left 35, offered no retry, and retained Level Select
  and Season Results. The minimum batch was 45; HUD Insight was 70+.
- UAT-04/UAT-05: fixed. Actual Tab/Shift-Tab remained inside MPOR and
  BRD; background controls were inert and could not take focus. Escape
  restored the respective guide/BRD opener. Both opened at scroll zero.
- Coupled fixes: consistent difficulty labels, refreshed affordability
  across preparation/audience/invitation/bank controls, the finale HUD
  gate, and correctly attributed goodwill ledger entries.
- Node suite: 38/38 passing, including 390 actual winning launches and
  reports (fixed plus 64 seeds per level). All fit initial budgets;
  Tired and Executive Blast remain the intended Level 4/6 audiences.
  This is not an exhaustive guarantee over all possible seeds.
- Approved copy corrections retain survey-methodology jargon and the
  arcade title, preserve intentional defective examples, and distinguish
  DK/NA item nonresponse, simplified response rate, and game indices.
- Browser layout checks measured actual CSS widths 390 and 1440 with
  no horizontal document overflow. Collapsed QR border was 0px; expanded
  border was 2.4px under the host's 125% zoom (source CSS 3px).
  A desktop title capture was inspected; full physical-device testing
  and fresh mobile QR decoding were not repeated.

Local acceptance of the enumerated fixes passed. Production still
requires an authorized release and post-deployment verification.
Human audio listening, physical QR scan, iOS/Android, cross-browser, and
screen-reader checks remain outstanding. One later dialog probe initially
found the host back on the title screen and timed out on setup-only BRD;
re-entering setup and repeating the complete probe passed.
