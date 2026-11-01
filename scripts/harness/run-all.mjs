#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const harnessDir = dirname(fileURLToPath(import.meta.url));
const DEFAULT_GAME_DIR = '/home/hatch/workspace/projects/survey-funnel-seed';

function parseArgs(argv) {
  const options = { gameDir: process.env.GAME_DIR || '' };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--game-dir') options.gameDir = argv[++i];
    else if (arg === '--help') {
      console.log('Usage: [GAME_DIR=/path/to/SurveyFunnel] node run-all.mjs [--game-dir /path/to/SurveyFunnel]');
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!options.gameDir) {
    const integratedRoot = resolve(harnessDir, '..', '..');
    options.gameDir = existsSync(join(integratedRoot, 'site', 'index.html'))
      ? integratedRoot
      : DEFAULT_GAME_DIR;
  }
  options.gameDir = resolve(options.gameDir);
  return options;
}

function hashIfExists(file) {
  return existsSync(file) ? createHash('sha256').update(readFileSync(file)).digest('hex') : null;
}

function tail(text, maxCharacters = 12000) {
  return text.length <= maxCharacters ? text : text.slice(-maxCharacters);
}

function runSection({ id, title, command, args, cwd }) {
  const started = Date.now();
  console.log(`\n===== ${title} =====`);
  console.log(`$ ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env }
  });
  const stdout = result.stdout || '';
  const stderr = result.stderr || '';
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
  const passed = result.status === 0 && !result.error;
  const section = {
    id,
    title,
    command: [command, ...args].join(' '),
    status: passed ? 'pass' : 'fail',
    exitCode: result.status,
    signal: result.signal || null,
    durationMs: Date.now() - started,
    error: result.error ? result.error.message : null,
    stdoutTail: tail(stdout),
    stderrTail: tail(stderr)
  };
  console.log(`===== ${title}: ${section.status.toUpperCase()} (${section.durationMs} ms) =====`);
  return section;
}

function readJsonIfExists(file) {
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    return { parseError: error.message };
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const gameDir = options.gameDir;
  const gameFile = join(gameDir, 'site', 'index.html');
  const resultsDir = join(harnessDir, 'results');
  const browserResultsFile = join(resultsDir, 'browser-results.json');
  const combinedResultsFile = join(resultsDir, 'results.json');
  const screenshotDir = join(resultsDir, 'failures');
  const startedAt = new Date().toISOString();

  if (!existsSync(gameFile)) {
    console.error(`Game file not found: ${gameFile}`);
    process.exitCode = 2;
    return;
  }

  rmSync(resultsDir, { recursive: true, force: true });
  mkdirSync(screenshotDir, { recursive: true });

  const sourceHashBefore = hashIfExists(gameFile);
  console.log('Dear Valued Customer - complete test harness');
  console.log(`GAME_DIR ${gameDir}`);
  console.log(`GAME_FILE ${gameFile}`);
  console.log(`SOURCE_SHA256_BEFORE ${sourceHashBefore}`);

  const sections = [];
  sections.push(runSection({
    id: 'build-validation',
    title: '1/3 Build validation',
    command: process.execPath,
    args: [join(gameDir, 'scripts', 'build-site.mjs')],
    cwd: gameDir
  }));

  sections.push(runSection({
    id: 'node-suite',
    title: '2/3 Existing Node suite',
    command: process.execPath,
    args: [
      '--test',
      join(gameDir, 'scripts', 'build-site.test.mjs'),
      join(gameDir, 'scripts', 'game-features.test.mjs')
    ],
    cwd: gameDir
  }));

  sections.push(runSection({
    id: 'browser-suite',
    title: '3/3 Browser regression suite',
    command: process.execPath,
    args: [
      join(harnessDir, 'browser-suite.mjs'),
      '--game-dir', gameDir,
      '--results-file', browserResultsFile,
      '--screenshot-dir', screenshotDir
    ],
    cwd: harnessDir
  }));

  const browserResults = readJsonIfExists(browserResultsFile);
  const sourceHashAfter = hashIfExists(gameFile);
  const passedSections = sections.filter((section) => section.status === 'pass').length;
  const overallPassed = passedSections === sections.length;
  const summary = {
    harness: 'Dear Valued Customer complete test harness',
    startedAt,
    finishedAt: new Date().toISOString(),
    gameDir,
    gameFile,
    sourceSha256Before: sourceHashBefore,
    sourceSha256After: sourceHashAfter,
    sourceChangedDuringRun: sourceHashBefore !== sourceHashAfter,
    status: overallPassed ? 'pass' : 'fail',
    sections,
    browser: browserResults ? {
      status: browserResults.status,
      totals: browserResults.totals,
      resultsFile: browserResultsFile,
      screenshotDir,
      failedChecks: (browserResults.checks || []).filter((check) => check.status === 'fail')
    } : null
  };
  writeFileSync(combinedResultsFile, `${JSON.stringify(summary, null, 2)}\n`);

  console.log('\n===== COMPLETE HARNESS SUMMARY =====');
  for (const section of sections) {
    console.log(`${section.status.toUpperCase()} ${section.title} (exit ${section.exitCode})`);
  }
  if (browserResults?.totals) {
    console.log(`BROWSER CHECKS ${browserResults.totals.passed}/${browserResults.totals.checks} passed; ${browserResults.totals.failed} failed`);
  }
  console.log(`OVERALL ${overallPassed ? 'PASS' : 'FAIL'} - ${passedSections}/${sections.length} sections passed`);
  console.log(`RESULTS ${combinedResultsFile}`);
  console.log(`SOURCE_CHANGED_DURING_RUN ${summary.sourceChangedDuringRun}`);
  process.exitCode = overallPassed ? 0 : 1;
}

main();
