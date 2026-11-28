import { json, sheet } from '../_lib/core.js';
import { requireAdmin } from '../_lib/guard.js';
export async function GET(request) {
  const g = await requireAdmin(request); if (g.error) return g.error;
  try { return json(await sheet('recentLogins', { limit: 40 })); } catch (e) { return json({ error: e.message }, 502); }
}
