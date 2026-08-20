import React from 'react';
import { DraftSession, getPickTeamForSlot } from '../../domain/models/draftSession';
import { BRAWLER_MAP } from '../../domain/data/brawlers';
import { BrawlerAvatar, ARCHETYPE_ICONS } from '../common/BrawlerAvatar';
import { DraftEngine } from '../../domain/engine/draftEngine';
import { ShieldAlert, Zap, Heart, Crosshair, Ban, CheckCircle2, X, Check, Target, Sparkles } from 'lucide-react';

import { BrawlerArchetype } from '../../domain/models/types';

interface Props {
  session: DraftSession;
  selectedTargetSlot: { type: 'PICK' | 'BAN'; side: 'teamA' | 'teamB'; index: number } | null;
  onSlotSelect: (target: { type: 'PICK' | 'BAN'; side: 'teamA' | 'teamB'; index: number }) => void;
  onClearSlot: (target: { type: 'PICK' | 'BAN'; side: 'teamA' | 'teamB'; index: number }) => void;
  onFilterArchetype?: (arch: BrawlerArchetype | 'ALL') => void;
}

export const DraftBoard: React.FC<Props> = ({
  session,
  selectedTargetSlot,
  onSlotSelect,
  onClearSlot,
  onFilterArchetype,
}) => {
  const isAllyTeamA = session.userSide === 'TEAM_A';

  // Ally team is ALWAYS on the Left (Blue), Enemy is ALWAYS on the Right (Red)
  const allySideKey = isAllyTeamA ? 'teamA' : 'teamB';
  const enemySideKey = isAllyTeamA ? 'teamB' : 'teamA';

  const allyBrawlers = session.picks[allySideKey].map(id => BRAWLER_MAP[id]).filter(Boolean);
  const enemyBrawlers = session.picks[enemySideKey].map(id => BRAWLER_MAP[id]).filter(Boolean);

  const allyAnalysis = DraftEngine.evaluateComp(allyBrawlers, {
    isFirstPickTeam: isAllyTeamA,
    currentSlot: session.currentSlot,
    isAlly: true,
  });
  const enemyAnalysis = DraftEngine.evaluateComp(enemyBrawlers, {
    isFirstPickTeam: !isAllyTeamA,
    currentSlot: session.currentSlot,
    isAlly: false,
  });

  const currentPickingTeam = getPickTeamForSlot(session.currentSlot);
  const isCurrentAllyTurn = currentPickingTeam === session.userSide;

  // Define slots for Team A (1, 4, 5) and Team B (2, 3, 6)
  const teamASlotDefinitions = [
    { slotNumber: 1, label: '1st Pick', index: 0 },
    { slotNumber: 4, label: '4th Pick', index: 1 },
    { slotNumber: 5, label: '5th Pick', index: 2 },
  ];

  const teamBSlotDefinitions = [
    { slotNumber: 2, label: '2nd Pick', index: 0 },
    { slotNumber: 3, label: '3rd Pick', index: 1 },
    { slotNumber: 6, label: '6th Pick (Last)', index: 2 },
  ];

  const allySlotDefinitions = isAllyTeamA ? teamASlotDefinitions : teamBSlotDefinitions;
  const enemySlotDefinitions = isAllyTeamA ? teamBSlotDefinitions : teamASlotDefinitions;

  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-md">
      {/* Draft Turn Banner & Instructions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full animate-ping ${
              isCurrentAllyTurn ? 'bg-blue-400' : 'bg-red-400'
            }`}
          />
          <div>
            <span className="text-sm uppercase font-black tracking-wider text-gray-400">
              CURRENT TURN:{' '}
              <span
                className={`font-brawl text-lg tracking-wide ${
                  session.isComplete
                    ? 'text-emerald-400'
                    : isCurrentAllyTurn
                    ? 'text-blue-400'
                    : 'text-red-400'
                }`}
              >
                {session.isComplete
                  ? 'DRAFT COMPLETE'
                  : isCurrentAllyTurn
                  ? `YOUR TEAM (PICK ${session.currentSlot})`
                  : `ENEMY TEAM (PICK ${session.currentSlot})`}
              </span>
            </span>
            <p className="text-[11px] text-gray-500">
              💡 Tip: Click any pick or ban slot to freely assign, change, or clear brawlers.
            </p>
          </div>
        </div>

        {/* Turn Step Chips: Pick 1 to 6 (Blue = You / Left, Red = Enemy / Right) */}
        <div className="flex items-center gap-1.5 text-xs font-bold">
          {[1, 2, 3, 4, 5, 6].map(slot => {
            const isDone = session.currentSlot > slot || session.isComplete;
            const isCurrent = session.currentSlot === slot && !session.isComplete;
            const pickingTeam = getPickTeamForSlot(slot as any);
            const isSlotAlly = pickingTeam === session.userSide;

            return (
              <div
                key={slot}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 border ${
                  isCurrent
                    ? isSlotAlly
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400 border-blue-400 scale-110 shadow-lg shadow-blue-500/40 font-black'
                      : 'bg-red-600 text-white ring-2 ring-red-400 border-red-400 scale-110 shadow-lg shadow-red-500/40 font-black'
                    : isDone
                    ? isSlotAlly
                      ? 'bg-blue-950/40 text-blue-300 border-blue-500/40'
                      : 'bg-red-950/40 text-red-300 border-red-500/40'
                    : isSlotAlly
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

      {/* Main Board Grid: Left = Always YOUR TEAM (Blue), Right = Always ENEMY TEAM (Red) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
        {/* =========================================
            LEFT CARD: ALWAYS YOUR TEAM (BLUE)
           ========================================= */}
        <div className="bg-gradient-to-br from-blue-950/40 via-gray-900/50 to-gray-900 border border-blue-500/40 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 shadow-md shadow-blue-500/50" />
              <h3 className="font-brawl text-xl tracking-wider text-blue-400">
                YOUR TEAM {isAllyTeamA ? '(1ST PICK)' : '(LAST PICK)'}
              </h3>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 font-black px-2 py-0.5 rounded border border-blue-500/40">
                YOU
              </span>
            </div>

            {/* Ally Bans */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
                <Ban className="w-3 h-3 text-red-400" /> Bans:
              </span>
              {[0, 1, 2].map(idx => {
                const brawlerId = session.bans[allySideKey][idx];
                const brawler = brawlerId ? BRAWLER_MAP[brawlerId] : undefined;
                const isSelected =
                  selectedTargetSlot?.type === 'BAN' &&
                  selectedTargetSlot?.side === allySideKey &&
                  selectedTargetSlot?.index === idx;

                return (
                  <div key={idx} className="relative group">
                    <BrawlerAvatar
                      brawler={brawler}
                      size="sm"
                      emptyLabel="Ban"
                      showArchetype={false}
                      selected={isSelected}
                      onClick={() => onSlotSelect({ type: 'BAN', side: allySideKey, index: idx })}
                    />
                    {brawler && (
                      <>
                        <div className="absolute inset-0 bg-red-950/60 flex items-center justify-center rounded-xl pointer-events-none">
                          <Ban className="w-4 h-4 text-red-500" />
                        </div>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onClearSlot({ type: 'BAN', side: allySideKey, index: idx });
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

          {/* Ally Picks Row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {allySlotDefinitions.map(slotInfo => {
              const brawlerId = session.picks[allySideKey][slotInfo.index];
              const brawler = brawlerId ? BRAWLER_MAP[brawlerId] : undefined;
              const isSelected =
                selectedTargetSlot?.type === 'PICK' &&
                selectedTargetSlot?.side === allySideKey &&
                selectedTargetSlot?.index === slotInfo.index;

              return (
                <div
                  key={slotInfo.slotNumber}
                  onClick={() =>
                    onSlotSelect({ type: 'PICK', side: allySideKey, index: slotInfo.index })
                  }
                  className={`flex flex-col items-center p-3 rounded-xl border transition-all cursor-pointer relative group ${
                    isSelected
                      ? 'bg-blue-900/40 border-yellow-400 ring-2 ring-yellow-400/50 scale-105 shadow-xl'
                      : brawler
                      ? 'bg-gray-800/60 border-gray-700 hover:border-gray-500'
                      : 'bg-gray-950/50 border-gray-800 border-dashed hover:border-blue-400/60'
                  }`}
                >
                  {brawler && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onClearSlot({ type: 'PICK', side: allySideKey, index: slotInfo.index });
                      }}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}

                  <span className="text-[11px] font-black text-blue-300 uppercase tracking-wider mb-2">
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

          {/* Ally Comp Analytics */}
          <div className="bg-gray-950/60 rounded-xl p-3.5 border border-gray-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-gray-400">
              <span className="flex items-center gap-1.5 text-blue-300">
                <Zap className="w-3.5 h-3.5 text-yellow-400" /> Burst DPS: {allyAnalysis.burstRating}%
              </span>
              <span className="flex items-center gap-1.5 text-blue-300">
                <Heart className="w-3.5 h-3.5 text-rose-400" /> Effective HP: {allyAnalysis.effectiveHpRating}%
              </span>
              <span className="flex items-center gap-1.5 text-blue-300">
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" /> Range: {allyAnalysis.rangeRating}%
              </span>
            </div>

            {/* Strengths */}
            {allyAnalysis.strengths.map((str, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{str}</span>
              </div>
            ))}

            {/* Ally Comp Warnings */}
            {allyAnalysis.vulnerabilities.map((vuln, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded-lg"
              >
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>{vuln}</span>
              </div>
            ))}

            {/* Recommended Next Roles (Click to Filter) */}
            {allyAnalysis.recommendedRoles.length > 0 && (
              <div className="pt-1.5 border-t border-gray-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-300">
                  <Target className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                  <span>Ideal Next:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {allyAnalysis.recommendedRoles.map(role => (
                    <button
                      key={role}
                      onClick={() => onFilterArchetype?.(role)}
                      title={`Click to filter by ${role.replace('_', ' ')}`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-900/40 hover:bg-blue-600/50 hover:scale-105 border border-blue-500/40 text-[10px] font-black uppercase text-blue-200 transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      {ARCHETYPE_ICONS[role]}
                      <span>{role.replace('_', ' ')}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Preemptive Prediction & Counter for Slot 5 */}
            {allyAnalysis.predictedEnemyNext && (
              <div className="pt-2 border-t border-gray-800/80 space-y-1.5 bg-purple-950/20 p-2.5 rounded-xl border border-purple-500/20">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-purple-300">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    Predicted Enemy 6th:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {allyAnalysis.predictedEnemyNext.predictedRoles.map(role => (
                      <button
                        key={role}
                        onClick={() => onFilterArchetype?.(role)}
                        title={`Click to filter by ${role.replace('_', ' ')}`}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-950/80 hover:bg-purple-700/60 hover:scale-105 border border-purple-500/40 text-[9px] font-black uppercase text-purple-200 transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        {role.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    Preemptive 5th Counter:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {allyAnalysis.predictedEnemyNext.counterRoles.map(role => (
                      <button
                        key={role}
                        onClick={() => onFilterArchetype?.(role)}
                        title={`Click to filter by ${role.replace('_', ' ')}`}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950/80 hover:bg-amber-700/60 hover:scale-105 border border-amber-500/40 text-[9px] font-black uppercase text-amber-200 transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        {role.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-[10px] text-gray-300 leading-tight">
                  💡 {allyAnalysis.predictedEnemyNext.reason}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* =========================================
            RIGHT CARD: ALWAYS ENEMY TEAM (RED)
           ========================================= */}
        <div className="bg-gradient-to-br from-red-950/40 via-gray-900/50 to-gray-900 border border-red-500/40 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 shadow-md shadow-red-500/50" />
              <h3 className="font-brawl text-xl tracking-wider text-red-400">
                ENEMY TEAM {!isAllyTeamA ? '(1ST PICK)' : '(LAST PICK)'}
              </h3>
              <span className="text-[10px] bg-red-500/20 text-red-300 font-black px-2 py-0.5 rounded border border-red-500/40">
                OPPONENT
              </span>
            </div>

            {/* Enemy Bans */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
                <Ban className="w-3 h-3 text-red-400" /> Bans:
              </span>
              {[0, 1, 2].map(idx => {
                const brawlerId = session.bans[enemySideKey][idx];
                const brawler = brawlerId ? BRAWLER_MAP[brawlerId] : undefined;
                const isSelected =
                  selectedTargetSlot?.type === 'BAN' &&
                  selectedTargetSlot?.side === enemySideKey &&
                  selectedTargetSlot?.index === idx;

                return (
                  <div key={idx} className="relative group">
                    <BrawlerAvatar
                      brawler={brawler}
                      size="sm"
                      emptyLabel="Ban"
                      showArchetype={false}
                      selected={isSelected}
                      onClick={() => onSlotSelect({ type: 'BAN', side: enemySideKey, index: idx })}
                    />
                    {brawler && (
                      <>
                        <div className="absolute inset-0 bg-red-950/60 flex items-center justify-center rounded-xl pointer-events-none">
                          <Ban className="w-4 h-4 text-red-500" />
                        </div>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onClearSlot({ type: 'BAN', side: enemySideKey, index: idx });
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

          {/* Enemy Picks Row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {enemySlotDefinitions.map(slotInfo => {
              const brawlerId = session.picks[enemySideKey][slotInfo.index];
              const brawler = brawlerId ? BRAWLER_MAP[brawlerId] : undefined;
              const isSelected =
                selectedTargetSlot?.type === 'PICK' &&
                selectedTargetSlot?.side === enemySideKey &&
                selectedTargetSlot?.index === slotInfo.index;

              return (
                <div
                  key={slotInfo.slotNumber}
                  onClick={() =>
                    onSlotSelect({ type: 'PICK', side: enemySideKey, index: slotInfo.index })
                  }
                  className={`flex flex-col items-center p-3 rounded-xl border transition-all cursor-pointer relative group ${
                    isSelected
                      ? 'bg-red-900/40 border-yellow-400 ring-2 ring-yellow-400/50 scale-105 shadow-xl'
                      : brawler
                      ? 'bg-gray-800/60 border-gray-700 hover:border-gray-500'
                      : 'bg-gray-950/50 border-gray-800 border-dashed hover:border-red-400/60'
                  }`}
                >
                  {brawler && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onClearSlot({ type: 'PICK', side: enemySideKey, index: slotInfo.index });
                      }}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}

                  <span className="text-[11px] font-black text-red-300 uppercase tracking-wider mb-2">
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

          {/* Enemy Comp Analytics */}
          <div className="bg-gray-950/60 rounded-xl p-3.5 border border-gray-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-gray-400">
              <span className="flex items-center gap-1.5 text-red-300">
                <Zap className="w-3.5 h-3.5 text-yellow-400" /> Burst DPS: {enemyAnalysis.burstRating}%
              </span>
              <span className="flex items-center gap-1.5 text-red-300">
                <Heart className="w-3.5 h-3.5 text-rose-400" /> Effective HP: {enemyAnalysis.effectiveHpRating}%
              </span>
              <span className="flex items-center gap-1.5 text-red-300">
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" /> Range: {enemyAnalysis.rangeRating}%
              </span>
            </div>

            {/* Enemy Strengths */}
            {enemyAnalysis.strengths.map((str, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{str}</span>
              </div>
            ))}

            {/* Enemy Comp Warnings */}
            {enemyAnalysis.vulnerabilities.map((vuln, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded-lg"
              >
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>{vuln}</span>
              </div>
            ))}

            {/* Enemy Recommended Roles (Click to Filter) */}
            {enemyAnalysis.recommendedRoles.length > 0 && (
              <div className="pt-1.5 border-t border-gray-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-300">
                  <Target className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                  <span>Ideal Next:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {enemyAnalysis.recommendedRoles.map(role => (
                    <button
                      key={role}
                      onClick={() => onFilterArchetype?.(role)}
                      title={`Click to filter by ${role.replace('_', ' ')}`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-900/40 hover:bg-red-600/50 hover:scale-105 border border-red-500/40 text-[10px] font-black uppercase text-red-200 transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      {ARCHETYPE_ICONS[role]}
                      <span>{role.replace('_', ' ')}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
