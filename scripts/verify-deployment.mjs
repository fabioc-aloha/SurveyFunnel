import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { files, output } from './build-site.mjs';

const base = new URL(process.argv[2]);
assert.equal(base.protocol, 'https:', 'Production verification requires HTTPS.');
const revision = createHash('sha256')
  .update(readFileSync(join(output, 'index.html'))).digest('hex');

async function verify() {
  for (const [, destination] of files.filter(([, path]) => path !== 'staticwebapp.config.json')) {
    const url = new URL(destination === 'index.html' ? '/' : `/${destination}`, base);
    url.searchParams.set('verify', revision);
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    assert.equal(response.status, 200, `${destination}: HTTP status`);
    assert.equal(
      createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex'),
      createHash('sha256').update(readFileSync(join(output, destination))).digest('hex'),
      `${destination}: deployed bytes differ`
    );
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    if (destination === 'index.html') {
      assert.match(response.headers.get('content-type') ?? '', /text\/html/);
      assert.equal(response.headers.get('x-frame-options'), 'DENY');
    }
    if (destination.endsWith('.ttf')) {
      assert.match(response.headers.get('content-type') ?? '', /font\/ttf/);
    }
  }
  for (const path of ['/README.md', '/AGENTS.md', '/docs/development.md']) {
    const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(15000) });
    assert.equal(response.status, 404, `${path} must not be published`);
  }
}

for (let attempt = 1; attempt <= 12; attempt++) {
  try {
    await verify();
    console.log(`Verified production HTML, font, license, headers, and unpublished docs at ${base.origin}.`);
    break;
  } catch (error) {
    console.error(`Verification attempt ${attempt}/12 failed: ${error.message}`);
    if (attempt === 12) throw error;
    await setTimeout(10000);
  }
}
