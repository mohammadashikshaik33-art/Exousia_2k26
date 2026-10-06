import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import QRCode from 'qrcode';
import jsQR from 'jsqr';

function getMasterBgBase64() {
  try {
    const pngPath = path.join(process.cwd(), 'public', 'images', 'digital-pass-master-clean.png');
    if (fs.existsSync(pngPath)) {
      return `data:image/png;base64,${fs.readFileSync(pngPath).toString('base64')}`;
    }
  } catch (e) {
    console.warn('Bg err:', e.message);
  }
  return '';
}

function getFontBase64(filename) {
  try {
    const fontPath = path.join(process.cwd(), 'public', 'fonts', filename);
    if (fs.existsSync(fontPath)) {
      return fs.readFileSync(fontPath).toString('base64');
    }
  } catch (e) {
    console.warn('Font read err:', filename, e.message);
  }
  return '';
}

async function testFontEmbedding() {
  console.log('=== TESTING EMBEDDED BASE64 FONTS IN SHARP SVG -> PNG ===');

  const spaceGroteskBase64 = getFontBase64('SpaceGrotesk.ttf');
  const shareTechMonoBase64 = getFontBase64('ShareTechMono-Regular.ttf');

  console.log(`Space Grotesk Base64 length: ${spaceGroteskBase64.length}`);
  console.log(`Share Tech Mono Base64 length: ${shareTechMonoBase64.length}`);

  const bgBase64 = getMasterBgBase64();
  const regCode = 'EX-TEST-FONT01';
  const verifyUrl = `https://exousia-vert.vercel.app/verify?id=${encodeURIComponent(regCode)}`;

  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    margin: 1,
    color: { dark: '#000000', light: '#FFFFFF' },
    width: 256
  });

  const name = 'Ashik Shaik';
  const college = 'Vasireddy Venkatadri Institute of Technology';
  const eventTrack = 'GENOVA';
  const eventDate = 'September 30, 2026';

  const escapeXml = (str) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  let displayCollege = String(college || 'Vasireddy Venkatadri Institute of Technology');
  if (displayCollege.length > 38) {
    displayCollege = displayCollege.substring(0, 36) + '...';
  }

  const formattedDate = String(eventDate).toUpperCase();
  const formattedName = String(name).toUpperCase();
  const formattedTrack = String(eventTrack).toUpperCase();
  const formattedCode = String(regCode).toUpperCase();

  const svgString = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1024" height="341" viewBox="0 0 1024 341">
  <defs>
    <style>
      ${spaceGroteskBase64 ? `
      @font-face {
        font-family: 'Space Grotesk';
        src: url('data:font/ttf;charset=utf-8;base64,${spaceGroteskBase64}') format('truetype');
        font-weight: 400 700;
        font-style: normal;
      }` : ''}
      ${shareTechMonoBase64 ? `
      @font-face {
        font-family: 'Share Tech Mono';
        src: url('data:font/ttf;charset=utf-8;base64,${shareTechMonoBase64}') format('truetype');
        font-weight: 400 700;
        font-style: normal;
      }` : ''}
      .sans-heading { font-family: 'Space Grotesk', system-ui, -apple-system, sans-serif; }
      .mono-tech { font-family: 'Share Tech Mono', monospace; }
    </style>
  </defs>

  <!-- Master Artwork Canvas (1024x341 Master Dimensions) -->
  ${bgBase64 ? `<image href="${bgBase64}" xlink:href="${bgBase64}" x="0" y="0" width="1024" height="341" preserveAspectRatio="none" />` : `<rect width="1024" height="341" fill="#0A0608" />`}

  <!-- Overlay Dynamic Participant & Registration Data at Exact 1024x341 Master Coordinates -->
  <g transform="translate(570, 0)">
    <!-- PARTICIPANT NAME -->
    <text x="0" y="112" fill="#FFFFFF" class="sans-heading" font-size="15" font-weight="700" letter-spacing="0.5">${escapeXml(formattedName)}</text>
    
    <!-- COLLEGE -->
    <text x="0" y="132" fill="#9A9AA0" class="sans-heading" font-size="11" font-weight="500">${escapeXml(displayCollege)}</text>

    <!-- EVENT NAME -->
    <text x="0" y="182" fill="#FFFFFF" class="sans-heading" font-size="15" font-weight="700" letter-spacing="0.5">${escapeXml(formattedTrack)}</text>

    <!-- REGISTRATION ID -->
    <text x="0" y="228" fill="#E7E3DF" class="mono-tech" font-size="13" font-weight="700">${escapeXml(formattedCode)}</text>

    <!-- EVENT DATE -->
    <text x="138" y="228" fill="#E7E3DF" class="mono-tech" font-size="13" font-weight="700">${escapeXml(formattedDate)}</text>
  </g>

  <!-- Overlay Real Dynamic Verification QR Code (Exact Fit Inside Master Red Glowing Box) -->
  <g transform="translate(872, 120)">
    <image href="${qrDataUrl}" xlink:href="${qrDataUrl}" x="0" y="0" width="104" height="104" />
  </g>
</svg>`.trim();

  // Convert SVG to PNG using sharp at 2048x682
  const pngBuffer = await sharp(Buffer.from(svgString))
    .resize(2048, 682, { fit: 'contain' })
    .png({ compressionLevel: 9, quality: 100 })
    .toBuffer();

  const outputPath = path.join(process.cwd(), 'scratch', 'current-digital-pass-font-test.png');
  fs.writeFileSync(outputPath, pngBuffer);

  const imageMeta = await sharp(pngBuffer).metadata();
  console.log(`\n✅ PNG Generated with Embedded Fonts!`);
  console.log(`Saved to: ${outputPath}`);
  console.log(`PNG Dimensions: ${imageMeta.width} x ${imageMeta.height}`);
  console.log(`PNG File Size: ${(pngBuffer.length / 1024).toFixed(2)} KB`);

  // QR Code Decode Verification
  const rawPixelData = await sharp(pngBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const qrResult = jsQR(
    new Uint8ClampedArray(rawPixelData.data),
    rawPixelData.info.width,
    rawPixelData.info.height
  );

  if (qrResult && qrResult.data) {
    console.log(`✅ QR Code Scan Test PASSED!`);
    console.log(`Decoded QR URL: ${qrResult.data}`);
  } else {
    console.log(`Checking crop...`);
  }
}

testFontEmbedding().catch(console.error);
