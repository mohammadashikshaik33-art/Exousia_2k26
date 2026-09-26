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

async function captureFinalScreenshots() {
  server.listen(PORT, async () => {
    console.log(`Final QA Server running at http://localhost:${PORT}`);
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    try {
      const page = await browser.newPage();
      
      // Navigate to homepage
      await page.setViewport({ width: 390, height: 844, isMobile: true });
      await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle2' });

      // PART 3 & 7: Test Image Loads & Caveat Brush font
      const assetCheck = await page.evaluate(async () => {
        const checkImg = (src) => new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ src, complete: img.complete, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, currentSrc: img.currentSrc });
          img.onerror = (e) => resolve({ src, error: true });
          img.src = src;
        });

        const bikes = await checkImg('/images/stranger-intro-bg-bikes.jpg');
        const rift = await checkImg('/images/stranger-intro-bg-rift.jpg');
        
        await document.fonts.ready;
        const fontLoaded = document.fonts.check('400 50px "Caveat Brush"');

        return { bikes, rift, fontLoaded };
      });

      console.log('--- ASSET & FONT AUDIT ---');
      console.log(JSON.stringify(assetCheck, null, 2));

      // Dismiss intro to view homepage
      await page.evaluate(() => {
        const skipBtn = document.getElementById('intro-skip-btn');
        if (skipBtn) skipBtn.click();
      });
      await new Promise(r => setTimeout(r, 1500));

      // 1. Capture 390x844 screenshot
      const path390 = path.resolve('./screenshot-final-mobile-390.png');
      await page.screenshot({ path: path390 });
      console.log(`Saved: ${path390}`);

      // Also save debug wallpaper & creature screenshots
      const pathWallpaper = path.resolve('./screenshot-debug-wallpaper.png');
      const pathCreature = path.resolve('./screenshot-debug-creature.png');
      await page.screenshot({ path: pathWallpaper });
      await page.screenshot({ path: pathCreature });

      // 2. Capture 430x932 screenshot
      await page.setViewport({ width: 430, height: 932, isMobile: true });
      const path430 = path.resolve('./screenshot-final-mobile-430.png');
      await page.screenshot({ path: path430 });
      console.log(`Saved: ${path430}`);

      // Copy screenshots to Artifacts Directory for direct visual view
      const artifactDir = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\0b4a90fe-e48e-45aa-b229-563c65d25b09';
      if (fs.existsSync(artifactDir)) {
        fs.copyFileSync(path390, path.join(artifactDir, 'screenshot-final-mobile-390.png'));
        fs.copyFileSync(path430, path.join(artifactDir, 'screenshot-final-mobile-430.png'));
        fs.copyFileSync(pathWallpaper, path.join(artifactDir, 'screenshot-debug-wallpaper.png'));
        fs.copyFileSync(pathCreature, path.join(artifactDir, 'screenshot-debug-creature.png'));
        console.log('Successfully copied screenshots to artifacts directory.');
      }

      // Stacking & Covering Audit
      const coveringAudit = await page.evaluate(() => {
        const centerEl = document.elementFromPoint(215, 466);
        const rightEl = document.elementFromPoint(350, 466);
        const homeSec = document.querySelector('#home');
        const mainContent = document.querySelector('#main-content');
        const envBg = document.querySelector('.env-wallpaper');
        const creature = document.querySelector('.env-creature-img');

        return {
          centerElement: centerEl ? { tag: centerEl.tagName, class: centerEl.className, id: centerEl.id } : null,
          rightElement: rightEl ? { tag: rightEl.tagName, class: rightEl.className, id: rightEl.id } : null,
          homeBg: homeSec ? getComputedStyle(homeSec).backgroundColor : null,
          mainContentBg: mainContent ? getComputedStyle(mainContent).backgroundColor : null,
          envWallpaperOpacity: envBg ? getComputedStyle(envBg).opacity : null,
          envWallpaperDisplay: envBg ? getComputedStyle(envBg).display : null,
          creatureOpacity: creature ? getComputedStyle(creature).opacity : null,
          creatureDisplay: creature ? getComputedStyle(creature).display : null
        };
      });

      console.log('--- STACKING & COVERING AUDIT ---');
      console.log(JSON.stringify(coveringAudit, null, 2));

    } finally {
      await browser.close();
      server.close();
    }
  });
}

captureFinalScreenshots();
