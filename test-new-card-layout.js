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

async function renderCardTest(tc, idx) {
  const masterPath = path.join(process.cwd(), 'public', 'images', 'digital-pass-master-clean.png');
  const bgBuf = fs.readFileSync(masterPath);

  const formattedName = String(tc.name || '').toUpperCase();
  const displayCollege = String(tc.college || '');
  const formattedTrack = String(tc.eventTrack || '').toUpperCase();
  const formattedCode = String(tc.regCode || '').toUpperCase();
  const formattedDate = String(tc.eventDate || '').toUpperCase();

  // Labels
  const participantLabel = fitSingleLineText(shareTechMonoFont, 'PARTICIPANT NAME', 48, 150, 11, 11, 570, '#E50914');
  const collegeLabel = fitSingleLineText(shareTechMonoFont, 'INSTITUTION / COLLEGE', 48, 225, 11, 11, 570, '#E50914');
  const eventLabel = fitSingleLineText(shareTechMonoFont, 'EVENT TRACK', 48, 318, 11, 11, 570, '#E50914');
  const regIdLabel = fitSingleLineText(shareTechMonoFont, 'REGISTRATION ID', 48, 415, 11, 11, 270, '#E50914');
  const dateLabel = fitSingleLineText(shareTechMonoFont, 'EVENT DATE', 340, 415, 11, 11, 280, '#E50914');
  const statusLabel = fitSingleLineText(shareTechMonoFont, 'ENTRY STATUS', 48, 492, 11, 11, 570, '#E50914');
  const statusValue = fitSingleLineText(shareTechMonoFont, 'CONFIRMED // ENTRY AUTHORIZED', 48, 514, 13, 11, 570, '#00F0FF');

  // Dynamic Values with Deterministic Fitting Engine
  const nameValPath = fitSingleLineText(spaceGroteskFont, formattedName, 48, 178, 24, 14, 570, '#FFFFFF');
  const collegeValPath = fitMultiLineText(spaceGroteskFont, displayCollege, 48, 246, 15, 11, 570, 20, 2, '#A9B0B8');
  const eventValPath = fitSingleLineText(spaceGroteskFont, formattedTrack, 48, 344, 22, 14, 570, '#FFFFFF');
  const codeValPath = fitSingleLineText(shareTechMonoFont, formattedCode, 48, 438, 16, 12, 270, '#F3E7D3');
  const dateValPath = fitSingleLineText(shareTechMonoFont, formattedDate, 340, 438, 16, 12, 280, '#F3E7D3');

  // QR Label inside Sacred QR Zone
  const scanWidth = shareTechMonoFont.getAdvanceWidth('SCAN FOR ENTRY', 12);
  const scanPathCentered = fitSingleLineText(shareTechMonoFont, 'SCAN FOR ENTRY', 828 - (scanWidth / 2), 422, 12, 12, 260, '#E50914');
  const subWidth = shareTechMonoFont.getAdvanceWidth('OFFICIAL VERIFICATION', 10);
  const subPathCentered = fitSingleLineText(shareTechMonoFont, 'OFFICIAL VERIFICATION', 828 - (subWidth / 2), 442, 10, 10, 260, '#737B85');

  const svgMasterOverlay = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="646" viewBox="0 0 1024 646">
  <!-- Header Branding -->
  <text x="48" y="52" fill="#E50914" font-family="'Space Grotesk', sans-serif" font-size="22" font-weight="700" letter-spacing="3">EXOUSIA 2K26</text>
  <text x="48" y="74" fill="#8A8A98" font-family="'Share Tech Mono', monospace" font-size="11" font-weight="600" letter-spacing="1.5">DEPARTMENT OF EEE — TECHNICAL FESTIVAL</text>
  <text x="976" y="52" text-anchor="end" fill="#737B85" font-family="'Share Tech Mono', monospace" font-size="10" letter-spacing="1">DIGITAL PASS // OFFICIAL ADMISSION DECK</text>

  <!-- Horizontal Divider Line -->
  <line x1="48" y1="92" x2="976" y2="92" stroke="#E50914" stroke-width="1" opacity="0.4" />

  <!-- Sacred Right QR Zone Box Container -->
  <rect x="680" y="130" width="296" height="390" rx="14" ry="14" fill="#0F141C" stroke="#E50914" stroke-width="1.5" />
  
  <!-- Dynamic Vector Text Paths -->
  ${participantLabel}
  ${nameValPath}

  ${collegeLabel}
  ${collegeValPath}

  ${eventLabel}
  ${eventValPath}

  <!-- Vertical Divider Line between Reg ID and Date -->
  <line x1="324" y1="410" x2="324" y2="450" stroke="#E50914" stroke-width="1" opacity="0.3" />

  ${regIdLabel}
  ${codeValPath}

  ${dateLabel}
  ${dateValPath}

  ${statusLabel}
  ${statusValue}

  <!-- QR Box Inner Labels -->
  ${scanPathCentered}
  ${subPathCentered}

  <!-- Outer Card Frame Border -->
  <rect x="1.5" y="1.5" width="1021" height="643" rx="16" ry="16" fill="none" stroke="#E50914" stroke-width="1.5" opacity="0.8" />
</svg>`.trim();

  // Render Overlay at 2048 x 1292
  const svgOverlayBuf = await sharp(Buffer.from(svgMasterOverlay))
    .resize(2048, 1292, { fit: 'contain' })
    .png()
    .toBuffer();

  const targetVerifyUrl = `https://exousia-vert.vercel.app/verify?id=${encodeURIComponent(formattedCode)}`;
  const qrPngBuf = await QRCode.toBuffer(targetVerifyUrl, {
    width: 440,
    margin: 1,
    color: { dark: '#000000', light: '#FFFFFF' }
  });

  const bgResizedBuf = await sharp(bgBuf)
    .resize(2048, 682, { fit: 'cover' })
    .extend({
      top: 0,
      bottom: 610,
      left: 0,
      right: 0,
      background: '#0A0608'
    })
    .resize(2048, 1292, { fit: 'cover' })
    .toBuffer();

  const finalPngBuf = await sharp(bgResizedBuf)
    .composite([
      { input: svgOverlayBuf, top: 0, left: 0 },
      { input: qrPngBuf, top: 320, left: 1436 }
    ])
    .png({ compressionLevel: 9, quality: 100 })
    .toBuffer();

  const filename = `test-pass-layout-${idx}.png`;
  fs.writeFileSync(filename, finalPngBuf);
  console.log(`Saved ${filename} (${finalPngBuf.length} bytes, 2048x1292 px)`);

  // QR Decode Verification on cropped QR region
  const croppedQrBuf = await sharp(finalPngBuf)
    .extract({ left: 1430, top: 310, width: 450, height: 450 })
    .ensureAlpha()
    .raw()
    .toBuffer();

  const qrClamped = new Uint8ClampedArray(croppedQrBuf.buffer, croppedQrBuf.byteOffset, croppedQrBuf.byteLength);
  const qrResult = jsQR(qrClamped, 450, 450);
  console.log(`QR Decode Test ${idx}:`, qrResult ? qrResult.data : 'FAILED');
}

async function runAllTests() {
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
    await renderCardTest(testCases[i], i + 1);
  }
}

runAllTests().catch(console.error);
