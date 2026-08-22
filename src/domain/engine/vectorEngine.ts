import { Brawler } from '../models/brawler';
import { BrawlMap } from '../models/map';
import {
  CompositionVector,
  ExploitableEnemyFlaw,
  LaneMatchup,
  MacroPlaybook,
  MatchupDelta,
  PriorityPinchTarget,
  StrategicEnemyThreat,
  StrategicWinCondition,
} from '../models/draftVector';

export class VectorEngine {
  private static readonly HEAVY_TANK_IDS = new Set([
    'draco', 'frank', 'buster', 'meg', 'bull', 'el_primo', 'rosa', 'jacky', 'ash', 'hank',
  ]);

  private static readonly HEAVY_SHREDDER_IDS = new Set([
    'colette', 'chester', 'clancy', 'crow', 'otis', 'griff', 'spike', 'gale', 'surge', 'lumi',
  ]);

  private static readonly DIVER_IDS = new Set([
    'kenji', 'kaze', 'nori', 'mortis', 'edgar', 'mico', 'lily', 'bolt', 'ollie', 'crow', 'surge', 'shade', 'buzz',
  ]);

  private static readonly THROWER_IDS = new Set([
    'berry', 'dynamike', 'larry_lawrie', 'sirius', 'tick', 'sprout', 'grom', 'barley', 'juju', 'willow',
  ]);

  private static readonly HEALER_SUPPORT_IDS = new Set([
    'poco', 'byron', 'berry', 'pam', 'gus', 'kit', 'ruffs',
  ]);

  private static readonly WALL_BREAKER_IDS = new Set([
    'brock', 'colt', 'griff', 'stu', 'piper', 'shelly', 'bull', 'el_primo', 'frank', 'rt',
  ]);

  /**
   * Computes a normalized 6-dimensional Composition Vector (0 to 100) for any team lineup.
   */
  public static computeVector(brawlers: Brawler[], _map?: BrawlMap): CompositionVector {
    if (!brawlers || brawlers.length === 0) {
      return {
        burstShred: 0,
        effectiveRange: 0,
        diveMobility: 0,
        indirectArtillery: 0,
        effectiveHP: 0,
        hardCC: 0,
        wallBreak: 0,
      };
    }

    const n = brawlers.length;

    // 1. Burst Shred: Dedicated ability to melt 10k+ HP tanks and safe objectives
    let shredSum = 0;
    brawlers.forEach(b => {
      let bShred = 20;
      if (this.HEAVY_SHREDDER_IDS.has(b.id)) {
        bShred = 95;
      } else if (b.archetype === 'ANTI_TANK') {
        bShred = 85;
      } else if (b.burstDamage >= 8 && b.archetype !== 'SNIPER') {
        bShred = 60;
      } else if (b.burstDamage >= 7) {
        bShred = 35;
      }
      shredSum += Math.min(100, bShred);
    });
    const burstShred = Math.min(100, Math.round(shredSum / n));

    // 2. Effective Range: Threat radius and sightline control
    let rangeSum = 0;
    brawlers.forEach(b => {
      if (b.archetype === 'SNIPER') rangeSum += 95;
      else if (b.archetype === 'CONTROL') rangeSum += 75;
      else if (b.archetype === 'THROWER') rangeSum += 75;
      else if (b.archetype === 'ANTI_TANK') rangeSum += 60;
      else if (b.archetype === 'SUPPORT') rangeSum += 65;
      else if (b.archetype === 'SPACE_MAKER') rangeSum += 45;
      else rangeSum += 35;
    });
    const effectiveRange = Math.min(100, Math.round(rangeSum / n));

    // 3. Dive Mobility: Jump/dash speed to reach backliners and bypass walls
    let diveSum = 0;
    brawlers.forEach(b => {
      if (this.DIVER_IDS.has(b.id) || b.archetype === 'SPACE_MAKER') diveSum += 90;
      else if (b.hasHypercharge && (b.id === 'fang' || b.id === 'bibi')) diveSum += 75;
      else if (b.archetype === 'TANK') diveSum += 40;
      else diveSum += 10;
    });
    const diveMobility = Math.min(100, Math.round(diveSum / n));

    // 4. Indirect Artillery: Safe damage over walls
    let throwerSum = 0;
    brawlers.forEach(b => {
      if (this.THROWER_IDS.has(b.id) || b.archetype === 'THROWER') throwerSum += 95;
      else if (b.id === 'squeak' || b.id === 'mr_p') throwerSum += 50;
      else throwerSum += 0;
    });
    const indirectArtillery = Math.min(100, Math.round(throwerSum / n));

    // 5. Effective HP: Frontline bulk and sustain
    let hpSum = 0;
    const hasHealer = brawlers.some(b => this.HEALER_SUPPORT_IDS.has(b.id));
    brawlers.forEach(b => {
      let hpScore = Math.round((b.health / 11000) * 80);
      if (this.HEAVY_TANK_IDS.has(b.id)) hpScore += 25;
      if (hasHealer) hpScore += 20;
      hpSum += Math.min(100, hpScore);
    });
    const effectiveHP = Math.min(100, Math.round(hpSum / n));

    // 6. Hard CC: Stuns, knockbacks, freezes, silences
    let ccSum = 0;
    brawlers.forEach(b => {
      let cc = 10;
      if (b.hasStunOrMute) cc += 50;
      if (b.hasKnockback) cc += 35;
      if (b.id === 'lou' || b.id === 'otis' || b.id === 'gale' || b.id === 'surge') cc += 30;
      ccSum += Math.min(100, cc);
    });
    const hardCC = Math.min(100, Math.round(ccSum / n));

    // 7. Wall Break
    let wallSum = 0;
    brawlers.forEach(b => {
      if (b.hasWallBreak || this.WALL_BREAKER_IDS.has(b.id)) wallSum += 90;
      else wallSum += 0;
    });
    const wallBreak = Math.min(100, Math.round(wallSum / n));

    return {
      burstShred,
      effectiveRange,
      diveMobility,
      indirectArtillery,
      effectiveHP,
      hardCC,
      wallBreak,
    };
  }

  /**
   * Universal Matchup & Delta Engine:
   * Generates all tactical analytics, win conditions, threats, and exploit flaws.
   */
  public static computeDelta(
    allyBrawlers: Brawler[],
    enemyBrawlers: Brawler[],
    map: BrawlMap
  ): MatchupDelta {
    const allyVector = this.computeVector(allyBrawlers, map);
    const enemyVector = this.computeVector(enemyBrawlers, map);

    // 1. Ally Strengths & Vulnerabilities
    const allyStrengths: string[] = [];
    const allyVulnerabilities: string[] = [];

    if (allyVector.burstShred >= 65) {
      allyStrengths.push('High Burst DPS: Melts aggressive dives and frontline tanks on contact.');
    }
    if (allyVector.effectiveRange >= 75) {
      allyStrengths.push('Long-Range Threat: Outranges opponents and controls open sightlines.');
    }
    if (allyVector.diveMobility >= 50) {
      allyStrengths.push('Space Maker / Dive secured: Denies enemy free Thrower & Sniper abuse.');
    }
    if (allyVector.indirectArtillery >= 40) {
      allyStrengths.push('Indirect Artillery: Rains safe, continuous damage over unbreakable walls.');
    }
    if (allyVector.effectiveHP >= 65) {
      allyStrengths.push('Heavy Frontline Bulk: High effective HP pool stat-checks low burst damage.');
    }
    if (allyVector.hardCC >= 50) {
      allyStrengths.push('Hard Crowd Control: Stuns & knockbacks reliably cancel enemy supers and dives.');
    }

    if (enemyBrawlers.length > 0) {
      if (allyVector.burstShred < 50 && enemyVector.effectiveHP >= 65) {
        allyVulnerabilities.push('Low Burst DPS: High-HP enemy frontline can stat-check and push forward.');
      }
      if (allyVector.diveMobility < 30 && allyVector.wallBreak < 30 && enemyVector.indirectArtillery >= 40) {
        allyVulnerabilities.push('No Dive / Wall-Breaker: Vulnerable to indirect wall artillery from enemy Throwers.');
      }
      if (allyVector.effectiveRange < 55 && allyVector.diveMobility < 35 && enemyVector.effectiveRange >= 75) {
        allyVulnerabilities.push('Outranged: Lacks long-range poke or dive mobility to contest enemy Snipers.');
      }
      if (allyVector.hardCC < 35 && enemyVector.diveMobility >= 55) {
        allyVulnerabilities.push('Low Crowd Control: Vulnerable to aggressive enemy assassin dives.');
      }
    }

    // 2. Enemy Strengths & Vulnerabilities
    const enemyStrengths: string[] = [];
    const enemyVulnerabilities: string[] = [];

    if (enemyVector.burstShred >= 65) enemyStrengths.push('High burst DPS shreds frontline targets quickly.');
    if (enemyVector.effectiveRange >= 75) enemyStrengths.push('Long-range sniper reach controls open sightlines.');
    if (enemyVector.diveMobility >= 50) enemyStrengths.push('High dive mobility threatens squishy backliners.');
    if (enemyVector.indirectArtillery >= 40) enemyStrengths.push('Indirect artillery creates oppressive wall pressure.');
    if (enemyVector.effectiveHP >= 65) enemyStrengths.push('High frontline HP stat-checks low burst comps.');

    if (enemyBrawlers.length === 3) {
      if (enemyVector.burstShred < 45) {
        enemyVulnerabilities.push('Zero Anti-Tank: Opponent lacks burst shred to stop heavy tanks.');
      }
      if (enemyVector.diveMobility < 30) {
        enemyVulnerabilities.push('Zero Dive: Opponent cannot reach backline throwers or snipers.');
      }
      if (enemyVector.effectiveRange < 55 && enemyVector.diveMobility < 35) {
        enemyVulnerabilities.push('Outranged: Opponent lacks long-range poke or dive to contest range.');
      }
      if (enemyVector.hardCC < 35 && allyVector.diveMobility >= 50) {
        enemyVulnerabilities.push('Low CC: Opponent cannot reliably stop aggressive assassinations.');
      }
    }

    // 3. Primary Ally Win Condition
    let primaryAllyWinCondition: StrategicWinCondition;
    if (allyVector.effectiveRange >= 70 && allyVector.effectiveHP < 65 && allyVector.diveMobility < 45) {
      primaryAllyWinCondition = {
        id: 'LONG_RANGE_SIEGE',
        title: '🎯 Long-Range Poke & Pick Siege',
        strategyName: 'Long-Range Poke & Pick',
        tacticalSummary: `Control spacing and tag targets from extreme distance. Never overextend past mid-map; let your superior range bleed enemy HP.`,
        keyExecutors: allyBrawlers.filter(b => b.archetype === 'SNIPER' || b.archetype === 'CONTROL').map(b => b.name),
        bulletPoints: [
          'Maintain disciplined spacing and abuse sightline advantage.',
          'Hold choke points; force enemies to walk into crossfire.',
          'Never push past mid cover unless an enemy is confirmed eliminated.',
        ],
      };
    } else if (allyVector.effectiveHP >= 60 && enemyVector.burstShred < 50) {
      primaryAllyWinCondition = {
        id: 'HEAVY_TANK_OVERRUN',
        title: '🧱 Heavy Tank & Bulk Stat-Check Overrun',
        strategyName: 'Heavy Tank Overrun',
        tacticalSummary: `Opponent lacks burst shred. Use your massive HP pool and sustain to push in a 3-man line and walk directly onto objectives.`,
        keyExecutors: allyBrawlers.filter(b => b.archetype === 'TANK' || b.archetype === 'SPACE_MAKER').map(b => b.name),
        bulletPoints: [
          'Push as a synchronized 3-man frontline unit.',
          'Absorb single-target poke with high HP and bodyblock for teammates.',
          'Trap the opponent in their spawn chokepoints.',
        ],
      };
    } else if (allyVector.indirectArtillery >= 30 && (map.terrain === 'WALLED' || enemyVector.diveMobility < 40)) {
      primaryAllyWinCondition = {
        id: 'INDIRECT_WALL_ARTILLERY',
        title: '💣 Indirect Wall Artillery & Chokepoint Lock',
        strategyName: 'Wall Artillery & Chokepoint Lock',
        tacticalSummary: `Rain safe damage over walls while side-duelists prevent flanking. Opponent has no dive mobility to punish your artillery.`,
        keyExecutors: allyBrawlers.filter(b => b.archetype === 'THROWER').map(b => b.name),
        bulletPoints: [
          'Anchor behind unbreakable mid walls and zone objective paths.',
          'Side laners must prioritize protecting throwers from flanks.',
          'Pre-fire chokepoints to deny enemy health regeneration.',
        ],
      };
    } else if (allyVector.diveMobility >= 50 && (enemyVector.indirectArtillery >= 35 || enemyVector.effectiveRange >= 70)) {
      primaryAllyWinCondition = {
        id: 'DIVE_ASSASSINATION',
        title: '⚡ Aggressive Dive & Backline Elimination',
        strategyName: 'Dive Assassination',
        tacticalSummary: `Identify isolated enemy backliners and coordinate flanking dives to delete key damage dealers before they establish control.`,
        keyExecutors: allyBrawlers.filter(b => b.archetype === 'SPACE_MAKER').map(b => b.name),
        bulletPoints: [
          'Hold bushes and control side lanes until Super or gadgets are ready.',
          'Collapse as a team when your Space Maker initiates the dive.',
          'Do not let divers engage 1v3 without backline trade support.',
        ],
      };
    } else if (allyVector.burstShred >= 65 && allyVector.hardCC >= 50) {
      primaryAllyWinCondition = {
        id: 'ANTI_TANK_LOCKDOWN',
        title: '🛡️ Anti-Tank Lockdown & Objective Denial',
        strategyName: 'Anti-Tank & Zone Lockdown',
        tacticalSummary: `Anchor the center of the map. Punish any enemy advance with high burst and CC, converting defense into permanent map control.`,
        keyExecutors: allyBrawlers.filter(b => b.archetype === 'ANTI_TANK' || b.archetype === 'CONTROL').map(b => b.name),
        bulletPoints: [
          'Hold mid lane and wait for opponent to commit onto objectives.',
          'Chain stuns, knockbacks, and burst shred on advancing targets.',
          'Maintain lane symmetry to avoid getting flanked.',
        ],
      };
    } else {
      primaryAllyWinCondition = {
        id: 'BALANCED_CONTROL',
        title: '👑 Balanced Control & Pinch Pressure',
        strategyName: 'Balanced Control',
        tacticalSummary: `Execute textbook lane control. Win your individual 1v1 matchups, then rotate inward to execute 2v1 pinches on the mid lane.`,
        keyExecutors: allyBrawlers.map(b => b.name),
        bulletPoints: [
          'Hold lane discipline and win 1v1 duels without overextending.',
          'Rotate inward to pinch the enemy mid anchor once side lane is won.',
          'Reset to cover immediately if an ally falls.',
        ],
      };
    }

    // 4. Primary Enemy Threat
    let primaryEnemyThreat: StrategicEnemyThreat;
    if (enemyVector.diveMobility >= 55) {
      primaryEnemyThreat = {
        id: 'ENEMY_DIVE_BLITZ',
        title: '⚡ Enemy Aggressive Dive & Flank Blitz',
        threatSummary: `Enemy relies on high-mobility assassins to dive your backline and snowball with Super charges.`,
        keyThreats: enemyBrawlers.filter(b => this.DIVER_IDS.has(b.id) || b.archetype === 'SPACE_MAKER').map(b => b.name),
        counterTactics: [
          'Maintain visual on bushes and avoid isolating squishy teammates.',
          'Save knockbacks and CC gadgets strictly for the moment of the dive.',
          'Instantly 3-man collapse on the diver when they land.',
        ],
      };
    } else if (enemyVector.indirectArtillery >= 45) {
      primaryEnemyThreat = {
        id: 'ENEMY_WALL_ARTILLERY',
        title: '💣 Enemy Indirect Wall Artillery',
        threatSummary: `Enemy throwers will rain indirect fire from safety behind mid walls, trying to spawn-trap your team.`,
        keyThreats: enemyBrawlers.filter(b => this.THROWER_IDS.has(b.id) || b.archetype === 'THROWER').map(b => b.name),
        counterTactics: [
          'Push side lanes aggressively to get behind the thrower’s wall cover.',
          'Break key defensive walls with supers/gadgets at the earliest opportunity.',
          'Pinch from two opposite angles so the thrower has nowhere to hide.',
        ],
      };
    } else if (enemyVector.effectiveRange >= 70 && enemyVector.effectiveHP < 65) {
      primaryEnemyThreat = {
        id: 'ENEMY_SNIPER_SIEGE',
        title: '🎯 Enemy Long-Range Sniper Sightlines',
        threatSummary: `Enemy possesses superior long-range burst. Open lanes and predictable movement will result in rapid eliminations.`,
        keyThreats: enemyBrawlers.filter(b => b.archetype === 'SNIPER').map(b => b.name),
        counterTactics: [
          'Use natural terrain to advance; never peek straight lines in open ground.',
          'Coordinate side-lane pinches from two angles to deny single-direction cover.',
          'Dodge erratically and count sniper ammo before committing to trades.',
        ],
      };
    } else if (enemyVector.effectiveHP >= 65) {
      primaryEnemyThreat = {
        id: 'ENEMY_TANK_STATCHECK',
        title: '🧱 Enemy Heavy Frontline Stat-Check Bulk',
        threatSummary: `Enemy will attempt to absorb poke with high HP and force aggressive trades directly on the objective.`,
        keyThreats: enemyBrawlers.filter(b => this.HEAVY_TANK_IDS.has(b.id) || b.archetype === 'TANK').map(b => b.name),
        counterTactics: [
          'Kite backwards and maintain maximum distance.',
          'Focus fire as a team; do not split damage across multiple targets.',
          'Save burst ammo and supers for when tanks attempt to close distance.',
        ],
      };
    } else {
      primaryEnemyThreat = {
        id: 'ENEMY_BALANCED_THREAT',
        title: '👑 Enemy Balanced Lane Control',
        threatSummary: `Enemy comp has well-rounded lanes. Expect steady mid pressure and coordinated flanking rotations.`,
        keyThreats: enemyBrawlers.map(b => b.name),
        counterTactics: [
          'Do not lose lane priority early.',
          'Track enemy super charges and hypercharges carefully.',
          'Reset and hold your side of the mid chokepoints when teammates are eliminated.',
        ],
      };
    }

    // 5. Exploitable Enemy Flaws (When enemy has 3 picks)
    const exploitableEnemyFlaws: ExploitableEnemyFlaw[] = [];
    if (enemyBrawlers.length === 3) {
      if (enemyVector.burstShred < 45) {
        exploitableEnemyFlaws.push({
          id: 'EXPLOIT_NO_ANTITANK',
          title: '💥 0 Anti-Tank: Heavy Tank / Stat-Check Overrun',
          description: `Opponent drafted ZERO Anti-Tanks (${enemyBrawlers.map(b => b.name).join(', ')}). They cannot melt high-HP bulk. Heavy Tanks (Draco, Frank, Buster, Meg) walk straight into them with zero risk of dying.`,
          exploitRole: 'TANK',
        });
      }
      if (enemyVector.diveMobility < 30) {
        exploitableEnemyFlaws.push({
          id: 'EXPLOIT_NO_DIVE',
          title: '💣 0 Dive Mobility: Free Thrower / Sniper Artillery',
          description: `Opponent drafted ZERO Space Makers or dive threats. A Thrower (Berry, Dynamike, Larry) is 100% untouchable behind walls and gets free infinite damage.`,
          exploitRole: 'THROWER',
        });
      }
      if (enemyVector.effectiveRange < 55 && enemyVector.diveMobility < 35) {
        exploitableEnemyFlaws.push({
          id: 'EXPLOIT_OUTRANGED',
          title: '🎯 Severe Range Deficit: Long-Range Siege',
          description: `Opponent has short effective range and no dive tools. Snipers (Belle, Byron, Piper, Nani) can dismantle them from outside their weapon range.`,
          exploitRole: 'SNIPER',
        });
      }
    }

    // 6. Optimal Lane Matchups Matrix
    const laneMatchups = this.calculateOptimalLanes(allyBrawlers, enemyBrawlers);

    // 7. Macro Playbook & Priority Pinch Target
    const macroPlaybook = this.generateMacroPlaybook(allyBrawlers, enemyBrawlers, laneMatchups, map);

    return {
      allyVector,
      enemyVector,
      allyStrengths,
      allyVulnerabilities,
      enemyStrengths,
      enemyVulnerabilities,
      primaryAllyWinCondition,
      primaryEnemyThreat,
      exploitableEnemyFlaws,
      laneMatchups,
      macroPlaybook,
    };
  }

  /**
   * Calculates optimal 1v1 lane assignments avoiding suicide matchups.
   */
  public static calculateOptimalLanes(
    allyBrawlers: Brawler[],
    enemyBrawlers: Brawler[]
  ): LaneMatchup[] {
    if (allyBrawlers.length === 0 || enemyBrawlers.length === 0) return [];

    const laneLabels: ('Mid Anchor' | 'Left Lane' | 'Right Lane')[] = [
      'Mid Anchor', 'Left Lane', 'Right Lane'
    ];

    const evaluatePair = (ally: Brawler, enemy: Brawler): { advantage: 'ALLY_FAVORED' | 'ENEMY_FAVORED' | 'EVEN'; tip: string; score: number } => {
      let score = 0;
      let tip = '';

      const allyCountersEnemy = ally.counters.includes(enemy.archetype) || ally.counters.includes(enemy.id);
      const enemyCountersAlly = ally.counteredBy.includes(enemy.archetype) || ally.counteredBy.includes(enemy.id);

      if (allyCountersEnemy && !enemyCountersAlly) {
        score += 30;
        tip = `${ally.name} has strong matchup advantage over ${enemy.name}. Pressure lane aggressively.`;
      } else if (enemyCountersAlly && !allyCountersEnemy) {
        score -= 30;
        tip = `Caution: ${enemy.name} has counter advantage. Play defensively, hug walls, and request team pinch.`;
      } else {
        tip = `Even 1v1 duel. Focus on positioning, dodging skillshots, and holding lane control.`;
      }

      const advantage: 'ALLY_FAVORED' | 'ENEMY_FAVORED' | 'EVEN' =
        score >= 20 ? 'ALLY_FAVORED' : score <= -20 ? 'ENEMY_FAVORED' : 'EVEN';

      return { advantage, tip, score };
    };

    // Sort allies: Mid Anchor controller first
    const getMidScore = (b: Brawler): number => {
      if (b.id === 'gene' || b.id === 'lou' || b.id === 'byron' || b.id === 'belle' || b.id === 'rt' || b.id === 'amber') return 90;
      if (b.archetype === 'CONTROL' || b.archetype === 'SNIPER') return 75;
      if (b.archetype === 'ANTI_TANK') return 60;
      return 30;
    };

    const sortedAlly = [...allyBrawlers].sort((a, b) => getMidScore(b) - getMidScore(a));
    const orderedAlly = [
      sortedAlly[0] || allyBrawlers[0],
      sortedAlly[1] || allyBrawlers[1] || allyBrawlers[0],
      sortedAlly[2] || allyBrawlers[2] || allyBrawlers[0],
    ];

    const remainingEnemy = [...enemyBrawlers];
    if (remainingEnemy.length < 3) {
      while (remainingEnemy.length < 3) remainingEnemy.push(remainingEnemy[0]);
    }

    let bestMidEnemyIdx = 0;
    let bestMidScore = -999;
    remainingEnemy.forEach((e, eIdx) => {
      const eMidScore = getMidScore(e);
      if (eMidScore > bestMidScore) {
        bestMidScore = eMidScore;
        bestMidEnemyIdx = eIdx;
      }
    });
    const midEnemy = remainingEnemy.splice(bestMidEnemyIdx, 1)[0];

    const optA = evaluatePair(orderedAlly[1], remainingEnemy[0]).score + evaluatePair(orderedAlly[2], remainingEnemy[1]).score;
    const optB = evaluatePair(orderedAlly[1], remainingEnemy[1]).score + evaluatePair(orderedAlly[2], remainingEnemy[0]).score;

    const leftEnemy = optA >= optB ? remainingEnemy[0] : remainingEnemy[1];
    const rightEnemy = optA >= optB ? remainingEnemy[1] : remainingEnemy[0];

    const finalEnemies = [midEnemy, leftEnemy, rightEnemy];
    const matchups: LaneMatchup[] = [];

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
   * Generates the In-Game Macro Playbook and chooses the highest-priority enemy threat to pinch.
   */
  public static generateMacroPlaybook(
    allyBrawlers: Brawler[],
    enemyBrawlers: Brawler[],
    laneMatchups: LaneMatchup[],
    map: BrawlMap
  ): MacroPlaybook {
    let priorityTarget: Brawler | null = null;
    let pinchReason = '';
    let pinchInstructions = '';

    // Sort enemy brawlers by their map threat score
    const rankedEnemies = [...enemyBrawlers].sort((a, b) => {
      const aScore = a.modeScores[map.mode] || 50;
      const bScore = b.modeScores[map.mode] || 50;
      return bScore - aScore;
    });

    const enemyThrower = enemyBrawlers.find(b => this.THROWER_IDS.has(b.id) || b.archetype === 'THROWER');
    const enemySniper = enemyBrawlers.find(b => b.archetype === 'SNIPER');
    const enemyAssassin = enemyBrawlers.find(b => this.DIVER_IDS.has(b.id) || b.archetype === 'SPACE_MAKER');
    const enemyTank = enemyBrawlers.find(b => this.HEAVY_TANK_IDS.has(b.id) || b.archetype === 'TANK');

    if (enemyThrower && map.terrain === 'WALLED') {
      priorityTarget = enemyThrower;
      pinchReason = `${enemyThrower.name} creates oppressive indirect artillery behind walls. If left alone, your team gets pinned.`;
      pinchInstructions = `Win your side lane, then immediately rotate inward to 2v1 pinch ${enemyThrower.name} from two separate angles to deny wall cover.`;
    } else if (enemySniper && (map.terrain === 'OPEN' || map.terrain === 'SEMI_OPEN')) {
      priorityTarget = enemySniper;
      pinchReason = `${enemySniper.name} locks down long sightlines and deals lethal damage from afar.`;
      pinchInstructions = `Coordinate with your teammates to pinch ${enemySniper.name} from multiple angles and deny single-direction cover.`;
    } else if (enemyAssassin) {
      priorityTarget = enemyAssassin;
      pinchReason = `${enemyAssassin.name} looks for isolated targets to charge Super and snowball.`;
      pinchInstructions = `Maintain visual on bushes. When ${enemyAssassin.name} dives, both nearby teammates must immediately collapse and burst them down.`;
    } else if (enemyTank) {
      priorityTarget = enemyTank;
      pinchReason = `${enemyTank.name} has massive HP and pushes objectives with sheer bulk.`;
      pinchInstructions = `Focus fire from multiple angles. Maintain distance and kite to burst ${enemyTank.name} before they close distance.`;
    } else if (rankedEnemies.length > 0) {
      priorityTarget = rankedEnemies[0];
      pinchReason = `Primary enemy anchor and highest-rated power pick on this map.`;
      pinchInstructions = `Coordinate with your teammates to pinch ${rankedEnemies[0].name} from two angles once side lanes are secured.`;
    }

    const laneSwitchingRules: string[] = [];
    laneMatchups.forEach(m => {
      if (m.advantage === 'ALLY_FAVORED') {
        laneSwitchingRules.push(`Keep your lane against ${m.enemy.name}. If ${m.enemy.name} tries to swap lanes to escape ${m.ally.name}, ${m.ally.name} must swap with them to maintain counter pressure.`);
      } else if (m.advantage === 'ENEMY_FAVORED') {
        laneSwitchingRules.push(`If ${m.ally.name} is struggling against ${m.enemy.name}, swap lanes immediately with a teammate who has knockback or range advantage.`);
      }
    });

    const cooldownTracking: string[] = [];
    enemyBrawlers.forEach(enemy => {
      if (enemy.id === 'edgar') cooldownTracking.push(`Track Edgar's Super & Hardcore Shield. Once he lands and burns shield, punish immediately.`);
      else if (enemy.id === 'dynamike') cooldownTracking.push(`Bait Satchel Charge stun gadget before committing your close-range dive into Dynamike.`);
      else if (enemy.id === 'crow') cooldownTracking.push(`Track Crow's Slowing Toxin gadget & Super jump. Don't clump together in narrow corridors.`);
      else if (enemy.id === 'nani') cooldownTracking.push(`Track Nani's Return to Sender gadget and dodge wide when Peep Super is active.`);
      else if (enemy.id === 'piper') cooldownTracking.push(`Track Piper's Auto Aimer knockback gadget & Super escape.`);
      else if (enemy.id === 'gene') cooldownTracking.push(`Count Gene's Super charge. Dodge wide when Magic Hand is ready.`);
      else if (enemy.hasHypercharge) cooldownTracking.push(`Watch for ${enemy.name}'s purple Hypercharge aura. Fall back and kite when activated.`);
    });

    const allyDivers = allyBrawlers.filter(b => b.archetype === 'SPACE_MAKER');
    const teamMovementRule = allyDivers.length > 0
      ? `Hold a solid mid line. When ${allyDivers.map(d => d.name).join('/')} initiates a dive onto the enemy, your backline must push up immediately to trade and support, never letting divers fight 1v3.`
      : `Push forward as a 3-man line when enemies are low. Never 1v3 into enemy spawn. If an ally falls, fall back immediately and hold your side of the mid chokepoints until your team regroups.`;

    const priorityPinch: PriorityPinchTarget | null = priorityTarget ? {
      target: priorityTarget,
      reason: pinchReason,
      pinchInstructions,
    } : null;

    return {
      priorityPinchTarget: priorityPinch,
      laneSwitchingRules: laneSwitchingRules.slice(0, 3),
      cooldownTracking: cooldownTracking.slice(0, 3),
      teamMovementRule,
    };
  }
}
