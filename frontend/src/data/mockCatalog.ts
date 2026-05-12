// Mock catalog used by the chat bot for recommendations.
// Entirely fictional titles so we don't lean on real IP.
// Designed to span genre/mood/audience so the bot has interesting filters.

export type Audience = "kids" | "family" | "teen" | "adult";
export type CatalogKind = "movie" | "show" | "documentary" | "short";

export interface CatalogEntry {
  id: string;
  title: string;
  description: string;
  kind: CatalogKind;
  genres: string[];
  moods: string[];
  audience: Audience;
  duration_min: number;
  year: number;
  rating: number; // 0-5
  thumbnail_grad: [string, string];
}

export const mockCatalog: CatalogEntry[] = [
  {
    id: "cat-1",
    title: "The Glasshouse Years",
    description:
      "A quiet drama about three siblings who reunite to restore their late grandmother's botanical glasshouse over the course of one summer.",
    kind: "movie",
    genres: ["drama", "family"],
    moods: ["cozy", "wholesome", "thoughtful"],
    audience: "family",
    duration_min: 104,
    year: 2022,
    rating: 4.4,
    thumbnail_grad: ["#7c5cff", "#22d3ee"],
  },
  {
    id: "cat-2",
    title: "Pebble & Comet",
    description:
      "A small dog and a runaway weather balloon become unlikely best friends in this hand-animated adventure for kids.",
    kind: "movie",
    genres: ["animation", "adventure", "family"],
    moods: ["uplifting", "cozy", "sweet"],
    audience: "kids",
    duration_min: 78,
    year: 2023,
    rating: 4.6,
    thumbnail_grad: ["#f59e0b", "#ef4444"],
  },
  {
    id: "cat-3",
    title: "Lake Country Detective",
    description:
      "A retired city detective takes a quiet job in a lakeside town and finds the small cases are never as small as they look.",
    kind: "show",
    genres: ["mystery", "crime", "drama"],
    moods: ["thoughtful", "moody", "slow-burn"],
    audience: "adult",
    duration_min: 52,
    year: 2024,
    rating: 4.3,
    thumbnail_grad: ["#0ea5e9", "#1e293b"],
  },
  {
    id: "cat-4",
    title: "Stand-Up Saturday: The Open Mic",
    description:
      "Eight new comedians get one shot at a packed room. Raw, weird, and surprisingly heartfelt.",
    kind: "show",
    genres: ["comedy", "stand-up"],
    moods: ["funny", "light", "feel-good"],
    audience: "teen",
    duration_min: 28,
    year: 2024,
    rating: 4.0,
    thumbnail_grad: ["#facc15", "#7c5cff"],
  },
  {
    id: "cat-5",
    title: "The Cartographer's Daughter",
    description:
      "A sweeping historical adventure following a 19th-century map-maker's daughter across three continents.",
    kind: "movie",
    genres: ["adventure", "historical", "drama"],
    moods: ["epic", "thoughtful", "uplifting"],
    audience: "family",
    duration_min: 138,
    year: 2021,
    rating: 4.5,
    thumbnail_grad: ["#a855f7", "#ec4899"],
  },
  {
    id: "cat-6",
    title: "Tiny Engineers",
    description:
      "Each episode, a team of kids builds something useful — a bridge, a kite, a pulley — with help from a friendly engineer.",
    kind: "show",
    genres: ["educational", "kids"],
    moods: ["uplifting", "wholesome"],
    audience: "kids",
    duration_min: 22,
    year: 2023,
    rating: 4.7,
    thumbnail_grad: ["#22c55e", "#0ea5e9"],
  },
  {
    id: "cat-7",
    title: "Midnight at the Switchback",
    description:
      "A lonely night-shift mechanic gets pulled into a strange mystery involving a car that nobody seems to remember owning.",
    kind: "movie",
    genres: ["thriller", "mystery"],
    moods: ["tense", "moody"],
    audience: "adult",
    duration_min: 96,
    year: 2023,
    rating: 4.1,
    thumbnail_grad: ["#1e293b", "#ef4444"],
  },
  {
    id: "cat-8",
    title: "Sourdough Sundays",
    description:
      "A warm, slow cooking show following one family's bakery from a kitchen counter to a small high-street shop.",
    kind: "show",
    genres: ["food", "documentary", "family"],
    moods: ["cozy", "wholesome", "feel-good"],
    audience: "family",
    duration_min: 35,
    year: 2024,
    rating: 4.5,
    thumbnail_grad: ["#fb923c", "#facc15"],
  },
  {
    id: "cat-9",
    title: "The Long Walk Home",
    description:
      "Two strangers miss the last bus and end up walking 12 miles together. By morning, they aren't strangers anymore.",
    kind: "movie",
    genres: ["romance", "drama"],
    moods: ["thoughtful", "sweet", "slow-burn"],
    audience: "teen",
    duration_min: 89,
    year: 2022,
    rating: 4.2,
    thumbnail_grad: ["#ec4899", "#7c5cff"],
  },
  {
    id: "cat-10",
    title: "Roar of the Reefs",
    description:
      "A documentary tour through five of the world's most surprising coral ecosystems, narrated with humour and heart.",
    kind: "documentary",
    genres: ["nature", "documentary"],
    moods: ["uplifting", "thoughtful", "wholesome"],
    audience: "family",
    duration_min: 84,
    year: 2024,
    rating: 4.6,
    thumbnail_grad: ["#22d3ee", "#0ea5e9"],
  },
  {
    id: "cat-11",
    title: "Goblin Knock-Knock",
    description:
      "An absurd kids' sketch show. Goblins keep showing up. Nobody knows why. Everyone is fine with it.",
    kind: "show",
    genres: ["comedy", "kids"],
    moods: ["funny", "silly", "light"],
    audience: "kids",
    duration_min: 18,
    year: 2024,
    rating: 4.4,
    thumbnail_grad: ["#84cc16", "#facc15"],
  },
  {
    id: "cat-12",
    title: "Outpost Six",
    description:
      "A six-part sci-fi series about the smallest, weirdest, and most lovable research station in the outer solar system.",
    kind: "show",
    genres: ["sci-fi", "drama"],
    moods: ["thoughtful", "epic", "moody"],
    audience: "teen",
    duration_min: 48,
    year: 2025,
    rating: 4.5,
    thumbnail_grad: ["#1e293b", "#7c5cff"],
  },
  {
    id: "cat-13",
    title: "Quickstep",
    description:
      "An 11-minute short following a courier who has exactly 11 minutes to deliver a package across a chaotic city.",
    kind: "short",
    genres: ["action", "comedy"],
    moods: ["funny", "tense", "light"],
    audience: "teen",
    duration_min: 11,
    year: 2024,
    rating: 4.3,
    thumbnail_grad: ["#ef4444", "#facc15"],
  },
  {
    id: "cat-14",
    title: "Letters from the Lighthouse",
    description:
      "A grandmother writes a year of letters to her granddaughter; the show animates each one.",
    kind: "show",
    genres: ["animation", "family", "drama"],
    moods: ["cozy", "wholesome", "thoughtful", "sweet"],
    audience: "family",
    duration_min: 24,
    year: 2023,
    rating: 4.8,
    thumbnail_grad: ["#0ea5e9", "#facc15"],
  },
  {
    id: "cat-15",
    title: "Hush, Please",
    description:
      "A clever locked-room thriller set entirely inside a public library after closing.",
    kind: "movie",
    genres: ["thriller", "mystery"],
    moods: ["tense", "moody", "slow-burn"],
    audience: "adult",
    duration_min: 101,
    year: 2024,
    rating: 4.2,
    thumbnail_grad: ["#1e293b", "#22d3ee"],
  },
  {
    id: "cat-16",
    title: "Dad Joke Battle Royale",
    description:
      "16 dads, 4 rounds, 1 trophy. A surprisingly competitive comedy game show.",
    kind: "show",
    genres: ["comedy", "game-show"],
    moods: ["funny", "feel-good", "light", "silly"],
    audience: "family",
    duration_min: 42,
    year: 2025,
    rating: 4.1,
    thumbnail_grad: ["#fb923c", "#7c5cff"],
  },
];

export const findCatalogEntry = (id: string): CatalogEntry | undefined =>
  mockCatalog.find((m) => m.id === id);
