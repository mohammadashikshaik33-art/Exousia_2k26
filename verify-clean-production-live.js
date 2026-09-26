import puppeteer from 'puppeteer';
import https from 'https';
import path from 'path';
import fs from 'fs';

const PROD_ALIAS = 'https://exousia-vert.vercel.app';

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ url, status: res.statusCode, headers: res.headers });
    }).on('error', (err) => {
      resolve({ url, error: err.message });
    });
  });
}

async function verifyCleanProductionLive() {
  console.log('=== VERIFYING LIVE PRODUCTION ASSET HTTP STATUS ===');
  const wallpaperAsset = await checkUrl(`${PROD_ALIAS}/images/stranger-user-wallpaper.jpg`);
  console.log('Live Production Wallpaper Asset:', JSON.stringify(wallpaperAsset, null, 2));

  console.log('\n=== PUPPETEER LIVE PRODUCTION QA (https://exousia-vert.vercel.app) ===');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    
    // 1. Capture 390x844 Mobile Viewport
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.goto(PROD_ALIAS, { waitUntil: 'networkidle2' });

    // Dismiss Intro
    await page.evaluate(() => {
      const skipBtn = document.getElementById('intro-skip-btn');
      if (skipBtn) skipBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    const path390 = path.resolve('./screenshot-live-prod-390.png');
    await page.screenshot({ path: path390 });
    console.log(`[PASS] Live Production 390x844 Screenshot: ${path390}`);

    // 2. Capture 430x932 Mobile Viewport
    await page.setViewport({ width: 430, height: 932, isMobile: true });
    const path430 = path.resolve('./screenshot-live-prod-430.png');
    await page.screenshot({ path: path430 });
    console.log(`[PASS] Live Production 430x932 Screenshot: ${path430}`);

    // DOM & Computed Style Audit on Live Production Page
    const prodAudit = await page.evaluate(() => {
      const creatureEl = document.querySelector('.env-creature-wrapper');
      const wallpaperEl = document.querySelector('.env-wallpaper');
      const heroTitle = document.querySelector('#hero-title');
      const heroSub2k26 = document.querySelector('#hero-sub-2k26');

      return {
        monsterAbsent: !creatureEl,
        wallpaperComputedBg: wallpaperEl ? getComputedStyle(wallpaperEl).backgroundImage : null,
        heroTitleFont: heroTitle ? getComputedStyle(heroTitle).fontFamily : null,
        heroSub2k26Font: heroSub2k26 ? getComputedStyle(heroSub2k26).fontFamily : null,
        heroSub2k26Stroke: heroSub2k26 ? getComputedStyle(heroSub2k26).webkitTextStroke : null
      };
    });

    console.log('\n--- LIVE PRODUCTION DOM AUDIT ---');
    console.log(JSON.stringify(prodAudit, null, 2));

    // Copy screenshots to Artifacts Directory
    const artifactDir = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\0b4a90fe-e48e-45aa-b229-563c65d25b09';
    if (fs.existsSync(artifactDir)) {
      fs.copyFileSync(path390, path.join(artifactDir, 'screenshot-live-prod-390.png'));
      fs.copyFileSync(path430, path.join(artifactDir, 'screenshot-live-prod-430.png'));
      console.log('\nSuccessfully copied live production screenshots to artifacts directory.');
    }

  } finally {
    await browser.close();
  }
}

verifyCleanProductionLive();
