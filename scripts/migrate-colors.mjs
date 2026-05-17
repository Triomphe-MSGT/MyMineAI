#!/usr/bin/env node
/**
 * Migration palette MyMine : dark → blanc + bleu.
 * Remplace tous les hex / rgba dark-mode par leurs équivalents light-mode.
 * Usage: node scripts/migrate-colors.mjs
 */

import { readFileSync, writeFileSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', 'client', 'src');

const REPLACEMENTS = [
  // === Passe 2 : adoucir le blanc et les textes (1.0 → 1.1) ===
  // text primary : noir-bleu → gris-bleu doux
  ['#0B1F3A', '#1F2D4A'],
  ['#0b1f3a', '#1F2D4A'],
  // text secondary : un poil moins saturé
  ['#5A6A82', '#607089'],
  ['#5a6a82', '#607089'],
  // text muted
  ['#98A4B6', '#A0ABBD'],
  ['#98a4b6', '#A0ABBD'],
  // border
  ['#E1E8F0', '#DDE5EF'],
  ['#e1e8f0', '#DDE5EF'],
  ['#C8D5E5', '#C2CFE0'],
  ['#c8d5e5', '#C2CFE0'],
  // blue : adouci légèrement
  ['#2D8CFF', '#3D8BF0'],
  ['#2d8cff', '#3D8BF0'],
  // bleu soft un poil plus calme
  ['#E8F2FF', '#E6F0FB'],
  ['#e8f2ff', '#E6F0FB'],
  // bleu deep
  ['#0B5BD3', '#1F5FBE'],
  ['#0b5bd3', '#1F5FBE'],
  // accent red désaturé
  ['#E5484D', '#D55C60'],
  ['#e5484d', '#D55C60'],
  // rgba bleu glow (rgba(45,140,255 → rgba(61,139,240)
  ['rgba(45,140,255', 'rgba(61,139,240'],
  ['rgba(45, 140, 255', 'rgba(61, 139, 240'],
];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) yield* walk(p);
    else if (/\.(jsx?|css)$/.test(entry)) yield p;
  }
}

let totalFiles = 0;
let totalReplacements = 0;

for (const file of walk(ROOT)) {
  // Skip already-migrated files
  if (file.endsWith('SplashScreen.jsx')) {
    // We'll handle SplashScreen manually for its own light treatment
  }

  const before = readFileSync(file, 'utf8');
  let after = before;
  let localCount = 0;
  for (const [from, to] of REPLACEMENTS) {
    const parts = after.split(from);
    if (parts.length > 1) {
      localCount += parts.length - 1;
      after = parts.join(to);
    }
  }
  if (after !== before) {
    writeFileSync(file, after);
    totalFiles += 1;
    totalReplacements += localCount;
    console.log(`✓ ${file.replace(ROOT, 'components')} — ${localCount} replacements`);
  }
}

console.log(`\nDone. ${totalReplacements} replacements across ${totalFiles} files.`);
