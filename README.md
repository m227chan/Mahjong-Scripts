# 🀄 Mahjong-Scripts

A comprehensive Google Sheets-based Mahjong scoring and leaderboard management system featuring an interactive dashboard, ELO rating system, session management tools, and player network visualization.

## Features

### 🎮 Session Management
A complete real-time session manager for organizing games and tracking player placements:

- **Multi-Table Support**: Organize multiple simultaneous Mahjong tables
- **Drag-and-Drop Player Assignment**: Intuitive UI for assigning players to seats
- **Live Table Validation**: Visual feedback for complete/incomplete tables
- **Sideline Tracking**: Track players waiting for next round
- **Wind Drawing**: Randomize wind positions for fairness
- **Win Recording**: Inline scoring for game results with:
  - Winner selection
  - Loser assignment
  - Fan (multiplier) calculation
  - Score preview before submission
  - Automatic ELO recalculation

### 📊 Game Management
- **Add New Game**: Input scores for each game with intuitive validation
  - Ensures exactly 4 players participate per game
  - Validates that scores sum to zero (Mahjong rule)
  - Automatic timestamp recording for each game
  - Supports players sitting out (leave blank if didn't play)

- **Add New Player**: Dynamically add new players to the tracking system
  - Updates both the Game Scores sheet and Leaderboard
  - Auto-generates formulas for player statistics
  - Custom player icons/emojis

### 📈 Leaderboard Tracking
Comprehensive player statistics including:
- **Total Score**: Cumulative points across all games
- **Games Played**: Number of games participated in
- **Games Won/Lost**: Count of games with positive/negative scores
- **Win/Loss Ratio**: Performance metric (wins ÷ losses)
- **Highest Single Game**: Best score achieved
- **Lowest Single Game**: Worst score achieved
- **Ranking System**: Dynamic ranking by total score and win/loss ratio

### 🏆 ELO Rating System
Advanced competitive rating system with intelligent calculation:

#### ELO Features
- **Adaptive K-Factor**: Adjusted based on player experience
  - K=40 for new players (< 20 games)
  - K=20 for intermediate (20-49 games)
  - K=16 for veterans (50+ games)
- **Margin of Victory Multiplier**: Larger victories award more rating points
- **Pairwise Comparison**: Fair head-to-head ELO calculation for 4-player games
- **Peak Rating Tracking**: Highest ELO achieved tracked per player
- **Recent Performance**: Last 5 game delta summed for momentum analysis
- **Deferred Recalculation**: Efficient trigger-based ELO updates
- **Incremental ELO**: Fast single-game ELO application for session results

#### ELO Columns
- **ELO Rating**: Current rating (starting at 1500)
- **ELO Rank**: Ranking by current rating
- **ELO Peak**: Highest rating ever achieved
- **ELO Δ Last 5**: Sum of rating changes over last 5 games

### 🎯 Dynamic Titles
Players earn titles based on leaderboard rank:
- 🏆 **Messiah** - 1st place
- 👑 **Master** - 2nd or 3rd place
- 🧙 **Magician** - 4th to 6th place
- 😈 **Mong** - Bottom 3 places
- 😢 **Moron** - Last place

### 📉 Interactive Dashboard
A real-time visualization showing comprehensive player statistics:

#### Cumulative Scores Chart
- Line graph tracking each player's total score progression across all games
- Shows score trends over time for performance analysis
- Color-coded lines for easy player identification

#### Rank Over Time Chart (Bump Chart)
- Visualizes how player rankings change throughout the season
- Displays rank (1 = best) on the Y-axis and games on the X-axis
- Helps identify momentum shifts and competitive dynamics
- Reverse-scaled Y-axis for intuitive rank visualization (top = rank 1)

#### ELO Progression Chart
- Track each player's ELO rating development over time
- Visualize competitive strength progression
- Identify rising stars and declining players

#### Average ELO Chart
- See overall player base strength trends
- Analyze meta shifts in competitive landscape

#### Interactive Features
- **Date Range Slider**: Dual-range slider for flexible time filtering
- **Multi-Select Player Filter**: Toggle multiple players to compare specific competitors
- **Session Player Preset**: Quick filter to view current session participants only
- **Click Legend to Toggle Players**: Click player names to show/hide their data
- **Responsive Design**: Charts automatically adapt to different screen sizes
- **Smooth Animations**: Tension-based curves for smooth transitions

#### Data Display
- Game timestamps displayed on X-axis (auto-formatted, max 10 ticks for readability)
- Dynamic scaling based on number of games played
- Automatic fallback labels ("Game 1", "Game 2", etc.) if timestamps unavailable
- Real-time statistics bar showing games played, win ratio, and current metrics

### 🌐 Player Network Graph
A network visualization showing player connections and co-play frequency:

#### Network Features
- **Interactive Graph Visualization**: Displays players as nodes and games together as edges
- **Ego Graph Mode**: Single-player view showing their connections and co-players
- **Multi-Select Mode**: Compare multiple players' networks simultaneously
- **Connection Strength**: Edge thickness represents how many games two players have played together
- **Temporal Filtering**: Configurable date range and minimum game threshold
- **Default Timeframe**: Shows games from April 25, 2026 onward by default
- **Hover Information**: See player names and connection counts on hover
- **Zoom & Pan**: Interactive exploration of the network graph
- **Hierarchical Ego Layout**: Auto-arranged hierarchy for single-player networks

#### Insights
- Identify core player groups and frequent co-players
- Visualize friendship/team dynamics through connection frequency
- Analyze player availability and participation patterns over time
- Understand the social structure within the Mahjong club
- Discover potential teams based on co-play frequency

## Technical Stack

- **Google Apps Script** - Backend scripting and sheet automation
  - `code.gs` - Main application logic
  - `elo.gs` - ELO rating system with deferred recalculation
  - `session_backend.gs` - Session management backend
- **Google Sheets API** - Data storage and real-time updates
- **HTML/CSS/JavaScript** - Frontend interfaces
  - `dashboard.html` - Advanced statistics dashboard
  - `session.html` - Real-time session manager
  - `network.html` - Network graph visualization
- **Chart.js** - Dashboard visualization library
- **Vis.js** - Network graph visualization
- **Select2** - Enhanced dropdown selection
- **jQuery** - DOM manipulation and utilities
- **Python** - Data cleanup utilities (optional)

## Architecture

### Sheet Organization
- **Game Scores**: Raw game data with timestamps and player scores
- **Leaderboard**: Player statistics and performance metrics
- **ELO State**: Persistent ELO ratings and calculation state
- **Table Arrangements**: Session state and player placements
- **Elo History**: Game-by-game ELO progression tracking

### Key Design Patterns
- **Deferred Recalculation**: ELO updates batched with trigger-based execution
- **Incremental Updates**: Fast single-game ELO for real-time feedback
- **Session Persistence**: Local storage of table arrangements via key-value pairs
- **Drag-and-Drop UI**: HTML5 native drag operations for player management

## How to Use

### Installation
1. Create a new Google Sheet
2. Add sheets named: "Game Scores", "Leaderboard", "ELO State", "Table Arrangements", "Elo History"
3. Set up column headers in "Game Scores": `Time | Player1 | Player2 | ...`
4. Set up headers in "Leaderboard" and "ELO State" (formulas auto-generate)
5. Copy the `.gs` files into Apps Script editor (Extensions → Apps Script)
6. Copy the `.html` files as HTML files in Apps Script

### Starting a Session
1. Click **🀄 Mahjong Club Menu** → **🗺️ Session Manager**
2. Select number of tables
3. Choose participating players
4. Drag players to table seats and sideline
5. Click "Start Session" to begin recording games
6. Use "Record Win" to enter game results with automatic ELO calculation

### Adding a Game (Manual Entry)
1. Click **🀄 Mahjong Club Menu** → **Add New Game**
2. Enter scores for players who participated
3. Leave blank for players who didn't play
4. Ensure exactly 4 players and scores sum to 0
5. Click **Add Game** (automatically calculates ELO)

### Managing Players
1. Click **🀄 Mahjong Club Menu** → **Add New Player**
2. Enter the player's name and select an icon
3. System automatically updates all sheets and formulas

### Viewing Dashboard
1. Click **🀄 Mahjong Club Menu** → **📊 View Dashboard**
2. Use date slider and player filters to customize view
3. Explore cumulative scores, rankings, and ELO progression
4. Analyze performance patterns across the season

### Viewing Player Network
1. Click **🀄 Mahjong Club Menu** → **🌐 Player Network**
2. Select players or single player for ego graph
3. Adjust minimum game threshold and date range
4. Explore the interactive network graph showing player connections
5. Observe clustering patterns to understand player groups

## File Structure

- **code.gs** - Main Google Apps Script (1000+ lines)
  - Menu creation and UI management
  - Player management system
  - Game submission and validation
  - Dialog builders and handlers
  - Dashboard data retrieval
  - Network data extraction
  - Utility functions

- **elo.gs** - ELO Rating System (300+ lines)
  - Deferred recalculation with triggers
  - Incremental single-game ELO
  - K-factor calculation by experience
  - Margin of victory multiplier
  - Pairwise comparison logic
  - State persistence and batched writes

- **session_backend.gs** - Session Management (150+ lines)
  - Session initialization
  - Table arrangement persistence
  - Drag-and-drop state management
  - Session serialization

- **dashboard.html** - Interactive Dashboard (1500+ lines)
  - Cumulative score tracking
  - Bump chart (ranking over time)
  - ELO progression visualization
  - Average ELO tracking
  - Dual-range date slider
  - Legend-based filtering
  - Real-time statistics overlay

- **session.html** - Session Manager (1200+ lines)
  - Multi-table drag-and-drop interface
  - Player chip components
  - Win/loss recording panel
  - Fan (multiplier) selection
  - Score preview and flash overlay
  - Real-time session state management

- **network.html** - Network Visualization (600+ lines)
  - Vis.js network rendering
  - Ego graph mode (single player)
  - Multi-select mode
  - Edge filtering by game threshold
  - Date range filtering
  - Interactive statistics overlay

- **data_cleanup.py** - Data Utilities (optional)
  - Session segmentation
  - Participant inference
  - Data validation and cleaning

## Validation Rules

- **Exactly 4 players** must enter scores per game
- **Scores must sum to zero** (Mahjong scoring principle)
- **Player names** cannot be empty
- **Timestamps** are automatically recorded
- **ELO ratings** calculated only for games after April 25, 2026

## Data Structure

### Game Scores Sheet
| Time | Player1 | Player2 | Player3 | Player4 | ... |
|------|---------|---------|---------|---------|-----|
| DD/MM/YYYY HH:MM:SS | 50 | -50 | 30 | -30 | ... |
| ... | ... | ... | ... | ... | ... |
| Totals | =SUM(...) | =SUM(...) | =SUM(...) | =SUM(...) | ... |

### Leaderboard Sheet
| Name | Total Score | Games Played | Wins | Losses | W/L Ratio | High | Low | **ELO Rating** | ELO Rank | ELO Peak | ELO Δ Last 5 |
|------|-------------|--------------|------|--------|-----------|------|-----|--------|----------|----------|--------------|
| Player A | 500 | 20 | 12 | 8 | 1.50 | 120 | -80 | **1650** | 1 | 1680 | +45 |

### ELO State Sheet
| Player | Rating | Games Played | Peak | Last 5 Deltas |
|--------|--------|--------------|------|---------------|
| Player A | 1650 | 20 | 1680 | 8, -5, 12, 15, 10 |

## Future Enhancements

- [ ] Export game history to PDF reports
- [ ] Multi-season tracking with rollover
- [ ] Monthly/seasonal awards and highlights
- [ ] Photo upload for players
- [ ] Advanced statistical comparison tools
- [ ] Export network graph as image
- [ ] Handicap system for skill balancing
- [ ] Tournament mode with bracket generation
- [ ] Mobile companion app
- [ ] Real-time spectator view

## Performance Notes

- Deferred ELO recalculation prevents lag during rapid game submissions
- Batched sheet writes optimize API usage
- Incremental ELO updates provide instant feedback in sessions
- Dashboard uses date range filtering for efficient data rendering
- Network graph supports 50+ players with responsive interaction

## License

This project is open source and available for personal and club use.

---

**Made for the Mahjong Club** 🀄

Built with ❤️ for competitive Mahjong tracking and community engagement.