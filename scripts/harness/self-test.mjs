#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const harnessDir = dirname(fileURLToPath(import.meta.url));
// Same game-dir resolution as run-all.mjs: GAME_DIR wins; otherwise, when
// this file lives in <repo>/scripts/harness/, the repository root two
// levels up is the game directory; otherwise the known seed checkout.
const integratedRoot = resolve(harnessDir, '..', '..');
const gameDir = resolve(
  process.env.GAME_DIR ||
  (existsSync(join(integratedRoot, 'site', 'index.html'))
    ? integratedRoot
    : '/home/hatch/workspace/projects/survey-funnel-seed')
);
const root = join(harnessDir, 'results', 'self-test');

const cases = [
  {
    id: 'horizontal-overflow',
    mutate(html) {
      return html.replace('</body>',
        '<div id="harness-deliberate-overflow" style="width:2000px;height:1px"></div></body>');
    },
    caught(results) {
      return results.checks.some((check) => check.status === 'fail' &&
        check.name.startsWith('no horizontal overflow'));
    },
    expectation: 'a failing horizontal-overflow check'
  },
  {
    id: 'page-error',
    mutate(html) {
      return html.replace('</body>',
        '<script>throw new Error("HARNESS_DELIBERATE_PAGE_ERROR");</script></body>');
    },
    caught(results) {
      return results.checks.some((check) => check.status === 'fail' &&
        check.name.includes('console or page errors'));
    },
    expectation: 'a failing console/page-error check'
  }
];

function runCase(testCase) {
  const caseDir = join(root, testCase.id);
  const brokenGameDir = join(caseDir, 'game');
  const resultsFile = join(caseDir, 'browser-results.json');
  const screenshotDir = join(caseDir, 'failures');
  mkdirSync(brokenGameDir, { recursive: true });
  cpSync(join(gameDir, 'site'), join(brokenGameDir, 'site'), { recursive: true });
  cpSync(join(gameDir, 'assets'), join(brokenGameDir, 'assets'), { recursive: true });
  const gameFile = join(brokenGameDir, 'site', 'index.html');
  const original = readFileSync(gameFile, 'utf8');
  const mutated = testCase.mutate(original);
  if (mutated === original) throw new Error(`${testCase.id}: mutation did not change the copied game file`);
  writeFileSync(gameFile, mutated);

  const child = spawnSync(process.execPath, [
    join(harnessDir, 'browser-suite.mjs'),
    '--game-dir', brokenGameDir,
    '--no-scenarios',
    '--viewport', '390x844',
    '--results-file', resultsFile,
    '--screenshot-dir', screenshotDir,
    '--label', `self-test-${testCase.id}`
  ], { cwd: harnessDir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const output = `${child.stdout || ''}${child.stderr || ''}`;
  process.stdout.write(output);
  const results = JSON.parse(readFileSync(resultsFile, 'utf8'));
  const caught = child.status !== 0 && testCase.caught(results);
  return {
    id: testCase.id,
    expectation: testCase.expectation,
    childExitCode: child.status,
    caught,
    failedChecks: results.checks.filter((check) => check.status === 'fail').map((check) => check.name),
    resultsFile,
    screenshotDir,
    brokenGameDir
  };
}

rmSync(root, { recursive: true, force: true });
mkdirSync(root, { recursive: true });
if (!existsSync(join(gameDir, 'site', 'index.html'))) {
  console.error(`Game file not found under GAME_DIR: ${gameDir}`);
  process.exit(2);
}

const results = cases.map(runCase);
const passed = results.every((result) => result.caught);
const summary = {
  selfTest: 'SurveyFunnel browser harness negative controls',
  gameDir,
  status: passed ? 'pass' : 'fail',
  cases: results
};
writeFileSync(join(root, 'self-test-results.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(`SELF-TEST ${passed ? 'PASS' : 'FAIL'} - ${results.filter((result) => result.caught).length}/${results.length} deliberate defects caught`);
for (const result of results) {
  console.log(`${result.caught ? 'CAUGHT' : 'MISSED'} ${result.id}: exit ${result.childExitCode}; failures: ${result.failedChecks.join(' | ')}`);
}
process.exitCode = passed ? 0 : 1;
