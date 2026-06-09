/**
 * Compress oversized images for web performance.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const THRESHOLD = 500 * 1024; // 500KB
const MAX_WIDTH = 1920;
const QUALITY = 75;

async function compressFile(filePath) {
  const stat = fs.statSync(filePath);
  const before = stat.size;
  const ext = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath);
  const outDir = path.join(path.dirname(filePath), 'media-optimized');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, basename);

  let pipeline = sharp(filePath).rotate();
  const meta = await pipeline.metadata();

  if (meta.width && meta.width > MAX_WIDTH) {
    pipeline = pipeline.resize(MAX_WIDTH, null, { withoutEnlargement: true });
  }

  if (ext === '.webp') {
    pipeline = pipeline.webp({ quality: QUALITY, effort: 6 });
  } else if (ext === '.jpg' || ext === '.jpeg') {
    pipeline = pipeline.jpeg({ quality: QUALITY, mozjpeg: true });
  } else if (ext === '.png') {
    pipeline = pipeline.png({ quality: QUALITY, compressionLevel: 9 });
  } else {
    return null;
  }

  await pipeline.toFile(outPath);
  const after = fs.statSync(outPath).size;

  if (after < before) {
    return { file: basename, before, after, outPath };
  }
  fs.unlinkSync(outPath);
  return null;
}

async function main() {
  const root = path.join(__dirname, '..');
  const files = fs.readdirSync(root).filter(f => /\.(webp|jpe?g|png)$/i.test(f));
  const large = files
    .map(f => ({ f, size: fs.statSync(path.join(root, f)).size }))
    .filter(x => x.size > THRESHOLD)
    .sort((a, b) => b.size - a.size);

  console.log('Compressing', large.length, 'large images...\n');

  let saved = 0;
  for (const { f } of large) {
    try {
      const result = await compressFile(path.join(root, f));
      if (result) {
        const pct = ((1 - result.after / result.before) * 100).toFixed(1);
        console.log(
          result.file + ': ' +
          (result.before / 1024 / 1024).toFixed(2) + 'MB -> ' +
          (result.after / 1024 / 1024).toFixed(2) + 'MB (' + pct + '% saved)'
        );
        saved += result.before - result.after;
      }
    } catch (err) {
      console.error('Error compressing', f, err.message);
    }
  }

  console.log('\nTotal saved: ' + (saved / 1024 / 1024).toFixed(2) + ' MB');

  // Write image map for seo-enhance.js
  const map = {};
  for (const { f } of large) {
    const optPath = path.join(root, 'media-optimized', f);
    if (fs.existsSync(optPath)) {
      map['/' + f] = '/media-optimized/' + f;
    }
  }
  if (Object.keys(map).length) {
    fs.writeFileSync(path.join(root, 'image-map.json'), JSON.stringify(map, null, 2));
    console.log('Generated: image-map.json (' + Object.keys(map).length + ' mappings)');
  }
}

main();
