-- Play It Forward — lending_offers table
-- REC-181: Dashboard Accept/Decline flow (REC-171)
--
-- Records inbound loan requests shown to a game owner on their dashboard.
-- The owner can accept or decline each offer; the dashboard fires:
--   supabase.from("lending_offers").update({ status: "accepted|declined" }).eq("id", id)

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists lending_offers (
  id                uuid         primary key default gen_random_uuid(),

  -- The game being requested
  game_id           uuid         references games(id) on delete set null,
  game_title        text         not null,

  -- The owner being asked to lend (lender side)
  lender_id         uuid         references members(id) on delete set null,
  lender_auth_user_id uuid       references auth.users(id) on delete set null,

  -- The member requesting to borrow (requester side)
  requester_id      uuid         references members(id) on delete set null,
  requester_name    text,
  requester_avatar  text,

  -- Lifecycle
  status            text         not null default 'pending',  -- 'pending', 'accepted', 'declined'
  requested_at      timestamptz  not null default now(),

  created_at        timestamptz  not null default now(),
  updated_at        timestamptz  not null default now()
);

-- ────────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ────────────────────────────────────────────────────────────────────────────

create index if not exists idx_lending_offers_lender_auth on lending_offers(lender_auth_user_id);
create index if not exists idx_lending_offers_lender      on lending_offers(lender_id);
create index if not exists idx_lending_offers_requester   on lending_offers(requester_id);
create index if not exists idx_lending_offers_game        on lending_offers(game_id);
create index if not exists idx_lending_offers_status      on lending_offers(status);

-- ────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────────────────────

alter table lending_offers enable row level security;

-- Lender can read their own incoming offers
create policy "lending_offers_read_own_lender" on lending_offers
  for select
  using (
    auth.uid() = lender_auth_user_id
    or auth.uid() = (select auth_user_id from members where id = lender_id)
  );

-- Requester can read their own outgoing offers
create policy "lending_offers_read_own_requester" on lending_offers
  for select
  using (
    auth.uid() = (select auth_user_id from members where id = requester_id)
  );

-- Any authenticated user can create an offer
create policy "lending_offers_insert_auth" on lending_offers
  for insert
  with check (auth.uid() is not null);

-- Lender can update status (accept / decline)
create policy "lending_offers_update_lender" on lending_offers
  for update
  using (
    auth.uid() = lender_auth_user_id
    or auth.uid() = (select auth_user_id from members where id = lender_id)
  );

-- ────────────────────────────────────────────────────────────────────────────
-- AUTO-UPDATE updated_at TRIGGER
-- ────────────────────────────────────────────────────────────────────────────

create trigger lending_offers_updated_at
  before update on lending_offers
  for each row execute function set_updated_at();
