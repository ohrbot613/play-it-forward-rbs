export type Neighborhood = "Aleph" | "Bet" | "Gimmel" | "Dalet" | "Hey";

export type GameCondition = "like-new" | "good" | "fair";

export type GameStatus = "available" | "requested" | "in-transit" | "borrowed";

export interface Game {
  id: string;
  name: string;
  nameHe: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  ageRange: string;
  condition: GameCondition;
  neighborhood: Neighborhood;
  donorName: string;
  imageUrl: string;
  status: GameStatus;
  createdAt: string;
}

export interface RelayRequest {
  id: string;
  gameId: string;
  gameName: string;
  fromNeighborhood: Neighborhood;
  toNeighborhood: Neighborhood;
  requesterName: string;
  status: "pending" | "claimed" | "picked-up" | "delivered";
  createdAt: string;
}

export const NEIGHBORHOODS: Neighborhood[] = ["Aleph", "Bet", "Gimmel", "Dalet", "Hey"];

export const MOCK_GAMES: Game[] = [
  {
    id: "1",
    name: "Settlers of Catan",
    nameHe: "קטאן",
    description: "Build settlements, trade resources, and become the dominant force on the island of Catan.",
    minPlayers: 3,
    maxPlayers: 4,
    ageRange: "10+",
    condition: "like-new",
    neighborhood: "Aleph",
    donorName: "Miriam K.",
    imageUrl: "",
    status: "available",
    createdAt: "2026-03-10",
  },
  {
    id: "2",
    name: "Ticket to Ride",
    nameHe: "כרטיס לנסיעה",
    description: "Collect train cards, claim railway routes, and connect cities across the map.",
    minPlayers: 2,
    maxPlayers: 5,
    ageRange: "8+",
    condition: "good",
    neighborhood: "Bet",
    donorName: "Yosef L.",
    imageUrl: "",
    status: "available",
    createdAt: "2026-03-08",
  },
  {
    id: "3",
    name: "Codenames",
    nameHe: "שמות קוד",
    description: "Two teams compete to identify their agents using one-word clues. Great for Shabbat!",
    minPlayers: 4,
    maxPlayers: 8,
    ageRange: "12+",
    condition: "good",
    neighborhood: "Gimmel",
    donorName: "Sarah B.",
    imageUrl: "",
    status: "requested",
    createdAt: "2026-03-05",
  },
  {
    id: "4",
    name: "Spot It! / Dobble",
    nameHe: "ספוט איט",
    description: "Fast-paced symbol matching game. Perfect for kids and family game nights.",
    minPlayers: 2,
    maxPlayers: 8,
    ageRange: "6+",
    condition: "like-new",
    neighborhood: "Dalet",
    donorName: "Avi M.",
    imageUrl: "",
    status: "available",
    createdAt: "2026-03-12",
  },
  {
    id: "5",
    name: "Rummikub",
    nameHe: "רמיקוב",
    description: "Classic tile-based game of strategy and luck. A staple in every Israeli home.",
    minPlayers: 2,
    maxPlayers: 4,
    ageRange: "7+",
    condition: "fair",
    neighborhood: "Hey",
    donorName: "Devorah R.",
    imageUrl: "",
    status: "in-transit",
    createdAt: "2026-03-01",
  },
];

export const MOCK_RELAYS: RelayRequest[] = [
  {
    id: "r1",
    gameId: "3",
    gameName: "Codenames",
    fromNeighborhood: "Gimmel",
    toNeighborhood: "Aleph",
    requesterName: "Chana P.",
    status: "pending",
    createdAt: "2026-03-14",
  },
  {
    id: "r2",
    gameId: "5",
    gameName: "Rummikub",
    fromNeighborhood: "Hey",
    toNeighborhood: "Bet",
    requesterName: "Rivka S.",
    status: "claimed",
    createdAt: "2026-03-13",
  },
  {
    id: "r3",
    gameId: "1",
    gameName: "Settlers of Catan",
    fromNeighborhood: "Aleph",
    toNeighborhood: "Dalet",
    requesterName: "Moshe T.",
    status: "picked-up",
    createdAt: "2026-03-12",
  },
];

export function getGame(id: string): Game | undefined {
  return MOCK_GAMES.find((g) => g.id === id);
}
