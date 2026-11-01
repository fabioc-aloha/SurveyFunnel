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

test('a mandatory BRD twist makes its extra uncuttable and repair-only', () => {
  for (let index = 0; index < 3; index++) {
    const { context: g, element } = game();
    startQCWithVariant(g, index, 0);
    const variant = g.quickVariant();
    assert.equal(variant.type, 'mandatory');
    /* The action path refuses the cut, exactly like a core card. */
    assert.equal(g.applyCut(variant.qid), 'required');
    clickCut(g, variant.qid);
    assert.equal(g.state.qstate[variant.qid], 'keep', `Q${variant.qid} must refuse its cut`);
    g.renderQuestions();
    assert.match(element('qGrid').innerHTML, /BRD REQUIRED/);
    /* The verdict re-checks: even a state set past the guard (the
       cut applied directly) cannot win with the required extra cut,
       although the identical line wins under other briefs. */
    applyQuickLine(g, index, 'intended');
    g.state.qstate[variant.qid] = 'cut';
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

/* The raised bars and time ceilings. Each enforcement line below is a
   line that wins under the base rules (the companion tests prove the
   same shapes win under briefs they satisfy); it must lose here on
   the twist alone, with the report ruling NOT MET. Each winning line
   stays inside the unchanged 48-credit budget. */
const QC_TWIST_LINES = [
  /* challenge, variant, winning actions, violating actions */
  [0, 1, 'cut-extras', 'intended'],   /* reporting threshold 17.5%: intended reaches exactly 17.5% */
  [0, 2, { 26: 'simplify', 57: 'cut', 22: 'cut' }, 'intended'], /* short shift 1.5 min: intended reads 1.88 */
  [1, 1, 'cut-extras', 'intended'],   /* four-minute ceiling: intended reads 5.0 min */
  [1, 2, { 7: 'cut', 51: 'simplify', 68: 'cut' }, 'intended'],  /* reach bar 20%: intended reaches exactly 20% */
  [2, 1, 'intended', 'cut-extras'],   /* audit bar 95: cutting every extra scores quality 93 */
  [2, 2, 'cut-extras', 'intended']    /* one-minute rule 1.1 min: intended reads 1.25 */
];
function applyTwistLine(g, index, line) {
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
    g.startRun();
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
  assert.equal(g.instrumentFloor(), 6);
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
  assert.ok(examples.every(example => run.sprites.some(sp =>
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
  g.activeQuestions().forEach(q => { g.state.qstate[q.id] = 'cut'; });
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
  /* Adapted for the cut floor: Quick Challenge cards are all core, so their
     CUT buttons are locked by design now. The animation scenario therefore
     runs on a legal Level 1 non-core cut, then crosses into and out of a
     Quick Challenge exactly as before. */
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

test('core questions cannot be cut through the question card controls', () => {
  const { context: g, element } = game();
  g.selectLevel(1, false);
  assert.equal(g.instrumentFloor(), 6);
  const core = g.activeQuestions().filter(q => q.core);
  assert.ok(core.length >= 6);
  for (const q of core) {
    clickCut(g, q.id);
    assert.equal(g.state.qstate[q.id], 'keep', `Q${q.id} is core and must stay`);
  }
  assert.equal(g.keptQuestions().length, g.activeQuestions().length);
  g.renderQuestions();
  const grid = element('qGrid').innerHTML;
  const cutTag = id => grid.match(new RegExp(`<button[^>]*data-q="${id}"[^>]*data-act="cut"[^>]*>`))[0];
  for (const q of core) {
    assert.match(cutTag(q.id), /disabled/, `Q${q.id} CUT button must render disabled`);
    assert.match(cutTag(q.id), /aria-label="Cut unavailable: Core questions cannot be cut"/);
  }
  const nonCore = g.activeQuestions().find(q => !q.core);
  assert.doesNotMatch(cutTag(nonCore.id), /disabled/, 'non-core CUT stays available above the floor');
  assert.match(grid, /LOCKED · CORE · CANNOT BE CUT/);
});

test('cutting stops at the six-question floor and resumes after a restore or an add', () => {
  const { context: g, element } = game();
  g.selectLevel(1, false);
  const nonCore = g.activeQuestions().filter(q => !q.core);
  assert.equal(nonCore.length, 6);
  for (const q of nonCore) clickCut(g, q.id);
  assert.equal(g.keptQuestions().length, 6);
  /* Further cut attempts through the path change nothing, however often repeated. */
  for (let round = 0; round < 2; round++) {
    for (const q of g.keptQuestions()) {
      clickCut(g, q.id);
      assert.equal(g.state.qstate[q.id], 'keep', `Q${q.id} must not be cut at the floor`);
    }
  }
  assert.equal(g.keptQuestions().length, 6);
  /* Floor state renders explained: every CUT disabled, stage note at the minimum. */
  g.renderQuestions();
  const grid = element('qGrid').innerHTML;
  const cutTags = grid.match(/<button[^>]*data-act="cut"[^>]*>/g);
  assert.ok(cutTags.length >= 6);
  assert.ok(cutTags.every(tag => /disabled/.test(tag)), 'every CUT button is disabled at the floor');
  assert.match(element('qFloorNote').innerHTML, /MINIMUM INSTRUMENT REACHED/);
  assert.match(element('qFloorNote').innerHTML, /MINIMUM IS 6/);
  /* RESTORE (the tray handler's own assignment) lifts the instrument off
     the floor, and cutting that question works again. */
  const restored = nonCore[0];
  g.state.qstate[restored.id] = 'keep';
  assert.equal(g.keptQuestions().length, 7);
  clickCut(g, restored.id);
  assert.equal(g.state.qstate[restored.id], 'cut');
  assert.equal(g.keptQuestions().length, 6);
  /* ADD FROM BANK (the bank button's own toggle) does the same. */
  const addable = g.addBankQuestions().filter(q => !q.core);
  assert.ok(addable.length > 0, 'the dealt bank offers a non-core question to add');
  const added = addable[0];
  g.state.added[added.id] = true;
  assert.equal(g.keptQuestions().length, 7);
  clickCut(g, added.id);
  assert.equal(g.state.qstate[added.id], 'cut');
  assert.equal(g.keptQuestions().length, 6);
});

test('a sub-floor instrument is flagged in the checklist and the launch button refuses', () => {
  const { context: g, element } = game();
  g.selectLevel(1, false);
  g.renderReadout();
  assert.notEqual(element('launchBtn').disabled, true);
  /* Force a sub-floor state directly, as a legacy or edge path could:
     the cut path itself can no longer produce this. */
  g.state.qstate[1] = 'cut'; g.state.qstate[2] = 'cut'; g.state.qstate[3] = 'cut';
  for (const q of g.activeQuestions().filter(q => !q.core)) g.state.qstate[q.id] = 'cut';
  assert.equal(g.keptQuestions().length, 3);
  g.renderReadout();
  assert.match(element('launchCheck').innerHTML, /at least 6 questions kept[\s\S]*?TO DO/);
  assert.equal(element('launchBtn').disabled, true);
  assert.match(element('launchBtn').textContent, /TOO FEW QUESTIONS · MIN 6/);
  /* Defense in depth: a direct startRun call in the same state is also
     refused, with no run started and no charge taken. */
  const spentBefore = g.state.spentBefore, attemptBefore = g.state.attempt;
  g.startRun();
  assert.equal(g.state.running, false);
  assert.equal(g.state.spentBefore, spentBefore);
  assert.equal(g.state.attempt, attemptBefore);
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

test('the floor itself refuses a cut at six kept on a low-core instrument', () => {
  const { context: g, element } = game();
  g.selectLevel(1, false);
  /* Current deals always carry exactly 6 core questions, so the core rule
     alone bounds them; the floor branch guards any deal with fewer core.
     Construct one directly: 2 core + 6 non-core from the bank. */
  const core = g.QUESTION_BANK.filter(q => q.core).slice(0, 2);
  const nonCore = g.QUESTION_BANK.filter(q => !q.core).slice(0, 6);
  g.state.instrument = core.concat(nonCore);
  for (const q of g.state.instrument) g.state.qstate[q.id] = 'keep';
  assert.equal(g.instrumentFloor(), 6);
  assert.equal(g.keptQuestions().length, 8);
  clickCut(g, nonCore[0].id);
  clickCut(g, nonCore[1].id);
  assert.equal(g.keptQuestions().length, 6);
  clickCut(g, nonCore[2].id);
  assert.equal(g.state.qstate[nonCore[2].id], 'keep', 'the floor, not the core rule, must refuse this cut');
  assert.equal(g.keptQuestions().length, 6);
  g.renderQuestions();
  const tag = element('qGrid').innerHTML.match(new RegExp(`<button[^>]*data-q="${nonCore[2].id}"[^>]*data-act="cut"[^>]*>`))[0];
  assert.match(tag, /disabled/);
  assert.match(tag, /aria-label="Cut unavailable: Minimum instrument reached/);
});

test('quick challenge floor is its core count: extras cut down to the BRD set and no further', () => {
  const { context: g, element } = game();
  /* A non-mandatory twist, so every extra's cut is judged by the
     floor alone, exactly as this test intends. */
  startQCWithVariant(g, 0, 1);
  assert.equal(g.activeQuestions().length, 6);
  assert.equal(g.instrumentFloor(), 3);
  /* Core (BRD) cards refuse with reason "core" through the action path. */
  for (const q of g.activeQuestions().filter(q => q.core)) {
    assert.equal(g.applyCut(q.id), 'core');
    clickCut(g, q.id);
    assert.equal(g.state.qstate[q.id], 'keep', `BRD Q${q.id} must not be cut`);
  }
  /* Extras cut freely until only the core set remains. */
  const extras = g.activeQuestions().filter(q => !q.core);
  for (const q of extras) {
    clickCut(g, q.id);
    assert.equal(g.state.qstate[q.id], 'cut', `extra Q${q.id} must be cuttable`);
  }
  assert.equal(g.keptQuestions().length, 3);
  assert.ok(g.keptQuestions().every(q => q.core));
  /* The floor note states the challenge's actual minimum. */
  g.renderQuestions();
  assert.match(element('qFloorNote').innerHTML, /MINIMUM IS 3 \(THE THREE BRD CARDS\)/);
  /* The floor branch itself: swap one kept card synthetically (legal
     play cannot cut a core card) so a non-core card is kept at the
     floor; its cut must be refused with reason "floor". */
  const core0 = g.activeQuestions().find(q => q.core);
  g.state.qstate[core0.id] = 'cut';
  g.state.qstate[extras[0].id] = 'keep';
  assert.equal(g.keptQuestions().length, 3);
  assert.equal(g.applyCut(extras[0].id), 'floor');
  assert.equal(g.state.qstate[extras[0].id], 'keep');
  /* Campaign behavior is untouched: leaving restores a Level 1
     instrument whose floor is still six. */
  g.leaveQuickChallenge();
  assert.equal(g.instrumentFloor(), 6);
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

test('Level 1 default still misses the target with two completions from forty sends', () => {
  const { context: g } = game();
  g.selectLevel(1, false);
  const run = g.buildRun();
  const count = g.tally(run);
  assert.equal(count.sent, 40);
  assert.equal(count.completed, 2);
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
  g.state.qstate[11] = 'keep';
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
    assert.ok(text.includes(`above ${Math.round(g.curLevel().target * 100)}%`));
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
  assert.match(element('report').innerHTML, /cheapest possible send costs 45/);
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
/* UI-legal winning corpus, regenerated under the cut floor (2026-11-01).
   Every line keeps all core questions and at least the instrument floor,
   and the winnability test below applies each setup through the game's
   own card handlers. Generation: the old fixtures were legalized (cut
   core questions restored with class-correct fixes, kept counts topped
   up to the floor), then each seed was searched over legal kept sets,
   bank adds, repairs, invitation, reminders, and escapes (about 5,800
   plan evaluations in total). Levels 1, 2, 3, 5, and 6 supply a winner
   for the fixed start and all 64 seeded draws; Level 4's goodwill gate
   rejected the remaining draws in the searched space, so it supplies 39. */
const LEGAL_WINNER_MINIMUMS = { 1: 65, 2: 65, 3: 65, 4: 39, 5: 65, 6: 65 };
test('goodwill ledger identifies report-back rewards and stakeholder penalties', () => {
  const { context: g, element } = game();
  g.selectLevel(4, false);
  g.state.reportBack = true;
  /* Legalized under the cut floor: core Q3 stays kept, so the launched
     instrument is the six core questions. The ledger assertions below
     are unchanged. */
  g.activeQuestions().forEach(q => { g.state.qstate[q.id] = [1, 2, 3, 4, 6, 9].includes(q.id) ? 'keep' : 'cut'; });
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
    const { context: g, element } = game();
    const setups = winningSetups.filter(setup => setup.level === level);
    assert.ok(setups.length >= LEGAL_WINNER_MINIMUMS[level],
      `Level ${level} corpus supplies ${setups.length} legal winners, expected at least ${LEGAL_WINNER_MINIMUMS[level]}`);
    assert.equal(new Set(setups.map(setup => setup.seed)).size, setups.length);
    assert.ok(setups.some(setup => setup.seed === 'fixed'));
    for (const setup of setups) {
      const label = `Level ${level}, instrument ${setup.seed}`;
      g.state.randomMode = false;
      g.state.levelSeeds = setup.seed === 'fixed' ? {} : { [level]: setup.seed };
      g.selectLevel(level, false);
      assert.equal(g.state.spentBefore, 0, label);
      assert.equal(g.state.attempt, 1, label);
      g.state.validation = 'full'; g.state.dedupe = true; g.state.suppression = true;
      g.state.stakeholder = level === 3 || level === 6 ? 'pushback' : null;
      g.state.reportBack = level === 4;
      g.state.localization = level === 5;
      g.state.langChoice = level === 5 ? 'localized' : 'en';
      g.state.abEnabled = level === 2;
      g.state.invite = g.INVITES.find(invite => invite.id === setup.invite);
      g.state.abInvite = g.INVITES.find(invite => invite.id !== setup.invite).id;
      g.state.reminders = setup.reminders; g.state.escapes = setup.escapes;
      /* Corpus legality: every core question is kept, so no recorded
         setup can require a cut the UI would refuse. */
      assert.ok(g.activeQuestions().every(q => !q.core || setup.kept.includes(q.id)), label);
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
      assert.ok(g.activeQuestions().every(q => !q.core || g.state.qstate[q.id] !== 'cut'), label);
      assert.ok(g.keptQuestions().length >= g.instrumentFloor(), label);
      assert.ok(setup.kept.every(id => g.activeQuestions().some(q => q.id === id)), label);
      assert.ok(setup.added.every(id => g.addBankQuestions().some(q => q.id === id)), label);
      assert.equal(g.budgetMath().total, setup.cost, label);
      assert.ok(g.budgetMath().total <= g.BUDGET_TOTAL, label);
      g.startRun(); g.showReport();
      assert.equal(g.state.campaignWon[level], true, label);
      assert.ok(g.state.lastRound.rate > g.curLevel().target, label);
      assert.ok(g.state.lastRound.quality >= 60, label);
      assert.ok(g.state.lastRound.insight >= g.insightGate(), label);
      if (level === 4) assert.ok(g.state.goodwillCarry >= 35, label);
      assert.match(element('report').innerHTML, /ROUND WON/, label);
      assert.match(element('report').innerHTML, /id="nextLevelBtn"/, label);
    }
  });
}

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
    /* Same tally counts, same scale, same rounding points as the funnel
       paragraph the report prints: the section can never disagree with it. */
    assert.equal(bb.total, Math.round((c.bouncedHard + c.bouncedSoft) * g.runData.scale), label);
    assert.equal(bb.hard, Math.round(c.bouncedHard * g.runData.scale), label);
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
  g.state.seg = g.SEGMENTS.find(s => s.id === 'fresh');
  g.state.validation = 'full';
  let found = false;
  for (const invite of g.INVITES) {
    for (const reminders of [0, 1, 2]) {
      g.state.invite = invite; g.state.reminders = reminders;
      g.startRun(); g.showReport();
      const c = g.tally(g.runData);
      if (c.bouncedHard + c.bouncedSoft === 0) { found = true; break; }
    }
    if (found) break;
  }
  assert.ok(found, 'a zero-bounce configuration is reachable on Fresh with full validation');
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
    /* Independent recount straight off the raw sprite events: a wave's
       recovered opens are the sprites buildRun tagged via that wave
       whose OPENED gate event survived into the final event list. */
    const opens = [];
    g.runData.sprites.forEach(sp => {
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

test('reminder presentation leaves run tallies bit-identical to the pre-change engine', () => {
  /* Tallies pinned from the engine at HEAD 787658a, before the piles
     and reminder-presentation change. buildRun, tally, and every
     scoring input are presentation-untouched, so any drift here means
     the display work leaked into the simulation. */
  const pinned = [
    {
      name: 'blast/skip/rem2/generic',
      setup(g) {
        g.state.seg = g.SEGMENTS.find(s => s.id === 'blast');
        g.state.validation = 'skip'; g.state.reminders = 2;
        g.state.invite = g.INVITES.find(i => i.id === 'generic');
      },
      expect: { sent: 31, delivered: 24, bouncedHard: 4, bouncedSoft: 1, opened: 9, started: 7, completed: 0 }
    },
    {
      name: 'stale/partial/rem2/escapes',
      setup(g) {
        g.state.seg = g.SEGMENTS.find(s => s.id === 'stale');
        g.state.validation = 'partial'; g.state.reminders = 2; g.state.escapes = true;
      },
      expect: { sent: 40, delivered: 37, bouncedHard: 2, bouncedSoft: 1, opened: 26, started: 22, completed: 0 }
    },
    {
      name: 'fresh/full/rem1/default-invite',
      setup(g) { g.state.validation = 'full'; g.state.reminders = 1; },
      expect: { sent: 40, delivered: 39, bouncedHard: 1, bouncedSoft: 0, opened: 24, started: 22, completed: 7 }
    }
  ];
  for (const pin of pinned) {
    const { context: g } = game();
    g.selectLevel(1, false);
    pin.setup(g);
    g.startRun();
    const c = g.tally(g.runData);
    for (const key of Object.keys(pin.expect)) {
      assert.equal(c[key], pin.expect[key], `${pin.name}: tally.${key} must not drift`);
    }
  }
});

test('invite stage names the reminder as an email to people who have not opened yet, and the run screen carries both piles', () => {
  const html = readFileSync(join(root, 'site', 'index.html'), 'utf8');
  assert.match(html, /Reminder emails:/);
  assert.match(html, /goes only to people who have not opened yet/);
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
  const unopened = Math.round((c.delivered - c.opened) * g.runData.scale);
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

test('THE LATE QUESTION: uncuttable, carried or repaired into a genuine second wave', () => {
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
  /* The action path refuses its cut, like a required card. */
  assert.equal(g.applyCut(comp.qid), 'late');
  clickCut(g, comp.qid);
  assert.equal(g.state.qstate[comp.qid], 'keep');
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

test('THE LATE QUESTION: carrying it broken past the audit bar flips a win, repairing it holds', () => {
  /* Risk path: wave 1 wins under QC3's audit twist (quality 95+). */
  const { context: g, element } = game();
  startQCWithComp(g, 2, 1, 'late');
  const comp = g.state.quickChallenge.comp;
  applyQuickLine(g, 2, 'intended');
  g.startRun();
  g.showReport();
  assert.match(element('report').innerHTML, /QUICK CHALLENGE · WON/);
  assert.equal(g.state.quickChallenge.wave1.quality, 100);
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
  assert.equal(g.instrumentFloor(), 6);
});

/* ---- Manager mood machine: presentation only. The machine reads
   quantities the run already tracks; these tests drive it as a unit
   with synthetic pace parameters, then against real built runs. ---- */

test('agitated manager map keeps the headset and only reworks the face', () => {
  const { context: g } = game();
  const R = map => map.map(row => [...row].map((c, x) => c === 'R' ? x : -1).filter(x => x >= 0).join(',')).join('|');
  assert.equal(g.MGR_NORMAL.length, 13);
  assert.equal(g.MGR_PUMP.length, 13);
  assert.equal(g.MGR_SAD.length, 11);
  assert.equal(g.MGR_AGITATED.length, 13, 'agitated matches NORMAL/PUMP height');
  for (const map of [g.MGR_NORMAL, g.MGR_PUMP, g.MGR_SAD, g.MGR_AGITATED]) {
    for (const row of map) assert.equal(row.length, 14, 'every mood map is 14 cells wide');
  }
  assert.equal(R(g.MGR_AGITATED), R(g.MGR_NORMAL), 'headset cells are exactly NORMAL\u2019s');
  g.MGR_AGITATED.forEach((row, y) => {
    if (y === 3 || y === 4 || y === 6) return; /* brows and mouth rows carry the expression */
    assert.equal(row, g.MGR_NORMAL[y], `row ${y} is byte-identical to NORMAL`);
  });
  assert.notEqual(g.MGR_AGITATED[3], g.MGR_NORMAL[3], 'brow row differs');
  assert.notEqual(g.MGR_AGITATED[6], g.MGR_NORMAL[6], 'mouth row differs');
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
  assert.equal(bp.sent, 31);
  assert.equal(bp.needed, 4, 'floor(0.12 x 31) + 1 finishes beat the Level 1 target');
  assert.equal(bp.firstFinishT, g.RUN_MS, 'the pinned blast run finishes nobody: the window collapses to RUN_MS');
  assert.equal(bp.lastFinishT, g.RUN_MS);
  assert.ok(g.moodMachine, 'setupStage armed a mood machine for the run');
  assert.equal(g.moodMachine.params.needed, 4);
  assert.equal(element('mgrRun').innerHTML, g.pixelHTML(g.MGR_NORMAL, 4).html, 'the run figure starts NORMAL');
  assert.equal(element('mgrRun').className, 'pixelbox', 'no shake class at rest');

  const second = game();
  const g2 = second.context;
  g2.selectLevel(1, false);
  g2.state.validation = 'full'; g2.state.reminders = 1;
  g2.startRun();
  const fp = g2.moodParamsForRun(g2.runData);
  assert.equal(fp.sent, 40);
  assert.equal(fp.needed, 5, 'floor(0.12 x 40) + 1');
  const times = [];
  g2.runData.sprites.forEach(sp => sp.events.forEach(e => { if (e.type === 'finish') times.push(e.t); }));
  assert.equal(times.length, 7, 'the pinned fresh run finishes seven');
  assert.equal(fp.firstFinishT, Math.min.apply(null, times));
  assert.equal(fp.lastFinishT, Math.max.apply(null, times));
});
