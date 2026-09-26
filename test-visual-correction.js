import puppeteer from 'puppeteer';
import http from 'http';
import path from 'path';
import fs from 'fs';

const PORT = 8092;
const DIST_DIR = path.resolve('./dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

async function runVisualQA() {
  server.listen(PORT, async () => {
    console.log(`Test server running at http://localhost:${PORT}`);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();

      const viewports = [
        { name: '320x568', w: 320, h: 568 },
        { name: '360x800', w: 360, h: 800 },
        { name: '375x812', w: 375, h: 812 },
        { name: '390x844', w: 390, h: 844 },
        { name: '414x896', w: 414, h: 896 },
        { name: '430x932', w: 430, h: 932 },
        { name: '480x1040', w: 480, h: 1040 },
        { name: '1280x720', w: 1280, h: 720 },
        { name: '1920x1080', w: 1920, h: 1080 }
      ];

      console.log('\n--- 1. INTRO WALLPAPER DRIFT ANIMATION CHECK ---');
      await page.setViewport({ width: 375, height: 812, isMobile: true });
      await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle2' });

      const introDrift = await page.evaluate(async () => {
        const bg = document.querySelector('.intro-bg-wallpaper');
        if (!bg) return { error: 'Intro bg wallpaper element not found' };
        const style1 = window.getComputedStyle(bg).transform;
        await new Promise(r => setTimeout(r, 2500));
        const style2 = window.getComputedStyle(bg).transform;
        return {
          animationName: window.getComputedStyle(bg).animationName,
          transformAt0s: style1,
          transformAt2_5s: style2,
          isMoving: style1 !== style2
        };
      });

      console.log(`Intro Wallpaper Animation: ${introDrift.animationName}`);
      console.log(`Transform at 0.0s: ${introDrift.transformAt0s}`);
      console.log(`Transform at 2.5s: ${introDrift.transformAt2_5s}`);
      console.log(`Visible Camera Movement Active: ${introDrift.isMoving ? 'PASS ✅' : 'FAIL ❌'}`);

      console.log('\n--- 2. HOMEPAGE ENVIRONMENT VISIBILITY & COMPOSITING CHECK ---');
      for (const vp of viewports) {
        await page.setViewport({ width: vp.w, height: vp.h, isMobile: vp.w < 768 });
        await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle2' });

        // Skip intro to reveal main homepage environment
        await page.evaluate(() => {
          const skipBtn = document.getElementById('intro-skip-btn');
          if (skipBtn) skipBtn.click();
        });
        await new Promise(r => setTimeout(r, 800));

        const envMetrics = await page.evaluate(() => {
          const wallpaper = document.querySelector('.env-wallpaper');
          const sky = document.querySelector('.env-sky-crimson');
          const creature = document.querySelector('.env-creature-img');
          const wrapper = document.querySelector('#env-creature-wrapper');
          const sub2k26El = document.querySelector('#hero-sub-2k26');
          const sub2k26Font = sub2k26El ? window.getComputedStyle(sub2k26El).fontFamily : null;
          const bodyScrollWidth = document.body.scrollWidth;
          const windowWidth = window.innerWidth;

          return {
            overflow: bodyScrollWidth > windowWidth,
            wallpaperBg: wallpaper ? window.getComputedStyle(wallpaper).backgroundImage : null,
            wallpaperOpacity: wallpaper ? window.getComputedStyle(wallpaper).opacity : 0,
            skyBlendMode: sky ? window.getComputedStyle(sky).mixBlendMode : null,
            skyOpacity: sky ? window.getComputedStyle(sky).opacity : 0,
            creatureBg: creature ? window.getComputedStyle(creature).backgroundImage : null,
            creatureOpacity: creature ? window.getComputedStyle(creature).opacity : 0,
            creatureWidth: wrapper ? window.getComputedStyle(wrapper).width : null,
            creatureRight: wrapper ? window.getComputedStyle(wrapper).right : null,
            sub2k26Font
          };
        });

        console.log(`Viewport ${vp.name}:`);
        console.log(`  - Horizontal Overflow: ${envMetrics.overflow ? 'FAIL ❌' : 'PASS ✅'}`);
        console.log(`  - Hawkins Wallpaper: ${envMetrics.wallpaperBg ? 'VISIBLE ✅' : 'FAIL ❌'} (Opacity: ${envMetrics.wallpaperOpacity})`);
        console.log(`  - Crimson Sky Atmosphere: ${envMetrics.skyBlendMode ? 'VISIBLE ✅' : 'FAIL ❌'} (Blend: ${envMetrics.skyBlendMode}, Opacity: ${envMetrics.skyOpacity})`);
        console.log(`  - Flower-Faced Demogorgon Creature: ${envMetrics.creatureBg ? 'VISIBLE ✅' : 'FAIL ❌'} (Width: ${envMetrics.creatureWidth}, Position: right ${envMetrics.creatureRight})`);
        console.log(`  - 2K26 Brush Typography: ${envMetrics.sub2k26Font}`);
      }

      console.log('\n=== VISUAL CORRECTION QA COMPLETE ===');
    } finally {
      await browser.close();
      server.close();
    }
  });
}

runVisualQA();
