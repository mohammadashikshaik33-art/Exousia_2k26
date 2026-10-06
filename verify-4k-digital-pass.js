import fs from 'fs';
import sharp from 'sharp';
import jsQR from 'jsqr';
import { generateDigitalPassPng } from './lib/digital-pass.js';

async function test4kPass() {
  console.log('=== TESTING 4K DIGITAL PASS GENERATION (4096 x 1364 px) ===');

  const testData = {
    name: 'Ashik Shaik (4K Verification Test)',
    college: 'Vasireddy Venkatadri Institute of Technology',
    eventTrack: 'GENOVA',
    regCode: 'EX-2026-4KTEST',
    eventDate: 'October 1, 2026'
  };

  const pngBuf = await generateDigitalPassPng(testData);
  fs.writeFileSync('verified-pass-4k.png', pngBuf);

  // Inspect dimensions with sharp
  const metadata = await sharp(pngBuf).metadata();
  console.log(`Saved verified-pass-4k.png (${pngBuf.length} bytes)`);
  console.log(`Dimensions: ${metadata.width} x ${metadata.height} px, format: ${metadata.format}`);

  // Test full 4K QR code decode
  const rawImage = await sharp(pngBuf).ensureAlpha().raw().toBuffer();
  const qrResult = jsQR(new Uint8ClampedArray(rawImage), metadata.width, metadata.height);
  console.log('Full 4K Image QR Decode Result:', qrResult ? qrResult.data : 'FAILED');

  // Test cropped 4K QR region decode (top: 470, left: 3480, width: 430, height: 430)
  const croppedBuf = await sharp(pngBuf)
    .extract({ left: 3480, top: 470, width: 430, height: 430 })
    .ensureAlpha()
    .raw()
    .toBuffer();
  const qrCropResult = jsQR(new Uint8ClampedArray(croppedBuf), 430, 430);
  console.log('Cropped 4K QR Decode Result:', qrCropResult ? qrCropResult.data : 'FAILED');
}

test4kPass().catch(console.error);
