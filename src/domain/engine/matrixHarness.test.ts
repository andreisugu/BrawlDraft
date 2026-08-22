import { describe, it, expect } from 'vitest';
import { VectorEngine } from './vectorEngine';
import { BRAWLERS, BRAWLER_MAP } from '../data/brawlers';
import { MAPS } from '../data/maps';

describe('Universal VectorEngine & Matchup Matrix Test Harness', () => {
  describe('Vector Calculation Accuracy', () => {
    it('computes 0 vector for empty team', () => {
      const v = VectorEngine.computeVector([], MAPS[0]);
      expect(v.burstShred).toBe(0);
      expect(v.effectiveRange).toBe(0);
      expect(v.diveMobility).toBe(0);
      expect(v.indirectArtillery).toBe(0);
      expect(v.effectiveHP).toBe(0);
      expect(v.hardCC).toBe(0);
    });

    it('identifies Triple Sniper poke profile (Gene, Byron, Belle)', () => {
      const team = [BRAWLER_MAP['gene'], BRAWLER_MAP['byron'], BRAWLER_MAP['belle']];
      const v = VectorEngine.computeVector(team, MAPS[0]);
      expect(v.effectiveRange).toBeGreaterThanOrEqual(75);
      expect(v.diveMobility).toBeLessThan(35);
      expect(v.indirectArtillery).toBe(0);
    });

    it('identifies Heavy Tank bulk profile (Draco, Frank, Buster)', () => {
      const team = [BRAWLER_MAP['draco'], BRAWLER_MAP['frank'], BRAWLER_MAP['buster']];
      const v = VectorEngine.computeVector(team, MAPS[0]);
      expect(v.effectiveHP).toBeGreaterThanOrEqual(70);
      expect(v.burstShred).toBeGreaterThanOrEqual(40);
    });

    it('identifies Thrower Artillery profile (Berry, Dynamike, Larry)', () => {
      const team = [BRAWLER_MAP['berry'], BRAWLER_MAP['dynamike'], BRAWLER_MAP['larry_lawrie']];
      const v = VectorEngine.computeVector(team, MAPS[0]);
      expect(v.indirectArtillery).toBeGreaterThanOrEqual(80);
      expect(v.diveMobility).toBeLessThan(30);
    });
  });

  describe('Deterministic Win Conditions & Threat Assessments', () => {
    it('generates Long-Range Siege win condition for Gene + Byron + Belle vs Eve + Bonnie + Nani', () => {
      const ally = [BRAWLER_MAP['gene'], BRAWLER_MAP['byron'], BRAWLER_MAP['belle']];
      const enemy = [BRAWLER_MAP['eve'], BRAWLER_MAP['bonnie'], BRAWLER_MAP['nani']];
      const shootingStar = MAPS.find(m => m.id === 'shooting_star') || MAPS[0];

      const delta = VectorEngine.computeDelta(ally, enemy, shootingStar);

      expect(delta.primaryAllyWinCondition.id).toBe('LONG_RANGE_SIEGE');
      expect(delta.primaryAllyWinCondition.title).toContain('Long-Range');
      expect(delta.primaryEnemyThreat.id).toBe('ENEMY_SNIPER_SIEGE');
      expect(delta.macroPlaybook.priorityPinchTarget?.target.id).toBe('nani');
      expect(delta.laneMatchups.length).toBe(3);
    });

    it('generates Heavy Tank Overrun win condition vs Zero Anti-Tank comp', () => {
      const ally = [BRAWLER_MAP['draco'], BRAWLER_MAP['frank'], BRAWLER_MAP['poco']];
      const enemy = [BRAWLER_MAP['nani'], BRAWLER_MAP['eve'], BRAWLER_MAP['bonnie']];
      const hotZone = MAPS.find(m => m.mode === 'HOT_ZONE') || MAPS[0];

      const delta = VectorEngine.computeDelta(ally, enemy, hotZone);

      expect(delta.primaryAllyWinCondition.id).toBe('HEAVY_TANK_OVERRUN');
      expect(delta.exploitableEnemyFlaws.some(f => f.id === 'EXPLOIT_NO_ANTITANK')).toBe(true);
      expect(delta.exploitableEnemyFlaws.some(f => f.id === 'EXPLOIT_NO_DIVE')).toBe(true);
    });

    it('generates Indirect Wall Artillery win condition on walled map', () => {
      const ally = [BRAWLER_MAP['berry'], BRAWLER_MAP['gale'], BRAWLER_MAP['gene']];
      const enemy = [BRAWLER_MAP['colette'], BRAWLER_MAP['chester'], BRAWLER_MAP['otis']];
      const walledMap = MAPS.find(m => m.terrain === 'WALLED') || MAPS[0];

      const delta = VectorEngine.computeDelta(ally, enemy, walledMap);

      expect(delta.primaryAllyWinCondition.id).toBe('INDIRECT_WALL_ARTILLERY');
    });

    it('generates Dive Assassination win condition for aggressive assassin comp', () => {
      const ally = [BRAWLER_MAP['kenji'], BRAWLER_MAP['kaze'], BRAWLER_MAP['nori']];
      const enemy = [BRAWLER_MAP['dynamike'], BRAWLER_MAP['sprout'], BRAWLER_MAP['tick']];
      const semiOpen = MAPS.find(m => m.terrain === 'SEMI_OPEN') || MAPS[0];

      const delta = VectorEngine.computeDelta(ally, enemy, semiOpen);

      expect(delta.primaryAllyWinCondition.id).toBe('DIVE_ASSASSINATION');
      expect(delta.primaryEnemyThreat.id).toBe('ENEMY_WALL_ARTILLERY');
    });
  });

  describe('Exhaustive Property-Based Matrix Simulation (500+ Draft Combinations)', () => {
    it('executes 500 randomized 3v3 draft compositions across all modes without runtime flaws', () => {
      const totalCombinations = 500;
      const brawlerCount = BRAWLERS.length;

      for (let i = 0; i < totalCombinations; i++) {
        const map = MAPS[i % MAPS.length];

        // Pick 3 random distinct ally brawlers
        const allyIndices = new Set<number>();
        while (allyIndices.size < 3) {
          allyIndices.add(Math.floor(Math.random() * brawlerCount));
        }
        const ally = Array.from(allyIndices).map(idx => BRAWLERS[idx]);

        // Pick 3 random distinct enemy brawlers
        const enemyIndices = new Set<number>();
        while (enemyIndices.size < 3) {
          enemyIndices.add(Math.floor(Math.random() * brawlerCount));
        }
        const enemy = Array.from(enemyIndices).map(idx => BRAWLERS[idx]);

        const delta = VectorEngine.computeDelta(ally, enemy, map);

        // Invariants that MUST hold true for every possible 3v3 matchup:
        expect(delta.allyVector.burstShred).toBeGreaterThanOrEqual(0);
        expect(delta.allyVector.burstShred).toBeLessThanOrEqual(100);
        expect(delta.enemyVector.effectiveHP).toBeGreaterThanOrEqual(0);
        expect(delta.enemyVector.effectiveHP).toBeLessThanOrEqual(100);

        expect(delta.primaryAllyWinCondition.title).toBeTruthy();
        expect(delta.primaryAllyWinCondition.tacticalSummary).toBeTruthy();
        expect(delta.primaryAllyWinCondition.bulletPoints.length).toBeGreaterThanOrEqual(2);

        expect(delta.primaryEnemyThreat.title).toBeTruthy();
        expect(delta.primaryEnemyThreat.threatSummary).toBeTruthy();
        expect(delta.primaryEnemyThreat.counterTactics.length).toBeGreaterThanOrEqual(2);

        expect(delta.laneMatchups.length).toBe(3);
        const assignedAllyIds = delta.laneMatchups.map(l => l.ally.id);
        const assignedEnemyIds = delta.laneMatchups.map(l => l.enemy.id);
        expect(new Set(assignedAllyIds).size).toBe(3);
        expect(new Set(assignedEnemyIds).size).toBe(3);

        expect(delta.macroPlaybook.priorityPinchTarget).not.toBeNull();
        expect(delta.macroPlaybook.teamMovementRule).toBeTruthy();
      }
    });
  });
});
