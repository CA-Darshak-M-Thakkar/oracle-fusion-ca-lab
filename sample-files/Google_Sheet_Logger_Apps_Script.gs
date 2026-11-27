// ============================================================================
// GOOGLE SHEETS ATTENDANCE LOGGER — Oracle Fusion CA simulator
// Sheet name in class: Adv ITT - Oracle Fusion
//
// Columns A:F (do not rename):
//   A Timestamp | B Full Name | C Email | D Mobile No | E WRO No | F Notes
// The simulator sends:
//   timestamp, name, email, mobile: "" , wroNo: "" , notes: "Student" or "Teacher"
// Mobile and WRO stay blank. Role is in Notes.
//
// THIS FILE IS NOT LIVE until you paste it into the existing Apps Script
// and redeploy THE SAME deployment:
//   Deploy → Manage deployments → pencil (Edit) → Version: New version → Deploy
// The /exec URL must stay the same. A new deployment would change the URL.
//
// After redeploy, the next sign-in also converts old ISO text timestamps in
// column A into real dates and refreshes the summary in H:J. Set the
// spreadsheet timezone to India (the script does this).
// ============================================================================

var TIMEZONE = 'Asia/Kolkata';

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    ss.setSpreadsheetTimeZone(TIMEZONE);
    var sheet = ss.getActiveSheet();
    ensureHeaders_(sheet);
    var data = JSON.parse(e.postData.contents);
    var when = parseWhen_(data.timestamp);
    sheet.appendRow([
      when,
      data.name || '',
      data.email || '',
      '',
      '',
      data.notes || data.role || ''
    ]);
    var row = sheet.getLastRow();
    sheet.getRange(row, 1).setNumberFormat('dd mmm yyyy hh:mm');
    normalizeOldTimestamps_(sheet);
    writeSummary_(sheet);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function parseWhen_(raw) {
  if (!raw) return new Date();
  var parsed = new Date(raw);
  if (isNaN(parsed.getTime())) return new Date();
  return parsed;
}

function ensureHeaders_(sheet) {
  var headers = ['Timestamp', 'Full Name', 'Email', 'Mobile No', 'WRO No', 'Notes'];
  var current = sheet.getRange(1, 1, 1, 6).getValues()[0];
  if (current.join('') === '') {
    sheet.getRange(1, 1, 1, 6).setValues([headers]).setFontWeight('bold');
  }
}

function normalizeOldTimestamps_(sheet) {
  var last = sheet.getLastRow();
  if (last < 2) return;
  var range = sheet.getRange(2, 1, last - 1, 1);
  var values = range.getValues();
  var dirty = false;
  for (var i = 0; i < values.length; i++) {
    var value = values[i][0];
    if (typeof value === 'string' && value) {
      var parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        values[i][0] = parsed;
        dirty = true;
      }
    }
  }
  if (dirty) {
    range.setValues(values);
    range.setNumberFormat('dd mmm yyyy hh:mm');
  }
}

function writeSummary_(sheet) {
  var block = [
    ['Summary', 'Count', 'How it is counted (India time)'],
    ['Total', '=COUNTA(B2:B)', 'Rows with a name'],
    ['Today', '=SUMPRODUCT((A2:A<>"")*(INT(A2:A)=INT(NOW())))', 'Sign-ins dated today'],
    ['Last 7 Days', '=SUMPRODUCT((A2:A<>"")*(INT(A2:A)>=INT(NOW())-6))', 'Today and the previous 6 days'],
    ['This Month', '=SUMPRODUCT((A2:A<>"")*(TEXT(A2:A,"yyyy-mm")=TEXT(NOW(),"yyyy-mm")))', 'This calendar month']
  ];
  sheet.getRange(1, 8, block.length, 3).setValues(block);
  sheet.getRange(1, 8, 1, 3).setFontWeight('bold');
}
