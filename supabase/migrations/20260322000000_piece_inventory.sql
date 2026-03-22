-- Piece inventory tracking (Vision doc Should Have #10)
-- Lenders can mark whether a game is complete or has missing pieces.

ALTER TABLE games
  ADD COLUMN IF NOT EXISTS pieces_complete BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS missing_pieces_note TEXT;

-- Also add to lending_offers for historical tracking
ALTER TABLE lending_offers
  ADD COLUMN IF NOT EXISTS pieces_complete BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS missing_pieces_note TEXT;

COMMENT ON COLUMN games.pieces_complete IS 'Whether all pieces/parts are present in the game set';
COMMENT ON COLUMN games.missing_pieces_note IS 'Description of which pieces are missing, if any';
