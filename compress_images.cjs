const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = path.join(__dirname, 'public', 'images');

async function processImages() {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const tempPath = path.join(dir, 'temp_' + file);
    
    console.log(`Processing ${file}...`);
    try {
      await sharp(filePath)
        .resize({ width: 800, withoutEnlargement: true }) // Downscale if larger than 800px width
        .jpeg({ quality: 80, force: false })
        .png({ quality: 80, compressionLevel: 9, force: false })
        .webp({ quality: 80 }) 
        .toFile(filePath.replace(/\.(png|jpg)$/, '.webp'));
        
      console.log(`Successfully compressed to WebP: ${file}`);
    } catch (e) {
      console.error(`Error processing ${file}:`, e);
    }
  }
}

processImages();
