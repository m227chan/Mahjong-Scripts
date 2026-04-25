import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from collections import defaultdict

def parse_datetime(dt_str):
    """Parse datetime string in DD/MM/YYYY HH:MM:SS format"""
    return pd.to_datetime(dt_str, format='%d/%m/%Y %H:%M:%S')

def get_active_players_for_session(df, game_idx, player_cols):
    """
    Determine which players were likely active during a gaming session
    based on their participation in nearby games
    """
    game_date = df.iloc[game_idx]['Datetime'].date()

    # Get all games from the same day
    same_day_mask = df['Datetime'].dt.date == game_date
    same_day_games = df[same_day_mask]

    # Count non-zero scores for each player on this day
    player_activity = {}
    for player in player_cols:
        # Count how many games this player participated in on this day
        participated = (same_day_games[player] != 0).sum()
        player_activity[player] = participated

    # Get players who participated at least once on this day
    active_players = [p for p, count in player_activity.items() if count > 0]

    return active_players, player_activity

def find_closest_participants(df, game_idx, player_cols, time_window_minutes=30):
    """
    Find players who participated in games close to this timestamp
    """
    current_time = df.iloc[game_idx]['Datetime']

    # Look at games within time window
    time_mask = (df['Datetime'] >= current_time - timedelta(minutes=time_window_minutes)) & \
                (df['Datetime'] <= current_time + timedelta(minutes=time_window_minutes))

    nearby_games = df[time_mask]

    # Count participations in nearby games
    nearby_participation = {}
    for player in player_cols:
        participated = (nearby_games[player] != 0).sum()
        nearby_participation[player] = participated

    return nearby_participation

def infer_missing_players(row, player_cols):
    """
    For a row with less than 4 non-zero entries, infer which players likely had 0 scores
    Returns a modified row with exactly 4 non-null values
    """
    # Get players with non-zero scores
    non_zero_players = []
    zero_candidates = []
    null_players = []

    for player in player_cols:
        value = row[player]
        if pd.isna(value) or value == '':
            null_players.append(player)
        elif value == 0:
            zero_candidates.append(player)
        else:
            non_zero_players.append(player)

    num_non_zero = len(non_zero_players)
    num_zeros = len(zero_candidates)

    # If we already have exactly 4 participants (non-zero + zeros), we're done
    if num_non_zero + num_zeros == 4:
        return row

    # If we have more than 4, something is wrong with the data
    if num_non_zero + num_zeros > 4:
        print(f"Warning: Row has {num_non_zero + num_zeros} participants (should be 4)")
        return row

    # If we have less than 4, we need to infer missing players
    # The missing players should be set to 0 (they played but didn't score)
    # We need to pick (4 - num_non_zero - num_zeros) players from null_players

    return row

def clean_mahjong_data(input_file):
    """
    Main function to clean mahjong data and infer missing players
    """
    # Read the data
    df = pd.read_csv(input_file, sep=',')

    # --- BEGIN ADDED CODE ---
    print(f"Columns in DataFrame: {df.columns.tolist()}")
    # --- END ADDED CODE ---

    # Parse datetime
    df['Datetime'] = df['Datetime'].apply(parse_datetime)

    # Get player columns (all except Datetime and Totals row)
    player_cols = [col for col in df.columns if col != 'Datetime']

    # Remove the Totals row if it exists
    df = df[df['Datetime'].notna()].copy()

    # Convert player columns to numeric
    for col in player_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce')

    # Create a new cleaned dataframe
    cleaned_rows = []

    print("Analyzing games and inferring participants...\n")

    for idx, row in df.iterrows():
        game_time = row['Datetime']

        # Count current participants
        participants = {}
        for player in player_cols:
            value = row[player]
            if pd.notna(value) and value != 0:
                participants[player] = value

        num_participants = len(participants)

        # If we already have 4 or more non-zero values, keep as is
        if num_participants >= 4:
            cleaned_row = row.copy()
            # Set all non-participants to NaN
            for player in player_cols:
                if player not in participants:
                    cleaned_row[player] = np.nan
            cleaned_rows.append(cleaned_row)
            continue

        # If we have fewer than 4, we need to infer
        # Get active players for this session
        active_players, day_activity = get_active_players_for_session(df, idx, player_cols)

        # Get nearby participation
        nearby_participation = find_closest_participants(df, idx, player_cols, time_window_minutes=60)

        # Combine scores for ranking potential participants
        # Players who are active on this day and in nearby games are most likely
        candidate_scores = {}
        for player in player_cols:
            if player in participants:
                continue  # Already has a score

            score = 0
            # Weight: nearby participation (high weight)
            score += nearby_participation.get(player, 0) * 10
            # Weight: same-day participation (medium weight)
            score += day_activity.get(player, 0) * 5

            if score > 0:  # Only consider players who played on this day
                candidate_scores[player] = score

        # Sort candidates by score
        sorted_candidates = sorted(candidate_scores.items(), key=lambda x: x[1], reverse=True)

        # We need (4 - num_participants) more players
        needed = 4 - num_participants

        # Select top candidates
        selected_zeros = [player for player, score in sorted_candidates[:needed]]

        # Create cleaned row
        cleaned_row = row.copy()

        # Set all players to NaN first
        for player in player_cols:
            if player not in participants and player not in selected_zeros:
                cleaned_row[player] = np.nan
            elif player in selected_zeros:
                cleaned_row[player] = 0

        if len(selected_zeros) > 0:
            print(f"Game {idx} ({game_time}): Added {', '.join(selected_zeros)} as 0-score players")
            print(f"  Active players: {participants.keys()}")
            print(f"  Day activity: {dict(sorted(day_activity.items(), key=lambda x: x[1], reverse=True)[:8])}")
            print()

        cleaned_rows.append(cleaned_row)

    # Create cleaned dataframe
    cleaned_df = pd.DataFrame(cleaned_rows)

    # Verify each row has exactly 4 participants
    print("\n=== Verification ===")
    for idx, row in cleaned_df.iterrows():
        participant_count = sum(pd.notna(row[col]) for col in player_cols)
        if participant_count != 4:
            print(f"Warning: Game {idx} ({row['Datetime']}) has {participant_count} participants (expected 4)")

    # Summary statistics
    print("\n=== Summary ===")
    for player in player_cols:
        games_played = cleaned_df[player].notna().sum()
        games_won = (cleaned_df[player] > 0).sum()
        games_lost = (cleaned_df[player] < 0).sum()
        games_zero = (cleaned_df[player] == 0).sum()
        print(f"{player:12s}: {games_played:3d} games ({games_won:3d} wins, {games_lost:3d} losses, {games_zero:3d} zeros)")

    return cleaned_df

def main():
    input_file = 'mahjong_data.csv'
    output_file = 'mahjong_data_cleaned.csv'

    print("Reading and cleaning mahjong data...")
    print("=" * 60)

    # Clean the data
    cleaned_df = clean_mahjong_data(input_file)

    # Save to CSV
    cleaned_df.to_csv(output_file, index=False)
    print(f"\n✅ Cleaned data saved to: {output_file}")

    return cleaned_df

if __name__ == "__main__":
    df = main()