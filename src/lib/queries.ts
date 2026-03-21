/**
 * queries.ts — Supabase data fetching layer
 *
 * Maps Supabase DB rows to the Game / UserProfile / Review types used
 * throughout the app. Falls back to mock data when Supabase is not
 * configured (env vars missing) so the app stays usable in development.
 */

import { createClient } from "@/lib/supabase";
import type { Game, UserProfile, Review, GameCategory, GameCondition, AgeGroup, Complexity, OwnershipType, CommunityWish, WishUrgency } from "@/lib/data";

// ─── DB row types ─────────────────────────────────────────────────────────

interface DbGame {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  condition: string | null;
  age_range_min: number | null;
  age_range_max: number | null;
  age_groups: string[] | null;
  player_count_min: number | null;
  player_count_max: number | null;
  play_time: string | null;
  complexity: string | null;
  photos: string[] | null;
  image_url: string | null;
  ownership_type: string | null;
  owner_id: string | null;
  is_available: boolean;
  handoffs: number;
  rating: number;
  review_count: number;
  request_count: number;
  lent_since: string | null;
  listed_at: string;
  // joined
  locations?: DbLocation[] | null;
  owner?: DbMember | null;
}

interface DbLocation {
  game_id: string;
  current_holder_id: string | null;
  neighborhood: string;
  lat: number | null;
  lng: number | null;
  holder?: DbMember | null;
}

interface DbMember {
  id: string;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  neighborhood: string;
  lat: number | null;
  lng: number | null;
  games_shared: number;
  total_handoffs: number;
  trust_score: number;
  bio: string | null;
  kid_ages: number[] | null;
  is_founding_member: boolean;
  referral_code: string | null;
  referred_by: string | null;
  city: string | null;
  created_at: string;
}

// Default RBS Aleph center for games without location data
const DEFAULT_LAT = 31.738;
const DEFAULT_LNG = 34.9875;

// ─── Category / condition mappings ────────────────────────────────────────
// DB stores simplified values; app uses more specific ones

const DB_CATEGORY_TO_APP: Record<string, GameCategory> = {
  board_game: "board-games",
  "board-games": "board-games",
  outdoor: "outdoor-toys",
  "outdoor-toys": "outdoor-toys",
  lego: "lego-building",
  "lego-building": "lego-building",
  magnets: "magnets",
  playmobil: "playmobil",
  puzzle: "puzzles",
  puzzles: "puzzles",
  toy: "other",
  other: "other",
};

const DB_CONDITION_TO_APP: Record<string, GameCondition> = {
  new: "like-new",
  "like-new": "like-new",
  good: "good",
  fair: "fair",
};

// ─── Row → App type mappers ────────────────────────────────────────────────

function mapGame(row: DbGame): Game {
  const location = row.locations?.[0];
  const holder = location?.holder ?? row.owner ?? null;

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    category: DB_CATEGORY_TO_APP[row.category ?? ""] ?? "other",
    condition: DB_CONDITION_TO_APP[row.condition ?? ""] ?? "good",
    ageGroups: (row.age_groups as AgeGroup[]) ?? [],
    minPlayers: row.player_count_min ?? 1,
    maxPlayers: row.player_count_max ?? 4,
    playTime: row.play_time ?? "",
    complexity: (row.complexity as Complexity) ?? "medium",
    photos: row.photos ?? (row.image_url ? [row.image_url] : []),
    currentHolder: {
      userId: holder?.id ?? row.owner_id ?? "",
      name: holder?.name ?? "Community",
      phone: holder?.phone ?? "",
      lat: location?.lat ?? holder?.lat ?? DEFAULT_LAT,
      lng: location?.lng ?? holder?.lng ?? DEFAULT_LNG,
    },
    listedAt: row.listed_at,
    handoffs: row.handoffs,
    rating: row.rating,
    reviewCount: row.review_count,
    ownershipType: (row.ownership_type as OwnershipType) ?? "donated",
    ownerId: row.owner_id ?? "",
    lentSince: row.lent_since ?? undefined,
    available: row.is_available,
    requestCount: row.request_count,
  };
}

function mapMember(row: DbMember): UserProfile {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? "",
    avatar: row.avatar_url ?? `https://i.pravatar.cc/150?u=${row.id}`,
    neighborhood: row.neighborhood,
    gamesShared: row.games_shared,
    totalHandoffs: row.total_handoffs,
    memberSince: row.created_at.split("T")[0],
    trustScore: row.trust_score,
    bio: row.bio ?? "",
    kidAges: row.kid_ages ?? undefined,
    referralCode: row.referral_code ?? "",
    referredBy: row.referred_by ?? undefined,
    isFoundingMember: row.is_founding_member,
    city: row.city ?? "Ramat Beit Shemesh",
  };
}

// ─── Games ────────────────────────────────────────────────────────────────

/**
 * Fetch all available games with their current location and owner.
 * Returns [] (not mock data) when Supabase is unavailable — the page
 * should layer in mock data above this function if needed.
 */
export async function fetchGames(): Promise<Game[]> {
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("games")
    .select(`
      *,
      locations (
        game_id, current_holder_id, neighborhood, lat, lng,
        holder:members!locations_current_holder_id_fkey (
          id, name, phone, avatar_url, neighborhood, lat, lng,
          games_shared, total_handoffs, trust_score, bio, kid_ages,
          is_founding_member, referral_code, referred_by, city, created_at
        )
      ),
      owner:members!games_owner_id_fkey (
        id, name, phone, avatar_url, neighborhood, lat, lng,
        games_shared, total_handoffs, trust_score, bio, kid_ages,
        is_founding_member, referral_code, referred_by, city, created_at
      )
    `)
    .order("listed_at", { ascending: false });

  if (error) {
    console.error("[queries] fetchGames error:", error.message);
    return [];
  }

  return (data as DbGame[]).map(mapGame);
}

/** Fetch a single game by ID */
export async function fetchGame(id: string): Promise<Game | null> {
  const supabase = createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("games")
    .select(`
      *,
      locations (
        game_id, current_holder_id, neighborhood, lat, lng,
        holder:members!locations_current_holder_id_fkey (
          id, name, phone, avatar_url, neighborhood, lat, lng,
          games_shared, total_handoffs, trust_score, bio, kid_ages,
          is_founding_member, referral_code, referred_by, city, created_at
        )
      ),
      owner:members!games_owner_id_fkey (
        id, name, phone, avatar_url, neighborhood, lat, lng,
        games_shared, total_handoffs, trust_score, bio, kid_ages,
        is_founding_member, referral_code, referred_by, city, created_at
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("[queries] fetchGame error:", error.message);
    return null;
  }

  return mapGame(data as DbGame);
}

// ─── Reviews ──────────────────────────────────────────────────────────────

export async function fetchGameReviews(gameId: string): Promise<Review[]> {
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("reviews")
    .select("id, game_id, reviewer_id, rating, text, helpful, created_at")
    .eq("game_id", gameId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[queries] fetchGameReviews error:", error.message);
    return [];
  }

  return (data as DbReview[] ?? []).map((r: DbReview) => ({
    id: r.id,
    userId: r.reviewer_id,
    gameId: r.game_id,
    rating: r.rating,
    text: r.text ?? "",
    createdAt: r.created_at,
    helpful: r.helpful ?? 0,
  }));
}

// ─── Members ──────────────────────────────────────────────────────────────

export async function fetchMember(id: string): Promise<UserProfile | null> {
  const supabase = createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("[queries] fetchMember error:", error.message);
    return null;
  }

  return mapMember(data as DbMember);
}

/** Get the member profile for the currently logged-in user */
export async function fetchCurrentMember(): Promise<UserProfile | null> {
  const supabase = createClient();
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (error) {
    console.error("[queries] fetchCurrentMember error:", error.message);
    return null;
  }

  return mapMember(data as DbMember);
}

/** Get all games owned or currently held by this member */
export async function fetchMemberGames(memberId: string): Promise<Game[]> {
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("games")
    .select(`
      *,
      locations (game_id, current_holder_id, neighborhood, lat, lng),
      owner:members!games_owner_id_fkey (
        id, name, phone, avatar_url, neighborhood, lat, lng,
        games_shared, total_handoffs, trust_score, bio, kid_ages,
        is_founding_member, referral_code, referred_by, city, created_at
      )
    `)
    .eq("owner_id", memberId)
    .order("listed_at", { ascending: false });

  if (error) {
    console.error("[queries] fetchMemberGames error:", error.message);
    return [];
  }

  return (data as DbGame[]).map(mapGame);
}

// ─── Lending requests ─────────────────────────────────────────────────────

export interface LendingRequest {
  id: string;
  gameId: string;
  gameTitle: string;
  gamePhoto: string | null;
  borrowerId: string;
  borrowerName: string;
  lenderId: string;
  lenderName: string;
  status: "pending" | "accepted" | "active" | "completed" | "cancelled";
  requestedAt: string;
  completedAt: string | null;
}

interface DbReview {
  id: string;
  game_id: string;
  reviewer_id: string;
  rating: number;
  text: string | null;
  helpful: number | null;
  created_at: string;
}

interface DbLendingRequest {
  id: string;
  game_id: string;
  borrower_id: string;
  lender_id: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  game?: { title: string; photos: string[] | null; image_url: string | null } | null;
  borrower?: { name: string } | null;
  lender?: { name: string } | null;
}

function mapLendingRequest(row: DbLendingRequest): LendingRequest {
  return {
    id: row.id,
    gameId: row.game_id,
    gameTitle: row.game?.title ?? "Unknown game",
    gamePhoto: row.game?.photos?.[0] ?? row.game?.image_url ?? null,
    borrowerId: row.borrower_id,
    borrowerName: row.borrower?.name ?? "Unknown",
    lenderId: row.lender_id,
    lenderName: row.lender?.name ?? "Unknown",
    status: (row.status as LendingRequest["status"]) ?? "pending",
    requestedAt: row.created_at,
    completedAt: row.completed_at ?? null,
  };
}

/**
 * Fetch lending requests where this member is the borrower.
 * Returns [] gracefully if the table doesn't exist yet.
 */
export async function fetchBorrowHistory(memberId: string): Promise<LendingRequest[]> {
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("lending_requests")
    .select(`
      id, game_id, borrower_id, lender_id, status, created_at, completed_at,
      game:games!lending_requests_game_id_fkey (title, photos, image_url),
      lender:members!lending_requests_lender_id_fkey (name)
    `)
    .eq("borrower_id", memberId)
    .order("created_at", { ascending: false });

  if (error) {
    // Table may not exist yet — fail silently
    if (error.code !== "42P01") {
      console.error("[queries] fetchBorrowHistory error:", error.message);
    }
    return [];
  }

  return (data as DbLendingRequest[]).map(mapLendingRequest);
}

/**
 * Fetch lending requests where this member is the lender.
 * Returns [] gracefully if the table doesn't exist yet.
 */
export async function fetchLendHistory(memberId: string): Promise<LendingRequest[]> {
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("lending_requests")
    .select(`
      id, game_id, borrower_id, lender_id, status, created_at, completed_at,
      game:games!lending_requests_game_id_fkey (title, photos, image_url),
      borrower:members!lending_requests_borrower_id_fkey (name)
    `)
    .eq("lender_id", memberId)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code !== "42P01") {
      console.error("[queries] fetchLendHistory error:", error.message);
    }
    return [];
  }

  return (data as DbLendingRequest[]).map(mapLendingRequest);
}

// ─── Insert Lending Request ───────────────────────────────────────────────

export interface InsertLendingRequestResult {
  success: boolean;
  error?: string;
}

/**
 * Insert a new lending request into the `lending_requests` table.
 * Requires game_id and requester_id. lender_id is set to game owner if
 * available, otherwise an empty placeholder.
 */
export async function insertLendingRequest(
  gameId: string,
  requesterId: string,
  message: string
): Promise<InsertLendingRequestResult> {
  const supabase = createClient();
  if (!supabase) return { success: false, error: "Supabase not configured" };

  // Look up the game owner to set as lender
  const { data: gameRow } = await supabase
    .from("games")
    .select("owner_id")
    .eq("id", gameId)
    .single();

  const lenderId = (gameRow as { owner_id: string | null } | null)?.owner_id ?? requesterId;

  const { error } = await supabase.from("lending_requests").insert({
    game_id: gameId,
    borrower_id: requesterId,
    lender_id: lenderId,
    status: "pending",
    message: message.trim() || null,
    created_at: new Date().toISOString(),
  });

  if (error) {
    if (error.code !== "42P01") {
      console.error("[queries] insertLendingRequest error:", error.message);
    }
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ─── Community Wishes ─────────────────────────────────────────────────────

/*
 * SQL — run once in Supabase SQL editor if table does not exist:
 *
 * create table if not exists community_wishes (
 *   id            uuid primary key default gen_random_uuid(),
 *   title         text not null,
 *   description   text not null default '',
 *   neighborhood  text not null,
 *   requester_id  uuid references auth.users(id) on delete set null,
 *   status        text not null default 'open',   -- open | matched | fulfilled
 *   urgency       text not null default 'normal', -- high | normal | low
 *   category      text,
 *   age_range     text,
 *   responses     int not null default 0,
 *   created_at    timestamptz not null default now(),
 *   updated_at    timestamptz not null default now()
 * );
 *
 * -- Enable RLS and allow anon inserts (adjust to taste):
 * alter table community_wishes enable row level security;
 * create policy "anyone can read wishes"  on community_wishes for select using (true);
 * create policy "anyone can post wishes"  on community_wishes for insert with check (true);
 */

export interface CreateWishResult {
  id: string | null;
  success: boolean;
}

/**
 * Insert a new community wish into the `community_wishes` table.
 * Fails gracefully — returns { success: false, id: null } if Supabase is
 * unconfigured or the table doesn't exist yet.
 */
export async function createWish(
  gameName: string,
  note: string,
  userId: string | null,
  neighborhood: string
): Promise<CreateWishResult> {
  const supabase = createClient();
  if (!supabase) return { success: false, id: null };

  const { data, error } = await supabase
    .from("community_wishes")
    .insert({
      title: gameName.trim(),
      description: note.trim(),
      neighborhood,
      requester_id: userId ?? null,
      status: "open",
      urgency: "normal",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    // Table may not exist yet (code 42P01) — fail silently
    if (error.code !== "42P01") {
      console.error("[queries] createWish error:", error.message);
    }
    return { success: false, id: null };
  }

  return { success: true, id: (data as { id: string } | null)?.id ?? null };
}

// ─── Submit Review ────────────────────────────────────────────────────────

export interface SubmitReviewResult {
  success: boolean;
  error?: string;
}

/**
 * Insert a new review into the `reviews` table.
 * Requires the user to be authenticated.
 */
export async function submitReview(
  gameId: string,
  rating: number,
  comment: string
): Promise<SubmitReviewResult> {
  const supabase = createClient();
  if (!supabase) return { success: false, error: "Supabase not configured" };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Get the member ID from the members table (keyed off auth user)
  const { data: memberRow, error: memberError } = await supabase
    .from("members")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (memberError || !memberRow) {
    return { success: false, error: "Member profile not found" };
  }

  const { error } = await supabase
    .from("reviews")
    .insert({
      game_id: gameId,
      reviewer_id: (memberRow as { id: string }).id,
      rating,
      text: comment.trim(),
      helpful: 0,
      created_at: new Date().toISOString(),
    });

  if (error) {
    console.error("[queries] submitReview error:", error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ─── Fetch Community Wishes ───────────────────────────────────────────────

interface DbCommunityWish {
  id: string;
  title: string;
  description: string;
  neighborhood: string;
  requester_id: string | null;
  status: string;
  urgency: string;
  category: string | null;
  age_range: string | null;
  responses: number;
  created_at: string;
}

/**
 * Fetch all community wishes from the `community_wishes` table.
 * Returns an empty array (so the caller can fall back to mock data) if
 * Supabase is unconfigured or the table doesn't exist yet.
 */
export async function fetchCommunityWishes(): Promise<CommunityWish[]> {
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("community_wishes")
    .select("id, title, description, neighborhood, requester_id, status, urgency, category, age_range, responses, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code !== "42P01") {
      console.error("[queries] fetchCommunityWishes error:", error.message);
    }
    return [];
  }

  return (data as DbCommunityWish[]).map((row) => ({
    id: row.id,
    requesterId: row.requester_id ?? "anonymous",
    requesterName: "Community Member",
    requesterAvatar: `https://api.dicebear.com/7.x/thumbs/svg?seed=${row.id}`,
    neighborhood: row.neighborhood,
    title: row.title,
    description: row.description,
    category: (row.category as GameCategory) ?? "board-games",
    ageRange: row.age_range ?? "All",
    urgency: (row.urgency as WishUrgency) ?? "normal",
    status: (row.status as CommunityWish["status"]) ?? "open",
    createdAt: row.created_at,
    responses: row.responses ?? 0,
  }));
}

// ─── Activity Feed ────────────────────────────────────────────────────────

export interface ActivityItem {
  id: string;
  type: "game-added" | "request-fulfilled" | "new-member" | "game-shared" | "game-donated" | "review" | "request" | "milestone";
  message: string;
  timestamp: string;
  neighborhood: string;
}

/** Pick a first-name + last initial from a full name. E.g. "Miriam Katz" → "Miriam K." */
function shortName(fullName: string): string {
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return fullName;
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

/**
 * Fetch recent community activity from Supabase.
 * Pulls from: games (newly listed), members (recently joined),
 * lending_requests (completed shares), and reviews (recently posted).
 * Returns [] gracefully if Supabase is unconfigured or any table is missing.
 */
export async function getRecentActivity(limit = 10): Promise<ActivityItem[]> {
  const supabase = createClient();
  if (!supabase) return [];

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // last 7 days
  const items: ActivityItem[] = [];

  try {
    // 1. Recently listed games
    const { data: recentGames, error: gamesError } = await supabase
      .from("games")
      .select(`
        id, title, listed_at, ownership_type,
        locations ( neighborhood ),
        owner:members!games_owner_id_fkey ( name, neighborhood )
      `)
      .gte("listed_at", cutoff)
      .order("listed_at", { ascending: false })
      .limit(5);

    if (!gamesError && recentGames) {
      for (const row of recentGames as Array<{
        id: string;
        title: string;
        listed_at: string;
        ownership_type: string | null;
        locations?: Array<{ neighborhood: string }> | null;
        owner?: { name: string; neighborhood: string } | null;
      }>) {
        const ownerName = row.owner?.name ?? "Someone";
        const neighborhood = row.locations?.[0]?.neighborhood ?? row.owner?.neighborhood ?? "Community";
        const isDonated = (row.ownership_type ?? "lent") === "donated";
        items.push({
          id: `game-${row.id}`,
          type: isDonated ? "game-donated" : "game-added",
          message: isDonated
            ? `${shortName(ownerName)} donated ${row.title} to the community library`
            : `${shortName(ownerName)} added ${row.title} to the catalog`,
          timestamp: row.listed_at,
          neighborhood,
        });
      }
    }

    // 2. Recently joined members
    const { data: newMembers, error: membersError } = await supabase
      .from("members")
      .select("id, name, neighborhood, created_at")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(4);

    if (!membersError && newMembers) {
      for (const row of newMembers as Array<{
        id: string;
        name: string;
        neighborhood: string;
        created_at: string;
      }>) {
        items.push({
          id: `member-${row.id}`,
          type: "new-member",
          message: `${shortName(row.name)} joined Play it Forward from ${row.neighborhood}`,
          timestamp: row.created_at,
          neighborhood: row.neighborhood,
        });
      }
    }

    // 3. Recently completed lending requests (game shares)
    const { data: completedLoans, error: loansError } = await supabase
      .from("lending_requests")
      .select(`
        id, completed_at,
        game:games!lending_requests_game_id_fkey ( title ),
        borrower:members!lending_requests_borrower_id_fkey ( name, neighborhood )
      `)
      .eq("status", "completed")
      .not("completed_at", "is", null)
      .gte("completed_at", cutoff)
      .order("completed_at", { ascending: false })
      .limit(4);

    if (!loansError && completedLoans) {
      for (const row of completedLoans as Array<{
        id: string;
        completed_at: string;
        game?: { title: string } | null;
        borrower?: { name: string; neighborhood: string } | null;
      }>) {
        const gameTitle = row.game?.title ?? "a game";
        const borrowerName = row.borrower?.name ?? "Someone";
        const neighborhood = row.borrower?.neighborhood ?? "Community";
        items.push({
          id: `loan-${row.id}`,
          type: "request-fulfilled",
          message: `${gameTitle} was shared with ${shortName(borrowerName)}`,
          timestamp: row.completed_at,
          neighborhood,
        });
      }
    }

    // 4. Recent reviews
    const { data: recentReviews, error: reviewsError } = await supabase
      .from("reviews")
      .select(`
        id, rating, created_at,
        game:games!reviews_game_id_fkey ( title ),
        reviewer:members!reviews_reviewer_id_fkey ( name, neighborhood )
      `)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(3);

    if (!reviewsError && recentReviews) {
      for (const row of recentReviews as Array<{
        id: string;
        rating: number;
        created_at: string;
        game?: { title: string } | null;
        reviewer?: { name: string; neighborhood: string } | null;
      }>) {
        const gameTitle = row.game?.title ?? "a game";
        const reviewerName = row.reviewer?.name ?? "Someone";
        const neighborhood = row.reviewer?.neighborhood ?? "Community";
        items.push({
          id: `review-${row.id}`,
          type: "review",
          message: `${shortName(reviewerName)} left a ${row.rating}-star review for ${gameTitle}`,
          timestamp: row.created_at,
          neighborhood,
        });
      }
    }
  } catch (err) {
    console.error("[queries] getRecentActivity unexpected error:", err);
    return [];
  }

  // Sort all events newest-first and return top N
  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return items.slice(0, limit);
}

// ─── Relay Volunteers ─────────────────────────────────────────────────────

import type { VolunteerCourier } from "@/lib/relay";

interface DbRelay {
  id: string;
  volunteer_id: string;
  is_active: boolean;
  volunteer: {
    id: string;
    name: string;
    lat: number | null;
    lng: number | null;
  } | null;
}

/**
 * Fetch active relay volunteers from the `relays` table joined with their
 * member profile. Used to power the relay route display on the game detail page.
 * Returns [] when Supabase is unconfigured or the table is missing.
 *
 * Note: `gameId` is accepted for API consistency and future per-game filtering,
 * but currently returns all active volunteers for the neighbourhood network.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function fetchGameRelays(_gameId: string): Promise<VolunteerCourier[]> {
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("relays")
    .select(`
      id, volunteer_id, is_active,
      volunteer:members!relays_volunteer_id_fkey (
        id, name, lat, lng
      )
    `)
    .eq("is_active", true);

  if (error) {
    if (error.code !== "42P01") {
      console.error("[queries] fetchGameRelays error:", error.message);
    }
    return [];
  }

  return (data as DbRelay[])
    .filter((r) => r.volunteer !== null && r.volunteer.lat !== null && r.volunteer.lng !== null)
    .map((r) => ({
      id: r.volunteer!.id,
      name: r.volunteer!.name,
      lat: r.volunteer!.lat as number,
      lng: r.volunteer!.lng as number,
    }));
}

// ─── Stats ────────────────────────────────────────────────────────────────

export async function fetchGameStats(): Promise<{ totalGames: number; totalShares: number }> {
  const supabase = createClient();
  if (!supabase) return { totalGames: 0, totalShares: 0 };

  const { data, error } = await supabase
    .from("games")
    .select("handoffs");

  if (error || !data) return { totalGames: 0, totalShares: 0 };

  return {
    totalGames: data.length,
    totalShares: data.reduce((sum: number, g: { handoffs: number | null }) => sum + (g.handoffs ?? 0), 0),
  };
}
