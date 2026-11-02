# Evidence-fitness update

Released design: 2026-11-01. This document describes implemented game
behavior, not a research validation or a production-deployment receipt.

## What the campaign teaches

Produce evidence stakeholders can trust and use. Response rate is a
mission-specific benchmark, not a campaign win requirement.

Every campaign result must pass all five independent checks:

- Funnel execution: fieldwork produces completions without a breaker trip.
- Evidence fitness: the required audience pool, usable sample, account
  matching, and role coverage meet the mission's requirements.
- Data integrity: quality and cleaning retention meet their own gates.
- Audience sustainability: goodwill remains sufficient, with suppression
  applied when recontacting an audience pool.
- Operational trust: list preparation, usable Insight, and applicable
  language requirements pass.

One strong result cannot compensate for a failed check. The
[player guide](player-guide.md#scoring-and-winning) owns the exact
requirements and mission thresholds.

## What happens after a completion

The report continues through FINISH, CLEAN, MATCH, INTERPRET, PUBLISH,
and ACT. Cleaning removes flagged responses once each. Account matching
excludes responses that cannot be linked to the invited account.
Insight and role coverage are evaluated again on the usable base.

A failed check withholds publication and names corrective actions.
A passing result includes a context note explaining its response base
and limitations. These are simulated reporting decisions; the game
publishes no customer data and sends no email.

## What carries forward

Audience health and exposure remain in page memory across levels and
new instruments. Fresh, Stale, and Tired share the Support pool; Global
and Executive Blast have separate pools. A whole-campaign reset or
page reload clears this history. A new instrument alone does not.

Quick Challenges retain their own response, quality, Insight, and BRD
objectives. They do not consume or change campaign audience history.

## Boundaries and verification

The audience model tracks synthetic cohorts, not individual customers.
Account identifiers are simulated, and sample volumes are sprite-weighted.
Passing does not establish statistical precision, representativeness,
construct validity, privacy compliance, or research readiness.

The [development notes](development.md) describe the model and legal
winning fixtures. The [browser harness guide](../scripts/harness/README.md)
distinguishes automated coverage from manual checks and tooling blockers.
See the [changelog](../CHANGELOG.md) for dated verification,
[deployment guide](deployment.md) for publishing, and
[open work](../TODO.md) for unimplemented governance, localization,
portfolio, AI-adviser, and learning-assessment features.
