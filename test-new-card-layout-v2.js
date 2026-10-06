import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import opentype from 'opentype.js';
import QRCode from 'qrcode';
import jsQR from 'jsqr';

const spaceGroteskBuffer = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'SpaceGrotesk.ttf'));
const shareTechMonoBuffer = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'ShareTechMono-Regular.ttf'));

const spaceGroteskFont = opentype.parse(spaceGroteskBuffer.buffer.slice(spaceGroteskBuffer.byteOffset, spaceGroteskBuffer.byteOffset + spaceGroteskBuffer.byteLength));
const shareTechMonoFont = opentype.parse(shareTechMonoBuffer.buffer.slice(shareTechMonoBuffer.byteOffset, shareTechMonoBuffer.byteOffset + shareTechMonoBuffer.byteLength));

function fitSingleLineText(font, text, x, y, maxFontSize, minFontSize, maxWidth, fill) {
  if (!font || !text) return '';
  let fontSize = maxFontSize;
  let textWidth = font.getAdvanceWidth(text, fontSize);

  while (textWidth > maxWidth && fontSize > minFontSize) {
    fontSize -= 0.5;
    textWidth = font.getAdvanceWidth(text, fontSize);
  }

  const opentypePath = font.getPath(text, x, y, fontSize);
  const pathData = opentypePath.toPathData(2);
  if (!pathData) return '';
  return `<path d="${pathData}" fill="${fill}" />`;
}

function fitMultiLineText(font, text, x, startY, maxFontSize, minFontSize, maxWidth, lineHeight, maxLines, fill) {
  if (!font || !text) return '';

  let words = text.split(/\s+/);
  let fontSize = maxFontSize;
  let lines = [];

  function computeLines(currentFontSize) {
    let resultLines = [];
    let currentLine = '';

    for (let word of words) {
      let testLine = currentLine ? `${currentLine} ${word}` : word;
      let width = font.getAdvanceWidth(testLine, currentFontSize);

      if (width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          resultLines.push(currentLine);
          currentLine = word;
        } else {
          resultLines.push(word);
          currentLine = '';
        }
      }
    }
    if (currentLine) {
      resultLines.push(currentLine);
    }
    return resultLines;
  }

  lines = computeLines(fontSize);

  while (lines.length > maxLines && fontSize > minFontSize) {
    fontSize -= 0.5;
    lines = computeLines(fontSize);
  }

  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    let lastLine = lines[maxLines - 1];
    if (font.getAdvanceWidth(lastLine + '...', minFontSize) > maxWidth) {
      while (lastLine.length > 0 && font.getAdvanceWidth(lastLine + '...', minFontSize) > maxWidth) {
        lastLine = lastLine.slice(0, -1);
      }
    }
    lines[maxLines - 1] = lastLine + '...';
  }

  let paths = [];
  lines.forEach((lineText, idx) => {
    let currentY = startY + (idx * lineHeight);
    let opentypePath = font.getPath(lineText, x, currentY, fontSize);
    let pathData = opentypePath.toPathData(2);
    if (pathData) {
      paths.push(`<path d="${pathData}" fill="${fill}" />`);
    }
  });

  return paths.join('\n');
}

function getCenteredTextPath(font, text, centerX, y, fontSize, fill) {
  if (!font || !text) return '';
  const textWidth = font.getAdvanceWidth(text, fontSize);
  const startX = centerX - (textWidth / 2);
  const opentypePath = font.getPath(text, startX, y, fontSize);
  const pathData = opentypePath.toPathData(2);
  if (!pathData) return '';
  return `<path d="${pathData}" fill="${fill}" />`;
}

async function renderCardTestV2(tc, idx) {
  const masterPath = path.join(process.cwd(), 'public', 'images', 'digital-pass-master-clean.png');
  const bgBuf = fs.readFileSync(masterPath);

  const formattedName = String(tc.name || '').toUpperCase();
  const displayCollege = String(tc.college || '');
  const formattedTrack = String(tc.eventTrack || '').toUpperCase();
  const formattedCode = String(tc.regCode || '').toUpperCase();
  const formattedDate = String(tc.eventDate || '').toUpperCase();

  // Field Labels (Share Tech Mono Vector Paths)
  const participantLabel = fitSingleLineText(shareTechMonoFont, 'PARTICIPANT NAME', 68, 142, 11, 11, 548, '#E50914');
  const collegeLabel = fitSingleLineText(shareTechMonoFont, 'INSTITUTION / COLLEGE', 68, 212, 11, 11, 548, '#E50914');
  const eventLabel = fitSingleLineText(shareTechMonoFont, 'EVENT TRACK', 68, 302, 11, 11, 548, '#E50914');
  const regIdLabel = fitSingleLineText(shareTechMonoFont, 'REGISTRATION ID', 68, 382, 11, 11, 250, '#E50914');
  const dateLabel = fitSingleLineText(shareTechMonoFont, 'EVENT DATE', 350, 382, 11, 11, 260, '#E50914');
  const statusLabel = fitSingleLineText(shareTechMonoFont, 'ENTRY STATUS', 68, 462, 11, 11, 548, '#E50914');
  const statusValue = fitSingleLineText(shareTechMonoFont, 'CONFIRMED // ENTRY AUTHORIZED', 68, 486, 13, 11, 548, '#00F0FF');

  // Dynamic Values with Deterministic Fitting Engine
  const nameValPath = fitSingleLineText(spaceGroteskFont, formattedName, 68, 172, 22, 14, 548, '#FFFFFF');
  const collegeValPath = fitMultiLineText(spaceGroteskFont, displayCollege, 68, 234, 15, 11, 548, 20, 2, '#A9B0B8');
  const eventValPath = fitSingleLineText(spaceGroteskFont, formattedTrack, 68, 328, 22, 14, 548, '#FFFFFF');
  const codeValPath = fitSingleLineText(shareTechMonoFont, formattedCode, 68, 406, 16, 12, 250, '#F3E7D3');
  const dateValPath = fitSingleLineText(shareTechMonoFont, formattedDate, 350, 406, 16, 12, 260, '#F3E7D3');

  // Sacred Right QR Zone Labels (Centered at centerX = 820)
  const scanPathCentered = getCenteredTextPath(shareTechMonoFont, 'SCAN FOR ENTRY', 820, 430, 13, '#E50914');
  const subPathCentered = getCenteredTextPath(shareTechMonoFont, 'OFFICIAL VERIFICATION DECK', 820, 452, 10, '#737B85');
  const secPathCentered = getCenteredTextPath(shareTechMonoFont, '100% SECURE ADMISSION', 820, 474, 9, '#00F0FF');

  const svgMasterOverlay = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="646" viewBox="0 0 1024 646">
  <!-- Header Branding -->
  <text x="44" y="48" fill="#E50914" font-family="'Space Grotesk', sans-serif" font-size="24" font-weight="700" letter-spacing="3">EXOUSIA 2K26</text>
  <text x="44" y="68" fill="#8A8A98" font-family="'Share Tech Mono', monospace" font-size="11" font-weight="600" letter-spacing="1.5">DEPARTMENT OF EEE — TECHNICAL FESTIVAL</text>
  <text x="980" y="48" text-anchor="end" fill="#737B85" font-family="'Share Tech Mono', monospace" font-size="10" letter-spacing="1">DIGITAL PASS // OFFICIAL ADMISSION DECK</text>

  <!-- Horizontal Header Separator Line -->
  <line x1="44" y1="86" x2="980" y2="86" stroke="#E50914" stroke-width="1" opacity="0.4" />

  <!-- Middle Information Panel (x: 44 to 640) -->
  <rect x="44" y="110" width="596" height="490" rx="14" ry="14" fill="#090C10" fill-opacity="0.88" stroke="#E50914" stroke-width="1" stroke-opacity="0.35" />

  <!-- Dynamic Vector Text Paths inside Info Panel -->
  ${participantLabel}
  ${nameValPath}

  ${collegeLabel}
  ${collegeValPath}

  ${eventLabel}
  ${eventValPath}

  <!-- Vertical Divider Line between Reg ID and Date -->
  <line x1="330" y1="372" x2="330" y2="416" stroke="#E50914" stroke-width="1" opacity="0.3" />

  ${regIdLabel}
  ${codeValPath}

  ${dateLabel}
  ${dateValPath}

  ${statusLabel}
  ${statusValue}

  <!-- Sacred Right QR Zone Box Container (x: 660 to 980) -->
  <rect x="660" y="110" width="320" height="490" rx="14" ry="14" fill="#0F141C" stroke="#E50914" stroke-width="1.5" />

  <!-- QR Box Inner Centered Labels -->
  ${scanPathCentered}
  ${subPathCentered}
  ${secPathCentered}

  <!-- Outer Card Frame Border -->
  <rect x="1.5" y="1.5" width="1021" height="643" rx="16" ry="16" fill="none" stroke="#E50914" stroke-width="1.5" opacity="0.8" />
</svg>`.trim();

  // Render Overlay at 2048 x 1292
  const svgOverlayBuf = await sharp(Buffer.from(svgMasterOverlay))
    .resize(2048, 1292, { fit: 'contain' })
    .png()
    .toBuffer();

  // QR Code PNG Buffer at 480 x 480 px (for 2048x1292 space)
  // In 1024x646 space, QR image is centered inside QR box (x=660..980) at x=700, y=145, width=240, height=240.
  // In 2048x1292 space (2x scale): left = 700*2 = 1400, top = 145*2 = 290, width = 480, height = 480.
  const targetVerifyUrl = `https://exousia-vert.vercel.app/verify?id=${encodeURIComponent(formattedCode)}`;
  const qrPngBuf = await QRCode.toBuffer(targetVerifyUrl, {
    width: 480,
    margin: 1,
    color: { dark: '#000000', light: '#FFFFFF' }
  });

  // Background artwork resized to 2048 x 1292 using fit: cover
  const bgResizedBuf = await sharp(bgBuf)
    .resize(2048, 1292, { fit: 'cover' })
    .toBuffer();

  const finalPngBuf = await sharp(bgResizedBuf)
    .composite([
      { input: svgOverlayBuf, top: 0, left: 0 },
      { input: qrPngBuf, top: 290, left: 1400 }
    ])
    .png({ compressionLevel: 9, quality: 100 })
    .toBuffer();

  const filename = `test-pass-v2-${idx}.png`;
  fs.writeFileSync(filename, finalPngBuf);
  console.log(`Saved ${filename} (${finalPngBuf.length} bytes, 2048x1292 px)`);

  // QR Decode Verification on cropped QR region
  const croppedQrBuf = await sharp(finalPngBuf)
    .extract({ left: 1390, top: 280, width: 500, height: 500 })
    .ensureAlpha()
    .raw()
    .toBuffer();

  const qrClamped = new Uint8ClampedArray(croppedQrBuf.buffer, croppedQrBuf.byteOffset, croppedQrBuf.byteLength);
  const qrResult = jsQR(qrClamped, 500, 500);
  console.log(`QR Decode Test ${idx}:`, qrResult ? qrResult.data : 'FAILED');
}

async function runAllTestsV2() {
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
    await renderCardTestV2(testCases[i], i + 1);
  }
}

runAllTestsV2().catch(console.error);
