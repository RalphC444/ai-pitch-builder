const WebSocket = require(process.argv[2]);
const http = require('http'); const fs = require('fs');
const outDir = process.argv[3];
const getJSON = (u) => new Promise((res, rej) => http.get(u, r => { let d=''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d))); }).on('error', rej));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const page = (await getJSON('http://127.0.0.1:9333/json')).find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise(r => ws.on('open', r));
  let id = 0; const pending = {}; const errors = [];
  ws.on('message', m => { const msg = JSON.parse(m); if (msg.id && pending[msg.id]) { pending[msg.id](msg); delete pending[msg.id]; }
    if (msg.method === 'Runtime.exceptionThrown') errors.push('EXC ' + msg.params.exceptionDetails.exception?.description?.split('\n')[0]);
    if (msg.method === 'Runtime.consoleAPICalled' && ['error','warning'].includes(msg.params.type)) errors.push(msg.params.type + ' ' + msg.params.args.map(a => a.value || a.description || '').join(' ').slice(0, 300)); });
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true })).result?.result?.value;
  const shot = async (n) => { const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${outDir}/${n}.png`, Buffer.from(s.result.data, 'base64')); };
  const key = async (k, code, vk, text) => { await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk, text }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk }); await sleep(150); };
  const type = async (t) => { await send('Input.insertText', { text: t }); await sleep(150); };
  const center = (sel) => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; e.scrollIntoView({block: 'center'}); const r = e.getBoundingClientRect(); return [r.x + r.width/2, r.y + r.height/2]; })()`);
  const click = async (sel) => { const c = await center(sel); await sleep(200); const c2 = await center(sel); if (!c2) return 'missing ' + sel; for (const t of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type: t, x: c2[0], y: c2[1], button: 'left', clickCount: 1 }); await sleep(400); return 'ok'; };
  const clickMenu = (label) => ev(`(() => { const m = [...document.querySelectorAll('[role="menuitem"]')].find(i => i.innerText.startsWith(${JSON.stringify(label)})); if (!m) return 'missing'; m.click(); return 'ok'; })()`);
  await send('Page.navigate', { url: 'about:blank' }); await sleep(300);
  await send('Runtime.enable');
  await send('Page.bringToFront');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://localhost:3000' }); await sleep(1800);
  await ev(`document.querySelector('button[aria-label="Send selected advisors to client"]').click()`); await sleep(1300);

  // Tooltip carry-over: hover Edit, click it, check no "Clear pitch" tooltip is open
  const e = await center('button[aria-label="Edit Jennifer Walsh"]'); await sleep(200);
  const e2 = await center('button[aria-label="Edit Jennifer Walsh"]');
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: e2[0], y: e2[1] }); await sleep(900);
  console.log('hover tooltip:', await ev(`[...document.querySelectorAll('[role="tooltip"]')].map(t => t.innerText).join('|')`));
  for (const t of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type: t, x: e2[0], y: e2[1], button: 'left', clickCount: 1 });
  await sleep(1200);
  console.log('tooltip after entering edit:', JSON.stringify(await ev(`[...document.querySelectorAll('[role="tooltip"]')].map(t => t.innerText).join('|')`)));
  await ev(`document.querySelector('button[aria-label^="Discard changes for"]').click()`); await sleep(500);

  // Email editor: blocks
  await ev(`document.querySelector('#nav-step-actions button').click()`); await sleep(1000);
  await ev(`document.querySelector('#nav-step-actions button').click()`); await sleep(800);
  console.log('closing title:', await ev(`[...document.querySelectorAll('h2')].map(h => h.innerText).filter(t => /Closing|Content Block/.test(t)).join(' | ')`));
  console.log('add row:', await click('button.self-stretch'));
  console.log('pick Text:', await clickMenu('Text')); await sleep(300);
  await type('Next steps for scheduling');
  await key('Enter', 'Enter', 13, '\r');
  await key('/', 'Slash', 191, '/');
  console.log('slash menu open:', await ev(`!!document.querySelector('[role="menu"]')`));
  console.log('pick Callout:', await clickMenu('Callout')); await sleep(300);
  await type('Availability is limited the week of Nov 10.');
  const blocksNow = await ev(`[...document.querySelectorAll('.content-block-row')].map(r => r.querySelector('[aria-label$="block"], [role="separator"]')?.getAttribute('aria-label') + ': ' + r.innerText.trim()).join(' || ')`);
  console.log('blocks:', blocksNow);
  console.log('add row 2:', await click('button.self-stretch'));
  console.log('pick Divider:', await clickMenu('Divider')); await sleep(300);
  console.log('block count:', await ev(`document.querySelectorAll('.content-block-row').length`));
  await ev(`document.querySelectorAll('.content-block-row')[0].scrollIntoView({block: 'center'})`);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 700, y: 450 }); await sleep(300);
  const r = await ev(`(() => { const r = document.querySelectorAll('.content-block-row')[1].getBoundingClientRect(); return [r.x + 200, r.y + r.height/2]; })()`);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r[0], y: r[1] }); await sleep(400);
  await shot('b1-edit-blocks');

  // Preview shows blocks
  await ev(`document.querySelector('#nav-step-actions button').click()`); await sleep(800);
  console.log('preview has blocks:', await ev(`(() => { const t = document.querySelector('[aria-label="Email preview"]').innerText; return t.includes('Next steps for scheduling') && t.includes('Availability is limited'); })()`), '| hr:', await ev(`!!document.querySelector('[aria-label="Email preview"] hr')`));
  await ev(`window.scrollTo(0, 1200)`); await sleep(300);
  console.log('copy btn top after scroll:', await ev(`Math.round(document.querySelector('button[aria-label="Copy email"]').getBoundingClientRect().top)`));
  await ev(`document.querySelector('[aria-label="Email preview"] hr').scrollIntoView({block: 'center'})`); await sleep(300);
  await shot('b2-preview-blocks');
  await ev(`window.scrollTo(0, document.body.scrollHeight)`); await sleep(300);
  const band = await ev(`(() => { const s = document.querySelector('[aria-label="Email preview"]').getBoundingClientRect(); const b = [...document.querySelectorAll('[aria-label="Email preview"] div')].find(d => getComputedStyle(d).backgroundColor === 'rgb(255, 205, 0)').getBoundingClientRect(); return { cardW: Math.round(s.width), bandW: Math.round(b.width) }; })()`);
  console.log('footer band:', JSON.stringify(band));
  await shot('b3-preview-footer');
  await ev(`window.scrollTo(0, 0)`); await sleep(300);
  await shot('b4-preview-top');
  console.log('ERRORS:', errors.length ? '\n  ' + [...new Set(errors)].join('\n  ') : 'none');
  ws.close();
})().catch(e => { console.error(e); process.exit(1); });
