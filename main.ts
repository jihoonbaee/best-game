// Thornwatch — the entry program for best-game-01 (Node 22, stdlib only).
//
// It hands the game in: copies game/ to /output, writes /output/screenshots/
// and /output/dossier.json (via the kit's vendored buildDossier).
//
// Why screenshots live here as base64: the repository is pushed through an
// API that only accepts UTF-8 text, so the JPEGs are stored as
// screenshots/*.jpg.b64 and decoded back to real JPEGs here, in /output,
// where the gate reads them. The decode is byte-exact (verified against the
// originals by sha256 before pushing), and the dossier is built from the
// decoded files, so what the judge sees is the real screenshots.
// A real .jpg/.jpeg/.png in screenshots/ is copied through unchanged.
//
// Run it outside the grader with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });

// Screenshots: decode *.jpg.b64 to *.jpg, copy real images through as-is.
const shotsIn = join(here, 'screenshots');
const shotsOut = join(out, 'screenshots');
mkdirSync(shotsOut, { recursive: true });
if (existsSync(shotsIn)) {
  for (const file of readdirSync(shotsIn).sort()) {
    if (file.startsWith('.')) continue;
    const src = join(shotsIn, file);
    if (file.endsWith('.b64')) {
      const name = basename(file, '.b64');
      const text = readFileSync(src, 'utf8').replace(/\s+/g, '');
      writeFileSync(join(shotsOut, name), Buffer.from(text, 'base64'));
    } else if (['.jpg', '.jpeg', '.png'].includes(extname(file).toLowerCase())) {
      cpSync(src, join(shotsOut, file));
    }
  }
}

// The gate's caps (from the competition's RULES.txt): the dossier text cap
// shapes the bytes; the rest refuse an entry the scorer would refuse.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
