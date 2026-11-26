// ============================================================================
// GOOGLE SHEETS LIVE ATTENDANCE LOGGER FOR ORACLE FUSION CA SIMULATOR
// ============================================================================
// 1. Open Google Sheets (sheets.google.com) -> Create a new sheet.
// 2. Rename Row 1 headers:
//    A1: Timestamp | B1: Full Name | C1: Email | D1: Mobile No | E1: WRO No
// 3. Click Extensions -> Apps Script -> Paste this entire code -> Save.
// 4. Click Deploy -> New deployment -> Select type: "Web app"
//    - Execute as: "Me"
//    - Who has access: "Anyone"
// 5. Copy the Web App URL (ends in /exec) and paste it into src/config/attendance.ts
//    as GOOGLE_SHEET_WEBHOOK_URL (or paste it in chat so I can update it).
// ============================================================================

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.name || '',
      data.email || '',
      data.mobile || '',
      data.wroNo || ''
    ]);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
