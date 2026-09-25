import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const articleDir = path.join(process.cwd(), 'dist', 'images', 'articles');

if (!fs.existsSync(articleDir)) {
  console.log('[SEO] No article image directory found in dist; skipping social image preparation.');
  process.exit(0);
}

const files = fs.readdirSync(articleDir).filter((name) => /\.(jpe?g|png|webp)$/i.test(name));
let resized = 0;
let skipped = 0;

for (const fileName of files) {
  const filePath = path.join(articleDir, fileName);
  const ext = path.extname(fileName).toLowerCase();
  const tempPath = `${filePath}.social-tmp${ext || '.jpg'}`;

  try {
    const image = sharp(filePath, { failOn: 'none' });
    const metadata = await image.metadata();

    if (metadata.width === 1200 && metadata.height === 630) continue;

    let pipeline = image
      .resize(1200, 630, {
        fit: 'cover',
        position: 'centre',
        kernel: sharp.kernel.lanczos3,
        withoutEnlargement: false,
      })
      .sharpen();

    if (ext === '.jpg' || ext === '.jpeg') {
      pipeline = pipeline.jpeg({ quality: 90, chromaSubsampling: '4:4:4' });
    } else if (ext === '.png') {
      pipeline = pipeline.png({ compressionLevel: 9 });
    } else if (ext === '.webp') {
      pipeline = pipeline.webp({ quality: 90 });
    }

    await pipeline.toFile(tempPath);
    fs.renameSync(tempPath, filePath);
    resized += 1;
    console.log(`[SEO] Prepared ${fileName}: ${metadata.width || '?'}x${metadata.height || '?'} -> 1200x630`);
  } catch (error) {
    // A malformed source image must never block the production deployment.
    // Keep the original Vite-copied asset in place and continue with the rest.
    if (fs.existsSync(tempPath)) fs.rmSync(tempPath, { force: true });
    skipped += 1;
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[SEO] Skipped social resize for ${fileName}: ${message}`);
  }
}

console.log(`[SEO] Prepared ${resized} article image(s) for Open Graph sharing; skipped ${skipped}.`);
