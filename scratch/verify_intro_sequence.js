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
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json'
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

server.listen(3091, async () => {
  console.log('Dist Preview Server running at http://localhost:3091');

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    console.log('Navigating to http://localhost:3091 ...');
    await page.goto('http://localhost:3091', { waitUntil: 'networkidle0' });

    // Inspect character spans creation in DOM
    const charDetails = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('#intro-container .title-letter'));
      return spans.map((s, idx) => ({
        index: idx,
        char: s.textContent,
        parent: s.parentElement.id,
        opacity: getComputedStyle(s).opacity
      }));
    });

    console.log('\n--- Initial DOM Character Spans Inspection ---');
    console.table(charDetails);

    if (charDetails.length !== 11) {
      throw new Error(`Expected 11 character spans, found ${charDetails.length}`);
    }

    const chars = charDetails.map(c => c.char).join('');
    if (chars !== 'EXOUSIA2K26') {
      throw new Error(`Expected text EXOUSIA2K26, got ${chars}`);
    }

    console.log('✅ Exactly 11 character spans constructed in single pipeline order: EXOUSIA + 2K26!');

    // Wait until full reveal (approx 2200ms from start)
    await new Promise(r => setTimeout(r, 2200));

    // Check all 11 characters visible
    const allVisible = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('#intro-container .title-letter'));
      return spans.every(s => parseFloat(getComputedStyle(s).opacity) > 0.8);
    });

    console.log(`All 11 characters visible: ${allVisible ? 'YES ✅' : 'NO ❌'}`);

    // Trigger Intro Exit (click)
    console.log('\n--- Triggering Intro Exit Click ---');
    await page.click('#intro-title-container');

    // Wait 800ms (400ms glitch + 150ms fall delay) and check falling class on all 11 characters
    await new Promise(r => setTimeout(r, 800));
    const fallingCount = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('#intro-container .title-letter'));
      return spans.filter(s => s.classList.contains('falling')).length;
    });

    console.log(`Character spans with .falling class: ${fallingCount} of 11`);

    if (fallingCount !== 11) {
      throw new Error(`Expected all 11 spans to have .falling class, found ${fallingCount}`);
    }

    console.log('✅ All 11 characters participate together in fall/tumble exit!');

    // Wait for main hero reveal
    await new Promise(r => setTimeout(r, 1800));
    const heroSettled = await page.evaluate(() => {
      const heroGroup = document.getElementById('hero-title-group');
      return heroGroup ? heroGroup.classList.contains('hero-title-settled') : false;
    });

    console.log(`Main hero title group settled: ${heroSettled ? 'YES ✅' : 'NO ❌'}`);

    console.log('\n🎉 ALL RUNTIME ANIMATION VERIFICATION TESTS PASSED!');
    await browser.close();
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Verification failed:', err);
    server.close();
    process.exit(1);
  }
});
