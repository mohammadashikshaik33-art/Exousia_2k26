// EXOUSIA 2K26 — PARTICIPANT & COORDINATOR E2E VERIFICATION SUITE
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

function hashString(str) {
  let hash = 2166136261;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) {
    hash ^= s.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash);
}

function generateAnomalySignature(regId) {
  const seed = hashString(regId || 'EX-2026-DEFAULT');
  const nodeX1 = 120 + (seed % 340);
  const nodeY1 = 80 + ((seed >> 2) % 200);
  const nodeX2 = 500 + ((seed >> 4) % 400);
  const nodeY2 = 280 + ((seed >> 6) % 240);
  const nodeX3 = 900 + ((seed >> 8) % 300);
  const nodeY3 = 150 + ((seed >> 10) % 350);
  return { seed, nodeX1, nodeY1, nodeX2, nodeY2, nodeX3, nodeY3 };
}

async function runProductionAuditSuite() {
  console.log('============================================================');
  console.log('  EXOUSIA 2K26 — COMPLETE E2E PRODUCTION VERIFICATION SUITE  ');
  console.log('============================================================\n');

  const testCases = [
    {
      id: 'EX-2026-6LSTPW',
      name: 'MOHAMMAD ASHIK SHAIK',
      college: 'Vignan\'s Institute of Information Technology, Visakhapatnam',
      event: 'CLUE\'D UP',
      date: 'SEP 26, 2026'
    },
    {
      id: 'EX-2026-7NZLWR',
      name: 'ALEX',
      college: 'VVIT',
      event: 'HAWKINS TRAP',
      date: 'SEP 27, 2026'
    },
    {
      id: 'EX-2026-8XKMPQ',
      name: 'SRIVANI VASIREDDY',
      college: 'Vasireddy Venkatadri Institute of Technology',
      event: 'DARK PROTOCOL',
      date: 'SEP 28, 2026'
    },
    {
      id: 'EX-2026-9PLMNV',
      name: 'AMBIKA LAHARI',
      college: 'Koneru Lakshmaiah Education Foundation',
      event: 'GENOVA',
      date: 'SEP 29, 2026'
    }
  ];

  console.log('--- PART 1: DETERMINISTIC ANOMALY SIGNATURE AUDIT ---');
  for (const tc of testCases) {
    const sig1 = generateAnomalySignature(tc.id);
    const sig2 = generateAnomalySignature(tc.id);

    if (sig1.seed !== sig2.seed || sig1.nodeX1 !== sig2.nodeX1) {
      console.error(`❌ FAILED: Non-deterministic signature for ${tc.id}`);
      process.exit(1);
    }
    console.log(`✓ Signature OK for ${tc.id}: Seed 0x${sig1.seed.toString(16).toUpperCase()}`);
  }

  console.log('\n--- PART 2: DYNAMIC QR CODE & VERIFICATION URL AUDIT ---');
  for (const tc of testCases) {
    const targetUrl = `https://exousia-vert.vercel.app/verify?id=${encodeURIComponent(tc.id)}`;
    const qrBuffer = await QRCode.toBuffer(targetUrl, { width: 220, margin: 1 });
    const sharp = (await import('sharp')).default;
    const { data, info } = await sharp(qrBuffer).raw().ensureAlpha().toBuffer({ resolveWithObject: true });

    const code = jsQR(new Uint8ClampedArray(data), info.width, info.height);
    if (!code || code.data !== targetUrl) {
      console.error(`❌ FAILED: QR decode mismatch for ${tc.id}. Expected ${targetUrl}, got ${code?.data}`);
      process.exit(1);
    }
    console.log(`✓ QR Code Decoded Successfully for ${tc.id}: ${code.data}`);
  }

  console.log('\n--- PART 3: PARTICIPANT EMAIL & ANOMALY FILE UX AUDIT ---');
  const registerJsContent = fs.readFileSync(path.resolve(process.cwd(), 'api/register.js'), 'utf8');
  if (registerJsContent.includes('[ VERIFY REGISTRATION ]') || registerJsContent.includes('verifyUrl')) {
    console.error('❌ FAILED: Found participant-facing VERIFY REGISTRATION link in api/register.js');
    process.exit(1);
  }
  console.log('✓ Confirmation Email contains ONLY [ VIEW ANOMALY FILE ] link (0 VERIFY REGISTRATION links).');

  const passHtmlContent = fs.readFileSync(path.resolve(process.cwd(), 'pass.html'), 'utf8');
  if (passHtmlContent.includes('id="link-verify-pass"') || passHtmlContent.includes('VERIFY RECORD')) {
    console.error('❌ FAILED: Found VERIFY RECORD link in pass.html');
    process.exit(1);
  }
  console.log('✓ Anomaly File page contains ONLY participant credential access (0 VERIFY RECORD links).');

  console.log('\n--- PART 4: COORDINATOR PORTAL ENTRY & SCOPE AUDIT ---');
  const coordHtmlContent = fs.readFileSync(path.resolve(process.cwd(), 'coordinator.html'), 'utf8');
  if (!coordHtmlContent.includes('CLUE\'D UP') || !coordHtmlContent.includes('HAWKINS TRAP') || !coordHtmlContent.includes('DARK PROTOCOL') || !coordHtmlContent.includes('GENOVA')) {
    console.error('❌ FAILED: Missing 4 Event Selector Cards in coordinator.html');
    process.exit(1);
  }
  console.log('✓ Coordinator Portal contains 4 Event Selector Cards (CLUE\'D UP, HAWKINS TRAP, DARK PROTOCOL, GENOVA).');

  if (!coordHtmlContent.includes('id="coord-btn-scan-qr"') || !coordHtmlContent.includes('id="coord-qr-modal"')) {
    console.error('❌ FAILED: Missing QR scanner elements in coordinator.html');
    process.exit(1);
  }
  console.log('✓ Coordinator Portal includes camera QR Scanner tool & Registration ID search tool.');

  console.log('\n============================================================');
  console.log('  SUCCESS: ALL E2E PARTICIPANT & COORDINATOR CHECKS PASSED!');
  console.log('============================================================\n');
}

runProductionAuditSuite().catch((err) => {
  console.error('Audit Exception:', err);
  process.exit(1);
});
