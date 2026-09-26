import puppeteer from 'puppeteer';
import http from 'http';
import path from 'path';
import fs from 'fs';

// Simple static file server for local validation without deployment
const PORT = 8089;
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

async function runValidation() {
  server.listen(PORT, async () => {
    console.log(`Local test server running at http://localhost:${PORT}`);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();

      // Mobile & Desktop viewports to audit
      const targetViewports = [
        { w: 320, h: 568 },
        { w: 360, h: 800 },
        { w: 375, h: 812 },
        { w: 390, h: 844 },
        { w: 414, h: 896 },
        { w: 430, h: 932 },
        { w: 480, h: 1040 },
        { w: 1280, h: 720 },
        { w: 1920, h: 1080 }
      ];

      console.log('\n--- 1. HAWKINS CINEMATIC ENVIRONMENT & RESPONSIVE OVERFLOW CHECK ---');
      for (const vp of targetViewports) {
        await page.setViewport({ width: vp.w, height: vp.h, isMobile: vp.w < 768 });
        await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle2' });

        const metrics = await page.evaluate(() => {
          const bodyWidth = document.body.scrollWidth;
          const windowWidth = window.innerWidth;
          const envEl = document.querySelector('#env-container');
          const creatureEl = document.querySelector('#env-creature-wrapper');
          const creatureRect = creatureEl ? creatureEl.getBoundingClientRect() : null;

          return {
            bodyWidth,
            windowWidth,
            hasOverflow: bodyWidth > windowWidth,
            envPresent: !!envEl,
            creaturePresent: !!creatureEl,
            creatureRightRatio: creatureRect ? ((creatureRect.right / windowWidth) * 100).toFixed(1) : 0
          };
        });

        console.log(`Viewport ${vp.w}x${vp.h}px: bodyScrollWidth=${metrics.bodyWidth}px -> Overflow: ${metrics.hasOverflow ? 'FAIL ❌' : 'PASS ✅'} | Environment Layer: ${metrics.envPresent ? 'OK ✅' : 'FAIL ❌'} | Creature Integrated: ${metrics.creaturePresent ? 'OK ✅' : 'FAIL ❌'}`);
      }

      // 2. Computed Font Family Audit
      console.log('\n--- 2. COMPUTED FONT FAMILY AUDIT ---');
      await page.setViewport({ width: 1280, height: 800 });
      await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle2' });

      const fontAudit = await page.evaluate(() => {
        const getFont = (selector) => {
          const el = document.querySelector(selector);
          if (!el) return 'NOT_FOUND';
          return window.getComputedStyle(el).fontFamily;
        };

        return {
          introTitle: getFont('#intro-title .stranger-letter'),
          introSub: getFont('#intro-sub-2k26 .stranger-letter'),
          heroTitle: getFont('#hero-title'),
          heroSub: getFont('#hero-sub-2k26'),
          navLogo: getFont('a[href="#home"]'),
          navLink: getFont('.nav-links a'),
          sectionHeading: getFont('.font-stranger-title'),
          eventCardTitle: getFont('#events-grid h3'),
          bodyText: getFont('body'),
          terminalBtn: getFont('.btn-terminal-primary'),
          telemetryTag: getFont('.sector-telemetry-tag'),
          tickerCountdown: getFont('#ticker-countdown')
        };
      });

      console.log('Computed Fonts:');
      console.log(`- Intro EXOUSIA Title: ${fontAudit.introTitle}`);
      console.log(`- Intro 2K26 Subtitle: ${fontAudit.introSub}`);
      console.log(`- Hero EXOUSIA Title:  ${fontAudit.heroTitle}`);
      console.log(`- Hero 2K26 Subtitle:  ${fontAudit.heroSub}`);
      console.log(`- Nav Logo:            ${fontAudit.navLogo}`);
      console.log(`- Nav Link:            ${fontAudit.navLink}`);
      console.log(`- Section Heading:     ${fontAudit.sectionHeading}`);
      console.log(`- Event Card Title:    ${fontAudit.eventCardTitle}`);
      console.log(`- Body Text:           ${fontAudit.bodyText}`);
      console.log(`- Terminal Button:     ${fontAudit.terminalBtn}`);
      console.log(`- Telemetry Tag:       ${fontAudit.telemetryTag}`);

      console.log('\n=== LOCAL TYPOGRAPHY VALIDATION COMPLETE ===');

    } catch (err) {
      console.error('Validation Error:', err);
    } finally {
      await browser.close();
      server.close();
    }
  });
}

runValidation();
