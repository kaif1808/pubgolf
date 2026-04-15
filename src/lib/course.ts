export type Hole = {
  hole: number;
  barName: string;
  rule: string;
  drink: string;
  par: number;
};

export type CourseMeta = {
  title: string;
  subtitle: string;
  coursePar: number;
  holesCount: number;
  distance: string;
};

export type Course = {
  id: string;
  meta: CourseMeta;
  holes: Hole[];
};

/** Default Barcelona course — matches pubgolf.html */
export const DEFAULT_BARCELONA_COURSE: Course = {
  id: "barcelona-bogatell-flahertys",
  meta: {
    title: "BARCELONA PUB GOLF",
    subtitle: "— The Bogatell-to-Flaherty's Open —",
    coursePar: 34,
    holesCount: 9,
    distance: "~3.5 km",
  },
  holes: [
    {
      hole: 1,
      barName: "Nova Icaria Beach",
      rule: "No first names. Surnames or nicknames only.",
      drink: "Caña (beach beer)",
      par: 4,
    },
    {
      hole: 2,
      barName: "HIVE Poblenou",
      rule: "No saying anyone's name in the group.",
      drink: "Cocktail",
      par: 4,
    },
    {
      hole: 3,
      barName: "La Triunfal",
      rule: "No pointing. Use thumb or open hand.",
      drink: "Caña (beer)",
      par: 3,
    },
    {
      hole: 4,
      barName: "Cafè del Born",
      rule: "No pronouns. Names only — no I, you, we, he, she.",
      drink: "Vermut",
      par: 3,
    },
    {
      hole: 5,
      barName: "Spritz",
      rule: "Buffalo. Drink with non-dominant hand.",
      drink: "Aperol Spritz",
      par: 4,
    },
    {
      hole: 6,
      barName: "Bar Manchester",
      rule: "No swearing. Not even under your breath.",
      drink: "Gin & tonic",
      par: 5,
    },
    {
      hole: 7,
      barName: "Bar Sincopa",
      rule: "Thumbmaster. Last to follow the thumb on table drinks.",
      drink: "Shot",
      par: 1,
    },
    {
      hole: 8,
      barName: "Bar Oviso",
      rule: 'No saying "drink" or "drunk". Find another word.',
      drink: "Mojito",
      par: 4,
    },
    {
      hole: 9,
      barName: "Flaherty's Irish Pub",
      rule: "Toast & compliment a teammate before each sip.",
      drink: "Pint (Guinness)",
      par: 6,
    },
  ],
};

export function parByHole(course: Course): Record<number, number> {
  const m: Record<number, number> = {};
  for (const h of course.holes) m[h.hole] = h.par;
  return m;
}
