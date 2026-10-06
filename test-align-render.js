import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import opentype from 'opentype.js';
import QRCode from 'qrcode';

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

async function renderAlignedPassRefined() {
  const masterPath = path.join(process.cwd(), 'public', 'images', 'digital-pass-master-clean.png');
  const bgBuf = fs.readFileSync(masterPath);

  const formattedName = 'ASHIK SHAIK';
  const displayCollege = 'Vasireddy Venkatadri Institute of Technology';
  const formattedTrack = 'GENOVA';
  const formattedCode = 'EX-2026-TEST01';
  const formattedDate = 'SEPTEMBER 30, 2026';

  // Perfectly balanced micro-aligned coordinates:
  // PARTICIPANT (x=570, y=96) -> Name (x=572, y=114); College (x=572, y=132)
  // EVENT (x=570, y=166) -> Track (x=572, y=184)
  // REG ID (x=570, y=206) -> Code (x=570, y=224)
  // DATE (x=734, y=206) -> Date (x=734, y=224)
  const namePath = textToSvgPath(spaceGroteskFont, formattedName, 572, 114, 15, '#FFFFFF');
  const collegePath = textToSvgPath(spaceGroteskFont, displayCollege, 572, 132, 11, '#9A9AA0');
  const trackPath = textToSvgPath(spaceGroteskFont, formattedTrack, 572, 184, 15, '#FFFFFF');
  const codePath = textToSvgPath(shareTechMonoFont, formattedCode, 570, 224, 13, '#E7E3DF');
  const datePath = textToSvgPath(shareTechMonoFont, formattedDate, 734, 224, 13, '#E7E3DF');

  const svgOverlay = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="341" viewBox="0 0 1024 341">
  ${namePath}
  ${collegePath}
  ${trackPath}
  ${codePath}
  ${datePath}
</svg>`.trim();

  // 4K Target Overlay
  const svgOverlayBuf = await sharp(Buffer.from(svgOverlay))
    .resize(4096, 1364, { fit: 'contain' })
    .png()
    .toBuffer();

  const targetVerifyUrl = 'https://exousia-vert.vercel.app/verify?id=EX-2026-TEST01';
  const qrPngBuf = await QRCode.toBuffer(targetVerifyUrl, {
    width: 416,
    margin: 1,
    color: { dark: '#000000', light: '#FFFFFF' }
  });

  const finalPngBuf = await sharp(bgBuf)
    .resize(4096, 1364, { fit: 'contain' })
    .composite([
      { input: svgOverlayBuf, top: 0, left: 0 },
      { input: qrPngBuf, top: 480, left: 3488 }
    ])
    .png({ compressionLevel: 9, quality: 100 })
    .toBuffer();

  fs.writeFileSync('pass-aligned-4k-perfect.png', finalPngBuf);
  console.log('Saved pass-aligned-4k-perfect.png (4096x1364)');

  // Crop text section
  await sharp(finalPngBuf)
    .extract({ left: 2160, top: 200, width: 1300, height: 850 })
    .toFile('crop-pass-text-perfect.png');

  console.log('Saved crop-pass-text-perfect.png');
}

renderAlignedPassRefined().catch(console.error);
