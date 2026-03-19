/**
 * queries.ts — Supabase data fetching layer
 *
 * Maps Supabase DB rows to the Game / UserProfile / Review types used
 * throughout the app. Falls back to mock data when Supabase is not
 * configured (env vars missing) so the app stays usable in development.
 */

import { createClient } from "@/lib/supabase";
import type { Game, UserProfile, Review, GameCategory, GameCondition, AgeGroup, Complexity, OwnershipType } from "@/lib/data";

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

  return (data ?? []).map((r) => ({
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
    totalShares: data.reduce((sum, g) => sum + (g.handoffs ?? 0), 0),
  };
}
