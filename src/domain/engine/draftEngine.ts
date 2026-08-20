import { BRAWLERS, BRAWLER_MAP } from '../data/brawlers';
import { Brawler } from '../models/brawler';
import { DraftSession, getAllBannedBrawlers, getAllPickedBrawlers, getPickTeamForSlot } from '../models/draftSession';
import { getMacroMeta } from '../models/types';

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
  vulnerabilities: string[];
  strengths: string[];
}

export class DraftEngine {
  /**
   * Evaluates team composition strengths and weaknesses
   */
  public static evaluateComp(brawlers: Brawler[]): CompEvaluation {
    const hasAntiTank = brawlers.some(b => b.archetype === 'ANTI_TANK' || b.id === 'willow');
    const hasSpaceMakerOrTank = brawlers.some(b => b.archetype === 'SPACE_MAKER' || b.archetype === 'TANK');
    const hasDamageDealer = brawlers.some(b => b.burstDamage >= 8 || b.traits.includes('SAFE_MELTER'));
    const hasSupport = brawlers.some(b => b.archetype === 'SUPPORT');

    const totalBurst = brawlers.reduce((sum, b) => sum + b.burstDamage, 0);
    const burstRating = Math.min(100, Math.round((totalBurst / (Math.max(1, brawlers.length) * 10)) * 100));

    const totalHp = brawlers.reduce((sum, b) => sum + b.health, 0);
    const effectiveHpRating = Math.min(100, Math.round((totalHp / (Math.max(1, brawlers.length) * 12000)) * 100));

    const rangeScore = brawlers.reduce((sum, b) => {
      if (b.archetype === 'SNIPER') return sum + 10;
      if (b.archetype === 'CONTROL' || b.archetype === 'THROWER') return sum + 7;
      if (b.archetype === 'ANTI_TANK') return sum + 6;
      return sum + 3;
    }, 0);
    const rangeRating = Math.min(100, Math.round((rangeScore / (Math.max(1, brawlers.length) * 10)) * 100));

    const vulnerabilities: string[] = [];
    const strengths: string[] = [];

    if (brawlers.length >= 2) {
      if (!hasAntiTank) {
        vulnerabilities.push('No Anti-Tank: Vulnerable to being ran down by enemy Tanks and Space Makers.');
      } else {
        strengths.push('Solid Anti-Tank foundation shuts down aggressive dives.');
      }

      if (!hasSpaceMakerOrTank && brawlers.length >= 2) {
        vulnerabilities.push('No Space Maker: Leaves your team open to free enemy last-pick Throwers/Snipers.');
      }

      if (!hasDamageDealer) {
        vulnerabilities.push('Low Burst Damage: High-HP Tanks (Draco/Frank) can stat-check and walk through your team.');
      }
    }

    return {
      hasAntiTank,
      hasSpaceMakerOrTank,
      hasDamageDealer,
      hasSupport,
      burstRating,
      effectiveHpRating,
      rangeRating,
      vulnerabilities,
      strengths,
    };
  }

  /**
   * Recommends optimal bans based on pick side and map context (Bobby's Asymmetric Ban Theory)
   */
  public static recommendBans(session: DraftSession): BanRecommendation[] {
    const macroMeta = getMacroMeta(session.map.mode);
    const userIsFirstPick = session.userSide === 'TEAM_A';
    const banned = getAllBannedBrawlers(session);

    const availableBrawlers = BRAWLERS.filter(b => !banned.includes(b.id));
    const recommendations: BanRecommendation[] = [];

    if (!userIsFirstPick) {
      // OPPONENT HAS 1ST PICK -> BAN TOP 3 S-TIER FIRST PICKS / OVERTUNED PICKS
      availableBrawlers.forEach(brawler => {
        let score = 0;
        let rationale = '';

        // Mode specific top priorities
        if (session.map.mode === 'HOT_ZONE') {
          if (brawler.id === 'clancy' || brawler.id === 'lou' || brawler.id === 'crow') {
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
          if (brawler.id === 'crow' || brawler.id === 'colette' || brawler.id === 'otis' || brawler.id === 'chester' || brawler.id === 'nyx' || brawler.id === 'sirius') {
            score += 95;
            rationale = `S-tier first pick on ${session.map.name}. Strip the opponent of top draft foundation.`;
          } else if (brawler.archetype === 'ANTI_TANK') {
            score += 80;
            rationale = `High-tier Anti-Tank threat.`;
          }
        } else {
          // PASSIVE META (Bounty / Knockout)
          if (brawler.id === 'pierce' || brawler.id === 'gene' || brawler.id === 'nyx' || brawler.id === 'rt') {
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
          // In Bounty/KO, ban 2/3 flex stabilizers (Belle, Byron)
          if (brawler.id === 'belle' || brawler.id === 'byron') {
            score += 95;
            strategy = 'BAN_FLEX_23';
            rationale = `Top 2/3 flex stabilizer. Banning takes away opponent's best comp rounding tool against your 1st pick.`;
          }
        } else {
          // In Aggro modes, ban 2/3 flex control or hyper-aggro (Stu, Lumi, Leon, Mortis, Edgar)
          if (brawler.id === 'stu' || brawler.id === 'lumi' || brawler.id === 'leon' || brawler.id === 'edgar' || brawler.id === 'mortis') {
            score += 90;
            strategy = 'BAN_FLEX_23';
            rationale = `Strong 2/3 flex pick. Destroys mid-range matchups against your first-picked anti-tank.`;
          }
        }

        // Strategy B: Ban cheese last-picks on specific terrain
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
   * Recommends picks for the current turn with detailed Bobby pro heuristics
   */
  public static recommendPicks(session: DraftSession): PickRecommendation[] {
    const slot = session.currentSlot;
    const pickingSide = getPickTeamForSlot(slot);
    const allyPickedIds = pickingSide === 'TEAM_A' ? session.picks.teamA : session.picks.teamB;
    const enemyPickedIds = pickingSide === 'TEAM_A' ? session.picks.teamB : session.picks.teamA;

    const allyBrawlers = allyPickedIds.map(id => BRAWLER_MAP[id]).filter(Boolean);
    const enemyBrawlers = enemyPickedIds.map(id => BRAWLER_MAP[id]).filter(Boolean);

    const allyComp = this.evaluateComp(allyBrawlers);
    const enemyComp = this.evaluateComp(enemyBrawlers);

    const unavailable = [...getAllBannedBrawlers(session), ...getAllPickedBrawlers(session)];
    const candidateBrawlers = BRAWLERS.filter(b => !unavailable.includes(b.id));

    const macroMeta = getMacroMeta(session.map.mode);
    const recommendations: PickRecommendation[] = [];

    candidateBrawlers.forEach(brawler => {
      let score = brawler.modeScores[session.map.mode];
      let roleInDraft = 'Core Pick';
      let rationale = '';
      let riskWarning: string | undefined;

      // Matchup analysis against enemy picked team
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

      // Synergy analysis with ally picked team
      allyBrawlers.forEach(ally => {
        if (brawler.synergies.includes(ally.archetype) || brawler.synergies.includes(ally.id)) {
          score += 10;
        }
      });

      // --- SLOT 1: FIRST PICK (TEAM A PICK 1) ---
      if (slot === 1) {
        if (macroMeta === 'AGGRO') {
          if (session.map.mode === 'HOT_ZONE' && (brawler.id === 'lou' || brawler.id === 'clancy' || brawler.id === 'crow')) {
            score += 40;
            roleInDraft = '1st Pick King (Hot Zone)';
            rationale = `Unbeatable Hot Zone first pick. Locks down the capture zone and forces enemy onto predictable ranged counters.`;
          } else if (session.map.mode === 'HEIST' && (brawler.id === 'crow' || brawler.id === 'colt' || brawler.id === 'colette')) {
            score += 40;
            roleInDraft = '1st Pick Safe Melter / Anti-Tank';
            rationale = `Best Heist first pick. Shuts down enemy safe runners (Chuck/Melodie) while dealing immense safe damage.`;
          } else if (brawler.archetype === 'ANTI_TANK') {
            score += 35;
            roleInDraft = '1st Pick Anti-Tank Anchor';
            rationale = `Golden Rule: Always first pick the best available Anti-Tank in aggro modes. Provides CC, burst DPS, and shuts down tanks.`;
          } else if (brawler.id === 'willow') {
            score += 30;
            roleInDraft = 'Special 1st Pick Thrower';
            rationale = `Willow is the only early-pickable thrower due to her anti-tank Dive gadget and Mind-Control Super.`;
          } else if (brawler.archetype === 'CONTROL') {
            score -= 25;
            riskWarning = `Never first pick Control! Opponent will draft Anti-Tank + Space Maker (e.g. Lou + Kenji) and run you down.`;
          } else if (brawler.archetype === 'THROWER' || brawler.archetype === 'SNIPER') {
            score -= 40;
            riskWarning = `First picking Throwers or pure Snipers is an instant loss in high-level draft.`;
          }
        } else {
          // PASSIVE META (Bounty / Knockout 1st Pick)
          if (brawler.id === 'pierce' || brawler.id === 'gene' || brawler.id === 'leon' || brawler.id === 'rt' || brawler.id === 'angelo') {
            score += 40;
            roleInDraft = '1st Pick Resilient Anchor';
            rationale = `Top tier first pick in ${session.map.mode}. Highly resilient against aggro dives and controls long lanes.`;
          } else if (brawler.archetype === 'THROWER') {
            score -= 50;
            riskWarning = `Never early pick throwers in Knockout/Bounty. Opponent will draft Mortis/Darryl and crush you.`;
          }
        }
      }

      // --- SLOTS 2 & 3: COUNTER-PICKS (TEAM B PICKS 1 & 2) ---
      else if (slot === 2 || slot === 3) {
        if (macroMeta === 'AGGRO') {
          if (brawler.archetype === 'ANTI_TANK') {
            score += 30;
            roleInDraft = '2/3 Anti-Tank Response';
            rationale = `Secures the next best Anti-Tank to stabilize your comp against enemy 1st pick.`;
          } else if (brawler.archetype === 'SPACE_MAKER' && enemyBrawlers.some(e => e.id === 'ruffs' || e.burstDamage <= 6)) {
            score += 35;
            roleInDraft = '2/3 Aggressive Punish';
            rationale = `Punishes enemy weak damage/support 1st pick (e.g. Ruffs) with instant space creation.`;
          } else if (brawler.archetype === 'CONTROL') {
            score += 20;
            roleInDraft = '2/3 Flex Control';
            rationale = `Out-duels enemy anti-tanks in 1v1 lane control.`;
          }
        } else {
          // PASSIVE META (2/3 Picks)
          if (brawler.id === 'belle' || brawler.id === 'byron' || brawler.id === 'gus' || brawler.id === 'nani' || brawler.id === 'rt') {
            score += 35;
            roleInDraft = '2/3 Flex Stabilizer';
            rationale = `Top 2/3 pick in Bounty/KO. Hard to counter, traps/shields provide dive defense, and rounds out comp.`;
          } else if (brawler.id === 'mina' || brawler.id === 'mortis' || brawler.id === 'carl' || brawler.id === 'kaze' || brawler.id === 'jay') {
            score += 25;
            roleInDraft = '2/3 Blue Star Secure';
            rationale = `High-mobility blue star secure in Bounty. Forces enemy into unfavorable pushes.`;
          }
        }
      }

      // --- SLOTS 4 & 5: MID-DRAFT BALANCING (TEAM A PICKS 2 & 3) ---
      else if (slot === 4 || slot === 5) {
        // Rule: If team lacks Anti-Tank, MUST commit to Anti-Tank!
        if (!allyComp.hasAntiTank && (brawler.archetype === 'ANTI_TANK' || brawler.id === 'willow')) {
          score += 45;
          roleInDraft = 'Mandatory Anti-Tank Fix';
          rationale = `Critical: Your team has no Anti-Tank. You must secure an Anti-Tank now or get ran down.`;
        }

        // Rule: If enemy has high mobility / squishies / throwers (e.g. Juju or Jay+Bo) -> Draft Space Maker!
        if (enemyBrawlers.some(e => e.archetype === 'THROWER' || e.archetype === 'SNIPER' || e.burstDamage <= 6)) {
          if (brawler.archetype === 'SPACE_MAKER') {
            score += 35;
            roleInDraft = 'Space Maker Lockout';
            rationale = `Enemy has low damage or thrower threat. Space Maker closes distance, dives backline, and prevents free enemy last-pick thrower.`;
          }
        }

        // Rule: If enemy drafted Space Maker -> Draft Tank ("Being Bigger")
        if (enemyBrawlers.some(e => e.archetype === 'SPACE_MAKER')) {
          if (brawler.archetype === 'TANK') {
            score += 35;
            roleInDraft = 'Tank Stat-Check ("Being Bigger")';
            rationale = `Enemy has an assassin/space maker. Tanks possess 10k+ HP and stat-check them in 1v1s.`;
          }
        }

        // Heist specific 4/5: Bull / Kaze / Safe Melter
        if (session.map.mode === 'HEIST' && (brawler.id === 'bull' || brawler.id === 'kaze' || brawler.id === 'kenji')) {
          score += 30;
          roleInDraft = 'Heist Safe Melter & Space Maker';
          rationale = `Dominates enemy mid-range control (Bibi/Meeple) with overwhelming safe pressure and HP.`;
        }
      }

      // --- SLOT 6: LAST PICK (TEAM B PICK 3) - ULTIMATE PUNISH ---
      else if (slot === 6) {
        const enemyHasSpaceMaker = enemyBrawlers.some(e => e.archetype === 'SPACE_MAKER');
        const enemyHasAntiTank = enemyBrawlers.some(e => e.archetype === 'ANTI_TANK' || e.id === 'willow');
        const enemyAllSquishy = enemyBrawlers.every(e => e.health <= 7200);

        // Case A: Enemy has NO Space Makers -> Free Thrower Win!
        if (!enemyHasSpaceMaker && brawler.archetype === 'THROWER') {
          score += 50;
          roleInDraft = '100% Win Condition Thrower';
          rationale = `Enemy has ZERO space makers or dive threat. Free Thrower last pick is an uncontestable 100% win.`;
        }

        // Case B: Enemy has low DPS + Ally has Draco/Tank -> Support Healer / Frank
        if (allyBrawlers.some(a => a.archetype === 'TANK') && enemyComp.burstRating < 65) {
          if (brawler.id === 'poco' || brawler.id === 'berry') {
            score += 45;
            roleInDraft = 'Immortal Tank Enabler';
            rationale = `Enemy lacks burst DPS to kill a healing tank. Poco/Berry healing turns your tank immortal.`;
          } else if (brawler.id === 'frank') {
            score += 40;
            roleInDraft = 'Double Tank Stat-Check';
            rationale = `Enemy lacks damage to take out high-HP brawlers. Frank out-HPs them completely.`;
          }
        }

        // Case C: Enemy has multiple snipers & throwers -> Darryl / Bull / Mortis
        if (enemyBrawlers.some(e => e.archetype === 'THROWER') && enemyAllSquishy) {
          if (brawler.id === 'darryl' || brawler.id === 'bull' || brawler.id === 'mortis') {
            score += 45;
            roleInDraft = 'Anti-Squishy Heavy Dive';
            rationale = `Enemy is all low-HP snipers/throwers with no tank shred. Darryl / Bull passive super wipes them.`;
          }
        }

        // Case D: Enemy has NO Anti-Tanks -> Free Tank Win!
        if (!enemyHasAntiTank && brawler.archetype === 'TANK') {
          score += 40;
          roleInDraft = 'Uncountered Tank Stat-Check';
          rationale = `Enemy drafted zero Anti-Tanks. Tank out-HPs and runs through their comp.`;
        }
      }

      // Pro Tier multiplier
      if (brawler.tier === 'S') score += 10;
      if (brawler.isOvertuned) score += 10;

      // Compute letter grade
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
          rationale: rationale || `Strong ${brawler.archetype.replace('_', ' ')} pick matching current map and team comp needs.`,
          countersCount,
          riskWarning,
        });
      }
    });

    return recommendations.sort((a, b) => b.score - a.score);
  }
}
