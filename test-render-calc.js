import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });
  
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });
  
  await page.goto('http://localhost:3000/#/calculator', { waitUntil: 'domcontentloaded' });
  // wait 2 seconds
  await new Promise(r => setTimeout(r, 2000));
  const content = await page.content();
  console.log('Has calculator rendered:', content.includes('Calculator'));
  await browser.close();
})();
