import fs from 'fs';
import path from 'path';
import opentype from 'opentype.js';
import sharp from 'sharp';
import QRCode from 'qrcode';
import jsQR from 'jsqr';

const spaceGroteskBuffer = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'SpaceGrotesk.ttf'));
const shareTechMonoBuffer = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'ShareTechMono-Regular.ttf'));

const spaceGroteskFont = opentype.parse(spaceGroteskBuffer.buffer.slice(spaceGroteskBuffer.byteOffset, spaceGroteskBuffer.byteOffset + spaceGroteskBuffer.byteLength));
const shareTechMonoFont = opentype.parse(shareTechMonoBuffer.buffer.slice(shareTechMonoBuffer.byteOffset, shareTechMonoBuffer.byteOffset + shareTechMonoBuffer.byteLength));

function textToSvgPath(font, text, x, y, fontSize, fill, options = {}) {
  const opentypePath = font.getPath(text, x, y, fontSize, options);
  const pathData = opentypePath.toPathData(2);
  if (!pathData) return '';
  return `<path d="${pathData}" fill="${fill}" />`;
}

async function testSharpComposite() {
  const bgBuf = fs.readFileSync(path.join(process.cwd(), 'public', 'images', 'digital-pass-master-clean.png'));
  const targetUrl = 'https://exousia-vert.vercel.app/verify?id=EX-2026-TEST01';

  // Generate crisp QR code PNG buffer directly
  const qrPngBuf = await QRCode.toBuffer(targetUrl, {
    width: 208,
    margin: 1,
    color: { dark: '#000000', light: '#FFFFFF' }
  });

  const formattedName = 'ASHIK SHAIK';
  const displayCollege = 'Vasireddy Venkatadri Institute of Technology';
  const formattedTrack = 'GENOVA';
  const formattedCode = 'EX-2026-TEST01';
  const formattedDate = 'SEPTEMBER 30, 2026';

  // Convert text to vector paths
  const namePath = textToSvgPath(spaceGroteskFont, formattedName, 570, 112, 15, '#FFFFFF');
  const collegePath = textToSvgPath(spaceGroteskFont, displayCollege, 570, 132, 11, '#9A9AA0');
  const trackPath = textToSvgPath(spaceGroteskFont, formattedTrack, 570, 182, 15, '#FFFFFF');
  const codePath = textToSvgPath(shareTechMonoFont, formattedCode, 570, 228, 13, '#E7E3DF');
  const datePath = textToSvgPath(shareTechMonoFont, formattedDate, 708, 228, 13, '#E7E3DF');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="341" viewBox="0 0 1024 341">
  ${namePath}
  ${collegePath}
  ${trackPath}
  ${codePath}
  ${datePath}
</svg>`.trim();

  // Render SVG text overlay at 2048x682
  const svgOverlayBuf = await sharp(Buffer.from(svg))
    .resize(2048, 682, { fit: 'contain' })
    .png()
    .toBuffer();

  // Composite background master + SVG vector text overlay + QR code
  // Master image is 2048x682 (or scaled to 2048x682).
  // QR placement at (872*2, 120*2) = (1744, 240) with dimensions 208x208.
  const finalPngBuf = await sharp(bgBuf)
    .resize(2048, 682, { fit: 'contain' })
    .composite([
      { input: svgOverlayBuf, top: 0, left: 0 },
      { input: qrPngBuf, top: 240, left: 1744 }
    ])
    .png({ compressionLevel: 9, quality: 100 })
    .toBuffer();

  fs.writeFileSync('test-composite-final.png', finalPngBuf);
  console.log('Saved test-composite-final.png (2048x682,', finalPngBuf.length, 'bytes)');

  // Decode QR Code from final image
  const rawImage = await sharp(finalPngBuf).ensureAlpha().raw().toBuffer();
  const qrResult = jsQR(new Uint8ClampedArray(rawImage), 2048, 682);
  console.log('Full Image QR Decode Result:', qrResult ? qrResult.data : 'FAILED');

  // Decode QR Code directly from QR crop
  const croppedBuf = await sharp(finalPngBuf)
    .extract({ left: 1740, top: 236, width: 220, height: 220 })
    .ensureAlpha()
    .raw()
    .toBuffer();
  const qrCropResult = jsQR(new Uint8ClampedArray(croppedBuf), 220, 220);
  console.log('Cropped QR Decode Result:', qrCropResult ? qrCropResult.data : 'FAILED');
}

testSharpComposite().catch(console.error);
