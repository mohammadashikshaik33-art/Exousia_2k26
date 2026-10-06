import fs from 'fs';
import sharp from 'sharp';
import jsQR from 'jsqr';
import { generateDigitalPassPng } from './lib/digital-pass.js';

async function testFinalPassPipeline() {
  console.log('=== TESTING FINAL DIGITAL PASS PIPELINE (2048 x 1292 px) ===');

  const testCases = [
    {
      name: 'HEMANTH',
      college: 'Vasireddy Venkatadri Institute of Technology',
      eventTrack: 'HAWKINS TRAP',
      regCode: 'EX-2026-7NZLWR',
      eventDate: 'October 1, 2026'
    },
    {
      name: 'Mohammad Ashik Shaik',
      college: 'Vasireddy Venkatadri Institute of Technology',
      eventTrack: 'DARK PROTOCOL',
      regCode: 'EX-2026-ABCDEFG',
      eventDate: 'September 30, 2026'
    },
    {
      name: 'A Very Long Participant Name For Layout Testing',
      college: 'A Very Long College Name That Tests Dynamic Text Fitting And Wrapping',
      eventTrack: 'DARK PROTOCOL',
      regCode: 'EX-2026-123456',
      eventDate: 'September 30, 2026'
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const pngBuf = await generateDigitalPassPng(tc);

    const filename = `final-pass-test-${i + 1}.png`;
    fs.writeFileSync(filename, pngBuf);

    const meta = await sharp(pngBuf).metadata();
    console.log(`Saved ${filename}: ${pngBuf.length} bytes (${meta.width}x${meta.height} px, format: ${meta.format})`);

    // Extract QR section crop and decode
    const croppedQrBuf = await sharp(pngBuf)
      .extract({ left: 1390, top: 280, width: 500, height: 500 })
      .ensureAlpha()
      .raw()
      .toBuffer();

    const qrClamped = new Uint8ClampedArray(croppedQrBuf.buffer, croppedQrBuf.byteOffset, croppedQrBuf.byteLength);
    const qrResult = jsQR(qrClamped, 500, 500);
    console.log(`QR Decode Test ${i + 1} (${tc.regCode}):`, qrResult ? qrResult.data : 'FAILED');
  }
}

testFinalPassPipeline().catch(console.error);
