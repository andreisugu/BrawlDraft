import { BRAWLERS, BRAWLER_MAP } from '../data/brawlers';
import { Brawler } from '../models/brawler';
import { DraftSession, getAllBannedBrawlers, getAllPickedBrawlers, getPickTeamForSlot } from '../models/draftSession';
import { BrawlerArchetype, GameMode, getMacroMeta } from '../models/types';

export interface DraftDeduction {
  id: string;
  targetArchetypes: BrawlerArchetype[];
  title: string;
  reason: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  icon: string;
}

export interface BanRecommendation {
  brawler: Brawler;
  score: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  strategy: 'DENY_FIRST_PICK' | 'BAN_FLEX_23' | 'BAN_CHEESE_LAST_PICK';
  rationale: string;
}

export interface PickRecommendation {
  brawler: Brawler;
  score: number;
  grade: 'S+' | 'S' | 'A' | 'B';
  roleInDraft: string;
  matchedDeduction?: string;
  rationale: string;
  countersCount: number;
  riskWarning?: string;
}

export interface CompEvaluation {
  hasAntiTank: boolean;
  hasSpaceMakerOrTank: boolean;
  hasDamageDealer: boolean;
  hasSupport: boolean;
  burstRating: number; // 0-100
  effectiveHpRating: number; // 0-100
  rangeRating: number; // 0-100
  archetypeCounts: Record<BrawlerArchetype, number>;
  vulnerabilities: string[];
  strengths: string[];
  recommendedRoles: BrawlerArchetype[];
  predictedEnemyNext?: {
    predictedRoles: BrawlerArchetype[];
    counterRoles: BrawlerArchetype[];
    reason: string;
  };
  compSummary: string;
}

export class DraftEngine {
  /**
   * Evaluates team composition breakdown and metrics with draft context
   */
  public static evaluateComp(
    brawlers: Brawler[],
    context?: {
      isFirstPickTeam?: boolean;
      currentSlot?: number;
      isAlly?: boolean;
      enemyBrawlers?: Brawler[];
      mode?: GameMode;
    }
  ): CompEvaluation {
    const archetypeCounts: Record<BrawlerArchetype, number> = {
      ANTI_TANK: 0,
      SPACE_MAKER: 0,
      TANK: 0,
      CONTROL: 0,
      SNIPER: 0,
      THROWER: 0,
      SUPPORT: 0,
    };

    let hasAntiTank = false;
    let hasSpaceMakerOrTank = false;
    let hasDamageDealer = false;
    let hasSupport = false;

    brawlers.forEach(b => {
      archetypeCounts[b.archetype] = (archetypeCounts[b.archetype] || 0) + 1;
      if (b.archetype === 'ANTI_TANK') hasAntiTank = true;
      if (b.archetype === 'SPACE_MAKER' || b.archetype === 'TANK') hasSpaceMakerOrTank = true;
      if (b.burstDamage >= 8) hasDamageDealer = true;
      if (b.archetype === 'SUPPORT') hasSupport = true;
    });

    const burstScore = brawlers.reduce((sum, b) => sum + b.burstDamage, 0);
    const burstRating = Math.min(100, Math.round((burstScore / (Math.max(1, brawlers.length) * 10)) * 100));

    const totalHealth = brawlers.reduce((sum, b) => sum + b.health, 0);
    const effectiveHpRating = Math.min(100, Math.round((totalHealth / (Math.max(1, brawlers.length) * 11000)) * 100));

    const rangeScore = brawlers.reduce((sum, b) => {
      if (b.archetype === 'SNIPER') return sum + 10;
      if (b.archetype === 'THROWER' || b.archetype === 'CONTROL') return sum + 8;
      if (b.archetype === 'ANTI_TANK') return sum + 6;
      return sum + 3;
    }, 0);
    const rangeRating = Math.min(100, Math.round((rangeScore / (Math.max(1, brawlers.length) * 10)) * 100));

    const vulnerabilities: string[] = [];
    const strengths: string[] = [];
    const recommendedRoles: BrawlerArchetype[] = [];
    let predictedEnemyNext: CompEvaluation['predictedEnemyNext'] = undefined;
    let compSummary = '';

    const isFirstPickTeam = context?.isFirstPickTeam ?? true;
    const currentSlot = context?.currentSlot ?? 1;
    const enemyB = context?.enemyBrawlers || [];
    const enemyHasSpace = enemyB.some(b => b.archetype === 'SPACE_MAKER' || b.archetype === 'TANK');
    const enemyHasAntiTank = enemyB.some(b => b.archetype === 'ANTI_TANK');

    if (brawlers.length >= 1 || currentSlot >= 4) {
      if (!hasAntiTank) {
        vulnerabilities.push('No Anti-Tank: Vulnerable to aggressive Tanks and Space Makers.');
      } else {
        strengths.push('Solid Anti-Tank foundation shuts down aggressive dives.');
      }

      if (hasSpaceMakerOrTank) {
        strengths.push('Space Maker / Dive secured: Denies enemy free Thrower / Sniper abuse.');
      }

      if (isFirstPickTeam && !hasSpaceMakerOrTank && currentSlot >= 4) {
        vulnerabilities.push('No Space Maker: Leaves your team open to free enemy last-pick Throwers/Snipers.');
      } else if (!isFirstPickTeam && !hasSpaceMakerOrTank && brawlers.length >= 2) {
        vulnerabilities.push('Low Aggro Threat: May struggle to dive and pressure long-range backliners.');
      }

      if (!hasDamageDealer && brawlers.length >= 2) {
        vulnerabilities.push('Low Burst DPS: High-HP Tanks can stat-check and walk through your team.');
      }
    }

    if (brawlers.length === 0) {
      recommendedRoles.push('ANTI_TANK', 'CONTROL');
      compSummary = 'First Pick: Secure an Anti-Tank foundation or top S-Tier Mid controller.';
    } else if (brawlers.length === 1) {
      if (hasAntiTank) {
        recommendedRoles.push('SPACE_MAKER', 'CONTROL', 'TANK');
        compSummary = 'Solid Anti-Tank base. Next: Add a Space Maker dive or Area Controller.';
      } else if (hasSpaceMakerOrTank) {
        recommendedRoles.push('ANTI_TANK', 'SUPPORT', 'CONTROL');
        compSummary = 'Aggressive dive opener. Next: Add Anti-Tank stabilization or Support.';
      } else {
        recommendedRoles.push('ANTI_TANK', 'SPACE_MAKER');
        compSummary = 'Mid-range start. Next: Secure Anti-Tank or Space Maker.';
      }
    } else if (brawlers.length === 2) {
      if (hasAntiTank && hasSpaceMakerOrTank) {
        recommendedRoles.push('CONTROL', 'ANTI_TANK', 'TANK', 'SUPPORT');
        compSummary = 'Balanced Foundation (Anti-Tank + Space Maker).';

        if (isFirstPickTeam && currentSlot === 5) {
          if (!enemyHasSpace) {
            predictedEnemyNext = {
              predictedRoles: ['SPACE_MAKER', 'TANK'],
              counterRoles: ['CONTROL', 'ANTI_TANK'],
              reason: 'Enemy lacks aggro dive. Preempt with Hard CC / Zone Lockdown (Lumi, Otis, Surge, Gale, Naija).',
            };
          } else if (!enemyHasAntiTank) {
            predictedEnemyNext = {
              predictedRoles: ['ANTI_TANK', 'TANK'],
              counterRoles: ['ANTI_TANK', 'CONTROL'],
              reason: 'Enemy lacks Anti-Tank. Preempt with Tank Shredders (Clancy, Colette, Chester, Griff).',
            };
          } else {
            if (context?.mode === 'HEIST') {
              predictedEnemyNext = {
                predictedRoles: ['THROWER', 'CONTROL', 'ANTI_TANK'],
                counterRoles: ['THROWER', 'CONTROL', 'ANTI_TANK'],
                reason: 'Both teams secured core. Lock in top Safe Melters / Wall Control (Chuck, Berry, Dynamike, Clancy, Lumi).',
              };
            } else {
              predictedEnemyNext = {
                predictedRoles: ['CONTROL', 'SUPPORT', 'TANK'],
                counterRoles: ['CONTROL', 'SUPPORT', 'ANTI_TANK'],
                reason: 'Both teams secured core. Lock in dominant Mid Controller / Support (Wendy, Lumi, Crow, Otis, Naija).',
              };
            }
          }
        }
      } else if (!hasSpaceMakerOrTank) {
        recommendedRoles.push('SPACE_MAKER', 'TANK');
        compSummary = 'Missing Dive Threat. Next: Space Maker mandatory to lock out enemy 6th pick throwers.';
      } else if (!hasAntiTank) {
        recommendedRoles.push('ANTI_TANK');
        compSummary = 'Vulnerable to Tanks. Next: Anti-Tank mandatory.';
      } else {
        recommendedRoles.push('CONTROL', 'TANK');
        compSummary = 'Next: Add Zone Control or frontline durability.';
      }
    } else {
      compSummary = 'Full 3v3 team drafted.';
    }

    return {
      hasAntiTank,
      hasSpaceMakerOrTank,
      hasDamageDealer,
      hasSupport,
      burstRating,
      effectiveHpRating,
      rangeRating,
      archetypeCounts,
      vulnerabilities,
      strengths,
      recommendedRoles,
      predictedEnemyNext,
      compSummary,
    };
  }

  public static getDeductions(session: DraftSession): DraftDeduction[] {
    const pickingSide = getPickTeamForSlot(session.currentSlot);
    const allyPickedIds = pickingSide === 'TEAM_A' ? session.picks.teamA : session.picks.teamB;
    const enemyPickedIds = pickingSide === 'TEAM_A' ? session.picks.teamB : session.picks.teamA;

    const allyBrawlers = allyPickedIds.map(id => BRAWLER_MAP[id]).filter(Boolean);
    const enemyBrawlers = enemyPickedIds.map(id => BRAWLER_MAP[id]).filter(Boolean);

    const allyComp = this.evaluateComp(allyBrawlers, { isFirstPickTeam: pickingSide === 'TEAM_A', currentSlot: session.currentSlot, enemyBrawlers, mode: session.map.mode });
    const enemyComp = this.evaluateComp(enemyBrawlers, { isFirstPickTeam: pickingSide !== 'TEAM_A', currentSlot: session.currentSlot, enemyBrawlers: allyBrawlers, mode: session.map.mode });
    const macroMeta = getMacroMeta(session.map.mode);

    const deductions: DraftDeduction[] = [];

    if (session.currentSlot === 1 && macroMeta === 'AGGRO') {
      deductions.push({
        id: 'first_pick_antitank',
        targetArchetypes: ['ANTI_TANK'],
        title: 'Draft Rule #1: First Pick Best Available Anti-Tank',
        reason: 'In aggro modes (Brawl Ball, Hot Zone, Gem Grab, Heist), the #1 first pick is ALWAYS the best available Anti-Tank (Crow, Lou, Otis, Chester, Clancy). It prevents the enemy from playing aggressive space makers.',
        priority: 'CRITICAL',
        icon: '⚡',
      });
    }

    if (macroMeta === 'AGGRO' && !allyComp.hasAntiTank && session.currentSlot > 1 && session.currentSlot < 6) {
      deductions.push({
        id: 'missing_antitank',
        targetArchetypes: ['ANTI_TANK'],
        title: 'Mandatory Fix: Secure an Anti-Tank Backbone',
        reason: 'Your team currently has NO Anti-Tank. Without an Anti-Tank, the enemy will draft aggressive Tanks and Space Makers and run you down.',
        priority: 'CRITICAL',
        icon: '🛡️',
      });
    }

    if ((session.currentSlot === 4 || session.currentSlot === 5) && !allyComp.hasSpaceMakerOrTank) {
      deductions.push({
        id: 'spacemaker_lockout',
        targetArchetypes: ['SPACE_MAKER'],
        title: 'Space Maker Lockout: Deny Enemy Free Last Pick',
        reason: 'Your team currently has NO Space Maker or aggressive dive threat. In Slot 4/5, you MUST draft a Space Maker (Kenji, Kaze, Ollie, Bull, Mortis, Lily, Shade) to prevent the enemy from having a free, uncontested 6th pick Thrower or Sniper.',
        priority: 'CRITICAL',
        icon: '✨',
      });
    }

    if (session.currentSlot === 5 && allyComp.hasAntiTank && allyComp.hasSpaceMakerOrTank) {
      if (!enemyComp.hasSpaceMakerOrTank) {
        deductions.push({
          id: 'preempt_enemy_dive',
          targetArchetypes: ['CONTROL', 'ANTI_TANK'],
          title: '🔮 Preempt Enemy 6th Pick: Anti-Dive & Zone Control',
          reason: 'Enemy comp lacks dive/space and desperately needs a Space Maker or Tank on 6th pick. Lock in Hard CC / Zone Lockdown (Lumi, Otis, Surge, Gale, Nori, Naija) to preemptively render their last pick ineffective.',
          priority: 'HIGH',
          icon: '🔮',
        });
      } else if (!enemyComp.hasAntiTank) {
        deductions.push({
          id: 'preempt_enemy_tank',
          targetArchetypes: ['ANTI_TANK', 'CONTROL'],
          title: '🔮 Preempt Enemy 6th Pick: Heavy Tank Shredder',
          reason: 'Enemy lacks anti-tank and may try to 6th-pick a heavy Tank (Frank/Draco). Lock in tank shredding control (Colette, Clancy, Chester, Griff) to permanently deny that win condition.',
          priority: 'HIGH',
          icon: '🔮',
        });
      } else {
        if (session.map.mode === 'HEIST') {
          deductions.push({
            id: 'heist_safe_race',
            targetArchetypes: ['THROWER', 'CONTROL', 'ANTI_TANK'],
            title: '🎯 Heist Safe Melters & Wall Control',
            reason: 'Both sides have Anti-Tank + Space Maker. Lock in top Heist safe melters and wall controllers (Chuck, Berry, Dynamike, Clancy, Lumi, Crow) to win the race.',
            priority: 'HIGH',
            icon: '🎯',
          });
        } else {
          deductions.push({
            id: 'comp_rounding',
            targetArchetypes: ['CONTROL', 'SUPPORT', 'ANTI_TANK'],
            title: '👑 S-Tier Comp Rounding & Mid Lockdown',
            reason: 'Both sides have Anti-Tank + Space Maker. Lock in dominant controllers or support (Wendy, Lumi, Crow, Otis, Naija) to control mid-map.',
            priority: 'HIGH',
            icon: '👑',
          });
        }
      }
    }

    const enemySquishies = enemyBrawlers.filter(
      e => e.archetype === 'SNIPER' || e.archetype === 'THROWER' || (e.archetype === 'CONTROL' && e.burstDamage <= 6)
    );
    if (!allyComp.hasSpaceMakerOrTank && (enemySquishies.length >= 1 || (enemyComp.burstRating < 65 && enemyBrawlers.length >= 1))) {
      if (!deductions.some(d => d.id === 'spacemaker_lockout')) {
        deductions.push({
          id: 'spacemaker_punish',
          targetArchetypes: ['SPACE_MAKER'],
          title: 'Space Maker Deduction: Punish Low DPS & Dive Squishies',
          reason: `Enemy drafted ${enemySquishies.length} squishy/low-burst brawlers. A Space Maker closes distance with dashes/jumps, forces 2+ enemies to peel, and locks out enemy free throwers.`,
          priority: 'HIGH',
          icon: '✨',
        });
      }
    }

    // Deduction 5: Tank Stat-Check ("Being Bigger")
    if (enemyComp.archetypeCounts.SPACE_MAKER > 0 && enemyComp.archetypeCounts.ANTI_TANK === 0) {
      deductions.push({
        id: 'tank_stat_check',
        targetArchetypes: ['TANK'],
        title: 'Tank Stat-Check Deduction: "Being Bigger"',
        reason: 'Enemy drafted Space Makers/Assassins with NO Anti-Tank. Tanks possess 10k-14k HP and stat-check them in 1v1s (Space Makers run out of ammo and feed your supers).',
        priority: 'HIGH',
        icon: '🧱',
      });
    }

    // Deduction 6: 6th Pick Free Thrower Win Condition (Uncontested)
    if (session.currentSlot === 6 && enemyComp.archetypeCounts.SPACE_MAKER === 0 && enemyBrawlers.length === 3) {
      deductions.push({
        id: 'free_thrower_win',
        targetArchetypes: ['THROWER'],
        title: '100% Win Condition: Uncontested Thrower',
        reason: 'The enemy team drafted ZERO Space Makers or dive threats. A 6th pick Thrower is completely untouchable and results in a free 100% win.',
        priority: 'CRITICAL',
        icon: '💣',
      });
    }

    // Deduction 7: Immortal Tank Enabler (Ally Tank + Enemy lacks Heavy Tank Shredders)
    const heavyTankShredders = ['colette', 'chester', 'clancy', 'crow', 'otis'];
    const enemyHasHeavyShredder = enemyBrawlers.some(e => heavyTankShredders.includes(e.id));
    if (allyComp.archetypeCounts.TANK > 0 && !enemyHasHeavyShredder && enemyBrawlers.length >= 2) {
      deductions.push({
        id: 'support_healer',
        targetArchetypes: ['SUPPORT', 'TANK', 'THROWER'],
        title: 'Support Multiplier Deduction: Immortal Tank Rush',
        reason: 'Enemy lacks dedicated heavy tank shredders (Colette/Chester/Clancy). Poco/Berry healing turns your tank immortal, or Frank adds another massive HP stat-check.',
        priority: 'HIGH',
        icon: '💖',
      });
    }

    // Deduction 8: Resilient Snipers / Flex 2/3 in Passive Meta
    if (macroMeta === 'PASSIVE' && (session.currentSlot === 2 || session.currentSlot === 3)) {
      deductions.push({
        id: 'resilient_snipers',
        targetArchetypes: ['SNIPER'],
        title: 'Resilient Snipers Deduction: 2/3 Flex Counter-Picks',
        reason: 'Against long-range anchors (e.g. Pierce), secure resilient snipers (Nani, Belle, Byron, Gus, RT) to stabilize your comp.',
        priority: 'HIGH',
        icon: '🎯',
      });
    }

    // Deduction 9: Mode Objectives
    if (session.map.mode === 'HEIST') {
      deductions.push({
        id: 'heist_objective',
        targetArchetypes: ['THROWER', 'ANTI_TANK', 'CONTROL', 'SPACE_MAKER'],
        title: 'Heist Objective: Safe Shredding & Race Damage',
        reason: 'Heist requires safe burst and wall control (Chuck, Berry, Dynamike, Clancy, Colt, Bull, Crow). If facing a Chuck, do not try to defend—race and out-damage on the opposite safe!',
        priority: 'MEDIUM',
        icon: '🎯',
      });
    } else if (session.map.mode === 'HOT_ZONE') {
      deductions.push({
        id: 'hotzone_objective',
        targetArchetypes: ['ANTI_TANK', 'CONTROL'],
        title: 'Hot Zone Objective: Continuous Area Lockdown',
        reason: 'Hot Zone favors brawlers with continuous zone denial (Lou freeze, Clancy Stage 3 burst, Finx, Juju dive).',
        priority: 'MEDIUM',
        icon: '🔥',
      });
    } else if (macroMeta === 'PASSIVE') {
      deductions.push({
        id: 'passive_objective',
        targetArchetypes: ['SNIPER', 'CONTROL'],
        title: 'Bounty & Knockout Objective: Resilient Anchors & Flex',
        reason: 'Prioritize resilient snipers (Pierce, RT, Belle, Byron, Gus) and high-value Knockout Hypercharges (Meeple, Bo).',
        priority: 'MEDIUM',
        icon: '🎯',
      });
    }

    return deductions;
  }

  /**
   * Recommends bans using Bobby's asymmetric first-pick theory
   */
  public static recommendBans(session: DraftSession): BanRecommendation[] {
    const macroMeta = getMacroMeta(session.map.mode);
    const userIsFirstPick = session.userSide === 'TEAM_A';
    const banned = getAllBannedBrawlers(session);

    const availableBrawlers = BRAWLERS.filter(b => !banned.includes(b.id));
    const recommendations: BanRecommendation[] = [];

    if (!userIsFirstPick) {
      // OPPONENT HAS 1ST PICK -> BAN TOP 3 S-TIER FIRST PICKS ON THE MAP
      availableBrawlers.forEach(brawler => {
        let score = 0;
        let rationale = '';

        if (session.map.mode === 'HOT_ZONE') {
          if (brawler.id === 'clancy' || brawler.id === 'lou' || brawler.id === 'crow' || brawler.id === 'finx') {
            score += 95;
            rationale = `Dominant Hot Zone controller. Denies enemy an automatic zone lock.`;
          } else if (brawler.archetype === 'ANTI_TANK') {
            score += 85;
            rationale = `S-tier Anti-Tank. Banning denies enemy first pick backbone.`;
          }
        } else if (session.map.mode === 'HEIST') {
          if (brawler.id === 'crow' || brawler.id === 'colt' || brawler.id === 'colette' || brawler.id === 'pierce' || brawler.id === 'chuck') {
            score += 95;
            rationale = `Top Heist safe damager / anti-tank hybrid. Must ban when enemy has first pick.`;
          }
        } else if (macroMeta === 'AGGRO') {
          if (brawler.id === 'crow' || brawler.id === 'colette' || brawler.id === 'otis' || brawler.id === 'chester' || brawler.id === 'naija' || brawler.id === 'sirius') {
            score += 95;
            rationale = `S-tier first pick on ${session.map.name}. Strip the opponent of top draft foundation.`;
          } else if (brawler.archetype === 'ANTI_TANK') {
            score += 80;
            rationale = `High-tier Anti-Tank threat.`;
          }
        } else {
          // PASSIVE META (Bounty / Knockout)
          if (brawler.id === 'pierce' || brawler.id === 'gene' || brawler.id === 'naija' || brawler.id === 'rt') {
            score += 95;
            rationale = `Unbeatable Bounty/KO first pick. Banning forces enemy into second-tier options.`;
          } else if (brawler.archetype === 'SNIPER' && brawler.tier === 'S') {
            score += 80;
            rationale = `Top long-range threat on this map.`;
          }
        }

        if (brawler.isOvertuned) {
          score += 15;
          rationale += ` Currently overtuned in the competitive meta.`;
        }

        score += brawler.modeScores[session.map.mode] * 0.4;

        if (score > 60) {
          recommendations.push({
            brawler,
            score,
            priority: score >= 90 ? 'CRITICAL' : score >= 75 ? 'HIGH' : 'MEDIUM',
            strategy: 'DENY_FIRST_PICK',
            rationale,
          });
        }
      });
    } else {
      // YOUR TEAM HAS 1ST PICK -> DO NOT BAN TOP PICKS! BAN STRONG 2/3 FLEX OR LAST PICKS
      availableBrawlers.forEach(brawler => {
        let score = 0;
        let strategy: BanRecommendation['strategy'] = 'BAN_FLEX_23';
        let rationale = '';

        if (macroMeta === 'PASSIVE') {
          if (brawler.id === 'belle' || brawler.id === 'byron') {
            score += 95;
            strategy = 'BAN_FLEX_23';
            rationale = `Top 2/3 flex stabilizer. Banning takes away opponent's best comp rounding tool against your 1st pick.`;
          }
        } else {
          if (brawler.id === 'stu' || brawler.id === 'lumi' || brawler.id === 'leon' || brawler.id === 'edgar' || brawler.id === 'mortis') {
            score += 90;
            strategy = 'BAN_FLEX_23';
            rationale = `Strong 2/3 flex pick. Destroys mid-range matchups against your first-picked anti-tank.`;
          }
        }

        if (session.map.terrain === 'WALLED' && (brawler.id === 'shade' || brawler.id === 'dynamike')) {
          score += 85;
          strategy = 'BAN_CHEESE_LAST_PICK';
          rationale = `Dangerous last-pick cheese through walls on ${session.map.name}.`;
        }

        if (score > 60) {
          recommendations.push({
            brawler,
            score,
            priority: score >= 90 ? 'CRITICAL' : 'HIGH',
            strategy,
            rationale,
          });
        }
      });
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Recommends picks driven by active role deductions and map synergy
   */
  public static recommendPicks(session: DraftSession): PickRecommendation[] {
    const pickingSide = getPickTeamForSlot(session.currentSlot);
    const allyPickedIds = pickingSide === 'TEAM_A' ? session.picks.teamA : session.picks.teamB;
    const enemyPickedIds = pickingSide === 'TEAM_A' ? session.picks.teamB : session.picks.teamA;

    const allyBrawlers = allyPickedIds.map(id => BRAWLER_MAP[id]).filter(Boolean);
    const enemyBrawlers = enemyPickedIds.map(id => BRAWLER_MAP[id]).filter(Boolean);

    const unavailable = [...getAllBannedBrawlers(session), ...getAllPickedBrawlers(session)];
    const candidateBrawlers = BRAWLERS.filter(b => !unavailable.includes(b.id));

    const deductions = this.getDeductions(session);
    const recommendations: PickRecommendation[] = [];

    candidateBrawlers.forEach(brawler => {
      let score = brawler.modeScores[session.map.mode];
      let roleInDraft = `${brawler.archetype.replace('_', ' ')}`;
      let rationale = '';
      let matchedDeduction: string | undefined;
      let riskWarning: string | undefined;

      // 1. Boost score if brawler matches an active role deduction
      deductions.forEach(ded => {
        if (ded.targetArchetypes.includes(brawler.archetype)) {
          const boost = ded.priority === 'CRITICAL' ? 45 : ded.priority === 'HIGH' ? 30 : 15;
          score += boost;
          if (!matchedDeduction) {
            matchedDeduction = ded.title;
            roleInDraft = `${brawler.archetype.replace('_', ' ')} (${ded.title.split(':')[0]})`;
            rationale = `${ded.reason}`;
          }
        }
      });

      // 2. Direct counters against enemy brawlers
      let countersCount = 0;
      enemyBrawlers.forEach(enemy => {
        if (brawler.counters.includes(enemy.archetype) || brawler.counters.includes(enemy.id)) {
          countersCount++;
          score += 15;
        }
        if (brawler.counteredBy.includes(enemy.archetype) || brawler.counteredBy.includes(enemy.id)) {
          score -= 15;
        }
      });

      // 3. Direct synergies with ally brawlers
      allyBrawlers.forEach(ally => {
        if (brawler.synergies.includes(ally.archetype) || brawler.synergies.includes(ally.id)) {
          score += 10;
        }
      });

      // 4. Special Slot-specific rules
      if (session.currentSlot === 1) {
        if (brawler.archetype === 'CONTROL') {
          score -= 20;
          riskWarning = `Never first-pick Control! Opponent will draft Lou + Kenji and run you down.`;
        } else if (brawler.archetype === 'THROWER' && brawler.id !== 'willow') {
          score -= 40;
          riskWarning = `First-picking Throwers is an instant loss against pro space makers.`;
        }
      } else if (session.currentSlot === 4 || session.currentSlot === 5) {
        if (brawler.archetype === 'THROWER' && brawler.id !== 'willow' && brawler.id !== 'berry') {
          if (session.map.mode !== 'HEIST' && !enemyBrawlers.some(e => e.archetype === 'SPACE_MAKER')) {
            score -= 35;
            riskWarning = `Drafting Throwers before enemy 6th pick allows opponent to hard counter with a Space Maker.`;
          }
        }
      }

      // Pro Tier multiplier
      if (brawler.tier === 'S') score += 10;
      if (brawler.isOvertuned) score += 10;
      if (brawler.colorTag === 'YELLOW') score += 5; // Hypercharge value

      // Compute grade
      let grade: PickRecommendation['grade'] = 'B';
      if (score >= 120) grade = 'S+';
      else if (score >= 100) grade = 'S';
      else if (score >= 80) grade = 'A';

      if (score >= 50) {
        recommendations.push({
          brawler,
          score,
          grade,
          roleInDraft,
          matchedDeduction,
          rationale: rationale || brawler.description || `Solid ${brawler.archetype.replace('_', ' ')} pick for current draft state.`,
          countersCount,
          riskWarning,
        });
      }
    });

    return recommendations.sort((a, b) => b.score - a.score);
  }
}
