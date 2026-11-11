import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { buildSite, files, output, root, validateHtml } from './build-site.mjs';

test('production package contains only the game, config, icons, font, license, and QR code', () => {
  buildSite();
  assert.deepEqual(readdirSync(output).sort(), [
    'apple-touch-icon.png', 'assets', 'favicon-32x32.png', 'favicon.svg',
    'index.html', 'staticwebapp.config.json'
  ]);
  assert.deepEqual(readdirSync(join(output, 'assets')).sort(), [
    'OFL-Press-Start-2P.txt', 'play-mobile-qr.svg', 'press-start-2p.ttf'
  ]);
  for (const [source, destination] of files) {
    const expected = destination.endsWith('.ttf') || destination.endsWith('.png')
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
  assert.match(html, /href="https:\/\/nice-mushroom-0bdb0ef0f\.6\.azurestaticapps\.net\/"/);
  assert.match(html, /src="\.\.\/assets\/play-mobile-qr\.svg"/);
  const qr = readFileSync(join(output, 'assets', 'play-mobile-qr.svg'), 'utf8');
  assert.match(qr, /<svg/);
  assert.doesNotMatch(qr, /<script|<foreignObject/);
});

test('favicon and apple touch icon are packaged and linked from the page head', () => {
  buildSite();
  const html = readFileSync(join(output, 'index.html'), 'utf8');
  assert.match(html, /<link rel="icon" type="image\/svg\+xml" href="favicon\.svg" \/>/);
  assert.match(html, /<link rel="icon" type="image\/png" sizes="32x32" href="favicon-32x32\.png" \/>/);
  assert.match(html, /<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon\.png" \/>/);
  const svg = readFileSync(join(output, 'favicon.svg'), 'utf8');
  assert.match(svg, /<svg/);
  assert.match(svg, /#141826/);
  for (const [name, size] of [['favicon-32x32.png', 32], ['apple-touch-icon.png', 180]]) {
    const png = readFileSync(join(output, name));
    assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], `${name}: PNG signature`);
    assert.equal(png.readUInt32BE(16), size, `${name}: width`);
    assert.equal(png.readUInt32BE(20), size, `${name}: height`);
  }
});

test('syntax validation rejects invalid inline JavaScript', () => {
  assert.throws(() => validateHtml('<script>const broken = ;</script>'), SyntaxError);
});

test('syntax validation rejects missing or unpackaged external scripts', () => {
  assert.throws(() => validateHtml('<h1>No scripts</h1>'), /no inline scripts/);
  assert.throws(() => validateHtml('<script src="missing.js"></script>'), /External scripts/);
});
