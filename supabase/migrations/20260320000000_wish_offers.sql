-- Migration: wish_offers
-- Created for REC-147: Wire "I have this game!" button to WhatsApp + Supabase
--
-- Records when a community member offers to lend a game to fulfill a wish request.

create table if not exists wish_offers (
  id          uuid primary key default gen_random_uuid(),
  wish_id     text        not null,
  offerer_id  text        not null,
  created_at  timestamptz not null default now()
);

create index if not exists wish_offers_wish_id_idx on wish_offers (wish_id);
create index if not exists wish_offers_offerer_id_idx on wish_offers (offerer_id);
