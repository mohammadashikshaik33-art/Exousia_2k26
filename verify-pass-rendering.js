import fs from 'fs';
import sharp from 'sharp';
import jsQR from 'jsqr';
import { generateDigitalPassPng } from './lib/digital-pass.js';

async function verifyPass() {
  console.log('Testing lib/digital-pass.js vector glyph pass generation...');

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

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const pngBuf = await generateDigitalPassPng(tc);

    const filename = `verified-pass-${i + 1}.png`;
    fs.writeFileSync(filename, pngBuf);
    console.log(`Generated ${filename}: ${pngBuf.length} bytes, dimensions 2048x682.`);

    // Verify QR code in rendered PNG
    const rawImage = await sharp(pngBuf).ensureAlpha().raw().toBuffer();
    const qrResult = jsQR(new Uint8ClampedArray(rawImage), 2048, 682);
    console.log(`QR Decode Test ${i + 1} (${tc.regCode}):`, qrResult ? qrResult.data : 'FAILED');
  }
}

verifyPass().catch(console.error);
