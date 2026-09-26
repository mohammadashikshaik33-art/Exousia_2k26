import puppeteer from 'puppeteer';
import http from 'http';
import https from 'https';
import path from 'path';
import fs from 'fs';

const PROD_DOMAIN = 'https://exousia-vert.vercel.app';

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ url, status: res.statusCode, headers: res.headers });
    }).on('error', (err) => {
      resolve({ url, error: err.message });
    });
  });
}

async function verifyProductionLive() {
  console.log('=== STEP 7 & 8: VERIFYING LIVE PRODUCTION ASSETS & HTTP STATUS ===');
  
  const asset1 = await checkUrl(`${PROD_DOMAIN}/images/stranger-user-wallpaper.jpg`);
  const asset2 = await checkUrl(`${PROD_DOMAIN}/images/demogorgon-flower-creature.jpg`);
  const asset3 = await checkUrl(`${PROD_DOMAIN}/images/stranger-intro-bg-rift.jpg`);
  
  console.log('Production Wallpaper Asset:', asset1);
  console.log('Production Standalone Creature Asset:', asset2);
  console.log('Production Intro Wallpaper Asset:', asset3);

  console.log('\n=== STEP 10: ACTUAL PRODUCTION VISUAL QA WITH PUPPETEER ===');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true });

    // 1. Capture Live Production Intro
    await page.goto(PROD_DOMAIN, { waitUntil: 'networkidle2' });
    const pathProdIntro = path.resolve('./screenshot-production-intro.png');
    await page.screenshot({ path: pathProdIntro });
    console.log(`[PASS] Production Intro Screenshot: ${pathProdIntro}`);

    // 2. Dismiss Intro on Production
    await page.evaluate(() => {
      const skipBtn = document.getElementById('intro-skip-btn');
      if (skipBtn) skipBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    const pathProdHomepage = path.resolve('./screenshot-production-homepage-after-intro.png');
    await page.screenshot({ path: pathProdHomepage });
    console.log(`[PASS] Production Homepage Screenshot: ${pathProdHomepage}`);

    // 3. New Session Skip Test
    const page2 = await browser.newPage();
    await page2.setViewport({ width: 390, height: 844, isMobile: true });
    await page2.goto(PROD_DOMAIN, { waitUntil: 'networkidle2' });

    await page2.evaluate(() => {
      const skipBtn = document.getElementById('intro-skip-btn');
      if (skipBtn) skipBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    const pathProdSkip = path.resolve('./screenshot-production-homepage-skip.png');
    await page2.screenshot({ path: pathProdSkip });
    console.log(`[PASS] Production Homepage Skip Screenshot: ${pathProdSkip}`);

    // 4. Capture 430x932 Viewport
    await page2.setViewport({ width: 430, height: 932, isMobile: true });
    const pathProd430 = path.resolve('./screenshot-production-430.png');
    await page2.screenshot({ path: pathProd430 });
    console.log(`[PASS] Production 430x932 Screenshot: ${pathProd430}`);

    // Audit DOM on Live Production Page
    const prodDomAudit = await page2.evaluate(() => {
      const wallpaperEl = document.querySelector('.env-wallpaper');
      const creatureEl = document.querySelector('.env-creature-img');
      const sub2k26 = document.querySelector('#hero-sub-2k26');

      return {
        wallpaperComputedBg: wallpaperEl ? getComputedStyle(wallpaperEl).backgroundImage : null,
        creatureComputedBg: creatureEl ? getComputedStyle(creatureEl).backgroundImage : null,
        sub2k26FontFamily: sub2k26 ? getComputedStyle(sub2k26).fontFamily : null,
        sub2k26LetterSpacing: sub2k26 ? getComputedStyle(sub2k26).letterSpacing : null
      };
    });

    console.log('\n--- LIVE PRODUCTION DOM & COMPUTED STYLE AUDIT ---');
    console.log(JSON.stringify(prodDomAudit, null, 2));

    // Copy to Artifacts Directory
    const artifactDir = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\0b4a90fe-e48e-45aa-b229-563c65d25b09';
    if (fs.existsSync(artifactDir)) {
      fs.copyFileSync(pathProdIntro, path.join(artifactDir, 'screenshot-production-intro.png'));
      fs.copyFileSync(pathProdHomepage, path.join(artifactDir, 'screenshot-production-homepage-after-intro.png'));
      fs.copyFileSync(pathProdSkip, path.join(artifactDir, 'screenshot-production-homepage-skip.png'));
      fs.copyFileSync(pathProd430, path.join(artifactDir, 'screenshot-production-430.png'));
      console.log('\nSuccessfully copied all live production screenshots to artifacts directory.');
    }

  } finally {
    await browser.close();
  }
}

verifyProductionLive();
