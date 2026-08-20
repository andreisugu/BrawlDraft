# BrawlDraft 🏆
> **The Pro Brawl Stars Draft Assistant & Academy** — Based on *"The Best Draft Guide EVER"* (Parts 1 & 2) by **bobby - brawl stars**.

---

## 🎯 Features

1. **Interactive Draft Room (Live Pro Advisor)**:
   - **Asymmetric Ban Advisor**: Automatically advises S-tier map bans when opponents have 1st pick, or 2/3 flex stabilizers / dangerous last picks when your team has 1st pick.
   - **Slot-by-Slot Pro Recommendations**: Recommends the optimal brawler for every pick slot (1st Pick Anti-Tank backbone, 2/3 Stabilizers, 4/5 Space Maker Lockouts, and 6th Pick Hard-Counters).
   - **Bobby's Pro Rationales**: Every recommendation explains *why* (e.g. *"Enemy drafted 2 low DPS snipers $\rightarrow$ Space Maker recommended to deny enemy last-pick thrower"*).
   - **Live Comp Analytics**: Real-time Burst DPS rating, Effective HP stat-check rating, Range score, and live vulnerability warnings.

2. **Pro Draft Academy (16 Interactive Quizzes)**:
   - Contains all **10 Draft Scenarios** from Part 1 and all **6 Ban Tests** from Part 2.
   - Interactive 5-second Pro Speed Timer option.
   - Instant scoring with Bobby's breakdown and pro tips.

3. **7 Archetypes & Meta Cheatsheet**:
   - Deep architectural breakdown of the 7 Pro Draft Classes (**Anti-Tank, Space Maker, Tank, Control, Sniper, Thrower, Support**).
   - Color-coded trait system (Hypercharge, Stun/CC, Wall Break, Pierce, Special).
   - Searchable roster with burst ratings, stats, and custom pro tips.

---

## 🛠️ Architecture & Engineering Principles

This repository strictly obeys:
- **Domain-Driven Design Distilled** (*Vaughn Vernon*): Pure domain aggregates (`Brawler`, `BrawlMap`, `DraftSession`) isolated from UI framework code.
- **A Philosophy of Software Design** (*John Ousterhout*): Deep `DraftEngine` module with minimal surface API hiding complex heuristics and scoring matrices.
- **The Pragmatic Programmer** (*Hunt & Thomas*): DRY metadata representation and 16 automated unit test cases verifying Bobby's scenarios.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 22+ or [Nix](https://nixos.org/)

### Run Locally
```bash
# Enter nix shell (if on NixOS/Nix)
nix-shell

# Install dependencies
npm install

# Start development server
npm run dev

# Run all 16 automated Bobby masterclass acceptance tests
npm test
```
