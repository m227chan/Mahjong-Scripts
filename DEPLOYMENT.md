# 🚀 Deployment Instructions - Mahjong Club Dashboard

Complete step-by-step guide to deploy the new Mahjong UI to Google Sheets.

---

## Prerequisites

- Google Account with Google Drive access
- Existing Google Sheet with "Game Scores" and "Leaderboard" sheets
- All files ready to upload (code.gs, index.html, add-game.html, add-player.html)

---

## Step 1: Open Your Google Sheet

1. Open your Mahjong Club Google Sheet
2. Verify it has two sheets named exactly:
   - **Game Scores** (with columns: Time, Player1, Player2, ..., Totals)
   - **Leaderboard** (with player statistics)

---

## Step 2: Open Google Apps Script Editor

1. In your Google Sheet, click **Extensions** → **Apps Script**
   - This opens the Google Apps Script editor in a new tab
2. You'll see an empty `Code.gs` file with a default `myFunction()`

---

## Step 3: Replace code.gs

1. **Delete** all existing code in the editor
2. **Copy** all content from your `code.gs` file (from the repository)
3. **Paste** it into the Apps Script editor
4. **Save** (Ctrl+S or Cmd+S)
   - The file will auto-save, but manually saving ensures no data loss

✅ **Result:** Your backend functions are now uploaded

---

## Step 4: Create index.html File

1. In the Apps Script editor, click **+ New File**
2. Select **HTML** file
3. Name it **exactly**: `index.html`
4. **Delete** the default HTML template
5. **Copy** all content from your `index.html` file
6. **Paste** it into the Apps Script editor
7. **Save** (Ctrl+S)

✅ **Result:** Dashboard HTML file created

---

## Step 5: Create add-game.html File

1. Click **+ New File** → **HTML**
2. Name it **exactly**: `add-game.html`
3. **Delete** the default template
4. **Copy** all content from your `add-game.html` file
5. **Paste** it into the Apps Script editor
6. **Save** (Ctrl+S)

✅ **Result:** Game entry form created

---

## Step 6: Create add-player.html File

1. Click **+ New File** → **HTML**
2. Name it **exactly**: `add-player.html`
3. **Delete** the default template
4. **Copy** all content from your `add-player.html` file
5. **Paste** it into the Apps Script editor
6. **Save** (Ctrl+S)

✅ **Result:** Player entry form created

---

## Step 7: Verify All Files Are Present

In the Apps Script editor left sidebar, you should see:

```
📄 Code.gs
📄 index.html
📄 add-game.html
📄 add-player.html
```

All 4 files must be present and correctly named (including capitalization).

---

## Step 8: Update onOpen() Menu Function

The `onOpen()` function in code.gs needs to be updated to open the new dashboard.

**Find this section in code.gs:**

```javascript
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🀄 Mahjong Club Menu")
    .addItem("Add New Game", "addNewGame")
    .addItem("Add New Player", "addNewPlayer")
    .addSeparator()
    .addItem("📊 View Dashboard", "showDashboard")
    .addToUi();
}
```

**Add this new function right after `onOpen()`:**

```javascript
function showMainDashboard() {
  const html = HtmlService.createHtmlOutputFromFile("index.html")
    .setWidth(1400)
    .setHeight(900);
  SpreadsheetApp.getUi().showModelessDialog(html, "🀄 Mahjong Club Dashboard");
}
```

**Then update the menu to:**

```javascript
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🀄 Mahjong Club Menu")
    .addItem("📊 Main Dashboard", "showMainDashboard")        // NEW
    .addItem("Add New Game", "addNewGame")
    .addItem("Add New Player", "addNewPlayer")
    .addSeparator()
    .addItem("🎯 Legacy Dashboard", "showDashboard")          // Rename this
    .addToUi();
}
```

**Save** the file (Ctrl+S)

---

## Step 9: Test the Functions

1. Go back to your **Google Sheet** tab
2. **Refresh** the page (F5)
3. You should see the **🀄 Mahjong Club Menu** appear in the menu bar
4. Click **Extensions → Mahjong Club Menu** to verify the new menu items appear

✅ **Menu shows**: 📊 Main Dashboard, Add New Game, Add New Player, 🎯 Legacy Dashboard

---

## Step 10: Launch the Main Dashboard

1. Click **Extensions → 🀄 Mahjong Club Menu → 📊 Main Dashboard**
2. The dashboard will open in a dialog box
3. Wait ~2-3 seconds for data to load
4. You should see:
   - Header with theme toggle
   - Hero section with stats
   - Leaderboard table
   - Statistics cards
   - Charts (if you have game data)

✅ **Dashboard is now live!**

---

## Step 11: Test Add Game Feature

1. On the dashboard, click **➕ Add Game** button
2. A form should open with all your players listed
3. Enter scores for exactly 4 players (must sum to 0)
4. Click **Submit Game**
5. Verify the new game appears in your Google Sheet "Game Scores"

✅ **Add Game works!**

---

## Step 12: Test Add Player Feature

1. On the dashboard, click **👤 Add Player** button
2. Enter a new player name (test name like "TestPlayer")
3. Click **Add Player**
4. Verify the player appears in the leaderboard on next refresh

✅ **Add Player works!**

---

## Step 13: Test Dark Mode

1. Click the **🌙** (moon) icon in the top-right of the dashboard
2. The page should switch to dark mode
3. Click it again to switch back to light mode
4. Refresh the page - dark mode preference should be remembered

✅ **Dark mode works!**

---

## Step 14: Optional - Deploy as Web App (Advanced)

To make the dashboard accessible via a shareable link (instead of just from the sheet):

1. In Apps Script editor, click **Deploy** → **New Deployment**
2. Select **Type: Web app**
3. **Execute as**: Select your Google Account
4. **Who has access**: "Anyone with the link" (or "Anyone" for public)
5. Click **Deploy**
6. Copy the generated URL
7. Share the URL with your Mahjong club members

⚠️ **Note:** This is optional - you can use the menu approach instead.

---

## Troubleshooting

### Dashboard Won't Load / Shows "Not available"
- Refresh the Google Sheet (F5)
- Check that all 4 files are in Apps Script (code.gs, index.html, add-game.html, add-player.html)
- Check file names are exactly correct (case-sensitive)
- Go back to Apps Script and save again

### "Google Apps Script environment not available"
- You're not running within a Google Sheet or Forms context
- Must click menu from within the Google Sheet
- The HTML files are only accessible from Google Apps Script environment

### Data Not Loading
- Verify your Game Scores and Leaderboard sheets exist and have data
- Check that sheet names are **exactly**: "Game Scores" and "Leaderboard"
- Ensure you have at least 1 player and 1 game recorded
- Click **Refresh** button in dashboard to reload data

### Menu Doesn't Appear
- Refresh the Google Sheet page (F5)
- Check that code.gs was properly saved in Apps Script
- Verify `onOpen()` function is present in code.gs
- Wait 5-10 seconds after opening sheet

### Charts Not Showing
- You need at least 1 game recorded in your Game Scores sheet
- Check that game data has cumulative scores calculated
- Try clicking refresh button in dashboard

### Add Game Button Shows "Coming Soon"
- This is a placeholder message during testing
- The actual add-game.html form will load in production
- For now, use **Extensions → Mahjong Club Menu → Add New Game** instead

---

## Next Steps

1. ✅ Start recording games using **Add New Game**
2. ✅ Add players using **Add New Player**
3. ✅ Monitor leaderboard and statistics
4. ✅ Share dashboard with your Mahjong club members

---

## Support

If you encounter issues:

1. Check the **Troubleshooting** section above
2. Open the **Browser Console** (F12) to see error messages
3. Try opening Apps Script Editor and clicking **Run** to test functions manually
4. Check your sheet data structure matches the expected format

---

## Files Checklist

Before deploying, verify you have all these files ready:

- [x] **code.gs** - Backend functions (updated with new menu)
- [x] **index.html** - Main dashboard page
- [x] **add-game.html** - Game entry form
- [x] **add-player.html** - Player registration form

**Deployment Time:** ~10-15 minutes

**Difficulty:** Easy (copy-paste instructions)

---

## Version Info

- **UI Version:** 2.0 (New Modern Dashboard)
- **Deployment Date:** April 26, 2026
- **Compatibility:** Google Sheets only
- **Browser Support:** Chrome, Firefox, Safari, Edge (all modern versions)

---

**🎉 Your Mahjong Club Dashboard is ready!**

Enjoy tracking your games with the new clean, modern interface! 🀄
