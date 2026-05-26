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
// MAIN — Recalculate all ELO ratings from scratch
// ============================================================
function recalculateElo() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const gamesSheet   = ss.getSheetByName('Game Scores');
  const lbSheet      = ss.getSheetByName('Leaderboard');

  // ── 1. Read all players from Leaderboard (col B) ──────────
  const lbData    = lbSheet.getDataRange().getValues();
  const lbHeaders = lbData[0];
  const lbRows    = lbData.slice(1);

  // Build player index: name → leaderboard row index (0-based in lbRows)
  const playerRowIndex = {};
  lbRows.forEach((row, i) => {
    const name = String(row[1] || '').trim();
    if (name) playerRowIndex[name] = i;
  });

  const allPlayerNames = Object.keys(playerRowIndex);

  // ── 2. Initialize ELO state per player ────────────────────
  // rating, gamesPlayed, peakRating, last5Deltas[]
  const eloState = {};
  allPlayerNames.forEach(name => {
    eloState[name] = {
      rating:      ELO_STARTING_RATING,
      gamesPlayed: 0,
      peak:        ELO_STARTING_RATING,
      last5:       []   // stores delta from each of last 5 games
    };
  });

  // ── 3. Read Game Scores ────────────────────────────────────
  const gsData    = gamesSheet.getDataRange().getValues();
  const gsHeaders = gsData[0]; // row 0 = player names (col B onward)

  // Map column index → player name
  const colToPlayer = {};
  for (let c = 1; c < gsHeaders.length; c++) {
    const name = String(gsHeaders[c] || '').trim();
    if (name) colToPlayer[c] = name;
  }

  // ── 4. Process each game row chronologically ──────────────
  const ELO_CUTOFF = new Date('2026-04-25T00:00:00');

  for (let r = 1; r < gsData.length; r++) {
    const row = gsData[r];

    const firstCell = String(row[0] || '').trim().toLowerCase();
    if (firstCell === 'totals' || firstCell === 'total' || firstCell === '') continue;

    const gameDate = row[0] instanceof Date ? row[0] : new Date(row[0]);
    if (isNaN(gameDate.getTime())) continue;

    const isPreCutoff = gameDate < ELO_CUTOFF;

    // PRE-CUTOFF: only increment gamesPlayed for non-zero scores.
    // We cannot trust 0s in old data — they were used as filler for
    // non-participants, so we treat non-zero as the participation signal.
    if (isPreCutoff) {
      for (let c = 1; c < row.length; c++) {
        const player = colToPlayer[c];
        if (!player || !eloState[player]) continue;
        const cell = row[c];
        if (cell === '' || cell === null || cell === undefined) continue;
        const score = Number(cell);
        if (isNaN(score) || score === 0) continue; // skip blanks AND zeros
        eloState[player].gamesPlayed++;
      }
      continue; // no ELO delta computation for pre-cutoff games
    }

    // POST-CUTOFF: full participation detection (blank = not present, 0 = valid score)
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

    // Need at least 2 players to compute ELO
    if (participants.length < 2) continue;

    // Determine placement for each participant
    // Placement: score > 0 → winner (1st), score < 0 → loser (last), score === 0 → middle
    // For pairwise: winner beats everyone, loser loses to everyone, zeros are draws among themselves
    const getActual = (scoreA, scoreB) => {
      if (scoreA > scoreB) return 1.0;
      if (scoreA < scoreB) return 0.0;
      return 0.5;
    };

    // ============================================================
    // HELPER — Continuous Margin of Victory (MoV) Multiplier
    // Smoothes out the reward curve using logarithmic scaling. 
    // Eliminates arbitrary threshold boundaries and avoids misclassifying 
    // specialized Mahjong end-states (like Tenpai exhaustive draws).
    // ============================================================
    function getSpreadMultiplier(scoreA, scoreB) {
      const spread = Math.abs(scoreA - scoreB);
      if (spread === 0) return 1.0;

      // Base multiplier + logarithmic growth based on score gap.
      // Using 32 as a baseline divisor matching your club's low-end spread.
      // A spread of 32 results in a ~1.30x multiplier.
      // A massive spread of 256 naturally scales to a capped ~1.95x multiplier smoothly.
      const continuousMult = 1.0 + Math.log10(1 + (spread / 32));
      
      return continuousMult;
    }

    // Compute deltas for each player this game
    const deltas = {};
    participants.forEach(p => { deltas[p.name] = 0; });

    // All pairwise matchups
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        const pA = participants[i];
        const pB = participants[j];

        const stateA = eloState[pA.name];
        const stateB = eloState[pB.name];
        if (!stateA || !stateB) continue;

        const ratingA = stateA.rating;
        const ratingB = stateB.rating;

        // Expected scores
        const expA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
        const expB = 1 - expA;

        // Actual scores
        const actA = getActual(pA.score, pB.score);
        const actB = 1 - actA;

        // K-factors based on games played so far
        const kA = getK(stateA.gamesPlayed);
        const kB = getK(stateB.gamesPlayed);

        // FIX: Average the K-factor for this specific matchup. 
        // Ensures total points won = total points lost (Zero-Sum protection).
        const matchK = (kA + kB) / 2;

        // FIX: Utilize the new continuous score-spread multiplier
        const mult = getSpreadMultiplier(pA.score, pB.score);

        // Both players are calculated using the unified matchK and multiplier
        deltas[pA.name] += matchK * mult * (actA - expA);
        deltas[pB.name] += matchK * mult * (actB - expB);
      }
    }

    // Apply deltas and update state
    participants.forEach(p => {
      const state = eloState[p.name];
      if (!state) return;

      const delta = deltas[p.name];
      state.rating += delta;
      state.gamesPlayed++;

      if (state.rating > state.peak) {
        state.peak = state.rating;
      }

      // Track last 5 game deltas
      state.last5.push(delta);
      if (state.last5.length > 5) state.last5.shift();
    });
  }

  // ── 5. Compute ELO ranks ──────────────────────────────────
  const sortedByRating = allPlayerNames
    .filter(n => eloState[n].gamesPlayed > 0)
    .sort((a, b) => eloState[b].rating - eloState[a].rating);

  const eloRanks = {};

  // Assign ranks with tie handling — tied ratings get the same rank,
  // next rank skips (e.g. two players tied at 1st → both get 1, next gets 3)
  let currentRank = 1;
  for (let i = 0; i < sortedByRating.length; i++) {
    const name = sortedByRating[i];
    const rating = Math.round(eloState[name].rating);

    if (i === 0) {
      eloRanks[name] = currentRank;
    } else {
      const prevRating = Math.round(eloState[sortedByRating[i - 1]].rating);
      if (rating === prevRating) {
        // Same rating as previous player — assign same rank
        eloRanks[name] = eloRanks[sortedByRating[i - 1]];
      } else {
        // Different rating — rank jumps to current position (i + 1)
        currentRank = i + 1;
        eloRanks[name] = currentRank;
      }
    }
  }

  // Players with 0 post-cutoff games get null rank — written as blank not —
  allPlayerNames.filter(n => eloState[n].gamesPlayed === 0).forEach(name => {
    eloRanks[name] = null;
  });

  // ── 6. Write results back to Leaderboard ──────────────────
  ensureEloHeaders_(lbSheet, lbHeaders);

  lbRows.forEach((row, i) => {
    const name = String(row[1] || '').trim();
    if (!name || !eloState[name]) return;

    const state = eloState[name];
    const sheetRow = i + 2; // +1 for header, +1 for 1-based

    const last5Sum = state.last5.reduce((a, b) => a + b, 0);

    lbSheet.getRange(sheetRow, ELO_COL_RATING).setValue(Math.round(state.rating));
    lbSheet.getRange(sheetRow, ELO_COL_RANK).setValue(eloRanks[name] ?? '');
    lbSheet.getRange(sheetRow, ELO_COL_PEAK).setValue(Math.round(state.peak));
    lbSheet.getRange(sheetRow, ELO_COL_LAST5).setValue(Math.round(last5Sum));
  });

  SpreadsheetApp.flush();
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
