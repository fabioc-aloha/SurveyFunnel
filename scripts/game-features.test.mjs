import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script, createContext } from 'node:vm';
import test from 'node:test';
import { root } from './build-site.mjs';
import { join } from 'node:path';

function game() {
  const elements = new Map();
  const timers = [];
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      attributes: {}, setAttribute(key, value) { this.attributes[key] = String(value); },
      getAttribute(key) { return this.attributes[key]; },
      style: {}, classList: { add() {}, remove() {}, toggle() {} },
      firstChild: {}, innerHTML: '', textContent: '', addEventListener() {},
      querySelectorAll() { return []; }, querySelector() { return element('child'); },
      focus() {}, appendChild() {}, remove() {}
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
  const original = JSON.stringify(g.state);
  g.startQuickChallenge(0);
  const qid = g.activeQuestions()[0].id;
  let handler;
  const button = {
    getAttribute(key) { return key === 'data-q' ? String(qid) : 'cut'; },
    addEventListener(type, listener) { handler = listener; }
  };
  g.document.querySelectorAll = selector => selector === '[data-q]' ? [button] : [];
  g.renderQuestions();
  handler();
  assert.equal(g.state.qstate[qid], 'cut');
  assert.equal(g.keptQuestions().length, 2);
  g.leaveQuickChallenge();
  timers.forEach(callback => callback());
  assert.equal(JSON.stringify(g.state), original);
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
