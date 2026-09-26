import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';

// Simple static server for dist
const distDir = path.resolve('dist');

function startServer(port) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(distDir, req.url === '/' ? 'index.html' : req.url);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(distDir, 'index.html');
      }
      const ext = path.extname(filePath);
      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.jpg': 'image/jpeg',
        '.png': 'image/png',
        '.svg': 'image/svg+xml'
      };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(port, () => resolve(server));
  });
}

async function runViewportAudit() {
  const port = 3088;
  const server = await startServer(port);
  console.log(`Static server running at http://localhost:${port}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const viewportsToTest = [
    { w: 320, h: 800, name: '320px' },
    { w: 330, h: 800, name: '330px' },
    { w: 340, h: 800, name: '340px' },
    { w: 350, h: 800, name: '350px' },
    { w: 360, h: 800, name: '360px' },
    { w: 375, h: 812, name: '375px' },
    { w: 390, h: 844, name: '390px' },
    { w: 393, h: 873, name: '393px' },
    { w: 400, h: 800, name: '400px' },
    { w: 412, h: 915, name: '412px' },
    { w: 414, h: 896, name: '414px' },
    { w: 430, h: 932, name: '430px' },
    { w: 440, h: 956, name: '440px' },
    { w: 480, h: 1000, name: '480px' },
    { w: 540, h: 1000, name: '540px' },
    { w: 768, h: 1024, name: '768px Tablet' },
    { w: 1024, h: 768, name: '1024px Laptop' },
    { w: 1440, h: 900, name: '1440px Desktop' }
  ];

  console.log('\n--- STARTING RESPONSIVE VIEWPORT AUDIT ---\n');
  let totalPass = true;

  for (const vp of viewportsToTest) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: 2 });
    await page.goto(`http://localhost:${port}/`, { waitUntil: 'domcontentloaded' });

    // Click intro to bypass title animation if intro is present
    try {
      await page.evaluate(() => {
        const introTitle = document.getElementById('intro-title');
        if (introTitle) introTitle.click();
        const main = document.getElementById('main-content');
        if (main) main.classList.add('main-visible');
        const heroGrp = document.getElementById('hero-title-group') || document.getElementById('hero-title');
        if (heroGrp) heroGrp.classList.add('hero-title-settled');
      });
    } catch (e) {}

    await new Promise((r) => setTimeout(r, 400));

    // Audit layout measurements
    const metrics = await page.evaluate(() => {
      const heroTitle = document.getElementById('hero-title');
      const heroSub = document.getElementById('hero-sub-2k26');
      const body = document.body;

      const titleRect = heroTitle ? heroTitle.getBoundingClientRect() : null;
      const subRect = heroSub ? heroSub.getBoundingClientRect() : null;

      // Check height of hero title element - line-height vs bounding box height determines if wrapped
      // If line height is ~30-120px and height is > 1.5x line height, it wrapped!
      const titleComputed = heroTitle ? window.getComputedStyle(heroTitle) : {};
      const titleFontSize = parseFloat(titleComputed.fontSize || 0);
      const titleHeight = titleRect ? titleRect.height : 0;
      const titleWidth = titleRect ? titleRect.width : 0;
      const titleText = heroTitle ? heroTitle.textContent.trim() : '';

      // Body overflow check
      const hasHorizontalScroll = body.scrollWidth > window.innerWidth;

      // Distance / gap between EXOUSIA and 2K26
      const gap = (subRect && titleRect) ? (subRect.top - titleRect.bottom) : null;

      return {
        titleText,
        fontSize: titleFontSize.toFixed(1) + 'px',
        titleWidth: Math.round(titleWidth) + 'px',
        titleHeight: Math.round(titleHeight) + 'px',
        viewportWidth: window.innerWidth + 'px',
        hasHorizontalScroll,
        gap: gap ? Math.round(gap) + 'px' : 'N/A',
        // Check line wrap ratio
        isWrapped: titleHeight > (titleFontSize * 1.6)
      };
    });

    const status = (!metrics.isWrapped && !metrics.hasHorizontalScroll) ? 'PASS' : 'FAIL';
    if (status === 'FAIL') totalPass = false;

    console.log(`Viewport ${vp.name.padEnd(12)} [${vp.w}x${vp.h}] -> Status: ${status} | Font: ${metrics.fontSize.padEnd(7)} | TextWidth: ${metrics.titleWidth.padEnd(6)} | Height: ${metrics.titleHeight.padEnd(5)} | Gap to 2K26: ${metrics.gap.padEnd(5)} | HorizScroll: ${metrics.hasHorizontalScroll}`);

    await page.close();
  }

  console.log(`\nOVERALL RESPONSIVE AUDIT RESULT: ${totalPass ? 'ALL VIEWPORTS PASSED CLEANLY! ✨' : 'SOME VIEWPORTS FAILED!'}\n`);

  await browser.close();
  server.close();
}

runViewportAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
