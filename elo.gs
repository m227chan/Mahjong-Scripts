// ============================================================
// ELO SYSTEM — Mahjong Messiahs
// ============================================================
// Constants
const ELO_STARTING_RATING = 1500;
const ELO_K_NEW    = 40;   // < 20 games played
const ELO_K_MID    = 20;   // 20–49 games played
const ELO_K_VET    = 16;   // 50+ games played

// Leaderboard column indices (1-based) for ELO data
const ELO_COL_RATING      = 13; // Column M — current ELO
const ELO_COL_RANK        = 14; // Column N — ELO rank
const ELO_COL_PEAK        = 15; // Column O — peak ELO ever
const ELO_COL_LAST5       = 16; // Column P — ELO change over last 5 games

// ============================================================
// DEFERRED RECALC — Trigger helpers
// ============================================================
 
/**
 * Schedules a one-time trigger to run recalculateElo() + sortLeaderboard()
 * approximately 60 seconds from now.
 *
 * Deduplicates: if a trigger is already pending it deletes the old one
 * and creates a fresh one (so rapid game submissions don't pile up triggers).
 */
function scheduleDeferredRecalc_() {
  // Delete any existing pending recalc triggers
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'runDeferredRecalc') {
      ScriptApp.deleteTrigger(t);
    }
  });
 
  // Create a new one-time trigger ~60s from now
  ScriptApp.newTrigger('runDeferredRecalc')
    .timeBased()
    .after(1500) // milliseconds
    .create();
}
 
/**
 * Trigger handler: runs the full recalc+sort, then deletes itself.
 * This is the function name registered in scheduleDeferredRecalc_().
 */
function runDeferredRecalc() {
  // Delete this trigger so it doesn't re-fire
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'runDeferredRecalc') {
      ScriptApp.deleteTrigger(t);
    }
  });
 
  recalculateElo();
  sortLeaderboard();
}

/**
 * Reads persisted ELO state, applies one game, writes back only
 * the affected players. O(P) reads + O(1) game processing + O(P) writes
 * where P = players at the table (always 4).
 */
function applyIncrementalElo_(scores) {
  const ss        = SpreadsheetApp.getActiveSpreadsheet();
  const stateSheet = ss.getSheetByName('ELO State');
  const lbSheet    = ss.getSheetByName('Leaderboard');

  // ── Read full ELO state in one shot ───────────────────────
  const stateData = stateSheet.getDataRange().getValues();
  // Cols: Player | Rating | GamesPlayed | Peak | Last5_1..5
  const stateMap = {}; // name → { rowIndex, rating, gamesPlayed, peak, last5[] }
  for (let i = 1; i < stateData.length; i++) {
    const row = stateData[i];
    const name = String(row[0] || '').trim();
    if (!name) continue;
    stateMap[name] = {
      rowIndex:    i + 1, // 1-based sheet row
      rating:      Number(row[1]),
      gamesPlayed: Number(row[2]),
      peak:        Number(row[3]),
      last5:       [row[4], row[5], row[6], row[7], row[8]]
                     .map(Number)
                     .filter((_, idx) => row[idx + 4] !== '')
    };
  }

  // ── Participants in this game ──────────────────────────────
  const participants = Object.entries(scores).map(([name, score]) => {
    if (!stateMap[name]) {
      // New player not yet in ELO State — seed them
      stateMap[name] = { rowIndex: null, rating: ELO_STARTING_RATING,
                         gamesPlayed: 0, peak: ELO_STARTING_RATING, last5: [] };
    }
    return { name, score, state: stateMap[name] };
  });

  // ── Pairwise ELO delta (same logic as recalculateElo) ─────
  const deltas = {};
  participants.forEach(p => deltas[p.name] = 0);

  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      const pA = participants[i], pB = participants[j];
      const sA = pA.state, sB = pB.state;
      const expA   = 1 / (1 + Math.pow(10, (sB.rating - sA.rating) / 400));
      const actA   = getActual(pA.score, pB.score);
      const matchK = (getK(sA.gamesPlayed) + getK(sB.gamesPlayed)) / 2;
      const mult   = getSpreadMultiplier(pA.score, pB.score);
      deltas[pA.name] += matchK * mult * (actA - expA);
      deltas[pB.name] += matchK * mult * ((1 - actA) - (1 - expA));
    }
  }

  // ── Apply deltas + update state ───────────────────────────
  participants.forEach(({ name, state }) => {
    const delta = deltas[name];
    state.rating      += delta;
    state.gamesPlayed += 1;
    if (state.rating > state.peak) state.peak = state.rating;
    state.last5.push(delta);
    if (state.last5.length > 5) state.last5.shift();
  });

  // ── Batch-write ELO State rows (only 4 rows) ──────────────
  // Build a map of all state rows to write back
  // For new players, append; for existing, update in place
  const newStateRows = [];
  participants.forEach(({ name, state }) => {
    const padded = [...state.last5];
    while (padded.length < 5) padded.unshift('');
    const rowData = [name, Math.round(state.rating), state.gamesPlayed,
                     Math.round(state.peak), ...padded];
    if (state.rowIndex) {
      stateSheet.getRange(state.rowIndex, 1, 1, 9).setValues([rowData]);
    } else {
      newStateRows.push(rowData);
    }
  });
  if (newStateRows.length) {
    const lastRow = stateSheet.getLastRow();
    stateSheet.getRange(lastRow + 1, 1, newStateRows.length, 9)
              .setValues(newStateRows);
  }

  // ── Update Leaderboard ELO cols for only these 4 players ──
  const lbData = lbSheet.getDataRange().getValues();
  participants.forEach(({ name, state }) => {
    const lbRow = lbData.findIndex((r, i) => i > 0 && String(r[1]).trim() === name);
    if (lbRow === -1) return;
    const sheetRow = lbRow + 1;
    const last5Sum = state.last5.reduce((a, b) => a + b, 0);
    lbSheet.getRange(sheetRow, ELO_COL_RATING).setValue(Math.round(state.rating));
    lbSheet.getRange(sheetRow, ELO_COL_PEAK).setValue(Math.round(state.peak));
    lbSheet.getRange(sheetRow, ELO_COL_LAST5).setValue(Math.round(last5Sum));
  });

  // ── Re-sort leaderboard (still needed) ────────────────────
  sortLeaderboard();

  return { stateMap, allPlayerNames: Object.keys(stateMap) };
}

// ============================================================
// MAIN — Recalculate all ELO ratings from scratch
// ============================================================
//  1. Batches ALL leaderboard writes into ONE setValues() call
//     at the end instead of 4 individual range writes per player row
//  2. Everything else (logic) is unchanged
// ============================================================
 
function recalculateElo() {
  const ss           = SpreadsheetApp.getActiveSpreadsheet();
  const gamesSheet   = ss.getSheetByName('Game Scores');
  const lbSheet      = ss.getSheetByName('Leaderboard');
 
  const lbData    = lbSheet.getDataRange().getValues();
  const lbHeaders = lbData[0];
  const lbRows    = lbData.slice(1);
 
  const playerRowIndex = {};
  lbRows.forEach((row, i) => {
    const name = String(row[1] || '').trim();
    if (name) playerRowIndex[name] = i;
  });
 
  const allPlayerNames = Object.keys(playerRowIndex);
 
  const eloState = {};
  allPlayerNames.forEach(name => {
    eloState[name] = {
      rating:      ELO_STARTING_RATING,
      gamesPlayed: 0,
      peak:        ELO_STARTING_RATING,
      last5:       []
    };
  });
 
  const gsData    = gamesSheet.getDataRange().getValues();
  const gsHeaders = gsData[0];
 
  const colToPlayer = {};
  for (let c = 1; c < gsHeaders.length; c++) {
    const name = String(gsHeaders[c] || '').trim();
    if (name) colToPlayer[c] = name;
  }
 
  const ELO_CUTOFF = new Date('2026-04-25T00:00:00');
 
  for (let r = 1; r < gsData.length; r++) {
    const row = gsData[r];
    const firstCell = String(row[0] || '').trim().toLowerCase();
    if (firstCell === 'totals' || firstCell === 'total' || firstCell === '') continue;
 
    const gameDate = row[0] instanceof Date ? row[0] : new Date(row[0]);
    if (isNaN(gameDate.getTime())) continue;
 
    const isPreCutoff = gameDate < ELO_CUTOFF;
 
    if (isPreCutoff) {
      for (let c = 1; c < row.length; c++) {
        const player = colToPlayer[c];
        if (!player || !eloState[player]) continue;
        const cell = row[c];
        if (cell === '' || cell === null || cell === undefined) continue;
        const score = Number(cell);
        if (isNaN(score) || score === 0) continue;
        eloState[player].gamesPlayed++;
      }
      continue;
    }
 
    const participants = [];
    for (let c = 1; c < row.length; c++) {
      const player = colToPlayer[c];
      if (!player) continue;
      const cell = row[c];
      if (cell === '' || cell === null || cell === undefined) continue;
      const score = Number(cell);
      if (isNaN(score)) continue;
      participants.push({ name: player, score });
    }
 
    if (participants.length < 2) continue;
 
    const deltas = {};
    participants.forEach(p => { deltas[p.name] = 0; });
 
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        const pA = participants[i];
        const pB = participants[j];
        const stateA = eloState[pA.name];
        const stateB = eloState[pB.name];
        if (!stateA || !stateB) continue;
 
        const expA   = 1 / (1 + Math.pow(10, (stateB.rating - stateA.rating) / 400));
        const expB   = 1 - expA;
        const actA   = getActual(pA.score, pB.score);
        const actB   = 1 - actA;
        const matchK = (getK(stateA.gamesPlayed) + getK(stateB.gamesPlayed)) / 2;
        const mult   = getSpreadMultiplier(pA.score, pB.score);
 
        deltas[pA.name] += matchK * mult * (actA - expA);
        deltas[pB.name] += matchK * mult * (actB - expB);
      }
    }
 
    participants.forEach(p => {
      const state = eloState[p.name];
      if (!state) return;
      const delta = deltas[p.name];
      state.rating += delta;
      state.gamesPlayed++;
      if (state.rating > state.peak) state.peak = state.rating;
      state.last5.push(delta);
      if (state.last5.length > 5) state.last5.shift();
    });
  }

  // ── BATCHED WRITE ──
  ensureEloHeaders_(lbSheet, lbHeaders);

  const numRows = lbRows.length;
  const eloWriteData = lbRows.map(row => {
    const name = String(row[1] || '').trim();
    if (!name || !eloState[name]) return [row[12], row[14], row[15]]; // keep existing
    const state    = eloState[name];
    const last5Sum = state.last5.reduce((a, b) => a + b, 0);
    return [
      Math.round(state.rating),
      Math.round(state.peak),
      Math.round(last5Sum)
    ];
  });

  if (numRows > 0) {
    const ratingOnly = eloWriteData.map(r => [r[0]]);
    const peakLast5  = eloWriteData.map(r => [r[1], r[2]]);
    lbSheet.getRange(2, ELO_COL_RATING, numRows, 1).setValues(ratingOnly); // M
    lbSheet.getRange(2, ELO_COL_PEAK,   numRows, 2).setValues(peakLast5);  // O, P
  }

  SpreadsheetApp.flush();
}

// ============================================================
// HELPER — Actual score for ELO pairwise comparison
// ============================================================
function getActual(scoreA, scoreB) {
  if (scoreA > scoreB) return 1.0;
  if (scoreA < scoreB) return 0.0;
  return 0.5;
}

// ============================================================
// HELPER — K-factor by games played
// ============================================================
function getK(gamesPlayed) {
  if (gamesPlayed < 20)  return ELO_K_NEW;
  if (gamesPlayed < 50) return ELO_K_MID;
  return ELO_K_VET;
}

// ============================================================
// HELPER — Margin of victory multiplier
// ============================================================
function getSpreadMultiplier(scoreA, scoreB) {
  const spread = Math.abs(scoreA - scoreB);
  if (spread === 0) return 1.0;
  return 1.0 + Math.log10(1 + (spread / 32));
}

// ============================================================
// HELPER — Ensure ELO header row exists in Leaderboard
// ============================================================
function ensureEloHeaders_(sheet, existingHeaders) {
  const headers = {
    [ELO_COL_RATING]: 'ELO Rating',
    [ELO_COL_RANK]:   'ELO Rank',
    [ELO_COL_PEAK]:   'ELO Peak',
    [ELO_COL_LAST5]:  'ELO Δ Last 5'
  };

  Object.entries(headers).forEach(([col, label]) => {
    const colNum = Number(col);
    const currentVal = String(existingHeaders[colNum - 1] || '').trim();
    if (currentVal !== label) {
      sheet.getRange(1, colNum).setValue(label);
    }
  });
}
