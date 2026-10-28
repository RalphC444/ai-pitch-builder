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
    if (msg.method === 'Runtime.exceptionThrown') errors.push('EXC ' + msg.params.exceptionDetails.exception?.description?.split('\n')[0]); });
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true })).result?.result?.value;
  const shot = async (n) => {
    await ev(`document.querySelectorAll('.MuiSnackbarContent-root').forEach(t => t.closest('[class]')?.parentElement && (t.style.display = 'none'))`);
    const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 82 }); fs.writeFileSync(`${outDir}/${n}.jpg`, Buffer.from(s.result.data, 'base64')); console.log('shot', n);
  };
  const center = async (sel) => { await ev(`document.querySelector(${JSON.stringify(sel)})?.scrollIntoView({block: 'center'})`); await sleep(250); return ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return [r.x + r.width/2, r.y + r.height/2]; })()`); };
  const realClick = async (x, y) => { for (const t of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type: t, x, y, button: 'left', clickCount: 1 }); };
  const clickText = (t, scope = 'document') => ev(`(() => { const b = [...${scope}.querySelectorAll('button')].find(b => b.textContent.trim().startsWith(${JSON.stringify(t)})); if (!b) return 'missing'; b.click(); return 'ok'; })()`);
  const hideFab = () => ev(`document.querySelectorAll('[aria-label="Experience options"]').forEach(b => b.closest('.fixed') && (b.closest('.fixed').style.visibility = 'hidden'))`);
  const type = async (t) => { await send('Input.insertText', { text: t }); await sleep(120); };
  const key = async (k, code, vk, text) => { await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk, text }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk }); await sleep(150); };

  await send('Page.navigate', { url: 'about:blank' }); await sleep(300);
  await send('Runtime.enable'); await send('Page.bringToFront');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false });
  await send('Page.navigate', { url: 'http://localhost:3000' }); await sleep(2000);
  await hideFab();
  await shot('01-express-list');

  // Detail card
  const row = await center('table[aria-label="Express List advisors"] tbody tr:nth-child(4) td:nth-child(4)');
  await realClick(row[0], row[1]); await sleep(600);
  await shot('02-express-detail');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await sleep(300);

  // Pitch Builder
  await ev(`document.querySelector('button[aria-label="Send selected advisors to client"]').click()`); await sleep(1500);
  await hideFab(); await ev(`window.scrollTo(0,0)`); await sleep(300);
  await shot('03-pitch-builder');

  // Edit mode with confidence underlines
  await ev(`document.querySelector('button[aria-label="Edit Dr. Péter Schneider"]').scrollIntoView({block: 'start'})`); await sleep(300);
  await ev(`window.scrollBy(0, -120)`); await sleep(200);
  await ev(`document.querySelector('button[aria-label="Edit Dr. Péter Schneider"]').click()`); await sleep(1200);
  await shot('04-edit-scoring');

  // Companion card with sources
  const st = await center('.pitch-statement[data-level="medium"], .pitch-statement[data-level="low"]');
  await ev(`window.scrollBy(0, 120)`); await sleep(200);
  const st2 = await ev(`(() => { const r = document.querySelector('.pitch-statement[data-level="medium"], .pitch-statement[data-level="low"]').getBoundingClientRect(); return [r.left + 20, r.top + r.height/2]; })()`);
  await realClick(st2[0], st2[1]); await sleep(900);
  await ev(`[...document.querySelectorAll('[role="dialog"] .MuiChip-clickable')][0]?.click()`); await sleep(400);
  await shot('05-companion');

  // Apply -> applied bar
  await ev(`[...document.querySelectorAll('[role="dialog"] button')].find(b => b.textContent.trim() === 'Apply').click()`); await sleep(800);
  await shot('06-applied');
  await ev(`document.querySelector('[role="status"] button[aria-label="Close"]')?.click()`); await sleep(300);

  // Generate from profile data
  console.log('profile data:', await clickText('Show Profile Data')); await sleep(900);
  const boxes = await ev(`(() => { const d = document.querySelector('[aria-label^="Profile details for"]') || document; const cbs = [...d.querySelectorAll('input[type="checkbox"]')]; cbs.slice(1, 3).forEach(c => c.click()); return cbs.length; })()`);
  console.log('checkboxes:', boxes); await sleep(600);
  await ev(`(() => { const t = document.querySelector('textarea[aria-label="Optional prompt"]'); if (!t) return; const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set; set.call(t, 'Emphasize regional pen-format differences'); t.dispatchEvent(new Event('input', { bubbles: true })); })()`); await sleep(300);
  await shot('07-profile-generate');
  await ev(`document.querySelector('button[aria-label="Close drawer"]')?.click()`); await sleep(400);
  await ev(`document.querySelector('button[aria-label^="Discard changes for"]')?.click()`); await sleep(500);

  // Edit Prompt drawer
  await ev(`window.scrollTo(0,0)`); await sleep(200);
  await ev(`document.querySelector('button[aria-label="Edit prompt"]').click()`); await sleep(800);
  await shot('08-edit-prompt');
  await ev(`document.querySelector('button[aria-label="Close prompt editor"]').click()`); await sleep(500);

  // Email preview
  await ev(`document.querySelector('#nav-step-actions button').click()`); await sleep(1200);
  await hideFab(); await ev(`window.scrollTo(0,0)`); await sleep(300);
  await shot('09-email-preview');
  await ev(`window.scrollTo(0, document.body.scrollHeight)`); await sleep(400);
  await shot('10-email-footer');

  // Editor with content blocks
  await ev(`document.querySelector('#nav-step-actions button').click()`); await sleep(900);
  await ev(`document.querySelector('button.self-stretch').click()`); await sleep(300);
  await ev(`[...document.querySelectorAll('[role="menuitem"]')].find(i => i.innerText.startsWith('Heading')).click()`); await sleep(300);
  await type('Scheduling next steps');
  await key('Enter', 'Enter', 13, '\r');
  await type('We can hold calls with any of these advisors as early as next week.');
  await ev(`document.querySelector('button.self-stretch').click()`); await sleep(300);
  await ev(`[...document.querySelectorAll('[role="menuitem"]')].find(i => i.innerText.startsWith('Callout')).click()`); await sleep(300);
  await type('Unvetted advisors have not yet answered screeners for this project.');
  await ev(`document.querySelector('button.self-stretch').click()`); await sleep(300);
  await shot('11-block-menu');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await sleep(300);
  const rowC = await ev(`(() => { const rows = document.querySelectorAll('.content-block-row'); rows[1].scrollIntoView({block: 'center'}); return true; })()`); await sleep(300);
  const rc = await ev(`(() => { const r = document.querySelectorAll('.content-block-row')[1].getBoundingClientRect(); return [r.x + 300, r.y + r.height/2]; })()`);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: rc[0], y: rc[1] }); await sleep(400);
  await shot('12-content-blocks');

  // Send -> sent, failed
  await ev(`[...document.querySelectorAll('#nav-step-actions button')].pop().click()`); await sleep(900);
  await hideFab();
  await shot('13-sent');
  await ev(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Failed').click()`); await sleep(300);
  await shot('14-failed');
  console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
  ws.close();
})().catch(e => { console.error(e); process.exit(1); });
