import { body, clearCookie, cookie, json, logAttempt, PENDING, readSession, SESSION, SESSION_TTL, sheet, signSession } from './_lib/core.js';

const clip = (v, n) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, n);

/** POST { name, icai, city, code } with the pending cookie set by /api/auth/google. */
export async function POST(request) {
  const pend = await readSession(request, PENDING);
  if (!pend || pend.role !== 'pending') return json({ status: 'error', message: 'Please sign in with Google again.' }, 401);
  const b = await body(request);
  const name = clip(b.name, 80);
  const icai = clip(b.icai, 20).toUpperCase();
  const city = clip(b.city, 40);
  const code = clip(b.code, 24).toUpperCase().replace(/\s+/g, '');
  if (!name || !icai || !city || !code) return json({ status: 'error', message: 'Fill in all four boxes.' }, 400);

  let r;
  try {
    r = await sheet('join', { email: pend.email, name, icai, city, code });
  } catch (e) {
    console.error(e);
    return json({ status: 'error', message: 'Access list is not reachable right now. Ask your tutor.' }, 503);
  }
  if (r.result === 'approved') {
    const tok = await signSession({ email: pend.email, name, role: 'student', batch: r.student.batch, code: r.student.code }, SESSION_TTL);
    await logAttempt(pend.email, name, r.student.batch, 'Allowed', `Joined with code ${code}`);
    return json({ status: 'approved' }, 200, { 'set-cookie': [cookie(SESSION, tok, SESSION_TTL), clearCookie(PENDING)] });
  }
  await logAttempt(pend.email, name, '', 'Blocked', `${r.reason || 'Code not valid'} (${code})`);
  const message = r.result === 'locked' ? 'Too many wrong codes. Wait one hour, or ask your tutor.' : 'Code not valid - ask your tutor';
  return json({ status: 'invalid', message }, 403);
}
