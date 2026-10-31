import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { buildSite, files, output, root, validateHtml } from './build-site.mjs';

test('production package contains only the game, config, font, and license', () => {
  buildSite();
  assert.deepEqual(readdirSync(output).sort(), ['assets', 'index.html', 'staticwebapp.config.json']);
  assert.deepEqual(readdirSync(join(output, 'assets')).sort(), [
    'OFL-Press-Start-2P.txt', 'press-start-2p.ttf'
  ]);
  for (const [source, destination] of files) {
    const expected = destination.endsWith('.ttf')
      ? readFileSync(join(root, source))
      : Buffer.from(readFileSync(join(root, source), 'utf8').replace(/\r\n?/g, '\n'));
    assert.equal(
      createHash('sha256').update(readFileSync(join(output, destination))).digest('hex'),
      createHash('sha256').update(expected).digest('hex'),
      `${destination}: packaged content must match normalized source`
    );
  }
  const html = readFileSync(join(output, 'index.html'), 'utf8');
  const font = /src:url\("([^"]+)"\) format\("truetype"\)/.exec(html);
  assert.ok(font, 'The local font declaration must be present.');
  const hostedPath = new URL(font[1], 'https://example.com/').pathname;
  assert.equal(hostedPath, '/assets/press-start-2p.ttf');
  assert.ok(readFileSync(join(output, hostedPath.slice(1))).length > 0);
});

test('syntax validation rejects invalid inline JavaScript', () => {
  assert.throws(() => validateHtml('<script>const broken = ;</script>'), SyntaxError);
});

test('syntax validation rejects missing or unpackaged external scripts', () => {
  assert.throws(() => validateHtml('<h1>No scripts</h1>'), /no inline scripts/);
  assert.throws(() => validateHtml('<script src="missing.js"></script>'), /External scripts/);
});
