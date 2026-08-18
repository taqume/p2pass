export type P2Event = {
  id: number;
  name: string;
  summary: string;
  description: string;
  date: string;
  time: string;
  location: string;
  price: number;
  capacity: number;
  registered: number;
  organizer: `0x${string}`;
  imageURI: string;
  tone: "blue" | "violet" | "amber" | "green";
  tags: string[];
  rating: number;
  cancelled?: boolean;
};

export const demoEvents: P2Event[] = [
  {
    id: 1,
    name: "Protocol After Hours",
    summary: "An intimate night for builders shipping the next public internet.",
    description:
      "A focused evening of short demos, open protocol conversations and the kind of hallway discussions that turn into real collaborations. Your pass proves access; check-in turns the encounter into shared on-chain history.",
    date: "AUG 28",
    time: "19:30 — 23:00",
    location: "Salt Galata · Istanbul",
    price: 0.003,
    capacity: 100,
    registered: 68,
    organizer: "0x72A4c91e331cb2998F83158D70F1F246B15a9F31",
    imageURI: "",
    tone: "blue",
    tags: ["Protocol", "Builders"],
    rating: 4.8,
    cancelled: false,
  },
  {
    id: 2,
    name: "Base Makers Assembly",
    summary: "Live prototypes, hard-won lessons, zero pitch decks.",
    description:
      "A community-led assembly for makers building on Base. Bring one thing you made, one thing you learned and one question worth discussing.",
    date: "SEP 03",
    time: "18:00 — 21:30",
    location: "Impact Hub · Berlin",
    price: 0,
    capacity: 80,
    registered: 51,
    organizer: "0x19b8C3A81d55801e894036dCB1Fb5faFeF93b829",
    imageURI: "",
    tone: "violet",
    tags: ["Base", "Demo night"],
    rating: 4.9,
  },
  {
    id: 3,
    name: "Proof of Presence Walk",
    summary: "A city walk mapped through stories, people and cryptographic proof.",
    description:
      "A guided walk through the overlooked technical history of the city, ending with a shared meal. Limited capacity by design.",
    date: "SEP 14",
    time: "10:00 — 14:00",
    location: "Karaköy Pier · Istanbul",
    price: 0,
    capacity: 32,
    registered: 24,
    organizer: "0xBEd770553C4fcD9b8dd5C33C218D884fB0B4AcE2",
    imageURI: "",
    tone: "amber",
    tags: ["City", "Community"],
    rating: 4.7,
  },
  {
    id: 4,
    name: "Commons Table #08",
    summary: "Dinner for people building community infrastructure.",
    description: "No stage and no spectators: one long table, twelve provocations, and a record of who showed up.",
    date: "SEP 22",
    time: "20:00 — 23:30",
    location: "Cihangir · Istanbul",
    price: 0.0015,
    capacity: 24,
    registered: 19,
    organizer: "0x9C0095F4e67623d8D94e41F932F18F0cD1175Db6",
    imageURI: "",
    tone: "green",
    tags: ["Commons", "Dinner"],
    rating: 4.6,
  },
];

export const demoReviews = [
  { address: "0x4412…1A09", rating: 5, text: "The room felt considered. I left with two collaborators, not twenty contacts.", event: "EVENT #037" },
  { address: "0x8E01…C821", rating: 5, text: "Clear curation, thoughtful check-in and excellent conversations.", event: "EVENT #039" },
  { address: "0x2A70…93D4", rating: 4, text: "Small, focused, and genuinely useful.", event: "EVENT #036" },
];
