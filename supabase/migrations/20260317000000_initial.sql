-- Play It Forward RBS — Initial Schema Migration
-- Community game & toy lending + relay network for Ramat Bet Shemesh
-- Supabase / PostgreSQL

-- ────────────────────────────────────────────────────────────────────────────
-- MEMBERS (community users, linked to Supabase Auth)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  neighborhood TEXT NOT NULL DEFAULT 'RBS Aleph',
  street TEXT,
  lat NUMERIC(10, 7),
  lng NUMERIC(10, 7),
  bio TEXT,
  kid_ages INTEGER[],
  is_relay_volunteer BOOLEAN DEFAULT FALSE,
  is_founding_member BOOLEAN DEFAULT FALSE,
  trust_score NUMERIC(3, 2) DEFAULT 5.00,
  games_shared INTEGER DEFAULT 0,
  total_handoffs INTEGER DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  city TEXT DEFAULT 'Ramat Beit Shemesh',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────────────────
-- GAMES
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,                   -- 'board_game', 'lego', 'outdoor', 'puzzle', 'toy'
  condition TEXT DEFAULT 'good',   -- 'new'/'like-new', 'good', 'fair'
  age_range_min INTEGER,
  age_range_max INTEGER,
  age_groups TEXT[],               -- ['toddler','kids','tweens','teens','family','adults']
  player_count_min INTEGER,
  player_count_max INTEGER,
  play_time TEXT,
  complexity TEXT DEFAULT 'medium', -- 'light', 'medium', 'heavy'
  photos TEXT[],
  image_url TEXT,
  ownership_type TEXT DEFAULT 'donated', -- 'donated', 'lent'
  owner_id UUID REFERENCES members(id) ON DELETE SET NULL,
  -- For games inserted from add page (auth user ID before member profile exists)
  owner_auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_available BOOLEAN DEFAULT TRUE,
  handoffs INTEGER DEFAULT 0,
  rating NUMERIC(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  request_count INTEGER DEFAULT 0,
  lent_since DATE,
  listed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────────────────
-- LOCATIONS (current holder of each game)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  current_holder_id UUID REFERENCES members(id) ON DELETE SET NULL,
  neighborhood TEXT NOT NULL DEFAULT 'RBS Aleph',
  lat NUMERIC(10, 7),
  lng NUMERIC(10, 7),
  status TEXT DEFAULT 'at_home',   -- 'at_home', 'in_transit', 'at_relay_point'
  last_moved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id)
);

-- ────────────────────────────────────────────────────────────────────────────
-- BORROW HISTORY
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS borrow_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  borrower_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  lender_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  borrowed_at TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  returned_at TIMESTAMPTZ,
  condition_on_return TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active'    -- 'active', 'returned', 'overdue', 'lost'
);

-- ────────────────────────────────────────────────────────────────────────────
-- REVIEWS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT,
  helpful INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────────────────
-- GAME REQUESTS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS game_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES members(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  age_range_min INTEGER,
  age_range_max INTEGER,
  urgency TEXT DEFAULT 'normal',   -- 'low', 'normal', 'high'
  status TEXT DEFAULT 'open',      -- 'open', 'matched', 'fulfilled', 'cancelled'
  matched_game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────────────────
-- RELAY VOLUNTEERS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS relays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  from_neighborhood TEXT NOT NULL,
  to_neighborhood TEXT NOT NULL,
  available_days TEXT[],
  available_hours TEXT,
  max_items_per_trip INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT TRUE,
  rating NUMERIC(3, 2) DEFAULT 5.00,
  total_deliveries INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_members_neighborhood ON members(neighborhood);
CREATE INDEX IF NOT EXISTS idx_members_auth_user ON members(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_games_category ON games(category);
CREATE INDEX IF NOT EXISTS idx_games_available ON games(is_available);
CREATE INDEX IF NOT EXISTS idx_games_owner ON games(owner_id);
CREATE INDEX IF NOT EXISTS idx_games_owner_auth ON games(owner_auth_user_id);
CREATE INDEX IF NOT EXISTS idx_locations_neighborhood ON locations(neighborhood);
CREATE INDEX IF NOT EXISTS idx_locations_holder ON locations(current_holder_id);
CREATE INDEX IF NOT EXISTS idx_borrow_status ON borrow_history(status);
CREATE INDEX IF NOT EXISTS idx_game_requests_status ON game_requests(status);
CREATE INDEX IF NOT EXISTS idx_relays_active ON relays(is_active);
CREATE INDEX IF NOT EXISTS idx_reviews_game ON reviews(game_id);

-- ────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrow_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE relays ENABLE ROW LEVEL SECURITY;

-- Members: public read, own row write
CREATE POLICY "members_read_all" ON members FOR SELECT USING (TRUE);
CREATE POLICY "members_insert_own" ON members FOR INSERT WITH CHECK (auth.uid() = auth_user_id);
CREATE POLICY "members_update_own" ON members FOR UPDATE USING (auth.uid() = auth_user_id);

-- Games: public read, authenticated insert, own game write
CREATE POLICY "games_read_all" ON games FOR SELECT USING (TRUE);
CREATE POLICY "games_insert_auth" ON games FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "games_update_own" ON games FOR UPDATE
  USING (auth.uid() = owner_auth_user_id OR
         auth.uid() = (SELECT auth_user_id FROM members WHERE id = owner_id));

-- Locations: public read
CREATE POLICY "locations_read_all" ON locations FOR SELECT USING (TRUE);
CREATE POLICY "locations_insert_auth" ON locations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "locations_update_holder" ON locations FOR UPDATE USING (
  auth.uid() = (SELECT auth_user_id FROM members WHERE id = current_holder_id)
);

-- Borrow history: authenticated read of own borrows
CREATE POLICY "borrow_read_own" ON borrow_history FOR SELECT
  USING (auth.uid() = (SELECT auth_user_id FROM members WHERE id = borrower_id)
      OR auth.uid() = (SELECT auth_user_id FROM members WHERE id = lender_id));
CREATE POLICY "borrow_insert_auth" ON borrow_history FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Reviews: public read
CREATE POLICY "reviews_read_all" ON reviews FOR SELECT USING (TRUE);
CREATE POLICY "reviews_insert_auth" ON reviews FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Game requests: public read
CREATE POLICY "requests_read_all" ON game_requests FOR SELECT USING (TRUE);
CREATE POLICY "requests_insert_auth" ON game_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "requests_update_own" ON game_requests FOR UPDATE
  USING (auth.uid() = (SELECT auth_user_id FROM members WHERE id = requester_id));

-- Relays: public read
CREATE POLICY "relays_read_all" ON relays FOR SELECT USING (TRUE);
CREATE POLICY "relays_insert_auth" ON relays FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ────────────────────────────────────────────────────────────────────────────
-- AUTO-UPDATE updated_at TRIGGER
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER games_updated_at BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
