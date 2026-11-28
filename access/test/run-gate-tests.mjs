// End-to-end test of the Vercel gate, run locally with Node.
// MOCKED: (1) Google's signing keys - ID tokens are signed by a local RSA key served as a JWKS,
//         but the server's real jose verification (issuer, audience, expiry, email_verified) runs;
//         (2) the Apps Script web app - the real OracleLabAccess.gs runs in a Node shim with an in-memory sheet.
// Real: every api/*.js handler, cookies/sessions, vercel.json rewrites, static gate files, the built private/lab bundle.
import http from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { makeGas } from './gas-shim.mjs';

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const PORT = Number(process.env.GATE_TEST_PORT || 5000 + Math.floor(Math.random() * 3000)); const BASE = `http://127.0.0.1:${PORT}`;
const CLIENT_ID = 'test-client.apps.googleusercontent.com';
const SECRET = 'test-secret-' + Math.random().toString(36).slice(2);
Object.assign(process.env, {
  GOOGLE_CLIENT_ID: CLIENT_ID, ADMIN_EMAILS: 'cadmthakkar@gmail.com', SESSION_SECRET: 'x'.repeat(40) + 'session',
  APPS_SCRIPT_URL: `${BASE}/mock-script`, APPS_SCRIPT_SECRET: SECRET, SHEET_URL: 'https://docs.google.com/spreadsheets/d/TEST/edit',
  GOOGLE_JWKS_URL: `${BASE}/mock-jwks`, COOKIE_INSECURE: '1',
});
process.chdir(ROOT);

const gas = makeGas(SECRET);
const { publicKey, privateKey } = await generateKeyPair('RS256');
const jwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' };
const other = await generateKeyPair('RS256');
const vercel = JSON.parse(await readFile('vercel.json', 'utf8'));

async function idToken(email, name, opt = {}) {
  return new SignJWT({ email, name, email_verified: opt.verified ?? true })
    .setProtectedHeader({ alg: 'RS256', kid: 'k1' }).setIssuer('https://accounts.google.com').setAudience(opt.aud || CLIENT_ID)
    .setSubject(email).setIssuedAt().setExpirationTime(opt.exp || '1h').sign(opt.key || privateKey);
}

function rewrite(pathname, search) {
  if (pathname === '/lab') return { redirect: '/lab/' };
  if (pathname === '/lab/') return { api: '/api/lab', search: '?p=' };
  if (pathname.startsWith('/lab/')) return { api: '/api/lab', search: '?p=' + encodeURIComponent(pathname.slice(5)) };
  if (pathname.startsWith('/api/')) return { api: pathname, search };
  return { static: pathname };
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, BASE);
  const chunks = []; for await (const c of req) chunks.push(c); const raw = Buffer.concat(chunks).toString();
  if (u.pathname === '/mock-jwks') { res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify({ keys: [jwk] })); }
  if (u.pathname === '/mock-script') { res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify(gas.doPost(raw))); }
  const r = rewrite(u.pathname, u.search);
  if (r.redirect) { res.writeHead(307, { location: r.redirect }); return res.end(); }
  if (r.api) {
    const name = r.api.replace(/^\/api\//, '');
    if (name.split('/').some((p) => p.startsWith('_'))) { res.writeHead(404); return res.end(); }
    let mod; try { mod = await import(path.join(ROOT, 'api', name + '.js')); } catch { res.writeHead(404); return res.end('no fn'); }
    const fn = mod[req.method]; if (!fn) { res.writeHead(405); return res.end(); }
    const request = new Request(BASE + r.api + (r.search || ''), { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : raw });
    const out = await fn(request);
    const headers = {}; out.headers.forEach((v, k) => { if (k !== 'set-cookie') headers[k] = v; });
    const sc = out.headers.getSetCookie(); if (sc.length) headers['set-cookie'] = sc;
    res.writeHead(out.status, headers); return res.end(Buffer.from(await out.arrayBuffer()));
  }
  const file = path.normalize(path.join(ROOT, vercel.outputDirectory, r.static === '/' ? 'index.html' : r.static));
  try { const d = await readFile(file); res.writeHead(200); return res.end(d); } catch { res.writeHead(404); return res.end('404'); }
});
await new Promise((ok) => server.listen(PORT, '127.0.0.1', ok));

// ---- tiny client with a cookie jar per user ----
class Client {
  constructor() { this.jar = {}; }
  async req(p, opt = {}) {
    const headers = { ...(opt.headers || {}) };
    const ck = Object.entries(this.jar).map(([k, v]) => `${k}=${v}`).join('; '); if (ck) headers.cookie = ck;
    if (opt.json) { headers['content-type'] = 'application/json'; }
    const r = await fetch(BASE + p, { method: opt.method || (opt.json ? 'POST' : 'GET'), headers, body: opt.json ? JSON.stringify(opt.json) : undefined, redirect: 'manual' });
    for (const c of r.headers.getSetCookie()) { const [kv, ...attrs] = c.split(';'); const [k, v] = kv.split('='); if (/Max-Age=0/.test(attrs.join(';')) || !v) delete this.jar[k]; else this.jar[k] = v; }
    const text = await r.text(); let body; try { body = JSON.parse(text); } catch { body = text; }
    return { status: r.status, location: r.headers.get('location'), type: r.headers.get('content-type'), body };
  }
  signIn(email, name, opt) { return idToken(email, name, opt).then((t) => this.req('/api/auth/google', { json: { credential: t } })); }
}

let pass = 0, fail = 0; const results = [];
function check(name, cond, detail = '') { (cond ? pass++ : fail++); results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  -> ' + detail}`); }
const tab = (n) => gas.sheets[n].rows;
const plus = (days) => { const d = new Date(Date.now() + days * 86400000 + 5.5 * 3600000); return d.toISOString().slice(0, 10); };

const assets = (await readdir('private/lab/assets'));
const js = assets.find((f) => f.endsWith('.js')); const css = assets.find((f) => f.endsWith('.css'));

// 1. Public surface / unauthenticated
const anon = new Client();
let r = await anon.req('/');
check('gate page is public', r.status === 200 && /Sign in/.test(r.body) && !r.body.includes('/lab/assets'));
r = await anon.req('/lab/'); check('/lab/ without auth redirects to /', r.status === 302 && r.location === '/', JSON.stringify(r));
r = await anon.req(`/lab/assets/${js}`); check('lab JS asset blocked without auth (401)', r.status === 401, r.status);
r = await anon.req(`/lab/assets/${css}`); check('lab CSS asset blocked without auth (401)', r.status === 401, r.status);
r = await anon.req(`/api/lab?p=assets/${js}`); check('direct /api/lab asset blocked (401)', r.status === 401);
r = await anon.req(`/assets/${js}`); check('bundle not in public output (/assets 404)', r.status === 404);
r = await anon.req('/private/lab/index.html'); check('private/ not public (404)', r.status === 404);
r = await anon.req('/lab/sample-files/Google_Sheet_Logger_Apps_Script.gs'); check('lab sample files blocked', r.status === 401);
r = await anon.req('/api/admin/codes'); check('admin API blocked without auth (403)', r.status === 403);
r = await anon.req('/api/me'); check('/api/me 401 without auth', r.status === 401);
r = await anon.req('/api/join', { json: { name: 'x', icai: 'x', city: 'x', code: 'x' } }); check('join without Google sign-in refused', r.status === 401);

// 2. Token verification
r = await anon.req('/api/auth/google', { json: { credential: await idToken('evil@gmail.com', 'E', { key: other.privateKey }) } });
check('forged Google token (wrong key) rejected', r.status === 401);
r = await anon.req('/api/auth/google', { json: { credential: await idToken('cadmthakkar@gmail.com', 'D', { aud: 'other-app' }) } });
check('token for another client ID rejected', r.status === 401);
r = await anon.req('/api/auth/google', { json: { credential: await idToken('x@gmail.com', 'X', { verified: false }) } });
check('unverified Google email rejected', r.status === 401);
r = await anon.req('/api/auth/google', { json: { credential: await idToken('x@gmail.com', 'X', { exp: Math.floor(Date.now() / 1000) - 60 }) } });
check('expired Google token rejected', r.status === 401);

// 3. Admin
const admin = new Client();
r = await admin.signIn('CadmThakkar@gmail.com', 'Darshak Thakkar');
check('admin login -> admin', r.status === 200 && r.body.status === 'admin', JSON.stringify(r.body));
r = await admin.req('/api/me'); check('admin /api/me has sheet link', r.body.role === 'admin' && !!r.body.sheetUrl);
r = await admin.req('/lab/'); check('admin opens /lab/ (200 html)', r.status === 200 && /\/lab\/assets\//.test(r.body));
r = await admin.req(`/lab/assets/${js}`); check('admin gets lab JS asset', r.status === 200 && /javascript/.test(r.type));
r = await admin.req('/api/admin/codes', { json: { action: 'create', batchNo: '32', endDate: plus(5), maxUses: 2 } });
const code1 = r.body.code?.code;
check('admin creates code, format B32-DDMMYYYY-XXXX', /^B32-\d{8}-[A-HJ-NP-Z2-9]{4}$/.test(code1 || ''), JSON.stringify(r.body));
const { dd, mm, yyyy } = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric' }).formatToParts(new Date()).map((x) => [{ day: 'dd', month: 'mm', year: 'yyyy' }[x.type], x.value]));
check('code date part is today IST', code1?.split('-')[1] === `${dd}${mm}${yyyy}`);
check('Codes row written (Active Yes, Used 0, Max 2)', tab('Codes').some((x) => x[2] === code1 && x[6] === 'Yes' && x[5] === 0 && x[4] === 2));
r = await admin.req('/api/admin/codes', { json: { action: 'create', batchNo: '32', endDate: '2020-01-01' } });
check('past end date refused on create', r.status === 400);
let tails = new Set(); for (let i = 0; i < 5; i++) { const x = await admin.req('/api/admin/codes', { json: { action: 'create', batchNo: '99', endDate: plus(1) } }); tails.add(x.body.code.code.slice(-4)); }
check('random tails differ', tails.size >= 4);

// 4. Student: wrong code, then valid code
const asha = new Client();
r = await asha.signIn('asha.student@gmail.com', 'Asha Patel');
check('new student -> registration form', r.body.status === 'form' && r.body.email === 'asha.student@gmail.com');
r = await asha.req('/lab/'); check('pending student cannot open lab', r.status === 302);
r = await asha.req('/api/join', { json: { name: 'Asha Patel', icai: 'wro0123456', city: 'Rajkot', code: 'B32-28112026-ZZZZ' } });
check('wrong code -> "Code not valid - ask your tutor"', r.status === 403 && r.body.message === 'Code not valid - ask your tutor', JSON.stringify(r.body));
r = await asha.req('/api/join', { json: { name: 'Asha Patel', icai: 'wro0123456', city: 'Rajkot', code: code1.toLowerCase() } });
check('valid code -> approved', r.body.status === 'approved', JSON.stringify(r.body));
const srow = tab('Students').find((x) => x[0] === 'asha.student@gmail.com');
check('Students row: Gmail, Name, ICAI, City, Batch, Access Date, Code, Status', srow && srow[1] === 'Asha Patel' && srow[2] === 'WRO0123456' && srow[3] === 'Rajkot' && srow[4] === '32' && srow[6] === code1 && srow[7] === 'Approved' && /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(srow[8]), JSON.stringify(srow));
check('Used incremented to 1', tab('Codes').find((x) => x[2] === code1)[5] === 1);
r = await asha.req('/lab/'); check('approved student opens lab', r.status === 200);
r = await asha.req(`/lab/assets/${css}`); check('approved student gets assets', r.status === 200);
r = await asha.req('/api/admin/codes'); check('student blocked from admin API', r.status === 403);
r = await admin.req('/api/admin/joined?code=' + code1); check('live joined count = 1 with name', r.body.joined === 1 && r.body.names[0] === 'Asha Patel');

// 5. Returning student goes straight in
const asha2 = new Client();
r = await asha2.signIn('asha.student@gmail.com', 'Asha P');
check('returning student -> approved directly', r.body.status === 'approved');

// 6. Max uses
const b = new Client(); await b.signIn('bhavin@gmail.com', 'Bhavin');
r = await b.req('/api/join', { json: { name: 'Bhavin Shah', icai: 'WRO1', city: 'Rajkot', code: code1 } }); check('2nd student joins (2/2)', r.body.status === 'approved');
const c = new Client(); await c.signIn('chirag@gmail.com', 'Chirag');
r = await c.req('/api/join', { json: { name: 'Chirag', icai: 'WRO2', city: 'Rajkot', code: code1 } }); check('3rd student refused when code full', r.status === 403);

// 7. Close code -> students blocked with "Your batch access has ended"
r = await admin.req('/api/admin/codes', { json: { action: 'close', code: code1 } }); check('admin closes code', r.status === 200);
r = await asha.req('/lab/'); check('closed batch: reopening lab -> /?ended=1', r.status === 302 && r.location === '/?ended=1', JSON.stringify(r));
r = await asha.req(`/lab/assets/${js}`); check('closed batch: session cookie cleared, assets blocked', r.status === 401);
r = await asha2.signIn('asha.student@gmail.com', 'Asha');
check('closed batch: sign-in -> "Your batch access has ended"', r.body.status === 'ended' && r.body.message === 'Your batch access has ended');
const d = new Client(); await d.signIn('dev@gmail.com', 'Dev');
r = await d.req('/api/join', { json: { name: 'Dev', icai: 'WRO3', city: 'Rajkot', code: code1 } }); check('closed code refused for new student', r.status === 403);

// 8. Expired code
r = await admin.req('/api/admin/codes', { json: { action: 'create', batchNo: '33', endDate: plus(2), maxUses: 60 } }); const code2 = r.body.code.code;
const e = new Client(); await e.signIn('esha@gmail.com', 'Esha');
r = await e.req('/api/join', { json: { name: 'Esha', icai: 'WRO4', city: 'Rajkot', code: code2 } }); check('B33 student joins', r.body.status === 'approved');
tab('Codes').find((x) => x[2] === code2)[3] = '01-01-2026'; // simulate the end date passing
r = await e.req('/lab/'); check('expired batch: reopening lab blocked', r.status === 302 && r.location === '/?ended=1');
const f = new Client(); await f.signIn('farhan@gmail.com', 'Farhan');
r = await f.req('/api/join', { json: { name: 'Farhan', icai: 'WRO5', city: 'Rajkot', code: code2 } }); check('expired code refused for new student', r.status === 403 && r.body.message === 'Code not valid - ask your tutor');
// ended student can join a NEW valid batch
r = await admin.req('/api/admin/codes', { json: { action: 'create', batchNo: '34', endDate: plus(3) } }); const code3 = r.body.code.code;
r = await e.signIn('esha@gmail.com', 'Esha'); check('ended student sees ended message + form', r.body.status === 'ended');
r = await e.req('/api/join', { json: { name: 'Esha', icai: 'WRO4', city: 'Rajkot', code: code3 } }); check('ended student re-joins with new batch code', r.body.status === 'approved');
check('no duplicate Students row', tab('Students').filter((x) => x[0] === 'esha@gmail.com').length === 1);

// 9. Regenerate
r = await admin.req('/api/admin/codes', { json: { action: 'regenerate', code: code3 } }); const code3b = r.body.code?.code;
check('regenerate makes a new B34 code', /^B34-\d{8}-[A-HJ-NP-Z2-9]{4}$/.test(code3b || '') && code3b !== code3);
r = await e.req('/lab/'); check('student of regenerated code keeps access', r.status === 200);
const g = new Client(); await g.signIn('gita@gmail.com', 'Gita');
r = await g.req('/api/join', { json: { name: 'Gita', icai: 'WRO6', city: 'Rajkot', code: code3 } }); check('old (replaced) code refused', r.status === 403);
r = await g.req('/api/join', { json: { name: 'Gita', icai: 'WRO6', city: 'Rajkot', code: code3b } }); check('new code works', r.body.status === 'approved');

// 10. Tampered cookie
const t = new Client(); t.jar.lab_session = asha.jar.lab_session || (await (async () => { const x = new Client(); await x.signIn('gita@gmail.com', 'G'); return x.jar.lab_session; })());
t.jar.lab_session = t.jar.lab_session.slice(0, -3) + 'abc';
r = await t.req(`/lab/assets/${js}`); check('tampered session cookie rejected', r.status === 401);

// 11. Brute-force lockout
const h = new Client(); await h.signIn('hacker@gmail.com', 'H');
for (let i = 0; i < 10; i++) await h.req('/api/join', { json: { name: 'H', icai: 'W', city: 'R', code: `B32-28112026-AA${i}A` } });
r = await h.req('/api/join', { json: { name: 'H', icai: 'W', city: 'R', code: code3b } }); check('10 wrong codes in an hour -> locked even with a valid code', r.status === 403 && /Too many/.test(r.body.message));

// 12. Lists and log
r = await admin.req('/api/admin/codes'); check('codes list with states', r.body.codes.length >= 8 && r.body.codes.some((x) => x.code === code1 && x.state === 'closed') && r.body.codes.some((x) => x.code === code2 && x.state === 'expired'));
r = await admin.req('/api/admin/logins'); check('recent logins list (newest first)', r.body.logins.length > 10 && r.body.logins[0].gmail === 'hacker@gmail.com');
const log = tab('Login Log');
check('Login Log has Allowed + Blocked rows with reasons', log.some((x) => x[4] === 'Allowed' && /Joined with code/.test(x[5])) && log.some((x) => x[4] === 'Blocked' && /Code not found/.test(x[5])) && log.some((x) => x[4] === 'Blocked' && /Batch access ended/.test(x[5])) && log.some((x) => /Admin/.test(x[5])));
check('Login Log time is IST text', /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(log[1][0]));
r = await anon.req('/mock-script', { json: { action: 'listCodes', secret: 'wrong' } }); check('Apps Script rejects wrong secret', r.body.ok === false && r.body.error === 'unauthorised');

console.log(results.join('\n'));
console.log(`\n${pass} passed, ${fail} failed`);
server.close();
process.exit(fail ? 1 : 0);
