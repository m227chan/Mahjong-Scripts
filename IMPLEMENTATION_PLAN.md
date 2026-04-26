# Step-by-Step Implementation Instructions

## Overview
This document provides detailed step-by-step instructions to build a new, cleaner Mahjong UI with three main pages:
1. **index.html** - Landing page with leaderboard, player stats, and charts
2. **add-game.html** - Interface for recording new games
3. **add-player.html** - Interface for adding players

All files will integrate with existing Google Apps Script functions while providing a modern, scalable UI.

---

## Step 1: Analyze and Update Google Apps Script Backend (code.gs)

### Task 1.1: Add new function to retrieve complete leaderboard data
**Purpose**: Get all leaderboard statistics in one API call for efficiency
**Action**: Add a new function `getLeaderboardData()` to code.gs that:
- Reads the Leaderboard sheet
- Returns array of objects with all player stats
- Format: [{ player, title, totalScore, rank, gamesPlayed, wins, losses, winLossRatio, ratioRank, highestGame, lowestGame }, ...]
- Sort by rank (ascending)
- Includes totals count for pagination calculations

### Task 1.2: Create wrapper functions
**Purpose**: Simplify data fetching for the HTML UI
**Action**: Add two new wrapper functions:
- `getAllGameData()` - Returns combined object with players, gameData, leaderboardData
- `submitNewPlayer(playerName)` - Calls existing addNewPlayer logic, returns success/error

**Expected Outcome**: Backend ready to support new UI without breaking existing functionality

---

## Step 2: Create Shared CSS and JavaScript

### Task 2.1: Create shared stylesheet (app.css)
**Purpose**: Consistent styling across all three HTML pages
**Contents**:
- CSS variables for colors (primary blue/purple, neutrals, accent green/red)
- Typography scales
- Responsive grid/flexbox utilities
- Common component styles (buttons, forms, tables, cards)
- Animation keyframes
- Dark mode toggle styles
- Media queries for mobile/tablet/desktop

**Notes**:
- Embed this as <style> tag in each HTML for simplicity (no external requests)
- Use CSS Grid for layout (better scalability)
- Focus on clean, minimalist aesthetic

### Task 2.2: Create shared JavaScript utilities (app.js)
**Purpose**: Common functions and utilities
**Contents**:
- `formatNumber()` - Format scores with +/- and color coding
- `formatTimestamp()` - Format game timestamps nicely
- `rankToTitle()` - Convert rank number to player title (Messiah, Master, etc.)
- `getColorForRank()` - Color by rank tier
- `closeDialog()` - Generic close function for modal flows
- `showNotification()` - Toast-style notifications
- API call helpers with error handling

**Notes**:
- Embed as <script> tag in each HTML
- Use ES6 syntax
- Handle loading states and errors gracefully

---

## Step 3: Create index.html (Main Dashboard)

### Task 3.1: Build HTML structure
**Purpose**: Create the main landing page layout
**Structure** (top to bottom):
```
1. Header Bar
   - Logo/Title (left)
   - Navigation buttons (center): Leaderboard | Statistics | Charts
   - Theme toggle + Settings (right)

2. Hero Section (optional)
   - Quick stats: Total Players, Total Games, Current Leader
   - Action buttons: Add Game | Add Player

3. Leaderboard Table Section
   - Sortable table with columns: Rank | Title | Player Name | Total Score | Games Played | Win/Loss Ratio | Highest | Lowest
   - Search/filter input above table
   - Pagination controls below (Show 10/25/50 per page)
   - Alternating row colors, hover effects

4. Statistics Cards Row
   - Total Players card
   - Total Games Played card
   - Average Score per Game card
   - Most Improved Player card
   - Biggest Win/Loss card

5. Charts Section
   - Tabs: Cumulative Scores | Rank Progression | Win/Loss Distribution
   - Show 3 charts (lazy-load if needed)
   - Chart containers with canvas elements
   - Legend below each chart

6. Footer
   - Optional: Last updated timestamp, data source, version
```

### Task 3.2: Implement dynamic data loading
**Purpose**: Fetch and render all data on page load
**Actions**:
- On page load, call `google.script.run.getAllGameData()`
- Parse returned leaderboard data
- Populate table rows with pagination (default 25 players per page)
- Calculate and display statistics cards
- Initialize Chart.js with game data

### Task 3.3: Implement interactivity
**Purpose**: Make table and UI responsive to user actions
**Actions**:
- Sortable table headers: Click to sort by that column (ascending/descending toggle)
- Search box: Real-time filter of visible table rows
- Pagination: Next/Previous buttons, jump to page input
- Row click: Show expanded player details modal
- Chart legend clicks: Toggle player visibility (reuse existing chart.js code)

### Task 3.4: Action buttons (Add Game / Add Player)
**Purpose**: Navigation to add game/player pages
**Actions**:
- "Add Game" button: Opens add-game.html in modal or new view
- "Add Player" button: Opens add-player.html in modal or new view
- Refresh button: Re-fetch data after operations complete

---

## Step 4: Create add-game.html

### Task 4.1: Build HTML structure
**Purpose**: Clean form for recording a new game
**Structure**:
```
1. Header
   - Title: "Add New Game"
   - Subtitle: "Enter scores for exactly 4 players (sum must equal 0)"

2. Instructions Box
   - Bulleted list of rules
   - Box with light blue background (matches existing dashboard)

3. Player Score Inputs
   - 4 player dropdowns (select from available players)
   - Score input field next to each (number input, can be negative)
   - Visual indicators for filled/empty fields
   - Remove button for each player (if more than 4)

4. Validation Feedback Area
   - Live feedback: "You have X/4 players"
   - Live feedback: "Scores sum to [number]"
   - Error messages (red background) if issues

5. Action Buttons
   - Cancel button (closes without saving)
   - Add Game button (submits if valid)
   - Disabled state while submitting
```

### Task 4.2: Implement form logic
**Purpose**: Handle player selection and score input
**Actions**:
- On load: Fetch player list via `google.script.run.getGameData()`
- Populate player dropdowns with all players
- Track which players are selected (prevent duplicates)
- Real-time validation:
  - Show count "X/4 players selected"
  - Show sum of scores
  - Highlight errors in red when validation fails
- Prevent submission if invalid

### Task 4.3: Implement submission flow
**Purpose**: Send data to backend and handle response
**Actions**:
- On "Add Game" click: Collect player scores object
- Call `google.script.run.submitGame(scores)`
- Show loading state on button
- On success: Show confirmation message, close after 2 seconds
- On error: Display error message, allow retry
- Dispatch event to notify parent (dashboard should refresh)

---

## Step 5: Create add-player.html

### Task 5.1: Build HTML structure
**Purpose**: Simple form for adding a new player
**Structure**:
```
1. Header
   - Title: "Add New Player"
   - Subtitle: "Enter the player's name"

2. Input Section
   - Text input for player name (focus on load)
   - Character counter (0-30 characters recommended)
   - Real-time validation feedback (name cannot be empty, no duplicates)

3. Existing Players List (optional)
   - Collapsible section showing current players
   - Search to find if player already exists
   - Count: "X players already registered"

4. Action Buttons
   - Cancel button (closes)
   - Add Player button (creates player)
   - Disabled when name is invalid
```

### Task 5.2: Implement form logic
**Purpose**: Validate player name and prevent duplicates
**Actions**:
- On load: Fetch player list via `google.script.run.getGameData()`
- Show current player count
- Real-time validation:
  - Name required (min 1 char)
  - Name cannot be duplicate (case-insensitive check)
  - Show clear error messages
- Enable Add button only when valid

### Task 5.3: Implement submission flow
**Purpose**: Send to backend and confirm
**Actions**:
- On "Add Player" click: Collect player name
- Call `google.script.run.submitNewPlayer(playerName)` 
- Show loading state
- On success: Show confirmation, close after 2 seconds
- On error: Display error, allow retry
- Dispatch event to notify parent

---

## Step 6: Enhance code.gs Backend Functions

### Task 6.1: Add getLeaderboardData() function
**Code location**: code.gs
**Purpose**: Efficiently fetch all leaderboard data

**Pseudo-code**:
```javascript
function getLeaderboardData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const lb = ss.getSheetByName("Leaderboard");
  const data = lb.getDataRange().getValues();
  
  // Parse headers and rows
  // Return array of objects with all stats
  // Sort by rank
}
```

### Task 6.2: Add getAllGameData() function
**Code location**: code.gs
**Purpose**: Return combined dataset for main dashboard
**Returns**: { players, gameData, leaderboardData }

### Task 6.3: Add error handling wrappers
**Purpose**: Gracefully handle errors in new UI
**Actions**: Wrap existing functions with try/catch, return { success, data/error }

---

## Step 7: Styling and Responsiveness

### Task 7.1: Implement CSS Grid layout for index.html
**Purpose**: Scalable, responsive main page
**Breakpoints**:
- Desktop (1200px+): 2-column layout (table left, stats/charts right)
- Tablet (768px-1199px): 1-column, stacked sections
- Mobile (< 768px): Full-width, simplified table (show key columns only)

### Task 7.2: Optimize table for large datasets
**Purpose**: Handle 100+ players without slowdown
**Actions**:
- Implement pagination (default 25 per page)
- Virtual scrolling (if jQuery DataTables used)
- Search/filter client-side with debouncing
- Column hiding on mobile (show: Rank, Player, Score, Games)

### Task 7.3: Implement dark mode
**Purpose**: Improved UX for evening usage
**Actions**:
- Create --light-* and --dark-* CSS variables
- Add theme toggle in header (☀️/🌙 icon)
- Store preference in localStorage
- Apply theme on page load

---

## Step 8: Testing and Optimization

### Task 8.1: Test with sample data
**Purpose**: Validate all features work
**Actions**:
- Test with 10, 50, 100+ players
- Test with 50, 200, 1000+ games
- Verify all sorts, filters, pagination work
- Test on mobile/tablet screen sizes

### Task 8.2: Performance optimization
**Purpose**: Ensure fast loading and smooth interaction
**Actions**:
- Profile chart rendering (optimize if needed)
- Minimize API calls (batch fetch, cache)
- Lazy-load charts (load on tab click)
- Consider CSS/JS minification

### Task 8.3: Error handling and edge cases
**Purpose**: Graceful failure scenarios
**Actions**:
- Test with no games yet (empty dashboard)
- Test with network errors
- Test with duplicate player addition
- Test form validation thoroughly

---

## Implementation Order (Sequential)

1. **First (Update Backend)**: Step 6 (add new code.gs functions)
2. **Second (Utilities)**: Step 2 (create CSS and JS utilities)
3. **Third (Main Page)**: Step 3 (create index.html)
4. **Fourth (Add Flows)**: Step 4 & 5 (create add-game.html and add-player.html)
5. **Fifth (Styling)**: Step 7 (responsive CSS, dark mode)
6. **Sixth (Polish)**: Step 8 (testing, optimization)

---

## Delivery Artifacts
- ✅ CONSTITUTION.md (this-like document - status tracking)
- ✅ Updated code.gs (backend functions)
- ✅ index.html (main dashboard)
- ✅ add-game.html (game entry)
- ✅ add-player.html (player entry)
- ✅ app.css (shared styling, embedded)
- ✅ app.js (shared utilities, embedded)
- ✅ Testing notes and performance metrics

---

## Notes for Implementation
- All HTML files should be served via Google Apps Script (`HtmlService`)
- Keep files modular but embedded (no external resource from different domains)
- Maintain backward compatibility with existing dashboard.html
- Consider deprecating old dashboard.html once new UI is stable
- Use consistent error messaging and validation feedback
- Follow accessibility best practices (ARIA labels, semantic HTML)

