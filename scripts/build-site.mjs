import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const output = join(root, 'dist');
export const files = [
  ['site/index.html', 'index.html'],
  ['site/staticwebapp.config.json', 'staticwebapp.config.json'],
  ['assets/press-start-2p.ttf', 'assets/press-start-2p.ttf'],
  ['assets/OFL-Press-Start-2P.txt', 'assets/OFL-Press-Start-2P.txt'],
  ['assets/play-mobile-qr.svg', 'assets/play-mobile-qr.svg']
];

export function validateHtml(html) {
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  if (!scripts.length) throw new Error('The game contains no inline scripts.');
  for (const [index, script] of scripts.entries()) {
    if (/\bsrc\s*=/i.test(script[1])) {
      throw new Error('External scripts must be explicitly included in the deployment package.');
    }
    new Script(script[2], { filename: `index.html:inline-script-${index + 1}` });
  }
  return scripts.length;
}

export function buildSite() {
  const count = validateHtml(readFileSync(join(root, 'site', 'index.html'), 'utf8'));
  JSON.parse(readFileSync(join(root, 'site', 'staticwebapp.config.json'), 'utf8'));
  for (const [source] of files) readFileSync(join(root, source));
  rmSync(output, { recursive: true, force: true });
  for (const [source, destination] of files) {
    const target = join(output, destination);
    mkdirSync(dirname(target), { recursive: true });
    const content = destination.endsWith('.ttf')
      ? readFileSync(join(root, source))
      : readFileSync(join(root, source), 'utf8').replace(/\r\n?/g, '\n');
    writeFileSync(target, content);
  }
  console.log(`Validated ${count} inline scripts; packaged ${files.length} files in dist.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildSite();
}
