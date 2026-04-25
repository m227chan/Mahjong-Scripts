import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from collections import defaultdict

def parse_datetime(dt_str):
    """Parse datetime string in DD/MM/YYYY HH:MM:SS format"""
    return pd.to_datetime(dt_str, format='%d/%m/%Y %H:%M:%S')

def get_active_players_for_session(df, game_idx, player_cols):
    """Fallback logic for session activity."""
    game_date = df.iloc[game_idx]['Datetime'].date()
    same_day_games = df[df['Datetime'].dt.date == game_date]
    player_activity = {p: (pd.notna(same_day_games[p])).sum() for p in player_cols}
    active_players = [p for p, count in player_activity.items() if count > 0]
    return active_players, player_activity

def find_closest_participants(df, game_idx, player_cols, time_window_minutes=60):
    """Find individual participation near a timestamp."""
    current_time = df.iloc[game_idx]['Datetime']
    time_mask = (df['Datetime'] >= current_time - timedelta(minutes=time_window_minutes)) & \
                (df['Datetime'] <= current_time + timedelta(minutes=time_window_minutes))
    nearby_games = df[time_mask]
    return {p: (pd.notna(nearby_games[p])).sum() for p in player_cols}

def get_candidate_groups(df, current_game_idx, player_cols):
    """Build candidate groups within the same session ID."""
    current_game = df.iloc[current_game_idx]
    current_time = current_game['Datetime']
    current_session = current_game['session_id']
    
    # Only look at games in the same session
    nearby_games_df = df[df['session_id'] == current_session]
    candidate_groups = []

    for idx, row in nearby_games_df.iterrows():
        if idx == current_game_idx: continue
        game_players = {p for p in player_cols if pd.notna(row[p])}
        if 3 <= len(game_players) <= 4:
            recency_bonus = 1 / (1 + abs((row['Datetime'] - current_time).total_seconds()) / 60)
            candidate_groups.append({'players': game_players, 'recency_bonus': recency_bonus})
    return candidate_groups

def score_group(candidate_group, current_players):
    """Score a group based on overlap and recency."""
    overlap = len(candidate_group['players'].intersection(current_players))
    return overlap * 100 + candidate_group['recency_bonus']

def clean_mahjong_data(input_file):
    df = pd.read_csv(input_file)
    player_cols = [col for col in df.columns if col != 'Datetime']
    df = df[df['Datetime'].notna()].copy()
    df['Datetime'] = df['Datetime'].apply(parse_datetime)
    for col in player_cols: df[col] = pd.to_numeric(df[col], errors='coerce')

    # --- Session Segmentation ---
    df = df.sort_values('Datetime').reset_index(drop=True)
    df['time_diff'] = df['Datetime'].diff().dt.total_seconds().div(60).fillna(0)
    df['session_id'] = (df['time_diff'] > 60).cumsum()

    cleaned_rows = []
    last_group = None
    last_group_time = None

    print("Analyzing games (Session & Group-centric)...\n")

    for idx, row in df.iterrows():
        game_time = row['Datetime']
        current_players = {p for p in player_cols if pd.notna(row[p])}
        num_known = len(current_players)

        if num_known >= 4:
            cleaned_row = row.copy()
            for p in player_cols: 
                if p not in current_players: cleaned_row[p] = np.nan
            cleaned_rows.append(cleaned_row)
            last_group, last_group_time = current_players, game_time
            continue

        best_group, fallback_needed = None, True

        # 1. Check Continuity (Time-constrained)
        if last_group and last_group_time:
            time_diff = abs((game_time - last_group_time).total_seconds()) / 60
            overlap_last = len(last_group.intersection(current_players))
            if overlap_last >= max(2, num_known) and time_diff <= 60:
                best_group, fallback_needed = last_group, False

        if best_group is None:
            candidate_groups = get_candidate_groups(df, idx, player_cols)
            
            # 2. Ranked Exact Matches
            exact_matches = [g for g in candidate_groups if len(g['players'].intersection(current_players)) >= num_known and len(g['players']) == 4]
            if exact_matches:
                best_group = max(exact_matches, key=lambda g: g['recency_bonus'])['players']
                fallback_needed = False
            
            # 3. Best Overlap
            if best_group is None and candidate_groups:
                scored_g = max(candidate_groups, key=lambda g: score_group(g, current_players))
                if len(scored_g['players'].intersection(current_players)) >= max(2, num_known):
                    best_group = scored_g['players']
                    fallback_needed = False

        if not fallback_needed and best_group:
            inferred = best_group - current_players
            cleaned_row = row.copy()
            for p in inferred: cleaned_row[p] = 0
            for p in player_cols:
                if p not in current_players and p not in inferred: cleaned_row[p] = np.nan
            print(f"Game {idx} ({game_time}): Inferred {list(inferred)} from group.")
            cleaned_rows.append(cleaned_row)
            last_group, last_group_time = best_group, game_time
            continue

        # 4. Group-Aware Fallback
        if fallback_needed:
            valid_players = {p for g in candidate_groups for p in g['players']}
            nearby = find_closest_participants(df, idx, player_cols)
            _, day_activity = get_active_players_for_session(df, idx, player_cols)
            
            scores = {}
            for p in (valid_players - current_players):
                scores[p] = nearby.get(p, 0) * 10 + day_activity.get(p, 0) * 5
            
            selected = [p for p, s in sorted(scores.items(), key=lambda x: x[1], reverse=True)[:4-num_known]]
            cleaned_row = row.copy()
            for p in player_cols:
                if p not in current_players and p not in selected: cleaned_row[p] = np.nan
                elif p in selected: cleaned_row[p] = 0
            print(f"Game {idx} ({game_time}): Fallback added {selected}.")
            cleaned_rows.append(cleaned_row)
            last_group, last_group_time = {p for p in player_cols if pd.notna(cleaned_row[p])}, game_time

    cleaned_df = pd.DataFrame(cleaned_rows).drop(columns=['time_diff', 'session_id'])
    for col in player_cols: cleaned_df[col] = pd.to_numeric(cleaned_df[col], errors='coerce')
    return cleaned_df

def main():
    df = clean_mahjong_data('mahjong_data.csv')
    df.to_csv('mahjong_data_cleaned.csv', index=False)
    print("\n✅ Cleaned data saved.")
    return df

if __name__ == "__main__": df = main()
