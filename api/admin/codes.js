import { body, istDate, json, makeCode, sheet } from '../_lib/core.js';
import { requireAdmin } from '../_lib/guard.js';

export async function GET(request) {
  const g = await requireAdmin(request); if (g.error) return g.error;
  try { return json(await sheet('listCodes')); } catch (e) { return json({ error: e.message }, 502); }
}

/** POST { action: 'create', batchNo, endDate (YYYY-MM-DD), maxUses } | { action: 'close'|'regenerate', code } */
export async function POST(request) {
  const g = await requireAdmin(request); if (g.error) return g.error;
  const b = await body(request);
  try {
    if (b.action === 'create') {
      const batchNo = String(b.batchNo || '').trim().toUpperCase().replace(/^B/, '');
      if (!/^[0-9A-Z]{1,6}$/.test(batchNo)) return json({ error: 'Batch no should be like 32' }, 400);
      const m = String(b.endDate || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!m) return json({ error: 'Pick an end date' }, 400);
      const endDate = `${m[3]}-${m[2]}-${m[1]}`;
      const today = istDate().split('-').reverse().join('');
      if (`${m[1]}${m[2]}${m[3]}` < today) return json({ error: 'End date is in the past' }, 400);
      const maxUses = Math.max(1, Math.min(1000, parseInt(b.maxUses, 10) || 60));
      for (let i = 0; i < 5; i++) {
        try {
          return json(await sheet('createCode', { batchNo, accessDate: istDate(), endDate, maxUses, code: makeCode(batchNo) }));
        } catch (e) { if (!/duplicate/.test(e.message)) throw e; }
      }
      return json({ error: 'Could not make a unique code, try again' }, 500);
    }
    if (b.action === 'close') return json(await sheet('closeCode', { code: String(b.code || '') }));
    if (b.action === 'regenerate') {
      const batchNo = String(b.code || '').match(/^B([0-9A-Z]+)-/i)?.[1];
      if (!batchNo) return json({ error: 'bad code' }, 400);
      return json(await sheet('regenerate', { code: String(b.code), newCode: makeCode(batchNo.toUpperCase()), accessDate: istDate() }));
    }
    return json({ error: 'unknown action' }, 400);
  } catch (e) {
    return json({ error: e.message }, 502);
  }
}
