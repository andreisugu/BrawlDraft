import { BrawlMap } from '../models/map';

export const MAPS: BrawlMap[] = [
  // --- HOT ZONE ---
  {
    id: 'ring_of_fire',
    name: 'Ring of Fire',
    mode: 'HOT_ZONE',
    terrain: 'SEMI_OPEN',
    description: 'Single centralized zone surrounded by grass and symmetrical side wall corridors.',
    proNotes: 'Lou and Crow are the top first picks. If enemy responds with long range (Amber/Belle/Pierce), punish with an aggressive Space Maker (Ollie/Kaze).',
    bannedFirstPicksAggressive: ['crow', 'lou', 'clancy', 'colette', 'nyx', 'sirius'],
    keyPicks: ['lou', 'crow', 'clancy', 'ollie', 'amber', 'pierce'],
  },
  {
    id: 'open_business_hz',
    name: 'Open Business',
    mode: 'HOT_ZONE',
    terrain: 'SEMI_OPEN',
    description: 'Split corridors leading to a single large capture zone with side walls.',
    proNotes: 'Clancy and Lou are prioritized over generic anti-tanks due to unmatched area denial in the zone.',
    bannedFirstPicksAggressive: ['crow', 'colette', 'nyx', 'clancy', 'sirius'],
    keyPicks: ['clancy', 'crow', 'lou', 'otis', 'chester', 'juju', 'kaze'],
  },

  // --- BOUNTY ---
  {
    id: 'shooting_star',
    name: 'Shooting Star',
    mode: 'BOUNTY',
    terrain: 'OPEN',
    description: 'Extremely open map with minimal cover, favoring snipers and long-range duels.',
    proNotes: 'If opponents pick triple squishy snipers (e.g. Nani, Piper, Bea) and lack wall breaks, a 6th pick Thrower (Tick/Sprout/Grom/Sirius) is an uncontestable 100% win.',
    bannedFirstPicksPassive: ['nyx', 'gene', 'pierce', 'belle', 'byron'],
    keyPicks: ['pierce', 'gene', 'rt', 'nani', 'belle', 'byron', 'tick'],
  },
  {
    id: 'hideout',
    name: 'Hideout',
    mode: 'BOUNTY',
    terrain: 'SEMI_OPEN',
    description: 'Long lanes flanked by thick side bushes and center chokepoint.',
    proNotes: 'If your team has 1st pick, ban Belle or Byron to strip enemy of their best 2/3 flex snipers.',
    bannedFirstPicksPassive: ['pierce', 'nyx', 'gene'],
    keyPicks: ['pierce', 'belle', 'byron', 'gus', 'nani', 'leon', 'mortis'],
  },

  // --- BRAWL BALL ---
  {
    id: 'sneaky_fields',
    name: 'Sneaky Fields',
    mode: 'BRAWL_BALL',
    terrain: 'BUSHY',
    description: 'Dense field of grass across mid with side obstacles.',
    proNotes: 'Anti-Tanks are supreme. If enemy first picks Crow, immediately draft the next best Anti-Tanks (Nita, Otis, Chester) in the 2/3 slot.',
    bannedFirstPicksAggressive: ['crow', 'colette', 'otis', 'chester', 'nyx', 'sirius'],
    keyPicks: ['crow', 'otis', 'chester', 'nita', 'clancy', 'bull', 'bibi', 'frank'],
  },
  {
    id: 'pinhole_punt',
    name: 'Pinhole Punt',
    mode: 'BRAWL_BALL',
    terrain: 'SEMI_OPEN',
    description: 'Walled goal mouth with open center and flank channels.',
    proNotes: 'When you have 1st pick, ban high-value 2/3 flex control brawlers like Stu, Lumi, or Leon.',
    bannedFirstPicksAggressive: ['crow', 'colette', 'otis', 'chester', 'nyx'],
    keyPicks: ['crow', 'otis', 'chester', 'kenji', 'frank', 'draco', 'max'],
  },

  // --- KNOCKOUT ---
  {
    id: 'belles_rock',
    name: 'Belle\'s Rock',
    mode: 'KNOCKOUT',
    terrain: 'WALLED',
    description: 'Central circular wall fortress with symmetrical side bushes.',
    proNotes: 'If enemy has 1st pick, ban Pierce, Gene, or Nyx. If enemy drafts low damage (e.g. Bo + Jay), draft Space Maker (Ollie) 5th pick to deny throwers.',
    bannedFirstPicksPassive: ['pierce', 'gene', 'nyx'],
    keyPicks: ['pierce', 'gene', 'rt', 'ollie', 'belle', 'byron', 'gus', 'leon'],
  },
  {
    id: 'goldarm_gulch',
    name: 'Goldarm Gulch',
    mode: 'KNOCKOUT',
    terrain: 'SEMI_OPEN',
    description: 'Tight central choke corridor opening into side flanking lanes.',
    proNotes: 'Darryl or Bull with Gus shield is the premier 6th pick punish against low DPS / sniper + thrower compositions.',
    bannedFirstPicksPassive: ['pierce', 'gene', 'nyx', 'rt'],
    keyPicks: ['rt', 'gus', 'pierce', 'darryl', 'bull', 'angelo', 'ollie', 'tick'],
  },

  // --- GEM GRAB ---
  {
    id: 'hard_rock_mine',
    name: 'Hard Rock Mine',
    mode: 'GEM_GRAB',
    terrain: 'SEMI_OPEN',
    description: 'Central mine surrounded by protective L-shaped walls and grass.',
    proNotes: 'If enemy first picks Ruffs, respond in 2/3 with a dominant Space Maker (Lily, Bull, Bibi) or top Anti-Tank.',
    bannedFirstPicksAggressive: ['crow', 'colette', 'otis', 'chester', 'nyx', 'sirius'],
    keyPicks: ['crow', 'chester', 'lily', 'kaze', 'shade', 'draco', 'gene'],
  },
  {
    id: 'double_swoosh',
    name: 'Double Swoosh',
    mode: 'GEM_GRAB',
    terrain: 'BUSHY',
    description: 'Twin sweeping grass lanes with chokepoint gem mine.',
    proNotes: 'When opponent has 1st pick, ban Crow, Colette, Otis, Chester, Nyx, or Sirius.',
    bannedFirstPicksAggressive: ['crow', 'colette', 'otis', 'chester', 'nyx', 'sirius'],
    keyPicks: ['crow', 'otis', 'chester', 'rosa', 'frank', 'draco', 'kenji'],
  },

  // --- HEIST ---
  {
    id: 'open_business_heist',
    name: 'Open Business',
    mode: 'HEIST',
    terrain: 'SEMI_OPEN',
    description: 'Open lanes with side wall clusters leading directly to opposing safes.',
    proNotes: 'If you have Chester & Nita and enemy has Bibi & Meeple, 5th pick Bull / Kaze / Kenji for unstoppable safe damage and space creation.',
    bannedFirstPicksAggressive: ['crow', 'colette', 'colt', 'pierce', 'chuck', 'melodie'],
    keyPicks: ['crow', 'colt', 'colette', 'bull', 'kaze', 'kenji', '8bit', 'nita', 'chuck'],
  },
  {
    id: 'hot_potato',
    name: 'Hot Potato',
    mode: 'HEIST',
    terrain: 'WALLED',
    description: 'Walled chokepoints shielding safes.',
    proNotes: 'Berry and Chuck dominate. Pair damage dealers with safe melters.',
    bannedFirstPicksAggressive: ['chuck', 'crow', 'colt', 'berry', 'colette'],
    keyPicks: ['berry', 'chuck', 'colt', 'crow', 'bull', 'colette', 'dynamike'],
  },
];

export const MAP_MAP: Record<string, BrawlMap> = MAPS.reduce((acc, m) => {
  acc[m.id] = m;
  return acc;
}, {} as Record<string, BrawlMap>);
