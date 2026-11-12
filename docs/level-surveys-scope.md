# Per-Level Surveys: Design Proposal

Design proposal: 2026-11-11. Status: approved and in build.
The owner approved the direction and the level-to-survey mapping in
section 1 on 2026-11-11, and approved all seven open decisions in
section 8 as recommended on 2026-11-11. Phase 1 (data model,
per-level BRD, Level 1 Support Experience bank), phase 2 (Level 2
Copilot Adoption bank, full Level 2 BRD, Level 2 witnesses),
phase 3 (Level 3 Azure Cloud Services bank, full Level 3 BRD with
the sponsor named as the study's stakeholder, Level 3 witnesses),
and phase 4 (Level 4 Account Team Relationship bank, full Level 4
BRD stating the goodwill gate and report back as the study's
feedback commitment, Level 4 witnesses; one recorded deviation:
the Relationship core is answerable by every seat by design,
because this level's goodwill economy cannot carry a restricted
backbone, and the section 3.3 seat pattern is expressed through
the topic-to-persona keys instead) are built to those decisions;
phase 5a (the Level 5 perceptions bank and BRD, the Level 6
flagship bank, and removal of the legacy-bank fallback) is built
2026-11-11 and pushed and deployed the same day; phase 5b, the
closing rebalance, is built and deployed 2026-11-11 (Level 2
time calibration and witness regeneration; the other levels
re-verified and left untuned with recorded dispositions). This
document proposes turning each
campaign level into a different survey, with its own questionnaire
bank and its own BRD, replacing today's single shared bank and
single shared BRD assembly.

Grounding note: everything in section 2 was read from the shipped
code in `site/index.html` and the development notes, not from design
memory. Line numbers refer to `site/index.html` at local HEAD
`2545e7b`. Where the code contradicts a natural assumption about how
the game works today, the contradiction is flagged in place
(section 2.3).

## 1. Purpose and approved mapping

Today the six levels are six rule variations on one survey. The
instrument always comes from the same support-flavored bank, the
agenda topics are always support topics, and the BRD always describes
the same generic study with different constraints pasted in. A player
who finishes the season has practiced one questionnaire six times.

The direction the owner approved: each level is a different survey
that GCX actually runs, with a questionnaire written for that survey
and a BRD written for that study. The level mechanics stay; the
survey changes. The player learns the transferable skill, which is
that the craft (audience fit, defect repair, burden control, list
work) re-applies to a new instrument whose traps are native to its
subject.

| Level | Mechanic (unchanged) | Survey (approved) |
| --- | --- | --- |
| 1 · First Send | Learn the three levers | Support experience |
| 2 · The Split | A/B invitation test | Copilot / AI adoption |
| 3 · The Stakeholder | Stakeholder demands 8 extra questions | Azure cloud services |
| 4 · The Tired List | Tired audience, goodwill gate | Account team relationship |
| 5 · Global Fieldwork | Five language groups, localization | General perceptions of Microsoft |
| 6 · The Big Quarter | Executive Blast, Insight 70+, 150 cr | Enterprise relationship flagship annual |

Why each theme fits the mechanic it lands on:

- **Level 1, Support experience.** The transactional post-case survey
  is the most common first assignment an Instrument Manager gets, and
  the current bank already is this survey (section 2.1). The template
  costs the least to build and teaches on the instrument every
  existing test knows.
- **Level 2, Copilot / AI adoption.** A new survey with no settled
  invitation is the honest reason to run an A/B test: nobody knows
  which ask works for a product respondents are still forming habits
  around. The level's teaching point (report uncertainty, do not
  declare a winner early) fits a subject where sponsors most want to
  declare winners early.
- **Level 3, Azure cloud services.** The stakeholder is the Azure
  product team asking for eight questions of their own. Platform
  surveys attract exactly this pressure, because every service team
  wants its feature rated. The demand is native, not staged.
- **Level 4, Account team relationship.** Relationship surveys go to
  the same named accounts on a cycle, which is why this list is
  tired: the audience has been surveyed three times this quarter
  because the relationship program surveys them three times a
  quarter. The goodwill gate (end at 35+) is relationship capital
  stated as a number, and the report-back line is what relationship
  programs owe their respondents.
- **Level 5, General perceptions of Microsoft.** A perception tracker
  is the survey that genuinely fields in many languages at once. The
  localization purchase and the by-language funnel stop being
  abstractions: perception items are also the items whose wording
  travels worst across languages, which is what the localization
  review is for.
- **Level 6, Enterprise relationship flagship.** The annual flagship
  is the big, executive, everything-in-one survey: relationship and
  perception topics in one instrument, sent to the Executive Blast
  list, with a stakeholder at the door and the highest Insight gate.
  It is the natural capstone because it combines the subjects of
  Levels 4 and 5 at the difficulty of neither being optional.

Quick Challenges stay generic drills. They isolate questionnaire
repair under scope creep; giving them themed banks is not proposed
(section 4).

## 2. Current state (verified from the shipped code)

### 2.1 One bank, support-flavored, 64 questions

`QUESTION_BANK` (`site/index.html` line 946) is `QUESTIONS` (ids
1-12, line 913) concatenated with 52 more entries (ids 21-26 and
27-72). A separate `OPTIONAL_QUESTIONS` (ids 13-15, line 935) exists
only as the add-bank fallback before a deal computes its own.
Counted from the data, the bank is:

| Tier | Count | Notes |
| --- | --- | --- |
| Clean | 26 | Includes clean controls across all six skeleton sections |
| Defective | 22 | Exactly 2 per defect class, all 11 classes |
| Stupid (low-value) | 10 | Vanity, blame, nosy, trivia, and duplicate subtypes, tagged by redundancy group `rg` |
| Filler | 6 | Harmless, low value, half Insight credit on agenda topics |
| **Total** | **64** | 13 entries carry `core: true` |

Every entry carries the same schema: `id`, `text`, `min` (respondent
minutes), `know` (who can answer, in words), `who` (legacy persona
tag), `cx` and `val` (complexity and value ratings), `core`,
`answerBy` (null for everyone, or an array of persona keys),
`defect`, `topic`, `tier`, and `sec` (skeleton section A to F, with
`SEC_MAP` at line 1054 covering the early ids). Defective and stupid
entries also carry `flagTxt`, the teaching note the Detective shows.
Repaired wording lives in a parallel table, `QUESTION_REPAIRS`
(line 876): a SPLIT produces two prompts, an ADD PRIVACY LINE repair
prepends an example privacy line. A question is therefore three
authored artifacts, not one: the stem as dealt, the flag note, and
the repaired form.

Every stem in the bank is a support question. The topics are support
topics: overall satisfaction, customer effort, support speed, product
reliability, billing clarity, renewal risk, agent knowledge,
self-service gap, resolution quality, onboarding (`TOPIC_KEYS`,
line 1036). The "one questionnaire" feel the owner is correcting is
not an accident of dealing; it is the bank's subject.

### 2.2 The deal: seeded, section-quota, agenda-checked

`generateInstrument(level, seedStr)` (line 1404) draws with the
game's seeded machinery, keyed `"inst|" + level + "|" + seed`:

- Target length is 9 to 16 questions (line 1410).
- The draw fills skeleton section quotas: A (outcome) 2-3, C
  (diagnostics) 1-3, D (sensitive) 0-1, E (open text) 0-1, F
  (demographics) 0-2, and B (drivers) takes the remainder, minimum 3
  (lines 1413-1417).
- A coverage swap then guarantees at least half of the level's
  agenda topics (rounded up, plus one) have a question of any tier
  in the deal, swapping B-section non-clean, non-agenda questions
  out to do it (lines 1423-1440).
- Dealt times are jittered plus or minus 20 percent. Defect, flag,
  `know`, and `answerBy` travel with the text: a class is never
  pasted onto wording that does not exhibit it (comment, line 1444).

First play of a level deals no draw at all: with no per-level seed
recorded, `applyInstrumentForLevel` (line 2131) installs
`QUESTIONS.slice()`, the fixed 12-question support instrument.
NEW GAME (`newGameSameLevel`, line 4406) records a fresh seed for
the level and re-deals. TRY AGAIN keeps the dealt instrument and the
whole attempt chain: preparation, edits, goodwill, and reputation
persist through the baseline and snapshot machinery (lines 1455 to
1472), and only new actions charge.

The add bank (`computeAddBankIds`, line 1065) picks 8 questions from
the bank that are not in the instrument, scored to favor agenda
topics the instrument does not cover, so a lost topic can usually be
repaired on a retry. It reads the same global bank.

### 2.3 Flagged discrepancy: "exactly 6 core" is not a deal rule

It is natural to describe the current game as "deals of 9 to 16 with
exactly 6 core questions," and an older comment in the code says
exactly that (lines 941-945, describing the v1.4 generator). The
shipped v1.5 generator does not do this. Nothing in
`generateInstrument` counts core questions; a seeded deal carries
however many of the bank's 13 core entries the section quotas happen
to draw. Exactly 6 core holds in precisely two places: the fixed
first-play instrument (`QUESTIONS` has 6 core of its 12;
`CORE_TOTAL`, line 934) and the Quick Challenge signature sets
(3 core cards by construction).

What `core` actually does today:

- It is a quality lever, not an Insight gate. `computeInsight`
  (line 3668) never reads the flag. Data Quality deducts 10 points
  per missing core item (`missingCore`, lines 3951-3955), where
  "available core" is the core count of the active instrument plus
  any core questions added from the bank (`coreTotalAvailable`,
  line 1057).
- The setup readout reports kept core against available core
  (line 2526), and cutting a core question is legal but priced in
  quality, per the shipped cut rules.

This proposal therefore does not promise to preserve an invariant
that does not exist. Section 3.1 states what core means per level
under the new design, as a bank property and a quality lever, with
no per-deal core quota added. Adding such a quota would be a deal
rule change with balance consequences, and it is not needed: the
agenda-coverage swap already guarantees the deal speaks to the
study, which is the guarantee that matters.

### 2.4 Agendas and Insight today

Agendas are already per level, but they are per-level selections
from one support topic set. `LEVEL_AGENDA` (line 1043) gives each
level 3 to 5 topics from the 10 support topics; `TOPIC_KEYS`
(line 1036) maps each topic to the personas the topic is about
(for example, billing clarity is about Partner Admins; renewal risk
is about IT decision makers and executives).

`computeInsight` (line 3668) splits 100 points across the agenda
topics and credits a topic only when a kept question on it is:

1. present in the final instrument (not cut, or restored via the
   add bank),
2. creditable (a stupid-tier question earns nothing for its topic),
3. answerable by at least one persona present in the sent segment's
   mix at 5 percent or more,
4. answered by at least one finisher from the topic's key personas.

Clean or correctly repaired questions earn the topic's full share;
filler earns half; an unfixed defective earns its share scaled down
by the contamination the run actually observed. A second question
on the topic adds 10 percent of the share. Each kept stupid question
subtracts 3. Sound questions on non-agenda topics add a small bonus,
capped at 6. The gate is Insight 60+, and 70+ on Level 6
(`insightGate`, line 1052).

Separately, `evidenceMission()` (line 1499) hardcodes each level's
mission: minimum usable sample (750, 1000, 1000, 675, 900, 1500),
audience pool (Support for Levels 1-4, Global for 5, Leadership
for 6), required role shares, and a purpose sentence. The purpose
sentences are support sentences for Levels 1-5 ("Improve the support
experience using technician and end-user evidence") and a renewal
sentence for Level 6. The five evidence checks, not the response
benchmark, gate the win.

### 2.5 The BRD today: one overlay, assembled per level

There is a single BRD overlay (`#studyBRD`, static shell at
line 680). Its content is built at click time by `openBRD()`
(line 2569) into `#brdContent`, from parts of very different ages:

- **Shared boilerplate.** The heading, a one-sentence STUDY PURPOSE
  ("Collect credible answers on the required business topics below.
  A high response rate alone does not establish useful evidence"),
  the five-checks acceptance language, and a closing disclaimer are
  identical for every level and every survey the game will ever run.
- **Per-level fragments.** Required topics and their key personas
  come from `agendaTopics()` and `TOPIC_KEYS`. Acceptance embeds
  `evidenceRequirementsHTML()` verbatim (mission sample, pool, role
  shares, the 80 percent match rule, the 60 percent retention rule).
  Constraint sentences are appended by level number: A/B language
  for Level 2, the stakeholder sentence for Levels 3 and 6, the
  goodwill sentence for Level 4, the language sentence for Level 5,
  the Executive Blast sentence for Level 6 (lines 2573-2577).
- **Segment-driven machinery.** The LIST PREPARATION section
  (Bronze, Silver, Gold) is generated from the selected segment's
  dealt intake mix and belongs to the medallion stage, not to the
  study (lines 2579-2598).
- **Quick Challenge mode.** The same overlay serves the drills, with
  its own constraints text, its twist section, and its own
  acceptance lines (response above target, drill quality and
  Insight gates).

So the BRD is already assembled per level; what it lacks is a study.
It has no survey name beyond the level name, no sponsor, no purpose
beyond the boilerplate sentence, and no audience description beyond
the mission's pool and role shares. The per-level BRD in section 3.2
is a content model change inside an assembly that already exists,
not a new overlay.

### 2.6 Levels, segments, and mechanics the themes must respect

`LEVELS` (line 1111) carries only `id`, `name`, `difficulty`,
`target`, `budget`, and `desc`. There is no survey identity field
anywhere: the level select cards (`renderLevelUI`, line 2074), the
HUD line, and the setup banner all render name, difficulty, and
description only.

The audiences are also support audiences. All five segments in
`SEGMENTS` (line 809) are support lists (Support Fresh, Support
Stale, Executive Blast, Tired List, Global five language groups),
with support timing lines ("3 days after a closed support case").
`selectLevel` (line 2149) defaults Level 4 to Tired, Level 5 to
Global, Level 6 to Executive Blast, and the rest to Fresh. The
audience pools behind the evidence checks (Support, Global,
Leadership) and the audience portfolio that carries history across
instruments are segment properties, and the medallion intake mixes
hang off the segments too. The survey identity the owner wants
attaches to the level, not to the segment; section 4 keeps the
segment machinery untouched, and section 6 flags the one copy
consequence (segment names and timing lines speak support language
on every level today).

Mechanics each theme must be written against, verified in code:

- **Level 2 A/B.** `renderABPanel` (line 2104): 6 cr, the segment
  splits into randomized halves, variant B is another invite. List
  work is shared; only the invitation varies.
- **Levels 3 and 6 stakeholder.** `renderStakeholder` (line 2082):
  eight extra questions arrive as modeled burden, not as cards.
  Accept is +4 minutes, -10 goodwill, 10 cr; rotate is +1 minute,
  -3 goodwill, 4 cr; push back is free. The BRD states it plainly
  (line 2574): extra-topic answers are not simulated or scored.
  The themed bank must not try to make the eight extras real cards;
  the sponsor's pressure is the mechanic.
- **Level 4 goodwill.** The Tired segment starts at goodwill 25
  (`SEGMENTS`, line 822), the win needs ending goodwill 35+, and
  the level's report-back line (3 cr, `renderLevelExtras`,
  line 2112) restores goodwill (+18 on a short instrument, +8
  otherwise). The themed instrument's length and defect load are
  read against that goodwill budget.
- **Level 5 language.** The list is EN 40%, ES 20%, PT 15%, DE 13%,
  JA 12% (line 2115). Localization review (8 cr) and the localized
  invite (4 cr) are separate purchases, and the evidence rules
  require both for a Global audience. The report's funnel is read
  by language group.
- **Level 6 finale.** Budget 150, Insight gate 70, mission minimum
  1500 usable responses, decision makers (executives and IT
  decision makers together) at 50%+ of usable responses, Executive
  Blast as the study's audience, stakeholder encounter included.

The five personas (`PERSONAS`, line 800) and their patience values
(Busy Executive 2 minutes, Frontline Technician 4, Partner Admin 6,
IT Decision Maker 5, End User 5) are global. Per-theme work changes
who can answer what (section 3.4), never the personas themselves.

### 2.7 The Quick Challenge dependency on the shared bank

The drills deal by question id from the shared bank:
`QUICK_CHALLENGES` (line 1122) names signature cards (ids 3, 10, 24;
48, 55, 11; 54, 56, 52), curated extras (26, 57, 22; 7, 51, 68;
12, 23, 60), twist-mandated cards (26, 7, 12), and a late-question
pool. The test suite asserts the signature cards are the core cards
of the drill instrument and that every extra is non-core in the
bank's own data. Any per-level bank restructure that renumbers,
removes, or re-flags those ids breaks the drills. Section 3.1 makes
id preservation a hard constraint of the data model.

## 3. Design

### 3.1 Per-level banks: same schema, a survey identity

The schema does not change. Each question gains one field,
`survey`, naming the level whose bank it belongs to (1 to 6), and
question ids are allocated in per-level ranges so an id names
exactly one question in exactly one survey for the life of the
game. The existing support bank keeps its ids (1-72 as dealt today,
including the Quick-Challenge-load-bearing ids listed in
section 2.7); new banks take fresh ranges (proposal: hundreds per
level, so id 2xx is always the Copilot survey). Id stability is
what lets `state.qstate` (keyed by question id across the whole
bank, lines 1345 and 1456), the baseline and snapshot machinery,
the add bank, and the drills all keep working without a keying
change.

Under the new model:

- `generateInstrument(level, seed)` draws from the level's bank
  only. Section quotas, time jitter, and the agenda-coverage swap
  are unchanged; the swap reads the level's own agenda and the
  level's own bank.
- The fixed first-play instrument becomes per level: each level's
  bank designates its own fixed deal (its curated 12, in the
  template's case the existing `QUESTIONS`), so first play is a
  designed instrument for that survey, not a draw.
- NEW GAME re-deals within the same level's bank from the new seed,
  exactly as today. A new game on Level 3 is a new Azure instrument,
  never a support instrument with Azure labels.
- TRY AGAIN is untouched: the dealt instrument, edits, preparation,
  goodwill, and reputation persist across the attempt chain; the
  add bank draws from the same level's bank, still favoring agenda
  topics the instrument does not cover.
- Core stays a bank property with its shipped meaning (section 2.3):
  each level's bank designates its core set (section 3.6 derives
  the count), cutting core stays legal and priced in Data Quality
  at 10 points per missing item, and no per-deal core quota is
  added.

One honest consequence: changing the banks changes every seeded
deal in the game. Every recorded expectation that depends on dealt
content (the witness corpus, section 5) is void until regenerated.
That is priced into the phasing, not discovered by it.

### 3.2 Per-level BRDs: the content model

Each level gains a survey record (working name `SURVEYS[level]`)
that the BRD assembly, the level cards, and the HUD read. The BRD
content model per survey:

| Field | Content | Source today |
| --- | --- | --- |
| Survey name | "Support Experience Survey", "Copilot Adoption Survey", and so on | New (decision 6 covers where it displays) |
| Purpose | One short paragraph: the decision this study informs and what the answers will change | Replaces the shared boilerplate sentence; the mission purpose in `evidenceMission()` is the seed of it |
| Sponsor | The team that commissioned the study, named generically ("the Support Experience team"; on Level 3, the Azure product team, which is also the stakeholder) | New |
| Audience | The study's intended respondents and the default segment, with who can answer what stated as the topic-to-persona map | `TOPIC_KEYS` becomes per-survey (section 3.3) |
| Required topics | The level's agenda: the topics the study exists to answer, each with its key personas | `LEVEL_AGENDA` becomes per-survey data on the same record |
| Constraints | The level's mechanic stated as a study constraint (the stakeholder's eight questions, the goodwill floor, the language mix, the Executive Blast audience) | The conditional sentences in `openBRD()` move into the record |
| Success measures | The five evidence checks with this study's mission numbers: minimum usable sample, pool, role shares, match and retention rules, Insight gate | `evidenceMission()` and `evidenceRequirementsHTML()`, unchanged in substance |

Overlay behavior: Consult BRD shows the current level's BRD,
assembled from that level's record the way `openBRD()` assembles
today. What stays shared, deliberately:

- The acceptance boilerplate: the five-checks language and the
  "these are the active study requirements, not a forecast" closing
  are game rules, true of every study, and stay shared text.
- The LIST PREPARATION section: it is generated from the selected
  segment's intake, belongs to the medallion stage, and stays
  segment-driven shared machinery inside the same overlay.
- The Quick Challenge BRD variant: the drills keep their own
  constraints text, twists, and acceptance lines in the same
  overlay, untouched.

What happens to the current generic STUDY PURPOSE sentence: it is
retired. It is the one piece of today's BRD that is false under the
new design, because it claims the topics below it are the study's
purpose without naming any study. Its second sentence ("A high
response rate alone does not establish useful evidence") survives
as shared acceptance language, where it belongs.

### 3.3 Insight re-pointing

`computeInsight` needs no structural change; its inputs move.
`LEVEL_AGENDA` and `TOPIC_KEYS` stop being global tables and become
fields of the level's survey record: the level's required topics,
and for each topic the personas the topic is about. The credit rule
is identical (present, creditable, answerable by the sent mix,
answered by key personas; contamination scaling; filler half
credit; stupid penalty; non-agenda bonus). A topic earns credit
against the level's own study, which is the whole point: an Azure
instrument can no longer earn Insight with support answers, because
support topics are not in its agenda and its bank holds no support
questions to answer them with.

Proposed topic sets (names only; the build phase writes the
questions). Each set is sized like today's agendas (3 to 5 topics)
so the share arithmetic and the gates stay in their tested ranges:

- **L1 Support:** unchanged (overall satisfaction, customer effort,
  self-service gap, renewal risk, drawn from the existing topic
  set). The template keeps today's agenda so its balance evidence
  carries over.
- **L2 Copilot / AI adoption:** adoption breadth, workflow impact,
  trust in output, output quality, enablement gap.
- **L3 Azure cloud services:** service reliability, cost visibility,
  migration effort, capability gaps.
- **L4 Account team relationship:** account team responsiveness,
  trust and candor, business value delivered, escalation handling,
  renewal intent.
- **L5 General perceptions:** overall favorability, trust,
  innovation perception, value perception, AI leadership perception.
- **L6 Enterprise relationship flagship:** overall relationship,
  trust, business value, renewal intent, strategic alignment.
  Five topics, matching today's Level 6 agenda size, mixing the
  relationship subjects of Level 4 and the perception subjects of
  Level 5 without drawing from their banks (decision 3).

`evidenceMission()` purpose sentences are rewritten per survey on
the same pass; the mission numbers (samples, pools, role shares)
do not change, because they are balance facts about the level's
mechanic, not about its subject.

### 3.4 Persona answerability per theme

`answerBy` is where a survey's subject becomes a rule: it declares
which seats can actually answer the question, and Insight's
answerability step and the funnel's knowledge clock both read it.
The per-theme design work is a mapping exercise with one reasoning
pattern, applied six times:

**Answerability follows the respondent's seat relative to the
survey's object.** Ask what the respondent personally lived, and
they can answer. Ask for a fact held in a system, a budget, or
another team's records, and the answer belongs to the seat that
holds it, whoever the survey is sent to.

How the pattern lands per theme:

- **Support (L1).** The object is a case the respondent lived.
  Experience items (effort, speed, resolution) are answerable by
  whoever lived the case, which in this audience is nearly
  everyone; the beyond-knowledge traps are org facts attached to
  the case (contract value, org-wide outage cost) that sit with
  admin and finance seats. This is today's map, kept.
- **Copilot / AI adoption (L2).** The object is the respondent's own
  work with the tool. End users and frontline staff answer usage,
  output quality, and workflow items from their own desks;
  executives cannot answer prompt-level or daily-use detail they
  never touch, and asking them manufactures guesses. IT decision
  makers answer rollout, governance, and enablement items. The
  inversion to design for: on this survey the executive is the
  weak respondent, not the strong one.
- **Azure cloud services (L3).** The object is a platform other
  people run. IT decision makers and the technical seats answer
  architecture, reliability, and migration items; cost visibility
  splits (an ITDM can answer whether costs are visible, the figures
  themselves sit with admin seats); end users of the finished
  applications cannot answer tenancy, region, or SKU questions at
  all. Expect the densest `answerBy` restrictions of any bank.
- **Account team relationship (L4).** The object is a relationship
  between organizations. Executives and IT decision makers answer
  trust, value, and renewal intent; frontline technicians answer
  escalation handling from the tickets they lived; a Partner Admin
  answers commercial process items. Perception of the account team
  is answerable by anyone who deals with them, which makes the
  sensitive items (candor about the account team) the design risk,
  not knowledge.
- **General perceptions (L5).** The object is the respondent's own
  perception, so the pattern inverts: perception items are
  answerable by every seat, because a perception needs no system
  access. Beyond-knowledge nearly vanishes as a trap class here
  (section 3.5); the traps that remain are factual claims smuggled
  into a perception survey (market figures, competitor facts),
  which are beyond knowledge for every seat equally.
- **Enterprise relationship flagship (L6).** The object is the whole
  relationship, surveyed at the top. Executives answer strategy,
  value, and renewal intent; contract and commercial specifics sit
  with admin seats and are beyond knowledge for everyone else on
  the Blast list; the survey's risk is length and sensitivity at
  2-minute executive patience, not coverage.

Each bank's build must produce its answerability map as a reviewed
table (question, seats that can answer, why), in the bank's design
notes, before stems are finalized. The map is the survey's
sampling logic; writing stems first and tagging later is how
beyond-knowledge traps end up answerable by everyone.

### 3.5 Defect coverage per level

Not every level needs all 11 classes. A perception survey with a
recall-overload item is a survey that does not know its own genre,
and forcing class completeness per level would flatten the themes
back into one bank with six skins. Proposed minimum coverage rule:

- **Floor: 8 of the 11 classes per level bank**, at least one
  question each.
- **Theme-natural classes carry 2 questions each**, mirroring
  today's global pattern of exactly 2 per class, applied where the
  class is native to the genre.
- **Level 1 carries all 11.** The template level is where a new
  player learns the taxonomy; its bank is today's bank, which
  already does.
- **Campaign union:** across the six banks every class appears at
  least 8 times, so a season teaches every class repeatedly in
  different subjects. The floor plus the doublings satisfies this
  by construction (6 levels x 8 classes minimum, before doubles).

Theme-natural classes, with the genre reason:

| Level | Doubled (theme-natural) classes | Rationale |
| --- | --- | --- |
| L1 Support | All 11 present (template) | The taxonomy's home genre |
| L2 Copilot / AI | JARGON, BEYOND KNOWLEDGE, LEADING | AI vocabulary is undefined in most workplaces (tokens, grounding, hallucination); model internals are unknowable to respondents; sponsor hype wording is the genre's leading risk |
| L3 Azure | BEYOND KNOWLEDGE, JARGON, RECALL OVERLOAD, GRID BURDEN | Org-wide spend and other teams' architectures are unknowable; platform terms are dense; migration and incident recall runs to 12 months; service-by-service matrices are the genre's grid |
| L4 Relationship | SENSITIVE NO ASSURANCE, LEADING, VAGUE TIMEFRAME | Candor about the account team needs assurance; relationship flattery loads answers; "recently" is how relationship questions dodge naming the quarter |
| L5 Perceptions | LEADING, VAGUE TIMEFRAME, DOUBLE-BARRELED | Perception items push toward the brand; "these days" is the genre's timeframe; brand attributes arrive in pairs ("innovative and trustworthy") |
| L6 Flagship | SENSITIVE NO ASSURANCE, GRID BURDEN, RECALL OVERLOAD | Renewal intent is commercially sensitive; the flagship tries to rate everything; the annual window is the recall trap |

Classes a level may omit under the floor are the ones with no genre
home there: for example, RECALL OVERLOAD on Level 5 (perceptions
have no events to recall) and BEYOND KNOWLEDGE beyond its one
smuggled-fact representative. Omissions are recorded in the bank's
design notes with the reason, so a missing class is a decision,
not an oversight.

### 3.6 Content volume: deriving the per-level bank size

The bank size is derived from four consumers, not picked:

1. **The deal.** Section quotas cap at A3, C3, D1, E1, F2, and B
   takes the rest of a 9-to-16 target, so B must be able to supply
   up to 12 (a 16-question deal with minimal fixed sections:
   2+1+0+0+1 fixed, B = 12). A bank that cannot fill a section
   under-deals. Hard section minima: A 3, B 12, C 3, D 1, E 1, F 2,
   which sum to 22.
2. **The add bank.** It needs 8 questions outside the dealt
   instrument, scored toward uncovered agenda topics. Worst case
   the instrument holds 16, so the bank needs 24 entries before
   variety is considered at all, and the 8 must include creditable
   questions on agenda topics the deal missed.
3. **Agenda depth.** The coverage swap guarantees topics in the
   deal only if the bank holds questions on them outside the deal's
   first draw, and Insight's second-question depth bonus and the
   add-bank repair path both want at least 2 creditable questions
   per agenda topic, with at least one more defective or filler
   carrier so a topic can be present-but-flawed. At 4 topics
   typical, that is roughly 3 questions per agenda topic, 12 of
   the bank, before off-agenda variety.
4. **Seed variety.** The witness corpus deals 64 seeds per level
   (section 5). A bank at the 24-entry floor would deal near-
   identical instruments across those seeds, and a player replaying
   a level for a better grade would meet the same traps in the
   same order of frequency. Today's bank gives a 16-question deal
   64 entries to vary across; per-level banks cannot match that
   ratio, but they must stay well clear of the floor.

Recommended size: **36 entries per level bank**, sectioned
A 4, B 18, C 6, D 2, E 2, F 4 (each section at least a third above
its quota maximum except D and E, whose quotas are 1 and which
carry 2 for variety), and tiered at the game's established mix:

| Tier | Per bank | Notes |
| --- | --- | --- |
| Clean | 14-15 | Includes at least 2 creditable per agenda topic |
| Defective | 12-13 | Section 3.5 coverage: 8+ classes, theme-naturals doubled |
| Stupid | 5 | Themed vanity, blame, nosy, trivia, duplicate subtypes |
| Filler | 4 | Form-only filler may come from a shared pool (decision 1) |
| **Total** | **36** | Core set: 6-8 designated per bank, at least one creditable core per agenda topic |

**Total authoring load, stated honestly.** Six banks at 36 is 216
entries. Level 1's bank is curated from the existing 64 support
entries (the best 36 carry over with their flag notes and repairs),
so new authoring is approximately **180 questions across five
surveys**. Each question is three artifacts (stem, flag note where
defective or stupid, repaired form where repairable) plus six
metadata fields and an answerability decision (section 3.4). For
scale: the v1.5 expansion that built today's bank added 46 entries
and was a full build phase on its own. This is the largest single
authoring task in the project's history, roughly four times that
expansion, and it is the schedule risk of the whole proposal
(section 6). The leaner alternative, 28 entries per bank (A 3,
B 14, C 5, D 2, E 1, F 3; 140 new questions), still fills every
quota and the add bank, but agenda depth drops toward 2 per topic
and seed variety thins visibly; it is decision 2.

## 4. What does not change

- **The engine.** The population simulation (one synthetic record
  per recipient), the funnel, cleaning and matching order, the five
  evidence checks, grades, and replay determinism are untouched.
  Balance invariants 1-6 in the development notes still govern.
- **Pricing.** The full price book (sends, validation tiers, Silver
  actions, invites, reminders, fixes, escapes, stakeholder
  responses, report-back, localization) is untouched. No survey
  costs more because its subject is Azure.
- **The medallion prep stage.** Segments, intake mixes, derived
  list health, and the Silver actions are untouched. The BRD's
  LIST PREPARATION section stays as generated today.
- **Scoring and win rules.** Response stays a benchmark, not a win
  gate. Insight's credit rule, quality's deductions (including the
  10-point missing-core deduction), the gates (60+, Level 6 70+,
  Level 4 goodwill 35+), and mission samples and role shares are
  unchanged.
- **Quick Challenges.** The drills keep their cards, twists,
  complications, and 48-credit arithmetic, dealt from the preserved
  support bank ids (section 2.7).
- **Level mechanics.** A/B on Level 2, the stakeholder encounter on
  Levels 3 and 6, the goodwill economy on Level 4, language groups
  on Level 5, the Executive Blast finale: all unchanged.
- **Persistence.** Campaign state stays in page memory; local
  storage continues to hold sound and hint preferences only. No
  instrument state is stored.
- **The other overlays.** MPOR and the Fishbowl document are
  untouched; the BRD overlay keeps its shell, focus behavior, and
  shared sections per section 3.2.

## 5. Phasing proposal

Each phase ends at the existing gates (build validation, the Node
suite, the tracked browser harness) and is independently
reviewable. What ships to production at each phase remains the
owner's call, as with the medallion stage.

- **Phase 1: data model, BRD, and the template bank (Level 1).**
  The `survey` field and per-level id ranges; `SURVEYS` records
  with the section 3.2 content model; `openBRD()` reading the
  record; `LEVEL_AGENDA` and `TOPIC_KEYS` re-pointed to per-survey
  data; deal, add bank, and first-play instrument scoped to the
  level's bank; Level 1's bank curated to 36 from today's 64 and
  its BRD written in full. Levels 2-6 resolve to the legacy shared
  bank through the same lookup during this phase, as a transitional
  state only. Exit criteria: Level 1 plays end to end on its own
  bank and its own BRD at both harness viewports; new per-level
  tests (section 7) pass; Quick Challenge suites pass unchanged;
  no other level's behavior differs from today.
- **Phase 2: Levels 2 and 3.** Copilot and Azure banks (36 each)
  with their answerability tables and BRDs; stakeholder copy on
  Level 3 names the Azure product team as the sponsor making the
  request. Exit criteria: both levels deal, play, and report on
  their own banks; per-level tests extended; A/B and stakeholder
  suites pass unchanged.
- **Phase 3: Levels 4 and 5.** Relationship and perceptions banks
  and BRDs. Exit criteria: the goodwill-gated Level 4 line and the
  by-language Level 5 funnel verified on their own instruments;
  per-level tests extended.
- **Phase 4: Level 6 and legacy removal.** The flagship bank (or
  the combined draw, per decision 3), its BRD, and removal of the
  legacy-bank fallback so every level reads only its own bank.
  Exit criteria: all six levels on themed banks; the continuous
  six-level campaign test passes on themed instruments.
- **Phase 5: witnesses and rebalance.** Regenerate the full
  UI-legal witness corpus against the per-level banks: 364 setups
  at today's shape (fixed instrument plus 64 seeded draws per
  level, 39 on Level 4), every setup launched through the real
  card handlers. Re-verify minimum and maximum credits-to-win per
  level against the recorded baselines (fixed lines 58, 67, 69,
  76, 70, 98; highest checked draws 93, 93, 89, 82, 106, 120;
  pools 120, and 150 on Level 6). Replay the six balance
  invariants. Exit criteria: every witness passes every gate
  inside its pool; if a level's credits-to-win moves materially,
  the tuning levers are question times and defect mix inside that
  level's bank, never a pool change without its own decision.

The witness point deserves emphasis: the corpus is bank-specific
evidence. Every fixture records a kept set of question ids from the
support bank. The day a level's bank changes, that level's fixtures
prove nothing, and phase 5 is not optional polish on top of phases
2-4; it is where those phases become verified.

## 6. Risks and guardrails

- **Authoring load is the big one.** Approximately 180 new
  questions, each with a flag note or repaired form, is the largest
  content task the project has taken on. The failure mode is not
  slowness; it is a thin bank shipped to fill a phase: stems whose
  defect is asserted rather than exhibited, flag notes that
  describe a different defect than the stem commits, repairs that
  do not repair. The bank's own rule (defect and text travel
  together, section 2.2) is the quality bar, and each bank's
  answerability table (section 3.4) is reviewed before stems are
  finalized. A phase that cannot meet the bar at 36 should ship
  at the decision-2 size rather than dilute.
- **Balance invalidation.** New banks void the witness corpus per
  level (section 5). Until phase 5, claims about any themed level's
  difficulty are unverified, and phase exits before phase 5 must
  not be described as balance-verified.
- **Theme drift into product promotion.** The line is this: the
  surveys are subjects of measurement, never advertisements for
  what they measure. Questions ask about the respondent's
  experience and assert nothing about the product; no capability
  claims, no roadmap promises, no marketing copy in stems, invites,
  or BRD purpose text. Where a stem sounds promotional, that is a
  defect the game already knows how to teach: "How excellent was
  the Copilot output" is a LEADING item, present in the bank as a
  trap, not as copy. Sponsors are named as teams with a study to
  run, not as products with a launch to support. If a proposed stem
  could run unchanged in a product brochure, it does not belong in
  the bank except as a labeled defective or stupid item.
- **Naming note, recorded.** The themes name Microsoft product
  areas (Copilot, Azure) inside the game. Earlier game copy kept
  internal and product names generic; the exception for the real
  pipeline's name in the Fishbowl document was the owner's explicit
  call, and this extension of it is likewise the owner's explicit
  direction (2026-11-11), recorded here as his call. The game
  remains an internal training concept with simulated audiences
  and no real sends.
- **Segment copy mismatch.** Segment names and timing lines speak
  support language ("Support, Fresh"; "3 days after a closed
  support case") on every level today, and under this design the
  same Fresh list serves the Azure survey on Level 3. The segment
  machinery does not change (section 4), but the copy touchpoint
  is flagged for the phase-1 copy pass: either segment blurbs gain
  a per-level framing line, or the mismatch is accepted as the
  price of a shared audience model. It is a copy decision, not a
  mechanics one, and it is not silently resolved by this proposal.
- **Quick Challenge fragility.** The drills' dependence on shared-
  bank ids (section 2.7) is the easiest thing to break and the
  hardest to notice, because the drills would still deal, just
  with wrong cards. Id preservation is a data-model constraint in
  phase 1 and a named regression check in section 7.

## 7. Test and gate impact

Existing suites and what happens to them:

- **`scripts/game-features.test.mjs`** pins bank facts (tier
  counts, the drills' core and non-core assertions, agenda and
  Insight behavior, the stakeholder and A/B rules). Bank-count
  assertions re-scope per level in phase 1; drill assertions must
  pass byte-identical throughout, which is how id preservation is
  proven rather than promised.
- **The witness corpus** (`scripts/fixtures/winning-setups.json`,
  364 setups) is regenerated in phase 5, per section 5. Before
  phase 5, the corpus continues to verify the levels still on the
  legacy bank during the transitional phases.
- **The browser harness** gains per-level BRD checks (the overlay
  shows the current level's survey name, sponsor, and topics, at
  390px and desktop, with the shared sections intact) and, if
  decision 6 is approved, level-card naming checks.
- **Build validation** (`scripts/build-site.mjs`) is unaffected:
  the package list does not change; the game stays one file.

New tests the design implies:

- **Per-level bank schema validation.** Every bank fills its
  section quotas (A 3+, B 12+, C 3+, D 1+, E 1+, F 2+ as hard
  minima), meets the tier mix, satisfies the section 3.5 coverage
  floor with theme-naturals doubled, and holds at least 2
  creditable questions per agenda topic plus a designated core set
  with at least one creditable core per agenda topic.
- **Per-level core and agenda guarantee.** Across a seed sweep per
  level, every dealt instrument satisfies the agenda-coverage rule
  against that level's own agenda (the shipped swap, re-verified
  per bank), and the add bank always offers a creditable question
  on each uncovered agenda topic.
- **Per-level BRD rendering.** For each level, `openBRD()` output
  contains that survey's name, purpose, sponsor, topics with key
  personas, constraints, and mission numbers, and contains no
  other level's survey name or topics.
- **Insight against level topics.** A run on a themed instrument
  earns credit only on its own survey's topics; the Level 1
  support lines that verify today's Insight behavior replay
  unchanged on the curated template bank.
- **Id preservation.** The Quick Challenge card sets, twist cards,
  and late pool resolve to the same questions with the same core
  flags as today, asserted directly against the bank data.

## 8. Open decisions for the owner

Decided 2026-11-11: the owner approved all seven decisions as
recommended. The recommendations below are the build specification
for phases 1 to 5.

1. **Bank uniqueness model.** Fully unique themed banks, or themed
   cores with a shared generic pool for some stupid and filler
   items? Recommendation: unique banks for clean, defective, core,
   and stupid items (a vanity item about support is not a vanity
   item about Azure, and a shared stupid pool would re-create the
   one-questionnaire feel in the tier players notice most); a
   small shared pool only for form-only filler whose subject is
   the survey form itself (today's ids 67, 68, 70, 72 are the
   model: survey-day preference, survey-count recall, newsletter
   opt-in, device in hand). Everything else is written per survey.
2. **Per-level bank size.** The derived 36 per bank (approximately
   180 new questions) or the leaner 28 (approximately 140)?
   Recommendation: 36. The derivation in section 3.6 is driven by
   the add bank and agenda depth, not by appetite; 28 is the
   fallback if a phase cannot hold the quality bar at 36, taken
   per phase rather than globally.
3. **Level 6 flagship bank.** Its own bank mixing relationship and
   perception topics, or a combined draw from the Level 4 and
   Level 5 banks? Recommendation: its own bank. The flagship has
   its own agenda (section 3.3), its own answerability pattern
   (executive seats, section 3.4), and a 2-minute patience budget
   neither parent bank was written against; a combined draw would
   inherit two agendas and break the one-survey-one-BRD rule the
   whole design rests on. Individual stems may be adapted from the
   parent banks as an authoring shortcut; the draw never mixes.
4. **BRD overlay shape.** Fully per-level documents, or a short
   shared front section plus a per-level body? Recommendation:
   shared front plus per-level body, as designed in section 3.2.
   The five-checks acceptance language, the closing disclaimer,
   and the segment-driven list preparation section are game truth,
   not study content; duplicating them into six documents invites
   six-way drift in the rules text. The study itself (name,
   purpose, sponsor, audience, topics, constraints) is fully
   per-level.
5. **Defect coverage minimum.** The section 3.5 rule (floor of 8
   classes per level, theme-naturals doubled, all 11 on Level 1),
   or all 11 on every level? Recommendation: the floor rule.
   Forcing all 11 into a perception survey writes questions the
   genre would never field, and the campaign union still teaches
   every class repeatedly. The floor is a test assertion (section
   7), not a guideline.
6. **Naming the survey on the level select screen and setup
   headers.** Recommendation: yes. Level cards read "LEVEL 1 ·
   FIRST SEND · SUPPORT EXPERIENCE", the setup banner and HUD name
   the survey beside the instrument number, and the BRD title uses
   the survey name. The survey is the level's identity under this
   design; hiding it in the BRD would leave the select screen
   describing six mechanics with no subjects.
7. **Phase order and template level.** The section 5 order
   templates Level 1 first (its bank exists in substance, so the
   data model is proven against curation rather than authoring).
   If the owner would rather prove the model on new content first,
   the alternative is Level 3 (Azure), which exercises the
   stakeholder-as-sponsor writing earliest. Recommendation: keep
   Level 1 as the template. The model risks (id ranges, BRD
   assembly, Insight re-pointing) are identical on either level,
   and Level 1's existing balance evidence gives phase 1 a
   comparison baseline no other level has.

*End of proposal. On the owner's decisions, phase 1 is buildable as
scoped; phases 2 to 5 follow the same pattern as the medallion
stage: build, verify at the gates, present, and ship on his call.*
