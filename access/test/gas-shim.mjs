// Minimal in-memory stand-in for the Apps Script services used by OracleLabAccess.gs,
// so the real .gs file runs unchanged under Node for the automated tests.
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

class Range {
  constructor(sh, r, c, nr = 1, nc = 1) { Object.assign(this, { sh, r, c, nr, nc }); }
  getValues() { const out = []; for (let i = 0; i < this.nr; i++) { const row = []; for (let j = 0; j < this.nc; j++) row.push(this.sh.get(this.r + i, this.c + j)); out.push(row); } return out; }
  setValues(v) { v.forEach((row, i) => row.forEach((x, j) => this.sh.set(this.r + i, this.c + j, x))); return this; }
  setValue(x) { this.sh.set(this.r, this.c, x); return this; }
  setNumberFormat() { return this; }
  setFontWeight() { return this; }
}
class Sheet {
  constructor(name) { this.name = name; this.rows = []; }
  get(r, c) { return (this.rows[r - 1] || [])[c - 1] ?? ''; }
  set(r, c, x) { while (this.rows.length < r) this.rows.push([]); this.rows[r - 1][c - 1] = x; }
  getLastRow() { return this.rows.length; }
  appendRow(v) { this.rows.push([...v]); }
  getDataRange() { const nc = Math.max(1, ...this.rows.map((r) => r.length)); return new Range(this, 1, 1, Math.max(1, this.rows.length), nc); }
  getRange(a, b, c, d) { if (typeof a === 'string') return new Range(this, 1, 1); return new Range(this, a, b, c || 1, d || 1); }
  setFrozenRows() {}
}
export function makeGas(secret) {
  const sheets = {};
  const ss = {
    getSheetByName: (n) => sheets[n] || null,
    insertSheet: (n) => (sheets[n] = new Sheet(n)),
    setSpreadsheetTimeZone() {},
  };
  const props = { LAB_SECRET: secret };
  const ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ss },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] ?? null, setProperty: (k, v) => { props[k] = v; } }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (t) => ({ text: t, setMimeType() { return this; } }) },
    Utilities: {
      formatDate(d, tz, fmt) {
        const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(d).map((x) => [x.type, x.value]));
        return fmt.replace('yyyy', p.year).replace('MM', p.month).replace('dd', p.day).replace('HH', p.hour).replace('mm', p.minute).replace('ss', p.second);
      },
    },
    Date, Math, JSON, String, Number, Object,
  };
  vm.createContext(ctx);
  vm.runInContext(readFileSync(new URL('../OracleLabAccess.gs', import.meta.url), 'utf8'), ctx);
  // Pre-create tabs with headers like the real sheet made by the Drive connector.
  ctx.ensureTabs_(ss);
  return { doPost: (body) => JSON.parse(ctx.doPost({ postData: { contents: body } }).text), sheets };
}
