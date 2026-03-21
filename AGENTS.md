# AGENTS.md

## Cursor Cloud specific instructions

### Overview
Self-Evolving Earth is a zero-dependency Node.js project (no `package.json`, no `node_modules`). It consists of static HTML/JS files (Three.js WebGL 3D Earth visualization) and a `run.js` builder script that calls the OpenRouter API to autonomously evolve the codebase daily.

### Running the application
- **Static site**: Serve from repo root with any HTTP server, e.g. `npx http-server . -p 8080 -c-1 --cors`
- **Builder script**: `OPENROUTER_API_KEY=sk-or-... node run.js` (requires a valid OpenRouter API key)
- HTML files that fetch `earth/state.json` require HTTP serving (not `file://` protocol)

### Key pages
- `earth.html` — 3D WebGL Earth visualization (Three.js r128 from CDN)
- `window.html` — Observatory dashboard with metrics
- `index.html` — Landing page / entry point

### Testing notes
- There are no automated tests, linter, or build step in this project
- Manual verification: ensure `earth.html` renders the 3D globe, `window.html` and `index.html` display correct metrics from `earth/state.json`
- `run.js` uses only Node.js built-in modules (`fs`, `path`, `https`) — no install step needed

### Running `run.js` (the daily evolution)
- `OPENROUTER_API_KEY` env var is required. Without it, the script exits with a clear error.
- The script tries models in priority order (see `MODEL_CANDIDATES` in `run.js`). If the OpenRouter account has insufficient credits, all models will fail with a credit-limit error — this is an account issue, not a code bug.
- The script writes updated `earth.html`, `window.html`, `earth/state.json`, and `THE-BIBLE.md`. It also appends to `run.log`.
- The static visualization (serving HTML files) works without any API key.

### Gotchas
- `run.log` is modified every time `run.js` executes. It is tracked by git but is a runtime artifact — avoid committing incidental changes to it.
- Three.js r128 is loaded from CDN (`cdn.jsdelivr.net`) in the HTML files, so an internet connection is needed to render the 3D Earth.
