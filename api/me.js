import { cfg, json, readSession } from './_lib/core.js';
export async function GET(request) {
  const s = await readSession(request);
  if (!s) return json({ signedIn: false }, 401);
  const out = { signedIn: true, email: s.email, name: s.name, role: s.role, batch: s.batch || '' };
  if (s.role === 'admin') out.sheetUrl = cfg.sheetUrl;
  return json(out);
}
