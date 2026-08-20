import React from 'react';
import { DraftSession, getPickTeamForSlot } from '../../domain/models/draftSession';
import { DraftEngine, PickRecommendation, BanRecommendation } from '../../domain/engine/draftEngine';
import { BrawlerAvatar, ARCHETYPE_ICONS, BOBBY_COLOR_STYLES } from '../common/BrawlerAvatar';
import { BrawlerArchetype } from '../../domain/models/types';
import { BRAWLER_MAP } from '../../domain/data/brawlers';
import {
  AlertTriangle,
  Check,
  Flame,
  ChevronRight,
  Brain,
  Lightbulb,
  FastForward,
  Shield,
  Trophy,
  Swords,
  Compass,
  ArrowLeftRight,
  Crosshair,
  Eye,
  Users,
} from 'lucide-react';

interface Props {
  session: DraftSession;
  skipBans?: boolean;
  selectedArchetypeFilter?: BrawlerArchetype | 'ALL';
  onFilterChange?: (arch: BrawlerArchetype | 'ALL') => void;
  onToggleSkipBans?: () => void;
  onSelectBrawler: (brawlerId: string) => void;
}

export const RecommendationsPanel: React.FC<Props> = ({
  session,
  skipBans = false,
  selectedArchetypeFilter = 'ALL',
  onFilterChange,
  onToggleSkipBans,
  onSelectBrawler,
}) => {
  const isComplete = session.isComplete || (session.picks.teamA.filter(Boolean).length === 3 && session.picks.teamB.filter(Boolean).length === 3);
  const isBanPhase = !isComplete && !skipBans && (session.bans.teamA.length + session.bans.teamB.length < 6);
  const banRecs: BanRecommendation[] = isBanPhase ? DraftEngine.recommendBans(session) : [];
  const pickRecs: PickRecommendation[] = !isBanPhase && !isComplete ? DraftEngine.recommendPicks(session) : [];
  const deductions = !isBanPhase && !isComplete ? DraftEngine.getDeductions(session) : [];

  const filteredPickRecs =
    selectedArchetypeFilter === 'ALL'
      ? pickRecs
      : pickRecs.filter(r => r.brawler.archetype === selectedArchetypeFilter);

  // Post-Draft Analysis Data
  const isAllyTeamA = session.userSide === 'TEAM_A';
  const allyBrawlers = (isAllyTeamA ? session.picks.teamA : session.picks.teamB).map(id => BRAWLER_MAP[id]).filter(Boolean);
  const enemyBrawlers = (isAllyTeamA ? session.picks.teamB : session.picks.teamA).map(id => BRAWLER_MAP[id]).filter(Boolean);

  const allyAnalysis = DraftEngine.evaluateComp(allyBrawlers, { isFirstPickTeam: isAllyTeamA, currentSlot: 6, isAlly: true, enemyBrawlers, mode: session.map.mode });
  const enemyAnalysis = DraftEngine.evaluateComp(enemyBrawlers, { isFirstPickTeam: !isAllyTeamA, currentSlot: 6, isAlly: false, enemyBrawlers: allyBrawlers, mode: session.map.mode });

  // Intelligent Lane Allocations preventing suicide matchups
  const optimalLanes = isComplete ? DraftEngine.calculateOptimalLanes(allyBrawlers, enemyBrawlers) : [];
  const macroPlaybook = isComplete ? DraftEngine.generateMacroPlaybook(allyBrawlers, enemyBrawlers, optimalLanes) : null;

  // Current turn side
  const currentPickingSide = getPickTeamForSlot(session.currentSlot);
  const isAllyTurn = currentPickingSide === session.userSide;

  return (
    <div id="recommendations-panel" className="bg-gray-900/90 border border-gray-800 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-md space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            {isComplete ? (
              <Trophy className="w-6 h-6 text-yellow-400 animate-bounce" />
            ) : isAllyTurn ? (
              <Brain className="w-6 h-6 text-yellow-400" />
            ) : (
              <Swords className="w-6 h-6 text-red-400" />
            )}
            <h2 className="font-brawl text-2xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
              {isComplete
                ? '🏆 FINAL DRAFT MATCHUP & WIN CONDITIONS'
                : isBanPhase
                ? 'PRO BAN ADVISOR'
                : isAllyTurn
                ? `YOUR TEAM RECOMMENDATIONS (PICK ${session.currentSlot})`
                : `OPPONENT DRAFT PREDICTOR (PICK ${session.currentSlot})`}
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {isComplete
              ? `Both 3v3 compositions are locked in for ${session.map.name} (${session.map.mode.replace('_', ' ')}). Review your in-game strategy below.`
              : isBanPhase
              ? session.userSide === 'TEAM_A'
                ? 'Your team has 1st pick: Banning 2/3 flex stabilizers or cheese last-picks'
                : 'Opponent has 1st pick: Banning top S-tier first picks on this map'
              : isAllyTurn
              ? `Analyzing drafted roles on both sides to deduce optimal counterpicks for your team.`
              : `Anticipating the enemy's optimal picks for Slot ${session.currentSlot}. Click to record what the opponent picked.`}
          </p>
        </div>

        {/* Ban Phase Skip Button & Filter Controls */}
        {!isComplete && (
          <div className="flex flex-wrap items-center gap-2">
            {isBanPhase && onToggleSkipBans && (
              <button
                onClick={onToggleSkipBans}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-300 border border-purple-500/40 text-xs font-black uppercase transition-all shadow-md shadow-purple-600/20 active:scale-95"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>Skip Ban Phase →</span>
              </button>
            )}

            {!isBanPhase && onToggleSkipBans && (
              <button
                onClick={onToggleSkipBans}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold transition-all"
              >
                <Shield className="w-3.5 h-3.5 text-gray-400" />
                <span>Show Bans</span>
              </button>
            )}

            {/* Archetype Filter for Pick Phase */}
            {!isBanPhase && (
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => onFilterChange?.('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase transition-all ${
                    selectedArchetypeFilter === 'ALL'
                      ? 'bg-yellow-400 text-black shadow-md shadow-yellow-400/20'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                {(['ANTI_TANK', 'SPACE_MAKER', 'TANK', 'CONTROL', 'SNIPER', 'THROWER', 'SUPPORT'] as BrawlerArchetype[]).map(
                  arch => (
                    <button
                      key={arch}
                      onClick={() => onFilterChange?.(arch)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase transition-all ${
                        selectedArchetypeFilter === arch
                          ? 'bg-yellow-400 text-black shadow-md shadow-yellow-400/20'
                          : 'bg-gray-800/80 text-gray-400 hover:text-white'
                      }`}
                    >
                      {ARCHETYPE_ICONS[arch]}
                      <span className="hidden sm:inline">{arch.replace('_', ' ')}</span>
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================
          POST-DRAFT COMPLETE: IN-GAME STRATEGY & LANE BREAKDOWN
         ========================================================= */}
      {isComplete && (
        <div className="space-y-6">
          {/* Tactical Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Ally Strategy */}
            <div className="bg-blue-950/30 border border-blue-500/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-blue-300 font-brawl text-base">
                <Swords className="w-4 h-4 text-blue-400" />
                <span>YOUR WIN CONDITION</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Execute your <span className="text-yellow-400 font-bold">Anti-Tank + Space Maker</span> core.
                {optimalLanes[0]?.ally && ` Anchor the mid-zone with ${optimalLanes[0].ally.name} while your side-duelists create flanking pressure.`}
              </p>
              <div className="space-y-1">
                {allyAnalysis.strengths.map((str, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[11px] text-emerald-300">
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>{str}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Enemy Strategy & Threat Assessment */}
            <div className="bg-red-950/30 border border-red-500/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-red-300 font-brawl text-base">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>ENEMY THREAT ASSESSMENT</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Watch out for enemy aggressive dives and support shields.
                {enemyBrawlers.some(b => b.archetype === 'SPACE_MAKER') && ' Keep vision on bushes and collapse as a team when assassins rush in.'}
              </p>
              <div className="space-y-1">
                {enemyAnalysis.vulnerabilities.map((vuln, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[11px] text-amber-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span>{vuln}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Lane Allocation Recommendation */}
            <div className="bg-purple-950/30 border border-purple-500/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-purple-300 font-brawl text-base">
                <Compass className="w-4 h-4 text-purple-400" />
                <span>RECOMMENDED LANE SETUP</span>
              </div>
              <div className="text-xs space-y-2 text-gray-300">
                {optimalLanes.map(lane => (
                  <div key={lane.laneName} className="bg-gray-950/60 p-2.5 rounded-xl border border-gray-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-yellow-400 text-[11px]">{lane.laneName}:</span>
                      <span className="font-brawl text-xs text-white">
                        <span className="text-blue-300">{lane.ally.name}</span>
                        <span className="text-gray-500 font-sans text-[10px] mx-1">vs</span>
                        <span className="text-red-400">{lane.enemy.name}</span>
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-300 leading-tight">
                      {lane.advantage === 'ALLY_FAVORED' && <span className="text-emerald-400 font-bold mr-1">✅ ADVANTAGE:</span>}
                      {lane.advantage === 'ENEMY_FAVORED' && <span className="text-rose-400 font-bold mr-1">⚠️ CAUTION:</span>}
                      {lane.tip}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pro Positioning & In-Game Macro Playbook */}
          {macroPlaybook && (
            <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 border border-yellow-500/30 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-800">
                <Brain className="w-5 h-5 text-yellow-400" />
                <h3 className="font-brawl text-lg text-yellow-400 tracking-wide">
                  PRO POSITIONING & IN-GAME MACRO PLAYBOOK
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Priority Pinch Target */}
                {macroPlaybook.priorityPinchTarget && (
                  <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 text-rose-300 font-brawl text-sm">
                      <Crosshair className="w-4 h-4 text-rose-400" />
                      <span>PRIORITY PINCH TARGET: {macroPlaybook.priorityPinchTarget.target.name.toUpperCase()}</span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      <strong className="text-rose-300">Why: </strong>{macroPlaybook.priorityPinchTarget.reason}
                    </p>
                    <p className="text-xs text-yellow-300/90 leading-relaxed bg-black/40 p-2 rounded-lg border border-yellow-500/20">
                      💡 <strong>Pinch Tactic: </strong>{macroPlaybook.priorityPinchTarget.pinchInstructions}
                    </p>
                  </div>
                )}

                {/* 2. Dynamic Lane Switching */}
                <div className="bg-blue-950/20 border border-blue-500/30 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-blue-300 font-brawl text-sm">
                    <ArrowLeftRight className="w-4 h-4 text-blue-400" />
                    <span>DYNAMIC LANE SWITCHING RULES</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-gray-300">
                    {macroPlaybook.laneSwitchingRules.map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <span className="text-blue-400 font-bold">↳</span>
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Cooldown & Ability Tracking */}
                <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-brawl text-sm">
                    <Eye className="w-4 h-4 text-amber-400" />
                    <span>ENEMY COOLDOWN & ABILITY TRACKING</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-gray-300">
                    {macroPlaybook.cooldownTracking.map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. 3-Man Line Movement & Resetting */}
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300 font-brawl text-sm">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>3-MAN LINE MOVEMENT & RESETTING</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {macroPlaybook.teamMovementRule}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STRATEGIC DEDUCTIONS CARDS (The Core Brain during picking) */}
      {!isComplete && !isBanPhase && deductions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-400" />
            <span className="text-xs uppercase font-black tracking-wider text-yellow-400">
              Active Strategic Deductions:
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {deductions.map(ded => (
              <div
                key={ded.id}
                className="bg-gray-950/70 border border-gray-800 hover:border-yellow-400/40 rounded-2xl p-3.5 space-y-1.5 transition-all shadow-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{ded.icon}</span>
                    <h4 className="font-bold text-xs text-white truncate max-w-[200px]">
                      {ded.title}
                    </h4>
                  </div>
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      ded.priority === 'CRITICAL'
                        ? 'bg-rose-950 text-rose-400 border border-rose-500/40 animate-pulse'
                        : ded.priority === 'HIGH'
                        ? 'bg-amber-950 text-amber-400 border border-amber-500/40'
                        : 'bg-blue-950 text-blue-400 border border-blue-500/40'
                    }`}
                  >
                    {ded.priority}
                  </span>
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed">{ded.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BAN PHASE RECOMMENDATIONS */}
      {!isComplete && isBanPhase && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banRecs.slice(0, 6).map(rec => {
            const bobbyColor = BOBBY_COLOR_STYLES[rec.brawler.colorTag];

            return (
              <div
                key={rec.brawler.id}
                className="bg-gray-950/60 border border-gray-800 hover:border-red-500/50 rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between group hover:shadow-xl hover:shadow-red-500/10"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <BrawlerAvatar brawler={rec.brawler} size="md" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-brawl text-lg text-white group-hover:text-red-400 transition-colors">
                            {rec.brawler.name}
                          </h4>
                          <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-500/40">
                            {rec.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400 font-semibold uppercase">
                            {rec.brawler.archetype.replace('_', ' ')}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-black ${bobbyColor.badgeBg} ${bobbyColor.text}`}
                          >
                            {bobbyColor.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed bg-gray-900/60 p-2.5 rounded-xl border border-gray-800/60">
                    <span className="text-yellow-400 font-bold">Bobby Rationale: </span>
                    {rec.rationale}
                  </p>
                </div>

                <button
                  onClick={() => onSelectBrawler(rec.brawler.id)}
                  className="mt-4 w-full bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-brawl tracking-wider py-2 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 active:scale-95"
                >
                  <span>BAN {rec.brawler.name.toUpperCase()}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* PICK PHASE RECOMMENDATIONS */}
      {!isComplete && !isBanPhase && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPickRecs.slice(0, 9).map(rec => {
            const bobbyColor = BOBBY_COLOR_STYLES[rec.brawler.colorTag];

            return (
              <div
                key={rec.brawler.id}
                className="bg-gray-950/60 border border-gray-800 hover:border-yellow-500/50 rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between group hover:shadow-xl hover:shadow-yellow-500/10"
              >
                <div>
                  {/* Header Info */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <BrawlerAvatar brawler={rec.brawler} size="md" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-brawl text-lg text-white group-hover:text-yellow-400 transition-colors">
                            {rec.brawler.name}
                          </h4>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded ${
                              rec.grade === 'S+'
                                ? 'bg-yellow-400 text-black shadow-md shadow-yellow-400/30'
                                : rec.grade === 'S'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            }`}
                          >
                            Grade {rec.grade}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400 font-semibold uppercase">
                            {rec.brawler.archetype.replace('_', ' ')}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-black ${bobbyColor.badgeBg} ${bobbyColor.text}`}
                          >
                            {bobbyColor.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {rec.brawler.isOvertuned && (
                      <span className="flex items-center gap-1 text-[10px] font-black text-rose-400 bg-rose-950/60 border border-rose-500/40 px-1.5 py-0.5 rounded">
                        <Flame className="w-3 h-3" /> Meta
                      </span>
                    )}
                  </div>

                  {/* Deduction / Rationale Box */}
                  <div className="space-y-2 mb-3">
                    <p className="text-xs text-gray-300 leading-relaxed bg-gray-900/60 p-2.5 rounded-xl border border-gray-800/60">
                      <span className="text-yellow-400 font-bold">Pro Rationale: </span>
                      {rec.rationale}
                    </p>

                    {/* Warning if any */}
                    {rec.riskWarning && (
                      <div className="flex items-start gap-2 text-[11px] font-semibold text-rose-400 bg-rose-950/40 border border-rose-500/30 p-2 rounded-xl">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{rec.riskWarning}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => onSelectBrawler(rec.brawler.id)}
                  className={`w-full font-brawl tracking-wider py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
                    isAllyTurn
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black shadow-yellow-500/20'
                      : 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-red-600/20'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>
                    {isAllyTurn
                      ? `PICK ${rec.brawler.name.toUpperCase()}`
                      : `ASSIGN ${rec.brawler.name.toUpperCase()} (ENEMY)`}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
