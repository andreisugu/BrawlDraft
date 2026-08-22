import React from 'react';
import { DraftSession, getPickTeamForSlot, isSlotFilled } from '../../domain/models/draftSession';
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
  onTurnSelect?: (slot: number) => void;
}

export const DraftBoard: React.FC<Props> = ({
  session,
  selectedTargetSlot,
  onSlotSelect,
  onClearSlot,
  onFilterArchetype,
  onTurnSelect,
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
    enemyBrawlers: enemyBrawlers,
    mode: session.map.mode,
  });
  const enemyAnalysis = DraftEngine.evaluateComp(enemyBrawlers, {
    isFirstPickTeam: !isAllyTeamA,
    currentSlot: session.currentSlot,
    isAlly: false,
    enemyBrawlers: allyBrawlers,
    mode: session.map.mode,
  });

  const currentPickingSide = getPickTeamForSlot(session.currentSlot);
  const isCurrentAllyTurn = currentPickingSide === session.userSide;

  // Slot definitions for Clean Left/Right presentation
  const allySlotDefinitions = isAllyTeamA
    ? [
        { label: '1st Pick', slotNumber: 1, index: 0 },
        { label: '4th Pick', slotNumber: 4, index: 1 },
        { label: '5th Pick', slotNumber: 5, index: 2 },
      ]
    : [
        { label: '2nd Pick', slotNumber: 2, index: 0 },
        { label: '3rd Pick', slotNumber: 3, index: 1 },
        { label: '6th Pick (Last)', slotNumber: 6, index: 2 },
      ];

  const enemySlotDefinitions = isAllyTeamA
    ? [
        { label: '2nd Pick', slotNumber: 2, index: 0 },
        { label: '3rd Pick', slotNumber: 3, index: 1 },
        { label: '6th Pick (Last)', slotNumber: 6, index: 2 },
      ]
    : [
        { label: '1st Pick', slotNumber: 1, index: 0 },
        { label: '4th Pick', slotNumber: 4, index: 1 },
        { label: '5th Pick', slotNumber: 5, index: 2 },
      ];

  return (
    <div className="space-y-4">
      {/* Turn Tracker Banner (Pick 1 -> Pick 6 Indicator) */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div
            className={`w-3.5 h-3.5 rounded-full animate-ping shrink-0 ${
              session.isComplete
                ? 'bg-emerald-400'
                : isCurrentAllyTurn
                ? 'bg-blue-400'
                : 'bg-red-400'
            }`}
          />
          <div>
            <span className="text-xs uppercase font-black tracking-wider text-gray-300">
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
              💡 Tip: Click any turn chip (Pick 1-6) or pick slot below to view recommendations for that turn.
            </p>
          </div>
        </div>

        {/* Turn Step Chips: Pick 1 to 6 (Blue = You / Left, Red = Enemy / Right) */}
        <div className="flex items-center gap-1.5 text-xs font-bold flex-wrap">
          {[1, 2, 3, 4, 5, 6].map(slot => {
            const isFilled = isSlotFilled(session, slot);
            const isCurrent = session.currentSlot === slot && !session.isComplete;
            const pickingTeam = getPickTeamForSlot(slot as any);
            const isSlotAlly = pickingTeam === session.userSide;

            return (
              <button
                key={slot}
                onClick={() => onTurnSelect?.(slot)}
                title={`Click to view recommendations for Pick ${slot} (${isSlotAlly ? 'Your Team' : 'Enemy Team'})`}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 border cursor-pointer ${
                  isCurrent
                    ? isSlotAlly
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400 border-blue-400 scale-110 shadow-lg shadow-blue-500/40 font-black'
                      : 'bg-red-600 text-white ring-2 ring-red-400 border-red-400 scale-110 shadow-lg shadow-red-500/40 font-black'
                    : isFilled
                    ? isSlotAlly
                      ? 'bg-blue-950/60 text-blue-300 border-blue-500/50 hover:bg-blue-900/40'
                      : 'bg-red-950/60 text-red-300 border-red-500/50 hover:bg-red-900/40'
                    : isSlotAlly
                    ? 'bg-blue-950/20 text-blue-400/80 border-blue-500/20 hover:bg-blue-900/30'
                    : 'bg-red-950/20 text-red-400/80 border-red-500/20 hover:bg-red-900/30'
                }`}
              >
                <span>Pick {slot}</span>
                {isFilled && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              </button>
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

            {/* Recommended Next Roles (Ranked from Most Needed to Least Needed) */}
            {allyAnalysis.recommendedRoles.length > 0 && (
              <div className="pt-1.5 border-t border-gray-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-300">
                  <Target className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                  <span>Ideal Next (Ranked):</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {allyAnalysis.recommendedRoles.map((role, idx) => {
                    const needInfo = allyAnalysis.rankedNeeds?.[idx];
                    const isTopPriority = idx === 0;

                    return (
                      <button
                        key={role}
                        onClick={() => onFilterArchetype?.(role)}
                        title={needInfo?.reason || `Priority #${idx + 1}: ${role.replace('_', ' ')}`}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-black uppercase transition-all cursor-pointer shadow-sm active:scale-95 ${
                          isTopPriority
                            ? 'bg-amber-400/20 text-amber-300 border-amber-400/60 shadow-amber-400/20 shadow-md ring-1 ring-amber-400/40 hover:bg-amber-400/30 hover:scale-105'
                            : idx === 1
                            ? 'bg-blue-900/40 text-blue-200 border-blue-500/40 hover:bg-blue-600/50 hover:scale-105'
                            : 'bg-gray-800/40 text-gray-300 border-gray-700 hover:bg-gray-700 hover:scale-105'
                        }`}
                      >
                        <span className={`text-[8px] font-mono px-1 rounded ${isTopPriority ? 'bg-amber-400 text-black font-bold' : 'bg-gray-950 text-gray-400'}`}>
                          #{idx + 1}
                        </span>
                        {ARCHETYPE_ICONS[role]}
                        <span>{role.replace('_', ' ')}</span>
                      </button>
                    );
                  })}
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

            {/* Enemy Recommended Roles (Ranked) */}
            {enemyAnalysis.recommendedRoles.length > 0 && (
              <div className="pt-1.5 border-t border-gray-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-300">
                  <Target className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                  <span>Ideal Next (Ranked):</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {enemyAnalysis.recommendedRoles.map((role, idx) => {
                    const needInfo = enemyAnalysis.rankedNeeds?.[idx];
                    const isTopPriority = idx === 0;

                    return (
                      <button
                        key={role}
                        onClick={() => onFilterArchetype?.(role)}
                        title={needInfo?.reason || `Priority #${idx + 1}: ${role.replace('_', ' ')}`}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-black uppercase transition-all cursor-pointer shadow-sm active:scale-95 ${
                          isTopPriority
                            ? 'bg-rose-950/60 text-rose-300 border-rose-500/60 shadow-rose-500/20 shadow-md ring-1 ring-rose-500/40 hover:bg-rose-900/60 hover:scale-105'
                            : idx === 1
                            ? 'bg-red-900/40 text-red-200 border-red-500/40 hover:bg-red-600/50 hover:scale-105'
                            : 'bg-gray-800/40 text-gray-300 border-gray-700 hover:bg-gray-700 hover:scale-105'
                        }`}
                      >
                        <span className={`text-[8px] font-mono px-1 rounded ${isTopPriority ? 'bg-rose-500 text-white font-bold' : 'bg-gray-950 text-gray-400'}`}>
                          #{idx + 1}
                        </span>
                        {ARCHETYPE_ICONS[role]}
                        <span>{role.replace('_', ' ')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
