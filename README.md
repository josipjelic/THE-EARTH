# 🌍 Self-Evolving Earth

> *"In the beginning, there was a sphere. Each day, it grew wiser."*

A GitHub repository that evolves itself every morning. A GitHub Actions workflow wakes at **8AM UTC**, calls an AI architect via OpenRouter, and commits improved Earth files back to the repo — automatically, every single day, forever.

---

## Setup (5 minutes)

### 1. Fork or clone this repo to GitHub

```bash
git clone https://github.com/YOUR_USERNAME/self-evolving-earth
cd self-evolving-earth
```

### 2. Add your OpenRouter API key as a GitHub Secret

Go to your repo on GitHub:

```
Settings → Secrets and variables → Actions → New repository secret
```

| Name | Value |
|------|-------|
| `OPENROUTER_API_KEY` | `sk-or-your-key-here` |

Get a key at [openrouter.ai](https://openrouter.ai). The workflow reads this secret automatically.

### 3. Enable GitHub Actions (if not already on)

```
Settings → Actions → General → Allow all actions
```

Also make sure the workflow has write permission:

```
Settings → Actions → General → Workflow permissions → Read and write permissions ✓
```

### 4. Trigger the first run manually

Go to:
```
Actions → 🌍 Daily Earth Evolution → Run workflow → Run workflow
```

After that, it runs automatically every day at **8AM UTC**.

---

## How It Works

```
8:00 AM UTC every day
│
├── GitHub Actions wakes up
├── Checks out the repo
├── Runs: node run.js
│     ├── Reads GOD_PROMPT.md      ← the standing orders
│     ├── Reads earth/state.json   ← current Earth metrics
│     ├── Reads earth.html         ← current simulation
│     ├── Reads window.html        ← current dashboard
│     ├── Reads THE-BIBLE.md       ← the chronicle
│     ├── Calls OpenRouter API (tries best model first)
│     └── Writes updated files
│
└── Commits back to main:
      "🌍 Day 12 — Complexity 8/100 — Genesis"
```

The Earth grows in the repo itself. Every commit is one day of creation.

---

## Observing the Earth

**Locally:** open `earth.html` in your browser to view the simulation, or open `index.html` for the full dashboard.

**On GitHub Pages** (automatic — a workflow deploys on every push to `master`):

Your Earth will be live at `https://YOUR_USERNAME.github.io/self-evolving-earth/`

---

## AI Model Priority

The runner uses **OpenRouter** and tries models in this order, falling back if one fails:

| Priority | Model |
|----------|-------|
| 1 | `anthropic/claude-opus-4-5` |
| 2 | `anthropic/claude-sonnet-4-5` |
| 3 | `google/gemini-2.5-pro-preview` |
| 4 | `openai/gpt-4.1` |
| 5 | `anthropic/claude-3-7-sonnet` |

To change the order or add new models, edit `MODEL_CANDIDATES` at the top of `run.js`.

---

## Evolution Phases

| Phase | Days | What Gets Built |
|-------|------|----------------|
| Genesis | 1–10 | Sphere, continents, rotation, stars |
| The Living World | 11–30 | Atmosphere, clouds, day/night cycle |
| Age of Detail | 31–60 | City lights, weather, Rayleigh shading |
| Age of Data | 61–100 | Real-time APIs, ISS, CO₂, earthquakes |
| Age of Gods | 100+ | Climate sim, tectonic drift, civilization |

---

## File Structure

```
self-evolving-earth/
├── .github/
│   └── workflows/
│       ├── daily-build.yml   ← GitHub Actions — runs at 8AM UTC
│       └── static.yml        ← GitHub Pages — deploys on every push
│
├── GOD_PROMPT.md             ← Daily instructions for the AI (the brain)
├── THE-BIBLE.md              ← Grandiose chronicle of all creation
├── run.js                    ← The builder — called by GitHub Actions
├── run.log                   ← Log of every daily run
├── earth.html                ← THE EARTH — evolves daily (repo root)
├── window.html               ← THE WINDOW — observer dashboard (repo root)
├── index.html                ← Entry point / landing page
├── .gitignore
├── .env.dist
├── README.md
│
└── earth/
    └── state.json            ← Earth metrics — updated daily
```

---

## Running Locally

```bash
export OPENROUTER_API_KEY=sk-or-your-key-here
node run.js
```

---

## Sacred Laws

1. The Earth must always render. Never ship broken WebGL.
2. Always use THREE.js as the rendering foundation.
3. `state.json` must be updated every single day.
4. `THE-BIBLE.md` must receive a new entry with every build.
5. `window.html` must always reflect current state.
6. Beauty over complexity. A gorgeous simple Earth beats a broken complex one.

---

*"The Earth does not stop growing. Neither does the model."*
