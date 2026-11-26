import { chromium } from 'playwright';
import path from 'path';
const file = 'file://' + path.resolve('recruit-forge.html');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
await page.goto(file); await page.waitForTimeout(1000);
try { await page.click('#ob-skip', { timeout: 1500 }); } catch {}
for (const mod of ['schema','base','layout','char']) {
  await page.evaluate(m => setModule(m), mod); await page.waitForTimeout(500);
  const bad = await page.evaluate(() => buttonContract());
  console.log(`[${mod}] buttons without handlers (${bad.length}):`, bad.slice(0,20));
}
// doc-mode row buttons: does +/−/×/✎ actually work?
await page.evaluate(() => { state.ui.activeRoster = 1; state.ui.charDoc = true; refresh(); });
await page.waitForTimeout(500);
const before = await page.evaluate(() => JSON.stringify(roster().assign));
const acts = await page.evaluate(() => {
  const out = [];
  const row = document.querySelector('#char-view tr.ds-row');
  if (!row) return ['NO ds-row found'];
  for (const act of ['inc','dec','edit']) {
    const b = row.querySelector(`[data-act="${act}"]`);
    if (!b) { out.push(act + ': MISSING'); continue; }
    b.click();
    out.push(act + ': clicked');
  }
  return out;
});
await page.waitForTimeout(400);
const after = await page.evaluate(() => JSON.stringify(roster().assign));
console.log('row acts:', acts, '| state changed:', before !== after);
const modalOpen = await page.evaluate(() => document.querySelector('#modal-backdrop')?.classList.contains('open'));
console.log('edit modal open:', modalOpen);
// fill button in doc mode
await page.evaluate(() => { try { closeModal(); } catch {} });
const fillRes = await page.evaluate(() => { const b = document.querySelector('#char-view .ds-add'); if (!b) return 'MISSING'; b.click(); return 'clicked'; });
await page.waitForTimeout(400);
const fillModal = await page.evaluate(() => document.querySelector('#modal-backdrop')?.classList.contains('open'));
console.log('ds-add fill:', fillRes, '| picker modal open:', fillModal);
console.log('ERRORS:', errors.length, errors.slice(0,10));
await browser.close();
