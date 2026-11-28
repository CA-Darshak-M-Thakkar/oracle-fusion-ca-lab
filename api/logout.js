import { clearCookie, json, PENDING, SESSION } from './_lib/core.js';
const out = () => json({ ok: true }, 200, { 'set-cookie': [clearCookie(SESSION), clearCookie(PENDING)] });
export const POST = out;
export const GET = out;
