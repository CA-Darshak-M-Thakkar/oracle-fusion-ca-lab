// Shared server helpers for the Vercel gate. Plain ESM JS so Vercel runs it without a TS step.
import { SignJWT, jwtVerify, createRemoteJWKSet } from 'jose';
import { randomInt } from 'node:crypto';

const env = (k, d = '') => (process.env[k] ?? d).toString().trim();

export const cfg = {
  get clientId() { return env('GOOGLE_CLIENT_ID'); },
  get admins() { return env('ADMIN_EMAILS', 'cadmthakkar@gmail.com').toLowerCase().split(/[,\s]+/).filter(Boolean); },
  get sessionSecret() { return env('SESSION_SECRET'); },
  get scriptUrl() { return env('APPS_SCRIPT_URL'); },
  get scriptSecret() { return env('APPS_SCRIPT_SECRET'); },
  get sheetUrl() { return env('SHEET_URL'); },
  // Test hooks: only used by the local test harness. Never set these on Vercel.
  get jwksUrl() { return env('GOOGLE_JWKS_URL', 'https://www.googleapis.com/oauth2/v3/certs'); },
  get issuers() { return env('GOOGLE_ISSUERS', 'https://accounts.google.com,accounts.google.com').split(','); },
  get insecureCookies() { return env('COOKIE_INSECURE') === '1'; },
};

export const isAdmin = (email) => cfg.admins.includes(String(email || '').toLowerCase());

// ---------- responses ----------
export function json(data, status = 200, headers = {}) {
  const h = new Headers({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  for (const [k, v] of Object.entries(headers)) {
    if (Array.isArray(v)) v.forEach((x) => h.append(k, x)); else h.set(k, v);
  }
  return new Response(JSON.stringify(data), { status, headers: h });
}

export function readCookie(request, name) {
  const raw = request.headers.get('cookie') || '';
  for (const part of raw.split(/;\s*/)) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i) === name) return decodeURIComponent(part.slice(i + 1));
  }
  return '';
}

export function cookie(name, value, maxAgeSec) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAgeSec}`];
  if (!cfg.insecureCookies) parts.push('Secure');
  return parts.join('; ');
}
export const clearCookie = (name) => cookie(name, '', 0);

// ---------- sessions (HS256 JWT in an HttpOnly cookie) ----------
export const SESSION = 'lab_session';
export const PENDING = 'lab_pending';
const key = () => {
  if (cfg.sessionSecret.length < 32) throw new Error('SESSION_SECRET missing or too short');
  return new TextEncoder().encode(cfg.sessionSecret);
};

export async function signSession(claims, ttlSec) {
  return new SignJWT({ ...claims }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSec).setAudience('oracle-lab').sign(key());
}

export async function readSession(request, name = SESSION) {
  const tok = readCookie(request, name);
  if (!tok) return null;
  try {
    const { payload } = await jwtVerify(tok, key(), { audience: 'oracle-lab', algorithms: ['HS256'] });
    return payload;
  } catch {
    return null;
  }
}

// ---------- Google ID token ----------
let jwks; let jwksFor = '';
export async function verifyGoogleIdToken(idToken) {
  if (!cfg.clientId) throw new Error('GOOGLE_CLIENT_ID missing');
  if (!jwks || jwksFor !== cfg.jwksUrl) { jwks = createRemoteJWKSet(new URL(cfg.jwksUrl)); jwksFor = cfg.jwksUrl; }
  const { payload } = await jwtVerify(String(idToken || ''), jwks, { audience: cfg.clientId, issuer: cfg.issuers });
  if (!payload.email || payload.email_verified !== true) throw new Error('email not verified');
  return { email: String(payload.email).toLowerCase(), name: String(payload.name || payload.email) };
}

// ---------- Google Sheet (Apps Script web app) ----------
export async function sheet(action, data = {}) {
  if (!cfg.scriptUrl || !cfg.scriptSecret) throw new Error('Sheet backend not configured (APPS_SCRIPT_URL / APPS_SCRIPT_SECRET)');
  const res = await fetch(cfg.scriptUrl, {
    method: 'POST',
    headers: { 'content-type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...data, action, secret: cfg.scriptSecret }),
    redirect: 'follow',
  });
  const text = await res.text();
  let out;
  try { out = JSON.parse(text); } catch { throw new Error(`Sheet backend returned non-JSON (HTTP ${res.status})`); }
  if (!out.ok) throw new Error(`Sheet: ${out.error || 'error'}`);
  return out;
}

export async function logAttempt(email, name, batch, result, reason) {
  try { await sheet('log', { email, name, batch, result, reason }); } catch (e) { console.error('log failed', e?.message); }
}

// ---------- codes ----------
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0, O, 1, I
export function istParts(d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric' })
    .formatToParts(d).map((x) => [x.type, x.value]));
  return { dd: p.day, mm: p.month, yyyy: p.year };
}
export function makeCode(batchNo, d = new Date()) {
  const { dd, mm, yyyy } = istParts(d);
  let tail = '';
  for (let i = 0; i < 4; i++) tail += ALPHABET[randomInt(ALPHABET.length)];
  return `B${batchNo}-${dd}${mm}${yyyy}-${tail}`;
}
export const istDate = (d = new Date()) => { const { dd, mm, yyyy } = istParts(d); return `${dd}-${mm}-${yyyy}`; };

export async function body(request) {
  try { return await request.json(); } catch { return {}; }
}

export const SESSION_TTL = 12 * 3600; // one class day
export const PENDING_TTL = 15 * 60;
