import { chromium } from 'playwright';
import path from 'path';
const file = 'file://' + path.resolve('recruit-forge.html');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
await page.goto(file); await page.waitForTimeout(1000);
try { await page.click('#ob-skip', { timeout: 1500 }); } catch {}
await page.evaluate(() => { setModule('char'); state.ui.activeRoster = 1; state.ui.charDoc = true; refresh(); });
await page.waitForTimeout(500);
// fresh query each time
for (const act of ['inc','dec','edit','rm']) {
  const r = await page.evaluate(act => {
    const row = document.querySelector('#char-view tr.ds-row');
    const b = row?.querySelector(`[data-act="${act}"]`);
    if (!b) return act + ': MISSING';
    const before = JSON.stringify(roster().assign);
    b.click();
    return act + ': stateChanged=' + (before !== JSON.stringify(roster().assign));
  }, act);
  await page.waitForTimeout(300);
  const modal = await page.evaluate(() => document.querySelector('#modal-backdrop')?.classList.contains('open') ? (document.querySelector('#modal h3')?.textContent || 'modal') : null);
  console.log(r, '| modal:', modal);
  if (modal) await page.evaluate(() => { try { closeModal(); } catch {} });
  await page.waitForTimeout(200);
}
// inspector fields with correct ids
const fieldRes = await page.evaluate(() => {
  const out = [];
  const set = (id, v) => { const el = document.querySelector('#' + id); if (!el) return out.push(id + ': MISSING'); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); out.push(id + ': ok'); };
  set('r-name', 'Проверка-имя'); set('r-role', 'Проверка-роль'); set('r-limit', '250'); set('r-folder', 'Проверка-папка');
  return out;
});
await page.waitForTimeout(400);
const saved = await page.evaluate(() => { const r = roster(); return { name: r.character.name, role: r.character.role, limit: r.limits.points, folder: r.folder }; });
console.log('inspector:', fieldRes, '=> saved:', JSON.stringify(saved));
// zoom buttons
for (const id of ['tb-char-plus','tb-char-minus']) {
  const z = await page.evaluate(id => { const b = document.querySelector('#' + id); if (!b) return id + ': MISSING'; b.click(); return id + ': zoom=' + state.ui.charZoom; }, id);
  console.log(z);
}
console.log('ERRORS:', errors.length, errors.slice(0,5));
await browser.close();
