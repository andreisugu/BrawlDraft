# BrawlDraft Engineering Guidelines

This repository follows the principles established in:
- **Domain-Driven Design Distilled** (Vaughn Vernon): Ubiquitous draft language, aggregate boundaries, decoupling draft heuristics from UI.
- **A Philosophy of Software Design** (John Ousterhout): Deep modules, simple recommendation APIs, information hiding, elimination of special-case sprawl.
- **The Pragmatic Programmer** (Andrew Hunt & David Thomas): Single source of truth for matchup/meta data (DRY), orthogonal modules, tracer-bullet prototyping, and test-driven draft scenarios.

## Core Draft Domain Language
- **Pick Positions**: First Pick (Team A Pick 1), Counter Picks (Team B Picks 1 & 2), Mid Draft (Team A Picks 2 & 3), Last Pick / Sixth Pick (Team B Pick 3).
- **Lane & Mid Allocation**: Mid lane controller vs. Side lane 1v1 duelists.
- **Roles & Counters**: Wall-breaker, Thrower, Tank, Anti-Tank / Tank Counter, Sniper / Long Range, Assassin, Anti-Assassin / Crowd Control, Support / Healer.
- **Map Contexts**: Open, Semi-Open, Closed / Wall-Dense, Bushy / Grass-Heavy, Split-Lane.
