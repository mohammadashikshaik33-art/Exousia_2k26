import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import opentype from 'opentype.js';
import QRCode from 'qrcode';

// In-Memory Cached Master Background Buffers & Fonts
const masterBgCache = new Map();
let spaceGroteskFont = null;
let shareTechMonoFont = null;

export function getMasterBgBufferForEvent(eventTrack) {
  const norm = String(eventTrack || '').toUpperCase();
  let key = 'cluedup';
  if (norm.includes('HAWKINS')) key = 'hawkins';
  else if (norm.includes('DARK PROTOCOL') || norm.includes('DARK PORTAL') || norm.includes('DARK')) key = 'darkprotocol';
  else if (norm.includes('GENOVA') || norm.includes('NEXORA')) key = 'genova';

  if (masterBgCache.has(key)) {
    return masterBgCache.get(key);
  }

  try {
    const filename = `digital-pass-${key}-master.png`;
    const p = path.join(process.cwd(), 'public', 'images', filename);
    if (fs.existsSync(p)) {
      const buf = fs.readFileSync(p);
      masterBgCache.set(key, buf);
      return buf;
    }
  } catch (e) {
    console.warn(`Failed to read master background for key ${key}:`, e.message);
  }

  // Fallback to cluedup master
  try {
    const fallbackPath = path.join(process.cwd(), 'public', 'images', 'digital-pass-cluedup-master.png');
    if (fs.existsSync(fallbackPath)) {
      const fallbackBuf = fs.readFileSync(fallbackPath);
      masterBgCache.set(key, fallbackBuf);
      return fallbackBuf;
    }
  } catch (e) {
    console.warn('Fallback background not found:', e.message);
  }
  return null;
}

export function getMasterBgBase64ForEvent(eventTrack) {
  const buf = getMasterBgBufferForEvent(eventTrack);
  if (!buf) return '';
  return `data:image/png;base64,${buf.toString('base64')}`;
}

export function getSpaceGroteskFont() {
  if (spaceGroteskFont !== null) return spaceGroteskFont;
  try {
    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'SpaceGrotesk.ttf');
    if (fs.existsSync(fontPath)) {
      const buf = fs.readFileSync(fontPath);
      spaceGroteskFont = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
      return spaceGroteskFont;
    }
  } catch (e) {
    console.warn('Could not parse SpaceGrotesk.ttf:', e.message);
  }
  return null;
}

export function getShareTechMonoFont() {
  if (shareTechMonoFont !== null) return shareTechMonoFont;
  try {
    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'ShareTechMono-Regular.ttf');
    if (fs.existsSync(fontPath)) {
      const buf = fs.readFileSync(fontPath);
      shareTechMonoFont = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
      return shareTechMonoFont;
    }
  } catch (e) {
    console.warn('Could not parse ShareTechMono-Regular.ttf:', e.message);
  }
  return null;
}

// Opentype Vector Path Sanitization & Rendering Functions (0 Missing Glyphs Guarantee)
function sanitizeTextForFont(font, text) {
  if (!font || !text) return '';
  let clean = '';
  for (const char of String(text)) {
    if (char === ' ') {
      clean += ' ';
    } else if (font.charToGlyphIndex(char) !== 0) {
      clean += char;
    } else {
      clean += '?';
    }
  }
  return clean;
}

function fitSingleLineText(font, text, x, y, maxFontSize, minFontSize, maxWidth, fill) {
  if (!font || !text) return '';
  const sanitized = sanitizeTextForFont(font, text);
  if (!sanitized) return '';

  let fontSize = maxFontSize;
  let textWidth = font.getAdvanceWidth(sanitized, fontSize);

  while (textWidth > maxWidth && fontSize > minFontSize) {
    fontSize -= 0.5;
    textWidth = font.getAdvanceWidth(sanitized, fontSize);
  }

  const opentypePath = font.getPath(sanitized, x, y, fontSize);
  let pathData = opentypePath.toPathData(2);
  if (!pathData) return '';
  if (pathData.includes('NaN')) {
    pathData = pathData.replace(/NaN/g, '0');
  }
  return `<path d="${pathData}" fill="${fill}" />`;
}

function fitMultiLineText(font, text, x, startY, maxFontSize, minFontSize, maxWidth, lineHeight, maxLines, fill) {
  if (!font || !text) return '';
  const sanitized = sanitizeTextForFont(font, text);
  if (!sanitized) return '';

  let words = sanitized.split(/\s+/);
  let fontSize = maxFontSize;

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

  let lines = computeLines(fontSize);

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
      if (pathData.includes('NaN')) {
        pathData = pathData.replace(/NaN/g, '0');
      }
      paths.push(`<path d="${pathData}" fill="${fill}" />`);
    }
  });

  return paths.join('\n');
}

// Automated Geometry Validation Engine for Reserved Master Artwork Slots
export function validatePassGeometry({ name, college, regCode, registeredDate, eventDate }) {
  const sgFont = getSpaceGroteskFont();
  const stmFont = getShareTechMonoFont();

  if (!sgFont || !stmFont) {
    return { valid: false, error: 'Font resources missing' };
  }

  const formattedName = String(name || '').toUpperCase();
  const displayCollege = String(college || '');
  const formattedCode = String(regCode || '').toUpperCase();
  const formattedRegDate = String(registeredDate || 'SEP 26, 2026').toUpperCase();

  // Zone 1: Participant Name (Max Width: 540px on 1024x646 scale)
  let nameSize = 24;
  while (sgFont.getAdvanceWidth(formattedName, nameSize) > 540 && nameSize > 13) nameSize -= 0.5;
  const nameWidth = sgFont.getAdvanceWidth(formattedName, nameSize);
  if (nameWidth > 540) return { valid: false, error: `Participant Name exceeds safe zone: ${nameWidth} > 540` };

  // Zone 2: College Name (Max Width: 540px, Max 2 lines)
  let collegeLines = displayCollege.split(/\s+/).reduce((acc, word) => {
    let lastLine = acc[acc.length - 1] || '';
    let testLine = lastLine ? `${lastLine} ${word}` : word;
    if (sgFont.getAdvanceWidth(testLine, 14) <= 540) {
      if (acc.length === 0) acc.push(word);
      else acc[acc.length - 1] = testLine;
    } else {
      acc.push(word);
    }
    return acc;
  }, []);
  if (collegeLines.length > 3) return { valid: false, error: 'College text overflowed max lines' };

  // Zone 3: Metadata Columns
  const regIdWidth = stmFont.getAdvanceWidth(formattedCode, 12.5);
  if (regIdWidth > 185) return { valid: false, error: `Registration ID exceeds column width: ${regIdWidth} > 185` };

  const regDateWidth = stmFont.getAdvanceWidth(formattedRegDate, 14);
  if (regDateWidth > 175) return { valid: false, error: `Registration Date exceeds column width: ${regDateWidth} > 175` };

  return { valid: true };
}

export function generateDigitalPassSvg({ name, college, eventTrack, regCode, registeredDate, eventDate, eventStartDate, qrDataUrl }) {
  const bgBase64 = getMasterBgBase64ForEvent(eventTrack);
  const sgFont = getSpaceGroteskFont();
  const stmFont = getShareTechMonoFont();

  const formattedName = String(name || 'EXOUSIA PARTICIPANT').toUpperCase();
  const displayCollege = String(college || 'Vasireddy Venkatadri Institute of Technology');
  const formattedCode = String(regCode || 'EX-2026-000000').toUpperCase();
  const formattedRegDate = String(registeredDate || 'SEP 26, 2026').toUpperCase();
  const formattedEvDate = String(eventDate || 'SEP 30, 2026').toUpperCase();
  const evStart = (eventStartDate && eventStartDate !== 'undefined') ? eventStartDate : 'SEPTEMBER 30, 2026';
  const formattedEvStartDate = String(evStart).toUpperCase();

  // Dynamic Vector Values Rendered Directly into Reserved Master Artwork Slots
  const nameValPath = fitSingleLineText(sgFont, formattedName, 52, 198, 24, 14, 540, '#FFFFFF');
  const collegeValPath = fitMultiLineText(sgFont, displayCollege, 52, 244, 14, 10, 540, 19, 2, '#D0D6E0');

  // Metadata Columns (Positioned directly under master artwork's column labels)
  const codeValPath = fitSingleLineText(stmFont, formattedCode, 52, 532, 12.5, 9.5, 185, '#FFFFFF');
  const regDateValPath = fitSingleLineText(stmFont, formattedRegDate, 248, 532, 14, 11, 175, '#F3E7D3');
  const evDateValPath = fitSingleLineText(stmFont, formattedEvDate, 444, 532, 14, 11, 175, '#F3E7D3');

  // Event Start Date (Positioned directly next to master artwork's bottom start date icon & label)
  const evStartDatePath = fitSingleLineText(stmFont, formattedEvStartDate, 252, 572, 11, 9, 210, '#F3E7D3');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1024" height="646" viewBox="0 0 1024 646">
  <!-- Master Background Artwork (The Design) -->
  ${bgBase64 ? `<image href="${bgBase64}" xlink:href="${bgBase64}" x="0" y="0" width="1024" height="646" preserveAspectRatio="none" />` : `<rect width="1024" height="646" fill="#0A0608" />`}

  <!-- Dynamic Vector Text Paths Rendered Directly into Master Artwork Slots -->
  ${nameValPath}
  ${collegeValPath}

  ${codeValPath}
  ${regDateValPath}
  ${evDateValPath}

  ${evStartDatePath}

  <!-- Real Verification QR Code (Positioned inside artwork's reserved QR corner brackets) -->
  ${qrDataUrl ? `<g transform="translate(742, 188)"><image href="${qrDataUrl}" xlink:href="${qrDataUrl}" x="0" y="0" width="220" height="220" /></g>` : ''}
</svg>`.trim();
}

export async function generateDigitalPassPng({ name, college, eventTrack, regCode, registeredDate, eventDate, eventStartDate, qrDataUrl }) {
  const sgFont = getSpaceGroteskFont();
  const stmFont = getShareTechMonoFont();
  const bgBuf = getMasterBgBufferForEvent(eventTrack);

  const formattedName = String(name || 'EXOUSIA PARTICIPANT').toUpperCase();
  const displayCollege = String(college || 'Vasireddy Venkatadri Institute of Technology');
  const formattedCode = String(regCode || 'EX-2026-000000').toUpperCase();
  const formattedRegDate = String(registeredDate || 'SEP 26, 2026').toUpperCase();
  const formattedEvDate = String(eventDate || 'SEP 30, 2026').toUpperCase();
  const evStart = (eventStartDate && eventStartDate !== 'undefined') ? eventStartDate : 'SEPTEMBER 30, 2026';
  const formattedEvStartDate = String(evStart).toUpperCase();

  // Dynamic Vector Values Rendered Directly into Reserved Master Artwork Slots
  const nameValPath = fitSingleLineText(sgFont, formattedName, 52, 198, 24, 14, 540, '#FFFFFF');
  const collegeValPath = fitMultiLineText(sgFont, displayCollege, 52, 244, 14, 10, 540, 19, 2, '#D0D6E0');

  // Metadata Columns
  const codeValPath = fitSingleLineText(stmFont, formattedCode, 52, 532, 12.5, 9.5, 185, '#FFFFFF');
  const regDateValPath = fitSingleLineText(stmFont, formattedRegDate, 248, 532, 14, 11, 175, '#F3E7D3');
  const evDateValPath = fitSingleLineText(stmFont, formattedEvDate, 444, 532, 14, 11, 175, '#F3E7D3');

  // Event Start Date
  const evStartDatePath = fitSingleLineText(stmFont, formattedEvStartDate, 252, 572, 11, 9, 210, '#F3E7D3');

  const svgMasterOverlay = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="646" viewBox="0 0 1024 646">
  <!-- Dynamic Vector Text Paths (0 Redundant Headers, 0 Background Overlaps) -->
  ${nameValPath}
  ${collegeValPath}

  ${codeValPath}
  ${regDateValPath}
  ${evDateValPath}

  ${evStartDatePath}
</svg>`.trim();

  // Target Dimensions: 2048 x 1292 (Optimized 2K HD Master Resolution)
  const svgOverlayBuf = await sharp(Buffer.from(svgMasterOverlay))
    .resize(2048, 1292, { fit: 'contain' })
    .png()
    .toBuffer();

  // High-Density QR Code PNG (440 x 440 px)
  const targetVerifyUrl = `https://exousia-vert.vercel.app/verify?id=${encodeURIComponent(formattedCode)}`;
  const qrPngBuf = await QRCode.toBuffer(targetVerifyUrl, {
    width: 440,
    margin: 1,
    color: { dark: '#000000', light: '#FFFFFF' }
  });

  // Master Background artwork resized to 2048 x 1292 using fit: cover
  let baseBg = bgBuf;
  if (!baseBg) {
    baseBg = await sharp({
      create: { width: 2048, height: 1292, channels: 4, background: { r: 10, g: 6, b: 8, alpha: 1 } }
    }).png().toBuffer();
  }

  const bgResizedBuf = await sharp(baseBg)
    .resize(2048, 1292, { fit: 'cover' })
    .toBuffer();

  // Composite Overlay & QR Code directly into master background's reserved QR container (top: 376, left: 1484)
  const finalPngBuf = await sharp(bgResizedBuf)
    .composite([
      { input: svgOverlayBuf, top: 0, left: 0 },
      { input: qrPngBuf, top: 376, left: 1484 }
    ])
    .png({ compressionLevel: 6, quality: 90 })
    .toBuffer();

  return finalPngBuf;
}
