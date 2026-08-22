import { Brawler } from './brawler';
import { BrawlerArchetype } from './types';

export interface CompositionVector {
  burstShred: number;       // 0 - 100: Ability to melt high-HP tanks and safes
  effectiveRange: number;   // 0 - 100: Threat radius and sightline control
  diveMobility: number;     // 0 - 100: Jump/dash mobility to bypass walls and reach backline
  indirectArtillery: number;// 0 - 100: Safe indirect damage over walls
  effectiveHP: number;      // 0 - 100: Frontline bulk, damage reduction, and sustain
  hardCC: number;           // 0 - 100: Stuns, knockbacks, freezes, silences
  wallBreak: number;        // 0 - 100: Ability to destroy terrain and cover
}

export interface StrategicWinCondition {
  id: 'LONG_RANGE_SIEGE' | 'HEAVY_TANK_OVERRUN' | 'DIVE_ASSASSINATION' | 'INDIRECT_WALL_ARTILLERY' | 'ANTI_TANK_LOCKDOWN' | 'BALANCED_CONTROL';
  title: string;
  strategyName: string;
  tacticalSummary: string;
  keyExecutors: string[];
  bulletPoints: string[];
}

export interface StrategicEnemyThreat {
  id: 'ENEMY_DIVE_BLITZ' | 'ENEMY_SNIPER_SIEGE' | 'ENEMY_TANK_STATCHECK' | 'ENEMY_WALL_ARTILLERY' | 'ENEMY_ZONE_LOCKDOWN' | 'ENEMY_BALANCED_THREAT';
  title: string;
  threatSummary: string;
  keyThreats: string[];
  counterTactics: string[];
}

export interface ExploitableEnemyFlaw {
  id: string;
  title: string;
  description: string;
  exploitRole: BrawlerArchetype;
}

export interface LaneMatchup {
  laneName: 'Mid Anchor' | 'Left Lane' | 'Right Lane';
  ally: Brawler;
  enemy: Brawler;
  advantage: 'ALLY_FAVORED' | 'ENEMY_FAVORED' | 'EVEN';
  tip: string;
}

export interface PriorityPinchTarget {
  target: Brawler;
  reason: string;
  pinchInstructions: string;
}

export interface MacroPlaybook {
  priorityPinchTarget: PriorityPinchTarget | null;
  laneSwitchingRules: string[];
  cooldownTracking: string[];
  teamMovementRule: string;
}

export interface MatchupDelta {
  allyVector: CompositionVector;
  enemyVector: CompositionVector;
  allyStrengths: string[];
  allyVulnerabilities: string[];
  enemyStrengths: string[];
  enemyVulnerabilities: string[];
  primaryAllyWinCondition: StrategicWinCondition;
  primaryEnemyThreat: StrategicEnemyThreat;
  exploitableEnemyFlaws: ExploitableEnemyFlaw[];
  laneMatchups: LaneMatchup[];
  macroPlaybook: MacroPlaybook;
}
