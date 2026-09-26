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
  '.png': 'image/png'
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

async function captureScreenshots() {
  server.listen(PORT, async () => {
    console.log(`Screenshot server running at http://localhost:${PORT}`);
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    try {
      const page = await browser.newPage();
      
      // 1. Capture 390x844 mobile viewport screenshot
      await page.setViewport({ width: 390, height: 844, isMobile: true });
      await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle2' });

      // Dismiss intro
      await page.evaluate(() => {
        const skipBtn = document.getElementById('intro-skip-btn');
        if (skipBtn) skipBtn.click();
      });
      await new Promise(r => setTimeout(r, 1000));

      const screenshotPath390 = path.resolve('./screenshot-debug-creature-390.png');
      await page.screenshot({ path: screenshotPath390, fullPage: false });
      console.log(`Captured screenshot: ${screenshotPath390}`);

      // 2. Capture 430x932 mobile viewport screenshot
      await page.setViewport({ width: 430, height: 932, isMobile: true });
      const screenshotPath430 = path.resolve('./screenshot-debug-creature-430.png');
      await page.screenshot({ path: screenshotPath430, fullPage: false });

      // Inspect elements under center viewport to detect covering elements
      const elementAudit = await page.evaluate(() => {
        const centerEl = document.elementFromPoint(215, 466);
        const wallpaperEl = document.querySelector('.env-wallpaper');
        const homeSection = document.querySelector('#home');
        const mainContent = document.querySelector('#main-content');

        return {
          centerTag: centerEl ? centerEl.tagName : null,
          centerClass: centerEl ? centerEl.className : null,
          centerId: centerEl ? centerEl.id : null,
          wallpaperComputedBg: wallpaperEl ? window.getComputedStyle(wallpaperEl).backgroundImage : null,
          homeBg: homeSection ? window.getComputedStyle(homeSection).backgroundColor : null,
          mainContentBg: mainContent ? window.getComputedStyle(mainContent).backgroundColor : null
        };
      });

      console.log('\n--- PART 4/5: SCREENSHOT & COVERING ELEMENT AUDIT ---');
      console.log('Center Element From Point (215, 466):', elementAudit);

    } finally {
      await browser.close();
      server.close();
    }
  });
}

captureScreenshots();
