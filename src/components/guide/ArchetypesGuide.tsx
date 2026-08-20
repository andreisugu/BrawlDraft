import React, { useState } from 'react';
import { BRAWLERS } from '../../domain/data/brawlers';
import { BrawlerArchetype } from '../../domain/models/types';
import { BrawlerAvatar, ARCHETYPE_ICONS, ARCHETYPE_COLORS } from '../common/BrawlerAvatar';
import { BookOpen } from 'lucide-react';

interface ArchetypeDetail {
  archetype: BrawlerArchetype;
  name: string;
  definingCriterion: string;
  draftRole: string;
  goldenRule: string;
  weaknessAndCounters: string;
  proExamples: string[];
}

const ARCHETYPE_DETAILS: Record<BrawlerArchetype, ArchetypeDetail> = {
  ANTI_TANK: {
    archetype: 'ANTI_TANK',
    name: 'Anti-Tanks (Draft Backbone)',
    definingCriterion: 'High Burst DPS (5k+ in <1s) + Hard CC / Stun / Mute / Self-Peel (e.g. Otis mute/stun, Chester stun/bomb, Crow slow/poison/jump, Colette %HP shred).',
    draftRole: 'Mandatory 1st Pick in Aggro modes (Brawl Ball, Hot Zone, Gem Grab, Heist) or solid 2/3 slot.',
    goldenRule: 'Never draft without an Anti-Tank foundation in aggro modes. Taking the best Anti-Tank first prevents the enemy from playing hyper-aggressive space makers.',
    weaknessAndCounters: 'Vulnerable to long-range Snipers and Control in isolated 1v1s, but easily protected when paired with Space Makers.',
    proExamples: ['crow', 'otis', 'chester', 'colette', 'clancy', 'lou', 'nita', 'moe', 'emz', 'colt'],
  },
  SPACE_MAKER: {
    archetype: 'SPACE_MAKER',
    name: 'Space Makers (Assassins / Aggro)',
    definingCriterion: 'Instant gap-close (dashes, teleports, jumps) + requires 2+ enemy brawlers to peel. Creates immense map space for teammates.',
    draftRole: 'Secures the 4/5 slot or 6th pick to punish squishy snipers/throwers and deny free enemy last picks.',
    goldenRule: 'Space Makers are what separates pros from casuals. Even if not a pure counter on paper, drafting a Space Maker denies the opponent a free last-pick Thrower.',
    weaknessAndCounters: 'Hard countered by Tanks ("Being Bigger") and Anti-Tanks. Cannot 1v1 10k+ HP pools.',
    proExamples: ['kenji', 'kaze', 'mortis', 'shade', 'ollie', 'edgar', 'lily', 'bull', 'bibi', 'darryl', 'melodie', 'chuck'],
  },
  TANK: {
    archetype: 'TANK',
    name: 'Tanks ("Being Bigger")',
    definingCriterion: 'Massive health pools (10,000 to 14,000+ HP), passive super charging, and low mobility gap-closing.',
    draftRole: 'Drafted in 4/5 or 6th pick against enemy Space Makers / low DPS when the enemy lacks Anti-Tanks.',
    goldenRule: 'Tanks win by "Being Bigger". Space makers and low-DPS control brawlers simply run out of ammo and feed your tank supers.',
    weaknessAndCounters: 'Anti-Tanks, Throwers, and Snipers (lack of sudden gap-close makes tanks easy targets if unshielded).',
    proExamples: ['frank', 'draco', 'hank', 'buster', 'rosa'],
  },
  CONTROL: {
    archetype: 'CONTROL',
    name: 'Control (Zone Lockdown)',
    definingCriterion: 'Turrets, traps, area suppression, and long-duration zone lockdown. Beats anti-tanks in 1v1 mid-range duels, but lacks close-range burst CC.',
    draftRole: 'Drafted in 2/3 or 4/5 slot AFTER Anti-Tank is secured. NEVER first pick Control!',
    goldenRule: 'Never first-pick Control brawlers (e.g. Lumi, Meeple, Amber). The enemy will draft Anti-Tank + Space Maker (Lou + Kenji) and run you down.',
    weaknessAndCounters: 'Vulnerable to being "ran down" by Space Makers and aggressive dives.',
    proExamples: ['nyx', 'lumi', 'gene', 'stu', 'leon', 'amber', 'bo', 'pam', 'meeple'],
  },
  SNIPER: {
    archetype: 'SNIPER',
    name: 'Snipers (Long Range: Resilient vs Pure)',
    definingCriterion: 'Single-fire long range burst. Resilient snipers have self-defense (Pierce close burst, R-T split hyper, Gus shield, Angelo water walk, Belle traps).',
    draftRole: 'Dominates Bounty & Knockout. Rare in aggro modes unless exceptionally overtuned (Pierce/Angelo).',
    goldenRule: 'Pure snipers (Piper/Mandy) are unplayable against pro space makers. Prioritize resilient snipers with anti-aggro utility.',
    weaknessAndCounters: 'Space Makers, aggressive high-HP Tanks with shields, and Throwers on walled maps.',
    proExamples: ['pierce', 'angelo', 'belle', 'byron', 'gus', 'rt', 'nani', 'piper'],
  },
  THROWER: {
    archetype: 'THROWER',
    name: 'Throwers (Articulated DPS: 100% Win or Loss)',
    definingCriterion: 'Over-the-wall attack arc. Unstoppable damage if protected, but completely defenseless against aggro dives (except Willow & Berry).',
    draftRole: '6th Pick / Last Pick ONLY (unless Willow or Barry).',
    goldenRule: 'Throwers have zero middle ground: they are either untouchable 100% wins or instant losses. Never pick early.',
    weaknessAndCounters: 'Space Makers (Mortis, Edgar, Kaze, Darryl) and wall-breakers.',
    proExamples: ['sirius', 'larry_lawrie', 'juju', 'berry', 'willow', 'dynamike', 'tick', 'sprout', 'grom'],
  },
  SUPPORT: {
    archetype: 'SUPPORT',
    name: 'Support (Force Multipliers)',
    definingCriterion: 'Speed boosts, mass healing, stat buffs, and positioning cheese (Gray portals). Low raw damage.',
    draftRole: '4/5 or 6th pick flex to cover team weaknesses and empower hypercarries (e.g. Poco healing Draco, Max speeding RT/Gene, Gus shielding Bull).',
    goldenRule: 'Support must ALWAYS be paired with high damage dealers or immortal tanks; otherwise, your team lacks kill power.',
    weaknessAndCounters: 'Low burst DPS; vulnerable to being stat-checked by heavy tanks if lacking damage dealers.',
    proExamples: ['max', 'poco', 'gray', 'kit', 'jay'],
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
              THE 7 PRO DRAFT ARCHETYPES
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Brawl Stars in-game classes are misleading. This is the pro taxonomy formulated by Bobby.
            </p>
          </div>
        </div>

        {/* Bobby's Trait Color Code Cheatsheet */}
        <div className="mt-6 p-4 rounded-2xl bg-gray-950/70 border border-gray-800">
          <span className="text-xs font-black uppercase tracking-wider text-yellow-400 block mb-2">
            Bobby's Pro Trait Color Codes
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
            <div className="flex items-center gap-2 bg-yellow-950/40 border border-yellow-500/30 p-2 rounded-xl text-yellow-300">
              <span className="w-3 h-3 rounded-full bg-yellow-400 shadow" />
              <span>Hypercharge / Buffy</span>
            </div>
            <div className="flex items-center gap-2 bg-red-950/40 border border-red-500/30 p-2 rounded-xl text-red-300">
              <span className="w-3 h-3 rounded-full bg-red-500 shadow" />
              <span>Knockback / Stun / Mute</span>
            </div>
            <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 p-2 rounded-xl text-emerald-300">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow" />
              <span>Wall Break</span>
            </div>
            <div className="flex items-center gap-2 bg-blue-950/40 border border-blue-500/30 p-2 rounded-xl text-blue-300">
              <span className="w-3 h-3 rounded-full bg-blue-500 shadow" />
              <span>Pierce Damage</span>
            </div>
            <div className="flex items-center gap-2 bg-purple-950/40 border border-purple-500/30 p-2 rounded-xl text-purple-300">
              <span className="w-3 h-3 rounded-full bg-purple-400 shadow" />
              <span>Special in Draft</span>
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
                {arch.replace('_', ' ')}
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
            BRAWLERS IN THIS ARCHETYPE ({brawlersInArchetype.length})
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brawlersInArchetype.map(brawler => (
              <div
                key={brawler.id}
                className="bg-gray-950/70 border border-gray-800 rounded-2xl p-4 flex flex-col justify-between hover:border-yellow-400/50 transition-colors"
              >
                <div>
                  <div className="flex items-start gap-3 mb-3">
                    <BrawlerAvatar brawler={brawler} size="md" showTraits={true} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-brawl text-lg text-white">{brawler.name}</span>
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
                          Tier {brawler.tier}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 font-semibold">{brawler.subArchetype}</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed mb-3">
                    {brawler.description}
                  </p>
                </div>

                {brawler.bobbyTip && (
                  <div className="text-[11px] bg-yellow-950/30 border border-yellow-500/20 p-2.5 rounded-xl text-yellow-300">
                    <span className="font-bold text-yellow-400">Bobby Tip: </span>
                    {brawler.bobbyTip}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
