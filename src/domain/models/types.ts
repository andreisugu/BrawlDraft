export type GameMode = 
  | 'BRAWL_BALL'
  | 'HOT_ZONE'
  | 'GEM_GRAB'
  | 'HEIST'
  | 'BOUNTY'
  | 'KNOCKOUT';

export type MacroMeta = 'AGGRO' | 'PASSIVE';

export function getMacroMeta(mode: GameMode): MacroMeta {
  if (mode === 'BOUNTY' || mode === 'KNOCKOUT') {
    return 'PASSIVE';
  }
  return 'AGGRO';
}

export type BrawlerArchetype =
  | 'ANTI_TANK'
  | 'SPACE_MAKER'
  | 'TANK'
  | 'CONTROL'
  | 'SNIPER'
  | 'THROWER'
  | 'SUPPORT';

export type BobbyColorTag =
  | 'YELLOW' // Good Hypercharge / Buffy
  | 'RED' // Knockback / Stun / Mute
  | 'GREEN' // Wall Break
  | 'BLUE_PIERCE' // Pierce Damage
  | 'CYAN_SPECIAL' // Special in draft / mechanics
  | 'WHITE_STANDARD'; // Standard

export type MapTerrain =
  | 'OPEN'
  | 'SEMI_OPEN'
  | 'WALLED'
  | 'BUSHY'
  | 'SPLIT_LANE';

export type PickSlot = 1 | 2 | 3 | 4 | 5 | 6;

export type DraftSide = 'TEAM_A' | 'TEAM_B'; // Team A = First Pick (1, 4, 5), Team B = Second Pick / Last Pick (2, 3, 6)
