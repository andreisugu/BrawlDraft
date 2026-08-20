import React from 'react';
import { Trophy, BookOpen, GraduationCap, Sparkles } from 'lucide-react';

interface Props {
  activeTab: 'DRAFT' | 'ACADEMY' | 'GUIDE';
  onTabChange: (tab: 'DRAFT' | 'ACADEMY' | 'GUIDE') => void;
}

export const Header: React.FC<Props> = ({ activeTab, onTabChange }) => {
  return (
    <header className="border-b border-gray-800 bg-[#0B0F19]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('DRAFT')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-500 via-orange-500 to-red-500 p-0.5 shadow-lg shadow-orange-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-gray-950 rounded-[10px] flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-brawl text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500">
                  BRAWLDRAFT
                </span>
                <span className="text-[10px] font-black uppercase bg-yellow-400 text-black px-1.5 py-0.5 rounded tracking-widest">
                  PRO AI
                </span>
              </div>
              <p className="text-xs text-gray-400 hidden sm:block">
                Masterclass Drafting Engine by <span className="text-yellow-400 font-semibold">bobby - brawl stars</span>
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onTabChange('DRAFT')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'DRAFT'
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black shadow-lg shadow-yellow-500/25 scale-105'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Draft Room</span>
            </button>

            <button
              onClick={() => onTabChange('ACADEMY')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'ACADEMY'
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black shadow-lg shadow-yellow-500/25 scale-105'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Pro Academy</span>
              <span className="bg-purple-900/80 text-purple-300 text-[10px] px-1.5 py-0.5 rounded-full font-black border border-purple-500/40">
                16 Quizzes
              </span>
            </button>

            <button
              onClick={() => onTabChange('GUIDE')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'GUIDE'
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black shadow-lg shadow-yellow-500/25 scale-105'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden md:inline">7 Archetypes</span>
              <span className="md:hidden">Guide</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
