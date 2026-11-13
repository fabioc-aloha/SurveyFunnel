# Scope: process consistency — the priority improvements

Status: APPROVED by the owner 2026-11-12 — all six open
decisions as recommended (see the decisions section). Companion to the
Copilot survey lifecycle gap review of the same date. The gap-fix
wave (G7, G24, G26, G28, then G9, G5, G6, G2, G12, G15, G17, G18,
G19, G20, G21, G22, G23-display) is shipping first; this document
scopes what remains.

## The governing principle

The owner’s direction: the game must be internally consistent
with the process it teaches. One lifecycle, stated once, and
every stage agrees with every other stage and with the team’s
funnel documentation:

COMMISSION (the BRD) → SOURCES → BRONZE → SILVER → GOLD ·
CONTACT MASTER → SAMPLING → PERMISSION → THE SEND → FIELDWORK →
RESPONSES AND DISPOSITION → CLEAN → MATCH → INTERPRET → PUBLISH
→ ACT.

The middle stages are the Fishbowl document’s own outline; the
ends are the BRD and the report’s evidence-to-action chain. Most
of the 28 gaps in the Copilot review were, at root, one stage
contradicting another: defaults the funnel forbids, cleaning no
real cleaning can perform, a BRD whose questions the results
never answer.

## The consistency contract

No mechanic ships unless every surface that describes its stage
is updated in the same change:

1. The Fishbowl overlay (the process outline itself).
2. The MPOR overlay (the method rules).
3. The level BRD (the commission for that study).
4. The player guide (prices, rules, acceptance).
5. The development notes (the model as coded).

A stage is complete when a player can read all five surfaces
and find one story, and when the report can score the run
against the document that commissioned it (the BRD acceptance
card added in the gap-fix wave is the pattern to extend).

## Where each remaining item completes the lifecycle

### INTERPRET — G8: simulated findings (the centerpiece)

Today the chain stops at a score: Insight says how much of the
agenda came back credibly, but no finding ever answers the
BRD’s decision question. Findings close that hole.

Design:
- Each survey record gains 2–4 decision questions, decomposed
  from its existing purpose text (the L1 purpose already asks
  whether the case was resolved, explained, and worth
  recommending; L6 asks about trust, value, alignment, renewal).
- `computeFindings(evidence, run, c)` returns, per agenda
  topic: the question, an estimate on a stated scale (percent
  favorable or a 0–10 mean), the usable base for that topic,
  and the margin (the existing `moeText` machinery).
- Estimates are generated from a latent value per topic per
  instrument seed, observed through the run: noise scales with
  1/√base; contamination from unfixed defects biases the
  estimate the way the literature says it biases real data
  (leading pushes top-box, double-barreled mushes, broken
  options scatter). A topic that is not ANSWERED CREDIBLY
  returns “cannot say”, tied to the G9 gate.
- Findings render in the report after the dispositions; the
  ACT line quotes the headline finding. The BRD acceptance
  card gains one row per decision question: answered, or
  cannot say.
- v1 gates nothing on findings; they are consequences, read
  and quoted. (Decision 1.)

### INTERPRET — G14: reading within cells

A drill-down on each finding: the estimate for the topic’s key
role group against the rest, each cell with its base and
margin. A cell under about 30 usable responses reads “too thin
to read” instead of printing a number. Depends on G8; uses the
same per-persona usable counts the evidence checks already
compute.

### COMMISSION — G1: BRD intake

The BRD is currently read-only text. Intake makes the player
commission the study before building it, and every choice
binds to a gate that now exists:

- Precision: standard minimums, or extended (+50% usable
  base). Prints in the BRD as commissioned; the acceptance
  card scores against the commissioned value.
- Topic criticality: the player may demote one required topic
  to “should-answer” (its gate relaxes; the acceptance card
  records the negotiated exception and who asked for it).
- Nothing else in v1: sponsor, audience, and decision stay
  fixed per level, as the survey records state them.

Intake renders as a short Step 0 panel and an “AS
COMMISSIONED” block inside the BRD overlay, so the document
the player is scored against is the document they signed.

### SAMPLING — G4: draw the sample from Gold

Today the whole segment is mailed; the Fishbowl SAMPLING stage
exists only as text. Sampling needs literal promoted counts,
which is medallion phase 3, so this item rides on that work.

Design:
- After Gold, the player picks a precision target (±5, ±3,
  ±1 style, priced from the funnel document’s own sizing:
  about 384 / 1,067 / 9,604 completes at the study’s scale,
  converted through the segment’s expected rates) or “mail
  the promoted list” (today’s behavior, now the expensive
  default rather than the only one).
- The draw is deterministic from the run’s seed, stratified
  by the segment’s persona mix (and by language group on
  Level 5). Sent counts, rates, and dispositions all follow
  the drawn sample; the frame and the promoted count stay
  visible in the LIST PREPARATION ledger.
- Oversampling is priced in audience health, not credits:
  the portfolio records the share of the pool mailed, and
  fatigue on the pool’s next send scales with it. (Decision
  2.) Undersampling simply risks the mission minimum, which
  the existing gate already enforces.

### FIELDWORK — G13: the mid-field checkpoint, and the G6 clock

Runs are one-shot today. The honest implementation splits
`buildRun` at the median recipient: the first half simulates,
the run pauses on a checkpoint card (interim funnel, bounce
rate so far, projected completes), the player takes at most
one bounded action, and the second half simulates with that
action applied. Because the default action is “hold”, a
checkpoint that changes nothing must reproduce today’s runs
bit for bit; that invariant is a test, and it is what keeps
the witness corpus valid without regeneration.

- Checkpoint actions in v1: fire the next reminder wave now
  (if bought), or hold. (Decision 4.)
- The 72-hour permission window (the unbuilt remainder of
  G6) binds here: the checkpoint states the fieldwork day,
  and a permission check stamped at setup expires if
  fieldwork would run past day 3, charging a re-check. The
  game has no clock until this phase gives it one; that is
  why the clock waits for G13 rather than shipping as a
  label.

### RESPONSES — G27: reminders go to non-completers

The funnel document sends reminders to non-completers:
non-openers get another chance to open, and starters who
dropped get a resume path. The game currently reminds only
non-openers. Aligning it changes run mechanics (a dropped
starter can convert on a reminder wave) and the pile display
(the REMINDER SENT stamp leaves the UNOPENED pile and becomes
a reminded marker wherever the recipient sits), plus the
setup copy that today states the non-opener rule. This is
the one remaining place where the game’s stated process
contradicts the funnel outright, so it belongs in this
program; it is also the only item here that forces a full
witness regeneration, so it goes last. (Decision 6.)

### ACT — G16 remainder: the scorecard export

A “Download scorecard” button on the report saves a plain
text (Markdown) file: mission, five checks, BRD acceptance
rows, dispositions with RR3/RR4, findings, and the context
note. Small and self-contained; it also gives the owner a
stable artifact to review per level, which the UAT backlog
can use.

### ACT — G23 remainder: a declared winner has a consequence

Declaring an A/B winner against a TOO CLOSE TO CALL verdict
records a campaign flag. The next stakeholder debrief and
the season grade name it (“a winner was declared on a gap
inside the uncertainty range”), and the ACT step of that
report recommends re-running the split at adequate size.
No score change; the consequence is reputational, which is
the honest kind for this act.

## Out of this program

- G25 (taxonomy: common-method and mode items) is a bank
  content pass, not a process stage; it takes its own
  decision.
- Medallion phases 2–3 remain their own roadmap items in
  TODO.md; G4 above consumes phase 3 when it lands.
- G3 (diagnosis mode) rewrites the question-card interaction
  the novice UX and the browser harness are built on; it
  needs its own design pass, not a slot in this sequence.
- G10 (soft launch) overlaps the G13 checkpoint (both are
  “learn before committing the full send”); revisit after
  G13 lands, not before.
- G11 (routing a beyond-knowledge question instead of
  repairing it) changes a settled design rule of the defect
  taxonomy (no wording fix exists for that class); it takes
  the owner’s design call, separately.

## Phasing

- Phase A (small, first): G16 export + G23 consequence.
  No witness impact.
- Phase B: G8 findings, then G14 cells on top of them.
  Report-side only; witnesses record no findings in v1, so
  no regeneration.
- Phase C: G1 intake. Choices bind to existing gates; the
  default intake reproduces today’s missions exactly, so
  witnesses replay unchanged (an invariant test, like G13’s).
- Phase D: G4 sampling, on medallion phase 3 counts. The
  “mail the promoted list” default reproduces today’s sends;
  witnesses stand.
- Phase E: G13 checkpoint + the G6 clock. Default-hold
  invariant keeps witnesses valid.
- Phase F: G27 reminder retargeting + the one full witness
  regeneration this program needs.

Each phase closes with the five-surface consistency pass in
the contract above, the node and browser gates, and a
changelog entry that names the stage it completed.

## Decisions (owner, 2026-11-12: all as recommended)

1. Findings in v1: read-only consequences. APPROVED.
2. Sampling economics: oversampling priced in audience
   fatigue, not per-record credit pricing. APPROVED.
3. Intake scope: precision + one demotable topic. APPROVED.
4. Checkpoint actions: reminder timing only. APPROVED.
5. Order: findings (B) before intake (C), as phased.
   APPROVED.
6. G27 in this program as the final phase. APPROVED.
