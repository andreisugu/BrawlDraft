import React from 'react';
import { DraftSession, getPickTeamForSlot } from '../../domain/models/draftSession';
import { BRAWLER_MAP } from '../../domain/data/brawlers';
import { BrawlerAvatar } from '../common/BrawlerAvatar';
import { DraftEngine } from '../../domain/engine/draftEngine';
import { ShieldAlert, Zap, Heart, Crosshair, Ban, CheckCircle2 } from 'lucide-react';

interface Props {
  session: DraftSession;
  onSlotClick?: (slot: number) => void;
  onBanClick?: (side: 'teamA' | 'teamB', index: number) => void;
}

export const DraftBoard: React.FC<Props> = ({ session }) => {
  const teamABrawlers = session.picks.teamA.map(id => BRAWLER_MAP[id]).filter(Boolean);
  const teamBBrawlers = session.picks.teamB.map(id => BRAWLER_MAP[id]).filter(Boolean);

  const teamAAnalysis = DraftEngine.evaluateComp(teamABrawlers);
  const teamBAnalysis = DraftEngine.evaluateComp(teamBBrawlers);

  const currentPickingSide = getPickTeamForSlot(session.currentSlot);

  // Map slots to draft positions
  // Team A (First Pick): Pick 1 = Slot 1; Pick 2 = Slot 4; Pick 3 = Slot 5
  // Team B (Second/Last): Pick 1 = Slot 2; Pick 2 = Slot 3; Pick 3 = Slot 6
  const teamASlots = [
    { slotNumber: 1, label: '1st Pick', brawlerId: session.picks.teamA[0] },
    { slotNumber: 4, label: '4th Pick', brawlerId: session.picks.teamA[1] },
    { slotNumber: 5, label: '5th Pick', brawlerId: session.picks.teamA[2] },
  ];

  const teamBSlots = [
    { slotNumber: 2, label: '2nd Pick', brawlerId: session.picks.teamB[0] },
    { slotNumber: 3, label: '3rd Pick', brawlerId: session.picks.teamB[1] },
    { slotNumber: 6, label: '6th Pick (Last)', brawlerId: session.picks.teamB[2] },
  ];

  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-md">
      {/* Draft Turn Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full animate-ping ${
              currentPickingSide === 'TEAM_A' ? 'bg-blue-400' : 'bg-red-400'
            }`}
          />
          <span className="text-sm uppercase font-black tracking-wider text-gray-400">
            CURRENT TURN:{' '}
            <span
              className={`font-brawl text-lg tracking-wide ${
                currentPickingSide === 'TEAM_A' ? 'text-blue-400' : 'text-red-400'
              }`}
            >
              {session.isComplete
                ? 'DRAFT COMPLETE'
                : currentPickingSide === 'TEAM_A'
                ? 'TEAM A (FIRST PICK)'
                : 'TEAM B (SECOND PICK)'}
            </span>
          </span>
        </div>

        {/* Turn Step Chips */}
        <div className="flex items-center gap-1.5 text-xs font-bold">
          {[1, 2, 3, 4, 5, 6].map(slot => {
            const isDone = session.currentSlot > slot || session.isComplete;
            const isCurrent = session.currentSlot === slot && !session.isComplete;
            const side = getPickTeamForSlot(slot as any);

            return (
              <div
                key={slot}
                className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 ${
                  isCurrent
                    ? side === 'TEAM_A'
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400/50 scale-110 shadow-lg'
                      : 'bg-red-600 text-white ring-2 ring-red-400/50 scale-110 shadow-lg'
                    : isDone
                    ? 'bg-gray-800 text-gray-400'
                    : 'bg-gray-950/60 text-gray-600 border border-gray-800'
                }`}
              >
                <span>Pick {slot}</span>
                {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Board Grid: Team A vs Team B */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
        {/* TEAM A (Blue Side - First Pick) */}
        <div className="bg-gradient-to-br from-blue-950/40 via-gray-900/50 to-gray-900 border border-blue-500/30 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 shadow-md shadow-blue-500/50" />
              <h3 className="font-brawl text-xl tracking-wider text-blue-400">TEAM A (1ST PICK)</h3>
              {session.userSide === 'TEAM_A' && (
                <span className="text-[10px] bg-blue-500/20 text-blue-300 font-black px-2 py-0.5 rounded border border-blue-500/40">
                  YOU
                </span>
              )}
            </div>

            {/* Team A Bans */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
                <Ban className="w-3 h-3 text-red-400" /> Bans:
              </span>
              {[0, 1, 2].map(idx => {
                const brawlerId = session.bans.teamA[idx];
                const brawler = brawlerId ? BRAWLER_MAP[brawlerId] : undefined;
                return (
                  <div key={idx} className="relative">
                    <BrawlerAvatar brawler={brawler} size="sm" showArchetype={false} />
                    {brawler && (
                      <div className="absolute inset-0 bg-red-950/60 flex items-center justify-center rounded-xl pointer-events-none">
                        <Ban className="w-4 h-4 text-red-500" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Picks row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {teamASlots.map(slotInfo => {
              const brawler = slotInfo.brawlerId ? BRAWLER_MAP[slotInfo.brawlerId] : undefined;
              const isCurrentTurn = session.currentSlot === slotInfo.slotNumber && !session.isComplete;

              return (
                <div
                  key={slotInfo.slotNumber}
                  className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                    isCurrentTurn
                      ? 'bg-blue-900/30 border-blue-400 ring-2 ring-blue-500/40 scale-105 shadow-xl shadow-blue-500/10 animate-pulse'
                      : brawler
                      ? 'bg-gray-800/60 border-gray-700'
                      : 'bg-gray-950/50 border-gray-800 border-dashed'
                  }`}
                >
                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">
                    {slotInfo.label}
                  </span>
                  <BrawlerAvatar brawler={brawler} size="lg" showTraits={true} />
                  <span className="text-xs font-bold text-gray-200 mt-2 truncate max-w-full">
                    {brawler ? brawler.name : 'Waiting...'}
                  </span>
                  {brawler && (
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">
                      {brawler.archetype.replace('_', ' ')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Team A Comp Analytics */}
          <div className="bg-gray-950/60 rounded-xl p-3 border border-gray-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-400">
              <span className="flex items-center gap-1.5 text-blue-300">
                <Zap className="w-3.5 h-3.5 text-yellow-400" /> Burst DPS: {teamAAnalysis.burstRating}%
              </span>
              <span className="flex items-center gap-1.5 text-blue-300">
                <Heart className="w-3.5 h-3.5 text-rose-400" /> Effective HP: {teamAAnalysis.effectiveHpRating}%
              </span>
              <span className="flex items-center gap-1.5 text-blue-300">
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" /> Range: {teamAAnalysis.rangeRating}%
              </span>
            </div>

            {/* Warnings */}
            {teamAAnalysis.vulnerabilities.map((vuln, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded-lg"
              >
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>{vuln}</span>
              </div>
            ))}
          </div>
        </div>

        {/* TEAM B (Red Side - Second/Last Pick) */}
        <div className="bg-gradient-to-br from-red-950/40 via-gray-900/50 to-gray-900 border border-red-500/30 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 shadow-md shadow-red-500/50" />
              <h3 className="font-brawl text-xl tracking-wider text-red-400">TEAM B (LAST PICK)</h3>
              {session.userSide === 'TEAM_B' && (
                <span className="text-[10px] bg-red-500/20 text-red-300 font-black px-2 py-0.5 rounded border border-red-500/40">
                  YOU
                </span>
              )}
            </div>

            {/* Team B Bans */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
                <Ban className="w-3 h-3 text-red-400" /> Bans:
              </span>
              {[0, 1, 2].map(idx => {
                const brawlerId = session.bans.teamB[idx];
                const brawler = brawlerId ? BRAWLER_MAP[brawlerId] : undefined;
                return (
                  <div key={idx} className="relative">
                    <BrawlerAvatar brawler={brawler} size="sm" showArchetype={false} />
                    {brawler && (
                      <div className="absolute inset-0 bg-red-950/60 flex items-center justify-center rounded-xl pointer-events-none">
                        <Ban className="w-4 h-4 text-red-500" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Picks row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {teamBSlots.map(slotInfo => {
              const brawler = slotInfo.brawlerId ? BRAWLER_MAP[slotInfo.brawlerId] : undefined;
              const isCurrentTurn = session.currentSlot === slotInfo.slotNumber && !session.isComplete;

              return (
                <div
                  key={slotInfo.slotNumber}
                  className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                    isCurrentTurn
                      ? 'bg-red-900/30 border-red-400 ring-2 ring-red-500/40 scale-105 shadow-xl shadow-red-500/10 animate-pulse'
                      : brawler
                      ? 'bg-gray-800/60 border-gray-700'
                      : 'bg-gray-950/50 border-gray-800 border-dashed'
                  }`}
                >
                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">
                    {slotInfo.label}
                  </span>
                  <BrawlerAvatar brawler={brawler} size="lg" showTraits={true} />
                  <span className="text-xs font-bold text-gray-200 mt-2 truncate max-w-full">
                    {brawler ? brawler.name : 'Waiting...'}
                  </span>
                  {brawler && (
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">
                      {brawler.archetype.replace('_', ' ')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Team B Comp Analytics */}
          <div className="bg-gray-950/60 rounded-xl p-3 border border-gray-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-400">
              <span className="flex items-center gap-1.5 text-red-300">
                <Zap className="w-3.5 h-3.5 text-yellow-400" /> Burst DPS: {teamBAnalysis.burstRating}%
              </span>
              <span className="flex items-center gap-1.5 text-red-300">
                <Heart className="w-3.5 h-3.5 text-rose-400" /> Effective HP: {teamBAnalysis.effectiveHpRating}%
              </span>
              <span className="flex items-center gap-1.5 text-red-300">
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" /> Range: {teamBAnalysis.rangeRating}%
              </span>
            </div>

            {/* Warnings */}
            {teamBAnalysis.vulnerabilities.map((vuln, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded-lg"
              >
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>{vuln}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
