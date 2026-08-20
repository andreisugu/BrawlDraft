import React from 'react';
import { DraftSession, getPickTeamForSlot } from '../../domain/models/draftSession';
import { BRAWLER_MAP } from '../../domain/data/brawlers';
import { BrawlerAvatar } from '../common/BrawlerAvatar';
import { DraftEngine } from '../../domain/engine/draftEngine';
import { ShieldAlert, Zap, Heart, Crosshair, Ban, CheckCircle2, X } from 'lucide-react';

interface Props {
  session: DraftSession;
  selectedTargetSlot: { type: 'PICK' | 'BAN'; side: 'teamA' | 'teamB'; index: number } | null;
  onSlotSelect: (target: { type: 'PICK' | 'BAN'; side: 'teamA' | 'teamB'; index: number }) => void;
  onClearSlot: (target: { type: 'PICK' | 'BAN'; side: 'teamA' | 'teamB'; index: number }) => void;
}

export const DraftBoard: React.FC<Props> = ({
  session,
  selectedTargetSlot,
  onSlotSelect,
  onClearSlot,
}) => {
  const teamABrawlers = session.picks.teamA.map(id => BRAWLER_MAP[id]).filter(Boolean);
  const teamBBrawlers = session.picks.teamB.map(id => BRAWLER_MAP[id]).filter(Boolean);

  const teamAAnalysis = DraftEngine.evaluateComp(teamABrawlers);
  const teamBAnalysis = DraftEngine.evaluateComp(teamBBrawlers);

  const currentPickingSide = getPickTeamForSlot(session.currentSlot);
  const isCurrentAlly = currentPickingSide === session.userSide;
  const isTeamAAlly = session.userSide === 'TEAM_A';

  // Map slots to draft positions
  const teamASlots = [
    { slotNumber: 1, label: '1st Pick', brawlerId: session.picks.teamA[0], index: 0 },
    { slotNumber: 4, label: '4th Pick', brawlerId: session.picks.teamA[1], index: 1 },
    { slotNumber: 5, label: '5th Pick', brawlerId: session.picks.teamA[2], index: 2 },
  ];

  const teamBSlots = [
    { slotNumber: 2, label: '2nd Pick', brawlerId: session.picks.teamB[0], index: 0 },
    { slotNumber: 3, label: '3rd Pick', brawlerId: session.picks.teamB[1], index: 1 },
    { slotNumber: 6, label: '6th Pick (Last)', brawlerId: session.picks.teamB[2], index: 2 },
  ];

  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-md">
      {/* Draft Turn Banner & Turn Indicator */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full animate-ping ${
              isCurrentAlly ? 'bg-blue-400' : 'bg-red-400'
            }`}
          />
          <div>
            <span className="text-sm uppercase font-black tracking-wider text-gray-400">
              CURRENT TURN:{' '}
              <span
                className={`font-brawl text-lg tracking-wide ${
                  session.isComplete
                    ? 'text-emerald-400'
                    : isCurrentAlly
                    ? 'text-blue-400'
                    : 'text-red-400'
                }`}
              >
                {session.isComplete
                  ? 'DRAFT COMPLETE'
                  : isCurrentAlly
                  ? `YOUR TEAM (PICK ${session.currentSlot})`
                  : `ENEMY TEAM (PICK ${session.currentSlot})`}
              </span>
            </span>
            <p className="text-[11px] text-gray-500">
              💡 Tip: Click any pick or ban slot to freely assign, change, or clear brawlers.
            </p>
          </div>
        </div>

        {/* Turn Step Chips (Pick 1 to 6 Dynamic Ally/Enemy Colors) */}
        <div className="flex items-center gap-1.5 text-xs font-bold">
          {[1, 2, 3, 4, 5, 6].map(slot => {
            const isDone = session.currentSlot > slot || session.isComplete;
            const isCurrent = session.currentSlot === slot && !session.isComplete;
            const pickingTeam = getPickTeamForSlot(slot as any);
            const isAlly = pickingTeam === session.userSide;

            return (
              <div
                key={slot}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 border ${
                  isCurrent
                    ? isAlly
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400 border-blue-400 scale-110 shadow-lg shadow-blue-500/40 font-black'
                      : 'bg-red-600 text-white ring-2 ring-red-400 border-red-400 scale-110 shadow-lg shadow-red-500/40 font-black'
                    : isDone
                    ? isAlly
                      ? 'bg-blue-950/40 text-blue-300 border-blue-500/40'
                      : 'bg-red-950/40 text-red-300 border-red-500/40'
                    : isAlly
                    ? 'bg-blue-950/20 text-blue-400/80 border-blue-500/20'
                    : 'bg-red-950/20 text-red-400/80 border-red-500/20'
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
        {/* TEAM A (1st Pick Team) */}
        <div
          className={`bg-gradient-to-br ${
            isTeamAAlly
              ? 'from-blue-950/40 via-gray-900/50 to-gray-900 border-blue-500/40'
              : 'from-red-950/40 via-gray-900/50 to-gray-900 border-red-500/40'
          } border rounded-2xl p-4 sm:p-5 relative overflow-hidden`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full shadow-md ${
                  isTeamAAlly ? 'bg-blue-500 shadow-blue-500/50' : 'bg-red-500 shadow-red-500/50'
                }`}
              />
              <h3
                className={`font-brawl text-xl tracking-wider ${
                  isTeamAAlly ? 'text-blue-400' : 'text-red-400'
                }`}
              >
                {isTeamAAlly ? 'YOUR TEAM (1ST PICK)' : 'ENEMY TEAM (1ST PICK)'}
              </h3>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                  isTeamAAlly
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    : 'bg-red-500/20 text-red-300 border-red-500/40'
                }`}
              >
                {isTeamAAlly ? 'YOU' : 'OPPONENT'}
              </span>
            </div>

            {/* Team A Bans */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
                <Ban className="w-3 h-3 text-red-400" /> Bans:
              </span>
              {[0, 1, 2].map(idx => {
                const brawlerId = session.bans.teamA[idx];
                const brawler = brawlerId ? BRAWLER_MAP[brawlerId] : undefined;
                const isSelected =
                  selectedTargetSlot?.type === 'BAN' &&
                  selectedTargetSlot?.side === 'teamA' &&
                  selectedTargetSlot?.index === idx;

                return (
                  <div key={idx} className="relative group">
                    <BrawlerAvatar
                      brawler={brawler}
                      size="sm"
                      showArchetype={false}
                      selected={isSelected}
                      onClick={() => onSlotSelect({ type: 'BAN', side: 'teamA', index: idx })}
                    />
                    {brawler && (
                      <>
                        <div className="absolute inset-0 bg-red-950/60 flex items-center justify-center rounded-xl pointer-events-none">
                          <Ban className="w-4 h-4 text-red-500" />
                        </div>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onClearSlot({ type: 'BAN', side: 'teamA', index: idx });
                          }}
                          className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
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
              const isSelected =
                selectedTargetSlot?.type === 'PICK' &&
                selectedTargetSlot?.side === 'teamA' &&
                selectedTargetSlot?.index === slotInfo.index;

              return (
                <div
                  key={slotInfo.slotNumber}
                  onClick={() =>
                    onSlotSelect({ type: 'PICK', side: 'teamA', index: slotInfo.index })
                  }
                  className={`flex flex-col items-center p-3 rounded-xl border transition-all cursor-pointer relative group ${
                    isSelected
                      ? isTeamAAlly
                        ? 'bg-blue-900/40 border-yellow-400 ring-2 ring-yellow-400/50 scale-105 shadow-xl'
                        : 'bg-red-900/40 border-yellow-400 ring-2 ring-yellow-400/50 scale-105 shadow-xl'
                      : brawler
                      ? 'bg-gray-800/60 border-gray-700 hover:border-gray-500'
                      : isTeamAAlly
                      ? 'bg-gray-950/50 border-gray-800 border-dashed hover:border-blue-400/60'
                      : 'bg-gray-950/50 border-gray-800 border-dashed hover:border-red-400/60'
                  }`}
                >
                  {brawler && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onClearSlot({ type: 'PICK', side: 'teamA', index: slotInfo.index });
                      }}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}

                  <span
                    className={`text-[11px] font-black uppercase tracking-wider mb-2 ${
                      isTeamAAlly ? 'text-blue-300' : 'text-red-300'
                    }`}
                  >
                    {slotInfo.label}
                  </span>
                  <BrawlerAvatar brawler={brawler} size="lg" selected={isSelected} />
                  <span className="text-xs font-bold text-gray-200 mt-2 truncate max-w-full">
                    {brawler ? brawler.name : 'Click to Pick'}
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
              <span className={`flex items-center gap-1.5 ${isTeamAAlly ? 'text-blue-300' : 'text-red-300'}`}>
                <Zap className="w-3.5 h-3.5 text-yellow-400" /> Burst DPS: {teamAAnalysis.burstRating}%
              </span>
              <span className={`flex items-center gap-1.5 ${isTeamAAlly ? 'text-blue-300' : 'text-red-300'}`}>
                <Heart className="w-3.5 h-3.5 text-rose-400" /> Effective HP: {teamAAnalysis.effectiveHpRating}%
              </span>
              <span className={`flex items-center gap-1.5 ${isTeamAAlly ? 'text-blue-300' : 'text-red-300'}`}>
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

        {/* TEAM B (2nd/Last Pick Team) */}
        <div
          className={`bg-gradient-to-br ${
            !isTeamAAlly
              ? 'from-blue-950/40 via-gray-900/50 to-gray-900 border-blue-500/40'
              : 'from-red-950/40 via-gray-900/50 to-gray-900 border-red-500/40'
          } border rounded-2xl p-4 sm:p-5 relative overflow-hidden`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full shadow-md ${
                  !isTeamAAlly ? 'bg-blue-500 shadow-blue-500/50' : 'bg-red-500 shadow-red-500/50'
                }`}
              />
              <h3
                className={`font-brawl text-xl tracking-wider ${
                  !isTeamAAlly ? 'text-blue-400' : 'text-red-400'
                }`}
              >
                {!isTeamAAlly ? 'YOUR TEAM (LAST PICK)' : 'ENEMY TEAM (LAST PICK)'}
              </h3>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                  !isTeamAAlly
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    : 'bg-red-500/20 text-red-300 border-red-500/40'
                }`}
              >
                {!isTeamAAlly ? 'YOU' : 'OPPONENT'}
              </span>
            </div>

            {/* Team B Bans */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
                <Ban className="w-3 h-3 text-red-400" /> Bans:
              </span>
              {[0, 1, 2].map(idx => {
                const brawlerId = session.bans.teamB[idx];
                const brawler = brawlerId ? BRAWLER_MAP[brawlerId] : undefined;
                const isSelected =
                  selectedTargetSlot?.type === 'BAN' &&
                  selectedTargetSlot?.side === 'teamB' &&
                  selectedTargetSlot?.index === idx;

                return (
                  <div key={idx} className="relative group">
                    <BrawlerAvatar
                      brawler={brawler}
                      size="sm"
                      showArchetype={false}
                      selected={isSelected}
                      onClick={() => onSlotSelect({ type: 'BAN', side: 'teamB', index: idx })}
                    />
                    {brawler && (
                      <>
                        <div className="absolute inset-0 bg-red-950/60 flex items-center justify-center rounded-xl pointer-events-none">
                          <Ban className="w-4 h-4 text-red-500" />
                        </div>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onClearSlot({ type: 'BAN', side: 'teamB', index: idx });
                          }}
                          className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
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
              const isSelected =
                selectedTargetSlot?.type === 'PICK' &&
                selectedTargetSlot?.side === 'teamB' &&
                selectedTargetSlot?.index === slotInfo.index;

              return (
                <div
                  key={slotInfo.slotNumber}
                  onClick={() =>
                    onSlotSelect({ type: 'PICK', side: 'teamB', index: slotInfo.index })
                  }
                  className={`flex flex-col items-center p-3 rounded-xl border transition-all cursor-pointer relative group ${
                    isSelected
                      ? !isTeamAAlly
                        ? 'bg-blue-900/40 border-yellow-400 ring-2 ring-yellow-400/50 scale-105 shadow-xl'
                        : 'bg-red-900/40 border-yellow-400 ring-2 ring-yellow-400/50 scale-105 shadow-xl'
                      : brawler
                      ? 'bg-gray-800/60 border-gray-700 hover:border-gray-500'
                      : !isTeamAAlly
                      ? 'bg-gray-950/50 border-gray-800 border-dashed hover:border-blue-400/60'
                      : 'bg-gray-950/50 border-gray-800 border-dashed hover:border-red-400/60'
                  }`}
                >
                  {brawler && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onClearSlot({ type: 'PICK', side: 'teamB', index: slotInfo.index });
                      }}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}

                  <span
                    className={`text-[11px] font-black uppercase tracking-wider mb-2 ${
                      !isTeamAAlly ? 'text-blue-300' : 'text-red-300'
                    }`}
                  >
                    {slotInfo.label}
                  </span>
                  <BrawlerAvatar brawler={brawler} size="lg" selected={isSelected} />
                  <span className="text-xs font-bold text-gray-200 mt-2 truncate max-w-full">
                    {brawler ? brawler.name : 'Click to Pick'}
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
              <span className={`flex items-center gap-1.5 ${!isTeamAAlly ? 'text-blue-300' : 'text-red-300'}`}>
                <Zap className="w-3.5 h-3.5 text-yellow-400" /> Burst DPS: {teamBAnalysis.burstRating}%
              </span>
              <span className={`flex items-center gap-1.5 ${!isTeamAAlly ? 'text-blue-300' : 'text-red-300'}`}>
                <Heart className="w-3.5 h-3.5 text-rose-400" /> Effective HP: {teamBAnalysis.effectiveHpRating}%
              </span>
              <span className={`flex items-center gap-1.5 ${!isTeamAAlly ? 'text-blue-300' : 'text-red-300'}`}>
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
