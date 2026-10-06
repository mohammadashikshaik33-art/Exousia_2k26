import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function measureLabels() {
  const masterPath = path.join(process.cwd(), 'public', 'images', 'digital-pass-master-clean.png');
  const metadata = await sharp(masterPath).metadata();
  console.log('Master image dimensions:', metadata.width, 'x', metadata.height);

  // Extract text section crop (x: 550 to 850, y: 50 to 260) in 1024x341 space (or 2048x682 space)
  // Let's scale crop to 1024x341 space for inspection
  const crop1024 = await sharp(masterPath)
    .resize(1024, 341, { fit: 'contain' })
    .extract({ left: 540, top: 40, width: 320, height: 230 })
    .toFile('crop-labels-1024.png');

  console.log('Saved crop-labels-1024.png for coordinate inspection');
}

measureLabels().catch(console.error);
