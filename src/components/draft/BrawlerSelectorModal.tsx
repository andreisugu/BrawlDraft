import React, { useState } from 'react';
import { BRAWLERS } from '../../domain/data/brawlers';
import { Brawler } from '../../domain/models/brawler';
import { BrawlerArchetype } from '../../domain/models/types';
import { BrawlerAvatar, ARCHETYPE_ICONS } from '../common/BrawlerAvatar';
import { Search, X, Zap, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  unavailableIds: string[];
  title?: string;
  onClose: () => void;
  onSelect: (brawler: Brawler) => void;
}

export const BrawlerSelectorModal: React.FC<Props> = ({
  isOpen,
  unavailableIds,
  title = 'Select Brawler',
  onClose,
  onSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArchetype, setSelectedArchetype] = useState<BrawlerArchetype | 'ALL'>('ALL');
  const [filterHC, setFilterHC] = useState(false);
  const [filterCC, setFilterCC] = useState(false);

  if (!isOpen) return null;

  const filteredBrawlers = BRAWLERS.filter(brawler => {
    const matchesSearch = brawler.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArchetype = selectedArchetype === 'ALL' || brawler.archetype === selectedArchetype;
    const matchesHC = !filterHC || brawler.hasHypercharge;
    const matchesCC = !filterCC || brawler.hasStunOrMute || brawler.hasKnockback;
    return matchesSearch && matchesArchetype && matchesHC && matchesCC;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-800 bg-gray-950/60">
          <div>
            <h3 className="font-brawl text-2xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
              {title}
            </h3>
            <p className="text-xs text-gray-400">Select a brawler to lock in</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-4 sm:p-6 border-b border-gray-800 space-y-3 bg-gray-900/50">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-5 h-5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search brawlers by name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 transition-colors"
            />
          </div>

          {/* Archetype & Trait Filters */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedArchetype('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                  selectedArchetype === 'ALL'
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
                    onClick={() => setSelectedArchetype(arch)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                      selectedArchetype === arch
                        ? 'bg-yellow-400 text-black shadow-md shadow-yellow-400/20'
                        : 'bg-gray-800/80 text-gray-400 hover:text-white'
                    }`}
                  >
                    {ARCHETYPE_ICONS[arch]}
                    <span>{arch.replace('_', ' ')}</span>
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilterHC(!filterHC)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterHC
                    ? 'bg-yellow-400 text-black font-black'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hypercharge</span>
              </button>

              <button
                onClick={() => setFilterCC(!filterCC)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterCC
                    ? 'bg-red-500 text-white font-black'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Stun / CC</span>
              </button>
            </div>
          </div>
        </div>

        {/* Brawlers Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {filteredBrawlers.map(brawler => {
            const isUnavailable = unavailableIds.includes(brawler.id);

            return (
              <div
                key={brawler.id}
                className="flex flex-col items-center group"
                onClick={() => {
                  if (!isUnavailable) {
                    onSelect(brawler);
                    onClose();
                  }
                }}
              >
                <BrawlerAvatar
                  brawler={brawler}
                  size="md"
                  disabled={isUnavailable}
                  showBobbyColor={true}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
