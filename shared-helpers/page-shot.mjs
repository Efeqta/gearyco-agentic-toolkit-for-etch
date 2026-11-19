// Headless page capture at an arbitrary resolution, via CDP. The browser pane
// downscales every screenshot to its own width, so any asset wider than the
// pane — a full-bleed map placeholder, a 2x hero — has to be grabbed here.
//
//   node shared-helpers/page-shot.mjs <page-url> <out.png> <cssW> <cssH> [dsf] [waitMs]
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [page, out, W, H, DSF = '2', WAIT = '14000'] = process.argv.slice(2);
const PORT = 9333;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const profile = mkdtempSync(join(tmpdir(), 'mapshot-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio',
  '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let ws, id = 0;
const pending = new Map();
const send = (method, params = {}, sessionId) =>
  new Promise((res, rej) => {
    const m = ++id;
    pending.set(m, { res, rej });
    ws.send(JSON.stringify({ id: m, method, params, ...(sessionId && { sessionId }) }));
  });

try {
  let info;
  for (let i = 0; i < 60; i++) {
    try { info = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); break; }
    catch { await sleep(250); }
  }
  ws = new WebSocket(info.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    const p = pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id);
    msg.error ? p.rej(new Error(msg.error.message)) : p.res(msg.result);
  };

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });

  await send('Emulation.setDeviceMetricsOverride', {
    width: +W, height: +H, deviceScaleFactor: +DSF, mobile: false,
  }, sessionId);
  await send('Page.enable', {}, sessionId);
  await send('Page.navigate', { url: page }, sessionId);
  await sleep(+WAIT);

  const { data } = await send('Page.captureScreenshot', { format: 'png', fromSurface: true }, sessionId);
  writeFileSync(out, Buffer.from(data, 'base64'));
  console.log('wrote', out);
} finally {
  try { ws?.close(); } catch {}
  await fetch(`http://127.0.0.1:${PORT}/json/close`).catch(() => {});
  chrome.kill();
}
