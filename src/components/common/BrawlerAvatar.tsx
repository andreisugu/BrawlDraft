import React, { useState } from 'react';
import { Brawler } from '../../domain/models/brawler';
import { BrawlerArchetype, BobbyColorTag } from '../../domain/models/types';
import { Shield, Zap, Crosshair, Target, Heart, Bomb, Sparkles, HelpCircle } from 'lucide-react';

interface Props {
  brawler?: Brawler;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  emptyLabel?: string;
  showArchetype?: boolean;
  showBobbyColor?: boolean;
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

export const BOBBY_COLOR_STYLES: Record<BobbyColorTag, { border: string; badgeBg: string; text: string; label: string }> = {
  YELLOW: { border: 'border-yellow-400', badgeBg: 'bg-yellow-400', text: 'text-black', label: 'Hyper / Buff' },
  RED: { border: 'border-red-500', badgeBg: 'bg-red-500', text: 'text-white', label: 'Knockback / Stun' },
  GREEN: { border: 'border-emerald-500', badgeBg: 'bg-emerald-500', text: 'text-black', label: 'Wall Break' },
  BLUE_PIERCE: { border: 'border-blue-600', badgeBg: 'bg-blue-600', text: 'text-white', label: 'Pierce Damage' },
  CYAN_SPECIAL: { border: 'border-cyan-400', badgeBg: 'bg-cyan-400', text: 'text-black', label: 'Special' },
  WHITE_STANDARD: { border: 'border-gray-500', badgeBg: 'bg-gray-400', text: 'text-black', label: 'Standard' },
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
  emptyLabel,
  showArchetype = true,
  showBobbyColor = true,
  selected = false,
  disabled = false,
  onClick,
}) => {
  const [imageError, setImageError] = useState(false);

  if (!brawler) {
    const emptyDimensions = {
      sm: 'w-10 h-10',
      md: 'w-16 h-16',
      lg: 'w-20 h-20',
      xl: 'w-24 h-24',
    }[size];

    return (
      <div
        onClick={disabled ? undefined : onClick}
        className={`${emptyDimensions} rounded-2xl border-2 border-dashed border-gray-700 bg-gray-900/50 flex flex-col items-center justify-center text-gray-500 hover:border-yellow-400/60 transition-colors cursor-pointer`}
      >
        <HelpCircle className="w-4 h-4 opacity-40" />
        {emptyLabel && <span className="text-[9px] uppercase font-bold mt-0.5 opacity-60">{emptyLabel}</span>}
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
  const bobbyColorStyle = BOBBY_COLOR_STYLES[brawler.colorTag];

  // Dynamic fallback gradient based on name
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
      className={`relative group rounded-2xl border-2 transition-all duration-200 select-none flex flex-col items-center justify-center
        ${dimensions}
        ${selected ? 'border-yellow-400 ring-4 ring-yellow-400/80 scale-105 shadow-2xl shadow-yellow-400/40 z-10' : bobbyColorStyle.border}
        ${disabled ? 'opacity-30 grayscale cursor-not-allowed' : 'cursor-pointer hover:scale-105 hover:border-white active:scale-95'}
        bg-gray-950 shadow-md overflow-hidden`}
    >
      {/* High-Resolution Portrait Image or Fallback */}
      {brawler.avatarUrl && !imageError ? (
        <img
          src={brawler.avatarUrl}
          alt={brawler.name}
          onError={() => setImageError(true)}
          loading="lazy"
          className="w-full h-full object-cover object-top scale-110 group-hover:scale-125 transition-transform duration-300"
        />
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <span className="font-brawl text-white drop-shadow-md tracking-wider">
            {brawler.name.slice(0, size === 'sm' ? 2 : 4).toUpperCase()}
          </span>
        </div>
      )}

      {/* Bobby's Legend Color Indicator Dot / Tag */}
      {showBobbyColor && (
        <div
          className={`absolute top-1 right-1 w-3 h-3 rounded-full ${bobbyColorStyle.badgeBg} shadow-lg ring-1.5 ring-black/80 z-10`}
          title={`Bobby Tag: ${bobbyColorStyle.label}`}
        />
      )}

      {/* Archetype Icon Badge */}
      {showArchetype && size !== 'sm' && (
        <div
          className={`absolute top-1 left-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-[9px] font-bold ${archetypeStyle.bg} ${archetypeStyle.text} border ${archetypeStyle.border} backdrop-blur-md z-10`}
        >
          {ARCHETYPE_ICONS[brawler.archetype]}
        </div>
      )}

      {/* Name Footer Bar */}
      {size !== 'sm' && (
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-2 pb-0.5 text-center text-[10px] font-brawl tracking-wider text-gray-100 truncate px-1 z-10">
          {brawler.name}
        </div>
      )}
    </div>
  );
};
