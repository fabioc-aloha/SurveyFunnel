# Changelog

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
