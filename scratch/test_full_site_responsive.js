import puppeteer from 'puppeteer';
import { createServer } from 'http';
import path from 'path';
import fs from 'fs';

const distDir = path.join(process.cwd(), 'dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.jpg': 'image/jpeg',
  '.png': 'image/png'
};

const server = createServer((req, res) => {
  let filePath = path.join(distDir, req.url === '/' ? 'index.html' : req.url);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Server error');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const VIEWPORTS = [
  { width: 320, height: 640, label: 'Small Mobile' },
  { width: 320, height: 800, label: '320x800' },
  { width: 330, height: 800, label: '330x800' },
  { width: 340, height: 800, label: '340x800' },
  { width: 350, height: 800, label: '350x800' },
  { width: 360, height: 780, label: 'Standard Android' },
  { width: 375, height: 812, label: 'iPhone SE/12 mini' },
  { width: 390, height: 844, label: 'iPhone 13/14' },
  { width: 393, height: 873, label: 'Pixel 7' },
  { width: 400, height: 800, label: '400x800' },
  { width: 412, height: 915, label: 'Galaxy S20+' },
  { width: 414, height: 896, label: 'iPhone Max' },
  { width: 430, height: 932, label: 'iPhone 15 Pro Max' },
  { width: 440, height: 956, label: '440x956' },
  { width: 480, height: 1000, label: '480x1000' },
  { width: 540, height: 1000, label: '540x1000' },
  { width: 600, height: 960, label: 'Small Tablet' },
  { width: 640, height: 1000, label: '640x1000' },
  { width: 768, height: 1024, label: 'iPad Portrait' },
  { width: 800, height: 1200, label: '800x1200' },
  { width: 834, height: 1112, label: 'iPad Air' },
  { width: 900, height: 1200, label: '900x1200' },
  { width: 1024, height: 768, label: 'iPad Landscape/Small Laptop' },
  { width: 1100, height: 800, label: '1100x800' },
  { width: 1200, height: 800, label: '1200x800' },
  { width: 1280, height: 800, label: 'WXGA Laptop' },
  { width: 1366, height: 768, label: 'HD Laptop' },
  { width: 1440, height: 900, label: 'MacBook Pro' },
  { width: 1536, height: 864, label: 'FHD Display' },
  { width: 1600, height: 900, label: '1600x900' },
  { width: 1920, height: 1080, label: 'Full HD Desktop' },
  { width: 780, height: 360, label: 'Landscape Mobile' },
  { width: 844, height: 390, label: 'Landscape iPhone' }
];

server.listen(3090, async () => {
  console.log('Static server running at http://localhost:3090\n');

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    console.log('==================================================');
    console.log('  EXOUSIA FULL SITE RESPONSIVE AUDIT (33 Viewports)');
    console.log('==================================================\n');

    let allPassed = true;

    for (const vp of VIEWPORTS) {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto('http://localhost:3090', { waitUntil: 'networkidle0' });

      // Dismiss intro
      await new Promise(r => setTimeout(r, 2200));
      await page.click('#intro-title-container');
      await new Promise(r => setTimeout(r, 1200));

      const res = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        const wordmark = document.getElementById('hero-title');
        const wordmarkRect = wordmark ? wordmark.getBoundingClientRect() : null;
        const wordmarkFontSize = wordmark ? getComputedStyle(wordmark).fontSize : null;
        
        // Button overlap check
        const btnContainer = document.querySelector('#hero-subtitle .flex');
        const btnRect = btnContainer ? btnContainer.getBoundingClientRect() : null;

        return {
          docWidth,
          winWidth,
          overflow: docWidth > winWidth,
          wordmarkWidth: wordmarkRect ? Math.round(wordmarkRect.width) : 0,
          wordmarkHeight: wordmarkRect ? Math.round(wordmarkRect.height) : 0,
          wordmarkFontSize,
          btnRect
        };
      });

      const status = (!res.overflow && res.wordmarkWidth <= vp.width) ? 'PASS ✨' : 'FAIL ❌';
      if (res.overflow || res.wordmarkWidth > vp.width) allPassed = false;

      console.log(
        `Viewport ${vp.width}x${vp.height} (${vp.label.padEnd(25)}) [${vp.width}x${vp.height}] -> ${status} | Font: ${res.wordmarkFontSize?.padEnd(6)} | TextWidth: ${res.wordmarkWidth}px | HorizOverflow: ${res.overflow}`
      );

      await page.close();
    }

    console.log('\n--- Capturing QA Visual Screenshots ---\n');

    const qaScreenshots = [
      { width: 320, height: 640, name: 'qa_320x640_mobile_small.png' },
      { width: 360, height: 780, name: 'qa_360x780_mobile_standard.png' },
      { width: 390, height: 844, name: 'qa_390x844_iphone14.png' },
      { width: 430, height: 932, name: 'qa_430x932_iphone15max.png' },
      { width: 768, height: 1024, name: 'qa_768x1024_ipad_portrait.png' },
      { width: 1024, height: 768, name: 'qa_1024x768_laptop.png' },
      { width: 1440, height: 900, name: 'qa_1440x900_desktop.png' },
      { width: 1920, height: 1080, name: 'qa_1920x1080_fhd_desktop.png' },
      { width: 780, height: 360, name: 'qa_780x360_landscape.png' }
    ];

    for (const snap of qaScreenshots) {
      const page = await browser.newPage();
      await page.setViewport({ width: snap.width, height: snap.height });
      await page.goto('http://localhost:3090', { waitUntil: 'networkidle0' });

      await new Promise(r => setTimeout(r, 2200));
      await page.click('#intro-title-container');
      await new Promise(r => setTimeout(r, 1200));

      const savePath = path.join(process.cwd(), `../../brain/0b4a90fe-e48e-45aa-b229-563c65d25b09/${snap.name}`);
      await page.screenshot({ path: savePath, fullPage: false });
      console.log(`Saved Visual QA Screenshot: ${savePath}`);
      await page.close();
    }

    console.log('\n==================================================');
    console.log(`  FINAL COMPREHENSIVE RESPONSIVE AUDIT RESULT: ${allPassed ? 'ALL VIEWPORTS PASSED 100%! 🎉' : 'SOME VIEWPORTS FAILED ❌'}`);
    console.log('==================================================\n');

    await browser.close();
    server.close();
    process.exit(allPassed ? 0 : 1);
  } catch (err) {
    console.error('❌ Test execution error:', err);
    server.close();
    process.exit(1);
  }
});
