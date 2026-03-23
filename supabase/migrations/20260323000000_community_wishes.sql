-- Migration: community_wishes
-- Created for REC-43: Game requests system — members request specific games
--
-- Stores community wish requests for games members want to borrow.
-- Includes requester_name and requester_phone (denormalised from members)
-- so the WhatsApp "I have this!" deep-link works without a join.

create table if not exists community_wishes (
  id               uuid        primary key default gen_random_uuid(),
  title            text        not null,
  description      text        not null default '',
  neighborhood     text        not null,
  requester_id     uuid        references auth.users(id) on delete set null,
  requester_name   text,
  requester_phone  text,
  status           text        not null default 'open',   -- open | matched | fulfilled
  urgency          text        not null default 'normal', -- high | normal | low
  category         text,
  age_range        text,
  responses        int         not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists community_wishes_status_idx     on community_wishes (status);
create index if not exists community_wishes_requester_idx  on community_wishes (requester_id);

-- RLS: anyone can read, authenticated or anon users can post
alter table community_wishes enable row level security;

create policy "anyone can read wishes"
  on community_wishes for select
  using (true);

create policy "anyone can post wishes"
  on community_wishes for insert
  with check (true);
