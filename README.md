# The Weimar Republic Companion

Phase 1 creates a standalone Weimar Republic companion shell.

Current root files are WR-specific and intentionally light on rules until the rulebook/playbook extraction pass is complete.

## Project Shape

- `index.html`: static mobile-first PWA shell.
- `app.js`: single-state, screen-rendered WR shell.
- `sw.js`: WR-specific service worker cache.
- `manifest.json`: WR-specific PWA metadata.
- `assets/`: local WR source PDFs.

## Source PDFs

- `assets/The_Weimar_Republic_Playbook_Web.pdf`
- `assets/The+Weimar+Republic_Rule+book_WEB.pdf`

## Next Phase

Extract structured WR data from the PDFs before implementing guided game flow:

- factions and player roles
- sequence of play
- action menus and legality gates
- event/deck structure
- markers, tracks, and saved game state shape
- reusable priority/decision helpers
