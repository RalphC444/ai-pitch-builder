const WebSocket = require(process.argv[2]);
const http = require('http'); const fs = require('fs');
const [outDir, W, H] = [process.argv[3], +process.argv[4], +process.argv[5]];
const getJSON = (u) => new Promise((res, rej) => http.get(u, r => { let d=''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d))); }).on('error', rej));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const page = (await getJSON('http://127.0.0.1:9333/json')).find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.on('open', r));
  let id = 0; const pending = {};
  ws.on('message', m => { const msg = JSON.parse(m); if (msg.id && pending[msg.id]) { pending[msg.id](msg); delete pending[msg.id]; }
    if (msg.method === 'Runtime.exceptionThrown') console.log('EXCEPTION:', msg.params.exceptionDetails.exception?.description?.split('\n')[0]);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error' && !global.warned) { global.warned = true; console.log('CONSOLE.ERROR:', msg.params.args.map(a => a.value || a.description || '').join(' | ').slice(0, 1200)); } });
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true })).result?.result?.value;
  const shot = async (n) => { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${outDir}/${W}-${n}.png`, Buffer.from(r.result.data, 'base64')); };
  const clickText = (t, scope = 'document') => ev(`(() => { const b = [...${scope}.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(t)}); if (!b) return 'missing ' + ${JSON.stringify(t)}; b.click(); return 'ok'; })()`);
  const typeInto = (selector, text) => ev(`(() => { const t = document.querySelector(${JSON.stringify(selector)}); const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set; set.call(t, ${JSON.stringify(text)}); t.dispatchEvent(new Event('input', { bubbles: true })); return 'ok'; })()`);
  const rows = () => ev(`document.querySelector('main span[style*="font-weight: 600"]')?.innerText`);
  await send('Page.navigate', { url: 'about:blank' }); await sleep(300);
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: W < 640 });
  await send('Page.navigate', { url: 'http://localhost:3000' }); await sleep(1500);
  console.log('rows', await rows(), '| overflow', await ev(`document.documentElement.scrollWidth + '/' + innerWidth`), '| chat open', await ev(`!!document.querySelector('aside[aria-label="Agentic PM"]')`));
  await shot('1-list');
  if (W < 640) await ev(`document.querySelector('button[aria-label="Open Agentic PM"]')?.click()`), await sleep(300);
  await typeInto('textarea[aria-label="Message Agentic PM"]', 'Find advisors who are formers with Novo Nordisk or Eli Lilly, in Angle 1, and they are all in the US.');
  await ev(`document.querySelector('aside[aria-label="Agentic PM"] button[aria-label="Send"]').click()`); await sleep(900);
  console.log('proposal', await ev(`[...document.querySelectorAll('aside[aria-label="Agentic PM"] p')].map(p => p.innerText).slice(-1)[0]`));
  await shot('2-proposal');
  console.log('apply', await clickText('Apply Filter')); await sleep(400);
  console.log('rows after apply', await rows());
  if (W < 640) { await ev(`document.querySelector('button[aria-label="Minimize Agentic PM"]').click()`); await sleep(300); }
  await shot('3-applied');
  await typeInto('textarea[aria-label="Message Agentic PM"]', 'remove the country filter');
  // open detail on first visible row
  await ev(`document.querySelector('tr.express-row td:nth-child(3)').click()`); await sleep(400);
  console.log('detail', await ev(`document.querySelector('aside[aria-label^="Profile data for"]')?.getAttribute('aria-label')`), '| chat hidden', await ev(`!document.querySelector('aside[aria-label="Agentic PM"]')`));
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 }); await sleep(300);
  console.log('after ↓', await ev(`document.querySelector('aside[aria-label^="Profile data for"]')?.getAttribute('aria-label')`));
  await shot('4-detail');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await sleep(300);
  console.log('closed detail', await ev(`!document.querySelector('aside[aria-label^="Profile data for"]')`), '| chat back', await ev(`!!document.querySelector('aside[aria-label="Agentic PM"]')`));
  // Clear filter and tick Nadia, then send
  console.log('clear', await clickText('Clear Filter'));
  await ev(`document.querySelector('button[aria-label="Select Nadia Okafor"]').click()`); await sleep(200);
  console.log('send', await ev(`document.querySelector('button[aria-label="Send selected advisors to Pitch Curation"]').click(), 'ok'`)); await sleep(1200);
  console.log('curate heading', await ev(`document.querySelector('main h2')?.innerText`), '| has Nadia', await ev(`!!document.querySelector('article[aria-label="Pitch for Nadia Okafor"]')`));
  console.log('nadia pitch', await ev(`document.querySelector('article[aria-label="Pitch for Nadia Okafor"] .pitch-content')?.innerText.slice(0, 200)`));
  await ev(`document.querySelector('article[aria-label="Pitch for Nadia Okafor"]').scrollIntoView({block:'center'})`); await sleep(300);
  await shot('5-curate');
  // Composer recipients
  console.log('next', await clickText('Next: Review & Send')); await sleep(800);
  console.log('recipient fields visible', await ev(`!!document.getElementById('email-to')`), '| thread select', await ev(`!!document.getElementById('email-thread')`));
  await ev(`(() => { const s = document.getElementById('email-thread'); const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set; set.call(s, '__new-thread__'); s.dispatchEvent(new Event('change', { bubbles: true })); })()`); await sleep(300);
  console.log('new thread input', await ev(`document.getElementById('email-new-thread')?.value`));
  await shot('6-composer');
  ws.close();
})().catch(e => { console.error(e); process.exit(1); });
