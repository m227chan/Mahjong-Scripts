// ============================================================
// ON OPEN — Custom Menu
// ============================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🀄 Mahjong Club Menu")
    // .addItem("Add New Game", "addNewGame")
    .addItem("Add New Game", "addNewGameFan")
    .addItem("Add New Player", "addNewPlayer")
    .addSeparator()
    .addItem("📊 View Dashboard", "showDashboard")
    .addItem("🌐 Player Network", "showNetwork")
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

  const newColLetter = columnToLetter(lastCol + 1);
  gamesSheet.getRange(lastDataRow, lastCol + 1).setFormula(
    `=SUM(Games[${playerName}])`
  );

  // --- Update Leaderboard sheet ---
  const lbLastRow = leaderboardSheet.getLastRow();
  const newLbRow = lbLastRow + 1;

  leaderboardSheet.getRange(newLbRow, 1).setFormula(
    '=LET(rank,INDIRECT("D"&ROW()),total,COUNTA(D$2:D$999),IF(rank=1,"Messiah",IF(AND(rank>=2,rank<=3),"Master",IF(AND(rank>=4,rank<=6),"Musketeer",IF(AND(rank>=7,rank<=10),"Marshal",IF(rank=total,"Moron",IF(AND(rank>=total-2,rank<=total-1),"Mongrel",IF(AND(rank>=total-5,rank<=total-3),"Minion",IF(AND(rank>=total-9,rank<=total-6),"Mortal","Monk")))))))))'
  );

  leaderboardSheet.getRange(newLbRow, 2).setValue(playerName);

  leaderboardSheet.getRange(newLbRow, 3).setFormula(
    `=INDIRECT("'Game Scores'!" & ADDRESS(MATCH("Totals", 'Game Scores'!A:A, 0), MATCH(B${newLbRow}, 'Game Scores'!1:1, 0)))`
  );

  for (let r = 2; r <= newLbRow; r++) {
    leaderboardSheet.getRange(r, 4).setFormula(
      `=RANK(C${r}, C$2:C$${newLbRow}, FALSE)`
    );
  }

  leaderboardSheet.getRange(newLbRow, 5).setFormula(
    `=COUNTIF(INDEX(INDIRECT("'Game Scores'!$2:$"&(COUNTA('Game Scores'!A$2:A))), 0, MATCH(B${newLbRow}, 'Game Scores'!$1:$1, 0)), "<>")`
  );

  leaderboardSheet.getRange(newLbRow, 6).setFormula(
    `=COUNTIF(INDEX(INDIRECT("'Game Scores'!$2:$"&(COUNTA('Game Scores'!A:A)-1)), 0, MATCH(B${newLbRow}, 'Game Scores'!$1:$1, 0)), ">0")`
  );

  leaderboardSheet.getRange(newLbRow, 7).setFormula(
    `=COUNTIF(INDEX(INDIRECT("'Game Scores'!$2:$"&(COUNTA('Game Scores'!A:A)-1)), 0, MATCH(B${newLbRow}, 'Game Scores'!$1:$1, 0)), "<0")`
  );

  leaderboardSheet.getRange(newLbRow, 8).setFormula(
    `=IF(G${newLbRow}=0, 0, F${newLbRow}/G${newLbRow})`
  );

  for (let r = 2; r <= newLbRow; r++) {
    leaderboardSheet.getRange(r, 9).setFormula(
      `=RANK(H${r}, H$2:H$${newLbRow}, FALSE)`
    );
  }

  leaderboardSheet.getRange(newLbRow, 10).setFormula(
    `=MAX(INDEX(INDIRECT("'Game Scores'!$2:$"&(COUNTA('Game Scores'!A:A)-1)), 0, MATCH(B${newLbRow}, 'Game Scores'!$1:$1, 0)))`
  );

  leaderboardSheet.getRange(newLbRow, 11).setFormula(
    `=MIN(INDEX(INDIRECT("'Game Scores'!$2:$"&(COUNTA('Game Scores'!A:A)-1)), 0, MATCH(B${newLbRow}, 'Game Scores'!$1:$1, 0)))`
  );

  ui.alert(`Player "${playerName}" has been added successfully!`);
}

// ============================================================
// FEATURE: Add New Game (Original - Manual Score Entry)
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
  <input class="search-box" placeholder="Search players..." oninput="filterPlayers(this.value)" />
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
      gamesSheet.getRange(newRow, c).setValue(scores[playerName]);
    }
  }
}

// ============================================================
// FEATURE: Add New Game (Fan Scoring System)
// ============================================================
function addNewGameFan() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const gamesSheet = ss.getSheetByName("Game Scores");

  const lastCol = gamesSheet.getLastColumn();
  const headers = gamesSheet.getRange(1, 2, 1, lastCol - 1).getValues()[0];
  const players = headers.filter(h => h !== "");

  const html = buildFanGameDialog(players);
  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(550)
    .setHeight(750);

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, "Add New Game (Fan Scoring)");
}

function buildFanGameDialog(players) {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; }
    body { padding: 20px; margin: 0; background: #f8f9fa; }
    
    h3 { 
      margin: 0 0 16px; 
      font-size: 20px; 
      color: #1a202c;
      font-weight: 700;
    }
    
    .card {
      background: white;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .instructions {
      background: #e8f4fd;
      border-left: 4px solid #1a73e8;
      padding: 12px;
      margin-bottom: 16px;
      font-size: 13px;
      color: #2c5282;
      line-height: 1.5;
      border-radius: 4px;
    }
    
    .form-group {
      margin-bottom: 16px;
    }
    
    .form-group label {
      display: block;
      font-weight: 600;
      font-size: 13px;
      color: #4a5568;
      margin-bottom: 6px;
    }

    /* Chips Styling */
    .selected-chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
    }
    .chip {
      background-color: #667eea;
      color: white;
      border-radius: 16px;
      padding: 4px 12px;
      display: flex;
      align-items: center;
      font-size: 13px;
      font-weight: 600;
    }
    .chip .remove-btn {
      margin-left: 8px;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
    }
    .chip .remove-btn:hover {
      color: #feb2b2;
    }
    
    select, input[type="number"], input[type="text"] {
      width: 100%;
      padding: 10px 12px;
      border: 2px solid #e2e8f0;
      border-radius: 6px;
      font-size: 14px;
      transition: all 0.2s;
    }
    
    select:focus, input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .player-list {
      max-height: 140px;
      overflow-y: auto;
      border: 2px solid #e2e8f0;
      border-radius: 6px;
      margin-top: 8px;
    }
    .player-item {
      padding: 8px 12px;
      cursor: pointer;
      font-size: 14px;
      border-bottom: 1px solid #edf2f7;
    }
    .player-item:hover {
      background: #edf2f7;
    }
    .player-item.selected {
      background: #ebf4ff;
      font-weight: 600;
      color: #2b6cb0;
    }

    .winner-radio-item {
      display: flex;
      align-items: center;
      padding: 8px;
      background: white;
      border-radius: 4px;
      margin-bottom: 6px;
      border: 1px solid #e2e8f0;
      cursor: pointer;
    }
    .winner-radio-item input[type="radio"] {
      width: auto;
      margin-right: 12px;
    }
    
    .checkbox-group {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px;
      background: #f7fafc;
      border-radius: 6px;
      cursor: pointer; /* Makes the hand icon appear */
      border: 1px solid #e2e8f0;
      transition: background 0.2s;
    }
    .checkbox-group:hover {
      background: #edf2f7; /* Subtle highlight on hover */
    }
    .checkbox-group label {
      margin: 0;
      cursor: pointer;
      flex-grow: 1; /* Ensures the text takes up all available space */
      font-weight: 600;
    }
    
    .preview-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .preview-scores {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .score-item {
      background: rgba(255,255,255,0.15);
      padding: 10px 12px;
      border-radius: 6px;
    }
    .score-value.positive { color: #48bb78; }
    .score-value.negative { color: #f56565; }
    
    .btn-row {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
    button {
      padding: 10px 24px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
    }
    .submit { background: #667eea; color: white; }
    .submit:disabled { background: #cbd5e0; cursor: not-allowed; }
    .cancel { background: #e2e8f0; }
    
    .error {
      color: #c53030;
      padding: 10px;
      background: #fff5f5;
      border-radius: 6px;
      display: none;
    }
    .hidden { display: none; }
    .step-badge {
      background: #e2e8f0; color: #4a5568; padding: 2px 8px; border-radius: 12px; margin-right: 8px;
    }
  </style>
</head>
<body>
  <h3>🀄 Add Game (Fan Scoring)</h3>
  
  <div class="instructions">
    <strong>📋 Quick Guide:</strong><br>
    1. Select exactly 4 participants.<br>
    2. Choose winner, enter Fan (3-13).<br>
    3. Toggle Self-Draw or select loser.
  </div>
  
  <div class="card" id="step1Card">
    <div class="form-group">
      <label><span class="step-badge">1</span>Select 4 Participants (<span id="countDisplay">0</span>/4)</label>
      
      <div id="selectedChips" class="selected-chips-container"></div>

      <input type="text" id="playerSearch" onkeyup="filterPlayerSearch()" placeholder="Search to filter players..." />
      <div id="playerList" class="player-list"></div>
    </div>
  </div>

  <div class="card hidden" id="step2Card">
    <div class="form-group">
      <label><span class="step-badge">2</span>Select Winner</label>
      <div id="selectedPlayersList" class="selected-players-container"></div>
    </div>
    
    <div class="form-group">
      <label><span class="step-badge">3</span>Fan Won (3-13+)</label>
      <input type="number" id="fan" min="3" max="13" placeholder="Enter fan (3-13)" oninput="processUpdates()" />
      <div id="fanInfo" style="font-size:12px; color:#718096; margin-top:5px;"></div>
    </div>
    
    <div class="form-group">
      <label><span class="step-badge">4</span>Self-Draw & Losers</label>
      <div class="checkbox-group" onclick="toggleSelfDraw()">
        <input type="checkbox" id="selfDraw" onchange="processUpdates()" onclick="event.stopPropagation()" />
        <label>Self-Draw (自摸)</label>
      </div>
    </div>
    
    <div class="form-group hidden" id="loserGroup">
      <label>Select Loser (Discarder)</label>
      <select id="loser" onchange="processUpdates()">
        <option value="">Select loser...</option>
      </select>
    </div>
  </div>
  
  <div class="preview-card hidden" id="previewCard">
    <div style="font-size:14px; margin-bottom:10px; font-weight:600;">📊 Final Score Preview</div>
    <div class="preview-scores" id="previewScores"></div>
  </div>
  
  <div class="error" id="error"></div>
  
  <div class="btn-row">
    <button class="cancel" onclick="google.script.host.close()">Cancel</button>
    <button class="submit" id="submitBtn" onclick="submitFanGame()" disabled>Add Game</button>
  </div>

<script>
  const allPlayers = ${JSON.stringify(players)};
  let selectedParticipants = [];
  let currentWinner = "";
  
  const fanToPoints = {
    3: 8, 4: 16, 5: 24, 6: 32, 7: 48, 8: 64, 
    9: 96, 10: 128, 11: 192, 12: 256, 13: 384
  };

  renderSearchList(allPlayers);

  function filterPlayerSearch() {
    const query = document.getElementById('playerSearch').value.toLowerCase();
    const filtered = allPlayers.filter(p => p.toLowerCase().includes(query));
    renderSearchList(filtered);
  }

  function toggleSelfDraw() {
    const cb = document.getElementById('selfDraw');
    cb.checked = !cb.checked; // Flip the state
    processUpdates(); // Update the UI/Scores
  }

  function renderSearchList(list) {
    const container = document.getElementById("playerList");
    container.innerHTML = "";
    list.forEach(p => {
      const isSelected = selectedParticipants.includes(p);
      const div = document.createElement("div");
      div.className = "player-item" + (isSelected ? " selected" : "");
      div.innerHTML = p + (isSelected ? " ✓" : "");
      div.onclick = () => toggleParticipant(p);
      container.appendChild(div);
    });
  }

  function toggleParticipant(player) {
    const idx = selectedParticipants.indexOf(player);
    if (idx > -1) {
      selectedParticipants.splice(idx, 1);
      if (currentWinner === player) currentWinner = "";
    } else {
      if (selectedParticipants.length >= 4) return;
      selectedParticipants.push(player);
    }
    
    renderChips();
    updateStepVisibility();
    filterPlayerSearch(); // Update list checkmarks
  }

  function renderChips() {
    const container = document.getElementById("selectedChips");
    container.innerHTML = selectedParticipants.map(p => \`
      <div class="chip">
        \${p}
        <span class="remove-btn" onclick="toggleParticipant('\${p}')">&times;</span>
      </div>
    \`).join('');
    document.getElementById('countDisplay').textContent = selectedParticipants.length;
  }

  function updateStepVisibility() {
    if (selectedParticipants.length === 4) {
      document.getElementById('step2Card').classList.remove('hidden');
      renderSelectedWinnerList();
    } else {
      document.getElementById('step2Card').classList.add('hidden');
      document.getElementById('previewCard').classList.add('hidden');
      document.getElementById('submitBtn').disabled = true;
    }
  }

  function renderSelectedWinnerList() {
    const container = document.getElementById("selectedPlayersList");
    container.innerHTML = "";
    selectedParticipants.forEach(p => {
      const label = document.createElement("label");
      label.className = "winner-radio-item";
      label.innerHTML = \`
        <input type="radio" name="winnerSelect" value="\${p}" \${currentWinner === p ? 'checked' : ''} onchange="setWinner('\${p}')" />
        \${p}
      \`;
      container.appendChild(label);
    });
    processUpdates();
  }

  function setWinner(player) {
    currentWinner = player;
    document.getElementById('loser').value = "";
    processUpdates();
  }

  function processUpdates() {
    if (selectedParticipants.length !== 4) return;

    const fan = parseInt(document.getElementById('fan').value) || 0;
    const isSelfDraw = document.getElementById('selfDraw').checked;
    
    if (fan >= 3 && fan <= 13) {
      const pts = fan === 13 ? 384 : (fanToPoints[fan] || 0);
      document.getElementById('fanInfo').textContent = \`Base Value = \${pts} points\`;
    } else {
      document.getElementById('fanInfo').textContent = '';
    }

    const nonWinners = selectedParticipants.filter(p => p !== currentWinner);

    if (isSelfDraw) {
      document.getElementById('loserGroup').classList.add('hidden');
    } else if (currentWinner) {
      document.getElementById('loserGroup').classList.remove('hidden');
      const loserSelect = document.getElementById('loser');
      const prevVal = loserSelect.value;
      loserSelect.innerHTML = '<option value="">Select loser...</option>' + 
        nonWinners.map(p => \`<option value="\${p}" \${p === prevVal ? 'selected' : ''}>\${p}</option>\`).join('');
    }

    renderPreview();
  }
  
  function renderPreview() {
    const fan = parseInt(document.getElementById('fan').value) || 0;
    const isSelfDraw = document.getElementById('selfDraw').checked;
    const loser = document.getElementById('loser').value;
    const btn = document.getElementById('submitBtn');
    
    if (!currentWinner || fan < 3 || (!isSelfDraw && !loser)) {
      document.getElementById('previewCard').classList.add('hidden');
      btn.disabled = true;
      return;
    }

    document.getElementById('previewCard').classList.remove('hidden');
    btn.disabled = false;
    
    const basePoints = fan >= 13 ? 384 : (fanToPoints[fan] || 0);
    const scores = {};
    const nonWinners = selectedParticipants.filter(p => p !== currentWinner);
    
    if (isSelfDraw) {
      scores[currentWinner] = basePoints * 3;
      nonWinners.forEach(l => scores[l] = -basePoints);
    } else {
      scores[currentWinner] = basePoints * 2;
      scores[loser] = -basePoints * 2;
      nonWinners.filter(p => p !== loser).forEach(p => scores[p] = 0);
    }
    
    document.getElementById('previewScores').innerHTML = Object.entries(scores).map(([player, score]) => \`
      <div class="score-item">
        <div style="font-size:12px; opacity:0.8;">\${player === currentWinner ? '👑' : '👤'} \${player}</div>
        <div class="score-value \${score > 0 ? 'positive' : (score < 0 ? 'negative' : '')}">\${score > 0 ? '+' : ''}\${score}</div>
      </div>
    \`).join('');
  }
  
  function submitFanGame() {
    const fan = parseInt(document.getElementById('fan').value) || 0;
    const isSelfDraw = document.getElementById('selfDraw').checked;
    const loser = document.getElementById('loser').value;
    const basePoints = fan >= 13 ? 384 : (fanToPoints[fan] || 0);
    const scores = {};
    
    if (isSelfDraw) {
      scores[currentWinner] = basePoints * 3;
      selectedParticipants.filter(p => p !== currentWinner).forEach(l => scores[l] = -basePoints);
    } else {
      scores[currentWinner] = basePoints * 2;
      scores[loser] = -basePoints * 2;
      selectedParticipants.filter(p => p !== currentWinner && p !== loser).forEach(p => scores[p] = 0);
    }
    
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('submitBtn').textContent = 'Saving...';
    google.script.run
      .withSuccessHandler(() => {
        document.body.innerHTML = '<div style="text-align:center;padding:60px;"><h2>✅ Game Added!</h2></div>';
        setTimeout(() => google.script.host.close(), 1500);
      })
      .withFailureHandler(err => {
        alert(err.message);
        document.getElementById('submitBtn').disabled = false;
        document.getElementById('submitBtn').textContent = 'Add Game';
      })
      .submitGame(scores);
  }
</script>
</body>
</html>
  `;
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

// ============================================================
// DASHBOARD FUNCTIONS
// ============================================================
function showDashboard() {
  const html = HtmlService.createHtmlOutputFromFile("dashboard")
    .setWidth(1200)
    .setHeight(800);
  SpreadsheetApp.getUi().showModalDialog(html, "Mahjong Dashboard");
}

function getGameData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Game Scores");
  const data = sheet.getDataRange().getValues();

  const headers = data[0].slice(1).filter(h => h !== "");
  const rows = data.slice(1, -1);

  let cumulative = headers.map(() => 0);

  const result = rows.map((row, i) => {
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
// NETWORK GRAPH FUNCTIONS
// ============================================================
function showNetwork() {
  const html = HtmlService.createHtmlOutputFromFile("network")
    .setWidth(1200)
    .setHeight(800);

  SpreadsheetApp.getUi().showModalDialog(html, "Player Network");
}

function getRawGameData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Game Scores");
  if (!sheet) return { players: [], rows: [] };

  const data = sheet.getDataRange().getValues();
  const players = data[0].slice(1).filter(h => h !== "");
  
  const rows = data.filter((row, index) => {
    if (index === 0) return false;
    
    const firstCell = String(row[0]).trim();
    
    if (firstCell.toLowerCase() === "totals" || firstCell === "" || firstCell.toLowerCase() === "total") {
      return false;
    }
    return true;
  });

  const sanitizedRows = rows.map(row => {
    return row.map(cell => {
      if (cell instanceof Date) return cell.toISOString();
      return (cell === undefined || cell === "") ? null : cell;
    });
  });

  return { players, rows: sanitizedRows };
}
