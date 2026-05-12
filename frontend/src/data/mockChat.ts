// Mock family members + a seeded conversation so the chat feels alive on first load.

export interface ChatUser {
  id: string;
  name: string;
  /** display name when @-mentioned, lowercase, no spaces */
  handle: string;
  color: string;
  online: boolean;
  isBot?: boolean;
  isCurrentUser?: boolean;
  /** what they're "watching" — used in the presence sidebar to feel cozy */
  watching?: string;
}

export const mockUsers: ChatUser[] = [
  {
    id: "u-mum",
    name: "Mum",
    handle: "mum",
    color: "#ec4899",
    online: true,
    watching: "Sourdough Sundays",
  },
  {
    id: "u-dad",
    name: "Dad",
    handle: "dad",
    color: "#22d3ee",
    online: true,
    watching: "Lake Country Detective",
  },
  {
    id: "u-sam",
    name: "Sam",
    handle: "sam",
    color: "#facc15",
    online: false,
  },
  {
    id: "u-ellie",
    name: "Ellie",
    handle: "ellie",
    color: "#22c55e",
    online: true,
    watching: "Letters from the Lighthouse",
  },
  {
    id: "u-nan",
    name: "Nan",
    handle: "nan",
    color: "#fb923c",
    online: false,
  },
];

export const getUserByHandle = (handle: string) =>
  mockUsers.find((u) => u.handle.toLowerCase() === handle.toLowerCase());

export const getUserById = (id: string) => mockUsers.find((u) => u.id === id);

const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString();

export interface SeedMessage {
  id: string;
  authorId: string;
  text: string;
  ts: string;
  mediaIds?: string[];
}

export const seedMessages: SeedMessage[] = [
  {
    id: "m-seed-1",
    authorId: "u-mum",
    text: "Movie night Sunday — any ideas? Nan's joining 🍿",
    ts: minutesAgo(180),
  },
  {
    id: "m-seed-2",
    authorId: "u-dad",
    text: "Something not too long. Last week's three-hour epic nearly killed me.",
    ts: minutesAgo(178),
  },
  {
    id: "m-seed-3",
    authorId: "u-ellie",
    text: "Something cozy and under 90 minutes please",
    ts: minutesAgo(176),
  },
  {
    id: "m-seed-4",
    authorId: "u-mum",
    text: "Letters from the Lighthouse looks lovely. Pinning it.",
    ts: minutesAgo(170),
  },
  {
    id: "m-seed-5",
    authorId: "u-dad",
    text: "Sounds good to me.",
    ts: minutesAgo(40),
  },
  
];
