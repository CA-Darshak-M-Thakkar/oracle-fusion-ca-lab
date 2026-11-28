import { body, clearCookie, cookie, isAdmin, json, logAttempt, PENDING, PENDING_TTL, SESSION, SESSION_TTL, sheet, signSession, verifyGoogleIdToken } from '../_lib/core.js';

/** POST { credential } -> verifies the Google ID token, then decides admin / returning / new student. */
export async function POST(request) {
  const { credential } = await body(request);
  let who;
  try {
    who = await verifyGoogleIdToken(credential);
  } catch (e) {
    return json({ status: 'error', message: 'Google sign-in could not be verified. Try again.' }, 401);
  }
  const { email, name } = who;

  if (isAdmin(email)) {
    const tok = await signSession({ email, name, role: 'admin', batch: 'Admin' }, SESSION_TTL);
    await logAttempt(email, name, 'Admin', 'Allowed', 'Admin sign-in');
    return json({ status: 'admin', email, name }, 200, { 'set-cookie': [cookie(SESSION, tok, SESSION_TTL), clearCookie(PENDING)] });
  }

  let chk;
  try {
    chk = await sheet('check', { email });
  } catch (e) {
    console.error(e);
    return json({ status: 'error', message: 'Access list is not reachable right now. Ask your tutor.' }, 503);
  }

  if (chk.status === 'approved') {
    const s = chk.student;
    const tok = await signSession({ email, name: s.name || name, role: 'student', batch: s.batch, code: s.code }, SESSION_TTL);
    await logAttempt(email, s.name || name, s.batch, 'Allowed', 'Returning student');
    return json({ status: 'approved', email, name: s.name || name }, 200, { 'set-cookie': [cookie(SESSION, tok, SESSION_TTL), clearCookie(PENDING)] });
  }

  // New student, or an ended batch: both get the one-time form (a new valid code re-opens access).
  const pend = await signSession({ email, name, role: 'pending' }, PENDING_TTL);
  const headers = { 'set-cookie': [cookie(PENDING, pend, PENDING_TTL), clearCookie(SESSION)] };
  if (chk.status === 'ended') {
    await logAttempt(email, chk.student?.name || name, chk.student?.batch || '', 'Blocked', `Batch access ended (${chk.reason || 'closed'})`);
    return json({ status: 'ended', email, name, message: 'Your batch access has ended' }, 200, headers);
  }
  await logAttempt(email, name, '', 'Blocked', 'New - registration form shown');
  return json({ status: 'form', email, name }, 200, headers);
}
