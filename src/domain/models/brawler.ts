import { BrawlerArchetype, BrawlerTrait, GameMode } from './types';

export interface Brawler {
  id: string;
  name: string;
  archetype: BrawlerArchetype;
  subArchetype?: string;
  burstDamage: number; // 1 to 10 scale (Chester/Colette/Clancy: 9-10; Angelo: 4; Stu: 5)
  hasStunOrMute: boolean;
  hasKnockback: boolean;
  hasCrowdControl: boolean;
  hasHypercharge: boolean;
  health: number; // e.g. 4800 (low), 6400 (mid), 9000+ (tank), 11000+ (Frank/Draco)
  traits: BrawlerTrait[];
  tier: 'S' | 'A' | 'B' | 'C' | 'D';
  isOvertuned?: boolean;
  modeScores: Record<GameMode, number>; // 0 to 100 base suitability in this mode
  counters: string[]; // List of archetypes or specific brawlers countered
  counteredBy: string[]; // List of archetypes or specific brawlers this is weak into
  synergies: string[]; // Synergistic archetype or brawlers
  description: string;
  bobbyTip?: string;
}
