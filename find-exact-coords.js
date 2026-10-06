import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generateGridCrop() {
  const masterPath = path.join(process.cwd(), 'public', 'images', 'digital-pass-master-clean.png');

  // Let's create an SVG grid over the master image in 1024x341 space
  // We'll draw vertical grid lines every 10px from x=550 to 850
  // and horizontal grid lines every 10px from y=50 to 250
  let gridLines = '';
  for (let x = 550; x <= 850; x += 20) {
    gridLines += `<line x1="${x}" y1="40" x2="${x}" y2="250" stroke="#00F0FF" stroke-width="0.5" opacity="0.6" />`;
    gridLines += `<text x="${x}" y="52" fill="#00F0FF" font-size="7" font-family="sans-serif">${x}</text>`;
  }
  for (let y = 60; y <= 250; y += 20) {
    gridLines += `<line x1="540" y1="${y}" x2="850" y2="${y}" stroke="#FF2A3B" stroke-width="0.5" opacity="0.6" />`;
    gridLines += `<text x="542" y="${y - 2}" fill="#FF2A3B" font-size="7" font-family="sans-serif">${y}</text>`;
  }

  const bgBuf = fs.readFileSync(masterPath);
  const bgBase64 = `data:image/png;base64,${bgBuf.toString('base64')}`;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="341" viewBox="0 0 1024 341">
  <image href="${bgBase64}" x="0" y="0" width="1024" height="341" />
  ${gridLines}
</svg>`;

  const pngBuf = await sharp(Buffer.from(svg))
    .extract({ left: 540, top: 40, width: 320, height: 210 })
    .toFile('grid-crop-measured.png');

  console.log('Saved grid-crop-measured.png');
}

generateGridCrop().catch(console.error);
