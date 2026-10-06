import fs from 'fs';
import path from 'path';

let cachedBgBase64 = null;

export function getDigitalPassBgBase64() {
  if (cachedBgBase64) return cachedBgBase64;
  try {
    const bgPath = path.join(process.cwd(), 'public', 'images', 'digital-pass-clean-bg.jpg');
    if (fs.existsSync(bgPath)) {
      const buf = fs.readFileSync(bgPath);
      cachedBgBase64 = `data:image/jpeg;base64,${buf.toString('base64')}`;
      return cachedBgBase64;
    }
  } catch (e) {
    console.warn('Could not read background image from disk:', e.message);
  }
  return '';
}
