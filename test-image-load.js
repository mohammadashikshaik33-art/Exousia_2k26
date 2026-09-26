import puppeteer from 'puppeteer';
import http from 'http';
import path from 'path';
import fs from 'fs';

const PORT = 8095;
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

async function testImageLoad() {
  server.listen(PORT, async () => {
    console.log(`Test server running at http://localhost:${PORT}`);
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    try {
      const page = await browser.newPage();
      await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle2' });

      const imgLoadResult = await page.evaluate(async () => {
        const checkImg = (src) => {
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({
              src,
              complete: img.complete,
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              currentSrc: img.currentSrc,
              status: 'SUCCESS'
            });
            img.onerror = (e) => resolve({
              src,
              complete: false,
              naturalWidth: 0,
              naturalHeight: 0,
              currentSrc: src,
              status: 'FAILED_TO_LOAD'
            });
            img.src = src;
          });
        };

        const bikesResult = await checkImg('/images/stranger-intro-bg-bikes.jpg');
        const riftResult = await checkImg('/images/stranger-intro-bg-rift.jpg');
        const caveatFontCheck = document.fonts.check('400 50px "Caveat Brush"');

        return {
          bikes: bikesResult,
          rift: riftResult,
          caveatFontCheck
        };
      });

      console.log('\n--- PART 3: BROWSER ASSET LOADING AUDIT ---');
      console.log('Wallpaper 1 (stranger-intro-bg-bikes.jpg):', imgLoadResult.bikes);
      console.log('Wallpaper 2 (stranger-intro-bg-rift.jpg):', imgLoadResult.rift);
      console.log('Caveat Brush Font Check in document.fonts:', imgLoadResult.caveatFontCheck ? 'LOADED ✅' : 'NOT_LOADED ❌');

    } finally {
      await browser.close();
      server.close();
    }
  });
}

testImageLoad();
