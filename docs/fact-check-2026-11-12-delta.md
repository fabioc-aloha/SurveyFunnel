# Game fact-check audit, delta, 2026-11-12

Read-only audit of every checkable factual claim in the content added
after the 2026-11-11 audit (docs/fact-check-2026-11-11.md): the
per-level surveys phase 5a (Level 5 General Perceptions of Microsoft
bank and BRD, Level 6 Enterprise Relationship Flagship Annual bank
and BRD, the legacy-fallback removal) and phase 5b (the Level 2 time
calibration and its bank-header note). Audited at local HEAD 581dbdd,
the same content as production 77249409. No game code, tests, or copy
were changed by this audit.

Method follows the 2026-11-11 audit: each claim graded against its
proper source of truth, in the owner's order: primary source,
practitioner-measured, third-party study (named and dated),
competitor-published (bias noted), estimate, unverified. Bank
structure claims were verified against the game's own runtime data
(QUESTION_BANK loaded the way the test suite loads it), not against
the source text alone. Internal engineering claims from phase 5b are
graded against the session's recorded probe outputs.

## Headline answers

1. **Does any new copy state a brand or product claim as fact? No.**
   The Level 5 and Level 6 banks assert no Microsoft fact anywhere:
   flattery appears only inside items labeled LEADING, vanity, or
   stupid, and the two items that ask for real figures (Q517 market
   share, Q619 sector revenue share) ask without asserting, and are
   flagged BEYOND KNOWLEDGE with accurate explanations.
2. **Are the new banks' self-descriptions accurate? Yes.** Every
   structural claim in the two bank headers (defect coverage,
   doubled classes, recorded omissions and where the omitted class
   is covered instead) was recomputed from the runtime bank data
   and matches, including the Quick Challenge drill decks.
3. **Is anything wrong or misleading? No findings.** One wording pair
   was examined closely and is recorded under F1: the Level 5 BRD
   says the study fields in more than 45 languages and also that its
   audience spans five language groups. The first is the real
   tracker's scale (an owner-scale fact, graded SUPPORTED in the
   2026-11-11 audit); the second is the game's disclosed compression
   of that fielding, stated on the level's own setup screen. The two
   statements describe the study and the simulation respectively,
   and neither presents the compression as the reality.

## Totals

16 claims graded: 16 SUPPORTED, 0 WRONG, 0 MISLEADING,
0 UNVERIFIABLE.

| Class | Checked | Supported | Wrong | Misleading | Unverifiable |
| --- | --- | --- | --- | --- | --- |
| F. New study records (BRDs) | 6 | 6 | 0 | 0 | 0 |
| G. New bank items and flag texts | 8 | 8 | 0 | 0 | 0 |
| H. Phase 5b engineering claims | 2 | 2 | 0 | 0 | 0 |

The 2026-11-11 audit's two UNVERIFIABLE items (A8, the NORC / JMIR
reference, and A9, the AAPOR definitional line) are unchanged by the
new content and remain as recorded there.

## Findings by class

### F. New study records (SURVEYS[5], SURVEYS[6], bank headers)

- **F1. Level 5 purpose: the perception tracker "fields in more
  than 45 languages while the others field in one."** SUPPORTED.
  The 45+ figure is the owner's documented portfolio scale (the
  2026-11-11 audit's class C), applied to the one in-game study
  whose real counterpart is the global tracker. "The others field
  in one" is scoped to the game's six studies, of which only
  Level 5 carries localization mechanics; it is a design statement
  about the study set, not a claim about the real portfolio. The
  same record's audience section says the audience spans five
  language groups, which is the game's compression, disclosed as
  such on the setup screen ("Five language groups: English is
  only 40%").
- **F2. Level 5 audience: perception items are answerable by every
  seat; market figures and internal company facts sit with no
  seat.** SUPPORTED. Consistent with the answerability framework
  the 2026-11-11 audit verified, and with the bank as built
  (runtime check: the bank's single BEYOND KNOWLEDGE item is Q517).
- **F3. Level 5 constraints and header: the list is 40%
  English-speaking; localization review and the localized invite
  (4 cr) are the study's fielding design; response is read by
  language group.** SUPPORTED. The 40% figure is the Global
  segment's own parameter as displayed on the setup screen; the
  localized invite price was verified against the code in the
  2026-11-11 audit (finding D2) and is unchanged.
- **F4. Level 6 purpose: a flagship annual, one fielding a year,
  findings read alongside account records, never instead of
  them.** SUPPORTED. Study-design statements about the fictional
  flagship; no external fact asserted. The "never instead of
  them" formulation matches the Level 3 and Level 4 records'
  verified pattern.
- **F5. Level 6 audience and constraints: the Executive Blast
  list is mostly executives and IT decision makers; contract and
  commercial specifics sit with Partner Admin seats; the level
  carries a stakeholder demand for eight extra questions.**
  SUPPORTED. Each statement matches the shipped mechanics (Blast
  segment, Q610's seat restriction, the stakeholder encounter on
  Levels 3 and 6).
- **F6. Sponsor names ("the Brand and Perceptions research team",
  "the Enterprise Relationship team").** SUPPORTED as naming.
  Generic functional labels in the same pattern as the four
  earlier levels; neither names nor implies a specific real
  Microsoft organization.

### G. New bank items and flag texts

- **G1. Grid flag arithmetic: Q526 "Fifty ratings" (10 companies
  across 5 scales), Q613 "Sixty ratings" (12 areas across 5
  scales), Q614 "Thirty-two ratings" (8 areas across 4 scales).**
  SUPPORTED. Recomputed from the stems: 50, 60, 32.
- **G2. Broken-options flags: Q519 says 3 years sits in two ranges
  and "more than 3 years" overlaps 3-5; Q625 says 500 sits in two
  ranges.** SUPPORTED. Verified against the full option lists
  (Q519: under 1 / 1-3 / 3-5 / more than 3 / Other; Q625: under
  100 / 100-500 / 500-1,000 / more than 500 / Other).
- **G3. Q517 flag: a cloud market-share figure is "a research
  firm's estimate, held in reports this audience does not read."**
  SUPPORTED. Accurate characterization; the item asks for the
  figure without asserting one, and no specific share number
  appears anywhere in the new content.
- **G4. Q619 flag: Microsoft's sector revenue mix "sits in
  Microsoft's finance systems, which no seat at the customer can
  see."** SUPPORTED. Microsoft publishes segment revenue, not an
  industry-sector split of enterprise revenue; the figure the
  item demands is not public, which is the point the flag makes.
- **G5. Q613 and Q632 flags: "2-minute executive patience."**
  SUPPORTED. The Busy Executive persona's patience is 2 in the
  game's own persona definitions.
- **G6. Bank-header defect claims: Level 5 covers 10 of 11
  classes with LEADING, VAGUE TIMEFRAME, and DOUBLE-BARRELED
  doubled, omitting RECALL OVERLOAD, which "is covered on Levels
  1 to 4, on Level 6, and in the drills"; Level 6 covers 10 of 11
  with SENSITIVE NO ASSURANCE, GRID BURDEN, and RECALL OVERLOAD
  doubled, omitting VAGUE TIMEFRAME, which "is covered on Levels
  1, 2, and 4 and in the drills."** SUPPORTED. Recomputed from
  the runtime bank: Level 5 has exactly the stated 10 classes
  and doublings; Level 6 likewise. The omitted-class coverage
  also checks out per bank (RECALL OVERLOAD: L1 1, L2 1, L3 2,
  L4 1, L6 2, drill card Q56; VAGUE TIMEFRAME: L1 1, L2 1, L4 2,
  drill cards Q3 and Q48). The Level 5 header's gloss that the
  scope doc names RECALL OVERLOAD the genre-less class on a
  perception tracker matches the scope doc's rationale in
  substance (docs/level-surveys-scope.md: a perception has no
  events to recall).
- **G7. Remaining flag texts (leading, double-barreled, sensitive,
  wordy, jargon, double-negative, blame, vanity, trivia,
  irrelevant descriptions of their own items).** SUPPORTED. Each
  was read against its item's stem; every description matches the
  defect it labels, and none asserts an external fact.
- **G8. Trivia items Q527 (Microsoft's founding year) and Q627
  (the year of a first agreement).** SUPPORTED. Both ask without
  supplying an answer; no date is asserted anywhere in the new
  content.

### H. Phase 5b engineering claims

- **H1. The Level 2 bank-header note and the phase-5b changelog:
  two probe doses (item times 1.0/1.5 and a doubled 1.5/2.0) both
  left the cheapest winning line at 60 cr before the A/B setup is
  counted, and the doubled dose reduced the fixed instrument's
  winning lines from 219 to 122.** SUPPORTED. Both figures are
  the recorded outputs of the two probe regenerations run during
  phase 5b; the canonical replay cost with the A/B setup bought
  is 66 cr, as the regenerated corpus records.
- **H2. Witness figures quoted in the phase 5a/5b changelog and
  handoff (fixed and seeded cost ranges, goodwill ranges for
  Levels 2, 5, and 6).** SUPPORTED. Each matches the splice
  output of its regeneration and the shipped fixtures
  (Level 2: 66 fixed, 60-86 seeded; Level 5: 72, 66-85;
  Level 6: 87, 83-122).

## Fix dispositions (2026-11-12)

No fixes are required: the delta audit produced no WRONG,
MISLEADING, or UNVERIFIABLE findings. No game copy, price, or
fixture changed as a result of this audit.
