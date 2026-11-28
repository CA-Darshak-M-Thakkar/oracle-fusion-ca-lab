import { json, sheet } from '../_lib/core.js';
import { requireAdmin } from '../_lib/guard.js';
export async function GET(request) {
  const g = await requireAdmin(request); if (g.error) return g.error;
  const code = new URL(request.url).searchParams.get('code') || '';
  try { return json(await sheet('joined', { code })); } catch (e) { return json({ error: e.message }, 502); }
}
