# BrawlDraft

[![Deploy to GitHub Pages](https://github.com/andreisugu/BrawlDraft/actions/workflows/deploy.yml/badge.svg)](https://github.com/andreisugu/BrawlDraft/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-brightgreen)](https://andreisugu.github.io/BrawlDraft/)

BrawlDraft is a web-based competitive draft assistant and training simulator for Brawl Stars, built around competitive draft theory and competitive tier analyses.

**Live Application:** [https://andreisugu.github.io/BrawlDraft/](https://andreisugu.github.io/BrawlDraft/)

---

## Features

1. **Interactive Draft Room (Live Competitive Advisor)**:
   - **Asymmetric Ban Advisor**: Suggests priority map bans when the enemy team has 1st pick, or flex stabilizers and dangerous last picks when your team has 1st pick.
   - **Slot-by-Slot Recommendations**: Suggests optimal picks for each position (1st Pick Anti-Tank anchor, 2nd/3rd flex stabilizers, 4th/5th Space Maker lockouts, and 6th pick hard-counters).
   - **Tactical Rationales**: Each recommendation provides situational rationale based on map geometry, enemy draft threats, and lane duties.
   - **Real-Time Team Composition Analytics**: Live computation of effective burst DPS, collective health/stat-check resilience, range coverage, and identified team vulnerabilities.

2. **Draft Academy (Interactive Quizzes)**:
   - Contains competitive draft scenarios and ban tests with real-time feedback.
   - Optional speed timer to practice timed tournament draft decision-making.
   - Detailed scoring breakdowns and strategic explanations.

3. **Archetype System & Meta Reference**:
   - Covers the 7 core draft archetypes (Anti-Tank, Space Maker, Tank, Control, Sniper, Thrower, Support).
   - Trait classification for Hypercharge, Crowd Control, Wall Break, Pierce, and utility abilities.
   - Searchable roster with range parameters, health profiles, and drafting context.

---

## Architecture

The draft engine is structured following core software design patterns:
- **Domain Aggregates**: Clean separation between domain models (`Brawler`, `BrawlMap`, `DraftSession`), draft scoring heuristics, and UI components.
- **Deep Modules**: The recommendation engine exposes a minimal surface interface while managing multi-factor scoring matrices, terrain deductions, and matchup matrices internally.
- **Automated Verification**: Comprehensive unit test suite covering draft scenario test cases, property-based composition matrices, and counter-pick allocations.

---

## Quick Start

### Prerequisites
- Node.js 22 or higher (or [Nix](https://nixos.org/))

### Running Locally
```bash
# Enter nix shell (if on NixOS / Nix)
nix-shell

# Install dependencies
npm ci

# Start local development server
npm run dev

# Run automated tests
npm test

# Build production static bundle
npm run build
```

---

## Legal & Disclaimer

This material is unofficial and is not endorsed by Supercell. For more information see [Supercell's Fan Content Policy](https://www.supercell.com/fan-content-policy).

## License

Distributed under the [MIT License](LICENSE).
