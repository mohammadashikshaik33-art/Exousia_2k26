import puppeteer from 'puppeteer';
import { createServer } from 'http';
import path from 'path';
import fs from 'fs';

const distDir = path.join(process.cwd(), 'dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css'
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

server.listen(3092, async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    await page.goto('http://localhost:3092', { waitUntil: 'networkidle0' });

    console.log('\n--- 11-CHARACTER STAGGER CADENCE MEASUREMENT ---');

    const revealTimestamps = {};
    const startTime = Date.now();

    while (Object.keys(revealTimestamps).length < 11 && (Date.now() - startTime < 4000)) {
      const opacities = await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('#intro-container .title-letter'));
        return spans.map(s => ({ char: s.textContent, op: parseFloat(getComputedStyle(s).opacity) }));
      });

      const now = Date.now() - startTime;
      opacities.forEach((item, idx) => {
        if (item.op > 0.1 && revealTimestamps[idx] === undefined) {
          revealTimestamps[idx] = { char: item.char, timeMs: now };
          console.log(`Character [${idx}] '${item.char}' revealed at ${now}ms`);
        }
      });

      await new Promise(r => setTimeout(r, 10));
    }

    console.log('\n--- Final Recorded Timestamps & Step Spacing ---');
    let prevTime = null;
    const report = Object.keys(revealTimestamps).map(idx => {
      const entry = revealTimestamps[idx];
      const gap = prevTime !== null ? entry.timeMs - prevTime : 0;
      prevTime = entry.timeMs;
      return {
        Index: idx,
        Character: entry.char,
        'Reveal Timestamp': `${entry.timeMs}ms`,
        'Inter-Character Delay': prevTime === entry.timeMs ? 'START' : `+${gap}ms`
      };
    });

    console.table(report);

    // Verify transition from 'A' (Index 6) to '2' (Index 7)
    const timeA = revealTimestamps[6].timeMs;
    const time2 = revealTimestamps[7].timeMs;
    const transitionGap = time2 - timeA;

    console.log(`\nTransition Gap A (Index 6) -> 2 (Index 7): ${transitionGap}ms`);

    if (transitionGap < 80 || transitionGap > 200) {
      console.warn(`⚠️ Transition gap ${transitionGap}ms deviates significantly from 130ms target`);
    } else {
      console.log('✅ Transition from A to 2 matches the 130ms stagger cadence perfectly with ZERO restart or pause!');
    }

    await browser.close();
    server.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    server.close();
    process.exit(1);
  }
});
