import { chromium } from 'playwright';
import path from 'path';
const file = 'file://' + path.resolve('recruit-forge.html');
const browser = await chromium.launch();
for (const [w,h] of [[1366,768],[1280,800],[1600,950]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(file); await page.waitForTimeout(900);
  try { await page.click('#ob-skip', { timeout: 1200 }); } catch {}
  await page.evaluate(() => setModule('char')); await page.waitForTimeout(500);
  await page.screenshot({ path: `shots-diag/width-${w}.png` });
  const info = await page.evaluate(() => {
    const pal = document.querySelector('#palette');
    const item = document.querySelector('#palette .pal-item');
    const label = item?.querySelector('span:last-child');
    return { palW: pal?.getBoundingClientRect().width, labelDisplay: label?getComputedStyle(label).display:null, labelText: label?.textContent?.slice(0,20) };
  });
  console.log(w, JSON.stringify(info));
  await page.close();
}
await browser.close();
