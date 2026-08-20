import { GameMode, MapTerrain } from './types';

export interface BrawlMap {
  id: string;
  name: string;
  mode: GameMode;
  terrain: MapTerrain;
  description: string;
  proNotes?: string;
  bannedFirstPicksAggressive?: string[]; // Recommended bans when opponent has first pick
  bannedFirstPicksPassive?: string[];
  keyPicks?: string[]; // S-tier picks on this specific map
}
