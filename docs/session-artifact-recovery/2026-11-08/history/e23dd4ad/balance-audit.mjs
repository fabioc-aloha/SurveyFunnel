import { readFileSync, writeFileSync } from 'node:fs';
import { Script, createContext } from 'node:vm';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';

const root = 'C:\\Development\\SurveyFunnel';
const testSource = readFileSync(join(root, 'scripts', 'game-features.test.mjs'), 'utf8');
const harness = testSource.slice(testSource.indexOf('function game()'), testSource.indexOf("\ntest("));
const game = new Function('readFileSync', 'Script', 'createContext', 'root', 'join', harness + '\nreturn game;')(
  readFileSync, Script, createContext, root, join
);
const html = readFileSync(join(root, 'site', 'index.html'), 'utf8');
const scoring = html.slice(html.indexOf('  var run = runData, c = tally(run)'), html.indexOf('  var fastUseless'));
if (!scoring.includes('var won =') || !scoring.includes('var quality =')) throw Error('Scoring extraction failed');
const { context: g } = game();
new Script('function assess(){var runData=buildRun();' + scoring +
  'return {cost:budgetMath().total,rate:respRate,quality:quality,insight:insight,won:won,goodwill:gm.ending};}').runInContext(g);

function plans(level) {
  const dealt = g.activeQuestions();
  const bank = g.addBankQuestions().filter(q => g.defectOf(q) === 'CLEAN');
  const agenda = Array.from(g.agendaTopics());
  const all = Array.from(dealt).concat(Array.from(bank));
  const candidates = [];
  for (const preferBank of [false, true]) {
    for (const size of [5, 6, 7, 8]) {
      const selected = [];
      for (const topic of agenda) {
        const pool = all.filter(q => q.topic === topic && g.tierOf(q) !== 'stupid' && (!q.answerBy || g.fixVerbFor(q)) &&
          (g.defectOf(q) === 'CLEAN' || g.fixVerbFor(q)));
        pool.sort((a, b) => {
          const score = q => (g.defectOf(q) === 'CLEAN' ? 0 : 2) + q.min +
            (bank.includes(q) ? (preferBank ? -1 : 2) : 0);
          return score(a) - score(b);
        });
        if (pool[0]) selected.push(pool[0]);
      }
      const fillers = all.filter(q => !selected.includes(q) && g.tierOf(q) !== 'stupid' && (!q.answerBy || g.fixVerbFor(q)) &&
        (g.defectOf(q) === 'CLEAN' || g.fixVerbFor(q)));
      fillers.sort((a, b) => {
        const score = q => (q.core ? -4 : 0) + (g.defectOf(q) === 'CLEAN' ? 0 : 2) +
          q.min + (bank.includes(q) ? 2 : 0);
        return score(a) - score(b);
      });
      selected.push(...fillers.slice(0, Math.max(0, size - selected.length)));
      candidates.push(selected);
    }
  }
  return candidates;
}

function search(level, seed) {
  g.state.randomMode = false; g.state.levelSeeds = seed ? { [level]: seed } : {};
  g.selectLevel(level, false);
  const dealt = g.activeQuestions(), bank = g.addBankQuestions();
  const initial = { cards: dealt.length, minutes: g.estMinutes(), cost: g.budgetMath().total, goodwill: g.goodwillMath().start };
  const defaultOutcome = g.assess();
  let tried = 0, wins = 0, best = null;
  for (const selected of plans(level)) {
    g.state.added = {};
    for (const q of dealt) g.state.qstate[q.id] = selected.includes(q) ? (g.fixVerbFor(q) ? 'simplify' : 'keep') : 'cut';
    for (const q of bank) {
      g.state.added[q.id] = selected.includes(q);
      g.state.qstate[q.id] = g.fixVerbFor(q) ? 'simplify' : 'keep';
    }
    g.state.validation = 'full'; g.state.dedupe = true; g.state.suppression = true;
    g.state.stakeholder = level === 3 || level === 6 ? 'pushback' : null;
    g.state.reportBack = level === 4;
    g.state.langChoice = level === 5 ? 'localized' : 'en';
    g.state.localization = level === 5;
    g.state.abEnabled = level === 2;
    for (const invite of g.INVITES) for (const reminders of [0, 1, 2]) for (const escapes of [false, true]) {
      g.state.invite = invite; g.state.reminders = reminders; g.state.escapes = escapes;
      g.state.abInvite = g.INVITES.find(iv => iv.id !== invite.id).id;
      if (g.budgetMath().total > g.BUDGET_TOTAL) continue;
      tried++;
      const outcome = g.assess();
      if (!outcome.won) continue;
      wins++;
      if (!best || outcome.cost < best.cost) {
        best = { ...outcome, invite: invite.id, reminders, escapes,
          kept: selected.filter(q => dealt.includes(q)).map(q => q.id),
          added: selected.filter(q => bank.includes(q)).map(q => q.id),
          repaired: selected.filter(q => g.fixVerbFor(q)).map(q => q.id) };
      }
      if (!best && level === 4) {
        g.state.seg = g.SEGMENTS.find(seg => seg.id === 'fresh');
        for (const selected of plans(level)) {
          g.state.added = {};
          for (const q of dealt) g.state.qstate[q.id] = selected.includes(q) ? (g.fixVerbFor(q) ? 'simplify' : 'keep') : 'cut';
          for (const q of bank) {
            g.state.added[q.id] = selected.includes(q);
            g.state.qstate[q.id] = g.fixVerbFor(q) ? 'simplify' : 'keep';
          }
          for (const invite of g.INVITES) for (const reminders of [0, 1, 2]) for (const escapes of [false, true]) {
            g.state.invite = invite; g.state.reminders = reminders; g.state.escapes = escapes;
            if (g.budgetMath().total > g.BUDGET_TOTAL) continue;
            tried++;
            const outcome = g.assess();
            if (!outcome.won) continue;
            wins++;
            if (!best || outcome.cost < best.cost) best = {
              ...outcome, segment: 'fresh', invite: invite.id, reminders, escapes,
              kept: selected.filter(q => dealt.includes(q)).map(q => q.id),
              added: selected.filter(q => bank.includes(q)).map(q => q.id),
              repaired: selected.filter(q => g.fixVerbFor(q)).map(q => q.id)
            };
          }
        }
      }
    }
  }
  return { level, seed: seed || 'fixed', initial, defaultOutcome, tried, wins, best };
}

const started = performance.now();
const results = [];
for (const level of process.argv.includes('--debug') ? [4] : [1, 2, 3, 4, 5, 6]) {
  if (!process.argv.includes('--debug')) results.push(search(level, null));
  for (let index = process.argv.includes('--debug') ? 1 : 0; index < (process.argv.includes('--debug') ? 2 : 64); index++) {
    results.push(search(level, index.toString(16).toUpperCase().padStart(4, '0')));
  }
  if (process.argv.includes('--debug')) {
    console.log(JSON.stringify({dealt:g.activeQuestions().map(q=>({id:q.id,core:q.core,min:q.min,topic:q.topic,defect:q.defect,answerBy:q.answerBy})),bank:g.addBankQuestions().map(q=>({id:q.id,core:q.core,min:q.min,topic:q.topic,defect:q.defect,answerBy:q.answerBy})),current:g.assess()}));
  }
  for (const row of results) {
    if (!row.best) continue;
    g.state.levelSeeds = row.seed === 'fixed' ? {} : { [row.level]: row.seed };
    g.selectLevel(row.level, false);
    const best = row.best;
    if (best.segment) g.state.seg = g.SEGMENTS.find(seg => seg.id === best.segment);
    g.state.validation = 'full'; g.state.dedupe = true; g.state.suppression = true;
    g.state.stakeholder = row.level === 3 || row.level === 6 ? 'pushback' : null;
    g.state.reportBack = row.level === 4;
    g.state.langChoice = row.level === 5 ? 'localized' : 'en';
    g.state.localization = row.level === 5;
    g.state.abEnabled = row.level === 2;
    g.state.invite = g.INVITES.find(invite => invite.id === best.invite);
    g.state.abInvite = g.INVITES.find(invite => invite.id !== best.invite).id;
    g.state.reminders = best.reminders; g.state.escapes = best.escapes;
    for (const q of g.activeQuestions()) g.state.qstate[q.id] =
      best.kept.includes(q.id) ? (best.repaired.includes(q.id) ? 'simplify' : 'keep') : 'cut';
    for (const q of g.addBankQuestions()) {
      g.state.added[q.id] = best.added.includes(q.id);
      g.state.qstate[q.id] = best.repaired.includes(q.id) ? 'simplify' : 'keep';
    }
    if (g.budgetMath().total !== best.cost) throw Error('Witness cost mismatch: ' + row.level + '/' + row.seed);
    g.startRun(); g.showReport();
    if (!g.state.campaignWon[row.level] || g.state.lastRound.quality !== best.quality ||
        g.state.lastRound.insight !== best.insight || g.state.lastRound.rate !== best.rate) {
      throw Error('Actual report disagrees with witness: ' + row.level + '/' + row.seed);
    }
  }
  const rows = results.filter(r => r.level === level);
  console.log(JSON.stringify({ level, checked: rows.length, failed: rows.filter(r => !r.best).map(r => r.seed),
    fixed: rows[0].best, minWins: Math.min(...rows.map(r => r.wins)),
    maxWinningCost: Math.max(...rows.filter(r => r.best).map(r => r.best.cost)) }));
}
writeFileSync(new URL('./balance-results.json', import.meta.url), JSON.stringify({
  method: '65 instruments per level, 8 agenda-preserving plans x 18 invitation/reminder/escape configurations; original source scoring',
  seconds: (performance.now() - started) / 1000, results
}, null, 2));
console.log('Total checked', results.length, 'no witness found', results.filter(r => !r.best).length);
