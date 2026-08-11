const fs = require('fs');
const path = require('path');

const srcPath = 'C:\\Users\\usuario\\.gemini\\antigravity\\brain\\a99c3581-dea6-4c4e-9a79-c3c8408d4f51\\hm_landing_page_1780627807241.png';

const dests = [
  path.join(__dirname, '../public/img/landing-page-mockup.png'),
  path.join(__dirname, '../docs/assets/landing-page-mockup.png')
];

// Ensure target directories exist
fs.mkdirSync(path.join(__dirname, '../public/img'), { recursive: true });
fs.mkdirSync(path.join(__dirname, '../docs/assets'), { recursive: true });

dests.forEach(dest => {
  try {
    fs.copyFileSync(srcPath, dest);
    console.log(`Copied successfully to: ${dest}`);
  } catch (err) {
    console.error(`Error copying to ${dest}:`, err.message);
  }
});
