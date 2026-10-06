import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import jsQR from 'jsqr';
import { generateDigitalPassPng, validatePassGeometry } from './lib/digital-pass.js';

async function runAudit() {
  console.log('=== STARTING MASTER ARTWORK DIGITAL PASS AUDIT ===\n');

  const testCases = [
    {
      name: 'MOHAMMAD ASHIK SHAIK',
      college: 'Vasireddy Venkatadri Institute of Technology',
      eventTrack: "CLUE'D UP",
      regCode: 'EX-2026-6LSTPW',
      registeredDate: '26 SEP 2026'
    },
    {
      name: 'HEMANTH KUMAR',
      college: 'Velagapudi Ramakrishna Siddhartha Engineering College',
      eventTrack: 'HAWKINS TRAP',
      regCode: 'EX-2026-7NZLWR',
      registeredDate: '26 SEP 2026'
    },
    {
      name: 'CHANDRA SEKHAR SHARMA',
      college: 'Koneru Lakshmaiah Education Foundation (KL University)',
      eventTrack: 'DARK PROTOCOL',
      regCode: 'EX-2026-8XKMPQ',
      registeredDate: '27 SEP 2026'
    },
    {
      name: 'VISHNU VARDHAN RAO',
      college: 'SRKR Engineering College, Bhimavaram',
      eventTrack: 'GENOVA',
      regCode: 'EX-2026-9PLMNV',
      registeredDate: '27 SEP 2026'
    }
  ];

  const artifactDir = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\0b4a90fe-e48e-45aa-b229-563c65d25b09';

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    console.log(`Testing Case ${i + 1}: ${tc.eventTrack} - ${tc.name}`);

    // 1. Geometry Validation Test
    const geomResult = validatePassGeometry(tc);
    console.log(`- Geometry Check: ${geomResult.valid ? 'PASSED' : 'FAILED: ' + geomResult.error}`);
    if (!geomResult.valid) {
      process.exit(1);
    }

    // 2. PNG Render Test
    const pngBuffer = await generateDigitalPassPng(tc);
    console.log(`- PNG Rendered: ${pngBuffer.length} bytes`);

    const outPath = path.join(artifactDir, `master_pass_tuned_${i + 1}.png`);
    fs.writeFileSync(outPath, pngBuffer);
    console.log(`- Saved Artifact: ${outPath}`);

    // 3. QR Decode Test (Cropped from top: 752, left: 2968, size: 880x880)
    const croppedQrBuf = await sharp(pngBuffer)
      .extract({ left: 2968, top: 752, width: 880, height: 880 })
      .ensureAlpha()
      .raw()
      .toBuffer();

    const qrClamped = new Uint8ClampedArray(croppedQrBuf.buffer, croppedQrBuf.byteOffset, croppedQrBuf.byteLength);
    const qrResult = jsQR(qrClamped, 880, 880);
    if (qrResult) {
      console.log(`- QR Decode Success: ${qrResult.data}`);
    } else {
      console.error(`- QR Decode FAILED for ${tc.regCode}!`);
      process.exit(1);
    }
    console.log('');
  }

  console.log('=== AUDIT COMPLETED SUCCESSFULLY: ALL 4 MASTER PASSES VERIFIED ===');
}

runAudit().catch(err => {
  console.error('Audit Error:', err);
  process.exit(1);
});
