import { isAdmin, json, readSession } from './core.js';
export async function requireAdmin(request) {
  const s = await readSession(request);
  if (!s || s.role !== 'admin' || !isAdmin(s.email)) return { error: json({ error: 'admin only' }, 403) };
  return { s };
}
