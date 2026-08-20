import { BrawlerArchetype, BobbyColorTag, GameMode } from './types';

export interface Brawler {
  id: string;
  name: string;
  archetype: BrawlerArchetype;
  colorTag: BobbyColorTag;
  avatarUrl?: string;
  subArchetype?: string;
  burstDamage: number; // 1 to 10 scale
  hasStunOrMute: boolean;
  hasKnockback: boolean;
  hasWallBreak: boolean;
  hasHypercharge: boolean;
  isSpecial: boolean;
  health: number;
  tier: 'S' | 'A' | 'B' | 'C' | 'D';
  isOvertuned?: boolean;
  modeScores: Record<GameMode, number>; // 0 to 100 base suitability in this mode
  counters: string[]; // List of archetypes or brawlers countered
  counteredBy: string[]; // List of archetypes or brawlers this is weak into
  synergies: string[]; // Synergistic archetype or brawlers
  description?: string;
  bobbyTip?: string;
}
