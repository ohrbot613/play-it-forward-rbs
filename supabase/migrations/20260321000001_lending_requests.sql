-- Play It Forward RBS — lending_requests table
-- REC-109: WhatsApp borrowing flow (inbound borrow requests via WhatsApp bot)
--
-- Tracks a borrower's request for a specific game title, matched against
-- available lenders. Created by the WhatsApp lending API route.

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lending_requests (
  id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Borrower (WhatsApp-initiated, may not be a registered member)
  borrower_phone        TEXT         NOT NULL,
  borrower_neighborhood TEXT,

  -- Game being requested
  game_title            TEXT         NOT NULL,
  game_id               UUID         REFERENCES games(id) ON DELETE SET NULL,

  -- Matched lender (populated once a lender is found)
  lender_phone          TEXT,
  lender_member_id      UUID         REFERENCES members(id) ON DELETE SET NULL,

  -- Lifecycle
  status                TEXT         NOT NULL DEFAULT 'pending_lender',
  -- 'pending_lender'  — waiting to find a lender
  -- 'lender_found'    — lender identified, awaiting confirmation
  -- 'confirmed'       — lender confirmed, handoff in progress
  -- 'completed'       — game successfully lent
  -- 'cancelled'       — request cancelled or no lender found

  -- Free-text description captured during relay matching
  relay_description     TEXT,

  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_lending_requests_borrower_phone  ON lending_requests(borrower_phone);
CREATE INDEX IF NOT EXISTS idx_lending_requests_lender_phone    ON lending_requests(lender_phone);
CREATE INDEX IF NOT EXISTS idx_lending_requests_lender_member   ON lending_requests(lender_member_id);
CREATE INDEX IF NOT EXISTS idx_lending_requests_game            ON lending_requests(game_id);
CREATE INDEX IF NOT EXISTS idx_lending_requests_status          ON lending_requests(status);

-- ────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE lending_requests ENABLE ROW LEVEL SECURITY;

-- Authenticated members can read requests where they are the matched lender
CREATE POLICY "lending_requests_read_lender" ON lending_requests
  FOR SELECT
  USING (
    auth.uid() = (SELECT auth_user_id FROM members WHERE id = lender_member_id)
  );

-- Service role (WhatsApp API route using service key) can insert and update freely.
-- Row-level policies do not apply to service_role; this is a safety comment only.

-- Any authenticated user can view their own outbound requests if we later link
-- borrower_phone to a member — placeholder policy for future use.
CREATE POLICY "lending_requests_read_own_borrower" ON lending_requests
  FOR SELECT
  USING (
    auth.uid() = (
      SELECT auth_user_id FROM members
      WHERE phone = borrower_phone
      LIMIT 1
    )
  );

-- ────────────────────────────────────────────────────────────────────────────
-- AUTO-UPDATE updated_at TRIGGER
-- ────────────────────────────────────────────────────────────────────────────

-- set_updated_at() function is defined in 20260317000000_initial.sql

CREATE TRIGGER lending_requests_updated_at
  BEFORE UPDATE ON lending_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
