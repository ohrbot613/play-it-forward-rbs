-- Play It Forward — Add game_type and age_range columns to games
-- game_type: detailed game category (Strategy, Family, Party, etc.)
-- age_range: structured age label (e.g. "8+", "All Ages")

ALTER TABLE games
  ADD COLUMN IF NOT EXISTS game_type TEXT,      -- 'Strategy', 'Family', 'Party', 'Educational', 'Cooperative', 'Puzzle', 'Card Game', 'Abstract', 'Trivia', 'Other'
  ADD COLUMN IF NOT EXISTS age_range TEXT;      -- '3+', '5+', '7+', '10+', '12+', '14+', '18+', 'All Ages'

CREATE INDEX IF NOT EXISTS idx_games_game_type ON games(game_type);
CREATE INDEX IF NOT EXISTS idx_games_age_range ON games(age_range);
