export interface Leg {
  from: string;
  to: string;
  /** Delta-v in m/s (propulsive, no aerobraking) */
  deltaV: number;
  /** Whether an atmosphere is available to aerobrake at the destination */
  canAerobrake?: boolean;
}

export type DestinationGroup =
  | "Kerbin System"
  | "Inner Planets"
  | "Middle System"
  | "Jool System"
  | "Outer System"
  | "Sarnus System"
  | "Urlum System"
  | "Neidon System"
  | "Plock System"
  // Real Solar System / 1/4 Scale groups
  | "Earth System"
  | "Sol Inner Planets"
  | "Mars System";

export type ScaleMode = "stock" | "opm" | "quarter" | "rss";

export type DifficultyRating = "Beginner" | "Intermediate" | "Advanced" | "Expert";
export type IsruViability = "prime" | "viable";

/** Color for each difficulty tier */
export const DIFFICULTY_COLORS: Record<DifficultyRating, string> = {
  Beginner:     "#3a9a50",
  Intermediate: "#c0a030",
  Advanced:     "#c07030",
  Expert:       "#bf2d1c",
};

export const ISRU_COLORS: Record<IsruViability, string> = {
  prime:  "#3a9a50",
  viable: "#7a8898",
};

export interface Destination {
  id: string;
  name: string;
  group: DestinationGroup;
  description: string;
  /** Only shown when OPM is disabled (replaced by OPM equivalent) */
  stockOnly?: boolean;
  /** Only shown when OPM is enabled */
  opmOnly?: boolean;
  /** Only shown in Real Solar System mode */
  rssOnly?: boolean;
  /** Only shown in 1/4 Scale (KSRSS) mode */
  quarterScaleOnly?: boolean;
  /** Rough mission difficulty based on delta-v, atmosphere, and landing complexity */
  difficulty: DifficultyRating;
  /** Surface gravity in m/s². Omit for Jool (gas giant, no surface). */
  surfaceGravity?: number;
  /**
   * KSP1 science reward multiplier for experiments performed here.
   * Higher = more science per experiment.
   */
  scienceMultiplier: number;
  /**
   * ISRU mining viability. "prime" = very low gravity, easy depot candidate.
   * "viable" = possible but heavier gravity penalty. Omit for gas giants.
   */
  isruViability?: IsruViability;
  /** Legs from Kerbin Surface to destination surface (one-way) */
  legs: Leg[];
}

/** Kerbin surface gravity (m/s²) — reference for "g" comparisons */
export const KERBIN_GRAVITY = 9.81;

/**
 * Standard KSP1 delta-v values based on the community delta-v map.
 * All values in m/s. Aerobrake savings are not applied by default.
 */
export const DESTINATIONS: Destination[] = [
  // ── Kerbin System ────────────────────────────────────────────────────────
  {
    id: "kerbin",
    name: "Kerbin",
    group: "Kerbin System",
    difficulty: "Beginner",
    description:
      "Home. The blue-green jewel of the Kerbol system. Its thick atmosphere enables aerobrake capture — deorbit from LKO costs a mere 80 m/s.",
    surfaceGravity: 9.81,
    scienceMultiplier: 1,
    legs: [
      { from: "Kerbin Surface", to: "Low Kerbin Orbit", deltaV: 3400 },
      { from: "Low Kerbin Orbit", to: "Kerbin Surface", deltaV: 80, canAerobrake: true },
    ],
  },
  {
    id: "mun",
    name: "Mun",
    group: "Kerbin System",
    difficulty: "Beginner",
    description: "Kerbin's primary moon. No atmosphere, moderate gravity.",
    surfaceGravity: 1.63,
    scienceMultiplier: 4,
    isruViability: "viable",
    legs: [
      { from: "Kerbin Surface", to: "Low Kerbin Orbit", deltaV: 3400 },
      { from: "Low Kerbin Orbit", to: "Mun Transfer", deltaV: 860 },
      { from: "Mun Transfer", to: "Low Mun Orbit", deltaV: 310 },
      { from: "Low Mun Orbit", to: "Mun Surface", deltaV: 580 },
    ],
  },
  {
    id: "minmus",
    name: "Minmus",
    group: "Kerbin System",
    difficulty: "Beginner",
    description: "Kerbin's small outer moon. Very low gravity, great for fuel depots.",
    surfaceGravity: 0.491,
    scienceMultiplier: 5,
    isruViability: "prime",
    legs: [
      { from: "Kerbin Surface", to: "Low Kerbin Orbit", deltaV: 3400 },
      { from: "Low Kerbin Orbit", to: "Minmus Transfer", deltaV: 930 },
      { from: "Minmus Transfer", to: "Low Minmus Orbit", deltaV: 160 },
      { from: "Low Minmus Orbit", to: "Minmus Surface", deltaV: 180 },
    ],
  },

  // ── Inner Planets ─────────────────────────────────────────────────────────
  {
    id: "moho",
    name: "Moho",
    group: "Inner Planets",
    difficulty: "Expert",
    description: "Innermost planet. No atmosphere — expensive capture burn required.",
    surfaceGravity: 2.7,
    scienceMultiplier: 8,
    isruViability: "viable",
    legs: [
      { from: "Kerbin Surface", to: "Low Kerbin Orbit", deltaV: 3400 },
      { from: "Low Kerbin Orbit", to: "Moho Transfer", deltaV: 760 },
      { from: "Moho Transfer", to: "Low Moho Orbit", deltaV: 2410 },
      { from: "Low Moho Orbit", to: "Moho Surface", deltaV: 870 },
    ],
  },
  {
    id: "eve",
    name: "Eve",
    group: "Inner Planets",
    difficulty: "Expert",
    description:
      "Purple planet with a crushing atmosphere. Returning from the surface is the hardest challenge in KSP.",
    surfaceGravity: 16.7,
    scienceMultiplier: 8,
    isruViability: "viable",
    legs: [
      { from: "Kerbin Surface", to: "Low Kerbin Orbit", deltaV: 3400 },
      { from: "Low Kerbin Orbit", to: "Eve Transfer", deltaV: 1030 },
      {
        from: "Eve Transfer",
        to: "Low Eve Orbit",
        deltaV: 1350,
        canAerobrake: true,
      },
      {
        from: "Low Eve Orbit",
        to: "Eve Surface",
        deltaV: 8000,
        canAerobrake: true,
      },
    ],
  },
  {
    id: "gilly",
    name: "Gilly",
    group: "Inner Planets",
    difficulty: "Intermediate",
    description:
      "Tiny irregular moon of Eve. Almost no gravity — walking speed can exceed escape velocity.",
    surfaceGravity: 0.049,
    scienceMultiplier: 9,
    isruViability: "prime",
    legs: [
      { from: "Kerbin Surface", to: "Low Kerbin Orbit", deltaV: 3400 },
      { from: "Low Kerbin Orbit", to: "Eve Transfer", deltaV: 1030 },
      {
        from: "Eve Transfer",
        to: "Low Eve Orbit",
        deltaV: 1350,
        canAerobrake: true,
      },
      { from: "Low Eve Orbit", to: "Gilly Transfer", deltaV: 60 },
      { from: "Gilly Transfer", to: "Low Gilly Orbit", deltaV: 30 },
      { from: "Low Gilly Orbit", to: "Gilly Surface", deltaV: 30 },
    ],
  },

  // ── Middle System ─────────────────────────────────────────────────────────
  {
    id: "duna",
    name: "Duna",
    group: "Middle System",
    difficulty: "Intermediate",
    description:
      "Mars-like red planet with a thin atmosphere. Parachutes work here.",
    surfaceGravity: 2.94,
    scienceMultiplier: 8,
    isruViability: "viable",
    legs: [
      { from: "Kerbin Surface", to: "Low Kerbin Orbit", deltaV: 3400 },
      { from: "Low Kerbin Orbit", to: "Duna Transfer", deltaV: 1060 },
      {
        from: "Duna Transfer",
        to: "Low Duna Orbit",
        deltaV: 380,
        canAerobrake: true,
      },
      {
        from: "Low Duna Orbit",
        to: "Duna Surface",
        deltaV: 1450,
        canAerobrake: true,
      },
    ],
  },
  {
    id: "ike",
    name: "Ike",
    group: "Middle System",
    difficulty: "Intermediate",
    description: "Duna's large moon. Very close to Duna — easy side trip.",
    surfaceGravity: 1.1,
    scienceMultiplier: 8,
    isruViability: "viable",
    legs: [
      { from: "Kerbin Surface", to: "Low Kerbin Orbit", deltaV: 3400 },
      { from: "Low Kerbin Orbit", to: "Duna Transfer", deltaV: 1060 },
      {
        from: "Duna Transfer",
        to: "Low Duna Orbit",
        deltaV: 380,
        canAerobrake: true,
      },
      { from: "Low Duna Orbit", to: "Ike Transfer", deltaV: 30 },
      { from: "Ike Transfer", to: "Low Ike Orbit", deltaV: 180 },
      { from: "Low Ike Orbit", to: "Ike Surface", deltaV: 390 },
    ],
  },
  {
    id: "dres",
    name: "Dres",
    group: "Middle System",
    difficulty: "Advanced",
    description:
      "Lonely asteroid-like dwarf planet in an inclined orbit. No moons, no atmosphere.",
    surfaceGravity: 1.13,
    scienceMultiplier: 8,
    isruViability: "viable",
    legs: [
      { from: "Kerbin Surface", to: "Low Kerbin Orbit", deltaV: 3400 },
      { from: "Low Kerbin Orbit", to: "Dres Transfer", deltaV: 1290 },
      { from: "Dres Transfer", to: "Low Dres Orbit", deltaV: 610 },
      { from: "Low Dres Orbit", to: "Dres Surface", deltaV: 430 },
    ],
  },

  // ── Jool System ───────────────────────────────────────────────────────────
  {
    id: "jool",
    name: "Jool",
    group: "Jool System",
    difficulty: "Advanced",
    description:
      "Gas giant — no surface. Thick atmosphere; aerobraking into Jool orbit is possible but risky.",
    scienceMultiplier: 6,
    legs: [
      { from: "Kerbin Surface",   to: "Low Kerbin Orbit", deltaV: 3400 },
      { from: "Low Kerbin Orbit", to: "Jool Transfer",    deltaV: 1915 },
      { from: "Jool SOI Entry",   to: "Low Jool Orbit",   deltaV: 2820, canAerobrake: true },
    ],
  },
  {
    id: "laythe",
    name: "Laythe",
    group: "Jool System",
    difficulty: "Advanced",
    description:
      "Ocean moon of Jool with a breathable atmosphere. Jet engines work here.",
    surfaceGravity: 1.96,
    scienceMultiplier: 6,
    isruViability: "viable",
    legs: [
      { from: "Kerbin Surface", to: "Low Kerbin Orbit", deltaV: 3400 },
      { from: "Low Kerbin Orbit", to: "Jool Transfer", deltaV: 1915 },
      {
        from: "Jool SOI Entry",
        to: "Laythe Transfer",
        deltaV: 160,
        canAerobrake: true,
      },
      {
        from: "Laythe Transfer",
        to: "Low Laythe Orbit",
        deltaV: 1350,
        canAerobrake: true,
      },
      {
        from: "Low Laythe Orbit",
        to: "Laythe Surface",
        deltaV: 2900,
        canAerobrake: true,
      },
    ],
  },
  {
    id: "tylo",
    name: "Tylo",
    group: "Jool System",
    difficulty: "Expert",
    description:
      "Largest Jool moon. No atmosphere and strong gravity — hardest landing in Jool system.",
    surfaceGravity: 7.85,
    scienceMultiplier: 10,
    isruViability: "viable",
    legs: [
      { from: "Kerbin Surface", to: "Low Kerbin Orbit", deltaV: 3400 },
      { from: "Low Kerbin Orbit", to: "Jool Transfer", deltaV: 1915 },
      { from: "Jool SOI Entry", to: "Low Jool Orbit", deltaV: 2820 },
      { from: "Low Jool Orbit", to: "Tylo Transfer", deltaV: 400 },
      { from: "Tylo Transfer", to: "Low Tylo Orbit", deltaV: 1100 },
      { from: "Low Tylo Orbit", to: "Tylo Surface", deltaV: 2270 },
    ],
  },
  {
    id: "vall",
    name: "Vall",
    group: "Jool System",
    difficulty: "Advanced",
    description: "Icy moon of Jool. No atmosphere, medium gravity.",
    surfaceGravity: 2.31,
    scienceMultiplier: 10,
    isruViability: "viable",
    legs: [
      { from: "Kerbin Surface", to: "Low Kerbin Orbit", deltaV: 3400 },
      { from: "Low Kerbin Orbit", to: "Jool Transfer", deltaV: 1915 },
      { from: "Jool SOI Entry", to: "Low Jool Orbit", deltaV: 2820 },
      { from: "Low Jool Orbit", to: "Vall Transfer", deltaV: 620 },
      { from: "Vall Transfer", to: "Low Vall Orbit", deltaV: 760 },
      { from: "Low Vall Orbit", to: "Vall Surface", deltaV: 860 },
    ],
  },
  {
    id: "bop",
    name: "Bop",
    group: "Jool System",
    difficulty: "Advanced",
    description:
      "Captured asteroid moon of Jool in a highly inclined orbit. Very low gravity.",
    surfaceGravity: 0.589,
    scienceMultiplier: 12,
    isruViability: "prime",
    legs: [
      { from: "Kerbin Surface", to: "Low Kerbin Orbit", deltaV: 3400 },
      { from: "Low Kerbin Orbit", to: "Jool Transfer", deltaV: 1915 },
      { from: "Jool SOI Entry", to: "Low Jool Orbit", deltaV: 2820 },
      { from: "Low Jool Orbit", to: "Bop Transfer", deltaV: 2200 },
      { from: "Bop Transfer", to: "Low Bop Orbit", deltaV: 900 },
      { from: "Low Bop Orbit", to: "Bop Surface", deltaV: 220 },
    ],
  },
  {
    id: "pol",
    name: "Pol",
    group: "Jool System",
    difficulty: "Advanced",
    description:
      "Outermost and smallest moon of Jool. Lumpy surface, negligible gravity.",
    surfaceGravity: 0.373,
    scienceMultiplier: 12,
    isruViability: "prime",
    legs: [
      { from: "Kerbin Surface", to: "Low Kerbin Orbit", deltaV: 3400 },
      { from: "Low Kerbin Orbit", to: "Jool Transfer", deltaV: 1915 },
      { from: "Jool SOI Entry", to: "Low Jool Orbit", deltaV: 2820 },
      { from: "Low Jool Orbit", to: "Pol Transfer", deltaV: 2820 },
      { from: "Pol Transfer", to: "Low Pol Orbit", deltaV: 820 },
      { from: "Low Pol Orbit", to: "Pol Surface", deltaV: 160 },
    ],
  },

  // ── Outer System ──────────────────────────────────────────────────────────
  {
    id: "eeloo",
    name: "Eeloo",
    group: "Outer System",
    stockOnly: true,
    difficulty: "Advanced",
    description:
      "Icy dwarf planet at the edge of the solar system. No atmosphere.",
    surfaceGravity: 1.69,
    scienceMultiplier: 10,
    isruViability: "viable",
    legs: [
      { from: "Kerbin Surface", to: "Low Kerbin Orbit", deltaV: 3400 },
      { from: "Low Kerbin Orbit", to: "Eeloo Transfer", deltaV: 1960 },
      { from: "Eeloo Transfer", to: "Low Eeloo Orbit", deltaV: 1140 },
      { from: "Low Eeloo Orbit", to: "Eeloo Surface", deltaV: 620 },
    ],
  },

  // ── Outer Planets Mod ─────────────────────────────────────────────────────
  // Sarnus System
  {
    id: "sarnus",
    name: "Sarnus",
    group: "Sarnus System",
    opmOnly: true,
    difficulty: "Expert",
    description:
      "Ringed gas giant beyond Jool. No surface — thick atmosphere allows aerobraking into orbit.",
    scienceMultiplier: 12,
    legs: [
      { from: "Kerbin Surface",   to: "Low Kerbin Orbit",  deltaV: 3400 },
      { from: "Low Kerbin Orbit", to: "Sarnus Transfer",   deltaV: 1020 },
      { from: "Sarnus SOI Entry", to: "Low Sarnus Orbit",  deltaV: 1400, canAerobrake: true },
    ],
  },
  {
    id: "slate",
    name: "Slate",
    group: "Sarnus System",
    opmOnly: true,
    difficulty: "Expert",
    description:
      "Large rocky moon of Sarnus with no atmosphere and strong gravity — the Tylo of the outer system.",
    surfaceGravity: 5.5,
    scienceMultiplier: 15,
    isruViability: "viable",
    legs: [
      { from: "Kerbin Surface",   to: "Low Kerbin Orbit",  deltaV: 3400 },
      { from: "Low Kerbin Orbit", to: "Sarnus Transfer",   deltaV: 1020 },
      { from: "Sarnus SOI Entry", to: "Low Sarnus Orbit",  deltaV: 1400, canAerobrake: true },
      { from: "Low Sarnus Orbit", to: "Slate Transfer",    deltaV: 480 },
      { from: "Slate Transfer",   to: "Low Slate Orbit",   deltaV: 520 },
      { from: "Low Slate Orbit",  to: "Slate Surface",     deltaV: 810 },
    ],
  },
  {
    id: "tekto",
    name: "Tekto",
    group: "Sarnus System",
    opmOnly: true,
    difficulty: "Expert",
    description:
      "Outermost moon of Sarnus with a thick hazy atmosphere. Jet engines won't work, but parachutes will.",
    surfaceGravity: 2.94,
    scienceMultiplier: 12,
    isruViability: "viable",
    legs: [
      { from: "Kerbin Surface",   to: "Low Kerbin Orbit",  deltaV: 3400 },
      { from: "Low Kerbin Orbit", to: "Sarnus Transfer",   deltaV: 1020 },
      { from: "Sarnus SOI Entry", to: "Low Sarnus Orbit",  deltaV: 1400, canAerobrake: true },
      { from: "Low Sarnus Orbit", to: "Tekto Transfer",    deltaV: 620 },
      { from: "Tekto Transfer",   to: "Low Tekto Orbit",   deltaV: 200, canAerobrake: true },
      { from: "Low Tekto Orbit",  to: "Tekto Surface",     deltaV: 1400, canAerobrake: true },
    ],
  },
  {
    id: "ovok",
    name: "Ovok",
    group: "Sarnus System",
    opmOnly: true,
    difficulty: "Advanced",
    description:
      "Small egg-shaped moon of Sarnus. Low gravity makes landing trivial but staying on the surface tricky.",
    surfaceGravity: 0.49,
    scienceMultiplier: 18,
    isruViability: "prime",
    legs: [
      { from: "Kerbin Surface",   to: "Low Kerbin Orbit",  deltaV: 3400 },
      { from: "Low Kerbin Orbit", to: "Sarnus Transfer",   deltaV: 1020 },
      { from: "Sarnus SOI Entry", to: "Low Sarnus Orbit",  deltaV: 1400, canAerobrake: true },
      { from: "Low Sarnus Orbit", to: "Ovok Transfer",     deltaV: 1060 },
      { from: "Ovok Transfer",    to: "Low Ovok Orbit",    deltaV: 100 },
      { from: "Low Ovok Orbit",   to: "Ovok Surface",      deltaV: 50 },
    ],
  },
  {
    id: "hale",
    name: "Hale",
    group: "Sarnus System",
    opmOnly: true,
    difficulty: "Advanced",
    description:
      "Tiny innermost moon of Sarnus. Negligible gravity — a gentle push can reach orbit from the surface.",
    surfaceGravity: 0.1,
    scienceMultiplier: 18,
    isruViability: "prime",
    legs: [
      { from: "Kerbin Surface",   to: "Low Kerbin Orbit",  deltaV: 3400 },
      { from: "Low Kerbin Orbit", to: "Sarnus Transfer",   deltaV: 1020 },
      { from: "Sarnus SOI Entry", to: "Low Sarnus Orbit",  deltaV: 1400, canAerobrake: true },
      { from: "Low Sarnus Orbit", to: "Hale Transfer",     deltaV: 1500 },
      { from: "Hale Transfer",    to: "Low Hale Orbit",    deltaV: 20 },
      { from: "Low Hale Orbit",   to: "Hale Surface",      deltaV: 10 },
    ],
  },
  {
    id: "eeloo-opm",
    name: "Eeloo",
    group: "Sarnus System",
    opmOnly: true,
    difficulty: "Expert",
    description:
      "Former outer planet, now a captured icy moon of Sarnus. No atmosphere — efficient ISRU candidate.",
    surfaceGravity: 1.69,
    scienceMultiplier: 10,
    isruViability: "viable",
    legs: [
      { from: "Kerbin Surface",   to: "Low Kerbin Orbit",  deltaV: 3400 },
      { from: "Low Kerbin Orbit", to: "Sarnus Transfer",   deltaV: 1020 },
      { from: "Sarnus SOI Entry", to: "Low Sarnus Orbit",  deltaV: 1400, canAerobrake: true },
      { from: "Low Sarnus Orbit", to: "Eeloo Transfer",    deltaV: 650 },
      { from: "Eeloo Transfer",   to: "Low Eeloo Orbit",   deltaV: 830 },
      { from: "Low Eeloo Orbit",  to: "Eeloo Surface",     deltaV: 620 },
    ],
  },

  // Urlum System
  {
    id: "urlum",
    name: "Urlum",
    group: "Urlum System",
    opmOnly: true,
    difficulty: "Expert",
    description:
      "Tilted ice giant with a ring system. Its extreme axial tilt makes polar orbits unusual.",
    scienceMultiplier: 14,
    legs: [
      { from: "Kerbin Surface",   to: "Low Kerbin Orbit",  deltaV: 3400 },
      { from: "Low Kerbin Orbit", to: "Urlum Transfer",    deltaV: 2310 },
      { from: "Urlum SOI Entry",  to: "Low Urlum Orbit",   deltaV: 2050, canAerobrake: true },
    ],
  },
  {
    id: "polta",
    name: "Polta",
    group: "Urlum System",
    opmOnly: true,
    difficulty: "Expert",
    description:
      "Innermost moon of Urlum. Rocky, airless, and very far from home.",
    surfaceGravity: 2.0,
    scienceMultiplier: 16,
    isruViability: "viable",
    legs: [
      { from: "Kerbin Surface",   to: "Low Kerbin Orbit",  deltaV: 3400 },
      { from: "Low Kerbin Orbit", to: "Urlum Transfer",    deltaV: 2310 },
      { from: "Urlum SOI Entry",  to: "Low Urlum Orbit",   deltaV: 2050, canAerobrake: true },
      { from: "Low Urlum Orbit",  to: "Polta Transfer",    deltaV: 520 },
      { from: "Polta Transfer",   to: "Low Polta Orbit",   deltaV: 260 },
      { from: "Low Polta Orbit",  to: "Polta Surface",     deltaV: 200 },
    ],
  },
  {
    id: "priax",
    name: "Priax",
    group: "Urlum System",
    opmOnly: true,
    difficulty: "Expert",
    description:
      "Small companion moon to Polta, sharing a similar orbit around Urlum.",
    surfaceGravity: 1.5,
    scienceMultiplier: 16,
    isruViability: "viable",
    legs: [
      { from: "Kerbin Surface",   to: "Low Kerbin Orbit",  deltaV: 3400 },
      { from: "Low Kerbin Orbit", to: "Urlum Transfer",    deltaV: 2310 },
      { from: "Urlum SOI Entry",  to: "Low Urlum Orbit",   deltaV: 2050, canAerobrake: true },
      { from: "Low Urlum Orbit",  to: "Priax Transfer",    deltaV: 590 },
      { from: "Priax Transfer",   to: "Low Priax Orbit",   deltaV: 200 },
      { from: "Low Priax Orbit",  to: "Priax Surface",     deltaV: 140 },
    ],
  },
  {
    id: "wal",
    name: "Wal",
    group: "Urlum System",
    opmOnly: true,
    difficulty: "Expert",
    description:
      "Largest moon of Urlum. Significant gravity and no atmosphere — and hosts its own subsatellite, Tal.",
    surfaceGravity: 4.9,
    scienceMultiplier: 15,
    isruViability: "viable",
    legs: [
      { from: "Kerbin Surface",   to: "Low Kerbin Orbit",  deltaV: 3400 },
      { from: "Low Kerbin Orbit", to: "Urlum Transfer",    deltaV: 2310 },
      { from: "Urlum SOI Entry",  to: "Low Urlum Orbit",   deltaV: 2050, canAerobrake: true },
      { from: "Low Urlum Orbit",  to: "Wal Transfer",      deltaV: 980 },
      { from: "Wal Transfer",     to: "Low Wal Orbit",     deltaV: 500 },
      { from: "Low Wal Orbit",    to: "Wal Surface",       deltaV: 1100 },
    ],
  },
  {
    id: "tal",
    name: "Tal",
    group: "Urlum System",
    opmOnly: true,
    difficulty: "Expert",
    description:
      "Tiny moon of Wal — a moon of a moon. Exceptionally rare; one of very few subsatellites in the Kerbol system.",
    surfaceGravity: 0.2,
    scienceMultiplier: 20,
    isruViability: "prime",
    legs: [
      { from: "Kerbin Surface",   to: "Low Kerbin Orbit",  deltaV: 3400 },
      { from: "Low Kerbin Orbit", to: "Urlum Transfer",    deltaV: 2310 },
      { from: "Urlum SOI Entry",  to: "Low Urlum Orbit",   deltaV: 2050, canAerobrake: true },
      { from: "Low Urlum Orbit",  to: "Wal Transfer",      deltaV: 980 },
      { from: "Wal Transfer",     to: "Low Wal Orbit",     deltaV: 500 },
      { from: "Low Wal Orbit",    to: "Tal Transfer",      deltaV: 300 },
      { from: "Tal Transfer",     to: "Tal Surface",       deltaV: 30 },
    ],
  },

  // Neidon System
  {
    id: "neidon",
    name: "Neidon",
    group: "Neidon System",
    opmOnly: true,
    difficulty: "Expert",
    description:
      "Deep-blue ice giant at the far edge of the Kerbol system. Capturing into orbit is extremely expensive.",
    scienceMultiplier: 16,
    legs: [
      { from: "Kerbin Surface",   to: "Low Kerbin Orbit",  deltaV: 3400 },
      { from: "Low Kerbin Orbit", to: "Neidon Transfer",   deltaV: 2040 },
      { from: "Neidon SOI Entry", to: "Low Neidon Orbit",  deltaV: 2860, canAerobrake: true },
    ],
  },
  {
    id: "thatmo",
    name: "Thatmo",
    group: "Neidon System",
    opmOnly: true,
    difficulty: "Expert",
    description:
      "Large retrograde moon of Neidon with a thick nitrogen atmosphere. Parachutes work, ascent is costly.",
    surfaceGravity: 6.87,
    scienceMultiplier: 18,
    isruViability: "viable",
    legs: [
      { from: "Kerbin Surface",    to: "Low Kerbin Orbit",   deltaV: 3400 },
      { from: "Low Kerbin Orbit",  to: "Neidon Transfer",    deltaV: 2040 },
      { from: "Neidon SOI Entry",  to: "Low Neidon Orbit",   deltaV: 2860, canAerobrake: true },
      { from: "Low Neidon Orbit",  to: "Thatmo Transfer",    deltaV: 650 },
      { from: "Thatmo Transfer",   to: "Low Thatmo Orbit",   deltaV: 660, canAerobrake: true },
      { from: "Low Thatmo Orbit",  to: "Thatmo Surface",     deltaV: 1600, canAerobrake: true },
    ],
  },
  {
    id: "nissee",
    name: "Nissee",
    group: "Neidon System",
    opmOnly: true,
    difficulty: "Expert",
    description:
      "Tiny captured irregular moon of Neidon in a highly inclined orbit. Negligible gravity.",
    surfaceGravity: 0.1,
    scienceMultiplier: 20,
    isruViability: "prime",
    legs: [
      { from: "Kerbin Surface",   to: "Low Kerbin Orbit",   deltaV: 3400 },
      { from: "Low Kerbin Orbit", to: "Neidon Transfer",    deltaV: 2040 },
      { from: "Neidon SOI Entry", to: "Low Neidon Orbit",   deltaV: 2860, canAerobrake: true },
      { from: "Low Neidon Orbit", to: "Nissee Transfer",    deltaV: 1380 },
      { from: "Nissee Transfer",  to: "Nissee Surface",     deltaV: 30 },
    ],
  },

  // Plock System
  {
    id: "plock",
    name: "Plock",
    group: "Plock System",
    opmOnly: true,
    difficulty: "Expert",
    description:
      "Icy dwarf planet in an eccentric outer orbit, locked in a binary dance with its companion Karen.",
    surfaceGravity: 2.2,
    scienceMultiplier: 18,
    isruViability: "viable",
    legs: [
      { from: "Kerbin Surface",   to: "Low Kerbin Orbit",  deltaV: 3400 },
      { from: "Low Kerbin Orbit", to: "Plock Transfer",    deltaV: 2180 },
      { from: "Plock Transfer",   to: "Low Plock Orbit",   deltaV: 1160 },
      { from: "Low Plock Orbit",  to: "Plock Surface",     deltaV: 220 },
    ],
  },
  {
    id: "karen",
    name: "Karen",
    group: "Plock System",
    opmOnly: true,
    difficulty: "Expert",
    description:
      "Binary companion to Plock, nearly half its size. The two are tidally locked, always facing each other.",
    surfaceGravity: 0.3,
    scienceMultiplier: 20,
    isruViability: "prime",
    legs: [
      { from: "Kerbin Surface",   to: "Low Kerbin Orbit",  deltaV: 3400 },
      { from: "Low Kerbin Orbit", to: "Plock Transfer",    deltaV: 2180 },
      { from: "Plock Transfer",   to: "Low Plock Orbit",   deltaV: 1160 },
      { from: "Low Plock Orbit",  to: "Karen Transfer",    deltaV: 100 },
      { from: "Karen Transfer",   to: "Karen Surface",     deltaV: 30 },
    ],
  },

  // ── Real Solar System (RSS) destinations ──────────────────────────────────
  // Delta-v values from community RSS delta-v maps. Propulsive only.
  {
    id: "rss-earth",
    name: "Earth",
    group: "Earth System",
    rssOnly: true,
    difficulty: "Beginner",
    description:
      "Home. Earth's thick atmosphere enables aerobrake return from LEO for just ~200 m/s. Reaching orbit requires ~9 400 m/s — nearly three times the KSP stock ascent.",
    surfaceGravity: 9.81,
    scienceMultiplier: 1,
    legs: [
      { from: "Earth Surface", to: "Low Earth Orbit", deltaV: 9400 },
      { from: "Low Earth Orbit", to: "Earth Surface", deltaV: 200, canAerobrake: true },
    ],
  },
  {
    id: "rss-moon",
    name: "Moon",
    group: "Earth System",
    rssOnly: true,
    difficulty: "Intermediate",
    description:
      "Earth's natural satellite. No atmosphere — every landing and ascent is purely propulsive. The Apollo missions required ~17 km/s total delta-v.",
    surfaceGravity: 1.62,
    scienceMultiplier: 4,
    isruViability: "viable",
    legs: [
      { from: "Earth Surface",            to: "Low Earth Orbit",    deltaV: 9400 },
      { from: "Low Earth Orbit",           to: "Trans-Lunar Injection", deltaV: 3130 },
      { from: "Trans-Lunar Injection",     to: "Low Lunar Orbit",   deltaV: 900 },
      { from: "Low Lunar Orbit",           to: "Moon Surface",      deltaV: 1900 },
    ],
  },
  {
    id: "rss-venus",
    name: "Venus",
    group: "Sol Inner Planets",
    rssOnly: true,
    difficulty: "Advanced",
    description:
      "Earth's toxic twin. Its thick CO₂ atmosphere allows aerocapture into orbit, but surface conditions (92 atm, 465 °C) make landing an engineering nightmare.",
    surfaceGravity: 8.87,
    scienceMultiplier: 7,
    legs: [
      { from: "Earth Surface",        to: "Low Earth Orbit",     deltaV: 9400 },
      { from: "Low Earth Orbit",      to: "Venus Transfer",      deltaV: 640 },
      { from: "Venus Transfer",       to: "Low Venus Orbit",     deltaV: 250, canAerobrake: true },
      { from: "Low Venus Orbit",      to: "Venus Surface",       deltaV: 720, canAerobrake: true },
    ],
  },
  {
    id: "rss-mercury",
    name: "Mercury",
    group: "Sol Inner Planets",
    rssOnly: true,
    difficulty: "Expert",
    description:
      "Innermost planet. No atmosphere means a brutal 4 700 m/s capture burn. Close solar proximity and eccentric orbit make transfers expensive and infrequent.",
    surfaceGravity: 3.70,
    scienceMultiplier: 10,
    isruViability: "viable",
    legs: [
      { from: "Earth Surface",         to: "Low Earth Orbit",      deltaV: 9400 },
      { from: "Low Earth Orbit",       to: "Mercury Transfer",     deltaV: 2100 },
      { from: "Mercury Transfer",      to: "Low Mercury Orbit",    deltaV: 4700 },
      { from: "Low Mercury Orbit",     to: "Mercury Surface",      deltaV: 1200 },
    ],
  },
  {
    id: "rss-mars",
    name: "Mars",
    group: "Mars System",
    rssOnly: true,
    difficulty: "Intermediate",
    description:
      "The Red Planet. Thin atmosphere allows aerocapture to orbit and parachute-assisted landing. First crewed destination beyond the Earth-Moon system.",
    surfaceGravity: 3.72,
    scienceMultiplier: 8,
    isruViability: "viable",
    legs: [
      { from: "Earth Surface",         to: "Low Earth Orbit",    deltaV: 9400 },
      { from: "Low Earth Orbit",       to: "Trans-Mars Injection", deltaV: 900 },
      { from: "Trans-Mars Injection",  to: "Low Mars Orbit",     deltaV: 900, canAerobrake: true },
      { from: "Low Mars Orbit",        to: "Mars Surface",       deltaV: 500, canAerobrake: true },
    ],
  },
  {
    id: "rss-phobos",
    name: "Phobos",
    group: "Mars System",
    rssOnly: true,
    difficulty: "Expert",
    description:
      "Mars's inner moon — a captured asteroid with near-zero gravity. A potential staging outpost for Mars surface operations; landing is essentially just matching orbit.",
    surfaceGravity: 0.006,
    scienceMultiplier: 9,
    isruViability: "prime",
    legs: [
      { from: "Earth Surface",         to: "Low Earth Orbit",    deltaV: 9400 },
      { from: "Low Earth Orbit",       to: "Trans-Mars Injection", deltaV: 900 },
      { from: "Trans-Mars Injection",  to: "Low Mars Orbit",     deltaV: 900, canAerobrake: true },
      { from: "Low Mars Orbit",        to: "Phobos Surface",     deltaV: 1250 },
    ],
  },
  {
    id: "rss-deimos",
    name: "Deimos",
    group: "Mars System",
    rssOnly: true,
    difficulty: "Expert",
    description:
      "Mars's outer moon. More distant and harder to reach from LMO than Phobos, but its near-escape trajectory makes it attractive as a deep-space waypoint.",
    surfaceGravity: 0.003,
    scienceMultiplier: 9,
    isruViability: "prime",
    legs: [
      { from: "Earth Surface",         to: "Low Earth Orbit",    deltaV: 9400 },
      { from: "Low Earth Orbit",       to: "Trans-Mars Injection", deltaV: 900 },
      { from: "Trans-Mars Injection",  to: "Low Mars Orbit",     deltaV: 900, canAerobrake: true },
      { from: "Low Mars Orbit",        to: "Deimos Surface",     deltaV: 1750 },
    ],
  },

  // ── 1/4 Scale (KSRSS) destinations ────────────────────────────────────────
  // Delta-v values for Real Solar System at 1/4 scale (KSRSS mod).
  // Orbital velocities are roughly 1/2 of full RSS values.
  {
    id: "q-earth",
    name: "Earth",
    group: "Earth System",
    quarterScaleOnly: true,
    difficulty: "Beginner",
    description:
      "Home at 1/4 scale. Orbital requirements are intermediate between stock KSP and full RSS — around 4 750 m/s to LEO.",
    surfaceGravity: 9.81,
    scienceMultiplier: 1,
    legs: [
      { from: "Earth Surface", to: "Low Earth Orbit", deltaV: 4750 },
      { from: "Low Earth Orbit", to: "Earth Surface", deltaV: 100, canAerobrake: true },
    ],
  },
  {
    id: "q-moon",
    name: "Moon",
    group: "Earth System",
    quarterScaleOnly: true,
    difficulty: "Beginner",
    description:
      "Earth's natural satellite at 1/4 scale. Lower delta-v than full RSS but still demands careful mission planning.",
    surfaceGravity: 1.62,
    scienceMultiplier: 4,
    isruViability: "viable",
    legs: [
      { from: "Earth Surface",             to: "Low Earth Orbit",       deltaV: 4750 },
      { from: "Low Earth Orbit",           to: "Trans-Lunar Injection", deltaV: 1560 },
      { from: "Trans-Lunar Injection",     to: "Low Lunar Orbit",       deltaV: 450 },
      { from: "Low Lunar Orbit",           to: "Moon Surface",          deltaV: 950 },
    ],
  },
  {
    id: "q-venus",
    name: "Venus",
    group: "Sol Inner Planets",
    quarterScaleOnly: true,
    difficulty: "Advanced",
    description:
      "Venus at 1/4 scale. The atmosphere still provides aerocapture savings, but surface conditions remain hostile.",
    surfaceGravity: 8.87,
    scienceMultiplier: 7,
    legs: [
      { from: "Earth Surface",    to: "Low Earth Orbit",  deltaV: 4750 },
      { from: "Low Earth Orbit",  to: "Venus Transfer",   deltaV: 320 },
      { from: "Venus Transfer",   to: "Low Venus Orbit",  deltaV: 130, canAerobrake: true },
      { from: "Low Venus Orbit",  to: "Venus Surface",    deltaV: 360, canAerobrake: true },
    ],
  },
  {
    id: "q-mercury",
    name: "Mercury",
    group: "Sol Inner Planets",
    quarterScaleOnly: true,
    difficulty: "Expert",
    description:
      "Mercury at 1/4 scale. Still demands a costly capture burn with no atmosphere to help.",
    surfaceGravity: 3.70,
    scienceMultiplier: 10,
    isruViability: "viable",
    legs: [
      { from: "Earth Surface",      to: "Low Earth Orbit",    deltaV: 4750 },
      { from: "Low Earth Orbit",    to: "Mercury Transfer",   deltaV: 1050 },
      { from: "Mercury Transfer",   to: "Low Mercury Orbit",  deltaV: 2350 },
      { from: "Low Mercury Orbit",  to: "Mercury Surface",    deltaV: 600 },
    ],
  },
  {
    id: "q-mars",
    name: "Mars",
    group: "Mars System",
    quarterScaleOnly: true,
    difficulty: "Intermediate",
    description:
      "Mars at 1/4 scale. The thin atmosphere still enables aerocapture and parachute landings.",
    surfaceGravity: 3.72,
    scienceMultiplier: 8,
    isruViability: "viable",
    legs: [
      { from: "Earth Surface",        to: "Low Earth Orbit",      deltaV: 4750 },
      { from: "Low Earth Orbit",      to: "Trans-Mars Injection", deltaV: 450 },
      { from: "Trans-Mars Injection", to: "Low Mars Orbit",       deltaV: 450, canAerobrake: true },
      { from: "Low Mars Orbit",       to: "Mars Surface",         deltaV: 500, canAerobrake: true },
    ],
  },
  {
    id: "q-phobos",
    name: "Phobos",
    group: "Mars System",
    quarterScaleOnly: true,
    difficulty: "Expert",
    description:
      "Phobos at 1/4 scale. Microgravity body — a great staging point for Mars surface missions.",
    surfaceGravity: 0.006,
    scienceMultiplier: 9,
    isruViability: "prime",
    legs: [
      { from: "Earth Surface",        to: "Low Earth Orbit",      deltaV: 4750 },
      { from: "Low Earth Orbit",      to: "Trans-Mars Injection", deltaV: 450 },
      { from: "Trans-Mars Injection", to: "Low Mars Orbit",       deltaV: 450, canAerobrake: true },
      { from: "Low Mars Orbit",       to: "Phobos Surface",       deltaV: 625 },
    ],
  },
  {
    id: "q-deimos",
    name: "Deimos",
    group: "Mars System",
    quarterScaleOnly: true,
    difficulty: "Expert",
    description:
      "Deimos at 1/4 scale. More distant from Mars than Phobos; useful as a deep-space waypoint.",
    surfaceGravity: 0.003,
    scienceMultiplier: 9,
    isruViability: "prime",
    legs: [
      { from: "Earth Surface",        to: "Low Earth Orbit",      deltaV: 4750 },
      { from: "Low Earth Orbit",      to: "Trans-Mars Injection", deltaV: 450 },
      { from: "Trans-Mars Injection", to: "Low Mars Orbit",       deltaV: 450, canAerobrake: true },
      { from: "Low Mars Orbit",       to: "Deimos Surface",       deltaV: 875 },
    ],
  },
];

export const DESTINATION_GROUPS: DestinationGroup[] = [
  "Kerbin System",
  "Inner Planets",
  "Middle System",
  "Jool System",
  "Outer System",
  "Sarnus System",
  "Urlum System",
  "Neidon System",
  "Plock System",
  // RSS / 1/4-scale groups
  "Earth System",
  "Sol Inner Planets",
  "Mars System",
];

/** Per-body accent colors (matches DeltaVMap node strokes) */
export const BODY_COLORS: Record<string, string> = {
  kerbin:     "#4070d0",
  mun:        "#909090",
  minmus:     "#50a060",
  moho:       "#c8a050",
  eve:        "#8050c0",
  gilly:      "#a070d0",
  duna:       "#c04040",
  ike:        "#808080",
  dres:       "#a0a0a0",
  jool:       "#40a030",
  laythe:     "#4080c0",
  tylo:       "#c0c080",
  vall:       "#60b0b0",
  bop:        "#806040",
  pol:        "#c0a060",
  eeloo:      "#a0c0e0",
  // RSS / 1/4-scale (real solar system bodies; shared between rss- and q- prefixes)
  earth:      "#4070d0",
  moon:       "#909090",
  venus:      "#d4a840",
  mercury:    "#b09068",
  mars:       "#c04040",
  phobos:     "#808070",
  deimos:     "#908878",
  // OPM
  sarnus:     "#c8b470",
  slate:      "#708090",
  tekto:      "#5090a8",
  ovok:       "#c8b080",
  hale:       "#a08060",
  "eeloo-opm": "#a0c0e0",
  plock:      "#c8c0d8",
  karen:      "#d0c0b8",
  urlum:      "#60a8c0",
  polta:      "#90a8b8",
  priax:      "#a0b0c0",
  wal:        "#7090a8",
  tal:        "#98b0c0",
  neidon:     "#4060c0",
  thatmo:     "#607888",
  nissee:     "#b0b8c8",
};

/**
 * Hardcoded orbit-to-orbit delta-v for same-system transfers.
 * Key: sorted body IDs joined by "|". Value: Δv in m/s.
 *
 * Sources:
 *  • Vanilla KSP moon pairs: blaarkies/ksp-visual-calculator (delta-v-graph.ts),
 *    formula: ejectDv + planeChangeDv + captureDv (direct Hohmann/bielliptic).
 *    Propulsive costs only — no aerocapture savings applied.
 *  • Jool↔moon costs: community delta-v map edge labels (include aerocapture for
 *    Laythe). jool|laythe MUST be hardcoded — Laythe's legs bypass LJO via a direct
 *    SOI-entry aerocapture, breaking the common-prefix routing algorithm.
 *  • OPM Sarnus moon pairs: Kowgan ksp_cheat_sheets OPM delta-v map (v1.8.1),
 *    average of forward/reverse eject+capture costs from the SVG data.
 *  • OPM Urlum / Neidon / Plock: derived from existing leg data (parent-orbit hub).
 */
export const INTRA_SYSTEM_DV: Record<string, number> = {
  // ── Kerbin system (blaarkies: eject 215 + plane 2 + capture 85) ──────────
  "minmus|mun":          310,

  // ── Eve system (blaarkies: LEvO→LGO ≈ 1 484 m/s propulsive) ─────────────
  // The 60+30 m/s in the leg data is the incremental cost from an Eve intercept
  // trajectory, not from a circular low Eve orbit.
  "eve|gilly":          1480,

  // ── Duna system (blaarkies: LDO→LIO ≈ 413 m/s) ───────────────────────────
  "duna|ike":            410,

  // ── Jool system — moon pairs (blaarkies direct transfer values) ───────────
  // Much cheaper than routing via LJO (which would give 2 880–6 740 m/s).
  "bop|laythe":         1190,  // 404 + 2 + 787
  "bop|pol":             260,  // 75  + 2 + 182
  "bop|tylo":           1010,  // 109 + 2 + 894
  "bop|vall":            790,  // 304 + 2 + 483
  "laythe|pol":         1220,  // 416 + 2 + 797
  "laythe|tylo":        1500,  // 848 + 2 + 649
  "laythe|vall":         960,  // 330 + 2 + 628
  "pol|tylo":           1030,  // 178 + 2 + 846
  "pol|vall":            800,  // 303 + 2 + 495
  "tylo|vall":          1190,  // 830 + 2 + 357

  // ── Jool system — Jool↔moon (community delta-v map, LJO costs) ───────────
  // Tylo/Vall/Bop/Pol also computed correctly by common-prefix algorithm, but
  // hardcoded here for explicitness. jool|laythe cannot be derived algorithmically.
  "bop|jool":           3100,  // LJO→Bop: 2200+900
  "jool|laythe":        1510,  // community map (aerocapture at Laythe)
  "jool|pol":           3640,  // LJO→Pol: 2820+820
  "jool|tylo":          1500,  // LJO→Tylo: 400+1100
  "jool|vall":          1380,  // LJO→Vall: 620+760

  // ── Sarnus system (OPM) — moon pairs (Kowgan SVG, avg of both directions) ─
  // Eject/capture from SVG: Hale(540/70), Ovok(650/100), Eeloo(1120/160),
  //                         Slate(1460/155), Tekto(1540/630).
  "hale|ovok":           680,  // (540+100 + 650+70) / 2
  "eeloo-opm|hale":      950,  // (540+160 + 1120+70) / 2
  "hale|slate":         1110,  // (540+155 + 1460+70) / 2
  "hale|tekto":         1390,  // (540+630 + 1540+70) / 2
  "eeloo-opm|ovok":     1020,  // (650+160 + 1120+100) / 2
  "ovok|slate":         1180,  // (650+155 + 1460+100) / 2
  "ovok|tekto":         1460,  // (650+630 + 1540+100) / 2
  "eeloo-opm|slate":    1450,  // (1120+155 + 1460+160) / 2
  "eeloo-opm|tekto":    1730,  // (1120+630 + 1540+160) / 2
  "slate|tekto":        1890,  // (1460+630 + 1540+155) / 2
  // Sarnus↔moon handled correctly by common-prefix algorithm (all share legs to LSO).

  // ── Urlum system (OPM) — via Low Urlum Orbit hub (leg data) ──────────────
  // LUO↔moon: Polta 780, Priax 790, Wal 1480. Tal orbits Wal (LWO→Tal = 300).
  "polta|priax":        1570,  // 780 + 790
  "polta|wal":          2260,  // 780 + 1480
  "priax|wal":          2270,  // 790 + 1480
  "tal|wal":             300,
  "polta|tal":          2560,  // 780 + 1480 + 300  (via LUO then LWO)
  "priax|tal":          2570,  // 790 + 1480 + 300
  "tal|urlum":          1780,  // 300 + 1480
  // Urlum↔moon handled correctly by common-prefix algorithm.

  // ── Neidon system (OPM) ───────────────────────────────────────────────────
  // Kowgan SVG: Thatmo↔Nissee ~850–930 m/s (avg ~890). Via-LNO gives 2 690 m/s.
  "nissee|thatmo":       890,
  // Neidon↔moon handled correctly by common-prefix algorithm.

  // ── Plock system (OPM) ────────────────────────────────────────────────────
  "karen|plock":         100,  // LPO→Karen Transfer (from leg data)
};

/**
 * Maps each moon ID to the ID of the non-Kerbin planet it orbits.
 * Used to detect cross-system transfers (moon of planet A ↔ moon of planet B).
 */
export const MOON_PARENT_PLANET: Record<string, string> = {
  // Stock
  gilly:      "eve",
  ike:        "duna",
  laythe:     "jool",
  vall:       "jool",
  tylo:       "jool",
  bop:        "jool",
  pol:        "jool",
  // OPM — Sarnus system
  slate:      "sarnus",
  tekto:      "sarnus",
  ovok:       "sarnus",
  hale:       "sarnus",
  "eeloo-opm": "sarnus",
  // OPM — Urlum system (Tal orbits Wal which orbits Urlum; treat Urlum as parent)
  polta:      "urlum",
  priax:      "urlum",
  wal:        "urlum",
  tal:        "urlum",
  // OPM — Neidon system
  thatmo:     "neidon",
  nissee:     "neidon",
  // OPM — Plock system
  karen:      "plock",
};

/**
 * Direct planet-to-planet transfer costs (Low Planet Orbit → Low Planet Orbit),
 * propulsive only, minimum-energy Hohmann transfer with Oberth effect.
 *
 * Calculated from KSP/OPM orbital parameters (vis-viva + Oberth):
 *   v_∞ = |v_planet_helio − v_transfer_at_planet|
 *   Δv  = sqrt(v_c² + v_∞²) − v_c   (ejection/capture burn at LPO)
 *
 * Key format: "planet1|planet2" (alphabetically sorted), value in m/s.
 *
 * Stock planet parameters used (SMA / GM / radius):
 *   Eve   9.832e9 m / 8.1718e12 / 700 km   LO r=800 km  v_c=3196 m/s
 *   Duna  2.067e10 m / 3.0136e11 / 320 km  LO r=420 km  v_c= 847 m/s
 *   Jool  6.836e10 m / 2.8253e14 / 6000 km LO r=6200 km v_c=6751 m/s
 * OPM planet parameters (approximate):
 *   Sarnus  1.25e11 m / 5.1286e14 / 5300 km  LO r=5500 km  v_c=9655 m/s
 *   Urlum   2.70e11 m / 8.8789e13 / 2500 km  LO r=2700 km  v_c=5734 m/s
 *   Neidon  4.09e11 m / 9.1744e13 / 2500 km  LO r=2700 km  v_c=5829 m/s
 *   Plock   5.35e11 m / 1.7848e11 /  189 km  LO r= 289 km  v_c= 786 m/s
 */
/**
 * Reference-orbit delta-v values shown on the orbital map (DeltaVMap.tsx).
 * These are not Destinations, so they live here as plain constants.
 * Keostationary (KEO): per the KSP wiki, altitude 2,863.33 km, speed 1,009.81 m/s.
 * From 80 km LKO, the two-burn Hohmann insertion costs ~1,150 m/s.
 * Heliostationary: not an official KSP term. Defined here as the circular orbit
 * around Kerbol matching Kerbol's sidereal rotation (432,000 s), by analogy
 * with KEO. Via Kepler's third law (mu_kerbol=1.1723328e18, T=432000s):
 * a ~= 1,769,645 km (altitude ~= 1,508,045 km, matching the fan-wiki figure).
 * Delta-v from LKO is a Hohmann transfer inward to that radius (vis-viva +
 * Oberth): ~3,527 m/s ejection + ~8,502 m/s circularize = ~12,030 m/s total.
 */
export const KEOSTATIONARY_DV_FROM_LKO = 1150;
export const HELIOSTATIONARY_DV_FROM_LKO = 12030;
export const INTER_SYSTEM_DV: Record<string, number> = {
  // ── Stock cross-system pairs ──────────────────────────────────────────────
  "duna|eve":        1330,  // Eve ejection 470 + Duna capture 860
  "eve|jool":        1860,  // Jool ejection 305 + Eve capture 1555
  "duna|jool":       1270,  // Jool ejection 126 + Duna capture 1144

  // ── Stock ↔ OPM ───────────────────────────────────────────────────────────
  "eve|sarnus":      2070,  // Eve ejection 1887 + Sarnus capture  183
  "duna|sarnus":     1750,  // Duna ejection 1638 + Sarnus capture  112
  "jool|sarnus":       40,  // Jool ejection   24 + Sarnus capture   13
  "eve|urlum":       2330,  // Eve ejection 2123 + Urlum capture   207
  "duna|urlum":      2160,  // Duna ejection 2016 + Urlum capture   145
  "jool|urlum":       140,  // Jool ejection   87 + Urlum capture    53
  "sarnus|urlum":      30,  // Sarnus ejection 14 + Urlum capture    16
  "eve|neidon":      2350,  // Eve ejection 2197 + Neidon capture   153
  "duna|neidon":     2250,  // Duna ejection 2135 + Neidon capture  115
  "jool|neidon":      170,  // Jool ejection  119 + Neidon capture   51
  "sarnus|neidon":     55,  // Sarnus ejection 28 + Neidon capture   27
  "neidon|urlum":       6,  // Both giants — near-zero Oberth burns
  "eve|plock":       2880,  // Eve ejection 2229 + Plock capture    649
  "duna|plock":      2740,  // Duna ejection 2193 + Plock capture   547
  "jool|plock":       460,  // Jool ejection  137 + Plock capture   323
  "sarnus|plock":     220,  // Sarnus ejection 37 + Plock capture   183
  "neidon|plock":      10,  // Neidon ejection  1 + Plock capture     8
  "plock|urlum":       55,  // Urlum ejection   9 + Plock capture    45
};

/**
 * Cost (m/s) to transfer between a moon's low orbit and its parent planet's
 * low orbit. Checks INTRA_SYSTEM_DV first (needed for Gilly and Ike where the
 * leg data only encodes incremental costs from an intercept trajectory, not
 * from a circular planet orbit); falls back to summing the moon's own leg data.
 */
export function getMoonToParentDV(
  moonId: string,
  parentPlanetId: string,
  moonDest: Destination,
  planetOrbitLabel: string,
): number {
  const key = [moonId, parentPlanetId].sort().join("|");
  if (INTRA_SYSTEM_DV[key] !== undefined) return INTRA_SYSTEM_DV[key];

  // Derive from leg data: sum legs from planetOrbitLabel to the moon's orbit
  const moonOrbitLabel = getOrbitLabel(moonDest);
  const legs = moonDest.legs;
  const startIdx = legs.findIndex((l) => l.to === planetOrbitLabel);
  if (startIdx === -1) return 0;
  let cost = 0;
  for (let i = startIdx + 1; i < legs.length; i++) {
    cost += legs[i].deltaV;
    if (legs[i].to === moonOrbitLabel) break;
  }
  return cost;
}

/**
 * Get the "low orbit" label for a body — the last waypoint before the surface.
 * For gas giants (no surface) it is the "to" of the last leg; for solid bodies
 * it is the "from" of the last leg.
 */
export function getOrbitLabel(dest: Destination): string {
  const last = dest.legs[dest.legs.length - 1];
  return dest.surfaceGravity == null ? last.to : last.from;
}

/**
 * Build the return legs: same path in reverse.
 * The final leg (landing on Kerbin after aerobraking) costs ~80 m/s.
 */
export function buildReturnLegs(legs: Leg[]): Leg[] {
  const reversed = [...legs].reverse().map((leg) => ({
    from: leg.to,
    to: leg.from,
    deltaV: leg.deltaV,
    canAerobrake: leg.canAerobrake,
  }));
  // Override the last leg: arriving at Kerbin/Earth only costs a deorbit burn;
  // the atmosphere handles the rest.
  const last = reversed[reversed.length - 1];
  if (last.to === "Kerbin Surface") {
    reversed[reversed.length - 1] = { ...last, deltaV: 80, canAerobrake: true };
  } else if (last.to === "Earth Surface") {
    reversed[reversed.length - 1] = { ...last, deltaV: 200, canAerobrake: true };
  }
  return reversed;
}
