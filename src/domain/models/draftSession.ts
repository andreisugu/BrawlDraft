import { BrawlMap } from './map';
import { DraftSide, PickSlot } from './types';

export interface DraftSession {
  id: string;
  map: BrawlMap;
  userSide: DraftSide; // What side the user is playing ('TEAM_A' = 1st pick, 'TEAM_B' = 2nd/last pick)
  bans: {
    teamA: string[]; // Brawler IDs banned by Team A
    teamB: string[]; // Brawler IDs banned by Team B
  };
  picks: {
    teamA: string[]; // Brawler IDs picked by Team A (picks 1, 4, 5)
    teamB: string[]; // Brawler IDs picked by Team B (picks 2, 3, 6)
  };
  currentSlot: PickSlot; // 1 to 6
  isComplete: boolean;
}

export function getPickTeamForSlot(slot: PickSlot): DraftSide {
  switch (slot) {
    case 1:
      return 'TEAM_A';
    case 2:
    case 3:
      return 'TEAM_B';
    case 4:
    case 5:
      return 'TEAM_A';
    case 6:
      return 'TEAM_B';
  }
}

export function getAllBannedBrawlers(session: DraftSession): string[] {
  return [...session.bans.teamA, ...session.bans.teamB];
}

export function getAllPickedBrawlers(session: DraftSession): string[] {
  return [...session.picks.teamA, ...session.picks.teamB];
}

export function isBrawlerDraftedOrBanned(session: DraftSession, brawlerId: string): boolean {
  return (
    session.bans.teamA.includes(brawlerId) ||
    session.bans.teamB.includes(brawlerId) ||
    session.picks.teamA.includes(brawlerId) ||
    session.picks.teamB.includes(brawlerId)
  );
}
