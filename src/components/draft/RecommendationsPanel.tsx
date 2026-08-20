import React, { useState } from 'react';
import { DraftSession } from '../../domain/models/draftSession';
import { DraftEngine, PickRecommendation, BanRecommendation } from '../../domain/engine/draftEngine';
import { BrawlerAvatar, ARCHETYPE_ICONS } from '../common/BrawlerAvatar';
import { BrawlerArchetype } from '../../domain/models/types';
import { Sparkles, AlertTriangle, Check, Flame, ChevronRight } from 'lucide-react';

interface Props {
  session: DraftSession;
  onSelectBrawler: (brawlerId: string) => void;
}

export const RecommendationsPanel: React.FC<Props> = ({ session, onSelectBrawler }) => {
  const [selectedArchetypeFilter, setSelectedArchetypeFilter] = useState<BrawlerArchetype | 'ALL'>('ALL');

  const isBanPhase = session.bans.teamA.length + session.bans.teamB.length < 6;
  const banRecs: BanRecommendation[] = isBanPhase ? DraftEngine.recommendBans(session) : [];
  const pickRecs: PickRecommendation[] = !isBanPhase ? DraftEngine.recommendPicks(session) : [];

  const filteredPickRecs =
    selectedArchetypeFilter === 'ALL'
      ? pickRecs
      : pickRecs.filter(r => r.brawler.archetype === selectedArchetypeFilter);

  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <h2 className="font-brawl text-2xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
              {isBanPhase ? 'PRO BAN ADVISOR' : 'PRO DRAFT RECOMMENDATIONS'}
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {isBanPhase
              ? session.userSide === 'TEAM_A'
                ? 'Your team has 1st pick: Banning 2/3 flex stabilizers or cheese last picks'
                : 'Opponent has 1st pick: Banning top S-tier first picks on this map'
              : `Turn Slot ${session.currentSlot} Recommendations based on Bobby's Pro Heuristics`}
          </p>
        </div>

        {/* Archetype Filter for Pick Phase */}
        {!isBanPhase && (
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setSelectedArchetypeFilter('ALL')}
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
                  onClick={() => setSelectedArchetypeFilter(arch)}
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

      {/* BAN PHASE RECOMMENDATIONS */}
      {isBanPhase && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banRecs.slice(0, 6).map(rec => (
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
                      <span className="text-xs text-gray-400 font-semibold uppercase">
                        {rec.brawler.archetype.replace('_', ' ')}
                      </span>
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
          ))}
        </div>
      )}

      {/* PICK PHASE RECOMMENDATIONS */}
      {!isBanPhase && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPickRecs.slice(0, 9).map(rec => (
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
                      <span className="text-xs text-gray-400 font-semibold uppercase flex items-center gap-1.5 mt-0.5">
                        <span className="text-yellow-400 font-bold">{rec.roleInDraft}</span>
                      </span>
                    </div>
                  </div>

                  {rec.brawler.isOvertuned && (
                    <span className="flex items-center gap-1 text-[10px] font-black text-rose-400 bg-rose-950/60 border border-rose-500/40 px-1.5 py-0.5 rounded">
                      <Flame className="w-3 h-3" /> Meta
                    </span>
                  )}
                </div>

                {/* Rationale Box */}
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
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-brawl tracking-wider py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20 active:scale-95"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>PICK {rec.brawler.name.toUpperCase()}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
