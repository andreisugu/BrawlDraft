import React, { useState } from 'react';
import { BRAWLERS } from '../../domain/data/brawlers';
import { BrawlerArchetype } from '../../domain/models/types';
import { BrawlerAvatar, ARCHETYPE_ICONS, ARCHETYPE_COLORS, BOBBY_COLOR_STYLES } from '../common/BrawlerAvatar';
import { BookOpen } from 'lucide-react';

interface ArchetypeDetail {
  archetype: BrawlerArchetype;
  name: string;
  count: number;
  definingCriterion: string;
  draftRole: string;
  goldenRule: string;
  weaknessAndCounters: string;
}

const ARCHETYPE_DETAILS: Record<BrawlerArchetype, ArchetypeDetail> = {
  ANTI_TANK: {
    archetype: 'ANTI_TANK',
    name: 'Anti-Tank (26 Brawlers)',
    count: 26,
    definingCriterion: 'High Burst DPS (5k+ in <1s) or Hard CC / Stun / Mute / Self-Peel (e.g. Otis mute/stun, Chester stun/bomb, Crow slow/poison/jump, Colette %HP shred).',
    draftRole: 'Mandatory 1st Pick in Aggro modes (Brawl Ball, Hot Zone, Gem Grab, Heist) or solid 2/3 slot.',
    goldenRule: 'Never draft without an Anti-Tank foundation in aggro modes. Taking the best Anti-Tank first prevents the enemy from playing aggressive space makers.',
    weaknessAndCounters: 'Vulnerable to long-range Snipers and Control in isolated 1v1s, but easily protected when paired with Space Makers.',
  },
  SPACE_MAKER: {
    archetype: 'SPACE_MAKER',
    name: 'Sp./A - Space Maker / Assassin (19 Brawlers)',
    count: 19,
    definingCriterion: 'Instant gap-close (dashes, teleports, jumps) + requires 2+ enemy brawlers to peel. Creates immense map space for teammates.',
    draftRole: 'Secures the 4/5 slot or 6th pick to punish squishy snipers/throwers and deny free enemy last picks.',
    goldenRule: 'Space Makers are what separates pros from casuals. Even if not a pure counter on paper, drafting a Space Maker denies the opponent a free last-pick Thrower.',
    weaknessAndCounters: 'Hard countered by Tanks ("Being Bigger") and Anti-Tanks. Cannot 1v1 10k+ HP pools.',
  },
  TANK: {
    archetype: 'TANK',
    name: 'Tank (10 Brawlers)',
    count: 10,
    definingCriterion: 'Massive health pools (10,000 to 14,000+ HP), passive super charging, and low mobility gap-closing.',
    draftRole: 'Drafted in 4/5 or 6th pick against enemy Space Makers / low DPS when the enemy lacks Anti-Tanks.',
    goldenRule: 'Tanks win by "Being Bigger". Space makers and low-DPS control brawlers simply run out of ammo and feed your tank supers.',
    weaknessAndCounters: 'Anti-Tanks, Throwers, and Snipers (lack of sudden gap-close makes tanks easy targets if unshielded).',
  },
  CONTROL: {
    archetype: 'CONTROL',
    name: 'Control (17 Brawlers)',
    count: 17,
    definingCriterion: 'Turrets, traps, area suppression, and long-duration zone lockdown. Beats anti-tanks in 1v1 mid-range duels, but lacks close-range burst CC.',
    draftRole: 'Drafted in 2/3 or 4/5 slot AFTER Anti-Tank is secured. NEVER first pick Control!',
    goldenRule: 'Never first-pick Control brawlers (e.g. Lumi, Meeple, Amber). The enemy will draft Anti-Tank + Space Maker (Lou + Kenji) and run you down.',
    weaknessAndCounters: 'Vulnerable to being "ran down" by Space Makers and aggressive dives.',
  },
  SNIPER: {
    archetype: 'SNIPER',
    name: 'Sniper (11 Brawlers)',
    count: 11,
    definingCriterion: 'Single-fire long range burst. Resilient snipers have self-defense (Pierce close burst, R-T split hyper, Gus shield, Angelo water walk, Belle traps).',
    draftRole: 'Dominates Bounty & Knockout. Rare in aggro modes unless exceptionally overtuned (Pierce/Angelo).',
    goldenRule: 'Pure snipers (Piper/Mandy) are unplayable against pro space makers. Prioritize resilient snipers with anti-aggro utility.',
    weaknessAndCounters: 'Space Makers, aggressive high-HP Tanks with shields, and Throwers on walled maps.',
  },
  THROWER: {
    archetype: 'THROWER',
    name: 'Thrower (11 Brawlers)',
    count: 11,
    definingCriterion: 'Over-the-wall attack arc. Unstoppable damage if protected, but completely defenseless against aggro dives (except Willow & Berry).',
    draftRole: '6th Pick / Last Pick ONLY (unless Willow or Barry).',
    goldenRule: 'Throwers have zero middle ground: they are either untouchable 100% wins or instant losses. Never pick early.',
    weaknessAndCounters: 'Space Makers (Mortis, Edgar, Kaze, Darryl) and wall-breakers.',
  },
  SUPPORT: {
    archetype: 'SUPPORT',
    name: 'Support (7 Brawlers)',
    count: 7,
    definingCriterion: 'Speed boosts, mass healing, stat buffs, and positioning cheese (Gray portals). Low raw damage.',
    draftRole: '4/5 or 6th pick flex to cover team weaknesses and empower hypercarries (e.g. Poco healing Draco, Max speeding RT/Gene, Gus shielding Bull).',
    goldenRule: 'Support must ALWAYS be paired with high damage dealers or immortal tanks; otherwise, your team lacks kill power.',
    weaknessAndCounters: 'Low burst DPS; vulnerable to being stat-checked by heavy tanks if lacking damage dealers.',
  },
};

export const ArchetypesGuide: React.FC = () => {
  const [activeArchetype, setActiveArchetype] = useState<BrawlerArchetype>('ANTI_TANK');

  const detail = ARCHETYPE_DETAILS[activeArchetype];
  const brawlersInArchetype = BRAWLERS.filter(b => b.archetype === activeArchetype);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-yellow-400" />
          <div>
            <h2 className="font-brawl text-2xl sm:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500">
              OFFICIAL BRAWLERS ROLE & ABILITY MAP
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Extracted directly from Bobby's Pro Masterclass Infographic (101 Brawlers Across 7 Archetypes).
            </p>
          </div>
        </div>

        {/* Bobby's Trait Color Code Cheatsheet */}
        <div className="mt-6 p-4 rounded-2xl bg-gray-950/70 border border-gray-800">
          <span className="text-xs font-black uppercase tracking-wider text-yellow-400 block mb-2">
            Bobby's Ability & Trait Legend
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div className="flex items-center gap-2 bg-yellow-950/40 border border-yellow-500/30 p-2 rounded-xl text-yellow-300 font-bold">
              <span className="w-3 h-3 rounded-full bg-yellow-400 shadow" />
              <span>Good Hyper / Buff</span>
            </div>
            <div className="flex items-center gap-2 bg-red-950/40 border border-red-500/30 p-2 rounded-xl text-red-300 font-bold">
              <span className="w-3 h-3 rounded-full bg-red-500 shadow" />
              <span>Knockback / Stun</span>
            </div>
            <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 p-2 rounded-xl text-emerald-300 font-bold">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow" />
              <span>Wall Break</span>
            </div>
            <div className="flex items-center gap-2 bg-blue-950/40 border border-blue-500/30 p-2 rounded-xl text-blue-300 font-bold">
              <span className="w-3 h-3 rounded-full bg-blue-600 shadow" />
              <span>Pierce Damage</span>
            </div>
            <div className="flex items-center gap-2 bg-cyan-950/40 border border-cyan-500/30 p-2 rounded-xl text-cyan-300 font-bold">
              <span className="w-3 h-3 rounded-full bg-cyan-400 shadow" />
              <span>Special in Draft</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 p-2 rounded-xl text-gray-300 font-bold">
              <span className="w-3 h-3 rounded-full bg-gray-400 shadow" />
              <span>Standard / None</span>
            </div>
          </div>
        </div>
      </div>

      {/* Archetype Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {(Object.keys(ARCHETYPE_DETAILS) as BrawlerArchetype[]).map(arch => {
          const isSelected = activeArchetype === arch;
          const style = ARCHETYPE_COLORS[arch];

          return (
            <button
              key={arch}
              onClick={() => setActiveArchetype(arch)}
              className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                isSelected
                  ? 'bg-yellow-400 text-black border-yellow-400 shadow-xl shadow-yellow-400/20 scale-105 font-black'
                  : 'bg-gray-900/80 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
              }`}
            >
              <div
                className={`p-2 rounded-xl ${
                  isSelected ? 'bg-black text-yellow-400' : `${style.bg} ${style.text}`
                }`}
              >
                {ARCHETYPE_ICONS[arch]}
              </div>
              <span className="text-xs uppercase font-bold tracking-wider text-center">
                {arch.replace('_', ' ')} ({ARCHETYPE_DETAILS[arch].count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Detailed Archetype Card */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-yellow-400 text-black shadow-lg shadow-yellow-400/20">
              {ARCHETYPE_ICONS[activeArchetype]}
            </div>
            <div>
              <h3 className="font-brawl text-2xl text-white">{detail.name}</h3>
              <p className="text-xs text-yellow-400 font-semibold mt-0.5">
                Pro Drafting Definition & Strategic Role
              </p>
            </div>
          </div>
        </div>

        {/* 4 Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-950/60 p-4 rounded-2xl border border-gray-800 space-y-1.5">
            <span className="text-xs font-black uppercase text-blue-400">1. Defining Criterion</span>
            <p className="text-xs text-gray-300 leading-relaxed">{detail.definingCriterion}</p>
          </div>

          <div className="bg-gray-950/60 p-4 rounded-2xl border border-gray-800 space-y-1.5">
            <span className="text-xs font-black uppercase text-purple-400">2. Typical Draft Slot</span>
            <p className="text-xs text-gray-300 leading-relaxed">{detail.draftRole}</p>
          </div>

          <div className="bg-gray-950/60 p-4 rounded-2xl border border-yellow-500/30 space-y-1.5">
            <span className="text-xs font-black uppercase text-yellow-400">3. Bobby's Golden Rule</span>
            <p className="text-xs text-gray-200 leading-relaxed font-medium">{detail.goldenRule}</p>
          </div>

          <div className="bg-gray-950/60 p-4 rounded-2xl border border-red-500/30 space-y-1.5">
            <span className="text-xs font-black uppercase text-red-400">4. Weaknesses & Counters</span>
            <p className="text-xs text-gray-300 leading-relaxed">{detail.weaknessAndCounters}</p>
          </div>
        </div>

        {/* Brawler Roster in Archetype */}
        <div className="space-y-3">
          <h4 className="font-brawl text-lg text-white">
            BRAWLERS IN THIS CATEGORY ({brawlersInArchetype.length})
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {brawlersInArchetype.map(brawler => {
              const bobbyColor = BOBBY_COLOR_STYLES[brawler.colorTag];

              return (
                <div
                  key={brawler.id}
                  className="bg-gray-950/70 border border-gray-800 rounded-2xl p-3 flex items-center justify-between hover:border-yellow-400/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <BrawlerAvatar brawler={brawler} size="md" showBobbyColor={true} />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-brawl text-base text-white">{brawler.name}</span>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
                          {brawler.tier}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-black inline-block mt-0.5 ${bobbyColor.badgeBg} ${bobbyColor.text}`}
                      >
                        {bobbyColor.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
