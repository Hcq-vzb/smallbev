/**
 * Generate favicon and OG image assets.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const assetsDir = path.join(root, 'assets');
fs.mkdirSync(assetsDir, { recursive: true });

const sourceIcon = path.join(root, '0975c021f3cef4b6973f.png');
const sourceOg = path.join(root, '16071252a5333c6efb42.webp');

async function main() {
  if (fs.existsSync(sourceIcon)) {
    await sharp(sourceIcon)
      .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(assetsDir, 'favicon.png'));
    console.log('Created: assets/favicon.png');
  }

  if (fs.existsSync(sourceOg)) {
    await sharp(sourceOg)
      .resize(1200, 630, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(path.join(assetsDir, 'og-image.jpg'));
    console.log('Created: assets/og-image.jpg');
  }
}

main().catch(console.error);
