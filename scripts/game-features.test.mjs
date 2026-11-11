import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script, createContext } from 'node:vm';
import test from 'node:test';
import { root } from './build-site.mjs';
import { join } from 'node:path';

function game() {
  const elements = new Map();
  const timers = [];
  const classes = new Map();
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      attributes: {}, setAttribute(key, value) { this.attributes[key] = String(value); },
      getAttribute(key) { return this.attributes[key]; },
      style: {}, classList: {
        add(name) { classes.set(`${id}:${name}`, true); },
        remove(name) { classes.delete(`${id}:${name}`); },
        contains(name) { return classes.has(`${id}:${name}`); },
        toggle(name) { classes.set(`${id}:${name}`, !classes.get(`${id}:${name}`)); }
      },
      firstChild: {}, innerHTML: '', textContent: '', addEventListener() {},
      querySelectorAll() { return []; }, querySelector() { return element('child'); },
      focus() { document.activeElement = this; }, appendChild() {}, remove() {}
    });
    return elements.get(id);
  }
  const document = {
    getElementById: element, querySelectorAll() { return []; },
    addEventListener() {}, createElement() { return element('created'); }
  };
  const context = createContext({
    document, window: { scrollTo() {}, matchMedia() { return { matches: true }; } },
    setTimeout(callback) { timers.push(callback); }, clearTimeout() {}, setInterval() {}, clearInterval() {},
    requestAnimationFrame() { return 1; }, cancelAnimationFrame() {},
    performance: { now() { return 0; } },
    setMusicVariant() {}, initAudio() {}, console
  });
  const html = readFileSync(join(root, 'site', 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const script of scripts.slice(0, 2)) new Script(script[1]).runInContext(context);
  context.state.sound = false;
  return { context, element, timers };
}

test('population model: simulates every recipient rather than forty proxies', () => {
  const { context: g } = game();
  for (const segment of g.SEGMENTS) {
    g.selectLevel(segment.id === 'multi' ? 5 : segment.id === 'blast' ? 6 : 1, false);
    g.state.seg = segment;
    g.state.suppression = true;
    const run = g.buildRun();
    assert.ok(Array.isArray(run.respondents), 'the simulation must expose individual respondent records');
    assert.equal(run.respondents.length, segment.n);
    assert.equal(new Set(run.respondents.map(person => person.i)).size, segment.n);
    assert.equal(g.tally(run).invited, segment.n);
  }
});

test('population model: animation cohorts account for every recipient exactly once', () => {
  const { context: g } = game();
  const run = g.buildRun();
  assert.ok(Array.isArray(run.respondents));
  assert.ok(run.sprites.length > 40, 'visual groups are not limited to forty units');
  assert.ok(run.sprites.length < run.respondents.length);
  assert.equal(run.sprites.reduce((sum, group) => sum + group.count, 0), run.respondents.length);
  const ids = run.sprites.flatMap(group => Array.from(group.memberIds));
  assert.equal(ids.length, run.respondents.length);
  assert.equal(new Set(ids).size, run.respondents.length);
  for (const group of run.sprites) {
    assert.equal(group.count, group.memberIds.length);
    assert.ok(group.memberIds.every(id =>
      run.respondents[id].persona === group.persona &&
      run.respondents[id].fate === group.fate &&
      run.respondents[id].dropQ === group.dropQ));
  }
});

test('population model: changing animation density cannot change respondents or statistics', () => {
  const { context: g } = game();
  assert.equal(typeof g.groupRespondents, 'function');
  const sparse = g.buildRun(40);
  const dense = g.buildRun(240);
  assert.notEqual(sparse.sprites.length, dense.sprites.length);
  assert.equal(JSON.stringify(sparse.respondents), JSON.stringify(dense.respondents));
  assert.equal(JSON.stringify(g.tally(sparse)), JSON.stringify(g.tally(dense)));
  const counts = g.tally(dense);
  const quality = g.qualityAssessment(dense, counts).quality;
  const evidence = JSON.stringify(g.evaluateEvidence(dense, counts, quality));
  dense.sprites = [];
  assert.equal(JSON.stringify(g.tally(dense)), JSON.stringify(counts));
  assert.equal(JSON.stringify(g.evaluateEvidence(dense, counts, quality)), evidence);
});

test('population model: latent response flags do not split otherwise identical visual behavior', () => {
  const { context: g } = game();
  const respondents = Array.from({ length: 8 }, (_, i) => ({
    i, persona: 'tech', lang: 'en', abGroup: 'A', fate: 'finish', dropQ: 0, via: 'base',
    events: [], qTopBox: !!(i & 1), qMush: !!(i & 2), qJunk: !!(i & 4)
  }));
  const before = JSON.stringify(g.tally({ respondents }));
  const groups = g.groupRespondents(respondents, 1);
  assert.equal(groups.length, 1, 'nonvisual flags must not create exponential animation buckets');
  assert.equal(groups[0].count, respondents.length);
  assert.equal(JSON.stringify(g.tally({ respondents })), before, 'all individual flags remain available to statistics');
});

test('population model: live statistical progress agrees with the full population', () => {
  const { context: g } = game();
  assert.equal(typeof g.populationProgress, 'function');
  for (const breaker of [false, true]) {
    g.selectLevel(1, false);
    if (breaker) {
      g.state.seg = g.SEGMENTS.find(segment => segment.id === 'blast');
      g.state.invite = g.INVITES.find(invite => invite.id === 'generic');
      g.state.reminders = 2;
    }
    const run = g.buildRun();
    const counts = g.tally(run);
    const before = g.populationProgress(run, 0);
    assert.equal(before.sent, 0);
    assert.equal(before.completed, 0);
    for (const time of [1000, 5000, g.BREAKER_STOP_T, 15000]) {
      const progress = g.populationProgress(run, time);
      assert.equal(progress.sent, run.respondents.filter(person => person.fate !== 'notsent' && person.spawnAt <= time).length);
      assert.equal(progress.completed, run.respondents.filter(person =>
        person.events.some(event => event.type === 'finish' && event.t <= time)).length);
      assert.equal(progress.opened, run.respondents.filter(person =>
        person.events.some(event => event.type === 'gate' && event.gate === 'opened' && event.t <= time)).length);
    }
    const final = g.populationProgress(run, Infinity);
    assert.equal(final.sent, counts.sent);
    assert.equal(final.completed, counts.completed);
    assert.equal(final.bounced, counts.bouncedHard + counts.bouncedSoft);
    assert.equal(final.delivered - final.opened, counts.delivered - counts.opened);
    const guessEvents = run.respondents.reduce((sum, person) =>
      sum + person.events.filter(event => event.type === 'guess').length, 0);
    assert.equal(final.guesses, guessEvents);
    if (breaker) {
      assert.equal(run.gm.trips, true);
      assert.ok(final.sent < run.respondents.length);
      const cutoff = g.populationProgress(run, g.BREAKER_STOP_T);
      assert.equal(JSON.stringify(cutoff), JSON.stringify(final), 'no recipient contributes after the breaker');
    }
  }
});

test('population model: quality penalties use rates rather than population-sized raw counts', () => {
  const { context: g } = game();
  assert.equal(typeof g.qualityAssessment, 'function');
  const run = g.buildRun();
  const quality = g.qualityAssessment(run, g.tally(run)).quality;
  const doubled = { ...run, respondents: [...run.respondents, ...run.respondents] };
  assert.equal(g.qualityAssessment(doubled, g.tally(doubled)).quality, quality);
});

test('population model: usable samples count individual records without animation weights', () => {
  const { context: g } = game();
  const run = g.buildRun();
  assert.ok(Array.isArray(run.respondents));
  const counts = g.tally(run);
  const evidence = g.evaluateEvidence(run, counts, 100);
  assert.equal(evidence.usableN, evidence.matched);
  assert.ok(evidence.usableN <= counts.completed);
  assert.ok(evidence.roles.every(role => Number.isInteger(role.count)));
});

test('population model: run counters and reports use recipient totals', () => {
  const { context: g, element } = game();
  g.startRun();
  g.showReport();
  const counts = g.tally(g.runData);
  assert.equal(Number(element('compCount').textContent.replaceAll(',', '')), counts.completed);
  assert.equal(Number(element('sentCount').textContent.replaceAll(',', '')), counts.sent);
  const text = element('report').innerHTML;
  assert.doesNotMatch(text, /sent sprites|people per sprite|usable sprites|40 sprites/);
  assert.ok(text.includes(String(g.state.seg.n)) || text.includes(g.state.seg.n.toLocaleString('en-US')));
});

test('population model: invalid population sizes fail explicitly', () => {
  const { context: g } = game();
  for (const n of [0, -1, 1.5, NaN]) {
    g.state.seg = { ...g.SEGMENTS[0], n };
    assert.throws(() => g.buildRun(), /population.*positive integer/i);
  }
});

test('population model: rate labels retain a single recipient at twenty thousand', () => {
  const { context: g } = game();
  assert.equal(g.pct(1 / 20000 * 100), '0.005%');
  assert.equal(g.pct(2401 / 20000 * 100), '12.005%');
});

test('population model: cohort pixel art uses one cached image without changing its pixels', () => {
  const { context: g } = game();
  const color = '#3fa7f5';
  const html = g.spriteHTML(color);
  assert.equal((html.match(/<(?!\/)[a-z]+/g) || []).length, 1, 'hundreds of groups must not create one DOM node per pixel');
  const palette = { H: '#241f31', S: '#f2c29b', E: '#241f31', B: color, T: '#241f31' };
  const image = html.match(/src="data:image\/svg\+xml,([^"]+)"/);
  assert.ok(image, 'cohort art must reuse a rasterizable image instead of repainting every pixel');
  const expected = [];
  for (let y = 0; y < g.SPRITE_MAP.length; y++) {
    for (let x = 0; x < g.SPRITE_MAP[y].length; x++) {
      const cell = g.SPRITE_MAP[y][x];
      if (palette[cell]) expected.push([x * 2, y * 2, palette[cell]]);
    }
  }
  const svg = decodeURIComponent(image[1]);
  const pixels = [...svg.matchAll(/<rect x="(\d+)" y="(\d+)" width="2" height="2" fill="([^"]+)"/g)]
    .map(match => [Number(match[1]), Number(match[2]), match[3]]);
  assert.deepEqual(pixels, expected);
});

test('population model: a frame of cohort landings shares one geometry measurement', () => {
  const { context: g, element } = game();
  let reads = 0;
  for (const id of ['track', 'bounceStack', 'unopenedStack']) {
    element(id).getBoundingClientRect = () => {
      reads++;
      return { left: 0, top: 0, bottom: 32, width: 76, height: 32 };
    };
  }
  assert.equal(typeof g.measurePileGeometry, 'function');
  g.pileFrameGeometry = g.measurePileGeometry();
  assert.equal(reads, 3);
  const sprite = () => ({ el: { style: {}, classList: { add() {} } } });
  g.routeSpriteToPile(sprite(), 'bounce');
  g.routeSpriteToPile(sprite(), 'noopen');
  assert.equal(reads, 3, 'landing cohorts must not force another read after each DOM write');
});

/* The intended line per challenge: repair the three BRD cards, then
   resolve each extra as curated (repair what is worth saving, cut the
   rest). Costs are the full launch totals at QUICK_BUDGET. */
const QC_INTENDED = [
  { actions: { 26: 'simplify', 57: 'cut', 22: 'simplify' }, cost: 45 },
  { actions: { 7: 'simplify', 51: 'simplify', 68: 'cut' }, cost: 46 },
  { actions: { 12: 'simplify', 23: 'cut', 60: 'cut' }, cost: 44 }
];
function applyQuickLine(g, index, line) {
  const challenge = g.QUICK_CHALLENGES[index];
  for (const id of challenge.ids) clickSimplify(g, id);
  for (const id of challenge.extras) {
    const action = line === 'cut-extras' ? 'cut' : QC_INTENDED[index].actions[id];
    if (action === 'cut') clickCut(g, id); else clickSimplify(g, id);
  }
}

/* Stage 2: every challenge run draws one BRD twist from the run seed.
   Tests pin the twist by scanning deterministic seeds through the
   game's own draw, so a test's line is always judged under the brief
   it was written for. Variant order per challenge: 0 = the mandatory
   stakeholder demand, then the raised bar / time ceiling twists. */
function startQCWithVariant(g, index, variantIndex) {
  for (let n = 0; n < 500; n++) {
    const seed = 'V' + String(n).padStart(3, '0');
    if (g.quickVariantIndex(index, seed) === variantIndex) {
      g.startQuickChallenge(index, seed);
      assert.equal(g.state.quickChallenge.variant, variantIndex);
      return seed;
    }
  }
  throw new Error(`No seed in the scan draws variant ${variantIndex} for challenge ${index}`);
}

test('Quick Challenge deals three BRD defects and three cuttable extras with fixed preparation', () => {
  const { context: g } = game();
  assert.equal(typeof g.startQuickChallenge, 'function');
  for (let index = 0; index < 3; index++) {
    /* Pinned to the mandatory twist: the intended line repairs the
       required extra in every challenge, so it wins under this brief. */
    startQCWithVariant(g, index, 0);
    const challenge = g.QUICK_CHALLENGES[index];
    const core = g.activeQuestions().filter(q => q.core);
    const extras = g.activeQuestions().filter(q => !q.core);
    assert.equal(g.activeQuestions().length, 6);
    assert.deepEqual(Array.from(core, q => q.id), Array.from(challenge.ids));
    assert.deepEqual(Array.from(extras, q => q.id), Array.from(challenge.extras));
    /* The agenda is the BRD's alone: signature topics only, so cutting
       an extra can never lose a required topic. */
    assert.deepEqual(Array.from(g.agendaTopics()),
      Array.from(new Set(core.map(q => q.topic))));
    assert.ok(core.every(q => g.defectOf(q) !== 'CLEAN'));
    /* Every extra is a real judgment: defective in a theme class, or a
       low-value item; none is core in the bank's own data. */
    assert.ok(extras.every(q => g.QUESTION_BANK.find(b => b.id === q.id).core === false));
    assert.ok(extras.every(q => g.defectOf(q) !== 'CLEAN' || g.tierOf(q) === 'stupid' || g.tierOf(q) === 'filler'));
    assert.ok(extras.some(q => g.tierOf(q) === 'stupid' || g.tierOf(q) === 'filler'),
      `Challenge ${index} needs a clear CUT candidate`);
    assert.equal(g.QUICK_BUDGET, 48);
    assert.equal(g.QUICK_BASE_COST, 34);
    assert.equal(g.BUDGET_TOTAL, 48);
    assert.equal(g.addBankQuestions().length, 0);
    assert.equal(g.state.validation, 'full');
    assert.equal(g.state.dedupe, true);
    assert.equal(g.state.suppression, true);
    /* The intended line, driven through the card handlers, wins. */
    applyQuickLine(g, index, 'intended');
    assert.equal(g.budgetMath().total, QC_INTENDED[index].cost);
    assert.ok(g.budgetMath().total <= g.QUICK_BUDGET);
    const run = g.buildRun();
    const count = g.tally(run);
    assert.ok(count.completed > count.sent * 0.12, `Challenge ${index} must be winnable`);
    assert.ok(g.computeInsight(count, run).score >= 60);
    g.startRun();
    g.showReport();
    assert.match(g.document.getElementById('report').innerHTML, /QUICK CHALLENGE · WON/);
  }
});

test('every Quick Challenge also wins by cutting all three extras', () => {
  /* The cut-all line is judged under a twist it satisfies: QC1's
     reporting threshold (the short instrument responds best), QC2's
     four-minute ceiling, QC3's one-minute rule. Under the mandatory
     twists the same line loses, which the twist tests below assert. */
  const cutAllVariant = [1, 1, 2];
  for (let index = 0; index < 3; index++) {
    const { context: g, element } = game();
    startQCWithVariant(g, index, cutAllVariant[index]);
    applyQuickLine(g, index, 'cut-extras');
    assert.equal(g.keptQuestions().length, 3, 'only the BRD cards remain');
    assert.equal(g.budgetMath().total, 43, 'base 34 + repairs 6 + three cuts');
    assert.ok(g.budgetMath().total <= g.QUICK_BUDGET);
    g.startRun();
    g.showReport();
    assert.match(element('report').innerHTML, /QUICK CHALLENGE · WON/, `Challenge ${index} cut line must win`);
    assert.match(element('report').innerHTML, /Extras resolved <b>3 \/ 3<\/b>/);
  }
});

test('a Quick Challenge left with an unresolved extra does not win', () => {
  const { context: g, element } = game();
  startQCWithVariant(g, 0, 0);
  applyQuickLine(g, 0, 'intended');
  /* Restore the last extra to an unresolved keep (the tray handler's own
     assignment): scores stay strong, but the drill is unfinished. */
  g.state.qstate[22] = 'keep';
  g.startRun();
  g.showReport();
  assert.match(element('report').innerHTML, /TRY ANOTHER REPAIR/);
  assert.match(element('report').innerHTML, /Extras resolved <b>2 \/ 3<\/b>/);
});

test('BRD twist draw is deterministic per seed and reaches every variant', () => {
  const { context: g, element } = game();
  assert.equal(typeof g.quickVariantIndex, 'function');
  for (let index = 0; index < 3; index++) {
    /* Same seed, same brief: the draw is a pure function of the seed. */
    assert.equal(g.quickVariantIndex(index, 'V042'), g.quickVariantIndex(index, 'V042'));
    const seed = startQCWithVariant(g, index, 2);
    const firstVariant = g.state.quickChallenge.variant;
    const firstSeed = g.state.quickChallenge.seed;
    g.startQuickChallenge(index, seed);
    assert.equal(g.state.quickChallenge.variant, firstVariant);
    assert.equal(g.state.quickChallenge.seed, firstSeed);
    /* A seed sweep reaches all three twists of the challenge. */
    const seen = new Set();
    for (let n = 0; n < 200; n++) seen.add(g.quickVariantIndex(index, 'V' + String(n).padStart(3, '0')));
    assert.deepEqual([...seen].sort(), [0, 1, 2], `Challenge ${index} sweep must reach every variant`);
    /* The BRD prints the drawn twist as its own section, with the
       acceptance line among the criteria and the seed named. */
    g.openBRD();
    const brd = element('brdContent').innerHTML;
    const variant = g.QUICK_CHALLENGES[index].variants[firstVariant];
    assert.match(brd, new RegExp(`BRD TWIST · ${variant.name}`));
    assert.ok(brd.includes(variant.acceptance), 'acceptance criteria must include the twist');
    assert.ok(brd.includes(firstSeed), 'BRD must name the run seed');
    assert.ok(element('levelBanner').innerHTML.includes(variant.name), 'banner must name the twist');
  }
});

test('a mandatory BRD question can be cut but still requires repair to win', () => {
  for (let index = 0; index < 3; index++) {
    const { context: g, element } = game();
    startQCWithVariant(g, index, 0);
    const variant = g.quickVariant();
    assert.equal(variant.type, 'mandatory');
    g.renderQuestions();
    assert.match(element('qGrid').innerHTML, /BRD REQUIRED/);
    applyQuickLine(g, index, 'intended');
    clickCut(g, variant.qid);
    assert.equal(g.state.qstate[variant.qid], 'cut', `Q${variant.qid} may be removed`);
    g.startRun();
    g.showReport();
    assert.match(element('report').innerHTML, /TRY ANOTHER REPAIR/);
    assert.match(element('report').innerHTML, /BRD twist · <b>(.*?)<\/b>.*NOT MET/s);
    /* The intended line keeps and repairs it: twist met, challenge won. */
    const { context: g2, element: element2 } = game();
    startQCWithVariant(g2, index, 0);
    applyQuickLine(g2, index, 'intended');
    g2.startRun();
    g2.showReport();
    assert.match(element2('report').innerHTML, /QUICK CHALLENGE · WON/);
    assert.match(element2('report').innerHTML, /BRD twist · <b>(.*?)<\/b>.*— <b>MET<\/b>/s);
  }
});

/* Rate/quality boundaries use individual synthetic records rather than
   an unusually good or bad forty-person draw. Winning lines still
   run the real full-population model within 48 credits. */
const QC_TWIST_LINES = [
  /* challenge, variant, winning actions, violating actions */
  [0, 1, 'cut-extras', 'rate-boundary'],
  [0, 2, { 26: 'simplify', 57: 'cut', 22: 'cut' }, 'intended'], /* short shift 1.5 min: intended reads 1.88 */
  [1, 1, 'cut-extras', 'intended'],   /* four-minute ceiling: intended reads 5.0 min */
  [1, 2, { 7: 'cut', 51: 'simplify', 68: 'cut' }, 'rate-boundary'],
  [2, 1, 'intended', 'quality-boundary'],
  [2, 2, 'cut-extras', 'intended']    /* one-minute rule 1.1 min: intended reads 1.25 */
];
function applyTwistLine(g, index, line) {
  if (line === 'rate-boundary' || line === 'quality-boundary') {
    applyQuickLine(g, index, 'intended'); return;
  }
  if (typeof line === 'string') { applyQuickLine(g, index, line); return; }
  const challenge = g.QUICK_CHALLENGES[index];
  for (const id of challenge.ids) clickSimplify(g, id);
  for (const [id, action] of Object.entries(line)) {
    if (action === 'cut') clickCut(g, Number(id)); else clickSimplify(g, Number(id));
  }
}
test('raised bars and time ceilings are enforced and winnable within budget', () => {
  for (const [index, variantIndex, winLine, loseLine] of QC_TWIST_LINES) {
    const { context: g, element } = game();
    startQCWithVariant(g, index, variantIndex);
    applyTwistLine(g, index, loseLine);
    assert.ok(g.budgetMath().total <= g.QUICK_BUDGET);
    if (loseLine === 'rate-boundary' || loseLine === 'quality-boundary') {
      const count = loseLine === 'rate-boundary' ? Math.round(g.curLevel().target * 40) : 10;
      const roles = Array.from({ length: count }, (_, i) => g.PKEYS[i % g.PKEYS.length]);
      g.runData = evidenceRun(g, roles);
      if (loseLine === 'quality-boundary') {
        const completed = g.runData.respondents.filter(person => person.fate === 'finish');
        for (const person of completed.slice(0, Math.round(completed.length * 0.1))) person.qSpeed = true;
      }
      g.state.launchCost = g.budgetMath().attemptCost;
    } else g.startRun();
    g.showReport();
    assert.match(element('report').innerHTML, /TRY ANOTHER REPAIR/,
      `Challenge ${index} variant ${variantIndex}: the base-winning line must fail the twist`);
    assert.match(element('report').innerHTML, /NOT MET/);
    const { context: g2, element: element2 } = game();
    startQCWithVariant(g2, index, variantIndex);
    applyTwistLine(g2, index, winLine);
    assert.ok(g2.budgetMath().total <= g2.QUICK_BUDGET,
      `Challenge ${index} variant ${variantIndex}: winning line must fit 48 credits`);
    g2.startRun();
    g2.showReport();
    assert.match(element2('report').innerHTML, /QUICK CHALLENGE · WON/,
      `Challenge ${index} variant ${variantIndex}: its winning line must win`);
    assert.match(element2('report').innerHTML, /— <b>MET<\/b>/);
  }
});

test('BRD twists never leak into the campaign', () => {
  const { context: g, element } = game();
  startQCWithVariant(g, 2, 1); /* the audit bar: quality gate 95 while active */
  assert.equal(g.quickQualityGate(), 95);
  assert.equal(g.curLevel().target, 0.12);
  g.leaveQuickChallenge();
  g.selectLevel(1, false);
  assert.equal(g.state.quickChallenge, null);
  assert.equal(g.quickVariant(), null);
  assert.equal(g.quickQualityGate(), 60);
  assert.equal(g.curLevel().target, 0.12);
  assert.equal(g.instrumentFloor(), 1);
  g.openBRD();
  assert.doesNotMatch(element('brdContent').innerHTML, /BRD TWIST/);
});

test('Quick Challenge report is one launch and does not award campaign progress', () => {
  const { context: g, element } = game();
  assert.equal(typeof g.startQuickChallenge, 'function');
  g.state.campaignWon[2] = true;
  g.state.unlocked = 3;
  g.startQuickChallenge(0);
  g.activeQuestions().forEach(q => { g.state.qstate[q.id] = 'simplify'; });
  g.startRun();
  g.showReport();
  assert.match(element('report').innerHTML, /CHALLENGE/);
  assert.doesNotMatch(element('report').innerHTML, /id="againBtn"/);
  assert.equal(g.state.campaignWon[1], undefined);
  assert.equal(g.state.unlocked, 3);
  g.leaveQuickChallenge();
  assert.equal(g.BUDGET_TOTAL, 120);
  assert.equal(g.activeQuestions().length, 12);
  assert.equal(g.state.campaignWon[2], true);
  assert.equal(g.state.qstate[3], 'keep');
});

test('invalid Quick Challenge index fails explicitly', () => {
  const { context: g } = game();
  assert.equal(typeof g.startQuickChallenge, 'function');
  assert.throws(() => g.startQuickChallenge(99), /challenge/i);
});

test('respondent reactions describe actual events without changing simulation', () => {
  const { context: g } = game();
  assert.equal(typeof g.respondentReaction, 'function');
  const before = JSON.stringify(g.buildRun());
  assert.match(g.respondentReaction({ type: 'guess', qid: 5 }, { persona: 'tech' }), /know/i);
  assert.match(g.respondentReaction({ type: 'escape', qid: 5 }, { persona: 'tech' }), /guess/i);
  assert.match(g.respondentReaction({ type: 'finish' }, { persona: 'end', guessed: true }), /guess/i);
  assert.match(g.respondentReaction({ type: 'qmark', qid: 8 }, { persona: 'end' }), /half/i);
  assert.equal(g.respondentReaction({ type: 'qmark', qid: 1 }, { persona: 'end' }), '');
  assert.equal(g.respondentReaction({ type: 'gate', gate: 'delivered' }, { persona: 'end' }), '');
  assert.equal(JSON.stringify(g.buildRun()), before);
});

test('reaction sampling stays bounded and references only simulated events', () => {
  const { context: g } = game();
  assert.equal(typeof g.sampleReactions, 'function');
  const run = g.buildRun();
  const examples = g.sampleReactions(run);
  assert.ok(examples.length > 0 && examples.length <= 4);
  assert.ok(examples.every(example => run.respondents.some(sp =>
    sp.persona === example.persona && sp.events.some(event =>
      g.respondentReaction(event, sp) === example.text))));
});

test('stakeholder choices preserve existing trade-offs and reject unaffordable choices', () => {
  const { context: g } = game();
  assert.equal(typeof g.chooseStakeholder, 'function');
  g.selectLevel(3, false);
  const originalMinutes = g.estMinutes();
  const originalGoodwill = g.goodwillMath().ending;
  const originalCost = g.budgetMath().total;
  assert.equal(g.chooseStakeholder('accept'), true);
  assert.equal(g.estMinutes(), originalMinutes + 4);
  assert.equal(g.goodwillMath().ending, originalGoodwill - 10);
  assert.equal(g.budgetMath().total, originalCost + 10);
  assert.equal(g.chooseStakeholder('rotate'), true);
  assert.equal(g.estMinutes(), originalMinutes + 1);
  assert.equal(g.chooseStakeholder('pushback'), true);
  assert.equal(g.estMinutes(), originalMinutes);
  g.state.spentBefore = 120 - originalCost;
  assert.equal(g.chooseStakeholder('accept'), false);
  assert.equal(g.state.stakeholder, 'pushback');
  assert.throws(() => g.chooseStakeholder('bogus'), /stakeholder/i);
  assert.throws(() => g.chooseStakeholder('toString'), /stakeholder/i);
  assert.equal(g.state.stakeholder, 'pushback');
});

test('skipping a challenge countdown cannot restart animation after a fresh retry', () => {
  const { context: g, timers } = game();
  g.startQuickChallenge(0);
  g.startRun();
  const countdown = timers.shift();
  g.showReport();
  g.startQuickChallenge(0);
  const countBefore = timers.length;
  countdown();
  assert.equal(timers.length, countBefore, 'The old countdown must stop scheduling callbacks');
});

test('cutting every challenge topic cannot win on response rate alone', () => {
  const { context: g, element } = game();
  g.startQuickChallenge(0);
  const extra = g.activeQuestions().find(q => !q.core);
  for (const q of g.activeQuestions()) {
    if (q.id !== extra.id) clickCut(g, q.id);
  }
  assert.equal(g.keptQuestions().length, 1);
  g.startRun();
  g.showReport();
  assert.match(element('report').innerHTML, /TRY ANOTHER REPAIR/);
  assert.equal(g.computeInsight(g.tally(g.runData), g.runData).score, 0);
});

test('stakeholder cost forecasts use the same baseline-aware budget as a real choice', () => {
  const { context: g, element } = game();
  g.selectLevel(3, false);
  const initial = g.budgetMath().total;
  assert.equal(g.budgetMath({ stakeholder: 'accept' }).total, initial + 10);
  g.chooseStakeholder('accept');
  g.state.baseline = g.snapshotCurrent();
  g.state.spentBefore = 60;
  const saved = JSON.stringify(g.state);
  g.renderStakeholder();
  for (const choice of ['pushback', 'rotate', 'accept']) {
    const predicted = g.budgetMath({ stakeholder: choice }).total;
    const button = element('stakeholderPanel').innerHTML.match(new RegExp(`data-stake="${choice}"[\\s\\S]*?</button>`))[0];
    assert.match(button, new RegExp(`${predicted} total credits`));
    g.state.stakeholder = choice;
    assert.equal(g.budgetMath().total, predicted);
    g.state.stakeholder = 'accept';
  }
  assert.equal(JSON.stringify(g.state), saved);
});

test('a cut is applied before launch and its animation cannot edit the restored campaign', () => {
  const { context: g, timers } = game();
  /* The delayed animation must not re-render after entering and leaving
     a different instrument. */
  g.selectLevel(1, false);
  const qid = 5; /* Q5 is non-core on the Level 1 deal */
  let handler;
  const button = {
    getAttribute(key) { return key === 'data-q' ? String(qid) : 'cut'; },
    addEventListener(type, listener) { handler = listener; }
  };
  g.document.querySelectorAll = selector => selector === '[data-q]' ? [button] : [];
  g.renderQuestions();
  handler();
  assert.equal(g.state.qstate[qid], 'cut');
  assert.equal(g.keptQuestions().length, 11);
  const campaign = JSON.stringify(g.state);
  g.startQuickChallenge(0);
  g.leaveQuickChallenge();
  timers.forEach(callback => callback());
  assert.equal(JSON.stringify(g.state), campaign);
});

/* Drive the game's own question-card CUT handler for one question id,
   exactly as a click on its CUT button would. */
function clickCut(g, qid) {
  let handler;
  const button = {
    getAttribute(key) { return key === 'data-q' ? String(qid) : 'cut'; },
    addEventListener(type, listener) { handler = listener; }
  };
  g.document.querySelectorAll = selector => selector === '[data-q]' ? [button] : [];
  g.renderQuestions();
  handler();
}

/* Same mechanism as clickCut, for the card's fix (simplify) button. */
function clickSimplify(g, qid) {
  let handler;
  const button = {
    getAttribute(key) { return key === 'data-q' ? String(qid) : 'simplify'; },
    addEventListener(type, listener) { handler = listener; }
  };
  g.document.querySelectorAll = selector => selector === '[data-q]' ? [button] : [];
  g.renderQuestions();
  handler();
}

test('any campaign question can be cut through the question card controls', () => {
  const { context: g, element } = game();
  g.selectLevel(1, false);
  assert.equal(g.instrumentFloor(), 1);
  const core = g.activeQuestions().filter(q => q.core);
  assert.ok(core.length > 1);
  for (const q of core) {
    clickCut(g, q.id);
    assert.equal(g.state.qstate[q.id], 'cut', `core Q${q.id} may be removed`);
  }
  assert.equal(g.keptQuestions().length, g.activeQuestions().length - core.length);
  g.renderQuestions();
  const grid = element('qGrid').innerHTML;
  assert.ok((grid.match(/<button[^>]*data-act="cut"[^>]*>/g)).every(tag => !/disabled/.test(tag)));
  assert.doesNotMatch(grid, /CANNOT BE CUT/);
});

test('the one-question floor disables the final cut and recovers after restore or add', () => {
  const { context: g, element } = game();
  g.selectLevel(1, false);
  const last = g.activeQuestions().find(q => q.core);
  const removed = g.activeQuestions().filter(q => q.id !== last.id);
  for (const q of removed) clickCut(g, q.id);
  assert.equal(g.keptQuestions().length, 1);
  const cost = g.budgetMath().total;
  for (let round = 0; round < 2; round++) {
    assert.equal(g.applyCut(last.id), 'floor');
    clickCut(g, last.id);
    assert.equal(g.state.qstate[last.id], 'keep');
    assert.equal(g.budgetMath().total, cost, 'a refused cut charges nothing');
  }
  g.renderQuestions();
  const grid = element('qGrid').innerHTML;
  const cutTags = grid.match(/<button[^>]*data-act="cut"[^>]*>/g);
  assert.equal(cutTags.length, 1);
  assert.match(cutTags[0], /disabled/);
  assert.match(cutTags[0], /aria-label="Cut unavailable: Keep at least one question/);
  assert.match(element('qFloorNote').innerHTML, /MINIMUM INSTRUMENT REACHED/);
  assert.match(element('qFloorNote').innerHTML, /MINIMUM IS 1/);
  const restored = removed[0];
  g.state.qstate[restored.id] = 'keep';
  g.renderQuestions();
  assert.ok((element('qGrid').innerHTML.match(/<button[^>]*data-act="cut"[^>]*>/g)).every(tag => !/disabled/.test(tag)));
  assert.equal(g.keptQuestions().length, 2);
  clickCut(g, restored.id);
  assert.equal(g.state.qstate[restored.id], 'cut');
  assert.equal(g.keptQuestions().length, 1);
  const addable = g.addBankQuestions().filter(q => !q.core);
  assert.ok(addable.length > 0, 'the dealt bank offers a non-core question to add');
  const added = addable[0];
  g.state.added[added.id] = true;
  assert.equal(g.keptQuestions().length, 2);
  clickCut(g, last.id);
  assert.equal(g.keptQuestions()[0].id, added.id);
  assert.equal(g.applyCut(added.id), 'floor', 'a bank question can be the last protected question');
});

test('the one-question floor rejects an empty launch in both modes', () => {
  for (const quick of [false, true]) {
    const { context: g, element } = game();
    if (quick) g.startQuickChallenge(0); else g.selectLevel(1, false);
    g.activeQuestions().forEach(q => { g.state.qstate[q.id] = 'cut'; });
    g.renderReadout();
    assert.equal(g.keptQuestions().length, 0);
    assert.match(element('launchCheck').innerHTML, /At least one question kept \(Step 4\)[\s\S]*?TO DO/);
    assert.equal(element('launchBtn').disabled, true);
    assert.match(element('launchBtn').textContent, /TOO FEW QUESTIONS · MIN 1/);
    const before = [g.state.spentBefore, g.state.attempt, g.state.launchCost];
    g.startRun();
    assert.equal(g.state.running, false);
    assert.deepEqual([g.state.spentBefore, g.state.attempt, g.state.launchCost], before);
  }
});

test('a one-question questionnaire can launch without bypassing study requirements', () => {
  for (const quick of [false, true]) {
    const { context: g, element } = game();
    if (quick) g.startQuickChallenge(0); else g.selectLevel(1, false);
    const kept = g.activeQuestions()[0];
    for (const q of g.activeQuestions()) {
      if (q.id !== kept.id) clickCut(g, q.id);
    }
    assert.equal(g.keptQuestions().length, 1);
    g.renderReadout();
    assert.equal(element('launchBtn').disabled, false);
    g.startRun();
    assert.equal(g.state.running, true);
    g.showReport();
    if (quick) assert.match(element('report').innerHTML, /TRY ANOTHER REPAIR/);
    else assert.equal(g.state.lastRound.evidence.won, false);
  }
});

test('cutting and later restoring an added bank question charges 1 cr each', () => {
  const { context: g } = game();
  g.selectLevel(1, false);
  const addable = g.addBankQuestions().find(q => !q.core);
  assert.ok(addable, 'the dealt bank offers a non-core question to add');
  const freshTotal = g.budgetMath().total;
  /* ADD FROM BANK (the bank button's own toggle assignment): 3 cr. */
  g.state.added[addable.id] = true;
  assert.equal(g.budgetMath().total, freshTotal + 3);
  /* Cut the added question through the card handler: the cut itself
     charges 1 cr, like any dealt question. */
  clickCut(g, addable.id);
  assert.equal(g.state.qstate[addable.id], 'cut');
  assert.equal(g.budgetMath().total, freshTotal + 3 + 1);
  /* End the attempt: the launched snapshot becomes the chain baseline. */
  g.startRun(); g.showReport();
  g.state.attempt = 2;
  const attemptCostBeforeRestore = g.budgetMath().attemptCost;
  /* RESTORE (the cut tray handler's own assignment) in the next attempt:
     restoring a question cut in an earlier attempt charges 1 cr. */
  g.state.qstate[addable.id] = 'keep';
  assert.equal(g.budgetMath().attemptCost, attemptCostBeforeRestore + 1);
});

test('the one-question floor protects an instrument with no core cards', () => {
  const { context: g, element } = game();
  g.selectLevel(1, false);
  const nonCore = g.QUESTION_BANK.filter(q => !q.core).slice(0, 4);
  g.state.instrument = nonCore;
  for (const q of g.state.instrument) g.state.qstate[q.id] = 'keep';
  assert.equal(g.instrumentFloor(), 1);
  for (const q of nonCore.slice(0, -1)) clickCut(g, q.id);
  assert.equal(g.keptQuestions().length, 1);
  const last = nonCore.at(-1);
  assert.equal(g.applyCut(last.id), 'floor');
  g.renderQuestions();
  const tag = element('qGrid').innerHTML.match(new RegExp(`<button[^>]*data-q="${last.id}"[^>]*data-act="cut"[^>]*>`))[0];
  assert.match(tag, /disabled/);
  assert.match(tag, /aria-label="Cut unavailable: Keep at least one question/);
});

test('the one-question floor allows Quick Challenge BRD and extra cuts', () => {
  const { context: g, element } = game();
  startQCWithVariant(g, 0, 0);
  assert.equal(g.activeQuestions().length, 6);
  assert.equal(g.instrumentFloor(), 1);
  const last = g.activeQuestions()[0];
  for (const q of g.activeQuestions().filter(q => q.id !== last.id)) {
    clickCut(g, q.id);
    assert.equal(g.state.qstate[q.id], 'cut');
  }
  assert.equal(g.keptQuestions().length, 1);
  assert.equal(g.applyCut(last.id), 'floor');
  g.renderQuestions();
  assert.match(element('qFloorNote').innerHTML, /MINIMUM IS 1/);
  g.leaveQuickChallenge();
  assert.equal(g.instrumentFloor(), 1);
});

test('Quick Challenge restores a previously prepared campaign attempt chain', () => {
  const { context: g } = game();
  g.selectLevel(3, false);
  g.chooseStakeholder('rotate');
  g.state.validation = 'full';
  g.state.qstate[g.activeQuestions()[0].id] = 'cut';
  g.state.baseline = g.snapshotCurrent();
  g.state.spentBefore = 65;
  g.state.attempt = 2;
  g.state.chainActive = true;
  const original = JSON.stringify(g.state);
  const cost = g.budgetMath().total;
  g.startQuickChallenge(0);
  g.startRun();
  g.showReport();
  g.startQuickChallenge(1);
  assert.equal(g.state.spentBefore, 0);
  assert.equal(g.state.attempt, 1);
  assert.ok(g.activeQuestions().every(q => g.state.qstate[q.id] === 'keep'));
  g.leaveQuickChallenge();
  assert.equal(JSON.stringify(g.state), original);
  assert.equal(g.budgetMath().total, cost);
});

test('Level 1 default still misses the response benchmark for the full audience', () => {
  const { context: g } = game();
  g.selectLevel(1, false);
  const run = g.buildRun();
  const count = g.tally(run);
  assert.equal(count.sent, g.state.seg.n);
  assert.ok(count.completed / count.sent < g.curLevel().target);
  assert.equal(JSON.stringify(g.buildRun()), JSON.stringify(run));
});

test('Quick Challenge never awards a win for unrepaired or cut cards', () => {
  const { context: g, element } = game();
  for (let index = 0; index < 3; index++) {
    g.startQuickChallenge(index);
    g.startRun();
    g.showReport();
    assert.match(element('report').innerHTML, /TRY ANOTHER REPAIR/);
    g.startQuickChallenge(index);
    g.activeQuestions().forEach(q => { g.state.qstate[q.id] = 'simplify'; });
    g.state.qstate[g.activeQuestions()[0].id] = 'cut';
    g.startRun();
    g.showReport();
    assert.match(element('report').innerHTML, /TRY ANOTHER REPAIR/);
  }
});

test('stakeholder debrief does not imply extra-topic answers were collected', () => {
  const { context: g } = game();
  g.selectLevel(3, false);
  g.chooseStakeholder('rotate');
  g.startRun();
  const report = g.extraReportHTML(g.tally(g.runData));
  assert.match(report, /Extra-topic answers are not simulated or scored/);
  assert.doesNotMatch(report, /every topic gets partial data/);
});

test('stakeholder goodwill forecast includes crossing the honest time promise', () => {
  const { context: g, element } = game();
  g.selectLevel(3, false);
  g.state.invite = g.INVITES[1];
  g.activeQuestions().forEach(q => { g.state.qstate[q.id] = 'cut'; });
  /* The Azure fixed instrument's two 1-minute items: with Accept's
     four stakeholder minutes they cross the Honest Ask's 5-minute
     promise, as the retired wordy stem (1.5 min) did before phase 3. */
  g.state.qstate[314] = 'keep';
  g.state.qstate[319] = 'keep';
  g.renderStakeholder();
  const button = element('stakeholderPanel').innerHTML.match(/data-stake="accept"[\s\S]*?<\/button>/)[0];
  g.chooseStakeholder('accept');
  assert.ok(g.goodwillMath().spendOver > 0);
  assert.match(button, new RegExp(`ending goodwill ${g.goodwillMath().ending}`));
});

test('MPOR replaces the guide label and Marge coaching is removed without losing reports', () => {
  const html = readFileSync(join(root, 'site', 'index.html'), 'utf8');
  assert.match(html, /id="guideBtn"[^>]*>\? Consult MPOR<\/button>/);
  assert.match(html, /aria-label="Master Plan of Record"/);
  assert.doesNotMatch(html, /MARGE|Marge|coachStrip|coachSay|COACH_TIPS|lessoncard/);
  const { context: g, element } = game();
  g.selectLevel(1, false);
  g.startRun();
  g.showReport();
  assert.doesNotMatch(element('report').innerHTML, /ONE LESSON|TRY THIS NEXT/);
  assert.match(element('report').innerHTML, /DATA QUALITY|QUALITY/);
  assert.match(element('report').innerHTML, /id="againBtn"/);
});

test('BRD describes the active study requirements without changing the setup', () => {
  const { context: g, element } = game();
  for (let level = 1; level <= 6; level++) {
    g.selectLevel(level, false);
    const saved = JSON.stringify(g.state);
    g.openBRD();
    const text = element('brdContent').innerHTML;
    assert.match(text, /Business Requirement Document/);
    assert.ok(text.includes(g.curLevel().name));
    assert.ok(g.agendaTopics().every(topic => text.includes(topic)));
    assert.ok(text.includes(`${g.curLevel().budget} credits`));
    assert.ok(text.includes(`Response benchmark: ${Math.round(g.curLevel().target * 100)}%`));
    assert.match(text, /Pass all five evidence checks/);
    assert.ok(text.includes(`Insight ${g.insightGate()}+`));
    if (level === 4) assert.match(text, /ending goodwill 35/);
    if (level === 3 || level === 6) assert.match(text, /extra-topic answers are not simulated or scored/i);
    assert.equal(JSON.stringify(g.state), saved);
  }
  g.startQuickChallenge(2);
  g.openBRD();
  assert.match(element('brdContent').innerHTML, /Repair the three BRD cards/);
  assert.match(element('brdContent').innerHTML, /scope creep/);
  assert.match(element('brdContent').innerHTML, /one launch/);
  assert.match(element('brdContent').innerHTML, /48 credits/);
});

test('mobile QR toggles between a collapsed icon and the full player panel', () => {
  const { context: g, element } = game();
  g.toggleMobileQR(true);
  assert.equal(element('mobileQR').getAttribute('aria-expanded'), 'true');
  assert.equal(element('mobileQRLink').hidden, false);
  g.toggleMobileQR(false);
  assert.equal(element('mobileQR').getAttribute('aria-expanded'), 'false');
  assert.equal(element('mobileQRLink').hidden, true);
});

test('a winning report always offers level selection and the next study', () => {
  const { context: g, element } = game();
  g.selectLevel(1, false);
  g.state.validation = 'full'; g.state.dedupe = true; g.state.suppression = true;
  g.state.invite = g.INVITES[1]; g.state.escapes = true;
  g.activeQuestions().forEach(q => {
    g.state.qstate[q.id] = [1, 2, 3, 4, 6, 9].includes(q.id) ? (q.id === 3 ? 'simplify' : 'keep') : 'cut';
  });
  g.startRun(); g.showReport();
  assert.equal(g.state.campaignWon[1], true);
  assert.match(element('report').innerHTML, /id="levelSelectBtn"/);
  assert.match(element('report').innerHTML, /id="nextLevelBtn"/);
});

test('retry requires the minimum send cost of the available audience', () => {
  const { context: g, element } = game();
  g.selectLevel(6, false);
  g.state.spentBefore = 150 - g.budgetMath().attemptCost - 35;
  g.startRun(); g.showReport();
  assert.equal(150 - g.state.spentBefore, 35);
  assert.doesNotMatch(element('report').innerHTML, /id="againBtn"/);
  assert.match(element('report').innerHTML, /cheapest send costs 45/);
});

test('an over-budget retry allows successive cost reductions but blocks increases', () => {
  const { context: g } = game();
  g.selectLevel(2, false);
  g.state.spentBefore = 85;
  assert.equal(g.budgetMath().attemptCost, 48);
  assert.equal(g.budgetChangeBlocked({ invite: g.INVITES[0] }), false);
  assert.equal(g.budgetChangeBlocked({ reminders: 0 }), false);
  assert.equal(g.budgetChangeBlocked({ reminders: 2 }), true);
  g.state.invite = g.INVITES[0]; g.state.reminders = 0;
  assert.equal(g.budgetMath().total, 115);
});

test('modal close restores focus and releases the background', () => {
  const { context: g, element } = game();
  element('guideBtn').focus();
  g.openGuide();
  assert.equal(element('topbar').inert, true);
  assert.equal(element('cabinet').inert, true);
  assert.equal(g.document.activeElement, element('guideClose'));
  g.closeGuide();
  assert.equal(g.document.activeElement, element('guideBtn'));
  assert.equal(element('topbar').inert, false);
  assert.equal(element('cabinet').inert, false);
  element('brdBtn').focus();
  g.openBRD(); g.closeBRD();
  assert.equal(g.document.activeElement, element('brdBtn'));
});

test('fishbowl help document sits alongside MPOR and BRD with both entry points', () => {
  const html = readFileSync(join(root, 'site', 'index.html'), 'utf8');
  assert.match(html, /id="fishBtn"[^>]*>\? FISHBOWL<\/button>/);
  assert.match(html, /id="fishFlowBtn"[^>]*>\? HOW THE LIST FLOWS \(FISHBOWL\)<\/button>/);
  assert.match(html, /id="fishbowl" role="dialog" aria-modal="true" aria-label="Fishbowl: how a survey list is built"/);
  const overlay = html.slice(html.indexOf('id="fishbowl"'), html.indexOf('id="fishClose"'));
  const sections = ['SOURCES', 'BRONZE', 'SILVER', 'GOLD · CONTACT MASTER', 'SAMPLING', 'PERMISSION', 'THE SEND', 'RESPONSES AND DISPOSITION'];
  let last = -1;
  for (const section of sections) {
    const at = overlay.indexOf(`<h3>${section}</h3>`);
    assert.ok(at > last, `fishbowl section ${section} present in pipeline order`);
    last = at;
  }
  assert.match(overlay, /72 hours/);
  assert.match(overlay, /not stored/);
  assert.match(overlay, /larger set of addresses/i);
  assert.match(overlay, /one record per email address/);
  assert.match(overlay, /refreshed daily/);
});

test('fishbowl modal restores focus to either opener and releases the background', () => {
  const { context: g, element } = game();
  element('fishBtn').focus();
  g.openFishbowl();
  assert.equal(element('fishbowl').classList.contains('open'), true);
  assert.equal(element('topbar').inert, true);
  assert.equal(element('cabinet').inert, true);
  assert.equal(g.document.activeElement, element('fishClose'));
  g.closeFishbowl();
  assert.equal(element('fishbowl').classList.contains('open'), false);
  assert.equal(g.document.activeElement, element('fishBtn'));
  assert.equal(element('topbar').inert, false);
  assert.equal(element('cabinet').inert, false);
  element('fishFlowBtn').focus();
  g.openFishbowl();
  assert.equal(g.document.activeElement, element('fishClose'));
  g.closeFishbowl();
  assert.equal(g.document.activeElement, element('fishFlowBtn'));
});

test('difficulty labels describe all six studies consistently', () => {
  const { context: g, element } = game();
  assert.deepEqual(Array.from(g.LEVELS, level => level.difficulty),
    ['EASY', 'EASY', 'MEDIUM', 'HARD', 'MEDIUM', 'HARD']);
  for (let level = 1; level <= 6; level++) {
    g.selectLevel(level, false);
    g.openBRD();
    const difficulty = g.curLevel().difficulty;
    assert.match(element('hudLevel').innerHTML, new RegExp(difficulty));
    assert.match(element('brdContent').innerHTML, new RegExp(difficulty));
    assert.match(element('levelGrid').innerHTML, new RegExp(`LEVEL ${level} · ${difficulty}`));
    g.closeBRD();
    g.showCampaign();
    assert.match(element('campaignScreen').innerHTML, new RegExp(`Level ${level} · ${difficulty}`));
  }
});

test('HUD shows the actual finale gate and resets for Quick Challenge', () => {
  const { context: g, element } = game();
  g.selectLevel(6, false);
  assert.match(element('hudGates').innerHTML, /70\+/);
  g.startQuickChallenge(0);
  assert.match(element('hudGates').innerHTML, /60\+/);
  assert.doesNotMatch(element('hudGates').innerHTML, /70\+/);
});

test('player terminology distinguishes game indices and item nonresponse', () => {
  const html = readFileSync(join(root, 'site', 'index.html'), 'utf8');
  assert.match(html, /AAPOR/);
  assert.match(html, /item nonresponse/i);
  assert.match(html, /game indices/i);
  assert.doesNotMatch(html, /ONE TRUE FIX|clean data|near-identical|scored kindly/i);
  const { context: g } = game();
  assert.equal(g.LEVELS[4].name, 'GLOBAL FIELDWORK');
  assert.match(g.QUESTIONS.find(q => q.id === 6).text, /renew/i);
  assert.match(g.QUESTIONS.find(q => q.id === 9).text, /help article/i);
  assert.equal(g.QUESTION_BANK.find(q => q.id === 65).text, g.QUESTIONS.find(q => q.id === 9).text);
  for (const id of [13, 43]) assert.match(g.OPTIONAL_QUESTIONS.concat(g.QUESTION_BANK).find(q => q.id === id).text, /renew/i);
});

test('stakeholder controls permit cost reductions even before the retry fits', () => {
  const { context: g, element } = game();
  g.selectLevel(6, false);
  g.state.spentBefore = 100;
  g.state.stakeholder = 'accept';
  g.renderStakeholder();
  assert.doesNotMatch(element('stakeholderPanel').innerHTML, /data-stake="pushback"[^>]*disabled/);
  assert.equal(g.chooseStakeholder('pushback'), true);
});

test('budget warnings refresh when another control frees credits', () => {
  const { context: g, element } = game();
  assert.equal(typeof g.updateAffordability, 'function');
  g.selectLevel(2, false);
  g.state.invite = g.INVITES[0]; g.state.reminders = 0;
  const card = element('honest-card'), warning = element('warning');
  card.setAttribute('data-inv', 'honest');
  card.querySelector = () => warning;
  g.document.querySelectorAll = selector => selector === '[data-inv]' ? [card] : [];
  g.state.spentBefore = 100;
  g.updateAffordability();
  assert.equal(card.disabled, true);
  assert.equal(warning.hidden, false);
  g.state.spentBefore = 80;
  g.updateAffordability();
  assert.equal(card.disabled, false);
  assert.equal(warning.hidden, true);
  assert.equal(card.title, '');
});

test('preparation and audience controls recover affordability without losing ownership locks', () => {
  const { context: g, element } = game();
  g.selectLevel(2, false);
  g.state.spentBefore = 100;
  g.state.invite = g.INVITES[0]; g.state.reminders = 0;
  const validation = element('validation-full'), prep = element('prep-dedupe'), segment = element('seg-fresh');
  validation.setAttribute('data-val', 'full'); prep.setAttribute('data-prep', 'dedupe');
  segment.setAttribute('data-seg', 'fresh');
  g.document.querySelectorAll = selector => ({
    '[data-val]': [validation], '[data-prep]': [prep], '[data-seg]': [segment]
  })[selector] || [];
  g.updateAffordability();
  assert.equal(validation.disabled, true);
  assert.equal(prep.disabled, true);
  g.state.spentBefore = 70;
  g.updateAffordability();
  assert.equal(validation.disabled, false);
  assert.equal(prep.disabled, false);
  g.state.baseline = g.snapshotCurrent(); g.state.baseline.dedupe = true;
  g.state.chainActive = true;
  g.state.seg = g.SEGMENTS.find(seg => seg.id === 'stale');
  g.updateAffordability();
  assert.equal(prep.disabled, true);
  assert.equal(segment.disabled, true);
});

const winningSetups = JSON.parse(readFileSync(join(root, 'scripts', 'fixtures', 'winning-setups.json'), 'utf8'));
/* The evidence-fitness corpus retains all 364 previously sampled instruments.
   Repairs, bank additions, invitation, reminders, and escapes were searched
   again under the five independent checks. Every witness is replayed through
   the card handlers, startRun, and showReport below. Each is an independent
   campaign start; the separate continuous-campaign test checks carryover. */
const LEGAL_WINNER_MINIMUMS = { 1: 65, 2: 65, 3: 65, 4: 39, 5: 65, 6: 65 };
test('goodwill ledger identifies report-back rewards and stakeholder penalties', () => {
  const { context: g, element } = game();
  g.selectLevel(4, false);
  g.state.reportBack = true;
  /* Re-based on the Level 4 fixed instrument in phase 4: the launched
     instrument is its six core questions. The ledger assertions below
     are unchanged. */
  g.activeQuestions().forEach(q => { g.state.qstate[q.id] = [401, 402, 403, 405, 406, 407].includes(q.id) ? 'keep' : 'cut'; });
  g.startRun(); g.showReport();
  let ledger = element('report').innerHTML.match(/GOODWILL LEDGER[\s\S]*?<\/table>/)[0];
  assert.match(ledger, /Report-back restoration[\s\S]*?<td>\+18<\/td>/);
  assert.match(ledger, /Earned back \(Known Name[\s\S]*?<td>\+3<\/td>/);
  g.selectLevel(3, false);
  g.state.stakeholder = 'accept';
  g.startRun(); g.showReport();
  ledger = element('report').innerHTML.match(/GOODWILL LEDGER[\s\S]*?<\/table>/)[0];
  assert.match(ledger, /Stakeholder burden[\s\S]*?<td>−10<\/td>/);
});

for (let level = 1; level <= 6; level++) {
  test(`Level ${level} is winnable from UI-legal recorded setups within the initial budget`, () => {
    const { context: g, element, timers } = game();
    const setups = winningSetups.filter(setup => setup.level === level);
    assert.ok(setups.length >= LEGAL_WINNER_MINIMUMS[level],
      `Level ${level} corpus supplies ${setups.length} legal winners, expected at least ${LEGAL_WINNER_MINIMUMS[level]}`);
    assert.equal(new Set(setups.map(setup => setup.seed)).size, setups.length);
    assert.ok(setups.some(setup => setup.seed === 'fixed'));
    for (const setup of setups) {
      timers.length = 0;
      const label = `Level ${level}, instrument ${setup.seed}`;
      g.state.audiencePortfolio = {};
      g.state.campaignWon = {};
      g.state.randomMode = false;
      g.state.levelSeeds = setup.seed === 'fixed' ? {} : { [level]: setup.seed };
      g.selectLevel(level, false);
      assert.equal(g.state.spentBefore, 0, label);
      assert.equal(g.state.attempt, 1, label);
      g.state.validation = 'full'; g.state.dedupe = true; g.state.suppression = true;
      g.state.consolidate = setup.consolidate === true; g.state.repair = setup.repair === true;
      g.state.stakeholder = level === 3 || level === 6 ? 'pushback' : null;
      g.state.reportBack = level === 4;
      g.state.localization = level === 5;
      g.state.langChoice = level === 5 ? 'localized' : 'en';
      g.state.abEnabled = level === 2;
      g.state.invite = g.INVITES.find(invite => invite.id === setup.invite);
      g.state.abInvite = g.INVITES.find(invite => invite.id !== setup.invite).id;
      g.state.reminders = setup.reminders; g.state.escapes = setup.escapes;
      assert.ok(setup.kept.length + setup.added.length >= 1, label);
      assert.ok(setup.repaired.every(id => setup.kept.includes(id) || setup.added.includes(id)), label);
      for (const q of g.addBankQuestions()) {
        g.state.added[q.id] = setup.added.includes(q.id);
      }
      /* Apply the setup through the game's own card handlers: repairs
         via the fix button, cuts via clickCut (which routes through
         applyCut). No direct qstate writes in this test. */
      for (const q of g.activeQuestions().concat(g.addBankQuestions().filter(q => g.state.added[q.id]))) {
        if (setup.repaired.includes(q.id)) clickSimplify(g, q.id);
      }
      for (const q of g.activeQuestions()) {
        if (!setup.kept.includes(q.id)) clickCut(g, q.id);
      }
      assert.deepEqual(Array.from(g.activeQuestions().filter(q => g.state.qstate[q.id] !== 'cut'), q => q.id).sort((a, b) => a - b),
        [...setup.kept].sort((a, b) => a - b), label);
      assert.ok(g.keptQuestions().length >= g.instrumentFloor(), label);
      assert.ok(setup.kept.every(id => g.activeQuestions().some(q => q.id === id)), label);
      assert.ok(setup.added.every(id => g.addBankQuestions().some(q => q.id === id)), label);
      assert.equal(g.budgetMath().total, setup.cost, label);
      assert.ok(g.budgetMath().total <= g.BUDGET_TOTAL, label);
      g.startRun(); g.showReport();
      assert.equal(g.state.campaignWon[level], true, label);
      assert.equal(g.state.lastRound.evidence.won, true, label);
      assert.ok(g.state.lastRound.evidence.checks.every(check => check.met), label);
      assert.equal(g.state.lastRound.rate, setup.rate, label);
      assert.equal(g.tally(g.runData).sent, setup.sent, label);
      assert.equal(g.tally(g.runData).completed, setup.completed, label);
      assert.equal(g.state.lastRound.quality, setup.quality, label);
      assert.equal(g.state.lastRound.insight, setup.insight, label);
      assert.equal(g.state.lastRound.evidence.usableN, setup.usableN, label);
      assert.equal(g.state.goodwillCarry, setup.goodwill, label);
      assert.ok(g.state.lastRound.quality >= 60, label);
      assert.ok(g.state.lastRound.insight >= g.insightGate(), label);
      if (level === 4) assert.ok(g.state.goodwillCarry >= 35, label);
      assert.match(element('report').innerHTML, /ROUND WON/, label);
      assert.match(element('report').innerHTML, /id="nextLevelBtn"/, label);
    }
  });
}

function evidenceScenario(level = 1) {
  const instance = game();
  const g = instance.context;
  const setup = winningSetups.find(candidate => candidate.level === level && candidate.seed === 'fixed');
  g.selectLevel(level, false);
  Object.assign(g.state, {
    validation: 'full', dedupe: true, suppression: true, reportBack: level === 4,
    localization: level === 5, langChoice: level === 5 ? 'localized' : 'en'
  });
  for (const q of g.addBankQuestions()) g.state.added[q.id] = setup.added.includes(q.id);
  for (const q of g.activeQuestions().concat(g.addBankQuestions().filter(q => setup.added.includes(q.id)))) {
    g.state.qstate[q.id] = setup.repaired.includes(q.id) ? 'simplify' :
      setup.kept.includes(q.id) || setup.added.includes(q.id) ? 'keep' : 'cut';
  }
  return instance;
}

function evidenceRun(g, personas, flags = {}) {
  const block = g.state.seg.n / 40;
  const respondents = Array.from({ length: g.state.seg.n }, (_, i) => {
    const template = Math.floor(i / block);
    const finished = template < personas.length;
    const spawnAt = 400 + i / g.state.seg.n * 13000;
    const person = {
      i, persona: personas[template] || 'end', lang: 'en', abGroup: i % 2 ? 'B' : 'A', spawnAt,
      fate: finished ? 'finish' : 'noopen', accountId: `SIM-ACCOUNT-${i}`, ...flags[template]
    };
    person.events = [{ type: 'gate', gate: 'delivered', t: spawnAt + 650 }];
    if (finished) {
      person.events.push({ type: 'gate', gate: 'opened', t: spawnAt + 1000 },
        { type: 'gate', gate: 'started', t: spawnAt + 2000 }, { type: 'finish', t: spawnAt + 5000 });
      if (person.guessed) person.events.push({ type: 'guess', qid: g.keptQuestions()[0].id, t: spawnAt + 3000 });
    } else person.events.push({ type: 'drop', cause: 'noopen', t: spawnAt + 1100 });
    return person;
  });
  return {
    respondents, sprites: [], kept: g.keptQuestions(), gm: { ending: 72, trips: false }
  };
}

test('missing BRD coverage penalizes quality and Insight after a permitted cut', () => {
  const { context: complete } = evidenceScenario();
  complete.runData = evidenceRun(complete, ['tech', 'end', 'itdm']);
  complete.showReport();
  const { context: cut } = evidenceScenario();
  const required = cut.keptQuestions().filter(q => q.topic === 'renewal risk');
  assert.ok(required.length > 0);
  for (const q of required) clickCut(cut, q.id);
  assert.ok(required.every(q => cut.state.qstate[q.id] === 'cut'));
  cut.runData = evidenceRun(cut, ['tech', 'end', 'itdm']);
  cut.showReport();
  assert.equal(complete.state.lastRound.quality, 100);
  assert.equal(cut.state.lastRound.quality, 90);
  assert.ok(cut.state.lastRound.insight < complete.state.lastRound.insight);
  assert.equal(cut.state.lastRound.evidence.insight.topics.find(topic => topic.topic === 'renewal risk').status, 'LOST');
});

test('campaign can win below the response benchmark with sufficient usable evidence', () => {
  const { context: g, element } = evidenceScenario();
  const run = evidenceRun(g, ['tech', 'end', 'itdm']);
  const counts = g.tally(run);
  assert.ok(counts.completed / counts.sent < g.curLevel().target);
  const evidence = g.evaluateEvidence(run, counts, 100);
  assert.equal(evidence.usableN, 750);
  assert.equal(evidence.won, true);
  g.runData = run;
  g.showReport();
  assert.match(element('report').innerHTML, /ROUND WON/);
  assert.match(element('report').innerHTML, /READY WITH LIMITS/);
  assert.equal(g.state.lastRound.evidence.won, true);
});

test('high response from the wrong population cannot pass evidence fitness', () => {
  const { context: g, element } = evidenceScenario();
  const run = evidenceRun(g, Array(12).fill('tech'));
  const counts = g.tally(run);
  assert.ok(counts.completed / counts.sent > g.curLevel().target);
  const evidence = g.evaluateEvidence(run, counts, 100);
  assert.equal(evidence.checks.find(check => check.id === 'fitness').met, false);
  assert.equal(evidence.roles.find(role => role.label === 'End users').met, false);
  assert.equal(evidence.won, false);
  g.runData = run; g.showReport();
  assert.match(element('report').innerHTML, /WITHHOLD/);
  assert.equal(g.state.campaignWon[1], undefined);
});

test('sample, quality, retention, and matching thresholds are inclusive and independent', () => {
  const { context: g } = evidenceScenario();
  let run = evidenceRun(g, ['tech', 'end', 'itdm']);
  let evidence = g.evaluateEvidence(run, g.tally(run), 60);
  assert.equal(evidence.won, true, '750 at the minimum with quality 60 passes');
  assert.equal(g.evaluateEvidence(run, g.tally(run), 59).won, false);
  run = evidenceRun(g, ['tech', 'end']);
  assert.equal(g.evaluateEvidence(run, g.tally(run), 100).checks.find(check => check.id === 'fitness').met, false);
  run = evidenceRun(g, ['tech', 'end', 'itdm', 'tech', 'end'], {
    3: { qSpeed: true }, 4: { qStraight: true }
  });
  evidence = g.evaluateEvidence(run, g.tally(run), 100);
  assert.equal(evidence.retained, 0.6);
  assert.equal(evidence.won, true);
  run.respondents[2].qDup = true;
  assert.equal(g.evaluateEvidence(run, g.tally(run), 100).checks.find(check => check.id === 'integrity').met, false);
  run = evidenceRun(g, ['tech', 'end', 'itdm', 'tech', 'end'], { 4: { accountId: null } });
  evidence = g.evaluateEvidence(run, g.tally(run), 100);
  assert.equal(evidence.associated, 0.8);
  assert.equal(evidence.won, true);
  run.respondents[3].accountId = null;
  assert.equal(g.evaluateEvidence(run, g.tally(run), 100).checks.find(check => check.id === 'fitness').met, false);
});

test('cleaning removes overlapping flags once and never gives rejected roles Insight credit', () => {
  const { context: g } = evidenceScenario();
  const run = evidenceRun(g, ['tech', 'end', 'itdm', 'tech', 'end', 'tech', 'end'], {
    2: { qSpeed: true, qStraight: true, qDup: true, qJunk: true, guessed: true },
    3: { qSpeed: true }, 4: { qStraight: true }, 5: { qJunk: true }, 6: { guessed: true }
  });
  const counts = g.tally(run);
  const evidence = g.evaluateEvidence(run, counts, 100);
  assert.equal(evidence.cleaned, 500);
  assert.equal(Object.values(evidence.removed).reduce((sum, n) => sum + n, 0), 1250);
  assert.ok(evidence.insight.score < g.computeInsight(counts, run).score);
  assert.ok(evidence.insight.topics.some(topic => /Missing persona/.test(topic.reason)));
  assert.equal(JSON.stringify(g.evaluateEvidence(run, counts, 100)), JSON.stringify(evidence));
});

test('no responses, unmatched responses, and breaker interruption cannot yield publishable evidence', () => {
  const { context: g } = evidenceScenario();
  for (const run of [
    evidenceRun(g, []),
    evidenceRun(g, ['tech', 'end', 'itdm'], { 0: { accountId: null }, 1: { accountId: null }, 2: { accountId: null } }),
    { ...evidenceRun(g, ['tech', 'end', 'itdm']), gm: { ending: 0, trips: true } }
  ]) {
    const evidence = g.evaluateEvidence(run, g.tally(run), 100);
    assert.equal(evidence.won, false);
    assert.ok(evidence.checks.every(check => !/NaN|Infinity/.test(check.detail)));
  }
});

test('operational trust enforces existing preparation and Global language checks', () => {
  const { context: g } = evidenceScenario();
  const run = evidenceRun(g, ['tech', 'end', 'itdm']);
  for (const change of [{ validation: 'skip' }, { dedupe: false }]) {
    Object.assign(g.state, { validation: 'full', dedupe: true }, change);
    assert.equal(g.evaluateEvidence(run, g.tally(run), 100).checks.find(check => check.id === 'trust').met, false);
  }
  const global = evidenceScenario(5).context;
  const globalRun = evidenceRun(global, ['tech', 'end', 'itdm']);
  assert.equal(global.evaluateEvidence(globalRun, global.tally(globalRun), 100).won, true);
  global.state.langChoice = 'en';
  assert.equal(global.evaluateEvidence(globalRun, global.tally(globalRun), 100).checks.find(check => check.id === 'trust').met, false);
  global.state.langChoice = 'localized'; global.state.localization = false;
  assert.equal(global.evaluateEvidence(globalRun, global.tally(globalRun), 100).won, false);
});

test('finale requires decision-maker evidence rather than a high response from implementers', () => {
  const { context: g } = evidenceScenario(6);
  let run = evidenceRun(g, ['exec', 'itdm', 'itdm', 'admin', 'end']);
  assert.equal(g.evaluateEvidence(run, g.tally(run), 100).won, true);
  run = evidenceRun(g, ['tech', 'tech', 'tech', 'admin', 'end']);
  assert.equal(g.evaluateEvidence(run, g.tally(run), 100).checks.find(check => check.id === 'fitness').met, false);
});

test('role shares and the tired-audience goodwill gate enforce their exact boundaries', () => {
  const { context: g } = evidenceScenario();
  let run = evidenceRun(g, ['tech', 'end', ...Array(8).fill('itdm')]);
  assert.equal(g.evaluateEvidence(run, g.tally(run), 100).won, true, 'each required role is exactly 10%');
  run = evidenceRun(g, ['tech', 'end', ...Array(9).fill('itdm')]);
  assert.equal(g.evaluateEvidence(run, g.tally(run), 100).won, false, 'one in eleven is below 10%');
  const finale = evidenceScenario(6).context;
  run = evidenceRun(finale, ['exec', 'itdm', 'admin', 'end']);
  assert.equal(finale.evaluateEvidence(run, finale.tally(run), 100).won, true, 'decision makers are exactly 50%');
  run = evidenceRun(finale, ['exec', 'admin', 'end', 'tech']);
  assert.equal(finale.evaluateEvidence(run, finale.tally(run), 100).won, false);
  const tired = evidenceScenario(4).context;
  run = evidenceRun(tired, ['tech', 'end', 'itdm']);
  run.gm.ending = 35;
  assert.equal(tired.evaluateEvidence(run, tired.tally(run), 100).won, true);
  run.gm.ending = 34;
  assert.equal(tired.evaluateEvidence(run, tired.tally(run), 100).checks.find(check => check.id === 'audience').met, false);
});

test('a healthy local segment cannot stand in for the required Global audience', () => {
  const { context: g } = evidenceScenario(5);
  g.state.seg = g.SEGMENTS.find(segment => segment.id === 'fresh');
  const run = evidenceRun(g, ['tech', 'end', 'itdm', 'tech', 'end', 'itdm']);
  const evidence = g.evaluateEvidence(run, g.tally(run), 100);
  assert.ok(evidence.usableN >= evidence.mission.minimumN);
  assert.equal(evidence.checks.find(check => check.id === 'fitness').met, false);
  assert.equal(evidence.won, false);
});

test('campaign audience health survives level and instrument changes but not a full campaign reset', () => {
  const { context: g, element } = evidenceScenario();
  const run = evidenceRun(g, ['tech', 'end', 'itdm']);
  run.gm.ending = 50;
  g.runData = run; g.showReport();
  const saved = JSON.stringify(g.state.audiencePortfolio);
  g.showReport();
  assert.equal(JSON.stringify(g.state.audiencePortfolio), saved, 'opening a report twice does not charge the audience twice');
  assert.equal(g.state.audiencePortfolio.support.contacts, 1);
  g.selectLevel(2, false);
  assert.equal(g.goodwillStart().carry, 50);
  assert.ok(g.goodwillStart().fatigue > 0);
  g.renderSegments();
  assert.match(element('segGrid').innerHTML, /48 \/ 100/);
  g.newGameSameLevel();
  assert.equal(JSON.stringify(g.state.audiencePortfolio), saved);
  assert.equal(g.goodwillStart().carry, 50);
  const repeat = evidenceRun(g, ['tech', 'end', 'itdm', 'tech']);
  g.state.suppression = false;
  assert.equal(g.evaluateEvidence(repeat, g.tally(repeat), 100).checks.find(check => check.id === 'audience').met, false);
  const withoutSuppression = g.goodwillStart().fatigue;
  g.state.suppression = true;
  assert.ok(g.goodwillStart().fatigue < withoutSuppression);
  g.startQuickChallenge(0, 'V000');
  assert.equal(g.audienceHistory(), null);
  g.startRun(); g.showReport(); g.leaveQuickChallenge();
  assert.equal(JSON.stringify(g.state.audiencePortfolio), saved);
  g.resetCampaignNewGame();
  assert.equal(JSON.stringify(g.state.audiencePortfolio), '{}');
});

test('a continuous six-level campaign remains winnable with audience carryover', () => {
  const { context: g, element } = game();
  for (let level = 1; level <= 6; level++) {
    const setup = winningSetups.find(candidate => candidate.level === level && candidate.seed === 'fixed');
    g.selectLevel(level, true);
    Object.assign(g.state, {
      validation: 'full', dedupe: true, suppression: true, abEnabled: level === 2,
      consolidate: setup.consolidate === true, repair: setup.repair === true,
      stakeholder: level === 3 || level === 6 ? 'pushback' : null,
      reportBack: level === 4, localization: level === 5,
      langChoice: level === 5 ? 'localized' : 'en', reminders: setup.reminders, escapes: setup.escapes
    });
    g.state.invite = g.INVITES.find(invite => invite.id === setup.invite);
    g.state.abInvite = g.INVITES.find(invite => invite.id !== setup.invite).id;
    for (const q of g.addBankQuestions()) g.state.added[q.id] = setup.added.includes(q.id);
    for (const q of g.activeQuestions().concat(g.addBankQuestions().filter(q => g.state.added[q.id]))) {
      if (setup.repaired.includes(q.id)) clickSimplify(g, q.id);
    }
    for (const q of g.activeQuestions()) {
      if (!setup.kept.includes(q.id)) clickCut(g, q.id);
    }
    assert.ok(g.budgetMath().total <= g.BUDGET_TOTAL);
    g.startRun(); g.showReport();
    assert.equal(g.state.lastRound.evidence.won, true,
      `Level ${level}: ${JSON.stringify(g.state.lastRound.evidence.checks.filter(check => !check.met))}`);
    assert.match(element('report').innerHTML, /ROUND WON/);
  }
  assert.equal(g.state.audiencePortfolio.support.contacts, 4);
  assert.equal(g.state.audiencePortfolio.support.instruments.length, 4);
  assert.equal(g.state.audiencePortfolio.global.contacts, 1);
  assert.equal(g.state.audiencePortfolio.leadership.contacts, 1);
  g.showCampaign();
  assert.match(element('campaignScreen').innerHTML, /Levels won: 6 \/ 6/);
});

test('bounce-backs reconcile with the funnel totals for skip, full, and partial validation', () => {
  const configs = [
    { segId: 'stale', validation: 'skip' },
    { segId: 'fresh', validation: 'full' },
    { segId: 'blast', validation: 'partial' }
  ];
  for (const cfg of configs) {
    const { context: g, element } = game();
    const label = `${cfg.segId}+${cfg.validation}`;
    g.selectLevel(1, false);
    g.state.seg = g.SEGMENTS.find(s => s.id === cfg.segId);
    g.state.validation = cfg.validation;
    g.startRun(); g.showReport();
    const c = g.tally(g.runData);
    const bb = g.runData.bounceBacks;
    assert.ok(bb, `${label}: the record is stored on the run`);
    assert.equal(bb.total, c.bouncedHard + c.bouncedSoft, label);
    assert.equal(bb.hard, c.bouncedHard, label);
    assert.equal(bb.hard + bb.soft, bb.total, `${label}: the split sums to the total`);
    assert.equal(bb.causes.catchall + bb.causes.never + bb.causes.partial, bb.total, `${label}: causes sum to the total`);
    assert.equal(bb.sample.length + bb.more, bb.total, `${label}: sample plus remainder is exact`);
    assert.ok(bb.sample.length <= 8, label);
    assert.match(element('report').innerHTML, /BOUNCE-BACKS/, label);
  }
});

test('bounce-back sample is capped at eight with an exact remainder (Executive Blast, validation skipped)', () => {
  const { context: g, element } = game();
  g.selectLevel(1, false);
  g.state.seg = g.SEGMENTS.find(s => s.id === 'blast');
  g.state.validation = 'skip';
  g.startRun(); g.showReport();
  const bb = g.runData.bounceBacks;
  assert.ok(bb.total > 8, 'the Blast list with no validation bounces far more than the sample cap');
  assert.equal(bb.sample.length, 8);
  assert.equal(bb.more, bb.total - 8);
  assert.ok(element('report').innerHTML.includes(`+ ${g.fmt(bb.more)} more bounced addresses not shown`));
  assert.ok(bb.sample.every(e => e.cause === 'never'));
  assert.ok(bb.sample.every(e => /\.example$/.test(e.address)), 'every sampled address is a fictional .example address');
  assert.equal(new Set(bb.sample.map(e => e.address)).size, 8, 'sample addresses are distinct');
});

test('bounce-back causes follow the validation story: full is all catch-all, partial splits by the survivor model', () => {
  /* Full validation on the Blast list, escapes on: a configuration whose
     realized survivors are nonzero, and every one must be a catch-all pass,
     because the game's model says full validation removes everything else. */
  const fullRun = game();
  const gf = fullRun.context;
  gf.selectLevel(1, false);
  gf.state.seg = gf.SEGMENTS.find(s => s.id === 'blast');
  gf.state.validation = 'full'; gf.state.escapes = true;
  gf.startRun(); gf.showReport();
  const bbF = gf.runData.bounceBacks;
  assert.ok(bbF.total > 0, 'this configuration leaves catch-all survivors to list');
  assert.equal(bbF.causes.catchall, bbF.total);
  assert.equal(bbF.causes.never + bbF.causes.partial, 0);
  assert.ok(bbF.sample.every(e => e.cause === 'catchall'));

  /* Partial survivors are 45% of the raw invalid rate; the catch-all floor
     is 15 points of that (1/3), the unchecked remainder is 2/3. */
  const partRun = game();
  const gp = partRun.context;
  gp.selectLevel(1, false);
  gp.state.seg = gp.SEGMENTS.find(s => s.id === 'blast');
  gp.state.validation = 'partial';
  gp.startRun(); gp.showReport();
  const bbP = gp.runData.bounceBacks;
  assert.ok(bbP.total > 0);
  assert.equal(bbP.causes.catchall, Math.round(bbP.total / 3));
  assert.equal(bbP.causes.partial, bbP.total - bbP.causes.catchall);
  assert.equal(bbP.causes.never, 0);
  assert.ok(bbP.sample.every(e => e.cause === 'catchall' || e.cause === 'partial'));
  const sampleCatch = bbP.sample.filter(e => e.cause === 'catchall').length;
  assert.ok(sampleCatch > 0 && sampleCatch < bbP.sample.length, 'the sample shows both partial causes');
});

test('bounce-back sample is deterministic for the same run configuration', () => {
  function blastPartial() {
    const { context: g } = game();
    g.selectLevel(1, false);
    g.state.seg = g.SEGMENTS.find(s => s.id === 'blast');
    g.state.validation = 'partial';
    g.startRun(); g.showReport();
    return g.runData.bounceBacks;
  }
  const a = blastPartial(), b = blastPartial();
  assert.equal(JSON.stringify(b.sample), JSON.stringify(a.sample));
  assert.equal(b.total, a.total);
  assert.equal(b.hard, a.hard);
  assert.equal(b.soft, a.soft);
});

test('a run with no bounces renders the clean bounce-backs state', () => {
  const { context: g, element } = game();
  g.selectLevel(1, false);
  g.state.seg = { ...g.SEGMENTS.find(s => s.id === 'fresh'), n: 1, invalidPct: 0, intake: { dupSys: 0, dupSecond: 0, brokenFix: 0, brokenDead: 0, stale: 0 } };
  g.state.validation = 'full';
  g.startRun(); g.showReport();
  assert.equal(g.tally(g.runData).sent, 1);
  assert.equal(g.runData.bounceBacks.total, 0);
  assert.equal(g.runData.bounceBacks.sample.length, 0);
  assert.match(element('report').innerHTML, /<b>No bounce-backs\.<\/b> Every address accepted the mail this round\./);
});

test('fallout piles reconcile with the tally: bounced total and delivered minus opened', () => {
  const configs = [
    { segId: 'blast', validation: 'skip', reminders: 2 },
    { segId: 'fresh', validation: 'full', reminders: 1 },
    { segId: 'stale', validation: 'partial', reminders: 0 }
  ];
  for (const cfg of configs) {
    const { context: g } = game();
    const label = `${cfg.segId}+${cfg.validation}+rem${cfg.reminders}`;
    g.selectLevel(1, false);
    g.state.seg = g.SEGMENTS.find(s => s.id === cfg.segId);
    g.state.validation = cfg.validation;
    g.state.reminders = cfg.reminders;
    g.startRun();
    assert.equal(typeof g.pileModel, 'function', label);
    const pm = g.pileModel(g.runData);
    const c = g.tally(g.runData);
    /* The piles are the tally's own numbers, not a second simulation:
       the bounce pile is hard + soft, the unopened pile is what was
       delivered and never opened. */
    assert.equal(pm.bounced, c.bouncedHard + c.bouncedSoft, label);
    assert.equal(pm.unopened, c.delivered - c.opened, label);
    assert.equal(pm.waves.length, cfg.reminders, `${label}: one wave entry per bought reminder`);
  }
});

test('reminder wave beats land on the first recovered open of each wave', () => {
  const { context: g } = game();
  g.selectLevel(1, false);
  g.state.seg = g.SEGMENTS.find(s => s.id === 'blast');
  g.state.validation = 'skip';
  g.state.reminders = 2;
  g.state.invite = g.INVITES.find(i => i.id === 'generic');
  g.startRun();
  const pm = g.pileModel(g.runData);
  assert.equal(pm.waves.length, 2);
  for (const w of pm.waves) {
    /* Recount individual records, not representative groups. */
    const opens = [];
    g.runData.respondents.forEach(sp => {
      if (sp.via !== 'r' + w.wave) return;
      sp.events.forEach(e => { if (e.type === 'gate' && e.gate === 'opened') opens.push(e.t); });
    });
    assert.equal(w.recovered, opens.length, `wave ${w.wave} recovered count`);
    assert.equal(w.at, opens.length ? Math.min.apply(null, opens) : null, `wave ${w.wave} beat time`);
  }
  /* This pinned configuration recovers opens through both waves, so
     both beats exist and fire in order. */
  assert.ok(pm.waves[0].recovered > 0 && pm.waves[1].recovered > 0);
  assert.ok(pm.waves[0].at < pm.waves[1].at, 'wave 1 lands before wave 2');
});

test('reminder presentation cannot mutate full-population statistics', () => {
  const pinned = [
    {
      name: 'blast/skip/rem2/generic',
      setup(g) {
        g.state.seg = g.SEGMENTS.find(s => s.id === 'blast');
        g.state.validation = 'skip'; g.state.reminders = 2;
        g.state.invite = g.INVITES.find(i => i.id === 'generic');
      }
    },
    {
      name: 'stale/partial/rem2/escapes',
      setup(g) {
        g.state.seg = g.SEGMENTS.find(s => s.id === 'stale');
        g.state.validation = 'partial'; g.state.reminders = 2; g.state.escapes = true;
      }
    },
    {
      name: 'fresh/full/rem1/default-invite',
      setup(g) { g.state.validation = 'full'; g.state.reminders = 1; }
    }
  ];
  for (const pin of pinned) {
    const { context: g } = game();
    g.selectLevel(1, false);
    pin.setup(g);
    g.startRun();
    const before = JSON.stringify(g.tally(g.runData));
    g.pileModel(g.runData);
    g.setupStage(g.runData);
    g.renderPopulationProgress(g.runData, Infinity);
    assert.equal(JSON.stringify(g.tally(g.runData)), before, pin.name);
  }
});

test('invite stage names the reminder as an email to non-openers, and the run screen carries both piles', () => {
  const html = readFileSync(join(root, 'site', 'index.html'), 'utf8');
  assert.match(html, /Reminder emails:/);
  assert.match(html, /waves go only to non-openers/);
  assert.match(html, /8 cr and −5 goodwill per wave/);
  assert.match(html, /data-rem="2">2<small>−10 GW · 16 CR<\/small>/);
  assert.match(html, /id="bouncePile"/);
  assert.match(html, /id="unopenedPile"/);
  assert.match(html, /BOUNCED · <b id="bounceCount">/);
  assert.match(html, /UNOPENED · <b id="unopenedCount">/);
});

test('fallout piles sit in a bottom strip whose columns align with the five gates', () => {
  const html = readFileSync(join(root, 'site', 'index.html'), 'utf8');
  assert.match(html, /id="pileStrip"/);
  for (const gate of ['invited', 'delivered', 'opened', 'started', 'finish'])
    assert.match(html, new RegExp(`data-gate="${gate}"`), `strip has a ${gate} column`);
  const deliveredCol = html.indexOf('data-gate="delivered"');
  const openedCol = html.indexOf('data-gate="opened"');
  const startedCol = html.indexOf('data-gate="started"');
  const bouncePile = html.indexOf('id="bouncePile"');
  const unopenedPile = html.indexOf('id="unopenedPile"');
  assert.ok(deliveredCol < bouncePile && bouncePile < openedCol,
    'the bounce pile lives inside the delivered column');
  assert.ok(openedCol < unopenedPile && unopenedPile < startedCol,
    'the unopened pile lives inside the opened column');
  /* the strip is a band under the track, not an overlay inside it:
     in source order it follows the track element entirely */
  assert.ok(html.indexOf('id="pileStrip"') > html.indexOf('id="track"'),
    'the pile strip renders after the track');
  /* column positions come from the same GATE_X table as the gate
     labels across the top, set in setupStage */
  assert.match(html, /GATE_X\[col\.getAttribute\("data-gate"\)\]/);
});

test('bounced sprites settle into the strip pile and stay; only never-opened sprites fade', () => {
  const html = readFileSync(join(root, 'site', 'index.html'), 'utf8');
  /* The settled state must not hide the figure: the base .piling
     travel rule carries no fade, and opacity:0 survives only on the
     never-opened route's pilefade modifier. This is the regression
     test for the live-play report "bounce backs are not piling up:
     I see the bounce back animation, it should pile up" — the old
     rule faded every routed sprite to opacity 0, so the pile never
     accumulated anything but the envelope glyphs. */
  const pilingRule = html.match(/\.sprite\.piling\{[^}]*\}/)[0];
  assert.ok(!/opacity\s*:\s*0/.test(pilingRule),
    'the piling travel rule must not fade the sprite out');
  assert.match(html, /\.sprite\.piling\.pilefade\{[^}]*opacity\s*:\s*0/,
    'the fade is scoped to the never-opened pilefade modifier');

  const { context: g, element, timers } = game();
  element('track').getBoundingClientRect = () => ({ left: 0, top: 0, width: 1100, height: 300, bottom: 300, right: 1100 });
  element('bounceStack').getBoundingClientRect = () => ({ left: 200, top: 560, width: 76, height: 32, bottom: 592, right: 276 });
  element('unopenedStack').getBoundingClientRect = () => ({ left: 420, top: 560, width: 76, height: 32, bottom: 592, right: 496 });
  function fakeSprite() {
    const el = {
      style: {}, removed: false, classes: new Set(),
      classList: {
        add(...names) { names.forEach(n => el.classes.add(n)); },
        contains(name) { return el.classes.has(name); }
      },
      remove() { el.removed = true; }
    };
    return { el };
  }
  /* Thirteen bounces: the twelve fan slots fill with settled figures,
     the thirteenth lands on slot 0 again and buries its first
     occupant — the visible pile caps at the fan size while the label
     count (pileLive, untouched here) keeps the exact total. */
  const settled = [];
  const timersBefore = timers.length;
  for (let i = 1; i <= 13; i++) {
    g.pileLive.bounced = i;
    const sp = fakeSprite();
    g.routeSpriteToPile(sp, 'bounce');
    assert.ok(sp.el.classes.has('piling'), `bounce ${i} travels to the pile`);
    assert.ok(sp.el.classes.has('piled'), `bounce ${i} settles persistently`);
    assert.ok(!sp.el.classes.has('pilefade'), `bounce ${i} must not fade`);
    assert.ok(!sp.el.removed, `bounce ${i} figure stays in the strip`);
    assert.ok(parseFloat(sp.el.style.top) > 300, `bounce ${i} lands below the track, in the strip`);
    settled.push(sp);
  }
  timers.slice(timersBefore).forEach(fn => fn());
  assert.ok(settled[0].el.removed, 'the thirteenth bounce buries the figure it lands on');
  assert.equal(settled.filter(sp => !sp.el.removed).length, 12,
    'the settled pile caps at the twelve fan slots');
  /* The never-opened route keeps its fade into the envelope fan: the
     fan is that pile, growing and draining with the live count. */
  g.pileLive.unopened = 1;
  const noopen = fakeSprite();
  g.routeSpriteToPile(noopen, 'noopen');
  assert.ok(noopen.el.classes.has('pilefade'),
    'never-opened sprites still fade into their envelope fan');
});

test('report prints the unopened count from the same tally the piles use', () => {
  const { context: g, element } = game();
  g.selectLevel(1, false);
  g.state.seg = g.SEGMENTS.find(s => s.id === 'blast');
  g.state.validation = 'skip';
  g.startRun(); g.showReport();
  const c = g.tally(g.runData);
  const unopened = c.delivered - c.opened;
  assert.ok(unopened > 0, 'this configuration leaves mail unopened');
  assert.ok(element('report').innerHTML.includes(`UNOPENED · ${g.fmt(unopened)}`),
    'the deliverability card prints the tally unopened count');
  assert.ok(element('report').innerHTML.includes('sat in inboxes, never opened'));
});

/* Stage 3: the second wave. After the wave 1 report, most runs draw a
   complication from the run seed (the same hashStr + mulberry
   machinery as the twist draw, over "qccomp|<index>|<seed>").
   Tests pin a complication the same way they pin a twist: scan the
   deterministic seeds through the game's own draw until the wanted
   variant and flavor pair appears, then play through the card
   handlers and the real accept/decline paths. */
function startQCWithComp(g, index, variantIndex, flavor) {
  for (let n = 0; n < 2000; n++) {
    const seed = 'V' + String(n).padStart(3, '0');
    if (variantIndex !== null && g.quickVariantIndex(index, seed) !== variantIndex) continue;
    const comp = g.quickComplicationDraw(index, seed);
    if (!comp || comp.flavor !== flavor) continue;
    g.startQuickChallenge(index, seed);
    assert.equal(g.state.quickChallenge.comp.flavor, flavor);
    return seed;
  }
  throw new Error(`No seed draws flavor ${flavor} for challenge ${index} variant ${variantIndex}`);
}

test('complication draw is deterministic per seed and reaches every flavor', () => {
  const { context: g } = game();
  assert.equal(typeof g.quickComplicationDraw, 'function');
  for (let index = 0; index < 3; index++) {
    /* Same seed, same complication: the draw is a pure function. */
    assert.deepEqual(g.quickComplicationDraw(index, 'V042'), g.quickComplicationDraw(index, 'V042'));
    const seen = new Set();
    const sources = new Set();
    for (let n = 0; n < 400; n++) {
      const comp = g.quickComplicationDraw(index, 'V' + String(n).padStart(3, '0'));
      seen.add(comp ? comp.flavor : 'none');
      if (comp && comp.flavor === 'late') {
        sources.add(comp.source);
        /* The late card is never one the challenge already dealt. */
        const dealt = g.QUICK_CHALLENGES[index].ids.concat(g.QUICK_CHALLENGES[index].extras);
        assert.ok(!dealt.includes(comp.qid), `Q${comp.qid} is already dealt in challenge ${index}`);
        assert.ok(g.questionById(comp.qid), 'the late card is a real bank question');
        assert.notEqual(g.defectOf(g.questionById(comp.qid)), 'CLEAN', 'the late card arrives defective');
      }
    }
    assert.deepEqual([...seen].sort(), ['late', 'list', 'none', 'wave'],
      `Challenge ${index} sweep must reach every flavor and clean runs`);
    assert.ok(sources.size >= 3, `Challenge ${index} late questions rotate their named source`);
  }
});

test('a run with no complication drawn reports no card and no wave 2', () => {
  const { context: g, element } = game();
  let seed = null;
  for (let n = 0; n < 500 && !seed; n++) {
    const candidate = 'V' + String(n).padStart(3, '0');
    if (g.quickComplicationDraw(0, candidate) === null) seed = candidate;
  }
  assert.ok(seed, 'the scan must find a clean seed');
  g.startQuickChallenge(0, seed);
  assert.equal(g.state.quickChallenge.comp, null);
  g.startRun();
  g.showReport();
  assert.doesNotMatch(element('report').innerHTML, /COMPLICATION/);
  assert.equal(g.acceptQuickComplication(), false);
  assert.equal(g.declineQuickComplication(), false);
  assert.equal(g.state.quickChallenge.wave, 1);
});

test('declining a complication keeps the wave 1 result final and charges nothing', () => {
  const { context: g, element } = game();
  startQCWithComp(g, 0, 0, 'list');
  applyQuickLine(g, 0, 'intended');
  g.startRun();
  g.showReport();
  assert.match(element('report').innerHTML, /QUICK CHALLENGE · WON/);
  assert.match(element('report').innerHTML, /COMPLICATION · THE LIST WAS OLDER THAN THE BRIEF/);
  const wave1 = JSON.stringify(g.state.quickChallenge.wave1);
  assert.equal(g.declineQuickComplication(), true);
  assert.equal(g.state.quickChallenge.compChoice, 'declined');
  assert.equal(JSON.stringify(g.state.quickChallenge.wave1), wave1, 'the wave 1 record is untouched');
  assert.match(element('report').innerHTML, /QUICK CHALLENGE · WON/, 'the wave 1 verdict stands');
  assert.match(element('compCard').innerHTML, /DECLINED/);
  assert.equal(g.state.spentBefore, 0, 'declining charges nothing');
  assert.equal(g.acceptQuickComplication(), false, 'a declined complication cannot be accepted after');
  assert.equal(g.state.quickChallenge.wave, 1);
});

test('LIST REALITY: wave 2 faces the true list and re-validation rescues the verdict', () => {
  const { context: g, element } = game();
  startQCWithComp(g, 0, 0, 'list');
  /* Wave 1: BRD cards repaired, one extra cut, two left unresolved.
     It loses on the extras, with 7 credits left in the pool. */
  for (const id of [3, 10, 24]) clickSimplify(g, id);
  clickCut(g, 57);
  assert.equal(g.budgetMath().total, 41);
  g.startRun();
  g.showReport();
  assert.match(element('report').innerHTML, /TRY ANOTHER REPAIR/);
  assert.equal(g.state.quickChallenge.wave1.won, false);
  /* Accept: the stated list is replaced by the real one, and the
     provided validation is void because it ran on the wrong extract. */
  assert.equal(g.acceptQuickComplication(), true);
  assert.equal(g.state.quickChallenge.wave, 2);
  assert.equal(g.state.seg.invalidPct, 0.09);
  assert.equal(g.state.validation, 'skip');
  assert.equal(g.state.baseline.validation, 'skip');
  assert.equal(g.state.spentBefore, 41 - g.QUICK_BASE_COST, 'wave 2 accounting starts from wave 1 net of the bought batch');
  /* Wave 2 setup: buy partial re-validation at the book price, field
     the cheaper invite to make room, and resolve the extras. */
  g.state.validation = 'partial';
  assert.ok(Math.abs(g.effInvalidRate() - 0.09 * 0.45) < 1e-9, 'partial validation prices the true list');
  g.state.invite = g.INVITES[0];
  clickSimplify(g, 26);
  clickSimplify(g, 22);
  assert.equal(g.budgetMath().total, 47, 'pool total is exact: 41 + validation 6 + repairs 4, invite downgrade frees 4');
  assert.ok(g.budgetMath().total <= g.QUICK_BUDGET);
  const wave1Run = g.runData;
  g.startRun();
  assert.notEqual(g.runData, wave1Run, 'wave 2 is a genuine second run');
  g.showReport();
  const html = element('report').innerHTML;
  assert.match(html, /QUICK CHALLENGE · WON · FINAL/);
  assert.match(html, /COMPLICATION · THE LIST WAS OLDER THAN THE BRIEF/);
  assert.match(html, /after re-validation \(partial, 6 cr\)/);
  assert.match(html, /COMBINED/);
  assert.equal(g.state.spentBefore + g.state.launchCost, 47, 'no double charge across the two waves');
  assert.equal(g.budgetMath().remaining, 1);
});

test('LIST REALITY: leaving the extras unresolved still loses the final verdict', () => {
  const { context: g, element } = game();
  startQCWithComp(g, 0, 0, 'list');
  for (const id of [3, 10, 24]) clickSimplify(g, id);
  g.startRun();
  g.showReport();
  assert.equal(g.acceptQuickComplication(), true);
  g.state.validation = 'partial';
  assert.equal(g.budgetMath().total, 46);
  g.startRun();
  g.showReport();
  const html = element('report').innerHTML;
  assert.match(html, /TRY ANOTHER REPAIR · FINAL/);
  assert.match(html, /Extras resolved <b>0 \/ 3<\/b>/);
});

test('THE LATE QUESTION: carried or repaired into a genuine second wave', () => {
  const { context: g, element } = game();
  const seed = startQCWithComp(g, 0, 0, 'late');
  const comp = g.state.quickChallenge.comp;
  assert.equal(typeof comp.qid, 'number');
  /* Wave 1 loses with one extra unresolved, then the late card lands. */
  for (const id of [3, 10, 24]) clickSimplify(g, id);
  clickCut(g, 57);
  clickCut(g, 22);
  assert.equal(g.budgetMath().total, 42);
  g.startRun();
  g.showReport();
  assert.match(element('report').innerHTML, /TRY ANOTHER REPAIR/);
  assert.match(element('report').innerHTML, /COMPLICATION · ONE MORE QUESTION, NON-NEGOTIABLE/);
  assert.equal(g.acceptQuickComplication(), true);
  assert.equal(g.state.quickChallenge.lateQid, comp.qid);
  g.renderQuestions();
  assert.match(element('qGrid').innerHTML, /LATE · REQUIRED/);
  /* Resolve the wave 1 miss; this seed's late card (Q5, BEYOND
     KNOWLEDGE) has no wording fix, so it rides along and its damage
     is priced into wave 2's real numbers, which still clear the
     base gates. */
  assert.equal(g.fixVerbFor(g.questionById(comp.qid)), null);
  clickSimplify(g, 26);
  assert.equal(g.budgetMath().total, 44);
  g.startRun();
  g.showReport();
  const html = element('report').innerHTML;
  assert.match(html, /QUICK CHALLENGE · WON · FINAL/);
  assert.match(html, new RegExp(`LATE Q${comp.qid} · BEYOND KNOWLEDGE:</b> Carried as written into wave 2`));
  assert.equal(g.state.spentBefore + g.state.launchCost, 44);
  assert.ok(seed);
});

test('a late question can be cut without satisfying its study requirement', () => {
  const { context: g, element } = game();
  startQCWithComp(g, 0, 0, 'late');
  applyQuickLine(g, 0, 'intended');
  g.startRun(); g.showReport();
  assert.equal(g.acceptQuickComplication(), true);
  const lateId = g.state.quickChallenge.lateQid;
  clickCut(g, lateId);
  assert.equal(g.state.qstate[lateId], 'cut');
  g.startRun(); g.showReport();
  assert.match(element('report').innerHTML, /TRY ANOTHER REPAIR · FINAL/);
  assert.match(element('report').innerHTML, /Cut before wave 2/);
  assert.doesNotMatch(element('report').innerHTML, /It went out as written/);
});

test('THE LATE QUESTION: carrying it broken past the audit bar flips a win, repairing it holds', () => {
  /* Risk path: wave 1 wins under QC3's audit twist (quality 95+). */
  const { context: g, element } = game();
  startQCWithComp(g, 2, 1, 'late');
  const comp = g.state.quickChallenge.comp;
  applyQuickLine(g, 2, 'intended');
  g.startRun();
  g.showReport();
  assert.match(element('report').innerHTML, /QUICK CHALLENGE · WON/);
  assert.ok(g.state.quickChallenge.wave1.quality >= g.quickQualityGate());
  assert.equal(g.acceptQuickComplication(), true);
  /* Carry the late card as written: its defect symptoms land in wave
     2's quality, under the audit bar, and the twist rules NOT MET. */
  g.startRun();
  g.showReport();
  let html = element('report').innerHTML;
  assert.match(html, /TRY ANOTHER REPAIR · FINAL/);
  assert.match(html, /BRD twist · <b>(.*?)<\/b>.*NOT MET/s);
  /* Repair path on the same seed: the fix holds the win. */
  const { context: g2, element: element2 } = game();
  startQCWithComp(g2, 2, 1, 'late');
  applyQuickLine(g2, 2, 'intended');
  g2.startRun();
  g2.showReport();
  assert.equal(g2.acceptQuickComplication(), true);
  clickSimplify(g2, comp.qid);
  assert.equal(g2.budgetMath().total, 47);
  g2.startRun();
  g2.showReport();
  html = element2('report').innerHTML;
  assert.match(html, /QUICK CHALLENGE · WON · FINAL/);
  assert.match(html, /— <b>MET<\/b>/);
  assert.match(html, new RegExp(`Repaired with ${g2.fixVerbFor(g2.questionById(comp.qid))} before wave 2`));
});

test('SECOND PUSH: reminder waves rescue a lost wave 1, and a push with nothing repaired still loses', () => {
  const { context: g, element } = game();
  startQCWithComp(g, 1, 1, 'wave');
  /* Wave 1 repairs only the BRD cards: it loses on the extras. */
  for (const id of [48, 55, 11]) clickSimplify(g, id);
  assert.equal(g.budgetMath().total, 40);
  g.startRun();
  g.showReport();
  assert.match(element('report').innerHTML, /TRY ANOTHER REPAIR/);
  assert.equal(g.acceptQuickComplication(), true);
  assert.equal(g.state.reminders, 1, 'accepting sets the first reminder wave');
  /* Wave 2: cheaper invite to make room, extras cut, push live. */
  g.state.invite = g.INVITES[0];
  clickCut(g, 7);
  clickCut(g, 51);
  clickCut(g, 68);
  assert.equal(g.budgetMath().total, 47);
  g.startRun();
  g.showReport();
  let html = element('report').innerHTML;
  assert.match(html, /QUICK CHALLENGE · WON · FINAL/);
  assert.match(html, /second push fielded 1 reminder wave/);
  /* Losing line on the same seed: two waves bought, nothing repaired. */
  const { context: g2, element: element2 } = game();
  startQCWithComp(g2, 1, 1, 'wave');
  g2.startRun();
  g2.showReport();
  assert.equal(g2.acceptQuickComplication(), true);
  g2.state.reminders = 2;
  g2.state.invite = g2.INVITES[0];
  assert.equal(g2.budgetMath().total, 46);
  g2.startRun();
  g2.showReport();
  html = element2('report').innerHTML;
  assert.match(html, /TRY ANOTHER REPAIR · FINAL/);
});

test('SECOND PUSH: a wave 1 win that cannot fund the push is told so, and the result stands', () => {
  const { context: g, element } = game();
  startQCWithComp(g, 0, 1, 'wave');
  /* The cut-all line wins QC1's reporting threshold at 43 credits,
     leaving 5: the 8-credit push cannot be funded from the pool. */
  applyQuickLine(g, 0, 'cut-extras');
  assert.equal(g.budgetMath().total, 43);
  g.startRun();
  g.showReport();
  const html = element('report').innerHTML;
  assert.match(html, /QUICK CHALLENGE · WON/);
  assert.match(html, /cannot be funded/);
  assert.equal(g.acceptQuickComplication(), false, 'an unfunded push cannot be accepted');
  assert.equal(g.state.quickChallenge.wave, 1);
  assert.equal(g.declineQuickComplication(), true, 'declining stays free');
  assert.match(element('report').innerHTML, /QUICK CHALLENGE · WON/);
});

test('wave 2 locks the wave 1 list and never leaks into the campaign', () => {
  const { context: g, element } = game();
  g.state.campaignWon[2] = true;
  startQCWithComp(g, 0, 0, 'list');
  g.startRun();
  g.showReport();
  assert.equal(g.acceptQuickComplication(), true);
  g.renderSegments();
  assert.match(element('segGrid').innerHTML, /data-seg="fresh" disabled/,
    'every segment card locks in wave 2, the mailed list included');
  g.leaveQuickChallenge();
  assert.equal(g.state.quickChallenge, null);
  assert.equal(g.BUDGET_TOTAL, 120);
  assert.equal(g.state.seg.invalidPct, 0.03, 'the campaign keeps the true Fresh segment');
  assert.equal(g.state.campaignWon[2], true);
  g.selectLevel(1, false);
  assert.equal(g.quickVariant(), null);
  assert.equal(g.quickQualityGate(), 60);
  assert.equal(g.instrumentFloor(), 1);
});

/* ---- Manager mood machine: presentation only. The machine reads
   quantities the run already tracks; these tests drive it as a unit
   with synthetic pace parameters, then against real built runs. ---- */

test('agitated manager map keeps the headset and only reworks the face', () => {
  const { context: g } = game();
  /* The headset region is the R-family cells (R and its dark shade r)
     in the head rows (0..21, above neck and desk); the desk's red mug
     in NORMAL/AGITATED is furniture, not headset. */
  const R = map => map.slice(0, 22).map((row, y) => [...row].map((c, x) => (c === 'R' || c === 'r') ? `${x},${y}` : null).filter(Boolean).join(' ')).join('|');
  assert.equal(g.MGR_NORMAL.length, 39);
  assert.equal(g.MGR_PUMP.length, 39);
  assert.equal(g.MGR_SAD.length, 33);
  assert.equal(g.MGR_AGITATED.length, 39, 'agitated matches NORMAL/PUMP height');
  for (const map of [g.MGR_NORMAL, g.MGR_PUMP, g.MGR_SAD, g.MGR_AGITATED]) {
    for (const row of map) assert.equal(row.length, 42, 'every mood map is 42 cells wide');
  }
  for (const map of [g.MGR_PUMP, g.MGR_SAD, g.MGR_AGITATED]) {
    assert.equal(R(map), R(g.MGR_NORMAL), 'headset cells sit at NORMAL\u2019s coordinates in every mood');
  }
  const FACE_ROWS = new Set([9, 10, 11, 13, 14, 17, 18, 19, 20]); /* brows, stare, teeth */
  g.MGR_AGITATED.forEach((row, y) => {
    if (FACE_ROWS.has(y)) return;
    assert.equal(row, g.MGR_NORMAL[y], `row ${y} is byte-identical to NORMAL`);
  });
  assert.notEqual(g.MGR_AGITATED[11], g.MGR_NORMAL[11], 'scowl brow row differs');
  assert.notEqual(g.MGR_AGITATED[18], g.MGR_NORMAL[18], 'teeth row differs');
  assert.notEqual(g.MGR_AGITATED[19], g.MGR_NORMAL[19], 'teeth row differs');
});

test('mood machine baseline follows pace against the target', () => {
  const { context: g } = game();
  const m = g.createMoodMachine({ needed: 5, sent: 40, firstFinishT: 10000, lastFinishT: 22000 });
  assert.equal(m.baselineAt(0, 0).mood, 'NORMAL', 'no signal before the window');
  assert.equal(m.baselineAt(9000, 0).mood, 'NORMAL');
  assert.equal(m.baselineAt(16000, 3).mood, 'PUMP', 'half the window, 3 of 5 needed: ahead');
  assert.equal(m.baselineAt(16000, 3).category, 'AHEAD');
  assert.equal(m.baselineAt(16000, 1).mood, 'SAD', 'half the window, 1 of 5 needed: behind');
  assert.equal(m.baselineAt(11200, 0).mood, 'NORMAL', 'behind this early still reads NORMAL');
  assert.equal(m.baselineAt(11200, 0).category, 'BEHIND');
  assert.equal(m.baselineAt(22000, 5).mood, 'PUMP', 'window over, target count met');
  assert.equal(m.baselineAt(22000, 4).mood, 'SAD', 'window over, target count missed');
  const m2 = g.createMoodMachine({ needed: 5, sent: 40, firstFinishT: 10000, lastFinishT: 22000 });
  assert.equal(m2.moodAt(22000, 5), 'PUMP');
  assert.equal(g.createMoodMachine({ needed: 5, sent: 40, firstFinishT: 10000, lastFinishT: 22000 }).moodAt(22000, 4), 'SAD');
});

test('mood machine: bounce thresholds are exact and escalate', () => {
  const { context: g } = game();
  const m = g.createMoodMachine({ needed: 5, sent: 40, firstFinishT: 10000, lastFinishT: 22000 });
  m.noteBounce(1000, 1); m.noteBounce(1100, 2); m.noteBounce(1200, 3);
  assert.equal(m.moodAt(1300, 0), 'NORMAL', 'three settled bounces do not agitate');
  m.noteBounce(1400, 4);
  assert.equal(m.moodAt(1400, 0), 'AGITATED', 'the fourth settled bounce agitates');
  assert.equal(m.moodAt(3300, 0), 'AGITATED', 'severity 2 holds 2 s');
  assert.equal(m.moodAt(3500, 0), 'NORMAL', 'then decays back to the baseline');
  m.noteBounce(3600, 5); m.noteBounce(3700, 6); m.noteBounce(3800, 7);
  assert.equal(m.moodAt(3900, 0), 'NORMAL', 'bounces 5-7 do not re-fire');
  m.noteBounce(4000, 8);
  assert.equal(m.moodAt(4000, 0), 'AGITATED', 'the eighth bounce escalates');
  assert.equal(m.moodAt(6400, 0), 'AGITATED', 'severity 3 holds 2.5 s');
  assert.equal(m.moodAt(6600, 0), 'NORMAL');
});

test('mood machine: finish clusters cheer and expire', () => {
  const { context: g } = game();
  /* window parked late so the baseline stays NORMAL and only the
     reaction can produce PUMP */
  const m = g.createMoodMachine({ needed: 5, sent: 40, firstFinishT: 20000, lastFinishT: 26000 });
  m.noteFinish(12000, false); m.noteFinish(12400, false);
  assert.equal(m.moodAt(12500, 2), 'NORMAL', 'two finishes are not a cluster');
  m.noteFinish(12800, false);
  assert.equal(m.moodAt(13000, 3), 'PUMP', 'three finishes inside 1600 ms cheer');
  assert.equal(m.moodAt(15000, 3), 'NORMAL', 'the cheer expires back to baseline');
});

test('mood machine: a mid-window finish drought sours the baseline', () => {
  const { context: g } = game();
  const m = g.createMoodMachine({ needed: 6, sent: 40, firstFinishT: 10000, lastFinishT: 22000 });
  m.noteFinish(10600, false); m.noteFinish(11600, false); m.noteFinish(12600, false); m.noteFinish(13600, false);
  assert.equal(m.moodAt(18000, 4), 'NORMAL', 'on pace and only 4.4 s since the last finish: no drought yet');
  assert.equal(m.moodAt(18600, 4), 'SAD', '5 s without a finish, still short of the needed 6: drought');
});

test('mood machine: abandonment, guess, and quality bursts agitate; singles do not', () => {
  const { context: g } = game();
  const P = { needed: 5, sent: 40, firstFinishT: 20000, lastFinishT: 26000 };
  const a = g.createMoodMachine(P);
  a.noteAbandon(1000); a.noteAbandon(1500);
  assert.equal(a.moodAt(1600, 0), 'NORMAL', 'two mid-survey abandonments are not a burst');
  a.noteAbandon(2000);
  assert.equal(a.moodAt(2000, 0), 'AGITATED', 'three inside 2000 ms are');
  const spread = g.createMoodMachine(P);
  spread.noteAbandon(1000); spread.noteAbandon(3500); spread.noteAbandon(6000);
  assert.equal(spread.moodAt(6100, 0), 'NORMAL', 'spread-out abandonments never burst');
  const gu = g.createMoodMachine(P);
  gu.noteGuess(1000); gu.noteGuess(2000); gu.noteGuess(3000);
  assert.equal(gu.moodAt(3000, 0), 'AGITATED', 'three guesses inside 2500 ms agitate');
  const q = g.createMoodMachine(P);
  q.noteFinish(1000, true);
  assert.equal(q.moodAt(1100, 1), 'NORMAL', 'one quality-flagged finish is not a burst');
  q.noteFinish(2000, true);
  assert.equal(q.moodAt(2100, 2), 'AGITATED', 'two speeder/straight-liner/duplicate finishes inside 2500 ms are');
  const an = g.createMoodMachine(P);
  an.noteAngry(1000);
  assert.equal(an.moodAt(2400, 0), 'AGITATED', 'an opted-out mailing agitates at severity 1');
  assert.equal(an.moodAt(2600, 0), 'NORMAL', 'severity 1 holds 1.5 s');
  const du = g.createMoodMachine(P);
  du.noteDupe(1000);
  assert.equal(du.moodAt(1000, 0), 'AGITATED', 'a duplicate envelope agitates');
});

test('mood machine: reminder waves cheer by how much they recovered', () => {
  const { context: g } = game();
  const P = { needed: 5, sent: 40, firstFinishT: 20000, lastFinishT: 26000 };
  const none = g.createMoodMachine(P);
  none.noteReminder(1000, 0);
  assert.equal(none.moodAt(1000, 0), 'NORMAL', 'a wave that recovered nobody does not cheer');
  const one = g.createMoodMachine(P);
  one.noteReminder(1000, 1);
  assert.equal(one.moodAt(1000, 0), 'PUMP', 'one recovery is a mild cheer');
  assert.equal(one.moodAt(2600, 0), 'NORMAL');
  const many = g.createMoodMachine(P);
  many.noteReminder(1000, 3);
  assert.equal(many.moodAt(2900, 0), 'PUMP', 'several recoveries cheer at severity 2');
  assert.equal(many.moodAt(3100, 0), 'NORMAL');
});

test('mood machine: reputation risk agitates once, at full severity', () => {
  const { context: g } = game();
  const m = g.createMoodMachine({ needed: 5, sent: 40, firstFinishT: 20000, lastFinishT: 26000 });
  m.noteRepRisk(1000);
  assert.equal(m.moodAt(3499, 0), 'AGITATED', 'severity 3 holds the full 2.5 s');
  assert.equal(m.moodAt(3501, 0), 'NORMAL');
  m.noteRepRisk(5000);
  assert.equal(m.moodAt(5000, 0), 'NORMAL', 'the risk warning fires once per run');
});

test('mood machine: arbitration holds, interrupts by severity, and the trip locks SAD', () => {
  const { context: g } = game();
  const P = { needed: 5, sent: 40, firstFinishT: 20000, lastFinishT: 26000 };
  const m = g.createMoodMachine(P);
  m.noteReminder(1000, 1);
  assert.equal(m.moodAt(1000, 0), 'PUMP');
  m.noteAngry(1100);
  assert.equal(m.moodAt(1100, 0), 'PUMP', 'equal severity inside the dwell cannot flicker the face');
  m.noteRepRisk(1200);
  assert.equal(m.moodAt(1200, 0), 'AGITATED', 'higher severity interrupts at once');
  m.noteReminder(1500, 1);
  assert.equal(m.moodAt(1500, 0), 'AGITATED', 'lower severity waits out the dwell');
  const swap = g.createMoodMachine(P);
  swap.noteAngry(1000);
  swap.noteReminder(2100, 1);
  assert.equal(swap.moodAt(2100, 0), 'PUMP', 'after the dwell a new reaction may take over');
  const trip = g.createMoodMachine(P);
  trip.noteTrip();
  trip.noteBounce(1100, 9); trip.noteReminder(1200, 3);
  assert.equal(trip.moodAt(1300, 0), 'SAD', 'a tripped breaker locks the face on SAD');
  assert.equal(trip.moodAt(9000, 0), 'SAD');
});

test('mood machine: pace crossing into ahead cheers once as it happens', () => {
  const { context: g } = game();
  const m = g.createMoodMachine({ needed: 5, sent: 40, firstFinishT: 10000, lastFinishT: 22000 });
  assert.equal(m.moodAt(13000, 2), 'PUMP', 'crossing into ahead-of-target');
  assert.equal(m.moodAt(14400, 2), 'PUMP', 'pace fell back to on-par, the cheer still holds');
  assert.equal(m.moodAt(14600, 2), 'NORMAL', 'then the baseline resumes');
});

test('mood parameters come off real runs: needed count and finish window', () => {
  const { context: g, element } = game();
  g.selectLevel(1, false);
  g.state.seg = g.SEGMENTS.find(s => s.id === 'blast');
  g.state.validation = 'skip'; g.state.reminders = 2;
  g.state.invite = g.INVITES.find(i => i.id === 'generic');
  g.startRun();
  const bp = g.moodParamsForRun(g.runData);
  const count = g.tally(g.runData);
  assert.equal(bp.sent, count.sent);
  assert.ok(bp.sent > 0 && bp.sent < g.state.seg.n, 'the breaker stops part of the population');
  assert.equal(bp.needed, Math.floor(g.curLevel().target * count.sent) + 1);
  const blastTimes = g.runData.respondents.flatMap(person => person.events.filter(event => event.type === 'finish').map(event => event.t));
  assert.equal(bp.firstFinishT, blastTimes.length ? Math.min(...blastTimes) : g.RUN_MS);
  assert.equal(bp.lastFinishT, blastTimes.length ? Math.max(...blastTimes) : g.RUN_MS);
  assert.ok(g.moodMachine, 'setupStage armed a mood machine for the run');
  assert.equal(g.moodMachine.params.needed, bp.needed);
  assert.equal(element('mgrRun').innerHTML, g.pixelHTML(g.MGR_NORMAL, 4 / 3).html, 'the run figure starts NORMAL (hi-res maps render at a third of the legacy cell size)');
  assert.equal(element('mgrRun').className, 'pixelbox', 'no shake class at rest');

  const second = game();
  const g2 = second.context;
  g2.selectLevel(1, false);
  g2.state.validation = 'full'; g2.state.reminders = 1;
  g2.startRun();
  const fp = g2.moodParamsForRun(g2.runData);
  assert.equal(fp.sent, g2.state.seg.n);
  assert.equal(fp.needed, Math.floor(g2.curLevel().target * fp.sent) + 1);
  const times = [];
  g2.runData.respondents.forEach(sp => sp.events.forEach(e => { if (e.type === 'finish') times.push(e.t); }));
  assert.equal(times.length, g2.tally(g2.runData).completed);
  assert.equal(fp.firstFinishT, Math.min.apply(null, times));
  assert.equal(fp.lastFinishT, Math.max.apply(null, times));
});

/* ---- Medallion prep stage, phase 1: derived list health ---- */

test('medallion: intake draw is deterministic per level, seed and segment', () => {
  const a = game().context;
  const b = game().context;
  a.selectLevel(1, false); b.selectLevel(1, false);
  const fresh = a.SEGMENTS.find(s => s.id === 'fresh');
  assert.equal(JSON.stringify(a.drawIntakeMix(fresh)), JSON.stringify(b.drawIntakeMix(fresh)),
    'two instances with the same level and seed deal the same intake mix');
  assert.deepEqual(a.drawIntakeMix(fresh), a.drawIntakeMix(fresh), 'the draw is a pure function');
  const dealt = a.currentIntake();
  assert.deepEqual(a.currentIntake(), dealt, 'the dealt intake is cached, never re-jittered mid-chain');
  a.state.seg = a.SEGMENTS.find(s => s.id === 'stale');
  assert.notDeepEqual(a.currentIntake(), dealt, 'switching segment redraws against the new segment mix');
});

test('medallion: derived-rate endpoints per segment bracket the old static rates', () => {
  const { context: g } = game();
  const none = { dedupe: false, consolidate: false, repair: false };
  const full = { dedupe: true, consolidate: true, repair: true };
  for (const seg of g.SEGMENTS) {
    const mix = seg.intake;
    const noWork = g.intakeDerived(mix, none).invalid;
    const fullWork = g.intakeDerived(mix, full).invalid;
    const expectNone = (mix.stale + mix.brokenFix + mix.brokenDead);
    const expectFull = mix.stale / (1 - mix.dupSys - mix.dupSecond - mix.brokenDead);
    assert.ok(Math.abs(noWork - expectNone) < 1e-9, `${seg.id} no-work endpoint`);
    assert.ok(Math.abs(fullWork - expectFull) < 1e-9, `${seg.id} full-work endpoint`);
    assert.ok(fullWork < noWork, `${seg.id}: Silver work strictly improves list health`);
    assert.ok(seg.invalidPct <= noWork + 1e-9, `${seg.id}: the old static rate never exceeds the no-work line`);
    assert.ok(seg.invalidPct >= fullWork - 0.005, `${seg.id}: the old static rate sits inside the derived bracket (Fresh alone dips 0.2 points under its full-work line, per the design table)`);
  }
});

test('medallion: skipping Silver work maps to duplicate flags and a higher invalid rate', () => {
  const { context: g } = game();
  g.selectLevel(1, false);
  assert.equal(g.duplicateFactor(), 1, 'no Silver work: every duplicate class reaches the run');
  const mix = g.currentIntake();
  g.state.dedupe = true;
  const expectedPartial = mix.dupSecond / (mix.dupSys + mix.dupSecond);
  assert.ok(Math.abs(g.duplicateFactor() - expectedPartial) < 1e-9,
    'dedupe alone leaves exactly the second-source share of duplicates');
  g.state.consolidate = true;
  assert.equal(g.duplicateFactor(), 0, 'full Silver dedupe work: no duplicates reach the run');

  g.state.dedupe = false; g.state.consolidate = false; g.state.repair = false;
  const rawRate = g.baseInvalidRate();
  const rawRun = g.buildRun();
  assert.ok(rawRun.respondents.some(sp => sp.dupEnv || sp.qDup),
    'unmerged duplicates reach the run as duplicate envelopes and duplicate responses');
  g.state.repair = true;
  assert.ok(g.baseInvalidRate() < rawRate, 'unrepaired broken addresses feed the invalid pool');
  g.state.dedupe = true; g.state.consolidate = true;
  const cleanRun = g.buildRun();
  assert.ok(!cleanRun.respondents.some(sp => sp.dupEnv || sp.qDup),
    'full Silver work: zero duplicate flags in the run');
});

test('medallion: Silver actions charge once, stay owned, and suppression still charges at Gold', () => {
  const { context: g } = game();
  g.selectLevel(1, false);
  const row = (bm, label) => bm.prepItems.find(item => item[0].startsWith(label));
  g.state.consolidate = true;
  assert.equal(row(g.budgetMath(), 'Consolidate')[1], 4, 'consolidate charges 4 cr on first purchase');
  g.state.repair = true;
  assert.equal(row(g.budgetMath(), 'Repair addresses')[1], 5, 'repair charges 5 cr on first purchase');
  g.state.dedupe = true;
  assert.equal(row(g.budgetMath(), 'Dedupe')[1], 4, 'dedupe still charges 4 cr, now as a Silver action');
  g.state.baseline = g.snapshotCurrent();
  const owned = g.budgetMath();
  assert.equal(row(owned, 'Consolidate')[1], 0, 'owned consolidate is never charged again');
  assert.equal(row(owned, 'Repair addresses')[1], 0, 'owned repair is never charged again');
  assert.equal(row(owned, 'Dedupe')[1], 0, 'owned dedupe is never charged again');
  g.state.suppression = true;
  assert.equal(row(g.budgetMath(), 'Suppression')[1], 4, 'suppression still charges 4 cr at Gold when not owned');
});

/* Per-level surveys, phases 1-5 (docs/level-surveys-scope.md; all
   seven decisions approved as recommended, 2026-11-11). Level 1
   migrated to its own Support Experience bank in phase 1; Level 2
   migrated to its own Copilot Adoption bank in phase 2; Level 3
   migrated to its own Azure Cloud Services bank in phase 3;
   Level 4 migrated to its own Account Team Relationship bank in
   phase 4; phase 5 migrated Level 5 to the General Perceptions of
   Microsoft bank and Level 6 to the Enterprise Relationship
   Flagship bank and removed the transitional legacy fallback. */
test('per-level surveys: Level 1 bank has the derived structure', () => {
  const { context: g } = game();
  const bank = g.bankForLevel(1);
  assert.equal(bank.length, 36);
  assert.ok(bank.every(q => q.survey === 1));
  const sections = {}, tiers = {}, defects = new Set();
  for (const q of bank) {
    sections[g.sectionOf(q)] = (sections[g.sectionOf(q)] || 0) + 1;
    tiers[g.tierOf(q)] = (tiers[g.tierOf(q)] || 0) + 1;
    if (g.tierOf(q) === 'defective') defects.add(g.defectOf(q));
  }
  assert.deepEqual(sections, { A: 4, B: 18, C: 6, D: 2, E: 2, F: 4 });
  assert.deepEqual(tiers, { clean: 15, defective: 12, stupid: 5, filler: 4 });
  assert.equal(defects.size, 11, 'all 11 defect classes present on Level 1');
  const core = bank.filter(q => q.core);
  assert.ok(core.length >= 6 && core.length <= 8, 'core set is 6-8');
  /* The fixed first-play instrument is a subset of the Level 1 bank. */
  assert.ok(g.QUESTIONS.every(q => bank.some(b => b.id === q.id)));
  /* At least 2 creditable questions per agenda topic, and at least one
     creditable core question per agenda topic. */
  for (const topic of g.SURVEYS[1].agenda) {
    const creditable = bank.filter(q => q.topic === topic && g.tierOf(q) !== 'stupid');
    assert.ok(creditable.length >= 2, `Level 1 agenda topic "${topic}" has 2+ creditable questions`);
    assert.ok(creditable.some(q => q.core), `Level 1 agenda topic "${topic}" has a creditable core question`);
  }
});

test('per-level surveys: every level draws its own bank; the legacy fallback is removed', () => {
  const { context: g } = game();
  /* Every campaign level draws only its own bank. */
  for (let level = 1; level <= 6; level++) {
    const bank = g.bankForLevel(level);
    assert.ok(bank.length === 36 && bank.every(q => q.survey === level), `Level ${level} bank is its own`);
  }
  /* The transitional fallback from phases 1-4 is gone: no campaign
     level draws a legacy entry (survey 0) or Level 1's curation
     pool. The legacy entries remain in the union bank as the Quick
     Challenges' source, read by id, never through bankForLevel. */
  const legacy = g.QUESTION_BANK.filter(q => q.survey === 0);
  assert.ok(legacy.length > 0, 'legacy entries remain in the union bank for the drills');
  for (let level = 1; level <= 6; level++) {
    assert.ok(g.bankForLevel(level).every(q => q.survey === level), `Level ${level} never draws outside its own bank`);
  }
  /* Seeded deals on every level draw only their own bank's
     questions, across a seed sweep. */
  for (let level = 1; level <= 6; level++) {
    const bankIds = new Set(g.bankForLevel(level).map(q => q.id));
    for (let n = 0; n < 25; n++) {
      const inst = g.generateInstrument(level, 'T' + String(n).padStart(3, '0'));
      assert.ok(inst.length >= 9 && inst.length <= 16);
      assert.ok(inst.every(q => bankIds.has(q.id)), `Level ${level} deal stays inside its own bank`);
    }
  }
});

test('per-level surveys: Quick Challenge ids resolve unchanged in the union bank', () => {
  const { context: g } = game();
  for (const ch of g.QUICK_CHALLENGES) {
    for (const id of [...ch.ids, ...ch.extras]) {
      const q = g.QUESTION_BANK.find(b => b.id === id);
      assert.ok(q, `QC card ${id} still resolves`);
    }
    assert.ok(ch.extras.every(id => g.QUESTION_BANK.find(b => b.id === id).core === false),
      'QC extras remain non-core in the bank data');
  }
});

test('per-level surveys: BRD renders the Level 1 study from its survey record', () => {
  const { context: g, element } = game();
  g.selectLevel(1, false);
  g.openBRD();
  const text = element('brdContent').innerHTML;
  assert.match(text, /Support Experience Survey/);
  assert.match(text, /SPONSOR/);
  assert.match(text, /Support Experience team/);
  assert.match(text, /AUDIENCE/);
  assert.match(text, /Shared front section/);
  assert.doesNotMatch(text, /Collect credible answers on the required business topics below/);
  for (const topic of g.SURVEYS[1].agenda) assert.ok(text.includes(topic));
  /* No other level's survey leaks into the Level 1 BRD. */
  for (let level = 2; level <= 6; level++) assert.ok(!text.includes(g.SURVEYS[level].title));
  /* Another migrated level renders its own full study through the
     same model (Level 5 shown; phase 5 completed its record). */
  g.selectLevel(5, false);
  g.openBRD();
  const text5 = element('brdContent').innerHTML;
  assert.match(text5, /General Perceptions of Microsoft Survey/);
  assert.doesNotMatch(text5, /Support Experience Survey/);
  assert.match(text5, /SPONSOR/);
  assert.match(text5, /Brand and Perceptions research team/);
});

test('per-level surveys: naming reaches level cards, setup banner, and HUD', () => {
  const { context: g, element } = game();
  g.selectLevel(1, false);
  assert.match(element('levelGrid').innerHTML, /LEVEL 1 · EASY · FIRST SEND · SUPPORT EXPERIENCE/);
  assert.match(element('levelBanner').innerHTML, /Survey: Support Experience Survey/);
  assert.match(element('hudLevel').innerHTML, /SUPPORT EXPERIENCE/);
  g.selectLevel(2, false);
  assert.match(element('levelGrid').innerHTML, /LEVEL 2 · EASY · THE SPLIT · COPILOT \/ AI ADOPTION/);
  assert.match(element('levelBanner').innerHTML, /Survey: Copilot Adoption Survey/);
});

test('per-level surveys: Level 1 Insight credits only its own agenda topics', () => {
  const { context: g } = game();
  g.selectLevel(1, false);
  assert.deepEqual(g.agendaTopics(), g.SURVEYS[1].agenda);
  const run = g.buildRun();
  const counts = g.tally(run);
  const insight = g.computeInsight(counts, run);
  assert.deepEqual(Array.from(insight.topics, t => t.topic), Array.from(g.SURVEYS[1].agenda, String));
});

/* Per-level surveys, phase 2: Level 2 (The Split) migrated to the
   Copilot Adoption Survey (ids 201-236), with its full BRD record
   and its own fixed first-play instrument. */
test('per-level surveys: Level 2 bank has the derived structure', () => {
  const { context: g } = game();
  const bank = g.bankForLevel(2);
  assert.equal(bank.length, 36);
  assert.ok(bank.every(q => q.survey === 2));
  assert.ok(bank.every(q => q.id >= 201 && q.id <= 236), 'Level 2 ids live in the 2xx range');
  const sections = {}, tiers = {}, defectCounts = {};
  for (const q of bank) {
    sections[g.sectionOf(q)] = (sections[g.sectionOf(q)] || 0) + 1;
    tiers[g.tierOf(q)] = (tiers[g.tierOf(q)] || 0) + 1;
    if (g.tierOf(q) === 'defective') defectCounts[g.defectOf(q)] = (defectCounts[g.defectOf(q)] || 0) + 1;
  }
  assert.deepEqual(sections, { A: 4, B: 18, C: 6, D: 2, E: 2, F: 4 });
  assert.deepEqual(tiers, { clean: 14, defective: 13, stupid: 5, filler: 4 });
  /* Coverage floor: at least 8 of the 11 classes; the theme-natural
     classes from the scope doc's Level 2 rationale are doubled. */
  assert.ok(Object.keys(defectCounts).length >= 8, 'at least 8 defect classes present');
  for (const cls of ['JARGON', 'BEYOND KNOWLEDGE', 'LEADING']) {
    assert.equal(defectCounts[cls], 2, `${cls} is doubled on Level 2`);
  }
  const core = bank.filter(q => q.core);
  assert.ok(core.length >= 6 && core.length <= 8, 'core set is 6-8');
  /* At least 2 creditable questions per agenda topic, and at least one
     creditable core question per agenda topic. */
  for (const topic of g.SURVEYS[2].agenda) {
    const creditable = bank.filter(q => q.topic === topic && g.tierOf(q) !== 'stupid');
    assert.ok(creditable.length >= 2, `Level 2 agenda topic "${topic}" has 2+ creditable questions`);
    assert.ok(creditable.some(q => q.core), `Level 2 agenda topic "${topic}" has a creditable core question`);
  }
  /* Every fixable defective carries a repaired form; the two
     BEYOND KNOWLEDGE items have no wording fix and no repair entry. */
  for (const q of bank) {
    if (g.tierOf(q) !== 'defective') continue;
    if (g.fixVerbFor(q)) assert.ok(g.QUESTION_REPAIRS[q.id], `Q${q.id} has a repaired form`);
    else assert.equal(g.QUESTION_REPAIRS[q.id], undefined, `Q${q.id} has no repair entry`);
  }
  /* The Level 2 bank holds no support-survey question and no
     Quick-Challenge-load-bearing id. */
  assert.ok(bank.every(q => !g.QUICK_CHALLENGES.some(ch => [...ch.ids, ...ch.extras].includes(q.id))));
});

test('per-level surveys: Level 2 first play deals its own fixed Copilot instrument', () => {
  const { context: g } = game();
  g.state.levelSeeds = {};
  g.selectLevel(2, false);
  const inst = g.activeQuestions();
  assert.equal(inst.length, 12);
  assert.ok(inst.every(q => q.survey === 2), 'fixed Level 2 instrument is drawn from the Copilot bank');
  assert.equal(inst.filter(q => q.core).length, 6, 'fixed Level 2 instrument carries 6 core');
  /* Level 1's fixed instrument stays QUESTIONS, a subset of its bank. */
  g.selectLevel(1, false);
  assert.ok(g.activeQuestions().every(q => g.QUESTIONS.some(b => b.id === q.id)));
});

test('per-level surveys: BRD renders the Level 2 study from its survey record', () => {
  const { context: g, element } = game();
  g.selectLevel(2, false);
  g.openBRD();
  const text = element('brdContent').innerHTML;
  assert.match(text, /Copilot Adoption Survey/);
  assert.match(text, /SPONSOR/);
  assert.match(text, /AI Adoption team/);
  assert.match(text, /AUDIENCE/);
  assert.match(text, /Shared front section/);
  for (const topic of g.SURVEYS[2].agenda) assert.ok(text.includes(topic));
  /* The A/B design note: two invitation variants, one instrument. */
  assert.match(text, /two invitation variants against the same instrument/);
  assert.match(text, /report uncertainty rather than assuming a winner/);
  /* No other level's survey leaks into the Level 2 BRD. */
  for (const level of [1, 3, 4, 5, 6]) assert.ok(!text.includes(g.SURVEYS[level].title));
});

test('per-level surveys: Level 2 Insight credits only its own agenda topics', () => {
  const { context: g } = game();
  g.selectLevel(2, false);
  assert.deepEqual(g.agendaTopics(), g.SURVEYS[2].agenda);
  assert.deepEqual(Array.from(g.agendaTopics(), String),
    ['adoption breadth', 'workflow impact', 'trust in output', 'output quality', 'enablement gap']);
  const run = g.buildRun();
  const counts = g.tally(run);
  const insight = g.computeInsight(counts, run);
  assert.deepEqual(Array.from(insight.topics, t => t.topic), Array.from(g.SURVEYS[2].agenda, String));
  /* Topic keys resolve from the Level 2 survey record, not the
     support map: enablement is about IT decision makers and end
     users on this survey. */
  assert.deepEqual(Array.from(g.topicKeysFor('enablement gap'), String), ['itdm', 'end']);
});

/* Per-level surveys, phase 3: Level 3 (The Stakeholder) migrated to
   the Azure Cloud Services Survey (ids 301-336), with its full BRD
   record and its own fixed first-play instrument. The sponsor is
   the Azure product team, which is also the level's stakeholder. */
test('per-level surveys: Level 3 bank has the derived structure', () => {
  const { context: g } = game();
  const bank = g.bankForLevel(3);
  assert.equal(bank.length, 36);
  assert.ok(bank.every(q => q.survey === 3));
  assert.ok(bank.every(q => q.id >= 301 && q.id <= 336), 'Level 3 ids live in the 3xx range');
  const sections = {}, tiers = {}, defectCounts = {};
  for (const q of bank) {
    sections[g.sectionOf(q)] = (sections[g.sectionOf(q)] || 0) + 1;
    tiers[g.tierOf(q)] = (tiers[g.tierOf(q)] || 0) + 1;
    if (g.tierOf(q) === 'defective') defectCounts[g.defectOf(q)] = (defectCounts[g.defectOf(q)] || 0) + 1;
  }
  assert.deepEqual(sections, { A: 4, B: 18, C: 6, D: 2, E: 2, F: 4 });
  assert.deepEqual(tiers, { clean: 14, defective: 13, stupid: 5, filler: 4 });
  /* Coverage floor: at least 8 of the 11 classes; the theme-natural
     classes from the scope doc's Level 3 rationale are doubled.
     VAGUE TIMEFRAME and DOUBLE NEGATIVE are the recorded omissions
     (see the bank header in site/index.html). */
  assert.ok(Object.keys(defectCounts).length >= 8, 'at least 8 defect classes present');
  for (const cls of ['BEYOND KNOWLEDGE', 'JARGON', 'RECALL OVERLOAD', 'GRID BURDEN']) {
    assert.equal(defectCounts[cls], 2, `${cls} is doubled on Level 3`);
  }
  assert.equal(defectCounts['VAGUE TIMEFRAME'], undefined);
  assert.equal(defectCounts['DOUBLE NEGATIVE'], undefined);
  const core = bank.filter(q => q.core);
  assert.ok(core.length >= 6 && core.length <= 8, 'core set is 6-8');
  /* At least 2 creditable questions per agenda topic, and at least one
     creditable core question per agenda topic. */
  for (const topic of g.SURVEYS[3].agenda) {
    const creditable = bank.filter(q => q.topic === topic && g.tierOf(q) !== 'stupid');
    assert.ok(creditable.length >= 2, `Level 3 agenda topic "${topic}" has 2+ creditable questions`);
    assert.ok(creditable.some(q => q.core), `Level 3 agenda topic "${topic}" has a creditable core question`);
  }
  /* Every fixable defective carries a repaired form; the two
     BEYOND KNOWLEDGE items have no wording fix and no repair entry. */
  for (const q of bank) {
    if (g.tierOf(q) !== 'defective') continue;
    if (g.fixVerbFor(q)) assert.ok(g.QUESTION_REPAIRS[q.id], `Q${q.id} has a repaired form`);
    else assert.equal(g.QUESTION_REPAIRS[q.id], undefined, `Q${q.id} has no repair entry`);
  }
  /* The Level 3 bank holds no support-survey question and no
     Quick-Challenge-load-bearing id. */
  assert.ok(bank.every(q => !g.QUICK_CHALLENGES.some(ch => [...ch.ids, ...ch.extras].includes(q.id))));
});

test('per-level surveys: Level 3 first play deals its own fixed Azure instrument', () => {
  const { context: g } = game();
  g.state.levelSeeds = {};
  g.selectLevel(3, false);
  const inst = g.activeQuestions();
  assert.equal(inst.length, 12);
  assert.ok(inst.every(q => q.survey === 3), 'fixed Level 3 instrument is drawn from the Azure bank');
  assert.equal(inst.filter(q => q.core).length, 6, 'fixed Level 3 instrument carries 6 core');
});

test('per-level surveys: BRD renders the Level 3 study from its survey record', () => {
  const { context: g, element } = game();
  g.selectLevel(3, false);
  g.openBRD();
  const text = element('brdContent').innerHTML;
  assert.match(text, /Azure Cloud Services Survey/);
  assert.match(text, /SPONSOR/);
  assert.match(text, /Azure product team/);
  assert.match(text, /AUDIENCE/);
  assert.match(text, /Shared front section/);
  for (const topic of g.SURVEYS[3].agenda) assert.ok(text.includes(topic));
  /* The stakeholder is the sponsor: the eight extra questions are
     the Azure product team asking for more of its own survey. */
  assert.match(text, /sponsor is also this study's stakeholder/);
  assert.match(text, /extra-topic answers are not simulated or scored/i);
  /* Naming reaches the level card and the setup banner. */
  assert.match(element('levelGrid').innerHTML, /LEVEL 3 · MEDIUM · THE STAKEHOLDER · AZURE CLOUD SERVICES/);
  assert.match(element('levelBanner').innerHTML, /Survey: Azure Cloud Services Survey/);
  /* No other level's survey leaks into the Level 3 BRD. */
  for (const level of [1, 2, 4, 5, 6]) assert.ok(!text.includes(g.SURVEYS[level].title));
});

test('per-level surveys: Level 3 Insight credits only its own agenda topics', () => {
  const { context: g } = game();
  g.selectLevel(3, false);
  assert.deepEqual(g.agendaTopics(), g.SURVEYS[3].agenda);
  assert.deepEqual(Array.from(g.agendaTopics(), String),
    ['service reliability', 'cost visibility', 'migration effort', 'capability gaps']);
  const run = g.buildRun();
  const counts = g.tally(run);
  const insight = g.computeInsight(counts, run);
  assert.deepEqual(Array.from(insight.topics, t => t.topic), Array.from(g.SURVEYS[3].agenda, String));
  /* Topic keys resolve from the Level 3 survey record, not the
     support map: cost visibility is about Partner Admins and IT
     decision makers on this survey. */
  assert.deepEqual(Array.from(g.topicKeysFor('cost visibility'), String), ['admin', 'itdm']);
});

/* Per-level surveys, phase 4: Level 4 (The Tired List) migrated to
   the Account Team Relationship Survey (ids 401-436), with its full
   BRD record and its own fixed first-play instrument. The level's
   conditions are the study's conditions: a repeatedly surveyed
   audience, a win that requires ending goodwill 35 or higher, and
   report back as the feedback commitment. */
test('per-level surveys: Level 4 bank has the derived structure', () => {
  const { context: g } = game();
  const bank = g.bankForLevel(4);
  assert.equal(bank.length, 36);
  assert.ok(bank.every(q => q.survey === 4));
  assert.ok(bank.every(q => q.id >= 401 && q.id <= 436), 'Level 4 ids live in the 4xx range');
  const sections = {}, tiers = {}, defectCounts = {};
  for (const q of bank) {
    sections[g.sectionOf(q)] = (sections[g.sectionOf(q)] || 0) + 1;
    tiers[g.tierOf(q)] = (tiers[g.tierOf(q)] || 0) + 1;
    if (g.tierOf(q) === 'defective') defectCounts[g.defectOf(q)] = (defectCounts[g.defectOf(q)] || 0) + 1;
  }
  assert.deepEqual(sections, { A: 4, B: 18, C: 6, D: 2, E: 2, F: 4 });
  assert.deepEqual(tiers, { clean: 14, defective: 13, stupid: 5, filler: 4 });
  /* Coverage floor: at least 8 of the 11 classes; the theme-natural
     classes from the scope doc's Level 4 rationale are doubled.
     DOUBLE NEGATIVE is the recorded omission (see the bank header
     in site/index.html). */
  assert.ok(Object.keys(defectCounts).length >= 8, 'at least 8 defect classes present');
  for (const cls of ['SENSITIVE NO ASSURANCE', 'LEADING', 'VAGUE TIMEFRAME']) {
    assert.equal(defectCounts[cls], 2, `${cls} is doubled on Level 4`);
  }
  assert.equal(defectCounts['DOUBLE NEGATIVE'], undefined);
  const core = bank.filter(q => q.core);
  assert.ok(core.length >= 6 && core.length <= 8, 'core set is 6-8');
  /* The core backbone is answerable by every seat, deliberately:
     this level's goodwill economy (start 25, end at 35 or higher)
     cannot carry a restricted core, because a kept restricted item
     charges 6 goodwill per persona group that cannot answer it.
     Restrictions live on non-core items and traps instead. */
  assert.ok(core.every(q => q.answerBy === null), 'Level 4 core items carry no seat restriction');
  /* At least 2 creditable questions per agenda topic, and at least one
     creditable core question per agenda topic. */
  for (const topic of g.SURVEYS[4].agenda) {
    const creditable = bank.filter(q => q.topic === topic && g.tierOf(q) !== 'stupid');
    assert.ok(creditable.length >= 2, `Level 4 agenda topic "${topic}" has 2+ creditable questions`);
    assert.ok(creditable.some(q => q.core), `Level 4 agenda topic "${topic}" has a creditable core question`);
  }
  /* Every fixable defective carries a repaired form; the
     BEYOND KNOWLEDGE item has no wording fix and no repair entry. */
  for (const q of bank) {
    if (g.tierOf(q) !== 'defective') continue;
    if (g.fixVerbFor(q)) assert.ok(g.QUESTION_REPAIRS[q.id], `Q${q.id} has a repaired form`);
    else assert.equal(g.QUESTION_REPAIRS[q.id], undefined, `Q${q.id} has no repair entry`);
  }
  /* The Level 4 bank holds no earlier survey's question and no
     Quick-Challenge-load-bearing id. */
  assert.ok(bank.every(q => !g.QUICK_CHALLENGES.some(ch => [...ch.ids, ...ch.extras].includes(q.id))));
});

test('per-level surveys: Level 4 first play deals its own fixed Relationship instrument', () => {
  const { context: g } = game();
  g.state.levelSeeds = {};
  g.selectLevel(4, false);
  const inst = g.activeQuestions();
  assert.equal(inst.length, 12);
  assert.ok(inst.every(q => q.survey === 4), 'fixed Level 4 instrument is drawn from the Relationship bank');
  assert.equal(inst.filter(q => q.core).length, 6, 'fixed Level 4 instrument carries 6 core');
});

test('per-level surveys: BRD renders the Level 4 study from its survey record', () => {
  const { context: g, element } = game();
  g.selectLevel(4, false);
  g.openBRD();
  const text = element('brdContent').innerHTML;
  assert.match(text, /Account Team Relationship Survey/);
  assert.match(text, /SPONSOR/);
  assert.match(text, /Account Management team/);
  assert.match(text, /AUDIENCE/);
  assert.match(text, /Shared front section/);
  for (const topic of g.SURVEYS[4].agenda) assert.ok(text.includes(topic));
  /* The level's defining conditions are stated as study conditions:
     the repeatedly surveyed audience, the goodwill floor, and
     report back as the feedback commitment that protects future
     response. */
  assert.match(text, /surveyed three times this quarter/);
  assert.match(text, /ending goodwill 35 or higher/);
  assert.match(text, /feedback commitment/);
  assert.match(text, /protects response on the next cycle/);
  /* The evidence mission purpose is rewritten to the survey. */
  assert.match(text, /Judge the account team relationship using the evidence of the people who work with the team/);
  /* Naming reaches the level card and the setup banner. */
  assert.match(element('levelGrid').innerHTML, /LEVEL 4 · HARD · THE TIRED LIST · ACCOUNT TEAM RELATIONSHIP/);
  assert.match(element('levelBanner').innerHTML, /Survey: Account Team Relationship Survey/);
  /* No other level's survey leaks into the Level 4 BRD. */
  for (const level of [1, 2, 3, 5, 6]) assert.ok(!text.includes(g.SURVEYS[level].title));
});

test('per-level surveys: Level 4 Insight credits only its own agenda topics', () => {
  const { context: g } = game();
  g.selectLevel(4, false);
  assert.deepEqual(g.agendaTopics(), g.SURVEYS[4].agenda);
  assert.deepEqual(Array.from(g.agendaTopics(), String),
    ['account team responsiveness', 'trust and candor', 'business value delivered', 'escalation handling', 'renewal intent']);
  const run = g.buildRun();
  const counts = g.tally(run);
  const insight = g.computeInsight(counts, run);
  assert.deepEqual(Array.from(insight.topics, t => t.topic), Array.from(g.SURVEYS[4].agenda, String));
  /* Topic keys resolve from the Level 4 survey record, not the
     support map: escalation handling is about frontline technicians
     and end users on this survey; renewal intent is about executives
     and IT decision makers. */
  assert.deepEqual(Array.from(g.topicKeysFor('escalation handling'), String), ['tech', 'end']);
  assert.deepEqual(Array.from(g.topicKeysFor('renewal intent'), String), ['exec', 'itdm']);
});

/* Per-level surveys, phase 5: Level 5 (Global Fieldwork) migrated to
   the General Perceptions of Microsoft Survey (ids 501-536) and
   Level 6 (The Big Quarter) to the Enterprise Relationship Flagship
   Annual Survey (ids 601-636), each with its full BRD record and its
   own fixed first-play instrument. The legacy fallback's removal is
   asserted in the rewritten fallback test above. */
test('per-level surveys: Level 5 bank has the derived structure', () => {
  const { context: g } = game();
  const bank = g.bankForLevel(5);
  assert.equal(bank.length, 36);
  assert.ok(bank.every(q => q.survey === 5));
  assert.ok(bank.every(q => q.id >= 501 && q.id <= 536), 'Level 5 ids live in the 5xx range');
  const sections = {}, tiers = {}, defectCounts = {};
  for (const q of bank) {
    sections[g.sectionOf(q)] = (sections[g.sectionOf(q)] || 0) + 1;
    tiers[g.tierOf(q)] = (tiers[g.tierOf(q)] || 0) + 1;
    if (g.tierOf(q) === 'defective') defectCounts[g.defectOf(q)] = (defectCounts[g.defectOf(q)] || 0) + 1;
  }
  assert.deepEqual(sections, { A: 4, B: 18, C: 6, D: 2, E: 2, F: 4 });
  assert.deepEqual(tiers, { clean: 14, defective: 13, stupid: 5, filler: 4 });
  /* Coverage floor: at least 8 of the 11 classes; the theme-natural
     classes from the scope doc's Level 5 rationale are doubled.
     RECALL OVERLOAD is the recorded omission (see the bank header
     in site/index.html): a perception has no events to recall. */
  assert.ok(Object.keys(defectCounts).length >= 8, 'at least 8 defect classes present');
  for (const cls of ['LEADING', 'VAGUE TIMEFRAME', 'DOUBLE-BARRELED']) {
    assert.equal(defectCounts[cls], 2, `${cls} is doubled on Level 5`);
  }
  assert.equal(defectCounts['RECALL OVERLOAD'], undefined);
  const core = bank.filter(q => q.core);
  assert.ok(core.length >= 6 && core.length <= 8, 'core set is 6-8');
  /* The perception pattern inverts answerability: the core is
     answerable by every seat, because a perception needs no system
     access. The survey's one BEYOND KNOWLEDGE item is a factual
     claim smuggled into a perception survey. */
  assert.ok(core.every(q => q.answerBy === null), 'Level 5 core items carry no seat restriction');
  /* At least 2 creditable questions per agenda topic, and at least one
     creditable core question per agenda topic. */
  for (const topic of g.SURVEYS[5].agenda) {
    const creditable = bank.filter(q => q.topic === topic && g.tierOf(q) !== 'stupid');
    assert.ok(creditable.length >= 2, `Level 5 agenda topic "${topic}" has 2+ creditable questions`);
    assert.ok(creditable.some(q => q.core), `Level 5 agenda topic "${topic}" has a creditable core question`);
  }
  /* Every fixable defective carries a repaired form; the
     BEYOND KNOWLEDGE item has no wording fix and no repair entry. */
  for (const q of bank) {
    if (g.tierOf(q) !== 'defective') continue;
    if (g.fixVerbFor(q)) assert.ok(g.QUESTION_REPAIRS[q.id], `Q${q.id} has a repaired form`);
    else assert.equal(g.QUESTION_REPAIRS[q.id], undefined, `Q${q.id} has no repair entry`);
  }
  /* The Level 5 bank holds no earlier survey's question and no
     Quick-Challenge-load-bearing id. */
  assert.ok(bank.every(q => !g.QUICK_CHALLENGES.some(ch => [...ch.ids, ...ch.extras].includes(q.id))));
});

test('per-level surveys: Level 5 first play deals its own fixed Perceptions instrument', () => {
  const { context: g } = game();
  g.state.levelSeeds = {};
  g.selectLevel(5, false);
  const inst = g.activeQuestions();
  assert.equal(inst.length, 12);
  assert.ok(inst.every(q => q.survey === 5), 'fixed Level 5 instrument is drawn from the Perceptions bank');
  assert.equal(inst.filter(q => q.core).length, 6, 'fixed Level 5 instrument carries 6 core');
});

test('per-level surveys: BRD renders the Level 5 study from its survey record', () => {
  const { context: g, element } = game();
  g.selectLevel(5, false);
  g.openBRD();
  const text = element('brdContent').innerHTML;
  assert.match(text, /General Perceptions of Microsoft Survey/);
  assert.match(text, /SPONSOR/);
  assert.match(text, /Brand and Perceptions research team/);
  assert.match(text, /AUDIENCE/);
  assert.match(text, /Shared front section/);
  for (const topic of g.SURVEYS[5].agenda) assert.ok(text.includes(topic));
  /* The level's defining conditions are stated as study conditions:
     the tracker is the survey that runs globally, localization is
     its fielding design, and an unread invitation is a fielding
     failure rather than a finding. */
  assert.match(text, /40% English-speaking/);
  assert.match(text, /localized invite \(4 cr\)/);
  assert.match(text, /fielding failure, not a finding/);
  /* The evidence mission purpose is rewritten to the survey. */
  assert.match(text, /Measure perceptions of Microsoft using the evidence of the people who hold them/);
  /* Naming reaches the level card and the setup banner. */
  assert.match(element('levelGrid').innerHTML, /LEVEL 5 · MEDIUM · GLOBAL FIELDWORK · GENERAL PERCEPTIONS OF MICROSOFT/);
  assert.match(element('levelBanner').innerHTML, /Survey: General Perceptions of Microsoft Survey/);
  /* No other level's survey leaks into the Level 5 BRD. */
  for (const level of [1, 2, 3, 4, 6]) assert.ok(!text.includes(g.SURVEYS[level].title));
});

test('per-level surveys: Level 5 Insight credits only its own agenda topics', () => {
  const { context: g } = game();
  g.selectLevel(5, false);
  assert.deepEqual(g.agendaTopics(), g.SURVEYS[5].agenda);
  assert.deepEqual(Array.from(g.agendaTopics(), String),
    ['overall favorability', 'trust', 'innovation perception', 'value perception', 'AI leadership perception']);
  const run = g.buildRun();
  const counts = g.tally(run);
  const insight = g.computeInsight(counts, run);
  assert.deepEqual(Array.from(insight.topics, t => t.topic), Array.from(g.SURVEYS[5].agenda, String));
  /* Topic keys resolve from the Level 5 survey record, not the
     support map: AI leadership perception is about IT decision
     makers and executives on this survey; value perception is
     about administrator and IT decision maker seats. */
  assert.deepEqual(Array.from(g.topicKeysFor('AI leadership perception'), String), ['itdm', 'exec']);
  assert.deepEqual(Array.from(g.topicKeysFor('value perception'), String), ['admin', 'itdm']);
});

test('per-level surveys: Level 6 bank has the derived structure', () => {
  const { context: g } = game();
  const bank = g.bankForLevel(6);
  assert.equal(bank.length, 36);
  assert.ok(bank.every(q => q.survey === 6));
  assert.ok(bank.every(q => q.id >= 601 && q.id <= 636), 'Level 6 ids live in the 6xx range');
  const sections = {}, tiers = {}, defectCounts = {};
  for (const q of bank) {
    sections[g.sectionOf(q)] = (sections[g.sectionOf(q)] || 0) + 1;
    tiers[g.tierOf(q)] = (tiers[g.tierOf(q)] || 0) + 1;
    if (g.tierOf(q) === 'defective') defectCounts[g.defectOf(q)] = (defectCounts[g.defectOf(q)] || 0) + 1;
  }
  assert.deepEqual(sections, { A: 4, B: 18, C: 6, D: 2, E: 2, F: 4 });
  assert.deepEqual(tiers, { clean: 14, defective: 13, stupid: 5, filler: 4 });
  /* Coverage floor: at least 8 of the 11 classes; the theme-natural
     classes from the scope doc's Level 6 rationale are doubled.
     VAGUE TIMEFRAME is the recorded omission (see the bank header
     in site/index.html): the flagship's items are anchored to the
     agreement term and the annual cycle by construction. */
  assert.ok(Object.keys(defectCounts).length >= 8, 'at least 8 defect classes present');
  for (const cls of ['SENSITIVE NO ASSURANCE', 'GRID BURDEN', 'RECALL OVERLOAD']) {
    assert.equal(defectCounts[cls], 2, `${cls} is doubled on Level 6`);
  }
  assert.equal(defectCounts['VAGUE TIMEFRAME'], undefined);
  const core = bank.filter(q => q.core);
  assert.ok(core.length >= 6 && core.length <= 8, 'core set is 6-8');
  /* The core backbone is answerable by every seat, deliberately, on
     the phase-4 reasoning: the agenda items are the strategy,
     value, and renewal judgments the Blast list exists to give.
     Restrictions live on the commercial item, the jargon item, and
     the beyond-knowledge trap instead. */
  assert.ok(core.every(q => q.answerBy === null), 'Level 6 core items carry no seat restriction');
  /* At least 2 creditable questions per agenda topic, and at least one
     creditable core question per agenda topic. */
  for (const topic of g.SURVEYS[6].agenda) {
    const creditable = bank.filter(q => q.topic === topic && g.tierOf(q) !== 'stupid');
    assert.ok(creditable.length >= 2, `Level 6 agenda topic "${topic}" has 2+ creditable questions`);
    assert.ok(creditable.some(q => q.core), `Level 6 agenda topic "${topic}" has a creditable core question`);
  }
  /* Every fixable defective carries a repaired form; the
     BEYOND KNOWLEDGE item has no wording fix and no repair entry. */
  for (const q of bank) {
    if (g.tierOf(q) !== 'defective') continue;
    if (g.fixVerbFor(q)) assert.ok(g.QUESTION_REPAIRS[q.id], `Q${q.id} has a repaired form`);
    else assert.equal(g.QUESTION_REPAIRS[q.id], undefined, `Q${q.id} has no repair entry`);
  }
  /* The Level 6 bank holds no earlier survey's question and no
     Quick-Challenge-load-bearing id. */
  assert.ok(bank.every(q => !g.QUICK_CHALLENGES.some(ch => [...ch.ids, ...ch.extras].includes(q.id))));
});

test('per-level surveys: Level 6 first play deals its own fixed Flagship instrument', () => {
  const { context: g } = game();
  g.state.levelSeeds = {};
  g.selectLevel(6, false);
  const inst = g.activeQuestions();
  assert.equal(inst.length, 12);
  assert.ok(inst.every(q => q.survey === 6), 'fixed Level 6 instrument is drawn from the Flagship bank');
  assert.equal(inst.filter(q => q.core).length, 6, 'fixed Level 6 instrument carries 6 core');
});

test('per-level surveys: BRD renders the Level 6 study from its survey record', () => {
  const { context: g, element } = game();
  g.selectLevel(6, false);
  g.openBRD();
  const text = element('brdContent').innerHTML;
  assert.match(text, /Enterprise Relationship Flagship Annual Survey/);
  assert.match(text, /SPONSOR/);
  assert.match(text, /Enterprise Relationship team/);
  assert.match(text, /AUDIENCE/);
  assert.match(text, /Shared front section/);
  for (const topic of g.SURVEYS[6].agenda) assert.ok(text.includes(topic));
  /* The level's defining conditions are stated as study conditions:
     the flagship annual's single fielding, the stakeholder request,
     and the Executive Blast audience. */
  assert.match(text, /one fielding a year/);
  assert.match(text, /stakeholder request for eight extra questions/);
  assert.match(text, /Executive Blast is the available audience for this study/);
  /* The evidence mission purpose is rewritten to the survey. */
  assert.match(text, /Judge the enterprise relationship using the evidence of the decision makers who own it/);
  /* Naming reaches the level card and the setup banner. */
  assert.match(element('levelGrid').innerHTML, /LEVEL 6 · HARD · THE BIG QUARTER · ENTERPRISE RELATIONSHIP/);
  assert.match(element('levelBanner').innerHTML, /Survey: Enterprise Relationship Flagship Annual Survey/);
  /* No other level's survey leaks into the Level 6 BRD. */
  for (const level of [1, 2, 3, 4, 5]) assert.ok(!text.includes(g.SURVEYS[level].title));
});

test('per-level surveys: Level 6 Insight credits only its own agenda topics', () => {
  const { context: g } = game();
  g.selectLevel(6, false);
  assert.deepEqual(g.agendaTopics(), g.SURVEYS[6].agenda);
  assert.deepEqual(Array.from(g.agendaTopics(), String),
    ['overall relationship', 'trust', 'business value', 'renewal intent', 'strategic alignment']);
  assert.equal(g.insightGate(), 70, 'the flagship keeps the raised Insight gate');
  const run = g.buildRun();
  const counts = g.tally(run);
  const insight = g.computeInsight(counts, run);
  assert.deepEqual(Array.from(insight.topics, t => t.topic), Array.from(g.SURVEYS[6].agenda, String));
  /* Topic keys resolve from the Level 6 survey record: strategic
     alignment is about executives and IT decision makers, and
     commercial specifics sit with administrator seats. */
  assert.deepEqual(Array.from(g.topicKeysFor('strategic alignment'), String), ['exec', 'itdm']);
  assert.deepEqual(Array.from(g.topicKeysFor('commercial process'), String), ['admin', 'itdm']);
});

test('medallion: campaign report carries the list preparation ledger; quick report does not', () => {
  const { context: g, element } = game();
  g.selectLevel(1, false);
  g.state.validation = 'full'; g.state.dedupe = true; g.state.suppression = true;
  g.state.consolidate = true; g.state.repair = true;
  g.startRun(); g.showReport();
  const html = element('report').innerHTML;
  assert.match(html, /LIST PREPARATION · BRONZE TO GOLD/);
  assert.match(html, /Records in \(Bronze\)/);
  assert.match(html, /Promoted to the contact master \(Gold\)/);
  assert.match(html, /List health at launch \(before validation\)/);

  const q = game();
  q.context.startQuickChallenge(0, 'V000');
  q.context.startRun(); q.context.showReport();
  assert.doesNotMatch(q.element('report').innerHTML, /LIST PREPARATION/);
});
