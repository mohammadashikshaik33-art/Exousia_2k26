import fs from 'fs';
import path from 'path';

async function downloadAndPrepareFonts() {
  console.log('=== DOWNLOADING & EMBEDDING EXACT GOOGLE FONTS ===');

  const fontsDir = path.join(process.cwd(), 'public', 'fonts');
  if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir, { recursive: true });
  }

  const spaceGroteskUrl = 'https://raw.githubusercontent.com/google/fonts/main/ofl/spacegrotesk/SpaceGrotesk%5Bwght%5D.ttf';
  const shareTechMonoUrl = 'https://raw.githubusercontent.com/google/fonts/main/ofl/sharetechmono/ShareTechMono-Regular.ttf';

  console.log('Fetching Space Grotesk TTF from Google Fonts repository...');
  const sgRes = await fetch(spaceGroteskUrl);
  console.log('Space Grotesk HTTP Status:', sgRes.status);
  if (!sgRes.ok) {
    console.error('Failed to fetch Space Grotesk:', sgRes.status);
    process.exit(1);
  }
  const sgBuf = Buffer.from(await sgRes.arrayBuffer());
  const sgPath = path.join(fontsDir, 'SpaceGrotesk.ttf');
  fs.writeFileSync(sgPath, sgBuf);
  console.log(`Saved Space Grotesk TTF: ${(sgBuf.length / 1024).toFixed(2)} KB`);

  console.log('Fetching Share Tech Mono Regular TTF from Google Fonts repository...');
  const stmRes = await fetch(shareTechMonoUrl);
  console.log('Share Tech Mono HTTP Status:', stmRes.status);
  if (!stmRes.ok) {
    console.error('Failed to fetch Share Tech Mono:', stmRes.status);
    process.exit(1);
  }
  const stmBuf = Buffer.from(await stmRes.arrayBuffer());
  const stmPath = path.join(fontsDir, 'ShareTechMono-Regular.ttf');
  fs.writeFileSync(stmPath, stmBuf);
  console.log(`Saved Share Tech Mono TTF: ${(stmBuf.length / 1024).toFixed(2)} KB`);

  console.log('✅ Both exact Google Fonts downloaded successfully!');
}

downloadAndPrepareFonts().catch(console.error);
