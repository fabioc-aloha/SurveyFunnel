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

test('Quick Challenge deals three defects with affordable repairs and fixed preparation', () => {
  const { context: g } = game();
  assert.equal(typeof g.startQuickChallenge, 'function');
  for (let index = 0; index < 3; index++) {
    g.startQuickChallenge(index);
    assert.equal(g.activeQuestions().length, 3);
    assert.equal(g.agendaTopics().length, new Set(g.activeQuestions().map(q => q.topic)).size);
    assert.ok(g.activeQuestions().every(q => g.defectOf(q) !== 'CLEAN'));
    assert.equal(g.BUDGET_TOTAL, 40);
    assert.equal(g.addBankQuestions().length, 0);
    assert.equal(g.state.validation, 'full');
    assert.equal(g.state.dedupe, true);
    assert.equal(g.state.suppression, true);
    g.activeQuestions().forEach(q => { g.state.qstate[q.id] = 'simplify'; });
    assert.ok(g.budgetMath().total <= 40);
    const run = g.buildRun();
    const count = g.tally(run);
    assert.ok(count.completed > count.sent * 0.12, `Challenge ${index} must be winnable`);
    assert.ok(g.computeInsight(count, run).score >= 60);
    g.startRun();
    g.showReport();
    assert.match(g.document.getElementById('report').innerHTML, /QUICK CHALLENGE · WON/);
  }
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

test('quick challenge floor equals its three dealt questions, so cutting is fully locked', () => {
  const { context: g } = game();
  g.startQuickChallenge(0);
  assert.equal(g.activeQuestions().length, 3);
  assert.equal(g.instrumentFloor(), 3);
  for (const q of g.activeQuestions()) {
    clickCut(g, q.id);
    assert.equal(g.state.qstate[q.id], 'keep', `challenge Q${q.id} must not be cut`);
  }
  assert.equal(g.keptQuestions().length, 3);
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
  assert.match(element('brdContent').innerHTML, /Repair all three cards/);
  assert.match(element('brdContent').innerHTML, /one launch/);
  assert.match(element('brdContent').innerHTML, /40 credits/);
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
