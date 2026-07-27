import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  
  const rootHtml = await page.evaluate(() => document.getElementById('root').innerHTML);
  console.log(rootHtml.includes('<main>') ? 'HAS MAIN' : 'NO MAIN');
  const mainMatch = rootHtml.match(/<main>(.*?)<\/main>/);
  if (mainMatch) {
    console.log('MAIN HTML length:', mainMatch[1].length);
    console.log('MAIN HTML (first 500 chars):', mainMatch[1].slice(0, 500));
  } else {
    console.log('No <main> found!');
  }
  await browser.close();
})();
