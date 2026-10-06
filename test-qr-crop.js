import fs from 'fs';
import sharp from 'sharp';
import jsQR from 'jsqr';

async function testQrCrop() {
  const imageBuf = fs.readFileSync('test-opentype-pass-1.png');
  // QR is at transform translate(872, 120) with width 104, height 104 in 1024x341 canvas.
  // In 2048x682 image, scale is 2x. So x=1744, y=240, width=208, height=208.
  const croppedBuf = await sharp(imageBuf)
    .extract({ left: 1740, top: 236, width: 220, height: 220 })
    .ensureAlpha()
    .raw()
    .toBuffer();

  const qrResult = jsQR(new Uint8ClampedArray(croppedBuf), 220, 220);
  console.log('Cropped QR Decode Result:', qrResult ? qrResult.data : 'FAILED');
}

testQrCrop().catch(console.error);
