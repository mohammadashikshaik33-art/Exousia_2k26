import fs from 'fs';
import path from 'path';
import opentype from 'opentype.js';
import sharp from 'sharp';
import QRCode from 'qrcode';
import jsQR from 'jsqr';

// Load fonts using opentype.js
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

async function testPassGeneration() {
  const bgBuf = fs.readFileSync(path.join(process.cwd(), 'public', 'images', 'digital-pass-master-clean.png'));
  const bgBase64 = `data:image/png;base64,${bgBuf.toString('base64')}`;

  const qrDataUrl = await QRCode.toDataURL('https://exousia-vert.vercel.app/verify?id=EX-2026-TEST01', {
    margin: 0,
    color: { dark: '#000000', light: '#FFFFFF' }
  });

  const testCases = [
    {
      name: 'Ashik Shaik',
      college: 'Vasireddy Venkatadri Institute of Technology',
      eventTrack: 'GENOVA',
      regCode: 'EX-2026-TEST01',
      eventDate: 'September 30, 2026'
    },
    {
      name: 'Mohammad Ashik',
      college: 'Vasireddy Venkatadri Institute of Technology',
      eventTrack: "CLUE'D UP",
      regCode: 'EX-2026-ABC123',
      eventDate: 'October 1, 2026'
    }
  ];

  for (let idx = 0; idx < testCases.length; idx++) {
    const tc = testCases[idx];
    const formattedName = String(tc.name).toUpperCase();
    let displayCollege = String(tc.college);
    if (displayCollege.length > 38) displayCollege = displayCollege.substring(0, 36) + '...';
    const formattedTrack = String(tc.eventTrack).toUpperCase();
    const formattedCode = String(tc.regCode).toUpperCase();
    const formattedDate = String(tc.eventDate).toUpperCase();

    // Convert texts to vector paths
    const namePath = textToSvgPath(spaceGroteskFont, formattedName, 570, 112, 15, '#FFFFFF');
    const collegePath = textToSvgPath(spaceGroteskFont, displayCollege, 570, 132, 11, '#9A9AA0');
    const trackPath = textToSvgPath(spaceGroteskFont, formattedTrack, 570, 182, 15, '#FFFFFF');
    const codePath = textToSvgPath(shareTechMonoFont, formattedCode, 570, 228, 13, '#E7E3DF');
    const datePath = textToSvgPath(shareTechMonoFont, formattedDate, 708, 228, 13, '#E7E3DF');

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1024" height="341" viewBox="0 0 1024 341">
  <!-- Master Background -->
  <image href="${bgBase64}" xlink:href="${bgBase64}" x="0" y="0" width="1024" height="341" preserveAspectRatio="none" />

  <!-- Dynamic Vector Text Paths -->
  ${namePath}
  ${collegePath}
  ${trackPath}
  ${codePath}
  ${datePath}

  <!-- QR Code -->
  <g transform="translate(872, 120)">
    <image href="${qrDataUrl}" xlink:href="${qrDataUrl}" x="0" y="0" width="104" height="104" />
  </g>
</svg>`.trim();

    const pngBuffer = await sharp(Buffer.from(svg))
      .resize(2048, 682, { fit: 'contain' })
      .png({ compressionLevel: 9, quality: 100 })
      .toBuffer();

    const filename = `test-opentype-pass-${idx + 1}.png`;
    fs.writeFileSync(filename, pngBuffer);
    console.log(`Saved ${filename} (${pngBuffer.length} bytes, 2048x682)`);

    // Verify QR code in rendered PNG
    const rawImage = await sharp(pngBuffer).ensureAlpha().raw().toBuffer();
    const qrResult = jsQR(new Uint8ClampedArray(rawImage), 2048, 682);
    console.log(`QR Decode Test ${idx + 1}:`, qrResult ? qrResult.data : 'FAILED');
  }
}

testPassGeneration().catch(console.error);
