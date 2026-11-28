/**
 * Oracle Lab Access - Google Apps Script web app (bound to the "Oracle Lab Access" sheet).
 *
 * Only the Vercel server calls this. Every request must carry the shared secret,
 * which lives in Script Properties (key LAB_SECRET) and in Vercel env APPS_SCRIPT_SECRET.
 * No batch code, student or secret is stored in GitHub.
 *
 * Setup (one time, about 2 minutes):
 *   1. Open the sheet > Extensions > Apps Script. Delete the sample code, paste this file, Save.
 *   2. Project Settings (gear) > Script Properties > Add: LAB_SECRET = <the secret you were given>.
 *   3. Deploy > New deployment > type Web app. Execute as: Me. Who has access: Anyone. Deploy.
 *      Click Authorize access and allow. Copy the Web app URL (ends with /exec).
 *   4. Put that URL into Vercel env APPS_SCRIPT_URL (or send it to Grok Bot).
 */

var TZ = 'Asia/Kolkata';
var TABS = {
  students: { name: 'Students', headers: ['Gmail', 'Name', 'ICAI Reg No', 'City', 'Batch No', 'Access Date', 'Code', 'Status', 'Joined At'] },
  codes: { name: 'Codes', headers: ['Batch No', 'Access Date', 'Code', 'End Date', 'Max Uses', 'Used', 'Active'] },
  log: { name: 'Login Log', headers: ['Time IST', 'Gmail', 'Name', 'Batch', 'Result', 'Reason'] }
};
// Student columns (0-based)
var S = { gmail: 0, name: 1, icai: 2, city: 3, batch: 4, date: 5, code: 6, status: 7, joined: 8 };
// Code columns (0-based)
var C = { batch: 0, date: 1, code: 2, end: 3, max: 4, used: 5, active: 6 };
var MAX_BAD_TRIES_PER_HOUR = 10;

function doGet() {
  return json_({ ok: false, error: 'POST only' });
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'bad json' });
  }
  var secret = PropertiesService.getScriptProperties().getProperty('LAB_SECRET');
  if (!secret || body.secret !== secret) return json_({ ok: false, error: 'unauthorised' });
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    ensureTabs_(ss);
    var out = handle_(ss, body);
    out.ok = out.ok !== false;
    return json_(out);
  } catch (err2) {
    return json_({ ok: false, error: String(err2) });
  } finally {
    lock.releaseLock();
  }
}

function handle_(ss, b) {
  switch (b.action) {
    case 'ping': return { pong: true, time: nowIst_() };
    case 'check': return check_(ss, lower_(b.email));
    case 'join': return join_(ss, b);
    case 'log': appendLog_(ss, b.email, b.name, b.batch, b.result, b.reason); return {};
    case 'createCode': return createCode_(ss, b);
    case 'listCodes': return { codes: listCodes_(ss) };
    case 'closeCode': return closeCode_(ss, b.code);
    case 'regenerate': return regenerate_(ss, b.code, b.newCode, b.accessDate);
    case 'recentLogins': return { logins: recentLogins_(ss, Number(b.limit) || 30) };
    case 'joined': return joined_(ss, b.code);
    default: return { ok: false, error: 'unknown action' };
  }
}

// ---------- access ----------
function check_(ss, email) {
  var st = findStudent_(ss, email);
  if (!st) return { status: 'none' };
  var code = findCode_(ss, st.row[S.code]);
  var student = studentObj_(st.row);
  if (!code) return { status: 'ended', student: student, reason: 'Code removed' };
  var why = codeOpenReason_(code.row, false);
  if (why) return { status: 'ended', student: student, reason: why };
  return { status: 'approved', student: student };
}

function join_(ss, b) {
  var email = lower_(b.email);
  var codeText = String(b.code || '').trim().toUpperCase();
  if (!email || !codeText) return { result: 'invalid', reason: 'Missing email or code' };
  if (badTriesLastHour_(ss, email) >= MAX_BAD_TRIES_PER_HOUR) {
    return { result: 'locked', reason: 'Too many wrong codes - wait one hour' };
  }
  var code = findCode_(ss, codeText);
  if (!code) return { result: 'invalid', reason: 'Code not found' };
  var why = codeOpenReason_(code.row, true);
  if (why) return { result: 'invalid', reason: why };

  var sh = tab_(ss, 'students');
  var existing = findStudent_(ss, email);
  var joinedAt = nowIst_();
  var row = [email, clean_(b.name), clean_(b.icai).toUpperCase(), clean_(b.city), code.row[C.batch], text_(code.row[C.date]), codeText, 'Approved', joinedAt];
  if (existing) {
    sh.getRange(existing.index, 1, 1, row.length).setValues([row]);
  } else {
    sh.appendRow(row);
  }
  var used = Number(code.row[C.used]) || 0;
  var sameCodeAlready = existing && String(existing.row[S.code]).toUpperCase() === codeText;
  if (!sameCodeAlready) {
    tab_(ss, 'codes').getRange(code.index, C.used + 1).setValue(used + 1);
    used += 1;
  }
  return { result: 'approved', student: studentObj_(row), used: used };
}

/** Returns '' when the code is open, else the reason. forJoin also enforces Max Uses. */
function codeOpenReason_(r, forJoin) {
  if (String(r[C.active]).trim().toLowerCase() !== 'yes') return 'Code closed';
  var end = ymd_(r[C.end]);
  var today = Utilities.formatDate(new Date(), TZ, 'yyyyMMdd');
  if (end && today > end) return 'Code expired';
  if (forJoin) {
    var max = Number(r[C.max]) || 0;
    var used = Number(r[C.used]) || 0;
    if (max > 0 && used >= max) return 'Code full';
  }
  return '';
}

// ---------- codes ----------
function createCode_(ss, b) {
  var code = String(b.code || '').toUpperCase();
  if (!/^B[0-9A-Z]{1,6}-\d{8}-[A-Z0-9]{4}$/.test(code)) return { ok: false, error: 'bad code format' };
  if (findCode_(ss, code)) return { ok: false, error: 'duplicate' };
  var row = [String(b.batchNo), String(b.accessDate), code, String(b.endDate), Number(b.maxUses) || 60, 0, 'Yes'];
  tab_(ss, 'codes').appendRow(row);
  return { code: codeObj_(row) };
}

function closeCode_(ss, codeText) {
  var c = findCode_(ss, codeText);
  if (!c) return { ok: false, error: 'not found' };
  tab_(ss, 'codes').getRange(c.index, C.active + 1).setValue('No');
  return {};
}

/** New tail for the same batch; old code closes; its students move to the new code. */
function regenerate_(ss, oldCode, newCode, accessDate) {
  var c = findCode_(ss, oldCode);
  if (!c) return { ok: false, error: 'not found' };
  newCode = String(newCode || '').toUpperCase();
  if (findCode_(ss, newCode)) return { ok: false, error: 'duplicate' };
  var r = c.row;
  var row = [r[C.batch], String(accessDate || text_(r[C.date])), newCode, text_(r[C.end]), Number(r[C.max]) || 60, Number(r[C.used]) || 0, 'Yes'];
  var codes = tab_(ss, 'codes');
  codes.getRange(c.index, C.active + 1).setValue('No');
  codes.appendRow(row);
  var sh = tab_(ss, 'students');
  var vals = sh.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][S.code]).toUpperCase() === String(oldCode).toUpperCase()) {
      sh.getRange(i + 1, S.code + 1).setValue(newCode);
    }
  }
  return { code: codeObj_(row) };
}

function listCodes_(ss) {
  var vals = tab_(ss, 'codes').getDataRange().getValues();
  var out = [];
  for (var i = vals.length - 1; i >= 1; i--) {
    if (!vals[i][C.code]) continue;
    var o = codeObj_(vals[i]);
    var why = codeOpenReason_(vals[i], true);
    o.state = why ? why.replace('Code ', '') : 'open';
    out.push(o);
  }
  return out;
}

function joined_(ss, codeText) {
  var c = findCode_(ss, codeText);
  if (!c) return { ok: false, error: 'not found' };
  var vals = tab_(ss, 'students').getDataRange().getValues();
  var names = [];
  for (var i = vals.length - 1; i >= 1; i--) {
    if (String(vals[i][S.code]).toUpperCase() === String(codeText).toUpperCase()) names.push(String(vals[i][S.name]));
  }
  return { code: codeObj_(c.row), joined: names.length, names: names.slice(0, 12) };
}

// ---------- log ----------
function appendLog_(ss, email, name, batch, result, reason) {
  tab_(ss, 'log').appendRow([nowIst_(), lower_(email), clean_(name), clean_(batch), result === 'Allowed' ? 'Allowed' : 'Blocked', clean_(reason)]);
}

function recentLogins_(ss, limit) {
  var sh = tab_(ss, 'log');
  var last = sh.getLastRow();
  if (last < 2) return [];
  var n = Math.min(limit, last - 1);
  var vals = sh.getRange(last - n + 1, 1, n, 6).getValues();
  var out = [];
  for (var i = vals.length - 1; i >= 0; i--) {
    out.push({ time: text_(vals[i][0]), gmail: vals[i][1], name: vals[i][2], batch: vals[i][3], result: vals[i][4], reason: vals[i][5] });
  }
  return out;
}

function badTriesLastHour_(ss, email) {
  var sh = tab_(ss, 'log');
  var last = sh.getLastRow();
  if (last < 2) return 0;
  var n = Math.min(400, last - 1);
  var vals = sh.getRange(last - n + 1, 1, n, 6).getValues();
  var cutoff = Utilities.formatDate(new Date(Date.now() - 3600 * 1000), TZ, 'yyyy-MM-dd HH:mm:ss');
  var count = 0;
  for (var i = 0; i < vals.length; i++) {
    if (String(vals[i][1]) === email && String(vals[i][4]) === 'Blocked' && /code/i.test(String(vals[i][5])) && text_(vals[i][0]) >= cutoff) count++;
  }
  return count;
}

// ---------- helpers ----------
// Columns kept as plain text so Sheets never turns 03-12-2026 into a US date.
var TEXT_COLS = { students: ['A:A', 'C:C', 'E:I'], codes: ['A:D', 'G:G'], log: ['A:F'] };

function ensureTabs_(ss) {
  var props = PropertiesService.getScriptProperties();
  var fresh = props.getProperty('FORMATTED') !== '2';
  for (var k in TABS) {
    var t = TABS[k];
    var sh = ss.getSheetByName(t.name);
    if (!sh) sh = ss.insertSheet(t.name);
    if (sh.getLastRow() === 0) {
      sh.appendRow(t.headers);
      sh.setFrozenRows(1);
    }
    if (fresh) {
      for (var j = 0; j < TEXT_COLS[k].length; j++) sh.getRange(TEXT_COLS[k][j]).setNumberFormat('@');
      sh.getRange(1, 1, 1, t.headers.length).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
  }
  if (fresh) {
    ss.setSpreadsheetTimeZone(TZ);
    props.setProperty('FORMATTED', '2');
  }
}
function tab_(ss, key) { return ss.getSheetByName(TABS[key].name); }
function findStudent_(ss, email) {
  if (!email) return null;
  var vals = tab_(ss, 'students').getDataRange().getValues();
  for (var i = vals.length - 1; i >= 1; i--) {
    if (lower_(vals[i][S.gmail]) === email) return { index: i + 1, row: vals[i] };
  }
  return null;
}
function findCode_(ss, codeText) {
  var want = String(codeText || '').trim().toUpperCase();
  if (!want) return null;
  var vals = tab_(ss, 'codes').getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][C.code]).trim().toUpperCase() === want) return { index: i + 1, row: vals[i] };
  }
  return null;
}
function studentObj_(r) {
  return { gmail: r[S.gmail], name: r[S.name], icai: r[S.icai], city: r[S.city], batch: String(r[S.batch]), accessDate: text_(r[S.date]), code: r[S.code], status: r[S.status], joinedAt: text_(r[S.joined]) };
}
function codeObj_(r) {
  return { batchNo: String(r[C.batch]), accessDate: text_(r[C.date]), code: String(r[C.code]), endDate: text_(r[C.end]), maxUses: Number(r[C.max]) || 0, used: Number(r[C.used]) || 0, active: String(r[C.active]) };
}
/** Accepts DD-MM-YYYY text, YYYY-MM-DD text or a Date cell. Returns yyyyMMdd or ''. */
function ymd_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'yyyyMMdd');
  var s = String(v || '').trim();
  var m = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m) return m[3] + m[2] + m[1];
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[1] + m[2] + m[3];
  return '';
}
function text_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'dd-MM-yyyy');
  return String(v === null || v === undefined ? '' : v);
}
function nowIst_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss'); }
function lower_(v) { return String(v || '').trim().toLowerCase(); }
function clean_(v) { return String(v || '').replace(/[\r\n\t]+/g, ' ').replace(/^[=+\-@]+/, '').trim().slice(0, 120); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
