import React, { useState, useEffect } from 'react';
import { BRAWLERS } from '../../domain/data/brawlers';
import { BrawlerArchetype } from '../../domain/models/types';
import { BrawlerAvatar, ARCHETYPE_ICONS } from '../common/BrawlerAvatar';
import { Search, X, Check, Star, RotateCcw, CheckSquare, Square } from 'lucide-react';

interface Props {
  isOpen: boolean;
  selectedIds: string[];
  onClose: () => void;
  onSave: (ids: string[]) => void;
}

export const BrawlerPoolModal: React.FC<Props> = ({
  isOpen,
  selectedIds,
  onClose,
  onSave,
}) => {
  const [currentPool, setCurrentPool] = useState<string[]>(selectedIds);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArchetype, setSelectedArchetype] = useState<BrawlerArchetype | 'ALL'>('ALL');

  useEffect(() => {
    if (isOpen) {
      setCurrentPool(selectedIds);
      setSearchTerm('');
    }
  }, [isOpen, selectedIds]);

  if (!isOpen) return null;

  const toggleBrawler = (id: string) => {
    if (currentPool.includes(id)) {
      setCurrentPool(currentPool.filter(bId => bId !== id));
    } else {
      setCurrentPool([...currentPool, id]);
    }
  };

  const handleSelectAll = () => {
    setCurrentPool(BRAWLERS.map(b => b.id));
  };

  const handleClearAll = () => {
    setCurrentPool([]);
  };

  const handlePresetExample = () => {
    // Example from user: Nori, Brock, Byron, Poco, Max, Squeak, Meeple, Bolt, Crow
    const preset = ['nori', 'brock', 'byron', 'poco', 'max', 'squeak', 'meeple', 'bolt', 'crow'];
    setCurrentPool(preset);
  };

  const handleSave = () => {
    onSave(currentPool);
    onClose();
  };

  const filteredBrawlers = BRAWLERS.filter(brawler => {
    const matchesSearch = brawler.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArchetype = selectedArchetype === 'ALL' || brawler.archetype === selectedArchetype;
    return matchesSearch && matchesArchetype;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-800 bg-gray-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <Star className="w-6 h-6 fill-amber-400" />
            </div>
            <div>
              <h3 className="font-brawl text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400">
                MY PREFERRED / MAXED BRAWLER POOL
              </h3>
              <p className="text-xs text-gray-400">
                Select brawlers in your roster. BrawlDraft will prioritize the <strong>Top 3 best picks</strong> from your pool!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls & Search */}
        <div className="p-4 sm:p-6 border-b border-gray-800 space-y-3 bg-gray-900/50">
          {/* Quick Presets & Batch Select */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400">
                Selected: <strong className="text-amber-400">{currentPool.length}</strong> / {BRAWLERS.length} brawlers
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handlePresetExample}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>My Quick Preset (9 Brawlers)</span>
              </button>
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Select All</span>
              </button>
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-5 h-5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name to toggle in your pool..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Archetype Filters */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedArchetype('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                selectedArchetype === 'ALL'
                  ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            {(['ANTI_TANK', 'SPACE_MAKER', 'TANK', 'CONTROL', 'SNIPER', 'THROWER', 'SUPPORT'] as BrawlerArchetype[]).map(
              arch => (
                <button
                  key={arch}
                  onClick={() => setSelectedArchetype(arch)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                    selectedArchetype === arch
                      ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                      : 'bg-gray-800/80 text-gray-400 hover:text-white'
                  }`}
                >
                  {ARCHETYPE_ICONS[arch]}
                  <span>{arch.replace('_', ' ')}</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Brawlers Grid with Active Checkboxes */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {filteredBrawlers.map(brawler => {
            const isSelected = currentPool.includes(brawler.id);

            return (
              <div
                key={brawler.id}
                onClick={() => toggleBrawler(brawler.id)}
                className={`relative flex flex-col items-center p-1.5 rounded-2xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-amber-950/40 border-amber-400/80 shadow-md shadow-amber-500/20 scale-105 ring-2 ring-amber-400/40'
                    : 'bg-gray-950/40 border-gray-800 opacity-60 hover:opacity-100 hover:border-gray-700'
                }`}
              >
                <BrawlerAvatar
                  brawler={brawler}
                  size="md"
                  showBobbyColor={true}
                  showArchetype={true}
                />

                {isSelected && (
                  <div className="absolute top-1 right-1 bg-amber-400 text-black rounded-full p-1 shadow-md">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-gray-800 bg-gray-950/80 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {currentPool.length === 0
              ? '⚠️ When pool is empty, all 107 brawlers are considered available.'
              : `Active Pool: ${currentPool.length} Brawlers`}
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              Save & Apply Pool
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
