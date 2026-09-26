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

async function runFinalCreatureQA() {
  server.listen(PORT, async () => {
    console.log(`Final Creature QA Server running at http://localhost:${PORT}`);
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 844, isMobile: true });

      // Navigate to site
      await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle2' });

      // Dismiss Intro
      await page.evaluate(() => {
        const skipBtn = document.getElementById('intro-skip-btn');
        if (skipBtn) skipBtn.click();
      });
      await new Promise(r => setTimeout(r, 1200));

      // Check Asset Load for Standalone Creature
      const assetCheck = await page.evaluate(async () => {
        const checkImg = (src) => new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ src, complete: img.complete, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
          img.onerror = () => resolve({ src, error: true });
          img.src = src;
        });
        const creatureAsset = await checkImg('/images/demogorgon-flower-creature.jpg');
        const mainWallpaper = await checkImg('/images/stranger-user-wallpaper.jpg');
        return { creatureAsset, mainWallpaper };
      });

      console.log('--- ASSET AUDIT ---');
      console.log(JSON.stringify(assetCheck, null, 2));

      // Capture T = 0s
      const path0s = path.resolve('./screenshot-homepage-0s.png');
      await page.screenshot({ path: path0s });
      console.log(`Captured T=0s: ${path0s}`);

      // Wait 10 Seconds & Capture T = 10s
      await new Promise(r => setTimeout(r, 10000));
      const path10s = path.resolve('./screenshot-homepage-10s.png');
      await page.screenshot({ path: path10s });
      console.log(`Captured T=10s: ${path10s}`);

      // Capture 430x932 Viewport
      await page.setViewport({ width: 430, height: 932, isMobile: true });
      const path430 = path.resolve('./screenshot-homepage-430.png');
      await page.screenshot({ path: path430 });
      console.log(`Captured 430x932: ${path430}`);

      // Copy screenshots to Artifacts Directory
      const artifactDir = 'C:\\Users\\Lenovo\\.gemini\antigravity\\brain\\0b4a90fe-e48e-45aa-b229-563c65d25b09';
      if (fs.existsSync(artifactDir)) {
        fs.copyFileSync(path0s, path.join(artifactDir, 'screenshot-homepage-0s.png'));
        fs.copyFileSync(path10s, path.join(artifactDir, 'screenshot-homepage-10s.png'));
        fs.copyFileSync(path430, path.join(artifactDir, 'screenshot-homepage-430.png'));
        console.log('Successfully copied screenshots to artifacts directory.');
      }

    } finally {
      await browser.close();
      server.close();
    }
  });
}

runFinalCreatureQA();
