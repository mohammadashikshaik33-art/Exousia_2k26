import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');

function startServer(port) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(distDir, req.url === '/' ? 'index.html' : req.url);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(distDir, 'index.html');
      }
      const ext = path.extname(filePath);
      const mimeTypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(port, () => resolve(server));
  });
}

async function debug() {
  const port = 3091;
  const server = await startServer(port);
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 320, height: 640 });
  await page.goto(`http://localhost:${port}/`, { waitUntil: 'domcontentloaded' });

  await page.evaluate(() => {
    const intro = document.getElementById('intro-container');
    if (intro) intro.remove();
    const main = document.getElementById('main-content');
    if (main) main.classList.add('main-visible');
  });

  const overflowElements = await page.evaluate(() => {
    const overflowers = [];
    document.querySelectorAll('*').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.right > window.innerWidth || el.scrollWidth > window.innerWidth) {
        overflowers.push({
          tag: el.tagName,
          id: el.id,
          class: el.className,
          right: Math.round(rect.right),
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth
        });
      }
    });
    return overflowers;
  });

  console.log('Elements causing overflow on 320px:', overflowElements);

  await browser.close();
  server.close();
}

debug().catch(err => console.error(err));
