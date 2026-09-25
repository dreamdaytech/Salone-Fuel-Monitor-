import fs from 'node:fs';
import path from 'node:path';

const seoDir = path.join(process.cwd(), 'dist', '_seo');
if (!fs.existsSync(seoDir)) process.exit(0);

const authorPattern = /"author":\{"@type":"Organization","name":"([^"]+)","url":"https:\/\/salonefuelmonitor\.com"\}/g;
const authorReplacement = '"author":{"@type":"Organization","name":"$1","url":"https://salonefuelmonitor.com","logo":{"@type":"ImageObject","url":"https://salonefuelmonitor.com/logo.png"}}';

let changed = 0;
for (const fileName of fs.readdirSync(seoDir)) {
  if (!fileName.endsWith('.html')) continue;
  const filePath = path.join(seoDir, fileName);
  const html = fs.readFileSync(filePath, 'utf8');
  const hardened = html.replace(authorPattern, authorReplacement);
  if (hardened !== html) {
    fs.writeFileSync(filePath, hardened);
    changed += 1;
  }
}

console.log(`[SEO] Hardened Article author schema in ${changed} prerendered page(s).`);
