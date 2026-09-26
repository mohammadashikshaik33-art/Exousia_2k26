import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const artifactDir = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\0b4a90fe-e48e-45aa-b229-563c65d25b09';

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

async function capture() {
  const port = 3089;
  const server = await startServer(port);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const shots = [
    { name: 'hero_mobile_360.png', w: 360, h: 780 },
    { name: 'hero_mobile_390.png', w: 390, h: 844 },
    { name: 'hero_desktop_1440.png', w: 1440, h: 900 }
  ];

  for (const shot of shots) {
    const page = await browser.newPage();
    await page.setViewport({ width: shot.w, height: shot.h, deviceScaleFactor: 2 });
    await page.goto(`http://localhost:${port}/`, { waitUntil: 'domcontentloaded' });

    await page.evaluate(() => {
      const intro = document.getElementById('intro-container');
      if (intro) intro.remove();
      const main = document.getElementById('main-content');
      if (main) main.classList.add('main-visible');
      const grp = document.getElementById('hero-title-group');
      if (grp) grp.classList.add('hero-title-settled');
      const sub = document.getElementById('hero-subtitle');
      if (sub) { sub.style.opacity = '1'; sub.style.transform = 'translateY(0)'; }
    });

    await new Promise((r) => setTimeout(r, 2000));

    const outPath = path.join(artifactDir, shot.name);
    await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: shot.w, height: Math.min(shot.h, 600) } });
    console.log(`Captured screenshot: ${outPath}`);
    await page.close();
  }

  await browser.close();
  server.close();
}

capture().catch(err => console.error(err));
