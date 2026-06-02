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
    .addSeparator()
    .addItem("⚡ Recalculate ELO", "recalculateElo")
    .addItem("📖 How ELO Works", "showEloInfo")
    // .addItem("🔄 Build ELO History (run once)", "buildEloHistory")
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
// FEATURE: ELO Info + Analytics Popup
// ============================================================
function showEloInfo() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const lbSheet = ss.getSheetByName('Leaderboard');
  const lbData = lbSheet.getDataRange().getValues();

  // Extract ELO columns (M=13, N=14, O=15, P=16 → 0-indexed 12,13,14,15)
  // Also grab player name (col B = index 1)
  const players = [];
  for (let i = 1; i < lbData.length; i++) {
    const row = lbData[i];
    const name = String(row[1] || '').trim();
    const rating = Number(row[12]);
    const rank   = row[13];
    const peak   = Number(row[14]);
    const last5  = Number(row[15]);
    const games  = Number(row[4]); // Games Played col E = index 4
    if (!name || isNaN(rating) || rating === 0) continue;
    players.push({ name, rating, rank, peak, last5, games });
  }

  const playersJson = JSON.stringify(players);

  const html = `<!DOCTYPE html>
<html>
<head>
<style>
*{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}
body{background:#f8f9fa;color:#1a202c;font-size:14px;line-height:1.6;}

.header{background:#1a202c;color:white;padding:28px 32px 24px;}
.header h1{font-size:22px;font-weight:700;margin-bottom:4px;}
.header p{font-size:14px;opacity:0.6;}

.tabs{display:flex;background:#fff;border-bottom:1px solid #e2e8f0;padding:0 32px;}
.tab{padding:14px 20px;font-size:13px;font-weight:600;cursor:pointer;border-bottom:2px solid transparent;color:#718096;transition:all 0.15s;}
.tab.active{color:#1a202c;border-bottom-color:#667eea;}

.panel{display:none;padding:28px 32px;}
.panel.active{display:block;}

/* --- HOW IT WORKS --- */
.section{margin-bottom:32px;}
.section h2{font-size:16px;font-weight:700;margin-bottom:12px;color:#1a202c;}
.section p{color:#4a5568;font-size:14px;margin-bottom:10px;}

.formula-block{background:#1a202c;color:#e2e8f0;border-radius:10px;padding:20px 24px;font-family:monospace;font-size:13px;line-height:2;margin:12px 0;}
.formula-block .label{color:#a0aec0;font-family:-apple-system,sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:8px;}
.hl{color:#81e6d9;}
.hl2{color:#fbd38d;}
.hl3{color:#fc8181;}
.hl4{color:#90cdf4;}

.var-table{width:100%;border-collapse:collapse;margin:12px 0;}
.var-table th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#718096;padding:6px 10px;border-bottom:2px solid #e2e8f0;}
.var-table td{padding:8px 10px;font-size:13px;border-bottom:1px solid #f0f0f0;vertical-align:top;}
.var-table td:first-child{font-family:monospace;color:#667eea;font-weight:700;white-space:nowrap;}
.var-table tr:last-child td{border-bottom:none;}

.k-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:12px 0;}
.k-card{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:14px;text-align:center;}
.k-card .tier{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#718096;margin-bottom:4px;}
.k-card .kval{font-size:26px;font-weight:800;color:#667eea;}
.k-card .games{font-size:12px;color:#a0aec0;margin-top:2px;}

.callout{border-left:3px solid #667eea;background:#f0f4ff;border-radius:0 8px 8px 0;padding:14px 16px;margin:12px 0;}
.callout.warn{border-left-color:#ed8936;background:#fffaf0;}
.callout.cutoff{border-left-color:#e53e3e;background:#fff5f5;}
.callout strong{color:#1a202c;}

.steps{counter-reset:step;}
.step{display:flex;gap:14px;margin-bottom:16px;align-items:flex-start;}
.step-num{background:#667eea;color:white;border-radius:50%;width:26px;height:26px;min-width:26px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;margin-top:1px;}
.step-body{font-size:13px;color:#4a5568;}
.step-body strong{color:#1a202c;}

/* --- ANALYTICS --- */
.stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:24px;}
.stat-card{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:14px;}
.stat-card .slabel{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#718096;margin-bottom:4px;}
.stat-card .sval{font-size:20px;font-weight:800;color:#1a202c;}
.stat-card .ssub{font-size:11px;color:#a0aec0;margin-top:2px;}

.chart-section{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:16px;}
.chart-section h3{font-size:13px;font-weight:700;color:#4a5568;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:16px;}

.bar-row{display:flex;align-items:center;gap:10px;margin-bottom:7px;}
.bar-row .bname{font-size:12px;color:#4a5568;width:88px;text-align:right;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.bar-wrap{flex:1;background:#f0f4ff;border-radius:4px;height:20px;overflow:hidden;}
.bar-fill{height:100%;border-radius:4px;display:flex;align-items:center;padding-left:6px;font-size:11px;font-weight:700;color:white;transition:width 0.4s ease;}
.bar-val{font-size:12px;color:#718096;margin-left:6px;flex-shrink:0;}

.spark-row{display:flex;align-items:center;gap:10px;margin-bottom:8px;}
.spark-row .bname{font-size:12px;color:#4a5568;width:88px;text-align:right;flex-shrink:0;}
.pill{display:inline-block;border-radius:12px;padding:3px 10px;font-size:12px;font-weight:700;}
.pill.pos{background:#c6f6d5;color:#22543d;}
.pill.neg{background:#fed7d7;color:#742a2a;}
.pill.neu{background:#e2e8f0;color:#4a5568;}

.gap-bar-row{display:flex;align-items:center;gap:8px;margin-bottom:7px;}
.gap-label{font-size:12px;color:#4a5568;width:88px;text-align:right;flex-shrink:0;}
.gap-bar-wrap{flex:1;position:relative;height:20px;}
.gap-bar-fill{position:absolute;height:100%;border-radius:4px;}
.gap-val{font-size:12px;color:#718096;width:40px;text-align:right;flex-shrink:0;}
</style>
</head>
<body>
<div class="header">
  <h1>📊 ELO Rating System</h1>
  <p>Mahjong Messiahs &mdash; How ratings are calculated &amp; current standings</p>
</div>

<div class="tabs">
  <div class="tab active" onclick="switchTab('how')">How it works</div>
  <div class="tab" onclick="switchTab('analytics')">Analytics</div>
</div>

<!-- ===== HOW IT WORKS ===== -->
<div id="panel-how" class="panel active">

  <div class="section">
    <h2>What is ELO?</h2>
    <p>ELO is a zero-sum rating system — every point one player gains is lost by another. After each game, ratings shift based on <strong>who you beat</strong> and <strong>how surprising that result was</strong>. Beating a highly-rated player moves your rating more than beating a weaker one.</p>
  </div>

  <div class="section">
    <h2>Core formula</h2>
    <p>After each game, for every pair of players (A vs B):</p>
    <div class="formula-block">
      <span class="label">Step 1 — expected score (how likely A was to beat B)</span>
      <span class="hl">E<sub>A</sub></span> = 1 / (1 + 10 <sup>(<span class="hl2">R<sub>B</sub></span> − <span class="hl2">R<sub>A</sub></span>) / <span class="hl3">400</span></sup>)
    </div>
    <div class="formula-block">
      <span class="label">Step 2 — rating change</span>
      ΔR<sub>A</sub> += <span class="hl4">K</span> × <span class="hl3">M</span> × (<span class="hl">S<sub>A</sub></span> − <span class="hl">E<sub>A</sub></span>)
    </div>

    <table class="var-table">
      <tr><th>Variable</th><th>Meaning</th></tr>
      <tr><td>R<sub>A</sub>, R<sub>B</sub></td><td>Current ratings of player A and B before the game</td></tr>
      <tr><td>E<sub>A</sub></td><td>Probability A was expected to beat B, from 0 to 1. Equal ratings → E = 0.5 exactly</td></tr>
      <tr><td>S<sub>A</sub></td><td>Actual result: <strong>1.0</strong> = win, <strong>0.5</strong> = draw (equal score), <strong>0.0</strong> = loss</td></tr>
      <tr><td>K</td><td>K-factor — controls how fast ratings move (see below)</td></tr>
      <tr><td>M</td><td>Margin of victory multiplier — bigger score gaps = bigger shifts (see below)</td></tr>
      <tr><td>400</td><td>Scaling constant — inherited from chess (see below)</td></tr>
    </table>

    <p>All pairings in a game are evaluated simultaneously. Each player's total delta is the sum of their individual pairwise results against every other player at the table.</p>
  </div>

  <div class="section">
    <h2>Why 400?</h2>
    <p>The 400 is a <strong>scaling constant</strong> — mathematically arbitrary, chosen by convention, and inherited directly from chess. It controls how "spread out" the rating scale is: specifically, how large a rating gap needs to be before one player is considered a near-certain winner.</p>

    <div class="formula-block">
      <span class="label">What different rating gaps mean with divisor = 400</span>
      Δ100 pts  →  <span class="hl">~64%</span> win probability
      Δ200 pts  →  <span class="hl">~76%</span> win probability
      Δ400 pts  →  <span class="hl">~91%</span> win probability
      Δ800 pts  →  <span class="hl">~99%</span> win probability
    </div>

    <p>Arpad Elo chose 400 in the 1960s so that a <strong>400-point gap meant roughly 10:1 odds</strong> — a convenient anchor that kept ratings in a readable 1000–2000 range. The entire chess world standardised on it, and every other system (video games, sports, esports) adopted it to stay familiar and comparable.</p>

    <div class="callout">
      <strong>Does the 400 affect your club's rankings?</strong> Not at all — since it applies equally to everyone, all relative rankings are identical regardless of what constant you use. The only practical effect would be on how many points exchange hands per game. If ratings bunch too tightly or spread too far over time, tuning the <strong>K-factors</strong> is a far more targeted lever than changing the 400.
    </div>

    <p>If the divisor were changed to <strong>200</strong>, a 100-point gap would already imply ~76% confidence instead of 64% — ratings would feel more decisive. At <strong>800</strong>, you'd need a 400-point gap just to reach 91% — far more forgiving. The 400 sits in the middle: sensitive enough to be meaningful, forgiving enough that normal variance doesn't produce wild swings.</p>
  </div>

  <div class="section">
    <h2>K-factor tiers</h2>
    <p>New players move faster so they find their true level quickly. Veterans settle into more stable ratings.</p>
    <div class="k-grid">
      <div class="k-card"><div class="tier">New</div><div class="kval">40</div><div class="games">0–19 games</div></div>
      <div class="k-card"><div class="tier">Mid</div><div class="kval">20</div><div class="games">20–49 games</div></div>
      <div class="k-card"><div class="tier">Veteran</div><div class="kval">16</div><div class="games">50+ games</div></div>
    </div>
    <div class="callout">
      <strong>Pairwise K averaging:</strong> When two players with different K-factors meet, their shared K is <code>(K<sub>A</sub> + K<sub>B</sub>) / 2</code>. This keeps the system zero-sum — points won always equal points lost.
    </div>
  </div>

  <div class="section">
    <h2>Margin of victory multiplier (M)</h2>
    <p>Winning by more points rewards you more — but with diminishing returns to avoid runaway inflation.</p>
    <div class="formula-block">
      <span class="label">Continuous multiplier</span>
      <span class="hl3">M</span> = 1.0 + log<sub>10</sub>(1 + |score<sub>A</sub> − score<sub>B</sub>| / 32)
    </div>
    <table class="var-table">
      <tr><th>Score gap</th><th>Multiplier M</th><th>Effect</th></tr>
      <tr><td>0 (draw)</td><td>1.00×</td><td>No amplification</td></tr>
      <tr><td>32</td><td>~1.30×</td><td>Typical close game</td></tr>
      <tr><td>96</td><td>~1.58×</td><td>Solid win</td></tr>
      <tr><td>256</td><td>~1.95×</td><td>Dominant win</td></tr>
      <tr><td>384+</td><td>~2.08×</td><td>Maximum spread (capped naturally by log)</td></tr>
    </table>
  </div>

  <div class="section">
    <h2>Starting rating &amp; reset</h2>
    <div class="callout">
      All players start at <strong>1500</strong>. Ratings are recalculated from scratch on every run, processing all eligible games in chronological order.
    </div>
  </div>

  <div class="section">
    <h2>The April 25, 2026 cutoff</h2>
    <div class="callout cutoff">
      <strong>Why a cutoff?</strong> Before April 25 2026, the score sheet recorded <strong>0</strong> for every player not present in a game — making it impossible to distinguish "played and scored zero" from "wasn't there." Using those 0s as participation signals would unfairly penalise winners by treating absent players as opponents they drew against.
    </div>
    <br>
    <p>The cutoff is handled in two stages:</p>
    <div class="steps">
      <div class="step"><div class="step-num">1</div><div class="step-body"><strong>Pre-cutoff (before Apr 25):</strong> Only <em>non-zero</em> scores count as participation. These games increment each player's <code>gamesPlayed</code> counter — which sets their K-factor tier — but produce <strong>no ELO delta</strong>. Ratings are unaffected.</div></div>
      <div class="step"><div class="step-num">2</div><div class="step-body"><strong>Post-cutoff (Apr 25 onward):</strong> Blank cells mean absent; 0 is a valid score. Full pairwise ELO calculation runs normally. Players enter this era already in the correct K-factor tier based on their pre-cutoff game history.</div></div>
    </div>
    <div class="callout warn">
      <strong>What this means for veterans:</strong> A player like Monica with 98 games enters the ELO era at K=16 (veteran), so her rating moves slowly and reflects only post-cutoff performance. A genuinely new player still gets K=40 and will find their level faster.
    </div>
  </div>

  <div class="section">
    <h2>Tracked metrics</h2>
    <table class="var-table">
      <tr><th>Column</th><th>What it means</th></tr>
      <tr><td>ELO Rating</td><td>Current rating after all post-cutoff games. Starts at 1500.</td></tr>
      <tr><td>ELO Rank</td><td>Ordinal rank by current rating. Only players with at least one post-cutoff game are ranked.</td></tr>
      <tr><td>ELO Peak</td><td>The highest rating the player has ever reached. Shows career ceiling, not just current form.</td></tr>
      <tr><td>ELO Δ Last 5</td><td>Sum of rating changes across the last 5 games. Positive = on a hot streak. Negative = cold streak.</td></tr>
    </table>
  </div>

</div>

<!-- ===== ANALYTICS ===== -->
<div id="panel-analytics" class="panel">
  <div id="analytics-content">Loading…</div>
</div>

<script>
const players = ${playersJson};

function switchTab(t) {
  document.querySelectorAll('.tab').forEach((el,i) => el.classList.toggle('active', (i===0&&t==='how')||(i===1&&t==='analytics')));
  document.getElementById('panel-how').classList.toggle('active', t==='how');
  document.getElementById('panel-analytics').classList.toggle('active', t==='analytics');
  if (t === 'analytics') renderAnalytics();
}

let analyticsRendered = false;
function renderAnalytics() {
  if (analyticsRendered) return;
  analyticsRendered = true;

  const sorted = [...players].sort((a,b) => b.rating - a.rating);
  const maxRating = sorted[0].rating;
  const minRating = sorted[sorted.length-1].rating;
  const avgRating = Math.round(players.reduce((s,p)=>s+p.rating,0)/players.length);
  const maxPeak = Math.max(...players.map(p=>p.peak));
  const hottest = [...players].filter(p=>p.last5>0).sort((a,b)=>b.last5-a.last5)[0];
  const coldest = [...players].filter(p=>p.last5<0).sort((a,b)=>a.last5-b.last5)[0];

  const top10 = sorted.slice(0,10);
  const barMax = top10[0].rating;
  const barMin = 1400;

  // Peak vs current — top 10 by peak drop
  const peakDrop = [...players]
    .map(p=>({name:p.name,drop:p.peak-p.rating,peak:p.peak,rating:p.rating}))
    .sort((a,b)=>b.drop-a.drop).slice(0,8);

  // Momentum — sorted by last5
  const momentum = [...players].sort((a,b)=>b.last5-a.last5);
  const momTop5 = momentum.slice(0,5);
  const momBot5 = momentum.slice(-5).reverse();

  let html = '';

  // Stat cards
  html += '<div class="stat-grid">';
  html += statCard('Highest rated', sorted[0].name, sorted[0].rating + ' ELO');
  html += statCard('Average ELO', avgRating.toString(), players.length + ' players ranked');
  html += statCard('All-time peak', players.find(p=>p.peak===maxPeak)?.name || '—', maxPeak + ' ELO');
  html += statCard('Hottest streak', hottest ? hottest.name : '—', hottest ? '+'+Math.round(hottest.last5)+' last 5' : '—');
  html += '</div>';

  // Top 10 ratings bar chart
  html += '<div class="chart-section"><h3>Top 10 current ratings</h3>';
  top10.forEach(p => {
    const pct = Math.max(4, Math.round(((p.rating - barMin) / (barMax - barMin + 1)) * 100));
    html += '<div class="bar-row">';
    html += '<div class="bname" title="'+p.name+'">'+p.name+'</div>';
    html += '<div class="bar-wrap"><div class="bar-fill" style="width:'+pct+'%;background:#667eea;">'+p.rating+'</div></div>';
    html += '</div>';
  });
  html += '</div>';

  // Peak vs Current
  html += '<div class="chart-section"><h3>Biggest peak-to-current drops</h3>';
  html += '<p style="font-size:12px;color:#a0aec0;margin-bottom:14px;">How far each player has fallen from their highest-ever rating</p>';
  const dropMax = peakDrop[0].drop || 1;
  peakDrop.forEach(p => {
    const pct = Math.max(2, Math.round((p.drop / dropMax) * 100));
    const col = p.drop > 100 ? '#e53e3e' : p.drop > 50 ? '#ed8936' : '#48bb78';
    html += '<div class="bar-row">';
    html += '<div class="bname" title="'+p.name+'">'+p.name+'</div>';
    html += '<div class="bar-wrap"><div class="bar-fill" style="width:'+pct+'%;background:'+col+';">−'+Math.round(p.drop)+'</div></div>';
    html += '<div class="bar-val">'+p.rating+' / '+p.peak+'</div>';
    html += '</div>';
  });
  html += '</div>';

  // Momentum
  html += '<div class="chart-section"><h3>Momentum — ELO Δ last 5 games</h3>';
  html += '<p style="font-size:12px;color:#a0aec0;margin-bottom:14px;">Players on the hottest and coldest streaks right now</p>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">';
  html += '<div><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#22543d;margin-bottom:10px;">Rising</div>';
  momTop5.forEach(p => {
    html += '<div class="spark-row"><div class="bname" title="'+p.name+'">'+p.name+'</div>';
    html += '<span class="pill pos">+'+Math.round(p.last5)+'</span></div>';
  });
  html += '</div><div><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#742a2a;margin-bottom:10px;">Falling</div>';
  momBot5.forEach(p => {
    html += '<div class="spark-row"><div class="bname" title="'+p.name+'">'+p.name+'</div>';
    html += '<span class="pill neg">'+Math.round(p.last5)+'</span></div>';
  });
  html += '</div></div></div>';

  // Full standings
  html += '<div class="chart-section"><h3>Full standings</h3>';
  html += '<table style="width:100%;border-collapse:collapse;font-size:12px;">';
  html += '<tr style="border-bottom:2px solid #e2e8f0;"><th style="text-align:left;padding:6px 8px;color:#718096;font-weight:700;">Rank</th><th style="text-align:left;padding:6px 8px;color:#718096;font-weight:700;">Player</th><th style="text-align:right;padding:6px 8px;color:#718096;font-weight:700;">Rating</th><th style="text-align:right;padding:6px 8px;color:#718096;font-weight:700;">Peak</th><th style="text-align:right;padding:6px 8px;color:#718096;font-weight:700;">Δ Last 5</th></tr>';
  sorted.forEach((p,i) => {
    const d = Math.round(p.last5);
    const dCol = d > 0 ? '#22543d' : d < 0 ? '#742a2a' : '#718096';
    const dPfx = d > 0 ? '+' : '';
    html += '<tr style="border-bottom:1px solid #f0f0f0;">';
    html += '<td style="padding:6px 8px;color:#a0aec0;">'+(i+1)+'</td>';
    html += '<td style="padding:6px 8px;font-weight:'+(i<3?'700':'400')+';">'+p.name+'</td>';
    html += '<td style="padding:6px 8px;text-align:right;font-weight:700;">'+p.rating+'</td>';
    html += '<td style="padding:6px 8px;text-align:right;color:#a0aec0;">'+p.peak+'</td>';
    html += '<td style="padding:6px 8px;text-align:right;color:'+dCol+';font-weight:600;">'+dPfx+d+'</td>';
    html += '</tr>';
  });
  html += '</table></div>';

  document.getElementById('analytics-content').innerHTML = html;
}

function statCard(label, value, sub) {
  return '<div class="stat-card"><div class="slabel">'+label+'</div><div class="sval">'+value+'</div><div class="ssub">'+sub+'</div></div>';
}
</script>
</body>
</html>`;

  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(820)
    .setHeight(680);

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '📊 ELO Rating System');
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
        document.body.innerHTML = '<div style="text-align:center;padding:60px;font-family:sans-serif;"><h2>Player Added!</h2><p style="color:#718096;">The leaderboard has been updated.</p></div>';
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
        btn.textContent = 'Game Added! Add Another';
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
  const ss         = SpreadsheetApp.getActiveSpreadsheet();
  const gamesSheet = ss.getSheetByName("Game Scores");
 
  // ── 1. Read header + find Totals row ──────────────────────
  const allData   = gamesSheet.getDataRange().getValues();
  const headerRow = allData[0];
  const numCols   = headerRow.length;
 
  let totalsRowIdx = -1;
  for (let i = allData.length - 1; i >= 1; i--) {
    if (String(allData[i][0]).trim().toLowerCase() === 'totals') {
      totalsRowIdx = i;
      break;
    }
  }
 
  // ── 2. Build and insert new game row ──────────────────────
  const tz       = ss.getSpreadsheetTimeZone();
  const datetime = Utilities.formatDate(new Date(), tz, "dd/MM/yyyy HH:mm:ss");
  const newRow   = new Array(numCols).fill('');
  newRow[0] = datetime;
  for (let c = 1; c < numCols; c++) {
    const name = String(headerRow[c] || '').trim();
    if (name && scores.hasOwnProperty(name)) newRow[c] = scores[name];
  }
 
  const totalsSheetRow = totalsRowIdx + 1;
  gamesSheet.insertRowBefore(totalsSheetRow);
  gamesSheet.getRange(totalsSheetRow, 1, 1, numCols).setValues([newRow]);
 
  // ── 3. Incremental ELO (replaces full recalculateElo) ─────
  applyIncrementalElo_(scores);
}

// ============================================================
// HELPER — Delete blank/ghost rows from Leaderboard
// ============================================================
function cleanLeaderboardGhostRows() {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const lbSheet = ss.getSheetByName("Leaderboard");
  const lastRow = lbSheet.getLastRow();
  if (lastRow < 2) return;

  const colBVals = lbSheet.getRange(2, 2, lastRow - 1, 1).getValues();
  for (let r = lastRow; r >= 2; r--) {
    if (String(colBVals[r - 2][0]).trim() === "") {
      lbSheet.deleteRow(r);
    }
  }
}

// ============================================================
// FEATURE: Add New Player
// ============================================================
function submitNewPlayer(playerName, icon) {
  const ss         = SpreadsheetApp.getActiveSpreadsheet();
  const gamesSheet = ss.getSheetByName("Game Scores");
  const lbSheet    = ss.getSheetByName("Leaderboard");
 
  if (!playerName) throw new Error("Player name cannot be empty.");
 
  // ── Duplicate check (single read) ─────────────────────────
  const gsAllData  = gamesSheet.getDataRange().getValues();
  const gsHeaderRow = gsAllData[0];
  if (gsHeaderRow.includes(playerName)) {
    throw new Error("A player with that name already exists.");
  }
 
  // ── Clean ghost rows ──────────────────────────────────────
  cleanLeaderboardGhostRows();
 
  // ── STEP 1: Add column to Game Scores ────────────────────
  const newPlayerCol   = gamesSheet.getLastColumn() + 1;
  gamesSheet.getRange(1, newPlayerCol).setValue(playerName);
 
  // Find Totals row from the already-read data
  let totalsRowNum = -1;
  for (let i = 0; i < gsAllData.length; i++) {
    if (String(gsAllData[i][0]).trim().toLowerCase() === 'totals') {
      totalsRowNum = i + 1; // 1-based
      break;
    }
  }
  if (totalsRowNum > 0) {
    const colLetter = columnToLetter(newPlayerCol);
    gamesSheet.getRange(totalsRowNum, newPlayerCol)
      .setFormula(`=SUM(Games[${playerName}])`);
  }
 
  // ── STEP 2: Append new Leaderboard row (BATCHED) ─────────
  const newLbRow   = lbSheet.getLastRow() + 1;
  const gsDataEnd  = totalsRowNum > 0 ? totalsRowNum - 1 : 2000;
  const gsColRange =
    `OFFSET('Game Scores'!$A$1,1,MATCH(INDIRECT("B"&ROW()),'Game Scores'!$1:$1,0)-1,${gsDataEnd - 1},1)`;
 
  const titleFormula =
    '=LET(rank,INDIRECT("D"&ROW()),total,COUNTA(B$2:B$9999),' +
    'IF(rank="","Monk",' +
    'IF(rank=1,"Messiah",' +
    'IF(AND(rank>=2,rank<=3),"Master",' +
    'IF(AND(rank>=4,rank<=6),"Musketeer",' +
    'IF(AND(rank>=7,rank<=10),"Marshal",' +
    'IF(rank=total,"Moron",' +
    'IF(AND(rank>=total-2,rank<=total-1),"Mongrel",' +
    'IF(AND(rank>=total-5,rank<=total-3),"Minion",' +
    'IF(AND(rank>=total-9,rank<=total-6),"Mortal","Monk"))))))))))';
 
  const playoffSeedFormula = `=IFNA(INDIRECT("M"&ROW())+(INDIRECT("C"&ROW())*0.15),"")`;
 
  // Build the new row as an array (cols A–Q = indices 0–16)
  const newRowValues = [
    [
      titleFormula,         // A: Title
      playerName,           // B: Player name (plain value)
      // C: Total points
      `=IFERROR(INDIRECT("'Game Scores'!"&ADDRESS(` +
        `MATCH("Totals",'Game Scores'!A:A,0),` +
        `MATCH(INDIRECT("B"&ROW()),'Game Scores'!1:1,0))),0)`,
      // D: Points rank
      `=IFERROR(RANK(INDIRECT("C"&ROW()),C$2:C$${newLbRow},FALSE),"")`,
      // E: Games played (post-cutoff)
      `=COUNTIFS(INDEX(Games, 0, 1), ">="&DATE(2026,4,25), INDEX(Games, 0, MATCH(INDIRECT("B"&ROW()), 'Game Scores'!$1:$1, 0)), "<>")`,
      // F: Games won
      `=IFERROR(COUNTIF(${gsColRange},">0"),0)`,
      // G: Games lost
      `=IFERROR(COUNTIF(${gsColRange},"<0"),0)`,
      // H: W/L ratio
      `=IF(INDIRECT("G"&ROW())=0,0,INDIRECT("F"&ROW())/INDIRECT("G"&ROW()))`,
      // I: W/L rank
      `=IFERROR(RANK(INDIRECT("H"&ROW()),H$2:H$${newLbRow},FALSE),"")`,
      // J: Best win
      `=IFERROR(MAX(${gsColRange}),0)`,
      // K: Worst loss
      `=IFERROR(MIN(${gsColRange}),0)`,
      // L: Icon
      (icon && icon.startsWith("data:image")) ? "📷" : (icon || ""),
      1500,  // M: ELO Rating
      '=IFERROR(RANK(INDIRECT("M"&ROW()),M$2:M$9999,FALSE),"")',    // N: ELO Rank
      1500,  // O: ELO Peak
      0,     // P: ELO Δ Last 5
      playoffSeedFormula  // Q: Playoff Seed
    ]
  ];
 
  // ONE write for the entire new row
  lbSheet.getRange(newLbRow, 1, 1, 17).setValues(newRowValues);
 
  // Store image note if needed
  if (icon && icon.startsWith("data:image")) {
    lbSheet.getRange(newLbRow, 12).setNote("Image icon: " + icon.substring(0, 100) + "...");
  }
 
  // ── STEP 3: Update ONLY the formula columns that reference
  //    the row range (rank formulas use $2:$newLbRow bound).
  //    Instead of rewriting ALL rows for title+playoff (which
  //    is O(n) individual calls), we do a single batch write
  //    covering only the two columns that changed bounds:
  //    col D (points rank) and col I (W/L rank).
  //    Title and playoff seed use INDIRECT+ROW() so they are
  //    already correct on every row without rewriting. ────────
  const numExistingRows = newLbRow - 2; // rows 2..(newLbRow-1)
  if (numExistingRows > 0) {
    // Col D — rewrite rank formula with updated range ceiling
    const dRankValues = [];
    const iRankValues = [];
    for (let r = 2; r < newLbRow; r++) {
      dRankValues.push([`=IFERROR(RANK(INDIRECT("C"&ROW()),C$2:C$${newLbRow},FALSE),"")`]);
      iRankValues.push([`=IFERROR(RANK(INDIRECT("H"&ROW()),H$2:H$${newLbRow},FALSE),"")`]);
    }
    // Batch: write all D formulas in one call, all I formulas in one call
    lbSheet.getRange(2, 4, numExistingRows, 1).setFormulas(dRankValues);
    lbSheet.getRange(2, 9, numExistingRows, 1).setFormulas(iRankValues);
  }

  // ── STEP 3b: Rewrite ELO Rank (col N) for ALL rows including
  //    the new one, using an explicit range instead of the
  //    structured table reference Mahjong_Messiahs[ELO Rating].
  //    The table reference excludes the last row when the table
  //    boundary hasn't expanded yet, leaving it blank + green. ──
  const nRankValues = [];
  for (let r = 2; r <= newLbRow; r++) {
    nRankValues.push(['=IFERROR(RANK(INDIRECT("M"&ROW()),M$2:M$9999,FALSE),"")']);
  }
  lbSheet.getRange(2, 14, nRankValues.length, 1).setFormulas(nRankValues);
 
  // ── STEP 4: Defer ELO recalc + sort ──────────────────────
  SpreadsheetApp.flush();
  sortLeaderboard();
  // scheduleDeferredRecalc_();
  recalculateElo();
  showSessionSidebar();
}

// ============================================================
// HELPER: Sort Leaderboard by Total Points descending
// ============================================================
function sortLeaderboard() {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const lbSheet = ss.getSheetByName("Leaderboard");
  const gsSheet = ss.getSheetByName("Game Scores");

  // ── Delete ghost rows using a single bulk read ─────────────
  const lastRowBefore = lbSheet.getLastRow();
  if (lastRowBefore > 1) {
    const colBVals = lbSheet
      .getRange(2, 2, lastRowBefore - 1, 1)
      .getValues(); // ONE read instead of N individual getValue() calls
    for (let r = lastRowBefore; r >= 2; r--) {
      if (String(colBVals[r - 2][0]).trim() === "") {
        lbSheet.deleteRow(r);
      }
    }
  }

  // ── Build live points map from Game Scores Totals row ─────
  const gsData = gsSheet.getDataRange().getValues();
  let totalsRowIndex = -1;
  for (let i = 0; i < gsData.length; i++) {
    if (String(gsData[i][0]).trim().toLowerCase() === "totals") {
      totalsRowIndex = i;
      break;
    }
  }
  if (totalsRowIndex === -1) return;

  const gsHeaders = gsData[0];
  const pointsMap = {};
  for (let c = 1; c < gsHeaders.length; c++) {
    const name = String(gsHeaders[c] || "").trim();
    if (name) pointsMap[name] = Number(gsData[totalsRowIndex][c]) || 0;
  }

  const lastRow     = lbSheet.getLastRow();
  const numDataRows = lastRow - 1;
  if (numDataRows < 1) return;

  // Read cols A–Q as values
  const values = lbSheet.getRange(2, 1, numDataRows, 17).getValues();

  // Sort only rows with a player name
  const namedIndices = values
    .map((row, i) => ({ i, name: String(row[1] || "").trim() }))
    .filter(x => x.name !== "")
    .sort((a, b) => {
      const ptA = pointsMap[a.name] !== undefined ? pointsMap[a.name] : -Infinity;
      const ptB = pointsMap[b.name] !== undefined ? pointsMap[b.name] : -Infinity;
      return ptB - ptA;
    });

  // Write back: name (col B), icon (col L), ELO cols M–P
  // All formula columns use INDIRECT+ROW() so they self-update
  const n = namedIndices.length;
  const sortedNames = namedIndices.map(x => [values[x.i][1]]);
  const sortedIcons = namedIndices.map(x => [values[x.i][11]]);

  lbSheet.getRange(2, 2,  n, 1).setValues(sortedNames);
  lbSheet.getRange(2, 12, n, 1).setValues(sortedIcons);
  const sortedRating = namedIndices.map(x => [values[x.i][12]]);
  const sortedPeakL5 = namedIndices.map(x => [values[x.i][14], values[x.i][15]]);
  lbSheet.getRange(2, 13, n, 1).setValues(sortedRating); // M
  lbSheet.getRange(2, 15, n, 2).setValues(sortedPeakL5); // O, P

  SpreadsheetApp.flush();
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

// ============================================================
// ELO HISTORY — Build from scratch (run once to backfill)
// ============================================================
function buildEloHistory() {
  const ss         = SpreadsheetApp.getActiveSpreadsheet();
  const gamesSheet = ss.getSheetByName('Game Scores');
  const lbSheet    = ss.getSheetByName('Leaderboard');

  // Get or create ELO History sheet
  let histSheet = ss.getSheetByName('ELO History');
  if (!histSheet) {
    histSheet = ss.insertSheet('ELO History');
  } else {
    histSheet.clearContents();
  }

  // Build player list from leaderboard col B
  const lbData = lbSheet.getDataRange().getValues();
  const allPlayerNames = lbData.slice(1)
    .map(r => String(r[1] || '').trim())
    .filter(Boolean);

  // Write header row
  const headerRow = ['Datetime', ...allPlayerNames];
  histSheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);

  // Init ELO state
  const eloState = {};
  allPlayerNames.forEach(name => {
    eloState[name] = { rating: ELO_STARTING_RATING, gamesPlayed: 0, peak: ELO_STARTING_RATING, last5: [] };
  });

  const gsData    = gamesSheet.getDataRange().getValues();
  const gsHeaders = gsData[0];

  const colToPlayer = {};
  for (let c = 1; c < gsHeaders.length; c++) {
    const name = String(gsHeaders[c] || '').trim();
    if (name) colToPlayer[c] = name;
  }

  const ELO_CUTOFF = new Date('2026-04-25T00:00:00');
  const historyRows = [];

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

    // Post-cutoff: run ELO
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
        const pA = participants[i], pB = participants[j];
        const stA = eloState[pA.name], stB = eloState[pB.name];
        if (!stA || !stB) continue;
        const expA   = 1 / (1 + Math.pow(10, (stB.rating - stA.rating) / 400));
        const actA   = getActual(pA.score, pB.score);
        const matchK = (getK(stA.gamesPlayed) + getK(stB.gamesPlayed)) / 2;
        const mult   = getSpreadMultiplier(pA.score, pB.score);
        deltas[pA.name] += matchK * mult * (actA - expA);
        deltas[pB.name] += matchK * mult * ((1 - actA) - (1 - expA));
      }
    }

    participants.forEach(p => {
      const state = eloState[p.name];
      if (!state) return;
      state.rating += deltas[p.name];
      state.gamesPlayed++;
      if (state.rating > state.peak) state.peak = state.rating;
      state.last5.push(deltas[p.name]);
      if (state.last5.length > 5) state.last5.shift();
    });

    // Snapshot all ratings
    const snap = [gameDate];
    allPlayerNames.forEach(name => {
      snap.push(eloState[name] ? Math.round(eloState[name].rating) : 1500);
    });
    historyRows.push(snap);
  }

  if (historyRows.length > 0) {
    histSheet.getRange(2, 1, historyRows.length, headerRow.length).setValues(historyRows);
  }

  SpreadsheetApp.getUi().alert('ELO History built: ' + historyRows.length + ' rows written.');
}

// ============================================================
// ELO HISTORY — Append one row (called after each new game)
// ============================================================
function appendEloHistoryRow_(gameDate, eloStateSnapshot, allPlayerNames) {
  const ss        = SpreadsheetApp.getActiveSpreadsheet();
  const histSheet = ss.getSheetByName('ELO History');
  if (!histSheet) return; // Sheet not created yet — run buildEloHistory() first

  const lastRow = histSheet.getLastRow();
  const snap = [gameDate];
  allPlayerNames.forEach(name => {
    snap.push(eloStateSnapshot[name] ? Math.round(eloStateSnapshot[name].rating) : 1500);
  });
  histSheet.getRange(lastRow + 1, 1, 1, snap.length).setValues([snap]);
}

// ============================================================
// DASHBOARD — Serve ELO history data
// ============================================================
function getEloHistoryData() {
  const ss        = SpreadsheetApp.getActiveSpreadsheet();
  const histSheet = ss.getSheetByName('ELO History');
  if (!histSheet) return { players: [], data: [] };

  const raw     = histSheet.getDataRange().getValues();
  const players = raw[0].slice(1).map(String);
  const tz      = ss.getSpreadsheetTimeZone();

  const data = raw.slice(1).map((row, i) => {
    const rawTime = row[0];
    let time;
    if (rawTime instanceof Date) {
      time = Utilities.formatDate(rawTime, tz, "MM/dd HH:mm");
    } else {
      time = String(rawTime) || 'Game ' + (i + 1);
    }
    return { time, ratings: row.slice(1).map(Number) };
  });

  return { players, data };
}

// ============================================================
// DASHBOARD — Get session players for default selection
// ============================================================
function getSessionPlayers() {
  const map = readSessionMap_();
  const participants = map['participants']
    ? map['participants'].split(',').map(s => s.trim()).filter(Boolean)
    : [];
  return participants;
}
