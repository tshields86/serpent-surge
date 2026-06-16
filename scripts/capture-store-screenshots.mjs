#!/usr/bin/env node
// Captures all store screenshots at device-pixel resolution.
//
// App Store / Google Play require screenshots at the device's native pixel
// resolution, not the CSS viewport. iPhones use a 3x display, iPad uses 2x.
// We render at the CSS viewport size so the in-game pickScale() logic still
// picks the "phone" layout, but tell Playwright to rasterize at 3x (or 2x)
// so the final PNG matches store dimensions.
//
// Run:   node scripts/capture-store-screenshots.mjs
// Requires the dev server running on http://localhost:5173.

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const outRoot = resolve(repoRoot, 'screenshots/store');

const DEV_URL = process.env.DEV_URL ?? 'http://localhost:5173';

const SCENES = [
  'title',
  'gameplay',
  'gameplay2',
  'powerup',
  'death',
  'collection',
  'leaderboard',
];

// CSS viewport + device-pixel-ratio combos. The output PNG dimensions are
// width * dpr by height * dpr — exactly what each store wants.
const DEVICES = [
  { dir: 'ios-6.9',     width: 430,  height: 932,  dpr: 3, note: '1290x2796 — iPhone 15/16 Pro Max (App Store "6.9 inch Display" slot)' },
  { dir: 'ios-5.5',     width: 414,  height: 736,  dpr: 3, note: '1242x2208 — iPhone 8 Plus' },
  { dir: 'ios-ipad',    width: 1024, height: 1366, dpr: 2, note: '2048x2732 — iPad Pro 12.9"' },
  { dir: 'google-play', width: 360,  height: 640,  dpr: 3, note: '1080x1920 — Google Play phone' },
];

async function captureScene(context, scene, device) {
  const page = await context.newPage();
  await page.goto(`${DEV_URL}/?screenshot=${scene}`, { waitUntil: 'networkidle' });
  // Let the screenshot harness apply its mock state (it uses requestAnimationFrame
  // to defer setup by one frame, plus we want fonts swapped in).
  await page.waitForTimeout(800);
  const outFile = resolve(outRoot, device.dir, `${scene}.png`);
  await mkdir(dirname(outFile), { recursive: true });
  await page.screenshot({ path: outFile, type: 'png' });
  await page.close();
  return outFile;
}

async function main() {
  console.log(`Capturing ${SCENES.length * DEVICES.length} screenshots from ${DEV_URL}...`);
  const browser = await chromium.launch();
  try {
    for (const device of DEVICES) {
      console.log(`\n[${device.dir}] ${device.note}`);
      const context = await browser.newContext({
        viewport: { width: device.width, height: device.height },
        deviceScaleFactor: device.dpr,
      });
      for (const scene of SCENES) {
        const file = await captureScene(context, scene, device);
        console.log(`  ✓ ${scene} → ${file.replace(repoRoot + '/', '')}`);
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
