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

server.listen(3093, async () => {
  console.log('Test server running at http://localhost:3093');

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812 }); // iPhone SE / mini viewport

    console.log('Loading page on 375x812 mobile viewport...');
    await page.goto('http://localhost:3093', { waitUntil: 'networkidle0' });

    // Wait for intro to finish or click intro to dismiss
    await new Promise(r => setTimeout(r, 2200));
    await page.click('#intro-title-container');
    await new Promise(r => setTimeout(r, 1500));

    // Test Hamburger Menu click
    console.log('\n--- Testing Hamburger Menu Click ---');
    const isHamburgerVisible = await page.evaluate(() => {
      const btn = document.getElementById('mobile-menu-toggle');
      return btn ? getComputedStyle(btn).display !== 'none' : false;
    });

    console.log(`Hamburger button visible on mobile: ${isHamburgerVisible ? 'YES ✅' : 'NO ❌'}`);

    // Click Hamburger Button
    await page.click('#mobile-menu-toggle');
    await new Promise(r => setTimeout(r, 400));

    // Check Drawer State
    const drawerState = await page.evaluate(() => {
      const drawer = document.getElementById('mobile-nav-drawer');
      if (!drawer) return null;
      const style = getComputedStyle(drawer);
      return {
        visibility: style.visibility,
        opacity: style.opacity,
        transform: style.transform,
        classList: Array.from(drawer.classList)
      };
    });

    console.log('Mobile Nav Drawer Computed State after click:');
    console.log(drawerState);

    await page.screenshot({ path: path.join(process.cwd(), 'scratch/hamburger_opened.png') });

    await browser.close();
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err);
    server.close();
    process.exit(1);
  }
});
