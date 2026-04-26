# 🀄 Mahjong Scoring System - UI Redesign Constitution

## Current System Understanding

### Architecture
- **Backend**: Google Apps Script (code.gs) with Google Sheets as database
- **Front-End**: Google Sheets UI + Custom HTML dialogs in Google Apps Script
- **Data Storage**: Two main sheets:
  - **Game Scores Sheet**: Timestamp | Player1 | Player2 | ... | Totals (calculated row)
  - **Leaderboard Sheet**: Title | Player Name | Total Score | Rank | Games Played | Wins | Losses | Win/Loss Ratio | Ratio Rank | Highest Single Game | Lowest Single Game

### Current Features
1. **Add New Player**: Dynamically adds player to both sheets with auto-formulas
2. **Add New Game**: Modal dialog requiring exactly 4 players with scores summing to 0
3. **Dashboard**: Interactive charts showing:
   - Cumulative scores over time (line chart)
   - Rank progression (bump chart)
   - Player filtering via Select2 dropdown

### Validation Rules
- Exactly 4 players per game (enforced)
- Scores must sum to 0 (enforced)
- Player names cannot be empty
- Timestamps auto-recorded

### Data Structure Example
```
Game Scores:
| Time (Column A) | Player1 (B) | Player2 (C) | Player3 (D) | Player4 (E) | ... |
| 25/04/2026 14:30 | 50 | -50 | 30 | -30 | ... |
| Totals | =SUM(B:B) | =SUM(C:C) | ... |

Leaderboard:
| Title (A) | Player (B) | Total Score (C) | Rank (D) | Games Played (E) | Wins (F) | Losses (G) | Win/Loss Ratio (H) | Ratio Rank (I) | Highest (J) | Lowest (K) |
| Messiah | Alice | 250 | 1 | 10 | 8 | 2 | 4.0 | 1 | 50 | -40 |
```

### Available Data Through `getGameData()`
Returns object with:
- `players`: Array of player names
- `data`: Array of game objects, each containing:
  - `time`: Formatted timestamp string
  - `cumulative`: Array of cumulative scores for each player
  - `ranks`: Array of current ranks for each player

### Available Leaderboard Formulas (via Google Sheets API)
- Player title system: Messiah (1st) → Master (2-3) → Magician (4-6) → Moron (last)
- Dynamic ranking calculations
- Win/Loss ratios

---

## New UI Requirements

### Functional Requirements
1. **Landing/Home Page** (serves as dashboard)
   - Current leaderboard table (sortable by various metrics)
   - Complete player statistics display
   - Real-time cumulative scores and rankings
   - Interactive charts (cumulative scores + rank progression)
   - Quick-action buttons for Add Game/Add Player

2. **Add New Game Page**
   - Input form for exactly 4 players
   - Real-time validation (player count, sum to 0)
   - Score entry with clear feedback
   - Success/error messaging

3. **Add New Player Page**
   - Simple form with player name input
   - Confirmation dialog
   - Validation (non-empty names)

### Design Requirements
- **Clean, Modern UI**: Minimalist design with clear information hierarchy
- **Responsive**: Works on desktop, tablet, mobile
- **Scalable**: Optimized for 100+ players and 1000+ games
- **Dark/Light Mode**: Optional theme toggle for comfort
- **Performance**: Efficient table rendering (pagination or virtual scrolling)

### Technical Constraints
- Must call Google Apps Script backend functions:
  - `addNewPlayer(playerName)` - returns success/error
  - `submitGame(scores)` - takes object of {playerName: score}
  - `getGameData()` - returns {players, data}
  - Read Leaderboard sheet for full statistics
- Data fetching should be asynchronous and efficient
- Only display what's necessary (lazy load charts)

---

## Scalability Considerations

### For 100+ Players
- Implement **pagination** or **virtual scrolling** in leaderboard table
- **Search/filter** by player name, ranking tier
- **Sortable columns** (by score, games played, win ratio, etc.)
- Lazy-load chart data (only render on demand)

### For 1000+ Games
- Truncate chart X-axis labels (show every 10th game to avoid crowding)
- Use chart.js with efficient data rendering
- Implement date-range filtering for dashboard (optional)
- Cache statistics to reduce API calls

---

## Visual Design Principles

### Color Scheme
- Primary: Modern blue/purple gradient (matches existing dashboard)
- Secondary: Neutral grays for tables and forms
- Accent: Green for success, Red for errors

### Typography
- Headers: Bold, large (24-28px for main title, 18-20px for sections)
- Body: Clean sans-serif (14-16px)
- Monospace for scores/numbers

### Layout Structure
- **Header**: Navigation, branding, theme toggle
- **Main Content**: Two-column or responsive grid
  - Left/Top: Leaderboard table with pagination
  - Right/Bottom: Statistics cards + charts
- **Footer**: Optional (links, version info)

### Interactive Elements
- Buttons: Clear visual hierarchy (primary/secondary)
- Forms: Clean inputs with inline validation feedback
- Tables: Hover effects, sortable headers, alternating row colors
- Charts: Smooth animations, legend clicks to toggle data

---

## File Structure Plan

### New Files to Create
1. `index.html` - Main landing/dashboard page
2. `add-game.html` - Add new game interface
3. `add-player.html` - Add new player interface
4. `styles.css` - Shared CSS (considered embedding or linking)
5. `app.js` - Shared JavaScript utilities
6. Update `code.gs` - Add new backend functions as needed (e.g., `getLeaderboardData()`)

### Configuration
- External libraries: 
  - Chart.js (charts)
  - Google Sheets API-compatible data fetch
  - Optional: DataTable.js or similar for advanced table features

---

## Priority/Phase Plan

### Phase 1: MVP
- [ ] Create index.html with basic leaderboard table + stats
- [ ] Basic styling (clean, responsive)
- [ ] Navigation to Add Game/Add Player
- [ ] Embed add-game and add-player flows

### Phase 2: Enhancement
- [ ] Add charts to dashboard (cumulative scores, rank bump)
- [ ] Implement pagination for large player lists
- [ ] Add sorting/filtering on leaderboard
- [ ] Player search functionality

### Phase 3: Polish
- [ ] Dark mode theme
- [ ] Advanced statistics (win streaks, volatility, etc.)
- [ ] Export functionality (PDF reports)
- [ ] Performance optimization (virtualization, caching)

---

## Success Metrics
✅ All features (add game, add player, dashboard) accessible from clean, unified UI
✅ Leaderboard displays at least 50 players without slowdown
✅ Charts load efficiently for 200+ games
✅ Mobile responsive (works on phones)
✅ Form validation clear and intuitive
✅ Easy navigation between views

