// ============================================================
// ON OPEN — Custom Menu
// ============================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🀄 Mahjong Club Menu")
    .addItem("📊 Main Dashboard", "showMainDashboard")
    .addItem("Add New Game", "addNewGame")
    .addItem("Add New Player", "addNewPlayer")
    .addSeparator()
    .addItem("🎯 Legacy Dashboard", "showDashboard")
    .addToUi();
}

function showMainDashboard() {
  const html = HtmlService.createHtmlOutputFromFile("index.html")
    .setWidth(1400)
    .setHeight(900);
  SpreadsheetApp.getUi().showModelessDialog(html, "🀄 Mahjong Club Dashboard");
}

function addNewPlayer() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const gamesSheet = ss.getSheetByName("Game Scores");
  const leaderboardSheet = ss.getSheetByName("Leaderboard");
  const ui = SpreadsheetApp.getUi();

  const response = ui.prompt("Add New Player", "Enter the new player's name:", ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK) return;

  const playerName = response.getResponseText().trim();
  if (!playerName) {
    ui.alert("Player name cannot be empty.");
    return;
  }

  // --- Update Game Scores sheet ---
  const lastCol = gamesSheet.getLastColumn();
  const lastDataRow = gamesSheet.getLastRow();

  gamesSheet.getRange(1, lastCol + 1).setValue(playerName);

  // Leave cells empty (null) instead of filling with zeros
  // Empty cells will remain empty for non-participants

  const newColLetter = columnToLetter(lastCol + 1);
  gamesSheet.getRange(lastDataRow, lastCol + 1).setFormula(
    `=SUM(Games[${playerName}])`
  );

  // --- Update Leaderboard sheet ---
  const lbLastRow = leaderboardSheet.getLastRow();
  const newLbRow = lbLastRow + 1;

  // Column A: Title (dynamic formula)
  leaderboardSheet.getRange(newLbRow, 1).setFormula(
    '=LET(rank,INDIRECT("D"&ROW()),total,COUNTA(D:D)-1,IF(rank=1,"Messiah",IF(OR(rank=2,rank=3),"Master",IF(AND(rank>=4,rank<=6),"Magician",IF(rank=total,"Moron",IF(OR(rank=total-1,rank=total-2),"Mongrel",IF(AND(rank>=total-5,rank<=total-3),"Minion","Monk")))))))'
  );

  // Column B: Player Name
  leaderboardSheet.getRange(newLbRow, 2).setValue(playerName);

  // Column C: Total Score
  leaderboardSheet.getRange(newLbRow, 3).setFormula(
    `=INDIRECT("'Game Scores'!" & ADDRESS(MATCH("Totals", 'Game Scores'!A:A, 0), MATCH(B${newLbRow}, 'Game Scores'!1:1, 0)))`
  );

  // Column D: Total Score Rank - Update ALL rows to use dynamic range
  for (let r = 2; r <= newLbRow; r++) {
    leaderboardSheet.getRange(r, 4).setFormula(
      `=RANK(C${r}, C$2:C$${newLbRow}, FALSE)`
    );
  }

  // Column E: Games Played
  leaderboardSheet.getRange(newLbRow, 5).setFormula(
    `=COUNTIF(INDEX(INDIRECT("'Game Scores'!$2:$"&(COUNTA('Game Scores'!A$2:A))), 0, MATCH(B${newLbRow}, 'Game Scores'!$1:$1, 0)), "<>")`
  );

  // Column F: Games Won (shifted from E → F)
  leaderboardSheet.getRange(newLbRow, 6).setFormula(
    `=COUNTIF(INDEX(INDIRECT("'Game Scores'!$2:$"&(COUNTA('Game Scores'!A:A)-1)), 0, MATCH(B${newLbRow}, 'Game Scores'!$1:$1, 0)), ">0")`
  );

  // Column G: Games Lost (shifted from F → G)
  leaderboardSheet.getRange(newLbRow, 7).setFormula(
    `=COUNTIF(INDEX(INDIRECT("'Game Scores'!$2:$"&(COUNTA('Game Scores'!A:A)-1)), 0, MATCH(B${newLbRow}, 'Game Scores'!$1:$1, 0)), "<0")`
  );

  // Column H: Win / Loss Ratio (shifted from G → H)
  leaderboardSheet.getRange(newLbRow, 8).setFormula(
    `=IF(G${newLbRow}=0, 0, F${newLbRow}/G${newLbRow})`
  );

  // Column I: Win / Loss Ratio Rank (shifted from H → I)
  for (let r = 2; r <= newLbRow; r++) {
    leaderboardSheet.getRange(r, 9).setFormula(
      `=RANK(H${r}, H$2:H$${newLbRow}, FALSE)`
    );
  }

  // Column J: Highest Single Game Win (shifted from I → J)
  leaderboardSheet.getRange(newLbRow, 10).setFormula(
    `=MAX(INDEX(INDIRECT("'Game Scores'!$2:$"&(COUNTA('Game Scores'!A:A)-1)), 0, MATCH(B${newLbRow}, 'Game Scores'!$1:$1, 0)))`
  );

  // Column K: Highest Single Game Loss (shifted from J → K)
  leaderboardSheet.getRange(newLbRow, 11).setFormula(
    `=MIN(INDEX(INDIRECT("'Game Scores'!$2:$"&(COUNTA('Game Scores'!A:A)-1)), 0, MATCH(B${newLbRow}, 'Game Scores'!$1:$1, 0)))`
  );

  ui.alert(`Player "${playerName}" has been added successfully!`);
}

// ============================================================
// FEATURE 2: Add New Game (HTML Dialog)
// ============================================================
function addNewGame() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const gamesSheet = ss.getSheetByName("Game Scores");

  const lastCol = gamesSheet.getLastColumn();
  const headers = gamesSheet.getRange(1, 2, 1, lastCol - 1).getValues()[0];
  const players = headers.filter(h => h !== "");

  const html = buildGameDialog(players);
  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(450)
    .setHeight(180 + players.length * 52);

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, "Add New Game");
}

function buildGameDialog(players) {
  const fields = players.map(player => `
    <div class="field">
      <label>${player}</label>
      <input type="number" id="${player}" placeholder="leave blank if didn't play" />
    </div>
  `).join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { box-sizing: border-box; font-family: Arial, sans-serif; }
          body { padding: 16px; margin: 0; background: #fff; }
          h3 { margin: 0 0 8px; font-size: 15px; color: #1a1a1a; }
          .instructions {
            background: #e8f0fe;
            border-left: 4px solid #1a73e8;
            padding: 10px 12px;
            margin-bottom: 16px;
            font-size: 12px;
            color: #333;
            line-height: 1.5;
          }
          .instructions strong {
            display: block;
            margin-bottom: 4px;
            color: #1a73e8;
          }
          .instructions ul {
            margin: 4px 0 0 0;
            padding-left: 20px;
          }
          .instructions li {
            margin-bottom: 3px;
          }
          .field {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          label {
            font-size: 13px;
            color: #333;
            width: 50%;
          }
          input {
            width: 45%;
            padding: 6px 8px;
            font-size: 13px;
            border: 1px solid #ccc;
            border-radius: 4px;
          }
          input.error-field {
            border-color: #d93025;
            background-color: #fce8e6;
          }
          .btn-row {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-top: 14px;
          }
          button {
            padding: 7px 18px;
            font-size: 13px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          .cancel { background: #eee; color: #333; }
          .submit { background: #1a73e8; color: white; }
          .submit:hover { background: #1558b0; }
          .submit:disabled { background: #aaa; cursor: not-allowed; }
          .error {
            color: #d93025;
            font-size: 12px;
            margin-top: 8px;
            padding: 8px 12px;
            background: #fce8e6;
            border-radius: 4px;
            display: none;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <h3>Enter Game Scores</h3>
        <div class="instructions">
          <strong>📋 Instructions (exactly 4 players per game):</strong>
          <ul>
            <li><strong>Enter score</strong> for players who won or lost points</li>
            <li><strong>Enter 0</strong> for players who played but scored nothing</li>
            <li><strong>Leave blank</strong> for players who didn't play</li>
          </ul>
        </div>
        ${fields}
        <div class="error" id="error-msg"></div>
        <div class="btn-row">
          <button class="cancel" onclick="google.script.host.close()">Cancel</button>
          <button class="submit" onclick="submitScores()">Add Game</button>
        </div>
        <script>
          function submitScores() {
            const players = ${JSON.stringify(players)};
            const scores = {};
            let filledCount = 0;
            
            // Clear any previous error styling
            players.forEach(p => {
              document.getElementById(p).classList.remove('error-field');
            });
            
            players.forEach(p => {
              const input = document.getElementById(p);
              const val = input.value.trim();
              if (val !== "") {
                scores[p] = parseFloat(val);
                filledCount++;
              }
            });

            const errorMsg = document.getElementById('error-msg');
            
            // Hide previous messages
            errorMsg.style.display = 'none';
            
            // VALIDATION 1: Check player count - MUST BE EXACTLY 4
            if (filledCount !== 4) {
              // RED ERROR - block submission
              if (filledCount < 4) {
                errorMsg.innerHTML = \`⚠️ <strong>Not enough players!</strong><br>You entered scores for \${filledCount} player\${filledCount === 1 ? '' : 's'}. Mahjong requires exactly 4 players.\`;
              } else {
                errorMsg.innerHTML = \`⚠️ <strong>Too many players!</strong><br>You entered scores for \${filledCount} players. Mahjong requires exactly 4 players.\`;
              }
              errorMsg.style.display = 'block';
              
              // Highlight filled fields with red
              players.forEach(p => {
                const val = document.getElementById(p).value.trim();
                if (val !== "") {
                  document.getElementById(p).classList.add('error-field');
                }
              });
              
              return; // STOP EXECUTION
            }

            // VALIDATION 2: Scores must sum to 0
            const sum = Object.values(scores).reduce((a, b) => a + b, 0);
            if (Math.abs(sum) > 0.001) {
              errorMsg.innerHTML = \`⚠️ <strong>Scores must sum to 0!</strong><br>Current sum: \${sum.toFixed(1)}\`;
              errorMsg.style.display = 'block';
              
              // Highlight all filled fields with red
              players.forEach(p => {
                const val = document.getElementById(p).value.trim();
                if (val !== "") {
                  document.getElementById(p).classList.add('error-field');
                }
              });
              
              return; // STOP EXECUTION
            }

            // If we get here, validation passed
            document.querySelector('.submit').disabled = true;
            document.querySelector('.submit').textContent = 'Saving...';

            google.script.run
              .withSuccessHandler(() => {
                document.body.innerHTML = \`
                  <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100px;gap:12px;font-family:Arial;">
                    <div style="font-size:28px">✅</div>
                    <div style="font-size:14px;color:#333;">Game added successfully!</div>
                  </div>
                \`;
                setTimeout(() => google.script.host.close(), 1500);
              })
              .withFailureHandler(err => {
                errorMsg.textContent = "Error: " + err.message;
                errorMsg.style.display = 'block';
                document.querySelector('.submit').disabled = false;
                document.querySelector('.submit').textContent = 'Add Game';
              })
              .submitGame(scores);
          }
        <\/script>
      </body>
    </html>
  `;
}

function submitGame(scores) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const gamesSheet = ss.getSheetByName("Game Scores");
  const lastCol = gamesSheet.getLastColumn();

  const now = new Date();
  const datetime = Utilities.formatDate(now, ss.getSpreadsheetTimeZone(), "dd/MM/yyyy HH:mm:ss");

  const lastRow = gamesSheet.getLastRow();
  gamesSheet.insertRowBefore(lastRow);
  const newRow = lastRow;

  gamesSheet.getRange(newRow, 1).setValue(datetime);

  for (let c = 2; c <= lastCol; c++) {
    const playerName = gamesSheet.getRange(1, c).getValue();
    if (scores.hasOwnProperty(playerName)) {
      // Player participated - set their score (could be 0, positive, or negative)
      gamesSheet.getRange(newRow, c).setValue(scores[playerName]);
    }
    // If player not in scores object, leave cell empty (null)
  }
}


// ============================================================
// HELPER: Convert column number to letter
// ============================================================
function columnToLetter(column) {
  let temp, letter = "";
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}

function showDashboard() {
  const html = HtmlService.createHtmlOutputFromFile("dashboard")
    .setWidth(1000)
    .setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(html, "Mahjong Dashboard");
}

function getGameData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Game Scores");
  const data = sheet.getDataRange().getValues();

  const headers = data[0].slice(1).filter(h => h !== ""); // player names, no empty
  const rows = data.slice(1, -1); // exclude header and totals row

  let cumulative = headers.map(() => 0);

  const result = rows.map((row, i) => {
    // Convert time to a plain string here in Apps Script
    const rawTime = row[0];
    let time;
    if (rawTime instanceof Date) {
      time = Utilities.formatDate(rawTime, ss.getSpreadsheetTimeZone(), "MM/dd HH:mm");
    } else {
      time = String(rawTime) || "Game " + (i + 1);
    }

    const scores = row.slice(1, headers.length + 1);
    cumulative = cumulative.map((c, i) => c + (Number(scores[i]) || 0));

    const sorted = [...cumulative].sort((a, b) => b - a);
    const ranks = cumulative.map(v => sorted.indexOf(v) + 1);

    return {
      time,
      cumulative: [...cumulative],
      ranks
    };
  });

  return { players: headers, data: result };
}

// ============================================================
// NEW: Get Complete Leaderboard Data
// ============================================================
function getLeaderboardData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const lbSheet = ss.getSheetByName("Leaderboard");
    const gsSheet = ss.getSheetByName("Game Scores");
    
    const lbData = lbSheet.getDataRange().getValues();
    const headers = lbData[0]; // [Title, Player Name, Total Score, Rank, Games Played, Wins, Losses, Win/Loss Ratio, Ratio Rank, Highest, Lowest]
    const rows = lbData.slice(1); // All player rows
    
    const result = rows.map(row => ({
      title: row[0] || "Novice",
      player: row[1] || "",
      totalScore: Number(row[2]) || 0,
      rank: Number(row[3]) || 0,
      gamesPlayed: Number(row[4]) || 0,
      wins: Number(row[5]) || 0,
      losses: Number(row[6]) || 0,
      winLossRatio: Number(row[7]) || 0,
      ratioRank: Number(row[8]) || 0,
      highestGame: Number(row[9]) || 0,
      lowestGame: Number(row[10]) || 0
    }));
    
    // Sort by rank (ascending)
    result.sort((a, b) => a.rank - b.rank);
    
    return {
      success: true,
      data: result,
      totalPlayers: result.length,
      totalGames: gsSheet.getLastRow() - 2 // Exclude header and totals row
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================
// NEW: Get All Game Data Combined
// ============================================================
function getAllGameData() {
  try {
    const gameData = getGameData();
    const leaderboardResult = getLeaderboardData();
    
    if (!leaderboardResult.success) {
      throw new Error(leaderboardResult.error);
    }
    
    return {
      success: true,
      players: gameData.players,
      gameData: gameData.data,
      leaderboard: leaderboardResult.data,
      totalPlayers: leaderboardResult.totalPlayers,
      totalGames: leaderboardResult.totalGames
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================
// NEW: Submit New Player (Wrapper with error handling)
// ============================================================
function submitNewPlayer(playerName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const gamesSheet = ss.getSheetByName("Game Scores");
    const leaderboardSheet = ss.getSheetByName("Leaderboard");
    
    // Validation
    const trimmedName = playerName.trim();
    if (!trimmedName) {
      return {
        success: false,
        error: "Player name cannot be empty."
      };
    }
    
    // Check for duplicates
    const lastCol = gamesSheet.getLastColumn();
    const headers = gamesSheet.getRange(1, 2, 1, lastCol - 1).getValues()[0];
    const existingPlayers = headers.filter(h => h !== "");
    
    if (existingPlayers.some(p => p.toLowerCase() === trimmedName.toLowerCase())) {
      return {
        success: false,
        error: "Player already exists."
      };
    }
    
    // --- Update Game Scores sheet ---
    const lastDataRow = gamesSheet.getLastRow();
    gamesSheet.getRange(1, lastCol + 1).setValue(trimmedName);
    
    const newColLetter = columnToLetter(lastCol + 1);
    gamesSheet.getRange(lastDataRow, lastCol + 1).setFormula(
      `=SUM(Games[${trimmedName}])`
    );
    
    // --- Update Leaderboard sheet ---
    const lbLastRow = leaderboardSheet.getLastRow();
    const newLbRow = lbLastRow + 1;
    
    // Column A: Title (dynamic formula)
    leaderboardSheet.getRange(newLbRow, 1).setFormula(
      '=LET(rank,INDIRECT("D"&ROW()),total,COUNTA(D:D)-1,IF(rank=1,"Messiah",IF(OR(rank=2,rank=3),"Master",IF(AND(rank>=4,rank<=6),"Magician",IF(rank=total,"Moron",IF(OR(rank=total-1,rank=total-2),"Mongrel",IF(AND(rank>=total-5,rank<=total-3),"Minion","Monk")))))))'
    );
    
    // Column B: Player Name
    leaderboardSheet.getRange(newLbRow, 2).setValue(trimmedName);
    
    // Column C: Total Score
    leaderboardSheet.getRange(newLbRow, 3).setFormula(
      `=INDIRECT("'Game Scores'!" & ADDRESS(MATCH("Totals", 'Game Scores'!A:A, 0), MATCH(B${newLbRow}, 'Game Scores'!1:1, 0)))`
    );
    
    // Column D: Total Score Rank - Update ALL rows
    for (let r = 2; r <= newLbRow; r++) {
      leaderboardSheet.getRange(r, 4).setFormula(
        `=RANK(C${r}, C$2:C$${newLbRow}, FALSE)`
      );
    }
    
    // Column E: Games Played
    leaderboardSheet.getRange(newLbRow, 5).setFormula(
      `=COUNTIF(INDEX(INDIRECT("'Game Scores'!$2:$"&(COUNTA('Game Scores'!A$2:A))), 0, MATCH(B${newLbRow}, 'Game Scores'!$1:$1, 0)), "<>")`
    );
    
    // Column F: Games Won
    leaderboardSheet.getRange(newLbRow, 6).setFormula(
      `=COUNTIF(INDEX(INDIRECT("'Game Scores'!$2:$"&(COUNTA('Game Scores'!A:A)-1)), 0, MATCH(B${newLbRow}, 'Game Scores'!$1:$1, 0)), ">0")`
    );
    
    // Column G: Games Lost
    leaderboardSheet.getRange(newLbRow, 7).setFormula(
      `=COUNTIF(INDEX(INDIRECT("'Game Scores'!$2:$"&(COUNTA('Game Scores'!A:A)-1)), 0, MATCH(B${newLbRow}, 'Game Scores'!$1:$1, 0)), "<0")`
    );
    
    // Column H: Win / Loss Ratio
    leaderboardSheet.getRange(newLbRow, 8).setFormula(
      `=IF(G${newLbRow}=0, 0, F${newLbRow}/G${newLbRow})`
    );
    
    // Column I: Win / Loss Ratio Rank
    for (let r = 2; r <= newLbRow; r++) {
      leaderboardSheet.getRange(r, 9).setFormula(
        `=RANK(H${r}, H$2:H$${newLbRow}, FALSE)`
      );
    }
    
    // Column J: Highest Single Game
    leaderboardSheet.getRange(newLbRow, 10).setFormula(
      `=MAX(INDEX(INDIRECT("'Game Scores'!$2:$"&(COUNTA('Game Scores'!A:A)-1)), 0, MATCH(B${newLbRow}, 'Game Scores'!$1:$1, 0)))`
    );
    
    // Column K: Lowest Single Game
    leaderboardSheet.getRange(newLbRow, 11).setFormula(
      `=MIN(INDEX(INDIRECT("'Game Scores'!$2:$"&(COUNTA('Game Scores'!A:A)-1)), 0, MATCH(B${newLbRow}, 'Game Scores'!$1:$1, 0)))`
    );
    
    return {
      success: true,
      message: `Player "${trimmedName}" has been added successfully!`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
