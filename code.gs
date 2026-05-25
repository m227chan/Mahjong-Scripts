// ============================================================
// ON OPEN — Custom Menu + Auto-open Sidebar
// ============================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🀄 Mahjong Club Menu")
    .addItem("🀄 Open Session", "showSessionSidebar")
    // .addItem("🀄 Add New Game", "showGameSidebar")
    .addItem("➕ Add New Player", "addNewPlayer")
    .addSeparator()
    .addItem("📊 View Dashboard", "showDashboard")
    .addItem("🌐 Player Network", "showNetwork")
    .addToUi();

  // Auto-open the game sidebar on spreadsheet load
  showSessionSidebar();
}

// Installable trigger version — set this up via:
// Extensions > Apps Script > Triggers > onOpen (installable)
// This runs with more permissions and can open sidebars on load.
function onOpenInstallable() {
  showSessionSidebar();
}

// ============================================================
// FEATURE: Add New Player (with icon selection)
// ============================================================
function addNewPlayer() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const leaderboardSheet = ss.getSheetByName("Leaderboard");
  const ui = SpreadsheetApp.getUi();

  // Gather existing icons to prevent duplicates
  const lbData = leaderboardSheet.getDataRange().getValues();
  const iconColIndex = 11; // Column L (0-indexed = 11)
  const existingIcons = lbData.slice(1).map(row => String(row[iconColIndex] || "").trim()).filter(i => i !== "");

  const html = buildAddPlayerDialog(existingIcons);
  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(480)
    .setHeight(420);

  ui.showModalDialog(htmlOutput, "➕ Add New Player");
}

function buildAddPlayerDialog(existingIcons) {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    body { padding: 24px; margin: 0; background: #f8f9fa; }
    h3 { margin: 0 0 20px; font-size: 18px; color: #1a202c; font-weight: 700; }

    .field { margin-bottom: 16px; }
    .field label {
      display: block; font-weight: 600; font-size: 12px;
      color: #4a5568; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;
    }
    input[type="text"] {
      width: 100%; padding: 10px 12px; border: 2px solid #e2e8f0;
      border-radius: 8px; font-size: 14px; transition: border-color 0.2s;
    }
    input[type="text"]:focus { outline: none; border-color: #667eea; }

    .icon-section {
      background: white; border-radius: 10px;
      border: 2px solid #e2e8f0; padding: 16px;
    }
    .icon-tabs {
      display: flex; gap: 8px; margin-bottom: 14px;
    }
    .tab-btn {
      flex: 1; padding: 8px; border: 2px solid #e2e8f0; border-radius: 6px;
      background: white; cursor: pointer; font-size: 13px; font-weight: 600;
      color: #718096; transition: all 0.2s;
    }
    .tab-btn.active { background: #667eea; color: white; border-color: #667eea; }

    .tab-panel { display: none; }
    .tab-panel.active { display: block; }

    .emoji-input-row {
      display: flex; gap: 8px; align-items: center;
    }
    .emoji-input-row input { flex: 1; font-size: 22px; text-align: center; }
    .preview-box {
      width: 48px; height: 48px; border: 2px solid #e2e8f0; border-radius: 8px;
      display: flex; align-items: center; justify-content: center; font-size: 26px;
      background: #f7fafc; flex-shrink: 0;
    }

    .quick-emojis {
      display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px;
    }
    .emoji-chip {
      width: 38px; height: 38px; font-size: 22px; display: flex;
      align-items: center; justify-content: center; border-radius: 6px;
      cursor: pointer; border: 2px solid transparent; transition: all 0.15s;
      background: #f7fafc;
    }
    .emoji-chip:hover { border-color: #667eea; background: #ebf4ff; }
    .emoji-chip.used { opacity: 0.3; cursor: not-allowed; pointer-events: none; }

    .upload-area {
      border: 2px dashed #e2e8f0; border-radius: 8px; padding: 20px;
      text-align: center; cursor: pointer; transition: all 0.2s; color: #718096; font-size: 13px;
    }
    .upload-area:hover { border-color: #667eea; background: #ebf4ff; }
    #fileInput { display: none; }
    #imgPreview { max-width: 80px; max-height: 80px; border-radius: 8px; margin-top: 8px; display: none; }

    .error {
      background: #fff5f5; color: #c53030; border-radius: 6px;
      padding: 10px; font-size: 13px; margin-top: 10px; display: none;
    }
    .btn-row { display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end; }
    button.submit { background: #667eea; color: white; border: none; border-radius: 8px; padding: 10px 24px; font-weight: 700; cursor: pointer; }
    button.cancel { background: #e2e8f0; color: #4a5568; border: none; border-radius: 8px; padding: 10px 24px; font-weight: 700; cursor: pointer; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
  </style>
</head>
<body>
  <h3>➕ Add New Player</h3>

  <div class="field">
    <label>Player Name</label>
    <input type="text" id="playerName" placeholder="Enter player name..." />
  </div>

  <div class="field">
    <label>Player Icon</label>
    <div class="icon-section">
      <div class="icon-tabs">
        <button class="tab-btn active" onclick="switchTab('emoji')">😀 Emoji</button>
        <button class="tab-btn" onclick="switchTab('image')">🖼️ Image Upload</button>
      </div>

      <div class="tab-panel active" id="tab-emoji">
        <div class="emoji-input-row">
          <input type="text" id="emojiInput" placeholder="Paste or type emoji..." oninput="updateEmojiPreview()" maxlength="4" />
          <div class="preview-box" id="emojiPreview">?</div>
        </div>
        <div class="quick-emojis" id="quickEmojis"></div>
      </div>

      <div class="tab-panel" id="tab-image">
        <div class="upload-area" onclick="document.getElementById('fileInput').click()">
          📁 Click to upload image (PNG, JPG, GIF)<br/>
          <img id="imgPreview" />
        </div>
        <input type="file" id="fileInput" accept="image/*" onchange="handleImageUpload(event)" />
      </div>
    </div>
  </div>

  <div class="error" id="error"></div>
  <div class="btn-row">
    <button class="cancel" onclick="google.script.host.close()">Cancel</button>
    <button class="submit" id="submitBtn" onclick="submitPlayer()">Add Player</button>
  </div>

<script>
  const existingIcons = ${JSON.stringify(existingIcons)};
  const quickEmojiList = [
    "🌸","🦊","🚀","🐉","🎸","🦅","🌙","⚡","🧋","🦁","🌷","🎯","🐈","💎","🛹",
    "🌴","🦋","🔥","🍀","🏀","🌊","🐺","🚴","🍓","☀️","🪐","🕊️","⚔️","🌈","🍋",
    "🎀","🦖","🎧","🧠","🏎️","👑","🐻","🦈","🌵","🎭","🦜","🐬","🌻","🎪","🦩"
  ];

  let currentTab = 'emoji';
  let uploadedImageBase64 = null;

  // Render quick emoji chips
  const container = document.getElementById('quickEmojis');
  quickEmojiList.forEach(e => {
    const chip = document.createElement('div');
    chip.className = 'emoji-chip' + (existingIcons.includes(e) ? ' used' : '');
    chip.textContent = e;
    chip.title = existingIcons.includes(e) ? 'Already in use' : 'Select ' + e;
    chip.onclick = () => {
      document.getElementById('emojiInput').value = e;
      updateEmojiPreview();
    };
    container.appendChild(chip);
  });

  function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach((b, i) => {
      b.classList.toggle('active', (i === 0 && tab === 'emoji') || (i === 1 && tab === 'image'));
    });
    document.getElementById('tab-emoji').classList.toggle('active', tab === 'emoji');
    document.getElementById('tab-image').classList.toggle('active', tab === 'image');
  }

  function updateEmojiPreview() {
    const val = document.getElementById('emojiInput').value.trim();
    document.getElementById('emojiPreview').textContent = val || '?';
  }

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      uploadedImageBase64 = ev.target.result;
      const img = document.getElementById('imgPreview');
      img.src = uploadedImageBase64;
      img.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }

  function submitPlayer() {
    const name = document.getElementById('playerName').value.trim();
    const errEl = document.getElementById('error');
    errEl.style.display = 'none';

    if (!name) { errEl.textContent = '⚠️ Player name cannot be empty.'; errEl.style.display = 'block'; return; }

    let icon = '';
    if (currentTab === 'emoji') {
      icon = document.getElementById('emojiInput').value.trim();
      if (!icon) { errEl.textContent = '⚠️ Please select or enter an emoji icon.'; errEl.style.display = 'block'; return; }
      if (existingIcons.includes(icon)) { errEl.textContent = '⚠️ That icon is already used by another player. Please choose a different one.'; errEl.style.display = 'block'; return; }
    } else {
      if (!uploadedImageBase64) { errEl.textContent = '⚠️ Please upload an image.'; errEl.style.display = 'block'; return; }
      icon = uploadedImageBase64;
    }

    document.getElementById('submitBtn').disabled = true;
    document.getElementById('submitBtn').textContent = 'Adding...';

    google.script.run
      .withSuccessHandler(() => {
        document.body.innerHTML = '<div style="text-align:center;padding:60px;font-family:sans-serif;"><h2>✅ Player Added!</h2><p style="color:#718096;">The leaderboard has been updated.</p></div>';
        google.script.host.close(); // close immediately, sidebar will refresh
      })
      .withFailureHandler(err => {
        errEl.textContent = '⚠️ ' + err.message;
        errEl.style.display = 'block';
        document.getElementById('submitBtn').disabled = false;
        document.getElementById('submitBtn').textContent = 'Add Player';
      })
      .submitNewPlayer(name, icon);
  }
</script>
</body>
</html>`;
}

function submitNewPlayer(playerName, icon) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const gamesSheet = ss.getSheetByName("Game Scores");
  const leaderboardSheet = ss.getSheetByName("Leaderboard");

  if (!playerName) throw new Error("Player name cannot be empty.");

  // --- Check for duplicate name ---
  const lastCol = gamesSheet.getLastColumn();
  const headers = gamesSheet.getRange(1, 1, 1, lastCol).getValues()[0];
  if (headers.includes(playerName)) throw new Error("A player with that name already exists.");

  // --- Update Game Scores sheet ---
  const lastDataRow = gamesSheet.getLastRow();
  gamesSheet.getRange(1, lastCol + 1).setValue(playerName);
  gamesSheet.getRange(lastDataRow, lastCol + 1).setFormula(`=SUM(Games[${playerName}])`);

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
    leaderboardSheet.getRange(r, 4).setFormula(`=RANK(C${r}, C$2:C$${newLbRow}, FALSE)`);
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
  leaderboardSheet.getRange(newLbRow, 8).setFormula(`=IF(G${newLbRow}=0, 0, F${newLbRow}/G${newLbRow})`);

  for (let r = 2; r <= newLbRow; r++) {
    leaderboardSheet.getRange(r, 9).setFormula(`=RANK(H${r}, H$2:H$${newLbRow}, FALSE)`);
  }

  leaderboardSheet.getRange(newLbRow, 10).setFormula(
    `=MAX(INDEX(INDIRECT("'Game Scores'!$2:$"&(COUNTA('Game Scores'!A:A)-1)), 0, MATCH(B${newLbRow}, 'Game Scores'!$1:$1, 0)))`
  );
  leaderboardSheet.getRange(newLbRow, 11).setFormula(
    `=MIN(INDEX(INDIRECT("'Game Scores'!$2:$"&(COUNTA('Game Scores'!A:A)-1)), 0, MATCH(B${newLbRow}, 'Game Scores'!$1:$1, 0)))`
  );

  // --- Set icon (col 12 = L) ---
  if (icon && icon.startsWith("data:image")) {
    // Image: insert as base64 string in the cell (Sheets doesn't support embedded images via script easily, store URL/note)
    leaderboardSheet.getRange(newLbRow, 12).setValue("📷");
    leaderboardSheet.getRange(newLbRow, 12).setNote("Image icon: " + icon.substring(0, 100) + "...");
  } else {
    leaderboardSheet.getRange(newLbRow, 12).setValue(icon);
  }

  SpreadsheetApp.flush();
  sortLeaderboard();
  // Reopen the game sidebar so the new player appears
  showSessionSidebar();
}

// ============================================================
// FEATURE: Add New Game (Fan Scoring System — Sidebar)
// ============================================================
function showGameSidebar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const gamesSheet = ss.getSheetByName("Game Scores");

  const lastCol = gamesSheet.getLastColumn();
  const headers = gamesSheet.getRange(1, 2, 1, lastCol - 1).getValues()[0];
  const players = headers.filter(h => h !== "");

  const html = buildFanGameSidebar(players);
  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setTitle("🀄 Add New Game");

  SpreadsheetApp.getUi().showSidebar(htmlOutput);
}

function buildFanGameSidebar(players) {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body { padding: 16px; margin: 0; background: #f8f9fa; font-size: 13px; }

    h2 {
      margin: 0 0 12px;
      font-size: 16px;
      font-weight: 800;
      color: #1a202c;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .card {
      background: white;
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 12px;
      border: 1px solid #e2e8f0;
    }

    .section-label {
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #718096;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .count-badge {
      background: #667eea;
      color: white;
      border-radius: 10px;
      padding: 1px 7px;
      font-size: 10px;
      font-weight: 700;
    }

    /* Chips */
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-bottom: 10px;
      min-height: 28px;
    }
    .chip {
      background: #667eea;
      color: white;
      border-radius: 12px;
      padding: 3px 10px;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .chip .x {
      cursor: pointer;
      opacity: 0.75;
      font-size: 14px;
      line-height: 1;
    }
    .chip .x:hover { opacity: 1; }

    /* Search + list */
    .search {
      width: 100%;
      padding: 8px 10px;
      border: 1.5px solid #e2e8f0;
      border-radius: 7px;
      font-size: 13px;
      margin-bottom: 6px;
      transition: border-color 0.2s;
    }
    .search:focus { outline: none; border-color: #667eea; }

    .player-list {
      max-height: 130px;
      overflow-y: auto;
      border: 1.5px solid #e2e8f0;
      border-radius: 7px;
    }
    .player-item {
      padding: 7px 10px;
      cursor: pointer;
      border-bottom: 1px solid #f0f0f0;
      font-size: 13px;
      color: #2d3748;
      transition: background 0.1s;
    }
    .player-item:last-child { border-bottom: none; }
    .player-item:hover { background: #f0f4ff; }
    .player-item.selected { background: #ebf4ff; color: #2b6cb0; font-weight: 600; }

    /* Radio buttons */
    .radio-list { display: flex; flex-direction: column; gap: 5px; }
    .radio-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 10px;
      border: 1.5px solid #e2e8f0;
      border-radius: 7px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .radio-item:hover { border-color: #667eea; background: #f0f4ff; }
    .radio-item input[type="radio"] { accent-color: #667eea; }
    .radio-item.checked { border-color: #667eea; background: #ebf4ff; font-weight: 600; }

    /* Number input */
    input[type="number"] {
      width: 100%;
      padding: 8px 10px;
      border: 1.5px solid #e2e8f0;
      border-radius: 7px;
      font-size: 14px;
      transition: border-color 0.2s;
    }
    input[type="number"]:focus { outline: none; border-color: #667eea; }

    .fan-hint {
      font-size: 11px;
      color: #a0aec0;
      margin-top: 4px;
    }

    /* Self-draw toggle */
    .toggle-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 10px;
      border: 1.5px solid #e2e8f0;
      border-radius: 7px;
      cursor: pointer;
      transition: all 0.15s;
      font-weight: 600;
    }
    .toggle-row:hover { border-color: #667eea; background: #f0f4ff; }
    .toggle-row.on { border-color: #48bb78; background: #f0fff4; }
    .toggle-row input[type="checkbox"] { accent-color: #48bb78; width: 15px; height: 15px; }

    /* Select */
    select {
      width: 100%;
      padding: 8px 10px;
      border: 1.5px solid #e2e8f0;
      border-radius: 7px;
      font-size: 13px;
      background: white;
      transition: border-color 0.2s;
    }
    select:focus { outline: none; border-color: #667eea; }

    /* Preview */
    .preview {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 12px;
    }
    .preview-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      opacity: 0.75;
      margin-bottom: 10px;
    }
    .preview-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .preview-item {
      background: rgba(255,255,255,0.15);
      border-radius: 7px;
      padding: 8px 10px;
    }
    .preview-name { font-size: 11px; opacity: 0.8; margin-bottom: 2px; }
    .preview-score { font-size: 15px; font-weight: 800; }
    .pos { color: #68d391; }
    .neg { color: #fc8181; }
    .zero { color: rgba(255,255,255,0.5); }

    /* Error */
    .error {
      background: #fff5f5;
      color: #c53030;
      border-radius: 7px;
      padding: 9px 10px;
      font-size: 12px;
      margin-bottom: 10px;
      display: none;
    }

    /* Submit */
    .submit-btn {
      width: 100%;
      padding: 12px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 9px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;
    }
    .submit-btn:hover:not(:disabled) { background: #5568d3; transform: translateY(-1px); }
    .submit-btn:disabled { background: #cbd5e0; cursor: not-allowed; transform: none; }

    .hidden { display: none !important; }
  </style>
</head>
<body>
  <h2>🀄 Add New Game</h2>

  <!-- Step 1: Select Players -->
  <div class="card">
    <div class="section-label">
      <span>1</span> Players
      <span class="count-badge" id="countBadge">0/4</span>
    </div>
    <div class="chips" id="chips"></div>
    <input class="search" id="search" placeholder="Search players…" oninput="filterList()" />
    <div class="player-list" id="playerList"></div>
  </div>

  <!-- Step 2: Winner + Fan (hidden until 4 selected) -->
  <div class="card hidden" id="step2">
    <div class="section-label"><span>2</span> Winner</div>
    <div class="radio-list" id="winnerList"></div>

    <div style="margin-top:12px;">
      <div class="section-label"><span>3</span> Fan (3–13)</div>
      <input type="number" id="fan" min="3" max="13" placeholder="e.g. 5" oninput="recalc()" />
      <div class="fan-hint" id="fanHint"></div>
    </div>

    <div style="margin-top:12px;">
      <div class="section-label"><span>4</span> Win Type</div>
      <div class="toggle-row" id="selfDrawRow" onclick="toggleSelfDraw()">
        <input type="checkbox" id="selfDraw" onclick="event.stopPropagation()" onchange="recalc()" />
        <span>Self-Draw &nbsp;(自摸)</span>
      </div>
    </div>

    <div class="hidden" id="loserGroup" style="margin-top:10px;">
      <div class="section-label"><span>5</span> Discarder (Loser)</div>
      <select id="loser" onchange="recalc()"><option value="">Select discarder…</option></select>
    </div>
  </div>

  <!-- Preview -->
  <div class="preview hidden" id="preview">
    <div class="preview-title">📊 Score Preview</div>
    <div class="preview-grid" id="previewGrid"></div>
  </div>

  <div class="error" id="error"></div>

  <button class="submit-btn" id="submitBtn" onclick="submitGame()" disabled>Add Game</button>

<script>
  const allPlayers = ${JSON.stringify(players)};
  let selected = [];
  let currentWinner = "";

  const fanToPoints = { 3:8, 4:16, 5:24, 6:32, 7:48, 8:64, 9:96, 10:128, 11:192, 12:256, 13:384 };

  // Init
  renderList(allPlayers);

  function filterList() {
    const q = document.getElementById('search').value.toLowerCase();
    renderList(allPlayers.filter(p => p.toLowerCase().includes(q)));
  }

  function renderList(list) {
    const el = document.getElementById('playerList');
    el.innerHTML = list.map(p =>
      \`<div class="player-item\${selected.includes(p) ? ' selected' : ''}" onclick="togglePlayer('\${p}')">\${selected.includes(p) ? '✓ ' : ''}\${p}</div>\`
    ).join('');
  }

  function togglePlayer(p) {
    const idx = selected.indexOf(p);
    if (idx > -1) {
      selected.splice(idx, 1);
      if (currentWinner === p) currentWinner = "";
    } else {
      if (selected.length >= 4) return;
      selected.push(p);
    }
    renderChips();
    filterList();
    updateStep2();
  }

  function renderChips() {
    document.getElementById('chips').innerHTML = selected.map(p =>
      \`<div class="chip">\${p}<span class="x" onclick="togglePlayer('\${p}')">&times;</span></div>\`
    ).join('');
    document.getElementById('countBadge').textContent = selected.length + '/4';
  }

  function updateStep2() {
    const show = selected.length === 4;
    document.getElementById('step2').classList.toggle('hidden', !show);
    if (!show) {
      document.getElementById('preview').classList.add('hidden');
      document.getElementById('submitBtn').disabled = true;
      return;
    }
    renderWinnerList();
    recalc();
  }

  function renderWinnerList() {
    document.getElementById('winnerList').innerHTML = selected.map(p => \`
      <label class="radio-item\${currentWinner === p ? ' checked' : ''}" onclick="setWinner('\${p}')">
        <input type="radio" name="w" value="\${p}" \${currentWinner === p ? 'checked' : ''} onclick="event.stopPropagation()" onchange="setWinner('\${p}')" />
        \${p}
      </label>
    \`).join('');
  }

  function setWinner(p) {
    currentWinner = p;
    renderWinnerList();
    document.getElementById('loser').value = '';
    recalc();
  }

  function toggleSelfDraw() {
    const cb = document.getElementById('selfDraw');
    cb.checked = !cb.checked;
    const row = document.getElementById('selfDrawRow');
    row.classList.toggle('on', cb.checked);
    recalc();
  }

  function recalc() {
    const fan = parseInt(document.getElementById('fan').value) || 0;
    const isSelfDraw = document.getElementById('selfDraw').checked;
    const nonWinners = selected.filter(p => p !== currentWinner);

    if (fan >= 3 && fan <= 13) {
      document.getElementById('fanHint').textContent = 'Base = ' + (fan >= 13 ? 384 : fanToPoints[fan]) + ' pts';
    } else {
      document.getElementById('fanHint').textContent = '';
    }

    if (isSelfDraw) {
      document.getElementById('loserGroup').classList.add('hidden');
    } else if (currentWinner) {
      document.getElementById('loserGroup').classList.remove('hidden');
      const prev = document.getElementById('loser').value;
      document.getElementById('loser').innerHTML =
        '<option value="">Select discarder…</option>' +
        nonWinners.map(p => \`<option value="\${p}"\${p === prev ? ' selected' : ''}>\${p}</option>\`).join('');
    }

    renderPreview();
  }

  function renderPreview() {
    const fan = parseInt(document.getElementById('fan').value) || 0;
    const isSelfDraw = document.getElementById('selfDraw').checked;
    const loser = document.getElementById('loser').value;
    const btn = document.getElementById('submitBtn');

    if (!currentWinner || fan < 3 || fan > 13 || (!isSelfDraw && !loser)) {
      document.getElementById('preview').classList.add('hidden');
      btn.disabled = true;
      return;
    }

    const base = fan >= 13 ? 384 : fanToPoints[fan];
    const scores = {};
    const nonW = selected.filter(p => p !== currentWinner);

    if (isSelfDraw) {
      scores[currentWinner] = base * 3;
      nonW.forEach(l => scores[l] = -base);
    } else {
      scores[currentWinner] = base * 2;
      scores[loser] = -base * 2;
      nonW.filter(p => p !== loser).forEach(p => scores[p] = 0);
    }

    document.getElementById('previewGrid').innerHTML = Object.entries(scores).map(([p, s]) => \`
      <div class="preview-item">
        <div class="preview-name">\${p === currentWinner ? '👑' : '👤'} \${p}</div>
        <div class="preview-score \${s > 0 ? 'pos' : s < 0 ? 'neg' : 'zero'}">\${s > 0 ? '+' : ''}\${s}</div>
      </div>
    \`).join('');

    document.getElementById('preview').classList.remove('hidden');
    btn.disabled = false;
    btn._scores = scores;
  }

  function submitGame() {
    const btn = document.getElementById('submitBtn');
    const scores = btn._scores;
    if (!scores) return;

    btn.disabled = true;
    btn.textContent = 'Saving…';
    document.getElementById('error').style.display = 'none';

    google.script.run
      .withSuccessHandler(() => {
        // Reset for next game
        selected = [];
        currentWinner = '';
        document.getElementById('fan').value = '';
        document.getElementById('selfDraw').checked = false;
        document.getElementById('selfDrawRow').classList.remove('on');
        document.getElementById('loser').value = '';
        renderChips();
        renderList(allPlayers);
        document.getElementById('step2').classList.add('hidden');
        document.getElementById('preview').classList.add('hidden');
        btn.disabled = false;
        btn.textContent = '✅ Game Added! Add Another';
        setTimeout(() => { btn.textContent = 'Add Game'; }, 3000);
      })
      .withFailureHandler(err => {
        document.getElementById('error').textContent = '⚠️ ' + err.message;
        document.getElementById('error').style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Add Game';
      })
      .submitGame(scores);
  }
</script>
</body>
</html>`;
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

  // Sort leaderboard after game is added
  SpreadsheetApp.flush()
  sortLeaderboard();
}

// ============================================================
// HELPER: Sort Leaderboard by Total Points descending
// ============================================================
function sortLeaderboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const leaderboardSheet = ss.getSheetByName("Leaderboard");
  
  SpreadsheetApp.flush();

  const lastRow = leaderboardSheet.getLastRow();
  const lastCol = leaderboardSheet.getLastColumn();

  if (lastRow <= 2) return;

  // Sort only the data rows (row 2 onward), by column C (Total Points) descending
  // Column 3 = Total Points
  leaderboardSheet
    .getRange(2, 1, lastRow - 1, lastCol)
    .sort({ column: 3, ascending: false });
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
  SpreadsheetApp.getUi().showModalDialog(html, "📊 Mahjong Dashboard");
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

    return { time, cumulative: [...cumulative], ranks };
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
  SpreadsheetApp.getUi().showModalDialog(html, "🌐 Player Network");
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
