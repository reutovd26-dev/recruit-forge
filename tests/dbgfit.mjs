import { chromium } from 'playwright';
import path from 'path';
const file = 'file://' + path.resolve('recruit-forge.html');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
const errs=[]; page.on('pageerror',e=>errs.push(e.message)); page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push(m.type()+': '+m.text());});
await page.goto(file); await page.waitForTimeout(1200);
try { await page.click('#ob-skip', { timeout: 1200 }); } catch {}
const info = await page.evaluate(() => {
  const l = state.model.layouts.find(l=>l.name==='Подробный');
  const title = l.nodes.find(n=>n.kind==='text');
  // measure rendered
  setModule('layout');
  return { titleFrame: title.frame, props: title.props, fitted: typeof fitAllSpaces };
});
await page.waitForTimeout(600);
const rendered = await page.evaluate(() => {
  const l = state.model.layouts.find(l=>l.name==='Подробный');
  const title = l.nodes.find(n=>n.kind==='text');
  const el = document.querySelector(`#canvas .node[data-id="${title.id}"]`) || document.querySelector(`.node[data-id="${title.id}"]`);
  const body = el?.querySelector('.n-body');
  return { frameH: title.frame.h, elH: el?.offsetHeight, bodyScroll: body?.scrollHeight, bodyClient: body?.clientHeight, bodyOverflow: body?getComputedStyle(body).overflow:null, elOverflow: el?getComputedStyle(el).overflow:null };
});
console.log('title:', JSON.stringify(info));
console.log('rendered:', JSON.stringify(rendered));
console.log('errs:', errs.slice(0,8));
await browser.close();
