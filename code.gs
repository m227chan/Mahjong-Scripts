// ============================================================
// ON OPEN — Custom Menu
// ============================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🀄 Mahjong Club Menu")
    .addItem("Add New Game", "addNewGame")
    .addItem("Add New Player", "addNewPlayer")
    .addSeparator()
    .addItem("📊 View Dashboard", "showDashboard")
    .addToUi();
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
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { box-sizing: border-box; font-family: Arial; }
    body { padding: 16px; margin: 0; }

    h3 { margin-bottom: 8px; }

    .instructions {
      background: #e8f0fe;
      border-left: 4px solid #1a73e8;
      padding: 10px 12px;
      margin-bottom: 14px;
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
      padding-left: 18px;
    }

    .search-box {
      width: 100%;
      padding: 8px;
      margin-bottom: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }

    .player-list {
      max-height: 120px;
      overflow-y: auto;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin-bottom: 12px;
    }

    .player-item {
      padding: 6px 10px;
      cursor: pointer;
    }

    .player-item:hover {
      background: #f1f3f4;
    }

    .selected {
      background: #d2e3fc;
      font-weight: bold;
    }

    .scores {
      margin-top: 10px;
    }

    .field {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    input[type="number"] {
      width: 40%;
      padding: 6px;
    }

    .error {
      color: #d93025;
      font-size: 12px;
      margin-top: 8px;
      display: none;
      background: #fce8e6;
      padding: 8px;
      border-radius: 4px;
    }

    .btn-row {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 12px;
    }

    button {
      padding: 7px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .submit { background: #1a73e8; color: white; }
    .cancel { background: #eee; }

    button:disabled {
      background: #aaa;
      cursor: not-allowed;
    }
  </style>
</head>

<body>
  <h3>Enter Game Scores</h3>

  <div class="instructions">
    <strong>📋 Instructions (exactly 4 players per game):</strong>
    <ul>
      <li><strong>Select exactly 4 players</strong> using the search box</li>
      <li><strong>Enter scores</strong> for those 4 players</li>
      <li><strong>Scores must sum to 0</strong></li>
      <li>All selected players default to <strong>0</strong></li>
    </ul>
  </div>

  <input 
    class="search-box" 
    placeholder="Search players..." 
    oninput="filterPlayers(this.value)" 
  />

  <div id="playerList" class="player-list"></div>

  <div id="scoreInputs" class="scores"></div>

  <div id="error" class="error"></div>

  <div class="btn-row">
    <button class="cancel" onclick="google.script.host.close()">Cancel</button>
    <button class="submit" onclick="submitScores()">Add Game</button>
  </div>

<script>
  const allPlayers = ${JSON.stringify(players)};
  let selected = [];

  function renderPlayers(list) {
    const container = document.getElementById("playerList");
    container.innerHTML = "";

    list.forEach(p => {
      const div = document.createElement("div");
      div.className = "player-item" + (selected.includes(p) ? " selected" : "");
      div.textContent = p;

      div.onclick = () => togglePlayer(p);

      container.appendChild(div);
    });
  }

  function filterPlayers(query) {
    const filtered = allPlayers.filter(p =>
      p.toLowerCase().includes(query.toLowerCase())
    );
    renderPlayers(filtered);
  }

  function togglePlayer(player) {
    const idx = selected.indexOf(player);

    if (idx > -1) {
      selected.splice(idx, 1);
    } else {
      if (selected.length >= 4) return;
      selected.push(player);
    }

    renderPlayers(allPlayers);
    renderScoreInputs();
  }

  function renderScoreInputs() {
    const container = document.getElementById("scoreInputs");
    container.innerHTML = "";

    selected.forEach(p => {
      const div = document.createElement("div");
      div.className = "field";

      div.innerHTML = \`
        <label>\${p}</label>
        <input type="number" id="score_\${p}" value="0" />
      \`;

      container.appendChild(div);
    });
  }

  function submitScores() {
    const error = document.getElementById("error");
    error.style.display = "none";

    if (selected.length !== 4) {
      error.innerHTML = "⚠️ <strong>You must select exactly 4 players.</strong>";
      error.style.display = "block";
      return;
    }

    const scores = {};
    let sum = 0;

    selected.forEach(p => {
      const val = parseFloat(document.getElementById("score_" + p).value) || 0;
      scores[p] = val;
      sum += val;
    });

    if (Math.abs(sum) > 0.001) {
      error.innerHTML = \`⚠️ <strong>Scores must sum to 0!</strong><br>Current sum: \${sum.toFixed(1)}\`;
      error.style.display = "block";
      return;
    }

    document.querySelector(".submit").disabled = true;
    document.querySelector(".submit").textContent = "Saving...";

    google.script.run
      .withSuccessHandler(() => {
        document.body.innerHTML = "<h3>✅ Game added successfully!</h3>";
        setTimeout(() => google.script.host.close(), 1200);
      })
      .withFailureHandler(err => {
        error.textContent = err.message;
        error.style.display = "block";
        document.querySelector(".submit").disabled = false;
        document.querySelector(".submit").textContent = "Add Game";
      })
      .submitGame(scores);
  }

  renderPlayers(allPlayers);
</script>

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
