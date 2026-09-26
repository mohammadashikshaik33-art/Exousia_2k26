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

async function runSeparationQA() {
  server.listen(PORT, async () => {
    console.log(`Separation QA Server running at http://localhost:${PORT}`);
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 844, isMobile: true });

      // TEST A: Capture Intro State
      await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle2' });
      const pathIntro = path.resolve('./screenshot-qa-intro.png');
      await page.screenshot({ path: pathIntro });
      console.log(`[A] Captured Intro Screenshot: ${pathIntro}`);

      // TEST B: Homepage Immediately After Intro (Dismiss Intro)
      await page.evaluate(() => {
        const skipBtn = document.getElementById('intro-skip-btn');
        if (skipBtn) skipBtn.click();
      });
      await new Promise(r => setTimeout(r, 1200));

      const pathAfterIntro = path.resolve('./screenshot-qa-homepage-after-intro.png');
      await page.screenshot({ path: pathAfterIntro });
      console.log(`[B] Captured Homepage After Intro: ${pathAfterIntro}`);

      // TEST C: Homepage After 10 Seconds (Observe Cloud Movement)
      await new Promise(r => setTimeout(r, 10000));
      const path10s = path.resolve('./screenshot-qa-homepage-10s.png');
      await page.screenshot({ path: path10s });
      console.log(`[C] Captured Homepage After 10s: ${path10s}`);

      // TEST D: Homepage After Skipping Intro (New Session)
      const page2 = await browser.newPage();
      await page2.setViewport({ width: 390, height: 844, isMobile: true });
      await page2.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle2' });

      await page2.evaluate(() => {
        const skipBtn = document.getElementById('intro-skip-btn');
        if (skipBtn) skipBtn.click();
      });
      await new Promise(r => setTimeout(r, 1200));

      const pathSkip = path.resolve('./screenshot-qa-homepage-skip.png');
      await page2.screenshot({ path: pathSkip });
      console.log(`[D] Captured Homepage After Skip: ${pathSkip}`);

      // Audit Intro Asset Leakage on Homepage DOM
      const domAudit = await page2.evaluate(() => {
        const envWallpaper = document.querySelector('.env-wallpaper');
        const envCreatureImg = document.querySelector('.env-creature-img');
        const introContainer = document.querySelector('#intro-container');

        const wallpaperBg = envWallpaper ? getComputedStyle(envWallpaper).backgroundImage : null;
        const creatureBg = envCreatureImg ? getComputedStyle(envCreatureImg).backgroundImage : null;

        return {
          wallpaperBg,
          creatureBg,
          introContainerPresent: !!introContainer,
          introContainerDisplay: introContainer ? getComputedStyle(introContainer).display : 'unmounted'
        };
      });

      console.log('\n--- DOM ARCHITECTURE & ASSET AUDIT ---');
      console.log(JSON.stringify(domAudit, null, 2));

      // Copy screenshots to Artifacts Directory
      const artifactDir = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\0b4a90fe-e48e-45aa-b229-563c65d25b09';
      if (fs.existsSync(artifactDir)) {
        fs.copyFileSync(pathIntro, path.join(artifactDir, 'screenshot-qa-intro.png'));
        fs.copyFileSync(pathAfterIntro, path.join(artifactDir, 'screenshot-qa-homepage-after-intro.png'));
        fs.copyFileSync(path10s, path.join(artifactDir, 'screenshot-qa-homepage-10s.png'));
        fs.copyFileSync(pathSkip, path.join(artifactDir, 'screenshot-qa-homepage-skip.png'));
        console.log('\nSuccessfully copied all QA screenshots to artifacts directory.');
      }

    } finally {
      await browser.close();
      server.close();
    }
  });
}

runSeparationQA();
