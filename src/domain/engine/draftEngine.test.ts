import { describe, it, expect } from 'vitest';
import { DraftEngine } from './draftEngine';
import { DRAFT_QUIZZES } from '../data/quizzes';
import { MAP_MAP } from '../data/maps';
import { DraftSession } from '../models/draftSession';

describe('DraftEngine - Bobby Pro Draft Masterclass Acceptance Tests', () => {
  // Test all 6 Ban Quiz scenarios
  describe('Ban Recommendations (Bobby Guide Part 2)', () => {
    const banQuizzes = DRAFT_QUIZZES.filter(q => q.type === 'BAN');

    banQuizzes.forEach(quiz => {
      it(`passes ${quiz.title}`, () => {
        const map = MAP_MAP[quiz.mapId];
        expect(map).toBeDefined();

        const session: DraftSession = {
          id: quiz.id,
          map,
          userSide: quiz.userSide,
          bans: quiz.bans,
          picks: {
            teamA: quiz.userSide === 'TEAM_A' ? quiz.allyPicks : quiz.enemyPicks,
            teamB: quiz.userSide === 'TEAM_B' ? quiz.allyPicks : quiz.enemyPicks,
          },
          currentSlot: 1,
          isComplete: false,
        };

        const banRecs = DraftEngine.recommendBans(session);
        const topBanIds = banRecs.slice(0, 6).map(r => r.brawler.id);

        // Verify that at least one of Bobby's correct ban targets is in top recommendations
        const hasCorrectBan = quiz.correctBrawlers.some(id => topBanIds.includes(id));
        expect(hasCorrectBan).toBe(true);
      });
    });
  });

  // Test all 10 Pick Quiz scenarios
  describe('Pick Recommendations (Bobby Guide Part 1)', () => {
    const pickQuizzes = DRAFT_QUIZZES.filter(q => q.type === 'PICK');

    pickQuizzes.forEach(quiz => {
      it(`passes ${quiz.title}`, () => {
        const map = MAP_MAP[quiz.mapId];
        expect(map).toBeDefined();

        const session: DraftSession = {
          id: quiz.id,
          map,
          userSide: quiz.userSide,
          bans: quiz.bans,
          picks: {
            teamA: quiz.userSide === 'TEAM_A' ? quiz.allyPicks : quiz.enemyPicks,
            teamB: quiz.userSide === 'TEAM_B' ? quiz.allyPicks : quiz.enemyPicks,
          },
          currentSlot: quiz.slot || 1,
          isComplete: false,
        };

        const pickRecs = DraftEngine.recommendPicks(session);
        const topPickIds = pickRecs.slice(0, 6).map(r => r.brawler.id);
        const topPickArchetypes = pickRecs.slice(0, 6).map(r => r.brawler.archetype);

        const matchesBrawler = quiz.correctBrawlers.some(id => topPickIds.includes(id));
        const matchesArchetype = quiz.correctArchetypes
          ? quiz.correctArchetypes.some(arch => topPickArchetypes.includes(arch))
          : false;

        expect(matchesBrawler || matchesArchetype).toBe(true);
      });
    });
  });

  // Test Direct Counter & Exploit Mode (Complete Enemy Information)
  describe('Direct Counter & Exploit Mode (Complete Enemy Info)', () => {
    it('exploits enemy Zero Anti-Tank + Zero Dive lineup (Nani, Eve, Bonnie on Hot Zone)', () => {
      const map = MAP_MAP['ring_of_fire'];
      const session: DraftSession = {
        id: 'exploit_test_hot_zone',
        map,
        userSide: 'TEAM_B',
        bans: { teamA: [], teamB: [] },
        picks: {
          teamA: ['nani', 'eve', 'bonnie'], // 3 enemy picks with 0 Anti-Tank and 0 Dive
          teamB: [],
        },
        currentSlot: 2,
        isComplete: false,
      };

      const deductions = DraftEngine.getDeductions(session);
      const deductionIds = deductions.map(d => d.id);

      // Verify exploit deductions are triggered
      expect(deductionIds).toContain('exploit_no_antitank');
      expect(deductionIds).toContain('exploit_no_spacemaker');

      // Verify generic baseline rules are suppressed
      expect(deductionIds).not.toContain('missing_antitank');
      expect(deductionIds).not.toContain('first_pick_antitank');

      const pickRecs = DraftEngine.recommendPicks(session);
      const topArchetypes = pickRecs.slice(0, 6).map(r => r.brawler.archetype);

      // Top picks should heavily feature Tanks, Space Makers, and Throwers
      const hasExploitArchetype = topArchetypes.some(
        arch => arch === 'TANK' || arch === 'SPACE_MAKER' || arch === 'THROWER'
      );
      expect(hasExploitArchetype).toBe(true);
    });
  });

  // Test Non-Exclusive / Allow Duplicates Mode
  describe('Non-Exclusive / Allow Duplicates Mode', () => {
    it('allows picking mirror/duplicate brawlers when allowDuplicates is true', () => {
      const map = MAP_MAP['ring_of_fire'];
      const session: DraftSession = {
        id: 'duplicates_test',
        map,
        userSide: 'TEAM_B',
        bans: { teamA: [], teamB: [] },
        picks: {
          teamA: ['crow', 'lou', 'clancy'],
          teamB: [],
        },
        currentSlot: 2,
        isComplete: false,
      };

      // Standard mode: crow, lou, clancy are unavailable
      const standardRecs = DraftEngine.recommendPicks(session, { allowDuplicates: false });
      const standardIds = standardRecs.map(r => r.brawler.id);
      expect(standardIds).not.toContain('crow');
      expect(standardIds).not.toContain('lou');
      expect(standardIds).not.toContain('clancy');

      // Duplicate mode: crow, lou, clancy CAN be picked as mirror picks
      const duplicateRecs = DraftEngine.recommendPicks(session, { allowDuplicates: true });
      const duplicateIds = duplicateRecs.map(r => r.brawler.id);
      expect(duplicateIds).toContain('crow');
      expect(duplicateIds).toContain('lou');
      expect(duplicateIds).toContain('clancy');
    });
  });
});

