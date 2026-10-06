import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { generateDigitalPassSvg } from './lib/digital-pass.js';

async function testPngGeneration() {
  console.log('=== TESTING SVG TO PNG CONVERSION WITH SHARP ===');

  const regCode = 'EX-2026-TEST99';
  const verifyUrl = `https://exousia-vert.vercel.app/verify?id=${encodeURIComponent(regCode)}`;

  // Generate high quality QR code data URL (border/margin 0, high error correction)
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 256,
    color: { dark: '#000000', light: '#FFFFFF' }
  });

  const svgString = generateDigitalPassSvg({
    name: 'Ashik Shaik (Live PNG Test)',
    college: 'Vasireddy Venkatadri Institute of Technology',
    eventTrack: 'HAWKINS TRAP',
    regCode: regCode,
    eventDate: 'SEP 30, 2026',
    qrDataUrl
  });

  console.log('Generated SVG length:', svgString.length);

  // Convert SVG to PNG using sharp at 2x resolution (2048x682) for crystal-clear text & QR code
  const pngBuffer = await sharp(Buffer.from(svgString))
    .resize(2048, 682, { fit: 'contain' })
    .png({ compressionLevel: 9, quality: 100 })
    .toBuffer();

  const outputPath = path.join(process.cwd(), 'scratch', 'current-digital-pass-test.png');
  fs.writeFileSync(outputPath, pngBuffer);

  const imageMeta = await sharp(pngBuffer).metadata();
  console.log(`✅ PNG Generated Successfully!`);
  console.log(`Saved to: ${outputPath}`);
  console.log(`PNG File Size: ${(pngBuffer.length / 1024).toFixed(2)} KB`);
  console.log(`PNG Dimensions: ${imageMeta.width} x ${imageMeta.height}`);
  console.log(`PNG Format: ${imageMeta.format}`);

  // Test QR Code readability on generated PNG using sharp raw pixels + jsQR
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
    if (qrResult.data === verifyUrl) {
      console.log(`✅ Decoded URL matches verification URL exactly!`);
    } else {
      console.error(`❌ QR URL mismatch!`);
    }
  } else {
    console.warn(`⚠️ jsQR could not decode QR at full canvas size. Extracting QR crop area...`);
    // Extract QR crop (around x: 872*2, y: 120*2, w: 104*2, h: 104*2)
    const qrCropRaw = await sharp(pngBuffer)
      .extract({ left: Math.floor(872 * 2), top: Math.floor(120 * 2), width: Math.floor(104 * 2), height: Math.floor(104 * 2) })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const qrCropResult = jsQR(
      new Uint8ClampedArray(qrCropRaw.data),
      qrCropRaw.info.width,
      qrCropRaw.info.height
    );

    if (qrCropResult && qrCropResult.data) {
      console.log(`✅ Cropped QR Scan Test PASSED!`);
      console.log(`Decoded QR URL: ${qrCropResult.data}`);
    } else {
      console.error(`❌ Cropped QR decode failed!`);
    }
  }
}

testPngGeneration().catch(console.error);
