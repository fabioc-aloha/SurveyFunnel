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

    // Fishbowl reference overlay from the topbar: opens with all eight
    // sections, takes focus, and Escape returns focus to the opener.
    await clickAndWait(page, '#fishBtn', 300);
    await waitForVisible(page, '#fishbowl');
    const fishTop = await page.evaluate(() => {
      const el = document.querySelector('#fishbowl');
      const text = (el?.textContent || '').replace(/\s+/g, ' ');
      const headings = ['SOURCES', 'BRONZE', 'SILVER', 'GOLD · CONTACT MASTER',
        'SAMPLING', 'PERMISSION', 'THE SEND', 'RESPONSES AND DISPOSITION'];
      return {
        open: el?.classList.contains('open'),
        focus: document.activeElement?.id,
        sections: headings.filter((heading) => text.includes(heading))
      };
    });
    await run.check('fishbowl opens from the topbar with all eight sections',
      fishTop.open && fishTop.sections.length === 8, fishTop);
    await run.check('fishbowl moves focus to its close button', fishTop.focus === 'fishClose', fishTop);
    await checkOverflow(run, 'fishbowl overlay open from topbar');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#fishbowl').classList.contains('open'));
    const fishEscFocus = await page.evaluate(() => document.activeElement?.id);
    await run.check('fishbowl Escape closes and restores focus to the topbar button',
      fishEscFocus === 'fishBtn', { focus: fishEscFocus });

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

    // The second Fishbowl entry point lives in the Step 2 list-preparation
    // area and must behave identically: same overlay, contained focus, and
    // focus restored to this opener on close.
    await page.$eval('#fishFlowBtn', (el) => el.scrollIntoView({ block: 'center', behavior: 'auto' }));
    await clickAndWait(page, '#fishFlowBtn', 300);
    await waitForVisible(page, '#fishbowl');
    const fishStep = await page.evaluate(() => ({
      open: document.querySelector('#fishbowl')?.classList.contains('open'),
      focus: document.activeElement?.id
    }));
    await run.check('fishbowl opens from the Step 2 list-preparation button',
      fishStep.open && fishStep.focus === 'fishClose', fishStep);
    await checkOverflow(run, 'fishbowl overlay open from Step 2');
    await page.keyboard.press('Tab');
    const fishTabFocus = await page.evaluate(() => document.activeElement?.id);
    await run.check('fishbowl keeps Tab focus inside the dialog', fishTabFocus === 'fishClose', { focus: fishTabFocus });
    await clickAndWait(page, '#fishClose', 300);
    const fishClosed = await page.evaluate(() => ({
      open: document.querySelector('#fishbowl').classList.contains('open'),
      focus: document.activeElement?.id
    }));
    await run.check('fishbowl close button restores focus to the Step 2 button',
      !fishClosed.open && fishClosed.focus === 'fishFlowBtn', fishClosed);

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

    // The recorded 58-credit strategy preserves core coverage and
    // repairs Q3 rather than accepting its quality/Insight loss.
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
    const population = await page.evaluate(() => {
      const number = id => Number(document.getElementById(id).textContent.replaceAll(',', ''));
      const sent = runData.respondents.filter(person => person.fate !== 'notsent' && person.spawnAt <= virtualT).length;
      const completed = runData.respondents.filter(person => person.events.some(event =>
        event.type === 'finish' && event.t <= virtualT)).length;
      return {
        recipients: runData.respondents.length,
        groups: runData.sprites.length,
        groupedRecipients: runData.sprites.reduce((total, group) => total + group.count, 0),
        badges: document.querySelectorAll('#track .groupcount').length,
        sent, completed, displayedSent: number('sentCount'), displayedCompleted: number('compCount'),
        summary: document.getElementById('animationSummary').textContent
      };
    });
    await run.check('full recipient population is independent of the animation groups',
      population.recipients === 10000 && population.groups > 40 &&
      population.groups < population.recipients && population.groupedRecipients === population.recipients, population);
    await run.check('live counters equal individual recipient events',
      population.displayedSent === population.sent && population.displayedCompleted === population.completed, population);
    await run.check('animation explains weighted groups instead of forty-person proxies',
      population.badges > 0 && population.summary.includes('10,000 simulated recipients') &&
      population.summary.includes('group size'), population);
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
        scoreBoxes,
        completed: runData.respondents.filter(person => person.fate === 'finish' || person.fate === 'guessfinish').length,
        displayedCompleted: Number(document.getElementById('compCount').textContent.replaceAll(',', '')),
        legacyUnits: /sent sprites|40 sprites|people per sprite/.test(document.getElementById('report').textContent)
      };
    });
    await run.check('report renders with a grade and verdict element',
      Boolean(report.gradeText && report.verdict), report);
    await run.check('scripted Level 1 playthrough wins', report.verdict === 'ROUND WON', report);
    await run.check('report retains exact recipient totals without proxy units',
      report.completed === report.displayedCompleted && !report.legacyUnits, report);
    await nameplateCheck(run, '#report', 'report');
    await checkOverflow(run, 'report screen');

    const evidence = await page.evaluate(() => {
      const checks = [...document.querySelectorAll('#report [data-evidence]')];
      const card = document.querySelector('#report .evidence-grid')?.closest('.reportcard');
      const pipeline = card?.nextElementSibling;
      return {
        ids: checks.map(check => check.dataset.evidence),
        passed: checks.every(check => check.querySelector('h3')?.textContent.endsWith(': PASS')),
        stages: [...(pipeline?.querySelectorAll('p > b') || [])].map(label => label.textContent),
        ready: pipeline?.textContent.includes('READY WITH LIMITS'),
        limits: pipeline?.textContent.includes('do not establish statistical precision'),
        benchmark: document.querySelector('#hudTarget')?.textContent,
        oldResponseScore: [...document.querySelectorAll('#report .scorebox .lbl')]
          .some(label => label.textContent === 'RESPONSE SCORE')
      };
    });
    await run.check('report has all five independent evidence checks',
      JSON.stringify(evidence.ids) === JSON.stringify(['funnel', 'fitness', 'integrity', 'audience', 'trust']), evidence);
    await run.check('legal Level 1 winner passes every evidence check', evidence.passed, evidence);
    await run.check('post-response pipeline reaches publication and action',
      JSON.stringify(evidence.stages) === JSON.stringify(['FINISH', 'CLEAN', 'MATCH', 'INTERPRET', 'PUBLISH', 'ACT'])
        && evidence.ready, evidence);
    await run.check('context note discloses simulation limitations', evidence.limits, evidence);
    await run.check('response is a benchmark rather than the primary score',
      evidence.benchmark?.includes('RESPONSE BENCHMARK') && !evidence.oldResponseScore, evidence);
    await clickAndWait(page, '#nextLevelBtn', 300);
    const carryover = await page.$eval('#readout', el => el.textContent);
    await run.check('next instrument retains campaign audience history',
      carryover.includes('1 previous sends across 1 instrument(s)'), { carryover });
    await checkOverflow(run, 'next level with audience carryover');

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
        bounceCount: Number((document.querySelector('#bounceCount')?.textContent || '0').replaceAll(',', '')),
        unopenedCount: Number((document.querySelector('#unopenedCount')?.textContent || '0').replaceAll(',', '')),
        bounceGlyphs: document.querySelectorAll('#bounceStack .pile-env').length,
        piled: document.querySelectorAll('#track .sprite.piled').length,
        piledRecipients: [...document.querySelectorAll('#track .sprite.piled')].reduce((total, group) => {
          const badge = group.querySelector('.groupcount');
          return total + (badge ? Number(badge.textContent.replace(/[^\d]/g, '')) : NaN);
        }, 0),
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
// list, mailed raw with no re-validation bought, produces individual
// bounces and weighted visual cohorts. Buying a validation tier shrinks the
// effective invalid rate to a sub-1% expectation, so the raw send
// is what makes this journey a stable high-bounce run; the
// complication's own copy offers exactly
// that choice ("mail the wave raw and let the bounces land where they
// land"). The live journey exercises the pile strip, the settled-
// figure accumulation and the final report's
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
    await run.check('settled cohort figures persist while counts and fan describe recipients',
      late.piled > 0 && late.piled <= 12 && late.piledRecipients > 0 &&
      late.piledRecipients <= late.bounceCount &&
      late.bounceGlyphs === Math.min(12, late.bounceCount) && late.bounceCount >= 4,
      { piled: late.piled, piledRecipients: late.piledRecipients, bounceCount: late.bounceCount, bounceGlyphs: late.bounceGlyphs });
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
// A001). Selecting Executive Blast, the Generic Blast invitation,
// zero reminders, and no validation leaves the instrument exactly as
// dealt; replaying that configuration through the game's own engine
// produces individual bounced records, so the report must name a
// non-empty BOUNCE-BACKS sample. Its 16%-invalid list also exercises
// agitation above the 10% recipient threshold, unlike the 9% quick
// challenge list. The campaign report is the
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

    await clickAndWait(page, '[data-seg="blast"]', 200);
    await assertSelected(run, '[data-seg="blast"]', 'Executive Blast audience for the bouncing campaign run');
    await assertSelected(run, '[data-val="skip"]', 'validation skipped for the bouncing campaign run');
    await clickAndWait(page, '[data-inv="generic"]', 200);
    await assertSelected(run, '[data-inv="generic"]', 'Generic Blast invitation for the bouncing campaign run');
    await clickAndWait(page, '[data-rem="0"]', 200);
    await assertSelected(run, '[data-rem="0"]', 'zero reminders for the bouncing campaign run');

    await clickAndWait(page, '#launchBtn', 300);
    await waitForVisible(page, '#runStage');
    await waitCountdownDone(page);
    await clickAndWait(page, '#spd2', 150);
    const observed = await observeRun(page);
    const bounceRate = await page.evaluate(() => {
      const sent = runData.respondents.filter(person => person.fate !== 'notsent').length;
      const bounced = runData.respondents.filter(person => person.fate === 'bounced').length;
      return { sent, bounced, threshold: MOOD_BOUNCE_T1, trips: runData.gm.trips };
    });
    await run.check('campaign bounce run crosses the recipient-based agitation threshold',
      !bounceRate.trips && bounceRate.bounced >= bounceRate.sent * bounceRate.threshold, bounceRate);
    await run.check('manager figure turns agitated during the above-threshold bounce run',
      observed.sawAgitated, { samples: observed.samples.length, ...bounceRate });
    await run.check('campaign bounce run reaches the report without skipping', observed.reportSeen);
    await run.check('live observer parses comma-formatted recipient counts exactly',
      observed.samples.at(-1)?.bounceCount === bounceRate.bounced &&
      bounceRate.bounced > 999,
      { observed: observed.samples.at(-1)?.bounceCount, expected: bounceRate.bounced });
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

// Any question can be cut; only the final kept question is protected.
async function runCutFloorScenario(browser, gameUrl, viewport, options) {
  const run = newScenarioRun(viewport, options);
  try {
    const page = await openScenarioPage(browser, run, viewport);
    await page.goto(gameUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    await waitForVisible(page, '#startScreen');
    await clickAndWait(page, '#startBtn', 500);
    await waitForVisible(page, '#setup');
    await page.waitForSelector('#qGrid .qcard', { visible: true, timeout: 15000 });

    const initialCuts = await page.evaluate(() => {
      const coreCut = document.querySelector('#qGrid .qbtn[data-q="3"][data-act="cut"]');
      return {
        coreCutPresent: Boolean(coreCut),
        coreCutDisabled: coreCut ? coreCut.disabled : null,
        enabledCuts: [...document.querySelectorAll('#qGrid .qbtn[data-act="cut"]')]
          .filter(button => !button.disabled).length,
        cards: document.querySelectorAll('#qGrid .qcard').length
      };
    });
    await run.check('all questions including core cards can be cut above one kept',
      initialCuts.coreCutPresent && initialCuts.coreCutDisabled === false &&
      initialCuts.enabledCuts === initialCuts.cards, initialCuts);

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
      const cut = document.querySelector('#qGrid .qbtn[data-act="cut"]');
      return {
        kept: [...document.querySelectorAll('#qGrid .qcard')]
          .map((card) => Number(card.id.replace('qc', ''))).sort((a, b) => a - b),
        enabledCuts: [...document.querySelectorAll('#qGrid .qbtn[data-act="cut"]')]
          .filter((b) => !b.disabled).length,
        noteClass: note?.className || '',
        noteText: (note?.textContent || '').replace(/\s+/g, ' ').trim(),
        disabled: cut?.disabled,
        filter: cut ? getComputedStyle(cut).filter : '',
        opacity: cut ? getComputedStyle(cut).opacity : ''
      };
    });
    await run.check('cutting stops with exactly one question kept',
      floor.kept.length === 1 && floor.enabledCuts === 0, floor);
    await run.check('the last cut button is disabled and gray',
      floor.disabled && floor.filter === 'grayscale(1)' && Number(floor.opacity) < 1, floor);
    await run.check('floor note announces the locked minimum instrument',
      floor.noteClass.includes('atmin') && floor.noteText.includes('MINIMUM INSTRUMENT REACHED'),
      floor);

    await page.evaluate(() => {
      document.querySelector('#qGrid .qbtn[data-act="cut"]').click();
    });
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 500));
    const cardsAfter = await page.evaluate(() => document.querySelectorAll('#qGrid .qcard').length);
    await run.check('a locked cut attempt leaves the instrument unchanged',
      cardsAfter === floor.kept.length, { cardsAfter, cardsAtFloor: floor.kept.length });
    const restoreId = await page.$eval('[data-restore]', button => Number(button.dataset.restore));
    await clickAndWait(page, `[data-restore="${restoreId}"]`, 500);
    const restored = await page.evaluate(() => ({
      cards: document.querySelectorAll('#qGrid .qcard').length,
      enabled: [...document.querySelectorAll('#qGrid .qbtn[data-act="cut"]')].filter(button => !button.disabled).length
    }));
    await run.check('restoring a question re-enables both cut controls',
      restored.cards === 2 && restored.enabled === 2, restored);
    await clickAndWait(page, `#qGrid [data-q="${restoreId}"][data-act="cut"]`, 650);
    const addId = await page.$eval('[data-add]:not([disabled])', button => Number(button.dataset.add));
    await clickAndWait(page, `[data-add="${addId}"]`, 500);
    const added = await page.evaluate(() => ({
      cards: document.querySelectorAll('#qGrid .qcard').length,
      enabled: [...document.querySelectorAll('#qGrid .qbtn[data-act="cut"]')].filter(button => !button.disabled).length
    }));
    await run.check('adding a bank question re-enables both cut controls',
      added.cards === 2 && added.enabled === 2, added);
    await clickAndWait(page, `#qGrid [data-q="${floor.kept[0]}"][data-act="cut"]`, 650);
    const bankLast = await page.evaluate(() => ({
      ids: [...document.querySelectorAll('#qGrid .qcard')].map(card => Number(card.id.replace('qc', ''))),
      disabled: document.querySelector('#qGrid .qbtn[data-act="cut"]')?.disabled
    }));
    await run.check('the final bank question is protected just like a dealt question',
      JSON.stringify(bankLast.ids) === JSON.stringify([addId]) && bankLast.disabled, bankLast);
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

// Scenario: the medallion prep stage (phase 1). Step 2 must show the
// Bronze / Silver / Gold layer panels with the dealt intake counts,
// the segment cards must show derived list health instead of a static
// rate, Silver work must improve the Gold health line, and the
// campaign report must carry the LIST PREPARATION ledger reconciling
// the intake against the work bought. The play line mirrors the main
// journey's fixture-backed Level 1 winner, with the full Silver line
// added on top.
async function runMedallionScenario(browser, gameUrl, viewport, options) {
  const run = newScenarioRun(viewport, options);
  try {
    const page = await openScenarioPage(browser, run, viewport);
    await page.goto(gameUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    await waitForVisible(page, '#startScreen');
    await clickAndWait(page, '#startBtn', 500);
    await waitForVisible(page, '#setup');
    await page.waitForSelector('#segGrid .card', { visible: true, timeout: 15000 });

    const cardText = await page.evaluate(() =>
      (document.querySelector('#segGrid')?.textContent || '').replace(/\s+/g, ' '));
    await run.check('segment cards show the intake mix and derived list health',
      cardText.includes('Intake:') && cardText.includes('List health after your list work:'),
      { excerpt: cardText.slice(0, 320) });

    const healthOf = () => page.evaluate(() => {
      const text = (document.querySelector('#prepPanel')?.textContent || '').replace(/\s+/g, ' ');
      const match = text.match(/List health after your list work: ([\d.]+)% invalid/);
      return { text, health: match ? Number(match[1]) : null };
    });
    const before = await healthOf();
    await run.check('step 2 shows the Bronze, Silver and Gold layer panels',
      before.text.includes('BRONZE · RECORDS IN') && before.text.includes('DEDUPE · SILVER') &&
      before.text.includes('CONSOLIDATE · SILVER') && before.text.includes('REPAIR ADDRESSES · SILVER') &&
      before.text.includes('SILVER OUTPUT') && before.text.includes('GOLD · CONTACT MASTER') &&
      before.health !== null,
      { excerpt: before.text.slice(0, 400), health: before.health });

    await clickAndWait(page, '[data-prep="dedupe"]', 200);
    await clickAndWait(page, '[data-prep="consolidate"]', 200);
    await clickAndWait(page, '[data-prep="repair"]', 200);
    const silverState = await page.evaluate(() => ({
      dedupe: document.querySelector('[data-prep="dedupe"]')?.textContent.trim(),
      consolidate: document.querySelector('[data-prep="consolidate"]')?.textContent.trim(),
      repair: document.querySelector('[data-prep="repair"]')?.textContent.trim()
    }));
    await run.check('all three Silver actions switch on from the layer panel',
      silverState.dedupe === 'ON' && silverState.consolidate === 'ON' && silverState.repair === 'ON',
      silverState);
    const after = await healthOf();
    await run.check('Silver work improves the derived Gold list health',
      after.health !== null && before.health !== null && after.health < before.health,
      { before: before.health, after: after.health });

    await clickAndWait(page, '[data-val="full"]', 200);
    await clickAndWait(page, '[data-prep="suppression"]', 200);
    await clickAndWait(page, '[data-inv="generic"]', 200);
    await clickAndWait(page, '[data-rem="0"]', 200);
    await clickAndWait(page, '#qGrid .qbtn[data-q="3"][data-act="simplify"]', 300);
    for (const id of [5, 7, 8, 10, 11, 12]) {
      await clickAndWait(page, `#qGrid .qbtn[data-q="${id}"][data-act="cut"]`, 520);
    }
    await clickAndWait(page, '#launchBtn', 300);
    await waitForVisible(page, '#runStage');
    await waitCountdownDone(page);
    await clickAndWait(page, '#skipBtn', 600);
    await waitForVisible(page, '#report');
    const ledger = await page.evaluate(() => {
      const heading = [...document.querySelectorAll('#report h2')]
        .find((el) => (el.textContent || '').includes('LIST PREPARATION'));
      if (!heading) return { present: false };
      const card = heading.closest('.reportcard') || heading.parentElement;
      const text = (card.textContent || '').replace(/\s+/g, ' ');
      return {
        present: true,
        hasRecordsIn: text.includes('Records in (Bronze)'),
        hasPromoted: text.includes('Promoted to the contact master (Gold)'),
        hasHealth: /List health at launch \(before validation\)/.test(text),
        excerpt: text.slice(0, 400)
      };
    });
    await run.check('campaign report carries the list preparation ledger',
      ledger.present && ledger.hasRecordsIn && ledger.hasPromoted && ledger.hasHealth, ledger);
    await checkNoJourneyErrors(run, 'medallion prep scenario');
  } catch (error) {
    await run.record('medallion prep scenario completes without a harness exception', false, {
      error: error.message,
      stack: String(error.stack || '').split('\n').slice(0, 8)
    }, true);
  } finally {
    await closeScenarioPage(run);
  }
  return run;
}

async function runSurveyIdentityScenario(browser, gameUrl, viewport, options) {
  const run = newScenarioRun(viewport, options);
  try {
    const page = await openScenarioPage(browser, run, viewport);
    await page.goto(gameUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    await waitForVisible(page, '#startScreen');

    const gridText = await page.evaluate(() =>
      (document.querySelector('#levelGrid')?.textContent || '').replace(/\s+/g, ' '));
    await run.check('level cards name each survey beside its level',
      gridText.includes('LEVEL 1 · EASY · FIRST SEND · SUPPORT EXPERIENCE') &&
      gridText.includes('LEVEL 2 · EASY · THE SPLIT · M365 COPILOT / AI ADOPTION'),
      { excerpt: gridText.slice(0, 320) });

    const topBrdText = await page.$eval('#topBrdBtn', (el) => (el.textContent || '').trim());
    await run.check('top bar carries a short ? BRD link', topBrdText === '? BRD', { topBrdText });
    await clickAndWait(page, '#topBrdBtn', 400);
    await page.waitForSelector('#studyBRD.open', { visible: true, timeout: 10000 });
    const topBrd = await page.evaluate(() =>
      (document.querySelector('#brdContent')?.textContent || '').replace(/\s+/g, ' '));
    await run.check('top ? BRD opens the selected level BRD before setup',
      topBrd.includes('Support Experience Survey'), { excerpt: topBrd.slice(0, 240) });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#studyBRD').classList.contains('open'), { timeout: 5000 });
    const topFocusAfter = await page.evaluate(() => document.activeElement?.id || '');
    await run.check('top BRD Escape restores focus to the top link', topFocusAfter === 'topBrdBtn', { topFocusAfter });

    await clickAndWait(page, '#startBtn', 500);
    await waitForVisible(page, '#setup');
    const bannerText = await page.evaluate(() =>
      (document.querySelector('#levelBanner')?.textContent || '').replace(/\s+/g, ' '));
    const hudText = await page.evaluate(() =>
      (document.querySelector('#hudLevel')?.textContent || '').replace(/\s+/g, ' '));
    await run.check('setup banner and HUD name the Level 1 survey',
      bannerText.includes('Survey: Support Experience Survey') && hudText.includes('SUPPORT EXPERIENCE'),
      { banner: bannerText.slice(0, 240), hud: hudText.slice(0, 240) });
    await run.check('setup banner announces the level own BRD beside its link',
      bannerText.includes('THIS LEVEL HAS ITS OWN BRD') && bannerText.includes('Read the purpose, sponsor, audience'),
      { banner: bannerText.slice(0, 320) });

    await clickAndWait(page, '#setupBrdBtn', 400);
    await page.waitForSelector('#studyBRD.open', { visible: true, timeout: 10000 });
    const brd = await page.evaluate(() =>
      (document.querySelector('#brdContent')?.textContent || '').replace(/\s+/g, ' '));
    await run.check('Level 1 BRD renders its own study from the survey record',
      brd.includes('Support Experience Survey') && brd.includes('SPONSOR') &&
      brd.includes('Support Experience team') && brd.includes('AUDIENCE') &&
      brd.includes('overall satisfaction') && brd.includes('renewal risk') &&
      !brd.includes('M365 Copilot Adoption Survey') && !brd.includes('Azure Cloud Services Survey') &&
      !brd.includes('Collect credible answers on the required business topics below'),
      { excerpt: brd.slice(0, 400) });
    await checkOverflow(run, 'Level 1 BRD open');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#studyBRD').classList.contains('open'), { timeout: 5000 });
    const focusAfter = await page.evaluate(() => document.activeElement?.id || '');
    await run.check('BRD Escape closes and restores focus to the opener', focusAfter === 'setupBrdBtn', { focusAfter });

    await page.evaluate(() => { selectLevel(2, true); });
    await waitForVisible(page, '#setup');
    const banner2 = await page.evaluate(() =>
      (document.querySelector('#levelBanner')?.textContent || '').replace(/\s+/g, ' '));
    await clickAndWait(page, '#agendaBrdBtn', 400);
    await page.waitForSelector('#studyBRD.open', { visible: true, timeout: 10000 });
    const brd2 = await page.evaluate(() =>
      (document.querySelector('#brdContent')?.textContent || '').replace(/\s+/g, ' '));
    await run.check('Level 2 BRD renders its own Copilot study through the same model',
      banner2.includes('Survey: M365 Copilot Adoption Survey') &&
      brd2.includes('M365 Copilot Adoption Survey') && !brd2.includes('Support Experience Survey') &&
      brd2.includes('SPONSOR') && brd2.includes('AI Adoption team') && brd2.includes('AUDIENCE') &&
      brd2.includes('adoption breadth') && brd2.includes('enablement gap') &&
      brd2.includes('two invitation variants against the same instrument'),
      { banner: banner2.slice(0, 240), excerpt: brd2.slice(0, 320) });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#studyBRD').classList.contains('open'), { timeout: 5000 });

    await page.evaluate(() => { selectLevel(3, true); });
    await waitForVisible(page, '#setup');
    const banner3 = await page.evaluate(() =>
      (document.querySelector('#levelBanner')?.textContent || '').replace(/\s+/g, ' '));
    await clickAndWait(page, '#brdBtn', 400);
    await page.waitForSelector('#studyBRD.open', { visible: true, timeout: 10000 });
    const brd3 = await page.evaluate(() =>
      (document.querySelector('#brdContent')?.textContent || '').replace(/\s+/g, ' '));
    await run.check('Level 3 BRD renders its own Azure study with the sponsor as stakeholder',
      banner3.includes('Survey: Azure Cloud Services Survey') &&
      brd3.includes('Azure Cloud Services Survey') && !brd3.includes('Support Experience Survey') &&
      !brd3.includes('M365 Copilot Adoption Survey') &&
      brd3.includes('SPONSOR') && brd3.includes('Azure product team') && brd3.includes('AUDIENCE') &&
      brd3.includes('service reliability') && brd3.includes('capability gaps') &&
      brd3.includes("sponsor is also this study's stakeholder"),
      { banner: banner3.slice(0, 240), excerpt: brd3.slice(0, 320) });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#studyBRD').classList.contains('open'), { timeout: 5000 });

    await page.evaluate(() => { selectLevel(4, true); });
    await waitForVisible(page, '#setup');
    const banner4 = await page.evaluate(() =>
      (document.querySelector('#levelBanner')?.textContent || '').replace(/\s+/g, ' '));
    await clickAndWait(page, '#brdBtn', 400);
    await page.waitForSelector('#studyBRD.open', { visible: true, timeout: 10000 });
    const brd4 = await page.evaluate(() =>
      (document.querySelector('#brdContent')?.textContent || '').replace(/\s+/g, ' '));
    await run.check('Level 4 BRD renders its own Relationship study with the goodwill gate and report-back commitment',
      banner4.includes('Survey: Account Team Relationship Survey') &&
      brd4.includes('Account Team Relationship Survey') && !brd4.includes('Support Experience Survey') &&
      !brd4.includes('M365 Copilot Adoption Survey') && !brd4.includes('Azure Cloud Services Survey') &&
      brd4.includes('SPONSOR') && brd4.includes('Account Management team') && brd4.includes('AUDIENCE') &&
      brd4.includes('account team responsiveness') && brd4.includes('renewal intent') &&
      brd4.includes('ending goodwill 35 or higher') && brd4.includes('feedback commitment'),
      { banner: banner4.slice(0, 240), excerpt: brd4.slice(0, 320) });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#studyBRD').classList.contains('open'), { timeout: 5000 });

    await page.evaluate(() => { selectLevel(5, true); });
    await waitForVisible(page, '#setup');
    const banner5 = await page.evaluate(() =>
      (document.querySelector('#levelBanner')?.textContent || '').replace(/\s+/g, ' '));
    await clickAndWait(page, '#brdBtn', 400);
    await page.waitForSelector('#studyBRD.open', { visible: true, timeout: 10000 });
    const brd5 = await page.evaluate(() =>
      (document.querySelector('#brdContent')?.textContent || '').replace(/\s+/g, ' '));
    await run.check('Level 5 BRD renders its own Perceptions study with the localization design',
      banner5.includes('Survey: General Perceptions of Microsoft Survey') &&
      brd5.includes('General Perceptions of Microsoft Survey') && !brd5.includes('Support Experience Survey') &&
      !brd5.includes('M365 Copilot Adoption Survey') && !brd5.includes('Azure Cloud Services Survey') &&
      !brd5.includes('Account Team Relationship Survey') &&
      brd5.includes('SPONSOR') && brd5.includes('Brand and Perceptions research team') && brd5.includes('AUDIENCE') &&
      brd5.includes('overall favorability') && brd5.includes('AI leadership perception') &&
      brd5.includes('45+ languages') && brd5.includes('fielding failure, not a finding'),
      { banner: banner5.slice(0, 240), excerpt: brd5.slice(0, 320) });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#studyBRD').classList.contains('open'), { timeout: 5000 });

    await page.evaluate(() => { selectLevel(6, true); });
    await waitForVisible(page, '#setup');
    const banner6 = await page.evaluate(() =>
      (document.querySelector('#levelBanner')?.textContent || '').replace(/\s+/g, ' '));
    await clickAndWait(page, '#brdBtn', 400);
    await page.waitForSelector('#studyBRD.open', { visible: true, timeout: 10000 });
    const brd6 = await page.evaluate(() =>
      (document.querySelector('#brdContent')?.textContent || '').replace(/\s+/g, ' '));
    await run.check('Level 6 BRD renders its own Flagship study with the annual stakes and Executive Blast audience',
      banner6.includes('Survey: Enterprise Relationship Flagship Annual Survey') &&
      brd6.includes('Enterprise Relationship Flagship Annual Survey') && !brd6.includes('Support Experience Survey') &&
      !brd6.includes('M365 Copilot Adoption Survey') && !brd6.includes('Azure Cloud Services Survey') &&
      !brd6.includes('Account Team Relationship Survey') && !brd6.includes('General Perceptions of Microsoft Survey') &&
      brd6.includes('SPONSOR') && brd6.includes('Enterprise Relationship team') && brd6.includes('AUDIENCE') &&
      brd6.includes('overall relationship') && brd6.includes('strategic alignment') &&
      brd6.includes('Executive Blast is the available audience') && brd6.includes('one fielding a year'),
      { banner: banner6.slice(0, 240), excerpt: brd6.slice(0, 320) });
    await page.keyboard.press('Escape');
    await checkNoJourneyErrors(run, 'per-level survey identity scenario');
  } catch (error) {
    await run.record('per-level survey identity scenario completes without a harness exception', false, {
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
      for (const scenario of [runQuickBounceScenario, runCutFloorScenario, runCampaignBounceScenario, runMedallionScenario, runSurveyIdentityScenario]) {
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
