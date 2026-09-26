import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import jsqr from 'jsqr';

const TARGET_URL = 'https://exousia-vert.vercel.app/';
const PUBLIC_DIR = path.resolve(process.cwd(), 'public/images');
const ARTIFACT_DIR = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\0b4a90fe-e48e-45aa-b229-563c65d25b09';

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

async function main() {
  console.log('--- EXOUSIA WEBSITE QR GENERATOR ---');
  console.log(`Target URL: ${TARGET_URL}`);

  // 1. Generate standalone high-res scannable QR PNG (800x800)
  const standalonePath = path.join(PUBLIC_DIR, 'exousia-website-qr-standalone.png');
  await QRCode.toFile(standalonePath, TARGET_URL, {
    errorCorrectionLevel: 'H',
    type: 'png',
    margin: 4,
    width: 800,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });
  console.log(`Saved standalone QR to: ${standalonePath}`);

  // 2. Generate Data URL for HTML rendering
  const qrDataUrl = await QRCode.toDataURL(TARGET_URL, {
    errorCorrectionLevel: 'H',
    margin: 4,
    width: 600,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });

  // 3. Render high-res EXOUSIA branded QR card via Puppeteer
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Geist:wght@400;600;700&family=JetBrains+Mono:wght@500;700;800&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          width: 1000px;
          height: 1250px;
          background: #0d0809;
          color: #e5e2e1;
          font-family: 'Geist', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }

        .card {
          width: 100%;
          height: 100%;
          background: linear-gradient(145deg, #1f1214 0%, #0d0809 100%);
          border: 3px solid #ffb4a8;
          border-radius: 32px;
          padding: 50px 40px;
          display: flex;
          flex-col: column;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          position: relative;
          box-shadow: 0 0 50px rgba(255, 180, 168, 0.15);
        }

        .hud-corner {
          position: absolute;
          font-family: 'JetBrains Mono', monospace;
          color: #ffb4a8;
          font-size: 24px;
          font-weight: bold;
        }
        .hud-tl { top: 20px; left: 25px; }
        .hud-tr { top: 20px; right: 25px; }
        .hud-bl { bottom: 20px; left: 25px; }
        .hud-br { bottom: 20px; right: 25px; }

        .header {
          text-align: center;
        }
        .institution {
          font-family: 'JetBrains Mono', monospace;
          font-size: 16px;
          letter-spacing: 4px;
          color: #ffb4a8;
          text-transform: uppercase;
          margin-bottom: 12px;
          font-weight: 700;
        }
        .title {
          font-family: 'Cinzel', serif;
          font-size: 68px;
          font-weight: 900;
          color: #ffb4a8;
          letter-spacing: 6px;
          text-shadow: 0 0 25px rgba(255, 180, 168, 0.4);
          margin-bottom: 10px;
        }
        .tagline {
          font-family: 'JetBrains Mono', monospace;
          font-size: 18px;
          color: #e5e2e1;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .qr-container {
          background: #ffffff;
          padding: 30px;
          border-radius: 28px;
          border: 4px solid #ffb4a8;
          box-shadow: 0 0 40px rgba(255, 180, 168, 0.3);
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .qr-image {
          width: 480px;
          height: 480px;
          display: block;
        }

        .cta-box {
          background: rgba(255, 180, 168, 0.1);
          border: 2px solid rgba(255, 180, 168, 0.4);
          padding: 16px 36px;
          border-radius: 100px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 20px;
          font-weight: 800;
          color: #ffb4a8;
          letter-spacing: 3px;
          text-transform: uppercase;
        }

        .footer {
          text-align: center;
        }
        .url {
          font-family: 'JetBrains Mono', monospace;
          font-size: 26px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 2px;
          margin-bottom: 8px;
        }
        .details {
          font-family: 'JetBrains Mono', monospace;
          font-size: 15px;
          color: #c5a4a0;
          letter-spacing: 1px;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="hud-corner hud-tl">+</span>
        <span class="hud-corner hud-tr">+</span>
        <span class="hud-corner hud-bl">+</span>
        <span class="hud-corner hud-br">+</span>

        <div class="header">
          <div class="institution">VVIT UNIVERSITY • DEPARTMENT OF EEE</div>
          <div class="title">EXOUSIA 2K26</div>
          <div class="tagline">"Where Ideas Meet Innovation" • SEPT 30 &amp; OCT 01</div>
        </div>

        <div class="qr-container">
          <img src="${qrDataUrl}" class="qr-image" alt="EXOUSIA Official Website QR" />
        </div>

        <div class="cta-box">
          📷 SCAN WITH PHONE CAMERA TO ENTER WEBSITE
        </div>

        <div class="footer">
          <div class="url">https://exousia-vert.vercel.app/</div>
          <div class="details">Vasireddy Venkatadri International Technological University</div>
        </div>
      </div>
    </body>
    </html>
  `;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 1250, deviceScaleFactor: 2 });
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  const cardPath = path.join(PUBLIC_DIR, 'exousia-website-qr-card.png');
  await page.screenshot({ path: cardPath, type: 'png' });
  await browser.close();

  console.log(`Saved branded QR card to: ${cardPath}`);

  // Copy to Artifact directory for user download
  const artifactCardPath = path.join(ARTIFACT_DIR, 'exousia-website-qr-card.png');
  const artifactStandalonePath = path.join(ARTIFACT_DIR, 'exousia-website-qr-standalone.png');
  fs.copyFileSync(cardPath, artifactCardPath);
  fs.copyFileSync(standalonePath, artifactStandalonePath);
  console.log(`Copied assets to Artifacts directory: ${artifactCardPath}`);

  // 4. Scan verification test using Puppeteer page evaluate + Canvas
  const verifyBrowser = await puppeteer.launch({ headless: true });
  const verifyPage = await verifyBrowser.newPage();
  await verifyPage.setContent(`
    <!DOCTYPE html>
    <html>
    <body>
      <canvas id="c"></canvas>
      <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js"></script>
      <script>
        window.decodeQR = function(dataUrl) {
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.getElementById('c');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
              const imageData = ctx.getImageData(0, 0, img.width, img.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height);
              resolve(code ? code.data : null);
            };
            img.src = dataUrl;
          });
        };
      </script>
    </body>
    </html>
  `);

  const standaloneBuffer = fs.readFileSync(standalonePath);
  const standaloneBase64 = `data:image/png;base64,${standaloneBuffer.toString('base64')}`;
  const cardBuffer = fs.readFileSync(cardPath);
  const cardBase64 = `data:image/png;base64,${cardBuffer.toString('base64')}`;

  const decodedStandalone = await verifyPage.evaluate((url) => window.decodeQR(url), standaloneBase64);
  const decodedCard = await verifyPage.evaluate((url) => window.decodeQR(url), cardBase64);

  await verifyBrowser.close();

  console.log('\n--- SCAN VERIFICATION RESULTS ---');
  console.log(`Standalone QR Decoded Payload: ${decodedStandalone}`);
  console.log(`Branded Card QR Decoded Payload: ${decodedCard}`);

  const passed = (decodedStandalone === TARGET_URL) && (decodedCard === TARGET_URL);
  if (passed) {
    console.log('✅ SCAN TEST PASSED! QR code correctly decodes to target URL.');
  } else {
    console.error('❌ SCAN TEST FAILED!');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
