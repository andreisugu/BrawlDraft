import React from 'react';
import { Brawler } from '../../domain/models/brawler';
import { BrawlerArchetype } from '../../domain/models/types';
import { Shield, Zap, Crosshair, Target, Heart, Bomb, Sparkles, HelpCircle } from 'lucide-react';

interface Props {
  brawler?: Brawler;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showArchetype?: boolean;
  showTraits?: boolean;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export const ARCHETYPE_COLORS: Record<BrawlerArchetype, { bg: string; text: string; border: string }> = {
  ANTI_TANK: { bg: 'bg-emerald-950/80', text: 'text-emerald-400', border: 'border-emerald-500/50' },
  SPACE_MAKER: { bg: 'bg-purple-950/80', text: 'text-purple-400', border: 'border-purple-500/50' },
  TANK: { bg: 'bg-amber-950/80', text: 'text-amber-400', border: 'border-amber-500/50' },
  CONTROL: { bg: 'bg-blue-950/80', text: 'text-blue-400', border: 'border-blue-500/50' },
  SNIPER: { bg: 'bg-cyan-950/80', text: 'text-cyan-400', border: 'border-cyan-500/50' },
  THROWER: { bg: 'bg-red-950/80', text: 'text-red-400', border: 'border-red-500/50' },
  SUPPORT: { bg: 'bg-pink-950/80', text: 'text-pink-400', border: 'border-pink-500/50' },
};

export const ARCHETYPE_ICONS: Record<BrawlerArchetype, React.ReactNode> = {
  ANTI_TANK: <Zap className="w-3.5 h-3.5" />,
  SPACE_MAKER: <Sparkles className="w-3.5 h-3.5" />,
  TANK: <Shield className="w-3.5 h-3.5" />,
  CONTROL: <Target className="w-3.5 h-3.5" />,
  SNIPER: <Crosshair className="w-3.5 h-3.5" />,
  THROWER: <Bomb className="w-3.5 h-3.5" />,
  SUPPORT: <Heart className="w-3.5 h-3.5" />,
};

export const BrawlerAvatar: React.FC<Props> = ({
  brawler,
  size = 'md',
  showArchetype = true,
  showTraits = false,
  selected = false,
  disabled = false,
  onClick,
}) => {
  if (!brawler) {
    const emptyDimensions = {
      sm: 'w-10 h-10',
      md: 'w-16 h-16',
      lg: 'w-20 h-20',
      xl: 'w-24 h-24',
    }[size];

    return (
      <div
        className={`${emptyDimensions} rounded-xl border-2 border-dashed border-gray-700 bg-gray-900/50 flex flex-col items-center justify-center text-gray-500`}
      >
        <HelpCircle className="w-5 h-5 opacity-40" />
        <span className="text-[10px] uppercase font-bold mt-0.5 opacity-60">Empty</span>
      </div>
    );
  }

  const dimensions = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-16 h-16 text-sm',
    lg: 'w-20 h-20 text-base',
    xl: 'w-24 h-24 text-lg',
  }[size];

  const archetypeStyle = ARCHETYPE_COLORS[brawler.archetype];

  // Derive simple avatar initial & color based on id hash
  const colors = [
    'from-amber-600 to-orange-700',
    'from-blue-600 to-indigo-800',
    'from-emerald-600 to-teal-800',
    'from-purple-600 to-pink-800',
    'from-rose-600 to-red-800',
    'from-cyan-600 to-blue-800',
  ];
  const colorIndex = brawler.name.charCodeAt(0) % colors.length;
  const gradient = colors[colorIndex];

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`relative group rounded-xl border-2 transition-all duration-200 select-none flex flex-col items-center justify-center
        ${dimensions}
        ${selected ? 'border-yellow-400 ring-2 ring-yellow-400/50 scale-105 shadow-lg shadow-yellow-400/20' : archetypeStyle.border}
        ${disabled ? 'opacity-30 grayscale cursor-not-allowed' : 'cursor-pointer hover:scale-105 hover:border-white/80 active:scale-95'}
        bg-gradient-to-br ${gradient} shadow-md overflow-hidden`}
    >
      {/* Hypercharge indicator */}
      {brawler.hasHypercharge && (
        <div className="absolute top-0.5 right-0.5 bg-yellow-400 text-black text-[9px] font-black px-1 rounded-sm shadow">
          HC
        </div>
      )}

      {/* Center Initials/Name */}
      <span className="font-brawl text-white drop-shadow-md tracking-wider">
        {brawler.name.slice(0, size === 'sm' ? 2 : 4).toUpperCase()}
      </span>

      {/* Full Name Footer on larger avatars */}
      {size !== 'sm' && (
        <div className="absolute bottom-0 inset-x-0 bg-black/75 py-0.5 text-center text-[10px] font-bold text-gray-200 truncate px-1">
          {brawler.name}
        </div>
      )}

      {/* Archetype Badge */}
      {showArchetype && size !== 'sm' && (
        <div
          className={`absolute top-0.5 left-0.5 flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-bold ${archetypeStyle.bg} ${archetypeStyle.text} border ${archetypeStyle.border}`}
        >
          {ARCHETYPE_ICONS[brawler.archetype]}
        </div>
      )}

      {/* Trait indicators */}
      {showTraits && (
        <div className="absolute bottom-5 inset-x-0 flex justify-center gap-0.5">
          {brawler.hasStunOrMute && (
            <span className="w-2 h-2 rounded-full bg-red-500 shadow" title="Stun / Mute" />
          )}
          {brawler.burstDamage >= 8 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow" title="High Burst" />
          )}
          {brawler.traits.includes('GAP_CLOSER') && (
            <span className="w-2 h-2 rounded-full bg-purple-400 shadow" title="Gap Closer" />
          )}
        </div>
      )}
    </div>
  );
};
