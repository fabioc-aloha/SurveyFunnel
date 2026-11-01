#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const harnessDir = dirname(fileURLToPath(import.meta.url));
const DEFAULT_GAME_DIR = '/home/hatch/workspace/projects/survey-funnel-seed';

function parseArgs(argv) {
  const options = {
    gameDir: process.env.GAME_DIR || '',
    resultsFile: join(harnessDir, 'results', 'browser-results.json'),
    screenshotDir: join(harnessDir, 'results', 'failures'),
    viewports: [],
    label: 'browser',
    scenarios: true
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--game-dir') options.gameDir = argv[++i];
    else if (arg === '--results-file') options.resultsFile = resolve(argv[++i]);
    else if (arg === '--screenshot-dir') options.screenshotDir = resolve(argv[++i]);
    else if (arg === '--label') options.label = argv[++i];
    else if (arg === '--no-scenarios') options.scenarios = false;
    else if (arg === '--viewport') options.viewports.push(parseViewport(argv[++i]));
    else if (arg === '--help') {
      console.log('Usage: node browser-suite.mjs [--game-dir DIR] [--viewport 390x844] [--results-file FILE] [--screenshot-dir DIR] [--no-scenarios]');
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
  if (!options.viewports.length) {
    options.viewports = [
      { width: 390, height: 844, label: '390x844' },
      { width: 1280, height: 800, label: '1280x800' }
    ];
  }
  return options;
}

function parseViewport(value) {
  const match = /^(\d+)x(\d+)$/.exec(value || '');
  if (!match) throw new Error(`Invalid viewport "${value}". Use WIDTHxHEIGHT, for example 390x844.`);
  return { width: Number(match[1]), height: Number(match[2]), label: value };
}

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 110);
}

async function loadPuppeteer() {
  const candidates = [];
  if (process.env.PUPPETEER_MODULE) candidates.push(process.env.PUPPETEER_MODULE);
  candidates.push(
    '/home/hatch/workspace/tdd-2e-build/root2/applied-ai/defensible-decision-2e/node_modules/puppeteer/lib/puppeteer/puppeteer.js',
    '/home/hatch/workspace/tdd-2e-build/root2/applied-ai/defensible-decision-2e/node_modules/puppeteer/index.js',
    '/home/hatch/workspace/le-2e/node_modules/puppeteer/lib/puppeteer/puppeteer.js',
    join(harnessDir, 'node_modules', 'puppeteer', 'lib', 'puppeteer', 'puppeteer.js')
  );
  const errors = [];
  for (const candidate of [...new Set(candidates)]) {
    if (!existsSync(candidate)) continue;
    try {
      const module = await import(pathToFileURL(candidate).href);
      const puppeteer = module.default || module;
      if (puppeteer && typeof puppeteer.launch === 'function') {
        return { puppeteer, modulePath: candidate };
      }
      errors.push(`${candidate}: no launch() export`);
    } catch (error) {
      errors.push(`${candidate}: ${error.message}`);
    }
  }
  throw new Error(
    'BLOCKER: Puppeteer is not importable from any known location. ' +
    `Checked: ${[...new Set(candidates)].join(', ')}. Errors: ${errors.join(' | ') || 'none'}`
  );
}

function findChrome() {
  const candidates = [];
  if (process.env.PUPPETEER_EXECUTABLE_PATH) candidates.push(process.env.PUPPETEER_EXECUTABLE_PATH);
  candidates.push(
    '/home/hatch/.cache/puppeteer/chrome/linux-149.0.7827.22/chrome-linux64/chrome',
    '/home/hatch/.cache/puppeteer/chrome/linux-155.0.8059.79/chrome-linux64/chrome',
    '/opt/meta-chromium/chrome'
  );
  return candidates.find((candidate) => existsSync(candidate)) || null;
}

class ViewportRun {
  constructor({ page, viewport, screenshotDir }) {
    this.page = page;
    this.viewport = viewport;
    this.screenshotDir = screenshotDir;
    this.checks = [];
    this.consoleErrors = [];
    this.pageErrors = [];
    this.requestFailures = [];
    this.screenshotCount = 0;
  }

  async screenshot(checkName) {
    this.screenshotCount += 1;
    const file = join(
      this.screenshotDir,
      `${this.viewport.label}-${String(this.screenshotCount).padStart(2, '0')}-${slug(checkName)}.png`
    );
    try {
      await this.page.screenshot({ path: file, fullPage: false });
      return file;
    } catch (error) {
      return `SCREENSHOT_FAILED: ${error.message}`;
    }
  }

  async record(name, passed, details = {}, screenshot = false) {
    const item = {
      viewport: this.viewport.label,
      name,
      status: passed ? 'pass' : 'fail',
      details
    };
    if (!passed && screenshot) item.screenshot = await this.screenshot(name);
    this.checks.push(item);
    console.log(`[${this.viewport.label}] ${passed ? 'PASS' : 'FAIL'} ${name}` +
      (passed ? '' : ` :: ${JSON.stringify(details).slice(0, 900)}`));
    return passed;
  }

  async check(name, condition, details = {}) {
    return this.record(name, Boolean(condition), details, !condition);
  }
}

async function waitForVisible(page, selector, timeout = 15000) {
  await page.waitForSelector(selector, { visible: true, timeout });
}

async function isVisible(page, selector) {
  return page.$eval(selector, (el) => {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  }).catch(() => false);
}

async function overflowSnapshot(page) {
  return page.evaluate(() => {
    const width = window.innerWidth;
    const root = document.documentElement;
    const body = document.body;
    const offenders = [];
    for (const el of document.querySelectorAll('body *')) {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      const rect = el.getBoundingClientRect();
      if (!rect.width && !rect.height) continue;
      if (rect.left < -1 || rect.right > width + 1) {
        offenders.push({
          tag: el.tagName,
          id: el.id || '',
          className: typeof el.className === 'string' ? el.className : '',
          text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 90),
          left: Math.round(rect.left * 10) / 10,
          right: Math.round(rect.right * 10) / 10,
          width: Math.round(rect.width * 10) / 10
        });
        if (offenders.length >= 12) break;
      }
    }
    return {
      innerWidth: width,
      documentScrollWidth: Math.max(root.scrollWidth || 0, body?.scrollWidth || 0),
      documentClientWidth: root.clientWidth,
      offenders
    };
  });
}

async function checkOverflow(run, stage) {
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 180));
  const snapshot = await overflowSnapshot(run.page);
  return run.check(
    `no horizontal overflow - ${stage}`,
    snapshot.documentScrollWidth <= snapshot.innerWidth + 1,
    snapshot
  );
}

async function scrollAndAssertReachable(run, selector, stageName) {
  const page = run.page;
  const exists = await page.$(selector);
  if (!exists) return run.check(`setup stage reachable - ${stageName}`, false, { selector, reason: 'missing' });
  await page.$eval(selector, (el) => el.scrollIntoView({ block: 'start', behavior: 'auto' }));
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 220));
  const geometry = await page.$eval(selector, (el) => {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return {
      top: Math.round(rect.top),
      bottom: Math.round(rect.bottom),
      height: Math.round(rect.height),
      innerHeight: window.innerHeight,
      display: style.display,
      visibility: style.visibility
    };
  });
  const reachable = geometry.height > 0 && geometry.bottom > 0 && geometry.top < geometry.innerHeight &&
    geometry.display !== 'none' && geometry.visibility !== 'hidden';
  return run.check(`setup stage reachable - ${stageName}`, reachable, { selector, ...geometry });
}

async function questionButtonAudit(run) {
  const data = await run.page.evaluate(() => {
    function metrics(el) {
      const rect = el.getBoundingClientRect();
      return {
        text: (el.textContent || '').trim().replace(/\s+/g, ' '),
        action: el.getAttribute('data-act') || '',
        question: el.getAttribute('data-q') || '',
        disabled: el.disabled,
        height: Math.round(rect.height * 100) / 100,
        width: Math.round(rect.width * 100) / 100,
        clientWidth: el.clientWidth,
        clientHeight: el.clientHeight,
        scrollWidth: el.scrollWidth,
        scrollHeight: el.scrollHeight
      };
    }
    const buttons = [...document.querySelectorAll('#qGrid .qbtn')].map((el, index) => ({ index, ...metrics(el) }));
    const rows = [...document.querySelectorAll('#qGrid .qbtns')].map((row, index) => {
      const heights = [...row.querySelectorAll('.qbtn')].map((el) => el.getBoundingClientRect().height);
      return {
        row: index + 1,
        heights: heights.map((height) => Math.round(height * 100) / 100),
        spread: heights.length ? Math.round((Math.max(...heights) - Math.min(...heights)) * 100) / 100 : 0
      };
    });
    const escapeEl = document.querySelector('#escBtn');
    return { buttons, rows, escape: escapeEl ? metrics(escapeEl) : null };
  });

  const clipped = data.buttons.filter((button) =>
    button.scrollWidth > button.clientWidth + 1 || button.scrollHeight > button.clientHeight + 1);
  const short = data.buttons.filter((button) => button.height < 40);
  const unevenRows = data.rows.filter((row) => row.spread > 2);
  await run.check('questionnaire action buttons are present', data.buttons.length >= 20, {
    buttonCount: data.buttons.length,
    rowCount: data.rows.length
  });
  await run.check('questionnaire action buttons are at least 40px high', short.length === 0, {
    buttonCount: data.buttons.length,
    violations: short.slice(0, 12)
  });
  await run.check('questionnaire action buttons in each row have equal heights', unevenRows.length === 0, {
    rowCount: data.rows.length,
    violations: unevenRows.slice(0, 12)
  });
  if (clipped.length) {
    await run.page.evaluate((index) => {
      document.querySelectorAll('#qGrid .qbtn')[index]?.scrollIntoView({ block: 'center', behavior: 'auto' });
    }, clipped[0].index);
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 200));
  }
  await run.check('questionnaire action button labels are not clipped', clipped.length === 0, {
    buttonCount: data.buttons.length,
    violations: clipped.slice(0, 12)
  });
  if (data.escape) {
    const escapeClipped = data.escape.scrollWidth > data.escape.clientWidth + 1 ||
      data.escape.scrollHeight > data.escape.clientHeight + 1;
    await run.check('escapes switch is at least 40px high and unclipped',
      data.escape.height >= 40 && !escapeClipped, data.escape);
  } else {
    await run.check('escapes switch is at least 40px high and unclipped', false, { reason: '#escBtn missing' });
  }
  return data;
}

async function restoreButtonAudit(run) {
  const data = await run.page.evaluate(() => [...document.querySelectorAll('[data-restore]')].map((el) => {
    const rect = el.getBoundingClientRect();
    return {
      question: el.getAttribute('data-restore'),
      text: (el.textContent || '').trim().replace(/\s+/g, ' '),
      height: Math.round(rect.height * 100) / 100,
      clientWidth: el.clientWidth,
      clientHeight: el.clientHeight,
      scrollWidth: el.scrollWidth,
      scrollHeight: el.scrollHeight
    };
  }));
  const violations = data.filter((button) => button.height < 40 ||
    button.scrollWidth > button.clientWidth + 1 || button.scrollHeight > button.clientHeight + 1);
  await run.check('restore buttons are at least 40px high and unclipped', data.length > 0 && violations.length === 0, {
    buttonCount: data.length,
    violations: violations.slice(0, 12)
  });
  return data;
}

async function clickAndWait(page, selector, delay = 250) {
  await page.waitForSelector(selector, { visible: true, timeout: 15000 });
  await page.$eval(selector, (el) => el.scrollIntoView({ block: 'center', behavior: 'auto' }));
  await page.click(selector);
  await new Promise((resolvePromise) => setTimeout(resolvePromise, delay));
}

async function assertSelected(run, selector, name) {
  const selected = await run.page.$eval(selector, (el) => el.classList.contains('sel')).catch(() => false);
  return run.check(`setup choice selected - ${name}`, selected, { selector });
}

async function nameplateCheck(run, scopeSelector, stage) {
  const result = await run.page.evaluate((scope) => {
    const scopeEl = document.querySelector(scope);
    const plate = scopeEl?.querySelector('.nameplate');
    if (!plate) return { exists: false };
    const rect = plate.getBoundingClientRect();
    const style = getComputedStyle(plate);
    return {
      exists: true,
      text: (plate.textContent || '').trim(),
      width: Math.round(rect.width * 10) / 10,
      height: Math.round(rect.height * 10) / 10,
      display: style.display,
      visibility: style.visibility
    };
  }, scopeSelector);
  return run.check(`manager nameplate reads IM - ${stage}`,
    result.exists && result.text === 'IM' && result.width > 0 && result.height > 0 &&
    result.display !== 'none' && result.visibility !== 'hidden', result);
}

async function runViewport(browser, gameUrl, viewport, options) {
  let context = null;
  let page = null;
  const run = new ViewportRun({ page: null, viewport, screenshotDir: options.screenshotDir });
  try {
    context = typeof browser.createBrowserContext === 'function'
      ? await browser.createBrowserContext()
      : null;
    page = context ? await context.newPage() : await browser.newPage();
    run.page = page;
    page.setDefaultTimeout(20000);
    page.setDefaultNavigationTimeout(30000);
    await page.setViewport({
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      isMobile: viewport.width < 600,
      hasTouch: viewport.width < 600
    });
    page.on('console', (message) => {
      if (message.type() === 'error') run.consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => run.pageErrors.push(error.message || String(error)));
    page.on('requestfailed', (request) => {
      run.requestFailures.push({ url: request.url(), error: request.failure()?.errorText || 'unknown' });
    });

    await page.goto(gameUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    await waitForVisible(page, '#startScreen');
    await waitForVisible(page, '#startBtn');
    await run.check('title screen loads', await isVisible(page, '#startScreen'), { url: gameUrl });
    await run.check('title screen has no console or page errors at load',
      run.consoleErrors.length === 0 && run.pageErrors.length === 0,
      { consoleErrors: run.consoleErrors, pageErrors: run.pageErrors, requestFailures: run.requestFailures });
    await checkOverflow(run, 'title screen');

    await clickAndWait(page, '#startBtn', 500);
    await waitForVisible(page, '#setup');
    await page.waitForSelector('#qGrid .qcard', { visible: true, timeout: 15000 });
    await run.check('start button opens setup', await isVisible(page, '#setup'), { selector: '#setup' });
    await nameplateCheck(run, '#setup .launchbar', 'setup');

    await scrollAndAssertReachable(run, '#audienceLever', 'Step 1 audience');
    await scrollAndAssertReachable(run, '#prepPanel', 'Step 2 prepare the list');
    await scrollAndAssertReachable(run, '#inviteLever', 'Step 3 invitation');
    await scrollAndAssertReachable(run, '#questionSummary', 'Step 4 questionnaire summary');
    await scrollAndAssertReachable(run, '#qGrid', 'question cards');
    await checkOverflow(run, 'setup after scrolling through all stages');
    await questionButtonAudit(run);

    // A deterministic, fixture-backed Level 1 setup, made only with DOM clicks.
    await clickAndWait(page, '[data-seg="fresh"]', 200);
    await assertSelected(run, '[data-seg="fresh"]', 'Fresh audience');
    await clickAndWait(page, '[data-val="full"]', 200);
    await assertSelected(run, '[data-val="full"]', 'full validation');
    await clickAndWait(page, '[data-prep="dedupe"]', 200);
    await clickAndWait(page, '[data-prep="suppression"]', 200);
    const prepState = await page.evaluate(() => ({
      dedupe: document.querySelector('[data-prep="dedupe"]')?.textContent.trim(),
      suppression: document.querySelector('[data-prep="suppression"]')?.textContent.trim()
    }));
    await run.check('setup choices selected - dedupe and suppression', 
      prepState.dedupe === 'ON' && prepState.suppression === 'ON', prepState);
    await clickAndWait(page, '[data-inv="generic"]', 200);
    await assertSelected(run, '[data-inv="generic"]', 'Generic Blast invitation');
    await clickAndWait(page, '[data-rem="0"]', 200);
    await assertSelected(run, '[data-rem="0"]', 'zero reminders');

    // The fixture line is the post-cut-floor legal winner recorded in
    // docs/development.md (fixed winning cost 58 of 120): Q3 is CORE, so
    // it is repaired with its class-correct ANCHOR fix instead of cut,
    // and the instrument keeps exactly the six core questions. The
    // pre-floor fixture cut Q3 and kept five; the cut floor made that
    // line unreachable by design, so the harness follows the legal line.
    await clickAndWait(page, '#qGrid .qbtn[data-q="3"][data-act="simplify"]', 300);
    const cutIds = [5, 7, 8, 10, 11, 12];
    for (const id of cutIds) {
      const selector = `#qGrid .qbtn[data-q="${id}"][data-act="cut"]`;
      const present = await page.$(selector);
      if (!present) {
        await run.check(`question cut control exists - Q${id}`, false, { selector });
        continue;
      }
      await clickAndWait(page, selector, 520);
    }
    await page.waitForFunction(() => document.querySelectorAll('[data-restore]').length >= 6, { timeout: 10000 });
    await restoreButtonAudit(run);
    const keptIds = await page.evaluate(() =>
      [...document.querySelectorAll('#qGrid .qcard')].map((card) => Number(card.id.replace('qc', ''))).sort((a, b) => a - b));
    await run.check('scripted Level 1 setup keeps the fixture questions',
      JSON.stringify(keptIds) === JSON.stringify([1, 2, 3, 4, 6, 9]), { keptIds });
    await checkOverflow(run, 'setup with winning configuration');

    const launchEnabled = await page.$eval('#launchBtn', (button) => !button.disabled).catch(() => false);
    await run.check('launch button is enabled for scripted setup', launchEnabled, { selector: '#launchBtn' });
    await clickAndWait(page, '#launchBtn', 300);
    await waitForVisible(page, '#runStage');
    await run.check('launch opens run screen', await isVisible(page, '#runStage'), { selector: '#runStage' });
    await waitCountdownDone(page);
    await run.check('launch countdown exposes the run controls', true, { selector: '#countdownOverlay' });
    await nameplateCheck(run, '#runStage', 'run');
    await checkOverflow(run, 'run screen');

    await clickAndWait(page, '#skipBtn', 500);
    await waitForVisible(page, '#report');
    await page.waitForSelector('#gradeBox', { visible: true, timeout: 15000 });
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 450));
    const report = await page.evaluate(() => {
      const gradeBox = document.querySelector('#gradeBox');
      const scoreBoxes = [...document.querySelectorAll('#report .scorebox')].map((el) =>
        (el.textContent || '').trim().replace(/\s+/g, ' '));
      return {
        gradeText: gradeBox ? (gradeBox.textContent || '').trim().replace(/\s+/g, ' ') : '',
        verdict: gradeBox?.querySelector('.w')?.textContent.trim() || '',
        scoreBoxes
      };
    });
    await run.check('report renders with a grade and verdict element',
      Boolean(report.gradeText && report.verdict), report);
    await run.check('scripted Level 1 playthrough wins', report.verdict === 'ROUND WON', report);
    await nameplateCheck(run, '#report', 'report');
    await checkOverflow(run, 'report screen');

    await run.check('no console or page errors during the complete journey',
      run.consoleErrors.length === 0 && run.pageErrors.length === 0,
      {
        consoleErrors: run.consoleErrors,
        pageErrors: run.pageErrors,
        requestFailures: run.requestFailures
      });
  } catch (error) {
    await run.record('browser journey completes without a harness exception', false, {
      error: error.message,
      stack: String(error.stack || '').split('\n').slice(0, 8)
    }, true);
  } finally {
    if (page) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
  }
  return run;
}

async function waitCountdownDone(page) {
  await page.waitForFunction(
    () => !document.querySelector('#countdownOverlay')?.classList.contains('show'),
    { timeout: 15000 }
  );
}

function newScenarioRun(viewport, options) {
  const run = new ViewportRun({ page: null, viewport, screenshotDir: options.screenshotDir });
  return run;
}

async function openScenarioPage(browser, run, viewport) {
  const context = typeof browser.createBrowserContext === 'function'
    ? await browser.createBrowserContext()
    : null;
  const page = context ? await context.newPage() : await browser.newPage();
  run.page = page;
  run.context = context;
  page.setDefaultTimeout(20000);
  page.setDefaultNavigationTimeout(30000);
  await page.setViewport({
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    isMobile: viewport.width < 600,
    hasTouch: viewport.width < 600
  });
  page.on('console', (message) => {
    if (message.type() === 'error') run.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => run.pageErrors.push(error.message || String(error)));
  page.on('requestfailed', (request) => {
    run.requestFailures.push({ url: request.url(), error: request.failure()?.errorText || 'unknown' });
  });
  return page;
}

async function closeScenarioPage(run) {
  if (run.page) await run.page.close().catch(() => {});
  if (run.context) await run.context.close().catch(() => {});
}

async function checkNoJourneyErrors(run, stage) {
  return run.check(`no console or page errors - ${stage}`,
    run.consoleErrors.length === 0 && run.pageErrors.length === 0,
    {
      consoleErrors: run.consoleErrors,
      pageErrors: run.pageErrors,
      requestFailures: run.requestFailures
    });
}

// Watch a live run at ~125 ms cadence, recording the pile strip's gate
// and column centers, the live BOUNCED / UNOPENED counts, the envelope
// fan sizes, the number of settled (piled) bounced figures in the
// track, and whether the manager figure ever carries the agitated
// class. Stops when the report is visible or maxMs elapses.
async function observeRun(page, maxMs = 50000) {
  const deadline = Date.now() + maxMs;
  const samples = [];
  let sawAgitated = false;
  let reportSeen = false;
  while (Date.now() < deadline) {
    const snap = await page.evaluate(() => {
      const center = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return Math.round((r.left + r.right) / 2 * 10) / 10;
      };
      const gates = {};
      for (const g of document.querySelectorAll('#gates .gate')) {
        gates[(g.textContent || '').trim()] = center(g);
      }
      const cols = {};
      for (const c of document.querySelectorAll('#pileStrip .pilecol')) {
        cols[c.getAttribute('data-gate')] = center(c);
      }
      const report = document.querySelector('#report');
      return {
        gates,
        cols,
        bounceCount: Number(document.querySelector('#bounceCount')?.textContent || 0),
        unopenedCount: Number(document.querySelector('#unopenedCount')?.textContent || 0),
        bounceGlyphs: document.querySelectorAll('#bounceStack .pile-env').length,
        piled: document.querySelectorAll('#track .sprite.piled').length,
        mgrClass: document.querySelector('#mgrRun')?.className || '',
        reportVisible: Boolean(report) && getComputedStyle(report).display !== 'none' &&
          report.querySelector('.reportcard') !== null
      };
    }).catch(() => null);
    if (!snap) break;
    samples.push(snap);
    if (snap.mgrClass.includes('mgr-shake')) sawAgitated = true;
    if (snap.reportVisible) { reportSeen = true; break; }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 125));
  }
  const piledSamples = samples.filter((s) => s.piled > 0);
  return {
    samples,
    reportSeen,
    sawAgitated,
    maxPiled: Math.max(0, ...samples.map((s) => s.piled)),
    first: samples[0] || null,
    late: piledSamples[piledSamples.length - 1] || samples[samples.length - 1] || null
  };
}

// Scenario: a Quick Challenge second wave against the revealed stale
// list. The challenge seed comes from randomSeedStr, which draws four
// hex digits from Math.random; it is the only Math.random consumer
// that affects the run (the others feed audio noise buffers and
// confetti). A constant stub therefore pins a repeated-digit seed for
// the entry click: with the stub at 0.375 every digit is 6 - seed
// "6666". That seed was selected by replaying the game's own engine
// offline (same VM recipe as scripts/game-features.test.mjs): for
// challenge 1 it draws the LIST REALITY complication, and under the
// intended instrument line (the three BRD cards repaired, the extras
// resolved as curated) the wave-2 run against the true 9%-invalid
// list, mailed raw with no re-validation bought, bounces 5 of the 40
// sprites. Buying a validation tier instead would shrink the
// effective invalid rate to a sub-1% expectation and zero out the
// deterministic draw, so the raw send is what makes this journey a
// stable high-bounce run; the complication's own copy offers exactly
// that choice ("mail the wave raw and let the bounces land where they
// land"). The live journey exercises the pile strip, the settled-
// figure accumulation, the mood machine, and the final report's
// wave-2 bounce accounting in one deterministic pass.
async function runQuickBounceScenario(browser, gameUrl, viewport, options) {
  const run = newScenarioRun(viewport, options);
  try {
    const page = await openScenarioPage(browser, run, viewport);
    await page.evaluateOnNewDocument(() => { Math.random = () => 0.375; });
    await page.goto(gameUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    await waitForVisible(page, '#startScreen');

    // Play challenge 1's intended line, the same repairs and extra
    // resolutions the Node suite pins (cost 45 of the 48-credit pool):
    // the wave-2 draw was selected under exactly this instrument.
    await clickAndWait(page, '#quickBtn', 600);
    await page.waitForSelector('#qGrid .qcard', { visible: true, timeout: 15000 });
    for (const id of [3, 10, 24, 26, 22]) {
      await clickAndWait(page, `#qGrid .qbtn[data-q="${id}"][data-act="simplify"]`, 300);
    }
    await clickAndWait(page, '#qGrid .qbtn[data-q="57"][data-act="cut"]', 600);
    await clickAndWait(page, '#launchBtn', 300);
    await waitForVisible(page, '#runStage');
    await waitCountdownDone(page);
    await clickAndWait(page, '#skipBtn', 600);
    await waitForVisible(page, '#report');
    const compText = await page.evaluate(() => {
      const card = document.querySelector('#compCard');
      return card ? (card.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 300) : '';
    });
    await run.check('quick challenge seed 6666 deals the LIST REALITY complication',
      compText.includes('THE LIST WAS OLDER THAN THE BRIEF'), { compText });
    if (!compText.includes('THE LIST WAS OLDER THAN THE BRIEF')) {
      throw new Error('Seed 6666 did not deal LIST REALITY; wave-2 checks cannot run');
    }

    // Accept the complication and mail wave 2 raw: no re-validation,
    // so the run faces the true 9% list exactly as the offline replay
    // measured it. The prep panel stays live in quick mode (the
    // challenge copy sends players there to re-validate), and its
    // SKIP tier must be the selected one after the accept voids the
    // provided full validation.
    await clickAndWait(page, '#compAccept', 700);
    await page.waitForSelector('#qGrid .qcard', { visible: true, timeout: 15000 });
    const prepState = await page.evaluate(() => {
      const skip = document.querySelector('[data-val="skip"]');
      const full = document.querySelector('[data-val="full"]');
      return {
        skipPresent: Boolean(skip),
        skipSelected: skip ? skip.classList.contains('sel') : null,
        fullPresent: Boolean(full)
      };
    });
    await run.check('wave 2 prep panel is live with the voided validation back at SKIP',
      prepState.skipPresent && prepState.skipSelected === true && prepState.fullPresent, prepState);
    await clickAndWait(page, '#launchBtn', 300);
    await waitForVisible(page, '#runStage');
    await waitCountdownDone(page);
    await clickAndWait(page, '#spd2', 150);

    const observed = await observeRun(page);
    const gatePairs = [['INVITED', 'invited'], ['DELIVERED', 'delivered'], ['OPENED', 'opened'],
      ['STARTED', 'started'], ['FINISH', 'finish']];
    const colDeltas = gatePairs.map(([label, key]) => ({
      gate: label,
      gateCenter: observed.first?.gates[label] ?? null,
      colCenter: observed.first?.cols[key] ?? null,
      delta: observed.first && observed.first.gates[label] != null && observed.first.cols[key] != null
        ? Math.round(Math.abs(observed.first.gates[label] - observed.first.cols[key]) * 10) / 10
        : null
    }));
    await run.check('pile strip has five columns under the funnel step labels',
      Boolean(observed.first) && Object.keys(observed.first.cols).length === 5 &&
      colDeltas.every((d) => d.delta !== null && d.delta <= 3),
      { colDeltas });
    await run.check('bounced figures pile up in the strip during the high-bounce run',
      observed.maxPiled >= 4, { maxPiled: observed.maxPiled, samples: observed.samples.length });
    const late = observed.late || {};
    await run.check('settled figures persist late in the run and match the BOUNCED count and fan',
      late.piled === Math.min(12, late.bounceCount) &&
      late.bounceGlyphs === Math.min(12, late.bounceCount) && late.bounceCount >= 4,
      { piled: late.piled, bounceCount: late.bounceCount, bounceGlyphs: late.bounceGlyphs });
    await run.check('manager figure turns agitated during the high-bounce run',
      observed.sawAgitated, { samples: observed.samples.length });
    await run.check('wave 2 run reaches the final report', observed.reportSeen, {});
    if (observed.reportSeen) {
      const finalText = await page.evaluate(() =>
        (document.querySelector('#report')?.textContent || '').replace(/\s+/g, ' '));
      await run.check('final report reads both waves together',
        finalText.includes('· FINAL') && finalText.includes('WAVE 1') && finalText.includes('two waves'),
        { excerpt: finalText.slice(0, 220) });
      await run.check('final report names the raw wave 2 mailing against the revealed list',
        finalText.includes('The list really ran 9% invalid') &&
        finalText.includes('Wave 2 mailed it raw, with no re-validation bought'),
        { excerpt: finalText.slice(0, 500) });
    }
    await checkNoJourneyErrors(run, 'quick bounce scenario');
  } catch (error) {
    await run.record('quick bounce scenario completes without a harness exception', false, {
      error: error.message,
      stack: String(error.stack || '').split('\n').slice(0, 8)
    }, true);
  } finally {
    await closeScenarioPage(run);
  }
  return run;
}

// Scenario: the campaign report's BOUNCE-BACKS section on a run that
// really bounces. Level 1's fixed instrument is deterministic (seed
// A001). Selecting the Stale segment, the Generic Blast invitation,
// zero reminders, and no validation leaves the instrument exactly as
// dealt; replaying that configuration through the game's own engine
// gives 6 bounced sprites of 40 (2 hard, 4 soft), so the report must
// name a non-empty BOUNCE-BACKS sample. The campaign report is the
// surface that carries this section; the Quick Challenge final report
// is a two-wave summary and does not.
async function runCampaignBounceScenario(browser, gameUrl, viewport, options) {
  const run = newScenarioRun(viewport, options);
  try {
    const page = await openScenarioPage(browser, run, viewport);
    await page.goto(gameUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    await waitForVisible(page, '#startScreen');
    await clickAndWait(page, '#startBtn', 500);
    await waitForVisible(page, '#setup');
    await page.waitForSelector('#qGrid .qcard', { visible: true, timeout: 15000 });

    await clickAndWait(page, '[data-seg="stale"]', 200);
    await assertSelected(run, '[data-seg="stale"]', 'Stale audience for the bouncing campaign run');
    await assertSelected(run, '[data-val="skip"]', 'validation skipped for the bouncing campaign run');
    await clickAndWait(page, '[data-inv="generic"]', 200);
    await assertSelected(run, '[data-inv="generic"]', 'Generic Blast invitation for the bouncing campaign run');
    await clickAndWait(page, '[data-rem="0"]', 200);
    await assertSelected(run, '[data-rem="0"]', 'zero reminders for the bouncing campaign run');

    await clickAndWait(page, '#launchBtn', 300);
    await waitForVisible(page, '#runStage');
    await waitCountdownDone(page);
    await clickAndWait(page, '#skipBtn', 600);
    await waitForVisible(page, '#report');

    const bb = await page.evaluate(() => {
      const heading = [...document.querySelectorAll('#report h2')]
        .find((el) => (el.textContent || '').includes('BOUNCE-BACKS'));
      if (!heading) return { present: false };
      const card = heading.closest('.reportcard') || heading.parentElement;
      const text = (card.textContent || '').replace(/\s+/g, ' ');
      return {
        present: true,
        hasBouncedTotal: /addresses bounced back/.test(text),
        hasAddresses: /\.example/.test(text),
        sampleRows: card.querySelectorAll('table.mini tr').length,
        excerpt: text.slice(0, 500)
      };
    });
    await run.check('campaign report carries a BOUNCE-BACKS section on a bouncing run',
      bb.present && bb.hasBouncedTotal, bb);
    await run.check('bounce-backs section lists simulated bounced addresses',
      bb.present && bb.hasAddresses && bb.sampleRows > 1, bb);
    await checkNoJourneyErrors(run, 'campaign bounce-backs scenario');
  } catch (error) {
    await run.record('campaign bounce-backs scenario completes without a harness exception', false, {
      error: error.message,
      stack: String(error.stack || '').split('\n').slice(0, 8)
    }, true);
  } finally {
    await closeScenarioPage(run);
  }
  return run;
}

// Scenario: the campaign cut floor. Core questions carry a disabled
// CUT button and a LOCKED line; cutting the non-core cards one by one
// must stop at exactly the six core questions, with every remaining
// CUT disabled, the floor note announcing the locked minimum, and a
// further click on a locked card changing nothing.
async function runCutFloorScenario(browser, gameUrl, viewport, options) {
  const run = newScenarioRun(viewport, options);
  try {
    const page = await openScenarioPage(browser, run, viewport);
    await page.goto(gameUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    await waitForVisible(page, '#startScreen');
    await clickAndWait(page, '#startBtn', 500);
    await waitForVisible(page, '#setup');
    await page.waitForSelector('#qGrid .qcard', { visible: true, timeout: 15000 });

    const coreLock = await page.evaluate(() => {
      const coreCut = document.querySelector('#qGrid .qbtn[data-q="3"][data-act="cut"]');
      return {
        coreCutPresent: Boolean(coreCut),
        coreCutDisabled: coreCut ? coreCut.disabled : null,
        lockLines: [...document.querySelectorAll('#qGrid .cutlock')]
          .map((el) => (el.textContent || '').trim())
      };
    });
    await run.check('core questions render a locked, disabled cut control',
      coreLock.coreCutPresent && coreLock.coreCutDisabled === true &&
      coreLock.lockLines.some((text) => text.includes('CORE')), coreLock);

    // Cut through the real buttons until none is enabled. A refused
    // cut changes no state; a landed cut animates the card out over
    // 380 ms before the grid re-renders, so each click gets a beat.
    let guard = 0;
    while (guard++ < 20) {
      const clicked = await page.evaluate(() => {
        const btn = [...document.querySelectorAll('#qGrid .qbtn[data-act="cut"]')].find((b) => !b.disabled);
        if (!btn) return false;
        btn.scrollIntoView({ block: 'center', behavior: 'auto' });
        btn.click();
        return true;
      });
      if (!clicked) break;
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 650));
    }
    const floor = await page.evaluate(() => {
      const note = document.querySelector('#qFloorNote');
      return {
        kept: [...document.querySelectorAll('#qGrid .qcard')]
          .map((card) => Number(card.id.replace('qc', ''))).sort((a, b) => a - b),
        enabledCuts: [...document.querySelectorAll('#qGrid .qbtn[data-act="cut"]')]
          .filter((b) => !b.disabled).length,
        noteClass: note?.className || '',
        noteText: (note?.textContent || '').replace(/\s+/g, ' ').trim()
      };
    });
    await run.check('cutting stops at the six-question floor with the core kept',
      JSON.stringify(floor.kept) === JSON.stringify([1, 2, 3, 4, 6, 9]) && floor.enabledCuts === 0,
      floor);
    await run.check('floor note announces the locked minimum instrument',
      floor.noteClass.includes('atmin') && floor.noteText.includes('MINIMUM INSTRUMENT REACHED'),
      floor);

    await page.evaluate(() => {
      document.querySelector('#qGrid .qbtn[data-q="3"][data-act="cut"]')?.click();
    });
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 500));
    const cardsAfter = await page.evaluate(() => document.querySelectorAll('#qGrid .qcard').length);
    await run.check('a locked cut attempt leaves the instrument unchanged',
      cardsAfter === floor.kept.length, { cardsAfter, cardsAtFloor: floor.kept.length });
    await checkNoJourneyErrors(run, 'cut floor scenario');
  } catch (error) {
    await run.record('cut floor scenario completes without a harness exception', false, {
      error: error.message,
      stack: String(error.stack || '').split('\n').slice(0, 8)
    }, true);
  } finally {
    await closeScenarioPage(run);
  }
  return run;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const gameFile = join(options.gameDir, 'site', 'index.html');
  const startedAt = new Date().toISOString();
  mkdirSync(dirname(options.resultsFile), { recursive: true });
  mkdirSync(options.screenshotDir, { recursive: true });

  const summary = {
    suite: 'Dear Valued Customer browser regression suite',
    label: options.label,
    startedAt,
    gameDir: options.gameDir,
    gameFile,
    gameFileSha256: existsSync(gameFile) ? sha256(gameFile) : null,
    viewports: options.viewports,
    checks: [],
    status: 'fail'
  };

  let browser = null;
  try {
    if (!existsSync(gameFile)) throw new Error(`Game file not found: ${gameFile}`);
    const { puppeteer, modulePath } = await loadPuppeteer();
    const executablePath = findChrome();
    summary.puppeteerModule = modulePath;
    summary.chromeExecutable = executablePath;
    if (!executablePath) throw new Error('BLOCKER: No Chrome executable found in the known VM locations.');
    browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--allow-file-access-from-files',
        '--autoplay-policy=no-user-gesture-required'
      ]
    });
    const gameUrl = pathToFileURL(gameFile).href;
    for (const viewport of options.viewports) {
      const run = await runViewport(browser, gameUrl, viewport, options);
      summary.checks.push(...run.checks);
    }
    if (options.scenarios) {
      // Feature scenarios run once, at the first (mobile) viewport.
      // The self-test passes --no-scenarios: its negative controls only
      // need the core journey above to prove failures are caught.
      for (const scenario of [runQuickBounceScenario, runCutFloorScenario, runCampaignBounceScenario]) {
        const run = await scenario(browser, gameUrl, options.viewports[0], options);
        summary.checks.push(...run.checks);
      }
    }
  } catch (error) {
    summary.fatalError = { message: error.message, stack: String(error.stack || '').split('\n').slice(0, 10) };
    console.error(`FATAL ${error.message}`);
  } finally {
    if (browser) await browser.close().catch(() => {});
    summary.finishedAt = new Date().toISOString();
    summary.totals = {
      checks: summary.checks.length,
      passed: summary.checks.filter((check) => check.status === 'pass').length,
      failed: summary.checks.filter((check) => check.status === 'fail').length
    };
    summary.status = !summary.fatalError && summary.totals.failed === 0 ? 'pass' : 'fail';
    writeFileSync(options.resultsFile, `${JSON.stringify(summary, null, 2)}\n`);
    console.log(`BROWSER SUMMARY ${summary.status.toUpperCase()} ${summary.totals.passed}/${summary.totals.checks} checks passed`);
    console.log(`BROWSER RESULTS ${options.resultsFile}`);
    process.exitCode = summary.status === 'pass' ? 0 : 1;
  }
}

await main();
