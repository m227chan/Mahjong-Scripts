// ============================================================
// SESSION SIDEBAR — Entry Point
// ============================================================

/**
 * Opens the Session Manager sidebar.
 * Add "🗺️ Session Manager" to your onOpen() menu pointing here.
 */
function showSessionSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('session')
    .setTitle('🀄 Session Manager');
  SpreadsheetApp.getUi().showSidebar(html);
}

// ============================================================
// TABLE ARRANGEMENTS SHEET — Key/Value helpers
// ============================================================

const SESSION_SHEET = 'Table Arrangements';

/**
 * Reads all key/value pairs from the Table Arrangements sheet.
 * Expects: Row 1 = headers (Key | Value), rows 2+ = data.
 * Uses the named table "Session Map" but falls back to columns A/B.
 */
function readSessionMap_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SESSION_SHEET);
  if (!sheet) throw new Error('Sheet "' + SESSION_SHEET + '" not found.');

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return {};

  const data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  const map = {};
  data.forEach(([key, value]) => {
    if (key !== '') map[String(key).trim()] = String(value).trim();
  });
  return map;
}

/**
 * Writes a key/value map back to the Table Arrangements sheet.
 * Clears existing data rows and rewrites from scratch.
 */
function writeSessionMap_(map) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SESSION_SHEET);
  if (!sheet) throw new Error('Sheet "' + SESSION_SHEET + '" not found.');

  // Clear old data (keep header row 1)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 2).clearContent();
  }

  const entries = Object.entries(map);
  if (entries.length === 0) return;

  const rows = entries.map(([k, v]) => [k, v]);
  sheet.getRange(2, 1, rows.length, 2).setValues(rows);
}

// ============================================================
// INIT — Called on sidebar load
// ============================================================

/**
 * Returns all players (name + icon) from Leaderboard,
 * plus the current session state from Table Arrangements.
 */
function getSessionInitData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const lbSheet = ss.getSheetByName('Leaderboard');

  // Build player list from leaderboard (col B = Name, col L = Icon)
  const lbData = lbSheet.getDataRange().getValues();
  const players = lbData.slice(1).map(row => ({
    name: String(row[1] || '').trim(),
    icon: String(row[11] || '👤').trim()
  })).filter(p => p.name !== '');

  // Read session from sheet
  const session = readSessionFromSheet_();

  return { players, session };
}

/**
 * Parses the Table Arrangements sheet into a session object.
 */
function readSessionFromSheet_() {
  const map = readSessionMap_();

  const active = map['session_active'] === 'true';
  const tableCount = parseInt(map['table_count'] || '2', 10);
  const participants = map['participants'] ? map['participants'].split(',').map(s => s.trim()).filter(Boolean) : [];

  const tables = {};
  for (let i = 1; i <= tableCount; i++) {
    const key = 'table_' + i;
    tables[String(i)] = map[key] ? map[key].split(',').map(s => s.trim()).filter(Boolean) : [];
  }

  const sideline = map['sideline'] ? map['sideline'].split(',').map(s => s.trim()).filter(Boolean) : [];

  return { active, tableCount, participants, tables, sideline };
}

// ============================================================
// SAVE SESSION — Called when session starts / setup changes
// ============================================================

/**
 * Persists full session state AND updates the Participating column.
 * @param {Object} session - { active, tableCount, participants, tables, sideline }
 */
function saveSession(session) {
  _writeFullSession(session);
}

/**
 * Persists only table layout + sideline (called on every drag).
 * Lighter-weight than saveSession — skips Leaderboard update.
 */
function saveSessionLayout(tables, sideline) {
  const map = readSessionMap_();

  // Update table keys
  const tableCount = parseInt(map['table_count'] || '2', 10);
  for (let i = 1; i <= tableCount; i++) {
    const key = 'table_' + i;
    const players = tables[String(i)] || [];
    map[key] = players.join(',');
  }
  map['sideline'] = (sideline || []).join(',');

  writeSessionMap_(map);
}

// ─── Private helpers ─────────────────────────────────────

function _writeFullSession(session) {
  const map = {
    session_active: session.active ? 'true' : 'false',
    table_count: String(session.tableCount || 2),
    participants: (session.participants || []).join(','),
    sideline: (session.sideline || []).join(',')
  };

  const tableCount = session.tableCount || 2;
  for (let i = 1; i <= tableCount; i++) {
    const players = (session.tables && session.tables[String(i)]) || [];
    map['table_' + i] = players.join(',');
  }

  writeSessionMap_(map);
}

function clearSession() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Table Arrangements');
  if (!sheet) throw new Error('Sheet "Table Arrangements" not found.');

  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 2).clearContent();
  }
}
