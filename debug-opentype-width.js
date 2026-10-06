import fs from 'fs';
import path from 'path';
import opentype from 'opentype.js';

const spaceGroteskBuffer = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'SpaceGrotesk.ttf'));
const font = opentype.parse(spaceGroteskBuffer.buffer.slice(spaceGroteskBuffer.byteOffset, spaceGroteskBuffer.byteOffset + spaceGroteskBuffer.byteLength));

const str = 'Vasireddy Venkatadri Institute of Technology';
console.log('Font unitsPerEm:', font.unitsPerEm);
console.log('Advance width at 15px:', font.getAdvanceWidth(str, 15));
console.log('Advance width at 24px:', font.getAdvanceWidth(str, 24));

const path15 = font.getPath(str, 68, 234, 15);
const boundingBox = path15.getBoundingBox();
console.log('Bounding Box for 15px:', boundingBox);
