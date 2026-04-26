# 🀄 Mahjong-Scripts

A Google Sheets-based Mahjong scoring and leaderboard management system with an interactive dashboard and custom menu interface.

## Features

### 📊 Game Management
- **Add New Game**: Input scores for each game with intuitive validation
  - Ensures exactly 4 players participate per game
  - Validates that scores sum to zero (Mahjong rule)
  - Automatic timestamp recording for each game
  - Supports players sitting out (leave blank if didn't play)

- **Add New Player**: Dynamically add new players to the tracking system
  - Updates both the Game Scores sheet and Leaderboard
  - Auto-generates formulas for player statistics

### 📈 Leaderboard Tracking
Comprehensive player statistics including:
- **Total Score**: Cumulative points across all games
- **Games Played**: Number of games participated in
- **Games Won/Lost**: Count of games with positive/negative scores
- **Win/Loss Ratio**: Performance metric (wins ÷ losses)
- **Highest Single Game**: Best score achieved
- **Lowest Single Game**: Worst score achieved
- **Ranking System**: Dynamic ranking by total score and win/loss ratio

### 🎯 Dynamic Titles
Players earn titles based on leaderboard rank:
- 🏆 **Messiah** - 1st place
- 👑 **Master** - 2nd or 3rd place
- 🧙 **Magician** - 4th to 6th place
- 😈 **Mong** - Bottom 3 places
- 😢 **Moron** - Last place

### 📉 Interactive Dashboard
A real-time visualization showing:
- Game history with timestamps
- Cumulative score trends
- Player rankings throughout the season
- Historical performance data

## Technical Stack

- **JavaScript (Google Apps Script)** - Core scripting logic
- **Google Sheets API** - Data storage and manipulation
- **HTML/CSS** - Interactive dialogs and dashboard UI
- **Python** - Supporting utilities

## How to Use

### Installation
1. Create a new Google Sheet
2. Add sheets named "Game Scores" and "Leaderboard"
3. Set up column headers in "Game Scores": `Time | Player1 | Player2 | ...`
4. Copy the `code.gs` into Apps Script editor (Extensions → Apps Script)

### Adding a Game
1. Click **🀄 Mahjong Club Menu** → **Add New Game**
2. Enter scores for players who participated
3. Leave blank for players who didn't play
4. Ensure exactly 4 players and scores sum to 0
5. Click **Add Game**

### Managing Players
1. Click **🀄 Mahjong Club Menu** → **Add New Player**
2. Enter the player's name
3. System automatically updates all sheets and formulas

### Viewing Dashboard
1. Click **🀄 Mahjong Club Menu** → **📊 View Dashboard**
2. Explore game history and player statistics

## File Structure

- `code.gs` - Main Google Apps Script containing:
  - Menu creation (`onOpen()`)
  - Player management (`addNewPlayer()`)
  - Game submission (`addNewGame()`, `submitGame()`)
  - Dialog UI generation (`buildGameDialog()`)
  - Dashboard data retrieval (`getGameData()`)
  - Helper utilities (`columnToLetter()`)
- `dashboard.html` - Interactive dashboard visualization

## Validation Rules

- **Exactly 4 players** must enter scores per game
- **Scores must sum to zero** (Mahjong scoring principle)
- **Player names** cannot be empty
- **Timestamps** are automatically recorded

## Data Structure

### Game Scores Sheet
| Time | Player1 | Player2 | Player3 | Player4 | ... |
|------|---------|---------|---------|---------|-----|
| DD/MM/YYYY HH:MM:SS | 50 | -50 | 30 | -30 | ... |
| ... | ... | ... | ... | ... | ... |
| Totals | =SUM(...) | =SUM(...) | =SUM(...) | =SUM(...) | ... |

### Leaderboard Sheet
Auto-generated rankings with dynamic formulas tracking player performance.

## Future Enhancements

- [ ] Export game history to PDF reports
- [ ] Multi-season tracking
- [ ] Player statistics analysis
- [ ] Monthly/seasonal awards
- [ ] Photo upload for players

## License

This project is open source and available for personal and club use.

---

**Made for the Mahjong Club** 🀄
