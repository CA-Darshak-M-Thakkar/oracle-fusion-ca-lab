// Serves the lab bundle (private/lab) only to a signed-in admin or an approved student.
// The bundle is NOT in the static output, so there is no public URL for any screen or asset.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { clearCookie, logAttempt, readSession, SESSION, sheet } from './_lib/core.js';

const ROOT = path.join(process.cwd(), 'private', 'lab');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.csv': 'text/csv; charset=utf-8',
  '.gs': 'text/plain; charset=utf-8', '.pdf': 'application/pdf',
};

const redirect = (to, extra = {}) => new Response(null, { status: 302, headers: { location: to, 'cache-control': 'no-store', ...extra } });

export async function GET(request) {
  const url = new URL(request.url);
  let rel = (url.searchParams.get('p') || '').replace(/^\/+/, '');
  const isDoc = rel === '' || rel === 'index.html' || !path.extname(rel);
  const s = await readSession(request);
  if (!s || (s.role !== 'admin' && s.role !== 'student')) {
    return isDoc ? redirect('/') : new Response('Sign in first', { status: 401, headers: { 'cache-control': 'no-store' } });
  }

  if (isDoc && s.role === 'student') {
    // Re-check the Sheet every time the lab page opens, so a closed/expired batch stops at once.
    try {
      const chk = await sheet('check', { email: s.email });
      if (chk.status !== 'approved') {
        await logAttempt(s.email, s.name, s.batch, 'Blocked', 'Batch access ended (on reopen)');
        return redirect('/?ended=1', { 'set-cookie': clearCookie(SESSION) });
      }
    } catch (e) {
      console.error('recheck failed, keeping current session', e?.message); // fail open within the 12 h session
    }
  }

  if (isDoc) rel = 'index.html';
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT + path.sep)) return new Response('Not found', { status: 404 });
  try {
    const data = await readFile(file);
    const ext = path.extname(file).toLowerCase();
    const hashed = rel.startsWith('assets/');
    return new Response(data, {
      status: 200,
      headers: {
        'content-type': TYPES[ext] || 'application/octet-stream',
        'cache-control': hashed ? 'private, max-age=86400, immutable' : 'private, no-store',
        'x-robots-tag': 'noindex',
      },
    });
  } catch {
    return new Response('Not found', { status: 404, headers: { 'cache-control': 'no-store' } });
  }
}
