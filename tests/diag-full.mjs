import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const file = 'file://' + path.resolve(process.argv[2] || 'recruit-forge.html');
const outDir = process.argv[3] || 'shots-diag';
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR: ' + (e.stack || e.message).split('\n').slice(0, 3).join(' | ')));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
await page.goto(file);
await page.waitForTimeout(1000);
try { await page.click('#ob-skip', { timeout: 1500 }); } catch {}
await page.waitForTimeout(300);

const shot = (name) => page.screenshot({ path: `${outDir}/${name}.png` });
const mark = (label) => { const n = errors.length; return () => { if (errors.length > n) console.log(`### ${label}:`, errors.slice(n).map(e => e.slice(0, 250))); }; };

// ---- CHAR module: big roster, doc mode ----
await page.evaluate(() => setModule('char'));
await page.waitForTimeout(500);
let end = mark('char: switch roster Молот');
await page.evaluate(() => { state.ui.activeRoster = 1; refresh(); });
await page.waitForTimeout(600); end();
await shot('char-01-molot-doc');

// doc mode off (Макет)
end = mark('char: docmode toggle');
await page.evaluate(() => { const b = document.querySelector('#tb-docmode'); if (b) b.click(); });
await page.waitForTimeout(600); end();
await shot('char-02-molot-layout');

// back to doc, big bestiary roster
await page.evaluate(() => { const b = document.querySelector('#tb-docmode'); if (b) b.click(); });
await page.waitForTimeout(300);
end = mark('char: switch roster Бестиарий');
await page.evaluate(() => { const i = state.model.rosters.findIndex(r => /Бестиарий/.test(r.name)); if (i >= 0) { state.ui.activeRoster = i; refresh(); } });
await page.waitForTimeout(700); end();
await shot('char-03-bestiary-doc');

// scroll down the sheet
await page.evaluate(() => { const cv = document.querySelector('#char-view'); cv.scrollTop = 900; });
await page.waitForTimeout(300);
await shot('char-04-bestiary-doc-scroll');

// ---- inspector fields ----
end = mark('inspector: name/role/points edits');
await page.evaluate(() => {
  const set = (id, v) => { const el = document.querySelector(id); if (!el) { console.log('missing ' + id); return; } el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
  set('#r-name', 'Тест-отряд'); set('#r-role', 'Проверка'); set('#r-points', '250'); set('#r-folder', 'Папка'); set('#r-notes', 'Заметка');
});
await page.waitForTimeout(500); end();
await shot('char-05-inspector-edited');

// ---- toolbar buttons in char ----
for (const label of ['Компактно', 'Правила', 'Экспорт', 'Данные', 'Наполнить']) {
  end = mark('char toolbar: ' + label);
  const found = await page.evaluate(txt => {
    const els = [...document.querySelectorAll('#char-toolbar button, .toolbar button, button')].filter(e => (e.offsetWidth || e.offsetHeight) && (e.textContent || '').includes(txt));
    if (!els.length) return false; els[0].click(); return true;
  }, label);
  await page.waitForTimeout(450); end();
  if (!found) console.log('char toolbar NOT FOUND: ' + label);
  await shot('char-btn-' + label.replace(/\s/g, '_'));
  await page.evaluate(() => { try { closeModal(); } catch {} });
  await page.waitForTimeout(200);
}

// ---- validation drawer ----
end = mark('validation badge click');
await page.evaluate(() => document.querySelector('#err-badge')?.click());
await page.waitForTimeout(400); end();
const valErrs = await page.evaluate(() => [...document.querySelectorAll('.val-item')].map(e => e.textContent.trim().slice(0, 160)));
console.log('VALIDATION ITEMS (' + valErrs.length + '):'); valErrs.forEach(v => console.log('  - ' + v));
await shot('char-06-validation');
await page.evaluate(() => { try { closeModal(); } catch {} document.querySelector('#val-drawer')?.classList.remove('open'); });

// ---- LAYOUT module: squad sheet ----
await page.evaluate(() => setModule('layout'));
await page.waitForTimeout(500);
end = mark('layout: switch to Лист отряда');
await page.evaluate(() => { const i = state.model.layouts.findIndex(l => /Лист отряда$/.test(l.name)); if (i >= 0) { state.ui.activeLayout = i; refresh(); } });
await page.waitForTimeout(700); end();
await shot('layout-01-squad');

// fit zoom
end = mark('layout: fit');
await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(e => /1:1|Вписать|fit/i.test(e.textContent || '') || e.id === 'tb-fit'); if (b) b.click(); });
await page.waitForTimeout(400); end();
await shot('layout-02-squad-fit');

// ---- SCHEMA module ----
await page.evaluate(() => setModule('schema'));
await page.waitForTimeout(600);
await shot('schema-01');

// ---- BASE module ----
await page.evaluate(() => setModule('base'));
await page.waitForTimeout(600);
await shot('base-01');

console.log('TOTAL ERRORS:', errors.length);
errors.slice(0, 40).forEach(e => console.log('  ' + e.slice(0, 300)));
await browser.close();
