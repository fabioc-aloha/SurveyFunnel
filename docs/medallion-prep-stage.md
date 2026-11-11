# Medallion Prep Stage: Design Proposal

Design proposal: 2026-11-10. Status: phase 1 implemented 2026-11-10
(owner decisions recorded in section 8); phases 2 and 3 remain
proposals. This document proposed a playable list-preparation stage modeled on
the medallion pipeline (Bronze, Silver, Gold) behind the real survey
operation this game teaches. Phase 1 shipped as scoped below; anything
that contradicts a shipped rule is flagged as a rule change with its
balance consequence.

Grounding note: the stage mirrors, in generic terms, the production
list pipeline the game is based on: raw records arrive from several
source systems with no cleanup, one middle layer performs dedup,
consolidation, and syntax repair, and a daily-refreshed contact
master carries one record per person, enhanced with prior survey
history. Player-facing copy uses only the generic layer names
(Bronze, Silver, Gold) and "the contact master"; no internal system
names appear in the game or in this proposal's proposed copy.

## 1. Player experience

### Placement: Step 2 grows, no new step number

The natural first read is a Stage 0 before audience selection. This
proposal rejects that placement and instead rebuilds the existing
Step 2, for three reasons:

- The intake is a property of the chosen audience. Bronze records
  cannot be drawn before the player picks whose list it is, and the
  campaign lets the player switch segments freely at Step 1 (outside
  an attempt chain). A Stage 0 would either strand paid Silver work
  on every segment switch or force the audience choice earlier than
  the current flow does.
- The game already has a list-preparation home: Step 2, "Prepare the
  list", holds validation, the dedupe toggle, the suppression scrub,
  and localization review. A second prep home would split one job
  across two screens.
- Nothing else moves. Steps 1, 3, and 4 keep their numbers and
  content; the checklist, readout, and launch flow are unchanged in
  shape.

Step 2 becomes "Build the list", presented as three stacked layer
panels, Bronze, then Silver, then Gold, with the existing validation
row and suppression scrub retained as the last rows of the Gold
panel (verification and permission act on the promoted list, which
is the real order of operations; see section 2). Localization review
stays in Step 2 unchanged: it reviews language, not records.

### What the player sees

- **Bronze panel.** One line: records in, and the intake mix as a
  short row of labeled counts (duplicates, second addresses, broken
  addresses, stale records, clean records). No actions exist in
  Bronze. That absence is the first lesson (section 6).
- **Silver panel.** Three action buttons, each a toggle in the
  game's existing prep idiom: DEDUPE, CONSOLIDATE, REPAIR ADDRESSES,
  each with price and a one-line effect. As each is bought, the
  counts animate down and the Silver output count updates.
- **Gold panel.** The promoted count, the derived list health line
  (replacing the static "% invalid" the segment card shows today;
  see section 3), a PROMOTE state that is always on (promotion is a
  gate, not a purchase; see section 2), and the retained validation
  and suppression rows.

A single play of the stage is three button decisions and one read of
the derived health line: under a minute, most of it spent deciding
whether the prepared line is worth its credits against the pool.

### Copy discipline

The stage obeys the copy-diet rule (see
[the copy-diet record](copy-diet-2026-11-10.md)): gameplay text
stays lean, detail lives in the BRD, the report, and the field
guide.

- On the stage itself: counts, button labels, prices, one-line
  effects. Nothing else.
- In the BRD: the intake mix table per segment, what each Silver
  action buys, and the derived-health formula in words.
- In the field guide: the concept entries listed in section 5.
- In the report: the full list-preparation ledger (section 5).

## 2. Mechanics

### The intake draw

Each run deals an intake for the chosen segment: a set of shares
over the defect classes below, drawn with the game's existing
seeded machinery (`hashStr` + `mulberry`, keyed
`"intake|" + level + "|" + seed`, the same pattern as the
instrument draw `"inst|..."` and the Quick Challenge draws
`"qcvar|..."`, `"qccomp|..."`). The draw jitters each segment's base
mix (section 3) by a few points so repeat plays of a level differ;
the base mixes are fixed per segment so a segment keeps its
character.

The intake draw must not enter `choiceKey()`. The simulation seed
deliberately keys only the gameplay levers; adding intake state to
it would reseed every existing run and invalidate every recorded
expectation in the suites. Instead, the stage computes derived
rates from intake state and hands them to the simulation as
parameters, exactly as the Quick Challenge LIST REALITY complication
already overwrites the segment's `invalidPct` for wave 2. Replay
determinism (balance invariant 6: identical choices replay
identically) holds because intake state is part of the attempt state
and the prep baseline, like validation and dedupe today.

### Defect classes in Bronze

All shares below are proposals, expressed as shares of Bronze
records in. Classes 1 to 5 are wired in v1; class 6 arrives with
the Gold enhancement in phase 2 (section 7).

| # | Class | What it is | Silver / Gold handling |
| --- | --- | --- | --- |
| 1 | Cross-system duplicate | Same email address arriving from two or more source systems | DEDUPE merges to one record |
| 2 | Same person, second address | One person, two mailboxes (work and personal); exact dedupe cannot see it | CONSOLIDATE merges to one record for the person |
| 3 | Broken address, repairable | Typos of form: missing @, doubled dots, transposed domain letters, stray spaces | REPAIR ADDRESSES fixes the form |
| 4 | Broken address, unrepairable | No plausible correction exists | REPAIR ADDRESSES identifies it; it is quarantined in Silver and never promotes |
| 5 | Stale record | The address was real once; the person has moved on. Nothing about its form is wrong | No Silver fix exists. It promotes and can only be caught downstream by validation |
| 6 | Missing attributes | A mailable record with no role, account, or language attributes to match responses against | Gold enhancement (phase 2): attach prior-response history and attributes |

### The actions

| Action | Layer | Price (proposal) | Effect |
| --- | --- | --- | --- |
| DEDUPE | Silver | 4 cr | Removes class 1. This is the existing dedupe toggle, moved (section 3) |
| CONSOLIDATE | Silver | 4 cr | Removes class 2 |
| REPAIR ADDRESSES | Silver | 5 cr | Fixes class 3; quarantines class 4 out of the promoted list |
| PROMOTE | Gold | Free, always on | Settles the Gold count; quarantined records never pass it |
| ATTACH HISTORY (phase 2) | Gold | 6 cr | Cuts the class 6 unmatchable share (proposal: to one quarter) |

There is deliberately no action that fixes class 5 in Silver.
Staleness is a fact about the world, not about the record's form;
the tools for it live downstream (validation) and upstream (a
fresher source), and the stage teaches that boundary by omission.

### What skipping does downstream

Every class left in the promoted list feeds an existing downstream
system. No new failure modes are invented.

| Leftover | Downstream system it feeds |
| --- | --- |
| Class 1 or 2 (no DEDUPE / no CONSOLIDATE) | In-run duplicate responses: the existing duplicate mechanics (today gated on the dedupe toggle) scale with the remaining duplicate share (section 3). Duplicates are removed once each at CLEAN and cannot earn Insight |
| Class 3 or 4 (no REPAIR) | The raw invalid pool: they join class 5 in the rate that validation then multiplies (0.45 partial, 0.15 full). Survivors hard-bounce in the funnel and hit sender reputation exactly as today's invalids do |
| Class 5 (always, unless validation catches it) | The raw invalid pool, and the segment's low relevance: stale lists are also tired lists |
| Class 6 (phase 2, no ATTACH HISTORY) | Account matching at MATCH: a share of completions cannot be linked to the invited account and is excluded from the usable sample and Insight, the same exclusion forwarded responses already get |

## 3. Economy and balance

### Prices against the existing price list

The game's price grammar is: question fixes 1 to 3 cr, prep toggles
4 cr, partial validation 6 cr, full validation 12 cr (18 on
Executive Blast), invites 0/4/10 cr. The proposed Silver prices sit
inside that grammar: DEDUPE 4 (unchanged price, moved), CONSOLIDATE
4 (a toggle peer), REPAIR ADDRESSES 5 (it clears two classes; priced
one above a toggle, one below partial validation). ATTACH HISTORY at
6 cr matches partial validation, the other "improve what you already
have" purchase. A full Silver line costs 13 cr; a prepared line
today already spends 4 of that on the dedupe toggle, so the net new
spend on a fully prepared line is 9 cr (5 cr if ATTACH HISTORY stays
a phase-2 purchase).

### The existing dedupe and suppression toggles

**Recommendation: the stage absorbs dedupe; suppression stays.**

- Dedupe is absorbed. The Step 2 toggle and the Silver DEDUPE action
  are the same purchase at the same price; keeping both would charge
  twice for one concept and split its state. The operational-trust
  evidence check, which today reads "validation bought and dedupe
  on", reads the Silver DEDUPE state instead. **Flagged touchpoint,
  not a rule change:** the check's meaning is unchanged, only the
  control it reads moves.
- Suppression coexists, untouched, in the Gold panel. Suppression is
  not record structure; it models permission and prior-contact
  fatigue (opt-outs and recently surveyed recipients, tracked in the
  audience history), which the real pipeline also checks downstream
  of list construction. Moving it into Silver would teach the wrong
  order of operations.

### Derived list health replaces the static rates

This is the core design tension. Today each segment card declares a
finished invalid rate (Fresh 3%, Stale 9%, Executive Blast 16%,
Tired 5%, Global 6%) and `effInvalidRate()` multiplies it by the
validation tier. The stage replaces the declared rate with a
derived one:

- The segment card declares an **intake mix** instead of a finished
  rate: shares for classes 1 to 5 (class 6 joins in phase 2).
- The raw invalid pool, as a share of promoted records, is:

  `derivedInvalid = (stale + unrepaired broken) / promotedShare`

  where `promotedShare = 1 - merged duplicates - quarantined`, and
  "unrepaired broken" is classes 3 + 4 when REPAIR is unbought and
  zero when bought (class 3 fixed, class 4 quarantined).
- Validation then applies exactly as today: the derived rate is the
  base that partial (0.45) and full (0.15) multiply, and the
  catch-all floor logic is untouched.
- Duplicates scale the same way: the existing duplicate
  probabilities (today binary on the dedupe toggle) multiply by
  `remaining duplicate share / the segment's total duplicate share`,
  so cleaning one of the two duplicate classes halves them, and
  cleaning both reproduces today's dedupe-on behavior exactly.

Proposed base mixes, computed so the endpoints bracket today's
static rates (all values proposals):

| Segment | Dup (sys) | Dup (2nd addr) | Broken (fixable) | Broken (unfixable) | Stale | Derived, no Silver work | Derived, full Silver | Today's static |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fresh | 3% | 2% | 1.5% | 0.5% | 3% | 5.0% | 3.2% | 3% |
| Stale | 5% | 4% | 3% | 1% | 5.5% | 9.5% | 6.1% | 9% |
| Executive Blast | 7% | 6% | 5% | 2% | 9% | 16.0% | 10.6% | 16% |
| Tired | 4% | 3% | 1% | 0.5% | 3.5% | 5.0% | 3.8% | 5% |
| Global | 4.5% | 3.5% | 2% | 1% | 4% | 7.0% | 4.4% | 6% |

Reading: doing nothing leaves a list at or slightly above today's
declared health; full Silver work buys a list better than today's
label, before validation prices apply. Work is rewarded, neglect is
not punished beyond today's baseline, and the shipped downstream
balance (bounce volumes, reputation pressure, validation value)
stays in its tested ranges.

**Flagged rule change:** the segment card's "List health: X%
invalid" line becomes a derived readout ("List health after your
list work: X% invalid"), and the card's static claim is replaced by
the intake mix. This is the proposal's central rule change; blending
the static and derived rates (averaging them) is rejected, because
two sources of truth for one number cannot be taught or debugged.

**Known v1 limit, stated plainly:** in v1 the layer counts are
shares of the segment's record count, shown as counts, while the
send volume and every denominator stay on the segment's existing
`n` (the population contract in the development notes: one
synthetic record per invited recipient). Making promoted counts
literal, so the send base itself shrinks with Silver removals, is a
larger rule change and is deferred to phase 3 (section 7) as an
owner decision.

### Budget impact and winnability proof

Pools are unchanged (120 cr, 150 on Level 6). The witness table in
the development notes gives today's verified winning costs: fixed
lines 58 to 98 cr, highest winning cost in checked draws 106 cr
(Level 5) and 120 cr (Level 6). Adding the net new prepared-line
spend (+9 cr worst case) keeps every recorded line inside its pool,
with Level 5 tightest (about 5 cr of headroom on its most expensive
recorded draw). That is an argument, not a proof. Acceptance for the
build is the existing one, unchanged:

- Regenerate the full UI-legal witness corpus (364 setups at last
  regeneration) through the game's own handlers with the stage
  live: every setup must launch through the real Silver buttons,
  pass every gate, and fit its initial pool. No witness may be
  written by setting state directly.
- The six balance invariants in the development notes are replayed;
  invariant 3 (unprepared Executive Blast loses) and invariant 5
  (validation alone with a bad questionnaire still loses) must hold
  under derived rates.
- If a level fails regeneration, the first tuning levers are the
  new prices (REPAIR to 4, CONSOLIDATE to 3), never a pool increase;
  raising a pool is a separate rule change needing its own decision.

## 4. Levels and modes

### Across the campaign

The stage's difficulty is the intake mix, which the level's default
segment mostly decides; the player may still switch segments, and
the stage redraws for the new segment (charges follow the owned /
baseline pattern, section 4.3).

- **Level 1, First Send.** Default Fresh mix, the gentlest intake.
  The stage is introduced as three buttons and one readout; the
  checklist gains one line naming it. No Silver work is pre-owned:
  a no-work Fresh line derives 5.0% and stays winnable, so skipping
  the stage entirely is a legal, losing-nothing-catastrophic first
  play.
- **Level 2, The Split.** One Gold list feeds both A/B invites.
  The stage is unchanged; the teaching point is that list work is
  shared while the invitation varies, never the reverse.
- **Level 3, The Stakeholder.** The pressure stays on the
  instrument; the list stage is deliberately calm, so the player
  feels which lever the level is actually about.
- **Level 4, The Tired List. The showcase.** The Tired segment is
  the Support pool re-intaked after three prior waves: its mix is
  proposed with the season's exposure baked in (highest
  second-address and stale shares relative to its size), and its
  25 starting goodwill makes every duplicate that survives Silver a
  direct threat, since a person mailed twice spends goodwill the
  level cannot spare. The ending-goodwill gate (35+) turns list
  work from hygiene into the level's survival mechanic. (In phase 2,
  ATTACH HISTORY matters most here: history is how you know this
  pool has been surveyed three times.)
- **Level 5, Global Fieldwork.** Global's mix carries its dirt in
  broken addresses and (phase 2) missing language attributes rather
  than duplicates. Localization review stays a separate Step 2
  purchase: it reviews the instrument's language, not the records,
  and the stage keeps that boundary visible.
- **Level 6, The Big Quarter.** Executive Blast's intake is the
  dirtiest in the game, true to its card ("assembled from old
  exports" now literally means many source systems: the highest
  cross-system duplicate share). The intended prepared line is full
  Silver plus full validation; the 150 cr pool absorbs it (today's
  most expensive recorded winning draw is 120 cr).

### Quick Challenges

**Recommendation: no stage in Quick Challenges.** Three reasons,
all structural:

- The drill's documented contract already provides list
  preparation: the BRD states the Fresh audience, full validation,
  dedupe, and suppression are provided. The stage would contradict
  a shipped rule to no teaching purpose.
- The 48 cr budget is fully accounted (34 base + 6 signature
  repairs + 6 priciest extras + 2 headroom). There is no room for
  Silver prices without rebuilding the drill's arithmetic.
- The drill teaches questionnaire repair under scope creep. A list
  stage dilutes the one skill the mode isolates.

The one QC-shaped idea worth keeping for later is a complication
that deals a dirtier-than-stated Gold list (LIST REALITY already
proves the shape: a stated rate that turns out wrong). That is a
phase-3 candidate, not v1 scope.

### TRY AGAIN and the attempt chain

Prep persists across attempts today, charged as deltas against the
launched baseline (owned preparation is never charged twice). The
stage obeys the same contract:

- Silver actions bought in attempt 1 are OWNED in attempt 2; only
  newly bought actions charge.
- The segment is already locked mid-chain, so the intake cannot be
  redrawn or re-jittered mid-chain; the dealt intake is part of the
  chain's state.
- NEW GAME re-deals the intake from the new seed, like the
  instrument.

### Season scoring

**Proposal: no new score and no new gate.** The five evidence
checks stand; operational trust reads Silver DEDUPE as described in
section 3. The report gains the list-preparation ledger (section 5)
and the season summary may add one descriptive line (records
quarantined across the season) in phase 2. List quality already
expresses itself through bounces, duplicates, goodwill, and the
existing checks; a sixth score would double-count it.

## 5. Report and BRD

### Report: the list-preparation ledger

The report gains one card mirroring the goodwill ledger's table
pattern:

**LIST PREPARATION LEDGER · BRONZE TO GOLD**

| Row | Content |
| --- | --- |
| Records in (Bronze) | The dealt intake count |
| Merged as duplicates | Class 1 removed, or "not deduped" |
| Consolidated per person | Class 2 removed, or "not consolidated" |
| Addresses repaired | Class 3 fixed count |
| Quarantined, never promoted | Class 4 count (0 when REPAIR unbought: they promoted and joined the invalid pool; the row says so) |
| Stale records promoted | Class 5 count, with the line that no Silver fix exists |
| Promoted to the contact master | The Gold count |
| List health at launch | Derived invalid % before validation, beside the existing validation verdict, which already reports what validation saved |

Rows for unbought actions name the downstream cost the run actually
showed (duplicates removed at CLEAN, bounces attributed to
unrepaired addresses), keeping the report's honesty rule: observed
damage is shown with counts, latent risk is labeled latent.

### BRD

The BRD gains, per level: the default segment's intake mix table,
one line per Silver action stating what it buys and what skipping
it feeds, and the derived-health formula in words. The BRD is where
the detail lives; the stage panel stays lean (section 1).

### Field guide

New entries needed:

- **Bronze, Silver, Gold** — what each layer is for, in one short
  paragraph each.
- **Dedupe vs consolidation** — same address twice is a merge;
  same person twice is a judgment call.
- **Repair vs validation** — repair fixes an address's form before
  anyone tests it; validation tests whether an address can receive
  mail. Different jobs, different order.
- **Quarantine** — an unrepairable address is set aside, not fixed
  and not mailed; being quarantined is a good outcome.
- **Derived list health** — the invalid rate is computed from the
  list you built, not printed on the segment.
- **Unmatchable responses** (phase 2) — a completion that cannot be
  linked back to an invited account cannot support Insight.

## 6. Teaching goals

Each lesson is the real-system fact it encodes, stated as the
player learns it:

1. **Bronze does no cleanup.** Raw intake arrives exactly as the
   source systems held it. The Bronze panel has no buttons; there
   is nothing to fix yet because fixing is not Bronze's job.
2. **Repair lives in Silver.** Structure is fixed in the middle
   layer, before verification and before sampling. The order is the
   lesson: the stage sits before validation in the same step.
3. **Unrepairable never promotes.** Some records cannot be saved,
   and the correct outcome is quarantine, not effort. The player
   pays for REPAIR partly to learn which addresses cannot be
   repaired.
4. **Gold is one record per person, with a memory.** Consolidation
   makes the person, not the address, the unit; the contact master
   carries prior-response history forward (phase 2 makes the memory
   purchasable and visible).
5. **List quality is made upstream.** By launch, the send inherits
   the list the player built: the same validation purchase removes
   more bounces when Silver shrank the pool first. Downstream
   excellence cannot rescue upstream neglect at any price the game
   offers.

## 7. Build phasing

Each phase ships independently behind the existing gates (build
validation, the Node suite, the tracked browser harness), with the
witness corpus regenerated in phase 1 and replayed in later phases.

- **Phase 1 (v1 core).** Intake draw and per-segment mixes; Step 2
  rebuilt as Bronze / Silver / Gold panels; DEDUPE absorbed,
  CONSOLIDATE and REPAIR added; derived invalid rate and duplicate
  scaling wired into the simulation as parameters; segment card
  shows the intake mix and the derived health line; report ledger;
  BRD intake tables; field-guide entries for phase 1; witness
  corpus regenerated through the real handlers; balance invariants
  replayed.
- **Phase 2 (enhancement and memory).** Class 6 (missing
  attributes) joins the mixes; ATTACH HISTORY in Gold cuts the
  unmatchable share at MATCH; L4's intake reflects accumulated
  season exposure explicitly; season summary gains the descriptive
  quarantine line; per-level intake events (a late source-system
  dump arriving during setup on one level) if the owner wants
  events in the list stage at all.
- **Phase 3 (rule changes, separately decided).** Literal promoted
  counts as the send base (denominators move; full rebalance); a
  Quick Challenge dirty-Gold complication; any open-rate effect for
  ATTACH HISTORY.

## 8. Open decisions for the owner

**Decided 2026-11-10: the owner approved every recommendation below
as written.** Phase 1 was built the same day under those decisions;
its status follows the list.

1. **Stage placement.** This proposal rebuilds Step 2 rather than
   adding a literal Stage 0 before audience selection (section 1).
   Recommendation: accept the Step 2 placement.
2. **Level 1 onboarding.** Should Level 1 pre-own any Silver work,
   or deal the stage cold with the gentlest mix? Recommendation:
   cold; the no-work Fresh line derives 5.0% and remains winnable,
   and the stage teaches fastest when the first play shows the
   contrast.
3. **Static rates: replace or blend.** Recommendation: replace
   fully with derived rates (section 3). Blending two sources of
   truth for list health is rejected in this proposal; if the owner
   wants the static label kept as a "stated health" the player
   verifies, that is a different, larger design (LIST REALITY
   generalized) and should be decided as such.
4. **Dedupe toggle: absorbed or kept.** Recommendation: absorbed
   into Silver at the same 4 cr (section 3). Keeping both charges
   twice for one concept.
5. **Quick Challenges.** Recommendation: no stage in QC; list
   preparation stays provided, per the drill's documented contract
   (section 4). The dirty-Gold complication is a phase-3 decision.
6. **Gold enhancement payoff.** When ATTACH HISTORY ships (phase 2),
   should it buy only matching and Insight protection, or also an
   open-rate lift (returning responders recognize the sender)?
   Recommendation: matching and Insight only in its first release;
   a rate effect reopens response-rate balance across every level,
   while the matching effect lands inside the existing MATCH
   exclusion.
7. **Literal counts.** Should promoted counts eventually become the
   real send base (phase 3), accepting a full rebalance?
   Recommendation: defer until phases 1 and 2 prove the stage;
   v1's shares-and-rates model teaches the same lessons at a
   fraction of the balance risk.

**Phase 1 status (2026-11-10): shipped as scoped.** Step 2 rebuilt as
Bronze / Silver / Gold panels; DEDUPE absorbed into Silver at 4 cr,
CONSOLIDATE added at 4 cr, REPAIR ADDRESSES at 5 cr; the derived rate
replaced the static segment rates in the campaign (Quick Challenges
keep the provided-list model); segment cards show the intake mix and
the derived health line; the report carries the LIST PREPARATION
ledger; the BRD carries the intake table and Silver consequences; the
field guide carries the five phase-1 entries. Final derived-rate
table (base mixes, before validation): Fresh 5.0% no work / 3.2%
full Silver, Stale 9.5% / 6.1%, Executive Blast 16.0% / 10.6%, Tired
5.0% / 3.8%, Global 7.0% / 4.4%. The witness corpus regenerated
through the game's real handlers at the same size (364 setups; 65
per level, 39 on Level 4): minimum credits-to-win unchanged on every
level, 14 setups absorbed added Silver work (mostly CONSOLIDATE), no
price or pool changes were needed, and the sanctioned tuning levers
(REPAIR 4 / CONSOLIDATE 3) went unused. Phases 2 and 3 remain
unbuilt proposals.
