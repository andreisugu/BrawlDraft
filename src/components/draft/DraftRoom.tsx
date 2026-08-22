import React, { useState } from 'react';
import { MAPS } from '../../domain/data/maps';
import { BrawlMap } from '../../domain/models/map';
import { DraftSession, getAllBannedBrawlers, getAllPickedBrawlers, getNextUnfilledSlot } from '../../domain/models/draftSession';
import { DraftBoard } from './DraftBoard';
import { RecommendationsPanel } from './RecommendationsPanel';
import { BrawlerSelectorModal } from './BrawlerSelectorModal';
import { BrawlerPoolModal } from './BrawlerPoolModal';
import { Brawler } from '../../domain/models/brawler';
import { BrawlerArchetype, DraftSide } from '../../domain/models/types';
import { RefreshCw, MapPin, Info, PlusCircle, FastForward, Shield, Star } from 'lucide-react';

export const DraftRoom: React.FC = () => {
  const [selectedMap, setSelectedMap] = useState<BrawlMap>(MAPS[0]);
  const [userSide, setUserSide] = useState<DraftSide>('TEAM_A');
  const [skipBans, setSkipBans] = useState<boolean>(false);
  const [selectedArchetypeFilter, setSelectedArchetypeFilter] = useState<BrawlerArchetype | 'ALL'>('ALL');
  const [selectedTargetSlot, setSelectedTargetSlot] = useState<{
    type: 'PICK' | 'BAN';
    side: 'teamA' | 'teamB';
    index: number;
  } | null>(null);

  // Preferred / Maxed Brawler Pool (Persisted in localStorage)
  const [preferredPool, setPreferredPool] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('brawldraft_preferred_pool');
      return saved ? JSON.parse(saved) : ['nori', 'brock', 'byron', 'poco', 'max', 'squeak', 'meeple', 'bolt', 'crow'];
    } catch {
      return ['nori', 'brock', 'byron', 'poco', 'max', 'squeak', 'meeple', 'bolt', 'crow'];
    }
  });
  const [poolModalOpen, setPoolModalOpen] = useState(false);

  const handleSavePool = (newPool: string[]) => {
    setPreferredPool(newPool);
    try {
      localStorage.setItem('brawldraft_preferred_pool', JSON.stringify(newPool));
    } catch {}
  };

  const handleFilterArchetype = (arch: BrawlerArchetype | 'ALL') => {
    setSelectedArchetypeFilter(arch);
    const el = document.getElementById('recommendations-panel');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTurnSelect = (slot: number) => {
    setSession(prev => ({
      ...prev,
      currentSlot: slot as any,
    }));
  };

  const [session, setSession] = useState<DraftSession>({
    id: 'draft_session_live',
    map: MAPS[0],
    userSide: 'TEAM_A',
    bans: { teamA: [], teamB: [] },
    picks: { teamA: [], teamB: [] },
    currentSlot: 1,
    isComplete: false,
  });

  const [modalOpen, setModalOpen] = useState(false);

  // Handle map change
  const handleMapChange = (mapId: string) => {
    const map = MAPS.find(m => m.id === mapId) || MAPS[0];
    setSelectedMap(map);
    setSession({
      id: `session_${Date.now()}`,
      map,
      userSide,
      bans: { teamA: [], teamB: [] },
      picks: { teamA: [], teamB: [] },
      currentSlot: 1,
      isComplete: false,
    });
    setSelectedTargetSlot(null);
  };

  // Handle user side change
  const handleSideChange = (side: DraftSide) => {
    setUserSide(side);
    setSession(prev => ({
      ...prev,
      userSide: side,
    }));
  };

  // Handle reset
  const handleReset = () => {
    setSession({
      id: `session_${Date.now()}`,
      map: selectedMap,
      userSide,
      bans: { teamA: [], teamB: [] },
      picks: { teamA: [], teamB: [] },
      currentSlot: 1,
      isComplete: false,
    });
    setSelectedTargetSlot(null);
  };

  // Handle direct slot selection from the board
  const handleSlotSelect = (target: { type: 'PICK' | 'BAN'; side: 'teamA' | 'teamB'; index: number }) => {
    setSelectedTargetSlot(target);
    setModalOpen(true);
  };

  // Handle clearing an individual slot
  const handleClearSlot = (target: { type: 'PICK' | 'BAN'; side: 'teamA' | 'teamB'; index: number }) => {
    setSession(prev => {
      if (target.type === 'BAN') {
        const newBans = [...prev.bans[target.side]];
        newBans.splice(target.index, 1);
        return {
          ...prev,
          bans: {
            ...prev.bans,
            [target.side]: newBans,
          },
        };
      } else {
        const newPicks = {
          teamA: [...prev.picks.teamA],
          teamB: [...prev.picks.teamB],
        };
        newPicks[target.side].splice(target.index, 1);
        const nextSlot = getNextUnfilledSlot(newPicks);
        const totalPicks = newPicks.teamA.filter(Boolean).length + newPicks.teamB.filter(Boolean).length;
        return {
          ...prev,
          picks: newPicks,
          currentSlot: nextSlot,
          isComplete: totalPicks >= 6,
        };
      }
    });
  };

  // Handle brawler lock-in (from recommendation panel or modal)
  const handleSelectBrawlerId = (brawlerId: string) => {
    setSession(prev => {
      // If a specific target slot was selected by the user, populate that specific slot
      if (selectedTargetSlot) {
        if (selectedTargetSlot.type === 'BAN') {
          const bans = [...prev.bans[selectedTargetSlot.side]];
          bans[selectedTargetSlot.index] = brawlerId;
          return {
            ...prev,
            bans: { ...prev.bans, [selectedTargetSlot.side]: bans },
          };
        } else {
          const newPicks = {
            teamA: [...prev.picks.teamA],
            teamB: [...prev.picks.teamB],
          };
          newPicks[selectedTargetSlot.side][selectedTargetSlot.index] = brawlerId;
          const nextSlot = getNextUnfilledSlot(newPicks);
          const totalPicks = newPicks.teamA.filter(Boolean).length + newPicks.teamB.filter(Boolean).length;
          return {
            ...prev,
            picks: newPicks,
            currentSlot: nextSlot,
            isComplete: totalPicks >= 6,
          };
        }
      }

      // If bans are NOT skipped and ban phase is active, fill bans
      const isBanPhase = !skipBans && (prev.bans.teamA.length + prev.bans.teamB.length < 6);
      if (isBanPhase) {
        if (prev.bans.teamA.length <= prev.bans.teamB.length && prev.bans.teamA.length < 3) {
          return {
            ...prev,
            bans: { ...prev.bans, teamA: [...prev.bans.teamA, brawlerId] },
          };
        } else if (prev.bans.teamB.length < 3) {
          return {
            ...prev,
            bans: { ...prev.bans, teamB: [...prev.bans.teamB, brawlerId] },
          };
        }
      } else {
        // Sequential pick (Slot 1 -> Slot 6)
        if (prev.isComplete) return prev;
        const pickingSide = prev.currentSlot === 1 || prev.currentSlot === 4 || prev.currentSlot === 5 ? 'teamA' : 'teamB';
        const newPicks = {
          teamA: [...prev.picks.teamA],
          teamB: [...prev.picks.teamB],
        };
        newPicks[pickingSide] = [...newPicks[pickingSide], brawlerId];
        const nextSlot = getNextUnfilledSlot(newPicks);
        const totalPicks = newPicks.teamA.filter(Boolean).length + newPicks.teamB.filter(Boolean).length;

        return {
          ...prev,
          picks: newPicks,
          currentSlot: nextSlot,
          isComplete: totalPicks >= 6,
        };
      }

      return prev;
    });

    setSelectedTargetSlot(null);
  };

  // Context-aware unavailable brawlers: Blind simultaneous bans allow both teams to ban the same brawler
  const isBanPhase = !skipBans && session.bans.teamA.length + session.bans.teamB.length < 6;

  let unavailableIds: string[] = [];
  if (selectedTargetSlot) {
    if (selectedTargetSlot.type === 'BAN') {
      // Blind bans: Only disable brawlers already banned by this SAME team
      unavailableIds = session.bans[selectedTargetSlot.side];
    } else {
      // Pick phase: Disable ALL banned brawlers from both teams and all picked brawlers
      unavailableIds = [...getAllBannedBrawlers(session), ...getAllPickedBrawlers(session)];
    }
  } else if (isBanPhase) {
    // Ban phase automatic assignment: Disable brawlers banned by the team currently banning
    const currentBanSide = session.bans.teamA.length <= session.bans.teamB.length && session.bans.teamA.length < 3 ? 'teamA' : 'teamB';
    unavailableIds = session.bans[currentBanSide];
  } else {
    // General Pick phase
    unavailableIds = [...getAllBannedBrawlers(session), ...getAllPickedBrawlers(session)];
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Configuration Bar: Map & Coin Flip */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Map Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 text-yellow-400">
              <MapPin className="w-5 h-5" />
              <span className="font-brawl text-lg tracking-wide uppercase">Map & Mode:</span>
            </div>

            <select
              value={selectedMap.id}
              onChange={e => handleMapChange(e.target.value)}
              className="bg-gray-950 border border-gray-800 hover:border-yellow-400 text-white font-bold text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-yellow-400 transition-colors"
            >
              {MAPS.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.mode.replace('_', ' ')}) - {m.terrain}
                </option>
              ))}
            </select>

            <span className="text-xs font-black uppercase px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
              {selectedMap.mode.replace('_', ' ')}
            </span>
            <span className="text-xs font-black uppercase px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {selectedMap.terrain}
            </span>
          </div>

          {/* User Pick Side (Coin Flip), Skip Bans Toggle & Reset */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Coin Flip Side */}
            <div className="flex items-center bg-gray-950 p-1 rounded-xl border border-gray-800">
              <button
                onClick={() => handleSideChange('TEAM_A')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-wider uppercase transition-all ${
                  userSide === 'TEAM_A'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Team A (1st Pick)
              </button>
              <button
                onClick={() => handleSideChange('TEAM_B')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-wider uppercase transition-all ${
                  userSide === 'TEAM_B'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Team B (Last Pick)
              </button>
            </div>

            {/* Skip Bans Toggle */}
            <button
              onClick={() => setSkipBans(!skipBans)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                skipBans
                  ? 'bg-purple-950/60 text-purple-300 border-purple-500/50 shadow-md shadow-purple-500/20'
                  : 'bg-gray-950 text-gray-400 border-gray-800 hover:text-gray-200'
              }`}
            >
              {skipBans ? <FastForward className="w-3.5 h-3.5 text-purple-400" /> : <Shield className="w-3.5 h-3.5" />}
              <span>{skipBans ? 'Bans: Skipped' : 'Bans: Active'}</span>
            </button>

            {/* Preferred Brawlers Pool Button */}
            <button
              onClick={() => setPoolModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider border border-amber-500/50 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 shadow-md shadow-amber-500/10 transition-all cursor-pointer"
            >
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>My Pool ({preferredPool.length > 0 ? `${preferredPool.length} Maxed` : 'All'})</span>
            </button>

            {/* Quick Picker Modal button */}
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 text-xs font-black border border-yellow-500/40 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Browse All</span>
            </button>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Pro Map Advice Banner */}
        {selectedMap.proNotes && (
          <div className="mt-4 flex items-start gap-2.5 bg-yellow-950/30 border border-yellow-500/30 rounded-2xl p-3 text-xs text-yellow-300">
            <Info className="w-4 h-4 shrink-0 text-yellow-400 mt-0.5" />
            <div>
              <span className="font-bold text-yellow-400">Bobby's Map Strategy: </span>
              {selectedMap.proNotes}
            </div>
          </div>
        )}
      </div>

      {/* Main Draft Board (Team A vs Team B) with Click-to-Pick & Click-to-Filter */}
      <DraftBoard
        session={session}
        selectedTargetSlot={selectedTargetSlot}
        onSlotSelect={handleSlotSelect}
        onClearSlot={handleClearSlot}
        onFilterArchetype={handleFilterArchetype}
        onTurnSelect={handleTurnSelect}
      />

      {/* Real-time Recommendations Panel driven by Role Deductions */}
      <RecommendationsPanel
        session={session}
        skipBans={skipBans}
        selectedArchetypeFilter={selectedArchetypeFilter}
        preferredBrawlerIds={preferredPool}
        onOpenPoolModal={() => setPoolModalOpen(true)}
        onFilterChange={setSelectedArchetypeFilter}
        onToggleSkipBans={() => setSkipBans(!skipBans)}
        onTurnSelect={handleTurnSelect}
        onSelectBrawler={handleSelectBrawlerId}
      />

      {/* Brawler Selector Modal */}
      <BrawlerSelectorModal
        isOpen={modalOpen}
        unavailableIds={unavailableIds}
        initialArchetype={selectedArchetypeFilter}
        title={
          selectedTargetSlot
            ? `Assign Brawler to ${selectedTargetSlot.side === 'teamA' ? 'Team A' : 'Team B'} ${
                selectedTargetSlot.type === 'BAN' ? `Ban ${selectedTargetSlot.index + 1}` : `Pick ${selectedTargetSlot.index + 1}`
              }`
            : 'Select Brawler'
        }
        onClose={() => {
          setModalOpen(false);
          setSelectedTargetSlot(null);
        }}
        onSelect={(brawler: Brawler) => handleSelectBrawlerId(brawler.id)}
      />

      {/* Preferred Brawler Pool Modal */}
      <BrawlerPoolModal
        isOpen={poolModalOpen}
        selectedIds={preferredPool}
        onClose={() => setPoolModalOpen(false)}
        onSave={handleSavePool}
      />
    </div>
  );
};
