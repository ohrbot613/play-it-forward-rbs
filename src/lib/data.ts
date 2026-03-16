export type GameCategory =
  | "board-games"
  | "outdoor-toys"
  | "lego-building"
  | "magnets"
  | "playmobil"
  | "puzzles"
  | "other";

export type GameCondition = "like-new" | "good" | "fair";

export type AgeGroup = "toddler" | "kids" | "tweens" | "teens" | "family" | "adults";

export type SortOption = "closest" | "category" | "newest" | "most-shared" | "top-rated";

export type Complexity = "light" | "medium" | "heavy";

export interface Review {
  id: string;
  userId: string;
  gameId: string;
  rating: number;
  text: string;
  createdAt: string;
  helpful: number;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  neighborhood: string;
  gamesShared: number;
  totalHandoffs: number;
  memberSince: string;
  trustScore: number;
  bio: string;
}

export interface Game {
  id: string;
  title: string;
  description: string;
  category: GameCategory;
  condition: GameCondition;
  ageGroups: AgeGroup[];
  minPlayers: number;
  maxPlayers: number;
  playTime: string;
  complexity: Complexity;
  photos: string[];
  currentHolder: {
    userId: string;
    name: string;
    phone: string;
    lat: number;
    lng: number;
  };
  listedAt: string;
  handoffs: number;
  rating: number;
  reviewCount: number;
}

export interface GameRequest {
  id: string;
  gameId: string;
  requesterName: string;
  requesterPhone: string;
  status: "pending" | "accepted" | "completed" | "cancelled";
  createdAt: string;
}

export const CATEGORIES: { value: GameCategory; label: string; emoji: string }[] = [
  { value: "board-games", label: "Board Games", emoji: "🎲" },
  { value: "outdoor-toys", label: "Outdoor Toys", emoji: "⚽" },
  { value: "lego-building", label: "LEGO / Building", emoji: "🧱" },
  { value: "magnets", label: "Magnets", emoji: "🧲" },
  { value: "playmobil", label: "Playmobil", emoji: "🏰" },
  { value: "puzzles", label: "Puzzles", emoji: "🧩" },
  { value: "other", label: "Other", emoji: "🎮" },
];

export const AGE_GROUPS: { value: AgeGroup; label: string; range: string }[] = [
  { value: "toddler", label: "Toddlers", range: "2-4" },
  { value: "kids", label: "Kids", range: "5-8" },
  { value: "tweens", label: "Tweens", range: "9-12" },
  { value: "teens", label: "Teens", range: "13+" },
  { value: "family", label: "Family", range: "All" },
  { value: "adults", label: "Adults", range: "18+" },
];

export const CONDITIONS: { value: GameCondition; label: string }[] = [
  { value: "like-new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "closest", label: "Closest" },
  { value: "category", label: "Category" },
  { value: "newest", label: "Newest" },
  { value: "most-shared", label: "Most Shared" },
  { value: "top-rated", label: "Top Rated" },
];

export const COMPLEXITY_LABELS: Record<Complexity, string> = {
  light: "Easy to Learn",
  medium: "Medium",
  heavy: "Complex",
};

// Default user location: center of RBS Aleph
const DEFAULT_LAT = 31.738;
const DEFAULT_LNG = 34.9875;

/** Haversine distance in km between two lat/lng points */
export function distanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Format distance for display */
export function formatDistance(game: Game, userLat = DEFAULT_LAT, userLng = DEFAULT_LNG): string {
  const d = distanceKm(userLat, userLng, game.currentHolder.lat, game.currentHolder.lng);
  if (d < 0.1) return "Nearby";
  if (d < 1) return `${Math.round(d * 10) / 10}km away`;
  return `${Math.round(d * 10) / 10}km away`;
}

/** Get raw distance for sorting */
export function getDistance(game: Game, userLat = DEFAULT_LAT, userLng = DEFAULT_LNG): number {
  return distanceKm(userLat, userLng, game.currentHolder.lat, game.currentHolder.lng);
}

// ─── MOCK USER PROFILES ────────────────────────────────────────────────

export const MOCK_USERS: UserProfile[] = [
  {
    id: "u1",
    name: "Miriam Katz",
    phone: "+972501234567",
    avatar: "https://i.pravatar.cc/150?u=miriam",
    neighborhood: "RBS Aleph",
    gamesShared: 8,
    totalHandoffs: 34,
    memberSince: "2025-09-15",
    trustScore: 4.9,
    bio: "Mom of 5, game night enthusiast. Love sharing what we've outgrown!",
  },
  {
    id: "u2",
    name: "Yosef Levi",
    phone: "+972521234567",
    avatar: "https://i.pravatar.cc/150?u=yosef",
    neighborhood: "RBS Aleph",
    gamesShared: 5,
    totalHandoffs: 18,
    memberSince: "2025-10-01",
    trustScore: 4.7,
    bio: "Father of 3 boys. Board game collector trying to downsize.",
  },
  {
    id: "u3",
    name: "Sarah Berkowitz",
    phone: "+972531234567",
    avatar: "https://i.pravatar.cc/150?u=sarah",
    neighborhood: "RBS Bet",
    gamesShared: 12,
    totalHandoffs: 52,
    memberSince: "2025-08-20",
    trustScore: 5.0,
    bio: "Retired teacher. Games should be played, not collecting dust!",
  },
  {
    id: "u4",
    name: "Avi Mizrachi",
    phone: "+972541234567",
    avatar: "https://i.pravatar.cc/150?u=avi",
    neighborhood: "RBS Aleph",
    gamesShared: 6,
    totalHandoffs: 22,
    memberSince: "2025-11-10",
    trustScore: 4.8,
    bio: "LEGO dad. Kids grew up but the bricks remain.",
  },
  {
    id: "u5",
    name: "Devorah Rosenberg",
    phone: "+972551234567",
    avatar: "https://i.pravatar.cc/150?u=devorah",
    neighborhood: "Old Beit Shemesh",
    gamesShared: 4,
    totalHandoffs: 15,
    memberSince: "2025-12-01",
    trustScore: 4.6,
    bio: "Our playroom was overflowing. Happy to share!",
  },
  {
    id: "u6",
    name: "Chana Perl",
    phone: "+972561234567",
    avatar: "https://i.pravatar.cc/150?u=chana",
    neighborhood: "RBS Gimmel",
    gamesShared: 7,
    totalHandoffs: 28,
    memberSince: "2025-10-15",
    trustScore: 4.9,
    bio: "Playdate coordinator. Big believer in sharing economy.",
  },
  {
    id: "u7",
    name: "Rivka Stern",
    phone: "+972571234567",
    avatar: "https://i.pravatar.cc/150?u=rivka",
    neighborhood: "RBS Aleph",
    gamesShared: 3,
    totalHandoffs: 9,
    memberSince: "2026-01-05",
    trustScore: 4.5,
    bio: "New to the neighborhood. Sharing is a great way to meet people!",
  },
  {
    id: "u8",
    name: "Moshe Twersky",
    phone: "+972581234567",
    avatar: "https://i.pravatar.cc/150?u=moshe",
    neighborhood: "RBS Bet",
    gamesShared: 9,
    totalHandoffs: 41,
    memberSince: "2025-09-01",
    trustScore: 4.8,
    bio: "Magnet and building toy specialist. My kids test everything!",
  },
  {
    id: "u9",
    name: "Tehilla Friedman",
    phone: "+972591234567",
    avatar: "https://i.pravatar.cc/150?u=tehilla",
    neighborhood: "RBS Aleph",
    gamesShared: 6,
    totalHandoffs: 24,
    memberSince: "2025-11-20",
    trustScore: 4.7,
    bio: "Puzzle lover. 1000-piece puzzles are my happy place.",
  },
  {
    id: "u10",
    name: "Dov Goldstein",
    phone: "+972501234568",
    avatar: "https://i.pravatar.cc/150?u=dov",
    neighborhood: "Old Beit Shemesh",
    gamesShared: 11,
    totalHandoffs: 47,
    memberSince: "2025-08-01",
    trustScore: 5.0,
    bio: "Strategy game geek. Happy to teach any game I share.",
  },
  {
    id: "u11",
    name: "Batsheva Cohen",
    phone: "+972521234568",
    avatar: "https://i.pravatar.cc/150?u=batsheva",
    neighborhood: "RBS Gimmel",
    gamesShared: 5,
    totalHandoffs: 19,
    memberSince: "2025-12-15",
    trustScore: 4.6,
    bio: "Outdoor play advocate. Fresh air and games go together!",
  },
  {
    id: "u12",
    name: "Eli Schwartz",
    phone: "+972531234568",
    avatar: "https://i.pravatar.cc/150?u=eli",
    neighborhood: "RBS Aleph",
    gamesShared: 4,
    totalHandoffs: 12,
    memberSince: "2026-01-20",
    trustScore: 4.4,
    bio: "New dad discovering the world of kids' games.",
  },
  {
    id: "u13",
    name: "Naomi Weiss",
    phone: "+972541234568",
    avatar: "https://i.pravatar.cc/150?u=naomi",
    neighborhood: "RBS Bet",
    gamesShared: 8,
    totalHandoffs: 33,
    memberSince: "2025-10-05",
    trustScore: 4.8,
    bio: "Homeschool mom. Games are our favorite teaching tool.",
  },
  {
    id: "u14",
    name: "Shlomo Adler",
    phone: "+972551234568",
    avatar: "https://i.pravatar.cc/150?u=shlomo",
    neighborhood: "RBS Aleph",
    gamesShared: 3,
    totalHandoffs: 8,
    memberSince: "2026-02-01",
    trustScore: 4.3,
    bio: "Just moved in. Looking forward to game nights with neighbors.",
  },
  {
    id: "u15",
    name: "Racheli Shapiro",
    phone: "+972561234568",
    avatar: "https://i.pravatar.cc/150?u=racheli",
    neighborhood: "RBS Gimmel",
    gamesShared: 7,
    totalHandoffs: 30,
    memberSince: "2025-09-20",
    trustScore: 4.9,
    bio: "Community organizer. Sharing builds community!",
  },
];

function user(id: string) {
  const u = MOCK_USERS.find((p) => p.id === id)!;
  return { userId: u.id, name: u.name.split(" ")[0] + " " + u.name.split(" ")[1][0] + ".", phone: u.phone };
}

// RBS area coordinates for realistic spread
function rbs(latOffset: number, lngOffset: number) {
  return { lat: 31.738 + latOffset, lng: 34.9875 + lngOffset };
}

// ─── MOCK GAMES (55 ENTRIES) ────────────────────────────────────────────

export const MOCK_GAMES: Game[] = [
  // ── BOARD GAMES (18) ──────────────────────────────────────────────
  {
    id: "1",
    title: "Settlers of Catan",
    description: "Build settlements, trade resources, and become the dominant force on the island of Catan. Complete base game with all 95 resource cards, 19 terrain hexes, and wooden pieces. Perfect for family game night.",
    category: "board-games",
    condition: "like-new",
    ageGroups: ["tweens", "teens", "family"],
    minPlayers: 3,
    maxPlayers: 4,
    playTime: "60-120 min",
    complexity: "medium",
    photos: ["https://images.unsplash.com/photo-1632501641765-e568d28b0015?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u1"), ...rbs(0, 0) },
    listedAt: "2026-03-10",
    handoffs: 7,
    rating: 4.8,
    reviewCount: 5,
  },
  {
    id: "2",
    title: "Ticket to Ride",
    description: "Collect train cards, claim railway routes, and connect cities across the map. Europe edition with 240 train cars, 110 cards, and a large format board. Great for introducing strategy games.",
    category: "board-games",
    condition: "good",
    ageGroups: ["kids", "tweens", "family"],
    minPlayers: 2,
    maxPlayers: 5,
    playTime: "30-60 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1606503153255-59d8b2e4b0a4?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u2"), ...rbs(-0.004, -0.003) },
    listedAt: "2026-03-08",
    handoffs: 4,
    rating: 4.6,
    reviewCount: 4,
  },
  {
    id: "3",
    title: "Rummikub",
    description: "Classic tile-based game of strategy and luck. A staple in every Israeli home. 106 tiles in great condition, all racks included. Quick to learn, endlessly replayable.",
    category: "board-games",
    condition: "fair",
    ageGroups: ["kids", "tweens", "teens", "family"],
    minPlayers: 2,
    maxPlayers: 4,
    playTime: "30-60 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1611371805429-8b5c1b2c34ba?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u5"), ...rbs(0.008, 0.004) },
    listedAt: "2026-03-01",
    handoffs: 12,
    rating: 4.5,
    reviewCount: 5,
  },
  {
    id: "4",
    title: "Codenames",
    description: "Two rival spymasters know the secret identities of 25 agents. Their teammates know them only by codename. Brilliant party game for groups. All 200 double-sided cards included.",
    category: "board-games",
    condition: "like-new",
    ageGroups: ["teens", "family", "adults"],
    minPlayers: 4,
    maxPlayers: 8,
    playTime: "15-30 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u10"), ...rbs(-0.007, 0.002) },
    listedAt: "2026-03-14",
    handoffs: 3,
    rating: 4.9,
    reviewCount: 4,
  },
  {
    id: "5",
    title: "Carcassonne",
    description: "Place tiles to build a medieval landscape, then deploy followers as knights, farmers, and monks. Base game with 72 land tiles and 40 meeples. Simple rules, deep strategy.",
    category: "board-games",
    condition: "good",
    ageGroups: ["tweens", "teens", "family"],
    minPlayers: 2,
    maxPlayers: 5,
    playTime: "30-45 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1566694271453-390536dd1f0d?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u3"), ...rbs(-0.003, -0.005) },
    listedAt: "2026-02-28",
    handoffs: 6,
    rating: 4.7,
    reviewCount: 3,
  },
  {
    id: "6",
    title: "Pandemic",
    description: "Work together as a team of disease-fighting specialists. Your mission: treat infections around the world while discovering cures. Cooperative play at its finest. All role cards and disease cubes included.",
    category: "board-games",
    condition: "like-new",
    ageGroups: ["tweens", "teens", "adults"],
    minPlayers: 2,
    maxPlayers: 4,
    playTime: "45-60 min",
    complexity: "medium",
    photos: ["https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u10"), ...rbs(-0.006, 0.003) },
    listedAt: "2026-03-12",
    handoffs: 2,
    rating: 4.8,
    reviewCount: 3,
  },
  {
    id: "7",
    title: "Dixit",
    description: "Use beautifully illustrated cards to tell stories. A word, a phrase, a sound — your imagination sets the scene. 84 stunning oversized cards. A creative, artistic game the whole family can enjoy.",
    category: "board-games",
    condition: "good",
    ageGroups: ["kids", "tweens", "family"],
    minPlayers: 3,
    maxPlayers: 6,
    playTime: "30 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1585504198199-20277593b94f?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u6"), ...rbs(0.005, 0.001) },
    listedAt: "2026-03-05",
    handoffs: 5,
    rating: 4.6,
    reviewCount: 4,
  },
  {
    id: "8",
    title: "7 Wonders",
    description: "Lead an ancient civilization through three ages. Develop your military, science, and economy. Card drafting mechanic means everyone plays simultaneously — no waiting! All 7 wonder boards included.",
    category: "board-games",
    condition: "like-new",
    ageGroups: ["tweens", "teens", "adults"],
    minPlayers: 3,
    maxPlayers: 7,
    playTime: "30-45 min",
    complexity: "medium",
    photos: ["https://images.unsplash.com/photo-1529480780361-b3a4e3f1938e?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u2"), ...rbs(-0.002, -0.001) },
    listedAt: "2026-03-09",
    handoffs: 3,
    rating: 4.7,
    reviewCount: 3,
  },
  {
    id: "9",
    title: "Splendor",
    description: "Collect gems to purchase development cards and attract noble patrons. Engine-building at its most elegant. Weighted poker-style gem chips feel premium. Complete set in tin box.",
    category: "board-games",
    condition: "good",
    ageGroups: ["tweens", "teens", "family"],
    minPlayers: 2,
    maxPlayers: 4,
    playTime: "30 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1563901935883-cb61f6b1f657?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u13"), ...rbs(0.001, -0.004) },
    listedAt: "2026-02-25",
    handoffs: 8,
    rating: 4.5,
    reviewCount: 5,
  },
  {
    id: "10",
    title: "Azul",
    description: "Draft beautiful Portuguese tiles to decorate the walls of the Royal Palace of Evora. Stunning component quality with heavy resin tiles. Abstract strategy that's addictive.",
    category: "board-games",
    condition: "like-new",
    ageGroups: ["tweens", "teens", "family", "adults"],
    minPlayers: 2,
    maxPlayers: 4,
    playTime: "30-45 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1596451190630-186aff535bf2?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u9"), ...rbs(0.003, 0.002) },
    listedAt: "2026-03-11",
    handoffs: 4,
    rating: 4.8,
    reviewCount: 4,
  },
  {
    id: "11",
    title: "Kingdomino",
    description: "Build a kingdom with domino-like tiles featuring different terrain types. Quick, clever, and beautiful. The 2017 Spiel des Jahres winner. Perfect gateway game.",
    category: "board-games",
    condition: "good",
    ageGroups: ["kids", "tweens", "family"],
    minPlayers: 2,
    maxPlayers: 4,
    playTime: "15-20 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u15"), ...rbs(0.006, -0.002) },
    listedAt: "2026-03-07",
    handoffs: 5,
    rating: 4.4,
    reviewCount: 3,
  },
  {
    id: "12",
    title: "Monopoly Classic",
    description: "The classic property trading game. Buy, sell, and scheme your way to riches. Complete set with all tokens, houses, hotels, and money. Great for teaching kids about money.",
    category: "board-games",
    condition: "fair",
    ageGroups: ["kids", "tweens", "teens", "family"],
    minPlayers: 2,
    maxPlayers: 6,
    playTime: "60-180 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1640461829594-dba1cf571880?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u14"), ...rbs(0.002, 0.005) },
    listedAt: "2026-02-20",
    handoffs: 10,
    rating: 3.9,
    reviewCount: 5,
  },
  {
    id: "13",
    title: "Scrabble Hebrew Edition",
    description: "The beloved word game in Hebrew. Build words on the premium board to score points. All 100 letter tiles, 4 racks, and tile bag included. Perfect for Hebrew practice!",
    category: "board-games",
    condition: "good",
    ageGroups: ["tweens", "teens", "family", "adults"],
    minPlayers: 2,
    maxPlayers: 4,
    playTime: "60-90 min",
    complexity: "medium",
    photos: ["https://images.unsplash.com/photo-1588412079929-790b9f593d8e?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u3"), ...rbs(-0.002, -0.006) },
    listedAt: "2026-03-03",
    handoffs: 6,
    rating: 4.3,
    reviewCount: 3,
  },
  {
    id: "14",
    title: "Uno",
    description: "Fast-paced card matching game that everyone knows. 108 cards, easy rules, maximum fun. Toss out Skip, Reverse, and Draw Two cards to change the game. Great for all ages.",
    category: "board-games",
    condition: "like-new",
    ageGroups: ["kids", "tweens", "teens", "family"],
    minPlayers: 2,
    maxPlayers: 10,
    playTime: "15-30 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1605870445919-838d190e8e1b?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u7"), ...rbs(0.004, -0.001) },
    listedAt: "2026-03-15",
    handoffs: 2,
    rating: 4.2,
    reviewCount: 3,
  },
  {
    id: "15",
    title: "Chess Set (Wooden)",
    description: "Beautiful wooden chess set with folding board. Pieces are Staunton-style, felted on the bottom. Board doubles as storage box. Tournament size. Perfect for kids learning chess.",
    category: "board-games",
    condition: "like-new",
    ageGroups: ["kids", "tweens", "teens", "adults"],
    minPlayers: 2,
    maxPlayers: 2,
    playTime: "30-60 min",
    complexity: "heavy",
    photos: ["https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u10"), ...rbs(-0.005, 0.001) },
    listedAt: "2026-03-06",
    handoffs: 3,
    rating: 4.9,
    reviewCount: 4,
  },
  {
    id: "16",
    title: "Spot It! / Dobble",
    description: "Lightning-fast pattern recognition game. Find the one matching symbol between any two cards. 55 cards, 5 mini-games. Fits in a small tin — perfect for taking to the park.",
    category: "board-games",
    condition: "like-new",
    ageGroups: ["kids", "tweens", "family"],
    minPlayers: 2,
    maxPlayers: 8,
    playTime: "10-15 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1612404730960-5c71577fca11?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u6"), ...rbs(0.004, 0.003) },
    listedAt: "2026-03-13",
    handoffs: 6,
    rating: 4.5,
    reviewCount: 4,
  },
  {
    id: "17",
    title: "Clue (Classic Edition)",
    description: "Who did it, where, and with what weapon? The classic mystery detective game. Move through the mansion, gather clues, and solve the crime. All character tokens and weapons included.",
    category: "board-games",
    condition: "good",
    ageGroups: ["kids", "tweens", "teens", "family"],
    minPlayers: 3,
    maxPlayers: 6,
    playTime: "30-60 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1606503153255-59d8b2e4b0a4?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u12"), ...rbs(0.001, 0.004) },
    listedAt: "2026-02-22",
    handoffs: 7,
    rating: 4.1,
    reviewCount: 3,
  },
  {
    id: "18",
    title: "Blokus",
    description: "Claim territory by fitting your colored pieces onto the board. Each new piece must touch a corner of your previously placed piece. Deceptively simple, deeply strategic. All 84 pieces included.",
    category: "board-games",
    condition: "like-new",
    ageGroups: ["kids", "tweens", "teens", "family"],
    minPlayers: 2,
    maxPlayers: 4,
    playTime: "20-30 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1632501641765-e568d28b0015?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u1"), ...rbs(0.001, 0.001) },
    listedAt: "2026-03-04",
    handoffs: 4,
    rating: 4.6,
    reviewCount: 3,
  },

  // ── OUTDOOR TOYS (8) ─────────────────────────────────────────────
  {
    id: "19",
    title: "Ring Toss Set (Wooden)",
    description: "Premium wooden ring toss set with 5 pegs and 10 rope rings. Great for backyard parties and family gatherings. All-weather durable construction. Kids love it!",
    category: "outdoor-toys",
    condition: "like-new",
    ageGroups: ["toddler", "kids", "family"],
    minPlayers: 1,
    maxPlayers: 6,
    playTime: "15-30 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u7"), ...rbs(0.004, -0.002) },
    listedAt: "2026-03-13",
    handoffs: 3,
    rating: 4.3,
    reviewCount: 3,
  },
  {
    id: "20",
    title: "Giant Jenga (Outdoor)",
    description: "Oversized Jenga tower grows to over 3 feet tall! 54 precision-cut pine blocks. Perfect for Shabbat afternoons in the park. Includes carrying bag.",
    category: "outdoor-toys",
    condition: "good",
    ageGroups: ["kids", "tweens", "teens", "family"],
    minPlayers: 2,
    maxPlayers: 10,
    playTime: "15-30 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1473882326264-73f8fdc46fb8?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u11"), ...rbs(0.007, -0.003) },
    listedAt: "2026-03-10",
    handoffs: 5,
    rating: 4.7,
    reviewCount: 4,
  },
  {
    id: "21",
    title: "Badminton Set (4 Player)",
    description: "Complete 4-player badminton set with net, poles, 4 rackets, and 6 shuttlecocks. Sets up in minutes. Great exercise for the whole family. Carrying case included.",
    category: "outdoor-toys",
    condition: "good",
    ageGroups: ["kids", "tweens", "teens", "family"],
    minPlayers: 2,
    maxPlayers: 4,
    playTime: "30-60 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u11"), ...rbs(0.008, -0.002) },
    listedAt: "2026-03-08",
    handoffs: 2,
    rating: 4.4,
    reviewCount: 2,
  },
  {
    id: "22",
    title: "Soccer Goal Set (Pop-Up)",
    description: "Two pop-up soccer goals with carrying bag. Perfect size for backyard or park play. Sets up instantly, folds flat. Includes 4 ground stakes per goal.",
    category: "outdoor-toys",
    condition: "like-new",
    ageGroups: ["kids", "tweens", "teens"],
    minPlayers: 2,
    maxPlayers: 12,
    playTime: "30-60 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u4"), ...rbs(-0.004, 0.002) },
    listedAt: "2026-03-11",
    handoffs: 3,
    rating: 4.5,
    reviewCount: 2,
  },
  {
    id: "23",
    title: "Stomp Rocket",
    description: "Air-powered rocket launcher. Jump on the pad and watch foam rockets soar! Includes launcher base and 6 replacement rockets. Kids absolutely love this.",
    category: "outdoor-toys",
    condition: "good",
    ageGroups: ["toddler", "kids"],
    minPlayers: 1,
    maxPlayers: 4,
    playTime: "15-30 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1516475429286-465d815a0df7?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u12"), ...rbs(0.002, 0.003) },
    listedAt: "2026-03-14",
    handoffs: 4,
    rating: 4.6,
    reviewCount: 3,
  },
  {
    id: "24",
    title: "Frisbee Golf Set",
    description: "Set of 3 disc golf discs (driver, mid-range, putter) plus a portable basket target. Great way to explore RBS parks! Suitable for beginners.",
    category: "outdoor-toys",
    condition: "like-new",
    ageGroups: ["tweens", "teens", "adults"],
    minPlayers: 1,
    maxPlayers: 4,
    playTime: "30-60 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1594495894542-a46cc73e6014?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u14"), ...rbs(0.003, 0.006) },
    listedAt: "2026-03-02",
    handoffs: 1,
    rating: 4.2,
    reviewCount: 2,
  },
  {
    id: "25",
    title: "Capture the Flag Kit (Glow)",
    description: "Glow-in-the-dark capture the flag set with LED orbs, territory markers, and glow bracelets. Enough for 20 players! Epic for neighborhood events and birthday parties.",
    category: "outdoor-toys",
    condition: "like-new",
    ageGroups: ["kids", "tweens", "teens"],
    minPlayers: 4,
    maxPlayers: 20,
    playTime: "30-60 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1536746803623-cef87080bfc8?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u15"), ...rbs(0.007, -0.001) },
    listedAt: "2026-03-15",
    handoffs: 1,
    rating: 4.9,
    reviewCount: 3,
  },
  {
    id: "26",
    title: "Croquet Set",
    description: "Classic 6-player croquet set with wooden mallets, balls, wickets, and stakes. Great for Shabbat afternoon in the yard. Comes in a wooden carrying rack.",
    category: "outdoor-toys",
    condition: "fair",
    ageGroups: ["kids", "tweens", "family"],
    minPlayers: 2,
    maxPlayers: 6,
    playTime: "30-60 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1595429035839-c99c298ffdde?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u5"), ...rbs(0.009, 0.005) },
    listedAt: "2026-02-18",
    handoffs: 8,
    rating: 4.0,
    reviewCount: 3,
  },

  // ── LEGO / BUILDING (9) ──────────────────────────────────────────
  {
    id: "27",
    title: "LEGO City Fire Station (60320)",
    description: "Complete LEGO City Fire Station set with garage, fire truck, helicopter, and 5 minifigures. 766 pieces, all present with original instructions. Ages 6+.",
    category: "lego-building",
    condition: "like-new",
    ageGroups: ["kids", "tweens"],
    minPlayers: 1,
    maxPlayers: 2,
    playTime: "120-180 min",
    complexity: "medium",
    photos: ["https://images.unsplash.com/photo-1587654780291-39c9404d7dd0?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u4"), ...rbs(-0.005, 0.002) },
    listedAt: "2026-03-12",
    handoffs: 2,
    rating: 4.7,
    reviewCount: 3,
  },
  {
    id: "28",
    title: "LEGO Creator 3-in-1 Treehouse",
    description: "Build a treehouse, biplane, or catamaran from the same 356 pieces! Creative building with 3 instruction booklets. Perfect for imaginative builders ages 7+.",
    category: "lego-building",
    condition: "good",
    ageGroups: ["kids", "tweens"],
    minPlayers: 1,
    maxPlayers: 2,
    playTime: "60-120 min",
    complexity: "medium",
    photos: ["https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u4"), ...rbs(-0.004, 0.001) },
    listedAt: "2026-03-06",
    handoffs: 4,
    rating: 4.5,
    reviewCount: 3,
  },
  {
    id: "29",
    title: "LEGO Technic Crane (42146)",
    description: "Advanced LEGO Technic mobile crane with working boom, outriggers, and rotation. 1,292 pieces for a serious building challenge. Instructions app compatible. Ages 10+.",
    category: "lego-building",
    condition: "like-new",
    ageGroups: ["tweens", "teens"],
    minPlayers: 1,
    maxPlayers: 1,
    playTime: "180-300 min",
    complexity: "heavy",
    photos: ["https://images.unsplash.com/photo-1572443490709-e57345be0cfc?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u8"), ...rbs(0.006, -0.004) },
    listedAt: "2026-03-09",
    handoffs: 1,
    rating: 4.8,
    reviewCount: 2,
  },
  {
    id: "30",
    title: "LEGO Friends Heartlake City",
    description: "Heartlake City School set with 3 classrooms, a playground, and 4 mini-dolls. 605 pieces. All stickers intact. Very popular with girls ages 6-10.",
    category: "lego-building",
    condition: "good",
    ageGroups: ["kids", "tweens"],
    minPlayers: 1,
    maxPlayers: 3,
    playTime: "90-150 min",
    complexity: "medium",
    photos: ["https://images.unsplash.com/photo-1560961911-ba7ef651a56c?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u13"), ...rbs(0.002, -0.003) },
    listedAt: "2026-03-04",
    handoffs: 5,
    rating: 4.4,
    reviewCount: 3,
  },
  {
    id: "31",
    title: "LEGO Classic Creative Brick Box",
    description: "790 pieces in 33 different colors. Windows, doors, wheels, eyes, and a green baseplate. Open-ended building for unlimited creativity. Perfect starter set.",
    category: "lego-building",
    condition: "fair",
    ageGroups: ["kids", "tweens"],
    minPlayers: 1,
    maxPlayers: 4,
    playTime: "30-180 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u1"), ...rbs(0.001, -0.001) },
    listedAt: "2026-02-15",
    handoffs: 11,
    rating: 4.6,
    reviewCount: 5,
  },
  {
    id: "32",
    title: "Duplo Zoo Animals",
    description: "LEGO Duplo World Animals set with giraffe, elephant, panda, and more. 142 large pieces safe for toddlers. Includes habitat builds and keeper figures.",
    category: "lego-building",
    condition: "good",
    ageGroups: ["toddler", "kids"],
    minPlayers: 1,
    maxPlayers: 3,
    playTime: "20-60 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u6"), ...rbs(0.005, 0.002) },
    listedAt: "2026-03-10",
    handoffs: 7,
    rating: 4.7,
    reviewCount: 4,
  },
  {
    id: "33",
    title: "LEGO Star Wars X-Wing",
    description: "LEGO Star Wars X-Wing Starfighter (75301). 474 pieces with Luke, R2-D2, and Princess Leia minifigures. Retractable landing gear and opening cockpit. Ages 9+.",
    category: "lego-building",
    condition: "like-new",
    ageGroups: ["tweens", "teens"],
    minPlayers: 1,
    maxPlayers: 1,
    playTime: "90-120 min",
    complexity: "medium",
    photos: ["https://images.unsplash.com/photo-1472457897821-70d3819a0e24?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u2"), ...rbs(-0.003, -0.002) },
    listedAt: "2026-03-07",
    handoffs: 3,
    rating: 4.8,
    reviewCount: 3,
  },
  {
    id: "34",
    title: "K'NEX Roller Coaster Building Set",
    description: "Build a working roller coaster with motorized chain lift! 546 K'NEX pieces with track, car, and motor. Engineering fun for budding builders. Ages 9+.",
    category: "lego-building",
    condition: "good",
    ageGroups: ["tweens", "teens"],
    minPlayers: 1,
    maxPlayers: 2,
    playTime: "120-180 min",
    complexity: "heavy",
    photos: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u8"), ...rbs(0.007, -0.003) },
    listedAt: "2026-02-28",
    handoffs: 3,
    rating: 4.3,
    reviewCount: 2,
  },
  {
    id: "35",
    title: "Marble Run Mega Set",
    description: "150-piece marble run construction set with spirals, funnels, and bridges. Build, customize, and watch marbles race! Includes 30 glass marbles. STEM learning through play.",
    category: "lego-building",
    condition: "like-new",
    ageGroups: ["kids", "tweens"],
    minPlayers: 1,
    maxPlayers: 3,
    playTime: "30-90 min",
    complexity: "medium",
    photos: ["https://images.unsplash.com/photo-1587654780291-39c9404d7dd0?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u13"), ...rbs(0.003, -0.005) },
    listedAt: "2026-03-01",
    handoffs: 6,
    rating: 4.5,
    reviewCount: 3,
  },

  // ── MAGNETS (7) ──────────────────────────────────────────────────
  {
    id: "36",
    title: "Magna-Tiles 100pc Set",
    description: "The original magnetic building tiles. 100 pieces in vibrant translucent colors — squares, triangles, and specialty shapes. Hours of open-ended creative play. All pieces present and magnetic.",
    category: "magnets",
    condition: "good",
    ageGroups: ["toddler", "kids"],
    minPlayers: 1,
    maxPlayers: 4,
    playTime: "20-60 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u3"), ...rbs(-0.001, -0.004) },
    listedAt: "2026-03-05",
    handoffs: 9,
    rating: 4.9,
    reviewCount: 5,
  },
  {
    id: "37",
    title: "Magformers 62pc Set",
    description: "Magnetic construction set with wheels, squares, triangles, and pentagons. Build vehicles, structures, and geometric shapes! Strong magnets click together satisfyingly.",
    category: "magnets",
    condition: "good",
    ageGroups: ["toddler", "kids"],
    minPlayers: 1,
    maxPlayers: 3,
    playTime: "20-60 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u8"), ...rbs(0.006, -0.002) },
    listedAt: "2026-03-11",
    handoffs: 6,
    rating: 4.7,
    reviewCount: 4,
  },
  {
    id: "38",
    title: "PicassoTiles 60pc",
    description: "Affordable magnetic tile set with clear colors. 60 pieces including squares and triangles. Compatible with other magnetic tile brands. Great starter set for younger kids.",
    category: "magnets",
    condition: "like-new",
    ageGroups: ["toddler", "kids"],
    minPlayers: 1,
    maxPlayers: 3,
    playTime: "15-45 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1566694271453-390536dd1f0d?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u12"), ...rbs(0.002, 0.002) },
    listedAt: "2026-03-14",
    handoffs: 2,
    rating: 4.3,
    reviewCount: 2,
  },
  {
    id: "39",
    title: "Geomag Mechanics 164pc",
    description: "Magnetic construction with gears and mechanical elements. Build machines that actually move! 86 magnetic rods, 44 steel spheres, and 34 mechanical parts. Ages 5+.",
    category: "magnets",
    condition: "good",
    ageGroups: ["kids", "tweens"],
    minPlayers: 1,
    maxPlayers: 2,
    playTime: "30-90 min",
    complexity: "medium",
    photos: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u8"), ...rbs(0.005, -0.005) },
    listedAt: "2026-02-25",
    handoffs: 4,
    rating: 4.5,
    reviewCount: 3,
  },
  {
    id: "40",
    title: "Magna-Tiles Metropolis 110pc",
    description: "The city-themed Magna-Tiles expansion with special window, door, and balcony tiles. Build skyscrapers, houses, and entire neighborhoods! Compatible with standard Magna-Tiles.",
    category: "magnets",
    condition: "like-new",
    ageGroups: ["kids", "tweens"],
    minPlayers: 1,
    maxPlayers: 4,
    playTime: "30-90 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u1"), ...rbs(0, -0.002) },
    listedAt: "2026-03-09",
    handoffs: 3,
    rating: 4.8,
    reviewCount: 3,
  },
  {
    id: "41",
    title: "Tegu Magnetic Wooden Blocks 42pc",
    description: "Beautiful magnetic wooden blocks with hidden internal magnets. Natural wood and bold colors. Sustainably sourced. Satisfying click-together building for all ages.",
    category: "magnets",
    condition: "good",
    ageGroups: ["toddler", "kids", "tweens"],
    minPlayers: 1,
    maxPlayers: 3,
    playTime: "15-60 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u9"), ...rbs(0.004, 0.001) },
    listedAt: "2026-03-02",
    handoffs: 5,
    rating: 4.6,
    reviewCount: 3,
  },
  {
    id: "42",
    title: "Magformers Carnival Plus 46pc",
    description: "Special Magformers set with LED light insert, Ferris wheel, and carnival accessories. Builds light up! All 46 pieces plus battery-operated LED included.",
    category: "magnets",
    condition: "like-new",
    ageGroups: ["kids", "tweens"],
    minPlayers: 1,
    maxPlayers: 2,
    playTime: "20-60 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u6"), ...rbs(0.006, 0.003) },
    listedAt: "2026-03-13",
    handoffs: 2,
    rating: 4.7,
    reviewCount: 2,
  },

  // ── PLAYMOBIL (6) ────────────────────────────────────────────────
  {
    id: "43",
    title: "Playmobil Pirate Ship (70411)",
    description: "Large Playmobil pirate ship with firing cannons, hidden treasure compartment, and 3 pirate figures. Floats in the bath! 132 pieces including parrot and treasure chest.",
    category: "playmobil",
    condition: "good",
    ageGroups: ["kids", "tweens"],
    minPlayers: 1,
    maxPlayers: 3,
    playTime: "30-90 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u6"), ...rbs(0.005, 0.001) },
    listedAt: "2026-03-14",
    handoffs: 4,
    rating: 4.6,
    reviewCount: 3,
  },
  {
    id: "44",
    title: "Playmobil Horse Farm",
    description: "Complete horse farm with stable building, 3 horses, riding arena, and 2 figures. Lots of accessories including saddles, grooming tools, and hay bales. Very popular with girls.",
    category: "playmobil",
    condition: "like-new",
    ageGroups: ["kids", "tweens"],
    minPlayers: 1,
    maxPlayers: 3,
    playTime: "30-90 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1560961911-ba7ef651a56c?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u13"), ...rbs(0.001, -0.002) },
    listedAt: "2026-03-07",
    handoffs: 5,
    rating: 4.7,
    reviewCount: 4,
  },
  {
    id: "45",
    title: "Playmobil City Life School",
    description: "Playmobil school building with furnished classroom, gym equipment, and 5 figures (teacher + students). Clock with moveable hands for learning time. Ages 4+.",
    category: "playmobil",
    condition: "good",
    ageGroups: ["kids"],
    minPlayers: 1,
    maxPlayers: 2,
    playTime: "30-60 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u15"), ...rbs(0.008, 0) },
    listedAt: "2026-03-03",
    handoffs: 3,
    rating: 4.4,
    reviewCount: 2,
  },
  {
    id: "46",
    title: "Playmobil Family Camping",
    description: "Family camping set with tent, campfire, lanterns, and 4 family figures. Includes cooking accessories, sleeping bags, and a friendly raccoon. Great imaginative play.",
    category: "playmobil",
    condition: "like-new",
    ageGroups: ["toddler", "kids"],
    minPlayers: 1,
    maxPlayers: 2,
    playTime: "20-60 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u7"), ...rbs(0.003, -0.003) },
    listedAt: "2026-03-12",
    handoffs: 2,
    rating: 4.5,
    reviewCount: 2,
  },
  {
    id: "47",
    title: "Playmobil Fire Station",
    description: "Large fire station with sliding pole, fire truck, helicopter pad, and 4 firefighter figures. Working alarm bell and opening garage doors. 180+ pieces.",
    category: "playmobil",
    condition: "fair",
    ageGroups: ["kids", "tweens"],
    minPlayers: 1,
    maxPlayers: 3,
    playTime: "30-90 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1587654780291-39c9404d7dd0?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u5"), ...rbs(0.007, 0.003) },
    listedAt: "2026-02-20",
    handoffs: 9,
    rating: 4.3,
    reviewCount: 4,
  },
  {
    id: "48",
    title: "Playmobil Knights Castle",
    description: "Medieval castle playset with drawbridge, dungeon, and 4 knight figures. Includes catapult, shields, and treasure room. Walls connect and detach for easy storage.",
    category: "playmobil",
    condition: "good",
    ageGroups: ["kids", "tweens"],
    minPlayers: 1,
    maxPlayers: 3,
    playTime: "30-90 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u4"), ...rbs(-0.003, 0.003) },
    listedAt: "2026-03-08",
    handoffs: 4,
    rating: 4.6,
    reviewCount: 3,
  },

  // ── PUZZLES (7) ──────────────────────────────────────────────────
  {
    id: "49",
    title: "Ravensburger 1000pc - Jerusalem",
    description: "Stunning 1000-piece puzzle featuring the Old City of Jerusalem at sunset. Premium quality Ravensburger softclick pieces. Completed size: 70x50cm. Missing zero pieces!",
    category: "puzzles",
    condition: "like-new",
    ageGroups: ["teens", "family", "adults"],
    minPlayers: 1,
    maxPlayers: 4,
    playTime: "300-600 min",
    complexity: "medium",
    photos: ["https://images.unsplash.com/photo-1606503153255-59d8b2e4b0a4?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u9"), ...rbs(0.002, 0.003) },
    listedAt: "2026-03-10",
    handoffs: 3,
    rating: 4.8,
    reviewCount: 3,
  },
  {
    id: "50",
    title: "Floor Puzzle - World Map (48pc)",
    description: "Giant 48-piece floor puzzle (90x60cm) featuring a colorful illustrated world map. Thick, durable pieces perfect for little hands. Educational and fun!",
    category: "puzzles",
    condition: "good",
    ageGroups: ["toddler", "kids"],
    minPlayers: 1,
    maxPlayers: 3,
    playTime: "15-30 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1494059980473-813e73ee784b?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u3"), ...rbs(-0.002, -0.003) },
    listedAt: "2026-03-06",
    handoffs: 6,
    rating: 4.5,
    reviewCount: 3,
  },
  {
    id: "51",
    title: "3D Crystal Puzzle - Eiffel Tower",
    description: "96-piece 3D crystal puzzle that builds a beautiful translucent Eiffel Tower. LED light base included for display. Challenging and satisfying. Great desk decoration when done.",
    category: "puzzles",
    condition: "like-new",
    ageGroups: ["tweens", "teens", "adults"],
    minPlayers: 1,
    maxPlayers: 2,
    playTime: "60-120 min",
    complexity: "medium",
    photos: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u9"), ...rbs(0.004, 0.002) },
    listedAt: "2026-03-09",
    handoffs: 2,
    rating: 4.4,
    reviewCount: 2,
  },
  {
    id: "52",
    title: "Ravensburger 500pc - Kittens",
    description: "Adorable 500-piece puzzle with kittens in a basket. Medium difficulty, great for puzzle beginners or a relaxing evening activity. Premium Ravensburger quality.",
    category: "puzzles",
    condition: "good",
    ageGroups: ["kids", "tweens", "family"],
    minPlayers: 1,
    maxPlayers: 3,
    playTime: "120-240 min",
    complexity: "light",
    photos: ["https://images.unsplash.com/photo-1606503153255-59d8b2e4b0a4?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u15"), ...rbs(0.006, 0.001) },
    listedAt: "2026-03-04",
    handoffs: 5,
    rating: 4.3,
    reviewCount: 3,
  },
  {
    id: "53",
    title: "Tangram Puzzle Set (Wooden)",
    description: "Classic 7-piece tangram puzzle in a beautiful wooden box with 60 challenge cards from easy to expert. Great for spatial reasoning and quiet time. Portable!",
    category: "puzzles",
    condition: "like-new",
    ageGroups: ["kids", "tweens", "teens"],
    minPlayers: 1,
    maxPlayers: 2,
    playTime: "10-30 min",
    complexity: "medium",
    photos: ["https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u13"), ...rbs(0.003, -0.004) },
    listedAt: "2026-03-11",
    handoffs: 3,
    rating: 4.6,
    reviewCount: 2,
  },
  {
    id: "54",
    title: "Rubik's Cube (Speed Cube)",
    description: "High-quality speed cube with smooth rotation and corner cutting. Stickerless design won't peel. Includes stand and beginner solution guide. Addictive!",
    category: "puzzles",
    condition: "like-new",
    ageGroups: ["tweens", "teens", "adults"],
    minPlayers: 1,
    maxPlayers: 1,
    playTime: "5-60 min",
    complexity: "heavy",
    photos: ["https://images.unsplash.com/photo-1577401239170-897942555fb3?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u10"), ...rbs(-0.006, 0.002) },
    listedAt: "2026-03-15",
    handoffs: 1,
    rating: 4.7,
    reviewCount: 2,
  },
  {
    id: "55",
    title: "Rush Hour Traffic Jam Puzzle",
    description: "Slide the blocking vehicles to free the red car! 40 challenge cards from beginner to expert. Logic game that kids and adults love equally. All cars and challenge cards included.",
    category: "puzzles",
    condition: "good",
    ageGroups: ["kids", "tweens", "teens"],
    minPlayers: 1,
    maxPlayers: 2,
    playTime: "10-30 min",
    complexity: "medium",
    photos: ["https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&h=300&fit=crop&q=80"],
    currentHolder: { ...user("u11"), ...rbs(0.008, -0.001) },
    listedAt: "2026-03-07",
    handoffs: 4,
    rating: 4.5,
    reviewCount: 3,
  },
];

// ─── MOCK REVIEWS ──────────────────────────────────────────────────────

export const MOCK_REVIEWS: Review[] = [
  // Settlers of Catan (id: 1)
  { id: "r1", userId: "u2", gameId: "1", rating: 5, text: "Complete set in great condition. Our family played it 3 times in one Shabbat! Miriam even included a quick-start guide she printed.", createdAt: "2026-03-12", helpful: 8 },
  { id: "r2", userId: "u6", gameId: "1", rating: 5, text: "Kids (ages 10 and 12) were hooked immediately. All pieces accounted for. Smooth handoff near the makolet.", createdAt: "2026-03-11", helpful: 5 },
  { id: "r3", userId: "u9", gameId: "1", rating: 4, text: "Great game but the box is a bit worn. All components are perfect inside though. Would borrow again!", createdAt: "2026-03-13", helpful: 3 },
  { id: "r4", userId: "u13", gameId: "1", rating: 5, text: "My tweens wouldn't stop playing. Borrowed for a week, could have kept it longer. Thank you!", createdAt: "2026-03-14", helpful: 6 },
  { id: "r5", userId: "u15", gameId: "1", rating: 5, text: "Best board game to share! Easy pickup, everything organized in bags. Highly recommend.", createdAt: "2026-03-15", helpful: 4 },

  // Ticket to Ride (id: 2)
  { id: "r6", userId: "u1", gameId: "2", rating: 5, text: "The Europe edition is even better than the original. Great condition, all trains sorted by color. Yosef was very easy to coordinate with.", createdAt: "2026-03-10", helpful: 7 },
  { id: "r7", userId: "u3", gameId: "2", rating: 4, text: "Fun game for the whole family. A few minor scuffs on the board but doesn't affect play at all.", createdAt: "2026-03-09", helpful: 3 },
  { id: "r8", userId: "u10", gameId: "2", rating: 5, text: "Taught my 7-year-old to play. She picked it up in one round! Complete set, nothing missing.", createdAt: "2026-03-11", helpful: 5 },
  { id: "r9", userId: "u15", gameId: "2", rating: 4, text: "Nice game, played it twice during bein hazmanim. Easy to learn, strategic enough for adults.", createdAt: "2026-03-12", helpful: 2 },

  // Rummikub (id: 3)
  { id: "r10", userId: "u1", gameId: "3", rating: 5, text: "You can't go wrong with Rummikub. This set has seen some love but all 106 tiles are there. Classic.", createdAt: "2026-03-03", helpful: 6 },
  { id: "r11", userId: "u7", gameId: "3", rating: 4, text: "Good condition for its age. One rack has a small crack but still works fine. Great for Shabbat!", createdAt: "2026-03-04", helpful: 3 },
  { id: "r12", userId: "u8", gameId: "3", rating: 5, text: "My elderly parents loved playing this with the grandkids. Three generations around one table!", createdAt: "2026-03-05", helpful: 8 },
  { id: "r13", userId: "u11", gameId: "3", rating: 4, text: "Solid Rummikub set. Racks are a bit loose but tiles are all in good shape.", createdAt: "2026-03-06", helpful: 2 },
  { id: "r14", userId: "u14", gameId: "3", rating: 5, text: "Devorah was so kind during the handoff. Game is a classic for a reason.", createdAt: "2026-03-07", helpful: 4 },

  // Codenames (id: 4)
  { id: "r15", userId: "u1", gameId: "4", rating: 5, text: "Perfect party game for Motzei Shabbat with friends. Had 8 players and it was a blast!", createdAt: "2026-03-15", helpful: 5 },
  { id: "r16", userId: "u6", gameId: "4", rating: 5, text: "We played this at our community event and everyone wanted to know where to get it. Like new condition!", createdAt: "2026-03-14", helpful: 7 },
  { id: "r17", userId: "u13", gameId: "4", rating: 5, text: "Best game for large groups. Easy to learn, impossible to stop playing. All cards included.", createdAt: "2026-03-15", helpful: 4 },
  { id: "r18", userId: "u15", gameId: "4", rating: 4, text: "Great game! Only downside is you need at least 4 players. Works best with 6+.", createdAt: "2026-03-16", helpful: 3 },

  // Carcassonne (id: 5)
  { id: "r19", userId: "u10", gameId: "5", rating: 5, text: "Elegant game with simple rules but surprising depth. All tiles and meeples present. Sarah's a reliable sharer!", createdAt: "2026-03-02", helpful: 5 },
  { id: "r20", userId: "u1", gameId: "5", rating: 5, text: "My kids love placing tiles. It's like a puzzle that changes every time. Great condition.", createdAt: "2026-03-03", helpful: 4 },
  { id: "r21", userId: "u8", gameId: "5", rating: 4, text: "Good game, a few tiles show wear on edges but all present. Works great for 2 players too.", createdAt: "2026-03-04", helpful: 2 },

  // Pandemic (id: 6)
  { id: "r22", userId: "u3", gameId: "6", rating: 5, text: "Cooperative games are the best for family harmony. No fighting, just teamwork! Perfect condition.", createdAt: "2026-03-13", helpful: 6 },
  { id: "r23", userId: "u9", gameId: "6", rating: 5, text: "Ironic game choice but incredibly fun. All role cards and disease cubes accounted for.", createdAt: "2026-03-14", helpful: 4 },
  { id: "r24", userId: "u15", gameId: "6", rating: 4, text: "Challenging but rewarding. We lost our first 3 games before finally winning. Highly recommend!", createdAt: "2026-03-15", helpful: 3 },

  // Dixit (id: 7)
  { id: "r25", userId: "u1", gameId: "7", rating: 5, text: "The artwork on these cards is absolutely gorgeous. My artistic daughter was mesmerized. Complete set.", createdAt: "2026-03-07", helpful: 5 },
  { id: "r26", userId: "u3", gameId: "7", rating: 5, text: "Such a creative game. Everyone interprets the cards differently. Great for getting to know people!", createdAt: "2026-03-08", helpful: 4 },
  { id: "r27", userId: "u10", gameId: "7", rating: 4, text: "Beautiful game. A few cards have minor bends but nothing that affects play.", createdAt: "2026-03-09", helpful: 2 },
  { id: "r28", userId: "u14", gameId: "7", rating: 4, text: "Fun and imaginative. Even my 6-year-old could participate with a little help.", createdAt: "2026-03-10", helpful: 3 },

  // Splendor (id: 9)
  { id: "r29", userId: "u1", gameId: "9", rating: 5, text: "Those gem chips are so satisfying to hold! Quick to learn, every game feels different. Excellent condition.", createdAt: "2026-02-28", helpful: 6 },
  { id: "r30", userId: "u6", gameId: "9", rating: 4, text: "Great strategy game. Tin box is dented but everything inside is perfect.", createdAt: "2026-03-01", helpful: 3 },
  { id: "r31", userId: "u10", gameId: "9", rating: 5, text: "My 10-year-old beat me consistently. Easy to teach, hard to master. Love it!", createdAt: "2026-03-02", helpful: 5 },
  { id: "r32", userId: "u3", gameId: "9", rating: 4, text: "Good game for 2 players. Components feel premium. Would definitely borrow again.", createdAt: "2026-03-03", helpful: 2 },
  { id: "r33", userId: "u15", gameId: "9", rating: 5, text: "Naomi was so helpful explaining the rules before handoff. Game is in great shape!", createdAt: "2026-03-04", helpful: 4 },

  // Magna-Tiles 100pc (id: 36)
  { id: "r34", userId: "u1", gameId: "36", rating: 5, text: "These tiles are incredible. My 3-year-old and 7-year-old play together for hours. All 100 pieces present!", createdAt: "2026-03-07", helpful: 9 },
  { id: "r35", userId: "u6", gameId: "36", rating: 5, text: "Worth their weight in gold. So glad someone is sharing these — they're expensive to buy! Great condition.", createdAt: "2026-03-08", helpful: 7 },
  { id: "r36", userId: "u12", gameId: "36", rating: 5, text: "Best toy for open-ended play. My toddler builds towers, my 6-year-old builds castles. Magic.", createdAt: "2026-03-09", helpful: 6 },
  { id: "r37", userId: "u7", gameId: "36", rating: 4, text: "A few tiles have slight scratches but magnets are all strong. Still amazing!", createdAt: "2026-03-10", helpful: 3 },
  { id: "r38", userId: "u13", gameId: "36", rating: 5, text: "Sarah is the best sharer — she even sorted them by shape! My kids were thrilled.", createdAt: "2026-03-11", helpful: 5 },

  // Giant Jenga (id: 20)
  { id: "r39", userId: "u1", gameId: "20", rating: 5, text: "Brought this to a neighborhood BBQ and it was the star attraction! All 54 blocks in great shape.", createdAt: "2026-03-12", helpful: 6 },
  { id: "r40", userId: "u6", gameId: "20", rating: 5, text: "Kids AND adults couldn't stop playing. The crash when it falls is so dramatic at this size!", createdAt: "2026-03-11", helpful: 5 },
  { id: "r41", userId: "u10", gameId: "20", rating: 4, text: "Great fun. A couple blocks are slightly warped from weather but still plays perfectly.", createdAt: "2026-03-13", helpful: 3 },
  { id: "r42", userId: "u15", gameId: "20", rating: 5, text: "We used this at our Purim seudah and everyone loved it. Easy pickup from Batsheva!", createdAt: "2026-03-14", helpful: 4 },

  // LEGO Classic Brick Box (id: 31)
  { id: "r43", userId: "u6", gameId: "31", rating: 5, text: "790 pieces of pure creativity. My kids spent the entire Shabbat afternoon building. Best LEGO set for sharing!", createdAt: "2026-02-18", helpful: 7 },
  { id: "r44", userId: "u3", gameId: "31", rating: 4, text: "Some pieces show wear but it's LEGO — still works perfectly. Great variety of colors and shapes.", createdAt: "2026-02-20", helpful: 4 },
  { id: "r45", userId: "u12", gameId: "31", rating: 5, text: "My son went through the entire instruction booklet in one sitting. Then made his own creations!", createdAt: "2026-02-22", helpful: 5 },
  { id: "r46", userId: "u9", gameId: "31", rating: 5, text: "Includes baseplate which many sets don't. Really rounds out the building experience.", createdAt: "2026-02-25", helpful: 3 },
  { id: "r47", userId: "u13", gameId: "31", rating: 4, text: "Good starter set. A few pieces might be from other sets mixed in but that's bonus content!", createdAt: "2026-03-01", helpful: 2 },

  // Azul (id: 10)
  { id: "r48", userId: "u1", gameId: "10", rating: 5, text: "The tile quality is stunning — heavy, colorful, satisfying to handle. Game is addictive!", createdAt: "2026-03-12", helpful: 5 },
  { id: "r49", userId: "u3", gameId: "10", rating: 5, text: "Beautiful and brainy. We played 4 rounds in a row. Like new condition, not a scratch.", createdAt: "2026-03-13", helpful: 4 },
  { id: "r50", userId: "u10", gameId: "10", rating: 5, text: "Abstract strategy that doesn't feel intimidating. My wife loved it. Quick games too!", createdAt: "2026-03-14", helpful: 6 },
  { id: "r51", userId: "u6", gameId: "10", rating: 4, text: "Gorgeous game. Factory display boards are slightly bent but tiles are all perfect.", createdAt: "2026-03-15", helpful: 2 },

  // Chess Set (id: 15)
  { id: "r52", userId: "u3", gameId: "15", rating: 5, text: "Beautiful wooden set. My son is learning chess at school and this was perfect for practice at home.", createdAt: "2026-03-08", helpful: 5 },
  { id: "r53", userId: "u8", gameId: "15", rating: 5, text: "Felted pieces, weighted properly, gorgeous wood grain. Tournament quality for free borrowing!", createdAt: "2026-03-09", helpful: 4 },
  { id: "r54", userId: "u13", gameId: "15", rating: 5, text: "Dov takes amazing care of his games. This set is practically brand new. Highly recommend!", createdAt: "2026-03-10", helpful: 6 },
  { id: "r55", userId: "u15", gameId: "15", rating: 4, text: "One pawn has a tiny chip but otherwise perfect. Great for teaching kids the game of kings.", createdAt: "2026-03-11", helpful: 2 },

  // Capture the Flag (id: 25)
  { id: "r56", userId: "u1", gameId: "25", rating: 5, text: "Used this for a birthday party — 16 kids, pure joy! Everything glows beautifully in the dark.", createdAt: "2026-03-16", helpful: 8 },
  { id: "r57", userId: "u4", gameId: "25", rating: 5, text: "Best neighborhood activity ever. Kids were talking about it for days. All pieces working.", createdAt: "2026-03-16", helpful: 6 },
  { id: "r58", userId: "u10", gameId: "25", rating: 5, text: "Racheli organized the pickup and even included extra batteries. Game is a hit!", createdAt: "2026-03-16", helpful: 5 },
];

// ─── HELPER FUNCTIONS ──────────────────────────────────────────────────

export function getGame(id: string): Game | undefined {
  return MOCK_GAMES.find((g) => g.id === id);
}

export function getUser(id: string): UserProfile | undefined {
  return MOCK_USERS.find((u) => u.id === id);
}

export function getGameReviews(gameId: string): Review[] {
  return MOCK_REVIEWS.filter((r) => r.gameId === gameId).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getUserReviews(userId: string): Review[] {
  return MOCK_REVIEWS.filter((r) => r.userId === userId);
}

export function getCategoryLabel(cat: GameCategory): string {
  return CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
}

export function getCategoryEmoji(cat: GameCategory): string {
  return CATEGORIES.find((c) => c.value === cat)?.emoji ?? "🎮";
}

export function formatWhatsAppLink(phone: string, gameTitle: string, requesterName?: string): string {
  const name = requesterName ? ` My name is ${requesterName}.` : "";
  const text = encodeURIComponent(
    `Hi! I saw "${gameTitle}" on Play it Forward and I'd love to borrow it.${name} Is it still available? When would be a good time to pick it up?`
  );
  return `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${text}`;
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function getStarDisplay(rating: number): string {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return "\u2605".repeat(full) + (half ? "\u00BD" : "") + "\u2606".repeat(empty);
}
