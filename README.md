# The Weimar Republic Companion

Phase 2 creates the first usable Weimar Republic companion foundation: a faction reference, timeline tracker, round-flow skeleton, local notes, and save/load.

Current root files are WR-specific. The app is intentionally conservative about rule automation until the rulebook/playbook extraction pass is complete.

## Project Shape

- `index.html`: static mobile-first PWA shell.
- `app.js`: single-state, screen-rendered WR companion.
- `sw.js`: WR-specific service worker cache.
- `manifest.json`: WR-specific PWA metadata.
- `assets/`: local WR source PDFs.

## Source PDFs

- `assets/The_Weimar_Republic_Playbook_Web.pdf`
- `assets/The+Weimar+Republic_Rule+book_WEB.pdf`
- `assets/WR_Turn_Aid.pdf`
- `assets/WR_Bot_Aid.pdf`

## Current Features

- 1919-1933 tracker with two rounds per year.
- Active faction selector.
- Four faction reference cards.
- Provisional round-flow checklist.
- Local notes workspace.
- Browser save/load and JSON import/export.
- Local links to rulebook, playbook, turn aid, and bot aid PDFs.

Faction and timeline seed data is based on official GMT/InsideGMT overview material, then should be verified against the local rulebook/playbook PDFs before deeper automation.

## Next Phase

Extract structured WR data from the PDFs before implementing guided game flow:

- factions and player roles
- sequence of play
- action menus and legality gates
- bot/non-player flow
- event/deck structure
- markers, tracks, and saved game state shape
- reusable priority/decision helpers
