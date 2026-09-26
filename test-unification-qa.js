import puppeteer from 'puppeteer';
import http from 'http';
import path from 'path';
import fs from 'fs';

const PORT = 8098;
const DIST_DIR = path.resolve('./dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('404 Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

async function runUnificationQA() {
  server.listen(PORT, async () => {
    console.log(`Unification QA Server running at http://localhost:${PORT}`);
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 844, isMobile: true });

      await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle2' });

      // Dismiss Intro
      await page.evaluate(() => {
        const skipBtn = document.getElementById('intro-skip-btn');
        if (skipBtn) skipBtn.click();
      });
      await new Promise(r => setTimeout(r, 1200));

      // Capture T = 0s
      const path0s = path.resolve('./screenshot-unification-0s.png');
      await page.screenshot({ path: path0s });
      console.log(`[PASS] Captured T=0s Screenshot: ${path0s}`);

      // Wait 5s & Capture T = 5s
      await new Promise(r => setTimeout(r, 5000));
      const path5s = path.resolve('./screenshot-unification-5s.png');
      await page.screenshot({ path: path5s });
      console.log(`[PASS] Captured T=5s Screenshot: ${path5s}`);

      // Wait another 5s & Capture T = 10s
      await new Promise(r => setTimeout(r, 5000));
      const path10s = path.resolve('./screenshot-unification-10s.png');
      await page.screenshot({ path: path10s });
      console.log(`[PASS] Captured T=10s Screenshot: ${path10s}`);

      // Capture 430x932 Viewport
      await page.setViewport({ width: 430, height: 932, isMobile: true });
      const path430 = path.resolve('./screenshot-unification-430.png');
      await page.screenshot({ path: path430 });
      console.log(`[PASS] Captured 430x932 Screenshot: ${path430}`);

      // Capture Desktop 1280x800 Viewport
      await page.setViewport({ width: 1280, height: 800, isMobile: false });
      const pathDesktop = path.resolve('./screenshot-unification-desktop.png');
      await page.screenshot({ path: pathDesktop });
      console.log(`[PASS] Captured Desktop Screenshot: ${pathDesktop}`);

      // Comprehensive DOM & Style Audit
      const auditResult = await page.evaluate(() => {
        const creatureEl = document.querySelector('.env-creature-wrapper');
        const wallpaperEl = document.querySelector('.env-wallpaper');
        const cloudsFar = document.querySelector('.env-clouds-far');
        const heroTitle = document.querySelector('#hero-title');
        const heroSub2k26 = document.querySelector('#hero-sub-2k26');

        return {
          creatureElementExists: !!creatureEl,
          wallpaperBg: wallpaperEl ? getComputedStyle(wallpaperEl).backgroundImage : null,
          wallpaperFilter: wallpaperEl ? getComputedStyle(wallpaperEl).filter : null,
          cloudsFarTransform: cloudsFar ? getComputedStyle(cloudsFar).transform : null,
          heroTitleFontFamily: heroTitle ? getComputedStyle(heroTitle).fontFamily : null,
          heroTitleStroke: heroTitle ? getComputedStyle(heroTitle).webkitTextStroke : null,
          heroSub2k26FontFamily: heroSub2k26 ? getComputedStyle(heroSub2k26).fontFamily : null,
          heroSub2k26LetterSpacing: heroSub2k26 ? getComputedStyle(heroSub2k26).letterSpacing : null
        };
      });

      console.log('\n--- COMPREHENSIVE UNIFICATION AUDIT ---');
      console.log(JSON.stringify(auditResult, null, 2));

      // Copy screenshots to Artifacts Directory
      const artifactDir = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\0b4a90fe-e48e-45aa-b229-563c65d25b09';
      if (fs.existsSync(artifactDir)) {
        fs.copyFileSync(path0s, path.join(artifactDir, 'screenshot-unification-0s.png'));
        fs.copyFileSync(path5s, path.join(artifactDir, 'screenshot-unification-5s.png'));
        fs.copyFileSync(path10s, path.join(artifactDir, 'screenshot-unification-10s.png'));
        fs.copyFileSync(path430, path.join(artifactDir, 'screenshot-unification-430.png'));
        fs.copyFileSync(pathDesktop, path.join(artifactDir, 'screenshot-unification-desktop.png'));
        console.log('\nSuccessfully copied all unification screenshots to artifacts directory.');
      }

    } finally {
      await browser.close();
      server.close();
    }
  });
}

runUnificationQA();
