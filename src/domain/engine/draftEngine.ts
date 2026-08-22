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

export interface RankedArchetypeNeed {
  role: BrawlerArchetype;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  reason: string;
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
  rankedNeeds?: RankedArchetypeNeed[];
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
    let predictedEnemyNext: CompEvaluation['predictedEnemyNext'] = undefined;
    let compSummary = '';

    const isFirstPickTeam = context?.isFirstPickTeam ?? true;
    const currentSlot = context?.currentSlot ?? 1;
    const enemyB = context?.enemyBrawlers || [];
    const enemyHasSpace = enemyB.some(b => b.archetype === 'SPACE_MAKER' || b.archetype === 'TANK');
    const enemyHasAntiTank = enemyB.some(b => b.archetype === 'ANTI_TANK');
    const isAllEnemyKnown = enemyB.length === 3;

    if (brawlers.length >= 1 || currentSlot >= 4) {
      if (isAllEnemyKnown) {
        if (!hasAntiTank && (enemyHasSpace || enemyB.some(b => b.archetype === 'TANK'))) {
          vulnerabilities.push(`No Anti-Tank: Vulnerable to enemy ${enemyB.filter(b => b.archetype === 'TANK' || b.archetype === 'SPACE_MAKER').map(b => b.name).join('/')}.`);
        } else if (hasAntiTank) {
          strengths.push('Solid Anti-Tank foundation shuts down aggressive dives.');
        }

        if (hasSpaceMakerOrTank) {
          strengths.push('Space Maker / Dive secured: Denies enemy free Thrower / Sniper abuse.');
        } else if (!hasSpaceMakerOrTank && enemyB.some(b => b.archetype === 'THROWER' || b.archetype === 'SNIPER')) {
          vulnerabilities.push(`No Dive: Struggles to reach enemy ${enemyB.filter(b => b.archetype === 'THROWER' || b.archetype === 'SNIPER').map(b => b.name).join('/')}.`);
        }

        if (!hasDamageDealer && enemyB.some(b => b.health >= 8000)) {
          vulnerabilities.push('Low Burst DPS against enemy high-HP frontline.');
        }
      } else {
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
    }

    // -------------------------------------------------------------
    // Dynamic Role Priority Scoring (Ranked from Most to Least Needed)
    // -------------------------------------------------------------
    const roleScores: Record<BrawlerArchetype, { score: number; priority: 'CRITICAL' | 'HIGH' | 'MEDIUM'; reason: string }> = {
      ANTI_TANK: { score: 0, priority: 'MEDIUM', reason: 'Anti-Tank stabilization' },
      SPACE_MAKER: { score: 0, priority: 'MEDIUM', reason: 'Aggressive dive & flanking pressure' },
      CONTROL: { score: 0, priority: 'MEDIUM', reason: 'Area denial and lane lockdown' },
      THROWER: { score: 0, priority: 'MEDIUM', reason: 'Indirect wall artillery' },
      SNIPER: { score: 0, priority: 'MEDIUM', reason: 'Long-range anchor damage' },
      TANK: { score: 0, priority: 'MEDIUM', reason: 'Frontline HP and pressure' },
      SUPPORT: { score: 0, priority: 'MEDIUM', reason: 'Team healing and speed sustain' },
    };

    if (brawlers.length === 3) {
      compSummary = 'Full 3v3 team drafted.';
    } else if (isAllEnemyKnown) {
      // Complete Enemy Information: Pure Counter-Picking Mode
      if (!enemyHasAntiTank) {
        roleScores.TANK = { score: 100, priority: 'CRITICAL', reason: '1st Priority: Heavy Tank stat-checks enemy zero Anti-Tank lineup' };
        roleScores.SPACE_MAKER = { score: 95, priority: 'CRITICAL', reason: '2nd Priority: Space Maker dive overruns low-burst squishies' };
        if (!enemyHasSpace) {
          roleScores.THROWER = { score: 90, priority: 'HIGH', reason: '3rd Priority: Untouchable Thrower abuse over walls' };
        }
        compSummary = 'Direct Counter Mode: Exploit enemy zero Anti-Tank draft with Heavy Tanks and Space Makers.';
      } else if (!enemyHasSpace) {
        roleScores.THROWER = { score: 100, priority: 'CRITICAL', reason: '1st Priority: Untouchable Thrower abuse against zero dive threats' };
        roleScores.SNIPER = { score: 90, priority: 'HIGH', reason: '2nd Priority: Uncontested long-range sniper' };
        roleScores.CONTROL = { score: 75, priority: 'MEDIUM', reason: '3rd Priority: Zone lockdown' };
        compSummary = 'Direct Counter Mode: Exploit enemy zero dive draft with Throwers and Snipers.';
      } else {
        if (context?.mode === 'HEIST') {
          roleScores.THROWER = { score: 95, priority: 'HIGH', reason: '1st Priority: Top safe melters (Chuck, Berry, Dynamike)' };
          roleScores.CONTROL = { score: 85, priority: 'HIGH', reason: '2nd Priority: Area denial and wall control' };
          roleScores.ANTI_TANK = { score: 70, priority: 'MEDIUM', reason: '3rd Priority: Additional burst shred' };
        } else {
          roleScores.CONTROL = { score: 95, priority: 'HIGH', reason: '1st Priority: Mid zone control and choke lockdown' };
          roleScores.ANTI_TANK = { score: 85, priority: 'HIGH', reason: '2nd Priority: Hard CC & Anti-Dive stabilization' };
          roleScores.SUPPORT = { score: 70, priority: 'MEDIUM', reason: '3rd Priority: Team sustain' };
        }
        compSummary = 'Direct Counter Mode: Hard-countering enemy 3v3 composition.';
      }
    } else if (brawlers.length === 0) {
      if (context?.mode === 'BOUNTY' || context?.mode === 'KNOCKOUT') {
        roleScores.SNIPER = { score: 95, priority: 'CRITICAL', reason: '1st Priority: S-tier Sniper anchor on long-range map' };
        roleScores.ANTI_TANK = { score: 80, priority: 'HIGH', reason: '2nd Priority: Anti-Dive insurance' };
        roleScores.CONTROL = { score: 70, priority: 'HIGH', reason: '3rd Priority: Vision & range control' };
      } else {
        roleScores.ANTI_TANK = { score: 100, priority: 'CRITICAL', reason: '1st Priority: Secure an Anti-Tank foundation to deny enemy aggro' };
        roleScores.CONTROL = { score: 80, priority: 'HIGH', reason: '2nd Priority: Top S-Tier Mid controller' };
      }
      compSummary = 'First Pick: Secure an Anti-Tank foundation or top S-Tier Mid controller.';
    } else if (brawlers.length === 1) {
      if (hasAntiTank) {
        roleScores.SPACE_MAKER = { score: 95, priority: 'CRITICAL', reason: '1st Priority: Space Maker dive completes the Anti-Tank core' };
        if (context?.mode === 'HEIST') {
          roleScores.THROWER = { score: 85, priority: 'HIGH', reason: '2nd Priority: High safe damage artillery over walls' };
          roleScores.CONTROL = { score: 75, priority: 'HIGH', reason: '3rd Priority: Choke point defense' };
          roleScores.TANK = { score: 60, priority: 'MEDIUM', reason: '4th Priority: Heavy safe rush pressure' };
        } else {
          roleScores.CONTROL = { score: 80, priority: 'HIGH', reason: '2nd Priority: Mid zone lockdown' };
          roleScores.TANK = { score: 65, priority: 'MEDIUM', reason: '3rd Priority: Frontline HP presence' };
          roleScores.SUPPORT = { score: 55, priority: 'MEDIUM', reason: '4th Priority: Team sustain' };
        }
        compSummary = 'Solid Anti-Tank base. Next: Add a Space Maker dive or Area Controller.';
      } else if (hasSpaceMakerOrTank) {
        roleScores.ANTI_TANK = { score: 100, priority: 'CRITICAL', reason: '1st Priority: Mandatory Anti-Tank backbone to stabilize your dive' };
        roleScores.SUPPORT = { score: 75, priority: 'HIGH', reason: '2nd Priority: Team speed / shield sustain' };
        roleScores.CONTROL = { score: 65, priority: 'MEDIUM', reason: '3rd Priority: Area denial' };
        compSummary = 'Aggressive dive opener. Next: Add Anti-Tank stabilization or Support.';
      } else {
        roleScores.ANTI_TANK = { score: 95, priority: 'CRITICAL', reason: '1st Priority: Anti-Tank backbone' };
        roleScores.SPACE_MAKER = { score: 85, priority: 'HIGH', reason: '2nd Priority: Space Maker dive threat' };
        compSummary = 'Mid-range start. Next: Secure Anti-Tank or Space Maker.';
      }
    } else if (brawlers.length === 2) {
      if (hasAntiTank && hasSpaceMakerOrTank) {
        if (context?.mode === 'HEIST') {
          roleScores.THROWER = { score: 95, priority: 'HIGH', reason: '1st Priority: Top safe melters (Chuck, Berry, Dynamike)' };
          roleScores.CONTROL = { score: 85, priority: 'HIGH', reason: '2nd Priority: Area denial and wall control' };
          roleScores.ANTI_TANK = { score: 70, priority: 'MEDIUM', reason: '3rd Priority: Additional burst shred' };
          roleScores.SUPPORT = { score: 55, priority: 'MEDIUM', reason: '4th Priority: Team sustain' };
        } else if (context?.mode === 'HOT_ZONE') {
          roleScores.CONTROL = { score: 95, priority: 'HIGH', reason: '1st Priority: Continuous zone lockdown (Lou, Clancy, Finx)' };
          roleScores.ANTI_TANK = { score: 80, priority: 'HIGH', reason: '2nd Priority: Hard CC / anti-dive control' };
          roleScores.SUPPORT = { score: 65, priority: 'MEDIUM', reason: '3rd Priority: Zone sustain' };
        } else if (context?.mode === 'BOUNTY' || context?.mode === 'KNOCKOUT') {
          roleScores.SNIPER = { score: 95, priority: 'HIGH', reason: '1st Priority: Resilient sniper anchor' };
          roleScores.CONTROL = { score: 80, priority: 'HIGH', reason: '2nd Priority: Long-range area denial' };
          roleScores.SUPPORT = { score: 65, priority: 'MEDIUM', reason: '3rd Priority: Team healing' };
        } else {
          roleScores.CONTROL = { score: 90, priority: 'HIGH', reason: '1st Priority: Mid control' };
          roleScores.TANK = { score: 80, priority: 'HIGH', reason: '2nd Priority: Stat-check pressure' };
          roleScores.SUPPORT = { score: 65, priority: 'MEDIUM', reason: '3rd Priority: Team sustain' };
        }
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
        roleScores.SPACE_MAKER = { score: 100, priority: 'CRITICAL', reason: '1st Priority: Space Maker mandatory to lockout enemy throwers/snipers' };
        roleScores.TANK = { score: 70, priority: 'HIGH', reason: '2nd Priority: Frontline tank presence' };
        compSummary = 'Missing Dive Threat. Next: Space Maker mandatory to lock out enemy 6th pick throwers.';
      } else if (!hasAntiTank) {
        roleScores.ANTI_TANK = { score: 100, priority: 'CRITICAL', reason: '1st Priority: Anti-Tank mandatory to stop enemy tank overrun' };
        compSummary = 'Vulnerable to Tanks. Next: Anti-Tank mandatory.';
      } else {
        roleScores.CONTROL = { score: 90, priority: 'HIGH', reason: '1st Priority: Mid zone control' };
        roleScores.TANK = { score: 75, priority: 'MEDIUM', reason: '2nd Priority: Frontline HP' };
        compSummary = 'Next: Add Zone Control or frontline durability.';
      }
    }

    const rankedNeeds: RankedArchetypeNeed[] = Object.entries(roleScores)
      .filter(([_, v]) => v.score > 40)
      .sort((a, b) => b[1].score - a[1].score)
      .map(([role, v]) => ({
        role: role as BrawlerArchetype,
        priority: v.priority,
        reason: v.reason,
      }));

    const recommendedRoles: BrawlerArchetype[] = rankedNeeds.map(n => n.role);

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
      rankedNeeds,
      predictedEnemyNext,
      compSummary,
    };
  }

  public static getDeductions(session: DraftSession): DraftDeduction[] {
    const pickingSide = getPickTeamForSlot(session.currentSlot);
    const isAllyTurn = pickingSide === session.userSide;
    const teamLabel = isAllyTurn ? 'Your team' : 'The opponent';

    const allyPickedIds = pickingSide === 'TEAM_A' ? session.picks.teamA : session.picks.teamB;
    const enemyPickedIds = pickingSide === 'TEAM_A' ? session.picks.teamB : session.picks.teamA;

    const allyBrawlers = allyPickedIds.map(id => BRAWLER_MAP[id]).filter(Boolean);
    const enemyBrawlers = enemyPickedIds.map(id => BRAWLER_MAP[id]).filter(Boolean);

    const allyComp = this.evaluateComp(allyBrawlers, { isFirstPickTeam: pickingSide === 'TEAM_A', currentSlot: session.currentSlot, enemyBrawlers, mode: session.map.mode });
    const enemyComp = this.evaluateComp(enemyBrawlers, { isFirstPickTeam: pickingSide !== 'TEAM_A', currentSlot: session.currentSlot, enemyBrawlers: allyBrawlers, mode: session.map.mode });
    const macroMeta = getMacroMeta(session.map.mode);

    const deductions: DraftDeduction[] = [];
    const isAllEnemyKnown = enemyBrawlers.length === 3;

    const enemySquishies = enemyBrawlers.filter(
      e => e.archetype === 'SNIPER' || e.archetype === 'THROWER' || (e.archetype === 'CONTROL' && e.burstDamage <= 6)
    );
    const heavyTankShredders = ['colette', 'chester', 'clancy', 'crow', 'otis'];
    const enemyHasHeavyShredder = enemyBrawlers.some(e => heavyTankShredders.includes(e.id));

    if (isAllEnemyKnown) {
      // =========================================================================
      // COMPLETE ENEMY INFORMATION: PURE DIRECT COUNTER-PICKING & EXPLOIT MODE
      // =========================================================================

      // 1. Exploit: Enemy Lacks Anti-Tank (Heavy Tank / Aggro Overrun)
      if (!enemyComp.hasAntiTank) {
        deductions.push({
          id: 'exploit_no_antitank',
          targetArchetypes: ['TANK', 'SPACE_MAKER'],
          title: '💥 100% Win Condition: Heavy Tank / Stat-Check Overrun',
          reason: `The opponent drafted ZERO Anti-Tanks (${enemyBrawlers.map(b => b.name).join(', ')}). They have no burst shred or CC. Lock in a Heavy Tank (Draco, Frank, Buster, Meg, Bull) or aggressive Space Maker (Kenji, Kaze, Nori, Bolt) to stat-check them and walk uncontested onto the objectives.`,
          priority: 'CRITICAL',
          icon: '🧱',
        });
      }

      // 2. Exploit: Enemy Lacks Space Maker / Dive (Free Thrower / Sniper Abuse)
      if (!enemyComp.hasSpaceMakerOrTank) {
        deductions.push({
          id: 'exploit_no_spacemaker',
          targetArchetypes: ['THROWER', 'SNIPER'],
          title: '💣 100% Win Condition: Untouchable Thrower / Sniper Artillery',
          reason: `The opponent drafted ZERO Space Makers or dive threats (${enemyBrawlers.map(b => b.name).join(', ')}). A Thrower (Dynamike, Berry, Larry, Sirius, Tick, Sprout, Grom, Barley) or long-range Sniper is 100% untouchable behind walls and gets free infinite value.`,
          priority: 'CRITICAL',
          icon: '💣',
        });
      }

      // 3. Exploit: Enemy Has Multiple Low-Burst Squishies
      if (enemySquishies.length >= 2 || (enemyComp.burstRating < 65 && !enemyComp.hasAntiTank)) {
        if (!deductions.some(d => d.id === 'exploit_no_antitank')) {
          deductions.push({
            id: 'exploit_low_dps_squishies',
            targetArchetypes: ['SPACE_MAKER', 'TANK'],
            title: '✨ Direct Counter: Space Maker Dive / Tank Overrun',
            reason: `Enemy lineup consists of low-burst squishies (${enemySquishies.map(b => b.name).join(', ')}). Space Makers (Kenji, Kaze, Nori, Bolt, Ollie) or high-HP Tanks easily close distance and delete them.`,
            priority: 'CRITICAL',
            icon: '✨',
          });
        }
      }

      // 4. Counter: Enemy Has Heavy Tanks / Divers (Hard CC Lockdown)
      if (enemyBrawlers.some(b => b.archetype === 'TANK' || b.archetype === 'SPACE_MAKER')) {
        deductions.push({
          id: 'exploit_enemy_dive_tanks',
          targetArchetypes: ['ANTI_TANK'],
          title: '🛡️ Direct Counter: Anti-Tank / Hard CC Lockdown',
          reason: `Enemy relies on aggressive dive/tanks (${enemyBrawlers.filter(b => b.archetype === 'TANK' || b.archetype === 'SPACE_MAKER').map(b => b.name).join(', ')}). Anti-Tanks with Hard CC (Otis, Gale, Colette, Clancy, Chester, Surge, Lumi) shut down their dive on sight.`,
          priority: 'CRITICAL',
          icon: '🛡️',
        });
      }

      // 5. Counter: Enemy Has Throwers Behind Walls
      if (enemyBrawlers.some(b => b.archetype === 'THROWER')) {
        deductions.push({
          id: 'exploit_enemy_throwers',
          targetArchetypes: ['SPACE_MAKER'],
          title: '⚡ Direct Counter: High-Mobility Thrower Hunter',
          reason: `Enemy relies on ${enemyBrawlers.filter(b => b.archetype === 'THROWER').map(b => b.name).join(', ')}. Fast Space Makers (Kenji, Kaze, Nori, Mortis, Bibi, Bolt) run over walls and delete throwers, denying them safe artillery.`,
          priority: 'CRITICAL',
          icon: '⚡',
        });
      }

      // 6. Synergy: Immortal Tank + Healer Rush
      if (allyComp.archetypeCounts.TANK > 0 && !enemyHasHeavyShredder) {
        deductions.push({
          id: 'support_healer',
          targetArchetypes: ['SUPPORT', 'TANK'],
          title: '💖 100% Win Condition: Immortal Tank + Healer Rush',
          reason: `Enemy lacks dedicated heavy tank shredders (Colette/Chester/Clancy). Poco or Berry healing turns your ${allyBrawlers.find(b => b.archetype === 'TANK')?.name || 'Tank'} immortal, or Frank adds another massive HP stat-check.`,
          priority: 'CRITICAL',
          icon: '💖',
        });
      }

      // Mode Objectives (Secondary)
      if (session.map.mode === 'HEIST') {
        deductions.push({
          id: 'heist_objective',
          targetArchetypes: ['THROWER', 'CONTROL', 'ANTI_TANK'],
          title: '🎯 Heist Safe Shredding & Race Damage',
          reason: 'Lock in top Heist safe melters and wall controllers (Chuck, Berry, Dynamike, Clancy, Colt, Crow, Lumi) to win the damage race.',
          priority: 'HIGH',
          icon: '🎯',
        });
      } else if (session.map.mode === 'HOT_ZONE') {
        deductions.push({
          id: 'hotzone_objective',
          targetArchetypes: ['CONTROL', 'ANTI_TANK'],
          title: '🔥 Hot Zone Objective: Continuous Area Lockdown',
          reason: 'Hot Zone favors brawlers with continuous zone denial (Lou freeze, Clancy Stage 3 burst, Finx, Juju dive).',
          priority: 'HIGH',
          icon: '🔥',
        });
      }
    } else {
      // =========================================================================
      // INCOMPLETE INFORMATION: PREEMPTIVE THEORY & BASELINE GOOD PRACTICES
      // =========================================================================

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
          reason: `${teamLabel} currently has NO Anti-Tank. Without an Anti-Tank, the opposing team can draft aggressive Tanks and Space Makers and run you down.`,
          priority: 'CRITICAL',
          icon: '🛡️',
        });
      }

      if ((session.currentSlot === 4 || session.currentSlot === 5) && !allyComp.hasSpaceMakerOrTank) {
        deductions.push({
          id: 'spacemaker_lockout',
          targetArchetypes: ['SPACE_MAKER'],
          title: 'Space Maker Lockout: Deny Enemy Free Last Pick',
          reason: `${teamLabel} currently has NO Space Maker or aggressive dive threat. In Slot 4/5, you MUST draft a Space Maker (Kenji, Kaze, Ollie, Bull, Mortis, Lily, Shade) to prevent the enemy from having a free, uncontested 6th pick Thrower or Sniper.`,
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

      // Tank Stat-Check ("Being Bigger")
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

      // Immortal Tank Enabler (Ally Tank + Enemy lacks Heavy Tank Shredders)
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

      // Resilient Snipers / Flex 2/3 in Passive Meta
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

      // Mode Objectives
      if (session.map.mode === 'HEIST') {
        const heistTargets: BrawlerArchetype[] = allyComp.hasSpaceMakerOrTank
          ? ['THROWER', 'CONTROL', 'ANTI_TANK']
          : ['THROWER', 'ANTI_TANK', 'CONTROL', 'SPACE_MAKER'];
        deductions.push({
          id: 'heist_objective',
          targetArchetypes: heistTargets,
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
    }

    return deductions;
  }

  /**
   * Recommends bans using Bobby's asymmetric first-pick theory
   */
  public static recommendBans(session: DraftSession): BanRecommendation[] {
    const macroMeta = getMacroMeta(session.map.mode);
    const userIsFirstPick = session.userSide === 'TEAM_A';
    const allySideKey = session.userSide === 'TEAM_A' ? 'teamA' : 'teamB';
    const allyBanned = session.bans[allySideKey];

    // Bans are blind & simultaneous: only exclude brawlers already banned by this specific team
    const availableBrawlers = BRAWLERS.filter(b => !allyBanned.includes(b.id));
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
   * Recommends picks using strategic role deductions and counter-picking heuristics
   */
  public static recommendPicks(session: DraftSession, options?: { allowDuplicates?: boolean }): PickRecommendation[] {
    const pickingSide = getPickTeamForSlot(session.currentSlot);
    const allyPickedIds = pickingSide === 'TEAM_A' ? session.picks.teamA : session.picks.teamB;
    const enemyPickedIds = pickingSide === 'TEAM_A' ? session.picks.teamB : session.picks.teamA;

    const allyBrawlers = allyPickedIds.map(id => BRAWLER_MAP[id]).filter(Boolean);
    const enemyBrawlers = enemyPickedIds.map(id => BRAWLER_MAP[id]).filter(Boolean);

    const enemyComp = this.evaluateComp(enemyBrawlers, { isFirstPickTeam: pickingSide !== 'TEAM_A', currentSlot: session.currentSlot, enemyBrawlers: allyBrawlers, mode: session.map.mode });

    const allowDuplicates = options?.allowDuplicates ?? session.allowDuplicates ?? false;
    const unavailable = allowDuplicates
      ? getAllBannedBrawlers(session)
      : [...getAllBannedBrawlers(session), ...getAllPickedBrawlers(session)];
    const candidateBrawlers = BRAWLERS.filter(b => !unavailable.includes(b.id));

    const deductions = this.getDeductions(session);
    const recommendations: PickRecommendation[] = [];
    const isAllEnemyKnown = enemyBrawlers.length === 3;

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
          score += isAllEnemyKnown ? 25 : 15;
        }
        if (brawler.counteredBy.includes(enemy.archetype) || brawler.counteredBy.includes(enemy.id)) {
          score -= isAllEnemyKnown ? 25 : 15;
        }
      });

      // Direct exploit bonuses when all 3 enemy brawlers are known
      if (isAllEnemyKnown) {
        if (!enemyComp.hasAntiTank && (brawler.archetype === 'TANK' || brawler.archetype === 'SPACE_MAKER')) {
          score += 35;
        }
        if (!enemyComp.hasSpaceMakerOrTank && (brawler.archetype === 'THROWER' || brawler.archetype === 'SNIPER')) {
          score += 35;
        }
      }

      // 3. Direct synergies with ally brawlers
      allyBrawlers.forEach(ally => {
        if (brawler.synergies.includes(ally.archetype) || brawler.synergies.includes(ally.id)) {
          score += 10;
        }
      });

      // Avoid duplicate Space Makers when team already has one
      if (brawler.archetype === 'SPACE_MAKER' && allyBrawlers.some(a => a.archetype === 'SPACE_MAKER')) {
        score -= 30; 
      }

      // Special Heist Safe Melter boost
      if (session.map.mode === 'HEIST') {
        if (brawler.id === 'chuck' || brawler.id === 'berry' || brawler.id === 'dynamike' || brawler.id === 'sirius' || brawler.id === 'clancy' || brawler.id === 'colt' || brawler.id === 'crow' || brawler.id === 'lumi' || brawler.id === 'barley') {
          score += 20; 
        }
      }

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
          // Only penalize thrower in Slot 4/5 if enemy has unrevealed future picks and no space maker
          if (session.map.mode !== 'HEIST' && !isAllEnemyKnown && !enemyBrawlers.some(e => e.archetype === 'SPACE_MAKER')) {
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

  /**
   * Calculates optimal lane assignments and 1v1 matchups to prevent suicide lanes
   * and maximize tactical counter advantage according to Bobby's masterclass.
   */
  public static calculateOptimalLanes(
    allyBrawlers: Brawler[],
    enemyBrawlers: Brawler[]
  ): LaneMatchup[] {
    if (allyBrawlers.length === 0 || enemyBrawlers.length === 0) {
      return [];
    }

    const evaluatePair = (ally: Brawler, enemy: Brawler): { score: number; tip: string; advantage: 'ALLY_FAVORED' | 'ENEMY_FAVORED' | 'EVEN' } => {
      let score = 0;
      let tip = '';
      let advantage: 'ALLY_FAVORED' | 'ENEMY_FAVORED' | 'EVEN' = 'EVEN';

      // 1. Critical Rule: Never send low-burst/no-escape Control/Throwers/Snipers into Assassins
      const isDangerousAssassin = enemy.archetype === 'SPACE_MAKER' || enemy.id === 'edgar' || enemy.id === 'mortis' || enemy.id === 'mico' || enemy.id === 'kenji' || enemy.id === 'lily';
      const isVulnerableSquishy = (ally.archetype === 'CONTROL' && !ally.hasKnockback && !ally.hasStunOrMute) || ally.archetype === 'THROWER' || ally.archetype === 'SNIPER';

      if (isDangerousAssassin && isVulnerableSquishy) {
        score -= 60; // Huge penalty to avoid suicide lane!
        tip = `DANGER: ${enemy.name} assassinates ${ally.name} easily. Swap lanes or maintain team peel!`;
        advantage = 'ENEMY_FAVORED';
        return { score, tip, advantage };
      }

      // 2. Direct counters
      if (ally.counters.includes(enemy.archetype) || ally.counters.includes(enemy.id)) {
        score += 30;
        advantage = 'ALLY_FAVORED';
        tip = `${ally.name} has strong counter advantage over ${enemy.name}.`;
      }
      if (ally.counteredBy.includes(enemy.archetype) || ally.counteredBy.includes(enemy.id)) {
        score -= 30;
        advantage = 'ENEMY_FAVORED';
        tip = `${enemy.name} has matchup advantage. Play patiently and trade carefully.`;
      }

      // 3. Anti-Tank / Knockback vs Aggro/Dive
      if (ally.hasKnockback || ally.hasStunOrMute || ally.archetype === 'ANTI_TANK') {
        if (enemy.archetype === 'SPACE_MAKER' || enemy.archetype === 'TANK') {
          score += 25;
          advantage = 'ALLY_FAVORED';
          tip = `${ally.name} CC / Knockback shuts down ${enemy.name}'s aggressive dive attempts.`;
        }
      }

      // 4. Space Maker vs Thrower / Sniper
      if (ally.archetype === 'SPACE_MAKER' && (enemy.archetype === 'THROWER' || enemy.archetype === 'SNIPER')) {
        score += 35;
        advantage = 'ALLY_FAVORED';
        tip = `${ally.name} dive mobility runs down ${enemy.name} and denies free artillery.`;
      }

      // 5. Safe Range Poking / Mid Control
      if (ally.archetype === 'CONTROL' || ally.archetype === 'SNIPER') {
        if (enemy.archetype === 'ANTI_TANK' || enemy.archetype === 'SUPPORT') {
          score += 15;
          tip = `${ally.name} out-ranges and safely controls the lane against ${enemy.name}.`;
        }
      }

      if (!tip) {
        tip = `Even 1v1 matchup. Focus on positioning and dodging skillshots.`;
      }

      return { score, tip, advantage };
    };

    // If less than 3 brawlers on either side, do basic mapping
    if (allyBrawlers.length < 3 || enemyBrawlers.length < 3) {
      return allyBrawlers.map((ally, i) => {
        const enemy = enemyBrawlers[i] || enemyBrawlers[0];
        const res = enemy ? evaluatePair(ally, enemy) : { tip: 'Lane open', advantage: 'EVEN' as const };
        const laneNames: ('Mid Anchor' | 'Left Lane' | 'Right Lane')[] = ['Mid Anchor', 'Left Lane', 'Right Lane'];
        return {
          laneName: laneNames[i] || 'Mid Anchor',
          ally,
          enemy: enemy || ally,
          advantage: res.advantage,
          tip: res.tip,
        };
      });
    }

    // Determine who is Mid Anchor: Prefer Controller / Long-range or Anti-Tank
    const laneLabels: ('Mid Anchor' | 'Left Lane' | 'Right Lane')[] = ['Mid Anchor', 'Left Lane', 'Right Lane'];
    const matchups: LaneMatchup[] = [];

    // Identify best mid ally brawler (highest range/control/anti-tank)
    let midIndex = 0;
    let highestMidScore = -1;
    allyBrawlers.forEach((b, idx) => {
      let mScore = 0;
      if (b.archetype === 'CONTROL') mScore += 30;
      if (b.archetype === 'ANTI_TANK') mScore += 20;
      if (b.archetype === 'SNIPER') mScore += 25;
      if (mScore > highestMidScore) {
        highestMidScore = mScore;
        midIndex = idx;
      }
    });

    const otherAllyIndices = [0, 1, 2].filter(i => i !== midIndex);
    const orderedAlly = [allyBrawlers[midIndex], allyBrawlers[otherAllyIndices[0]], allyBrawlers[otherAllyIndices[1]]];

    // Find best matching enemy for Mid, Left, Right
    const remainingEnemy = [...enemyBrawlers];
    
    // Pick best enemy for mid
    let bestMidEnemyIdx = 0;
    let bestMidScore = -Infinity;
    remainingEnemy.forEach((e, eIdx) => {
      const score = evaluatePair(orderedAlly[0], e).score;
      if (score > bestMidScore) {
        bestMidScore = score;
        bestMidEnemyIdx = eIdx;
      }
    });
    const midEnemy = remainingEnemy.splice(bestMidEnemyIdx, 1)[0];

    // For the other two lanes, test both assignments
    const optA = evaluatePair(orderedAlly[1], remainingEnemy[0]).score + evaluatePair(orderedAlly[2], remainingEnemy[1]).score;
    const optB = evaluatePair(orderedAlly[1], remainingEnemy[1]).score + evaluatePair(orderedAlly[2], remainingEnemy[0]).score;

    const leftEnemy = optA >= optB ? remainingEnemy[0] : remainingEnemy[1];
    const rightEnemy = optA >= optB ? remainingEnemy[1] : remainingEnemy[0];

    const finalEnemies = [midEnemy, leftEnemy, rightEnemy];

    for (let i = 0; i < 3; i++) {
      const ally = orderedAlly[i];
      const enemy = finalEnemies[i];
      const evalResult = evaluatePair(ally, enemy);
      matchups.push({
        laneName: laneLabels[i],
        ally,
        enemy,
        advantage: evalResult.advantage,
        tip: evalResult.tip,
      });
    }

    return matchups;
  }

  /**
   * Generates a comprehensive in-game Macro & Positioning Playbook
   * based on the 14 fundamental positioning laws (Pinching, Lane Switching, Line Movement, Ability Tracking).
   */
  public static generateMacroPlaybook(
    allyBrawlers: Brawler[],
    enemyBrawlers: Brawler[],
    laneMatchups: LaneMatchup[]
  ): MacroPlaybook {
    // 1. Identify Priority Pinch Target (Throwers on closed maps, Snipers on open maps, or Assassin threats)
    let priorityTarget: Brawler | null = null;
    let pinchReason = '';
    let pinchInstructions = '';

    const enemyThrower = enemyBrawlers.find(b => b.archetype === 'THROWER');
    const enemySniper = enemyBrawlers.find(b => b.archetype === 'SNIPER' && b.tier === 'S');
    const enemyAssassin = enemyBrawlers.find(b => b.id === 'edgar' || b.id === 'mortis' || b.id === 'mico' || b.id === 'kenji' || b.id === 'lily' || b.id === 'bolt');

    if (enemyThrower) {
      priorityTarget = enemyThrower;
      pinchReason = `${enemyThrower.name} creates oppressive indirect pressure behind walls. If left alone, your team gets spawn-trapped.`;
      pinchInstructions = `Win your side lane, then immediately rotate inward to 2v1 pinch ${enemyThrower.name} from two separate angles. Shooting from two directions denies their wall cover.`;
    } else if (enemySniper) {
      priorityTarget = enemySniper;
      pinchReason = `${enemySniper.name} locks down long sightlines.`;
      pinchInstructions = `Collapse with your Space Maker or rotate from side lanes to pinch ${enemySniper.name} before they charge Super.`;
    } else if (enemyAssassin) {
      priorityTarget = enemyAssassin;
      pinchReason = `${enemyAssassin.name} looks for isolated targets to charge Super and start a snowball.`;
      pinchInstructions = `Maintain visual on bushes. When ${enemyAssassin.name} dives, both nearby teammates must immediately pinch and burst them down.`;
    } else if (enemyBrawlers.length > 0) {
      priorityTarget = enemyBrawlers[0];
      pinchReason = `Primary enemy anchor on this map.`;
      pinchInstructions = `Coordinate with your teammates to pinch from two angles once you push your individual lane.`;
    }

    // 2. Lane Switching Rules (Pre-Match & Dynamic Swapping)
    const laneSwitchingRules: string[] = [];
    laneMatchups.forEach(m => {
      if (m.advantage === 'ALLY_FAVORED') {
        laneSwitchingRules.push(`Keep your lane against ${m.enemy.name}. If ${m.enemy.name} tries to swap lanes to escape ${m.ally.name}, ${m.ally.name} must swap with them to maintain counter pressure.`);
      } else if (m.advantage === 'ENEMY_FAVORED') {
        laneSwitchingRules.push(`If ${m.ally.name} is struggling against ${m.enemy.name}, swap lanes immediately with a teammate who has knockback or range advantage.`);
      }
    });

    // 3. Cooldown & Ability Tracking
    const cooldownTracking: string[] = [];
    enemyBrawlers.forEach(enemy => {
      if (enemy.id === 'edgar') {
        cooldownTracking.push(`Track Edgar's Super & Hardcore Shield. Once he lands and burns shield, he has 0 escape—punish immediately.`);
      } else if (enemy.id === 'dynamike') {
        cooldownTracking.push(`Bait Satchel Charge stun gadget before committing your close-range dive into Dynamike.`);
      } else if (enemy.id === 'crow') {
        cooldownTracking.push(`Track Crow's Slowing Toxin gadget & Super jump. Don't clump together in narrow corridors.`);
      } else if (enemy.id === 'piper') {
        cooldownTracking.push(`Track Piper's Auto Aimer knockback gadget & Super escape. Once burned, she is helpless at close range.`);
      } else if (enemy.id === 'gene') {
        cooldownTracking.push(`Count Gene's Super charge. Dodge wide when Gene has Magic Hand ready.`);
      } else if (enemy.hasHypercharge) {
        cooldownTracking.push(`Watch for ${enemy.name}'s purple Hypercharge aura. Fall back and kite when activated; do not feed ammo.`);
      }
    });

    // 4. Team Movement Rule (The 3-Man Line)
    const allyDivers = allyBrawlers.filter(b => b.archetype === 'SPACE_MAKER');
    const teamMovementRule = allyDivers.length > 0
      ? `Hold a solid mid line. When ${allyDivers.map(d => d.name).join('/')} initiates a dive onto the enemy, your backline must push up immediately to trade and support, never letting divers fight 1v3.`
      : `Push forward as a 3-man line when enemies are low. Never 1v3 into enemy spawn. If an ally falls, fall back immediately and hold your side of the mid chokepoints until your team regroups.`;

    return {
      priorityPinchTarget: priorityTarget ? {
        target: priorityTarget,
        reason: pinchReason,
        pinchInstructions,
      } : null,
      laneSwitchingRules: laneSwitchingRules.slice(0, 3),
      cooldownTracking: cooldownTracking.slice(0, 3),
      teamMovementRule,
    };
  }
}

export interface LaneMatchup {
  laneName: 'Mid Anchor' | 'Left Lane' | 'Right Lane';
  ally: Brawler;
  enemy: Brawler;
  advantage: 'ALLY_FAVORED' | 'ENEMY_FAVORED' | 'EVEN';
  tip: string;
}

export interface MacroPlaybook {
  priorityPinchTarget: {
    target: Brawler;
    reason: string;
    pinchInstructions: string;
  } | null;
  laneSwitchingRules: string[];
  cooldownTracking: string[];
  teamMovementRule: string;
}
