import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

async function retouchWallpaper() {
  const backupPath = path.resolve('./public/images/stranger-user-wallpaper-backup.jpg');
  if (!fs.existsSync(backupPath)) {
    console.error('Backup file missing!');
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(backupPath);
  const base64DataUrl = `data:image/jpeg;base64,${fileBuffer.toString('base64')}`;

  console.log('Launching Puppeteer Canvas Retoucher...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 578, height: 1024 });

    const retouchedDataUrl = await page.evaluate((dataUrl) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const w = img.naturalWidth || 578;
          const h = img.naturalHeight || 1024;

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');

          // 1. Draw original image onto canvas
          ctx.drawImage(img, 0, 0, w, h);

          // 2. Sample clean storm cloud mass from top-right sky (x: 320 to 570, y: 30 to 350)
          const skyPatch = document.createElement('canvas');
          skyPatch.width = 300;
          skyPatch.height = 320;
          const patchCtx = skyPatch.getContext('2d');
          patchCtx.drawImage(img, 300, 20, 260, 320, 0, 0, 300, 320);

          // 3. Mirror & blend clean cloud texture over upper-left creature silhouette area (x: 0 to 320, y: 20 to 340)
          ctx.save();
          ctx.filter = 'blur(12px) contrast(1.08)';
          ctx.translate(320, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(skyPatch, 0, 20, 320, 320);
          ctx.restore();

          // 4. Multi-pass radial cloud lighting to match natural storm atmosphere
          ctx.save();
          
          // Deep maroon cloud shadow over top-left
          const grad1 = ctx.createRadialGradient(150, 140, 20, 150, 140, 220);
          grad1.addColorStop(0, 'rgba(75, 8, 14, 0.65)');
          grad1.addColorStop(0.5, 'rgba(45, 6, 10, 0.5)');
          grad1.addColorStop(1, 'transparent');
          ctx.fillStyle = grad1;
          ctx.fillRect(0, 0, w, 420);

          // Crimson storm light glow over center-top
          const grad2 = ctx.createRadialGradient(250, 180, 10, 250, 180, 180);
          grad2.addColorStop(0, 'rgba(215, 35, 45, 0.42)');
          grad2.addColorStop(0.6, 'rgba(115, 14, 20, 0.18)');
          grad2.addColorStop(1, 'transparent');
          ctx.fillStyle = grad2;
          ctx.fillRect(0, 0, w, 420);

          // Charcoal top edge cloud vignetting
          const gradTop = ctx.createLinearGradient(0, 0, 0, 140);
          gradTop.addColorStop(0, 'rgba(10, 4, 6, 0.7)');
          gradTop.addColorStop(1, 'transparent');
          ctx.fillStyle = gradTop;
          ctx.fillRect(0, 0, w, 140);

          ctx.restore();

          // 5. PRESERVE LOWER PORTION (Kids, Road, Hawkins Sign, Power Line, Fields, Horizon) 100% EXACT ORIGINAL UNTOUCHED PIXELS
          ctx.save();
          ctx.drawImage(img, 0, 430, w, h - 430, 0, 430, w, h - 430);
          ctx.restore();

          resolve(canvas.toDataURL('image/jpeg', 0.96));
        };
        img.src = dataUrl;
      });
    }, base64DataUrl);

    // Save retouched image buffer
    const base64Clean = retouchedDataUrl.replace(/^data:image\/jpeg;base64,/, '');
    const targetPath = path.resolve('./public/images/stranger-user-wallpaper.jpg');
    fs.writeFileSync(targetPath, Buffer.from(base64Clean, 'base64'));
    console.log(`[SUCCESS] Retouched wallpaper saved to: ${targetPath}`);

    const distPath = path.resolve('./dist/images/stranger-user-wallpaper.jpg');
    if (fs.existsSync(path.resolve('./dist/images'))) {
      fs.writeFileSync(distPath, Buffer.from(base64Clean, 'base64'));
      console.log(`[SUCCESS] Retouched wallpaper saved to dist: ${distPath}`);
    }

  } finally {
    await browser.close();
  }
}

retouchWallpaper();
