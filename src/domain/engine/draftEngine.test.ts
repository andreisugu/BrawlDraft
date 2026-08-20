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
});
