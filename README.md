# 🌍 Self-Evolving Earth

> *"In the beginning, there was a sphere. Each day, it grew wiser."*

A GitHub repository that evolves itself every morning. A GitHub Actions workflow wakes at **8AM UTC**, calls Claude, and commits improved Earth files back to the repo — automatically, every single day, forever.

---

## Setup (5 minutes)

### 1. Fork or clone this repo to GitHub

```bash
git clone https://github.com/YOUR_USERNAME/self-evolving-earth
cd self-evolving-earth
```

### 2. Add your Anthropic API key as a GitHub Secret

Go to your repo on GitHub:

```
Settings → Secrets and variables → Actions → New repository secret
```

| Name | Value |
|------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-your-key-here` |

That's it. The workflow reads this secret automatically.

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
│     ├── Reads earth/earth.html   ← current simulation
│     ├── Reads window/index.html  ← current dashboard
│     ├── Reads THE-BIBLE.md       ← the chronicle
│     ├── Calls Claude API
│     └── Writes updated files
│
└── Commits back to main:
      "🌍 Day 12 — Complexity 8/100 — Genesis"
```

The Earth grows in the repo itself. Every commit is one day of creation.

---

## Observing the Earth

**Locally:** open `window/index.html` in your browser, click ENTER SIMULATION.

**On GitHub Pages** (optional, recommended):
```
Settings → Pages → Source: Deploy from branch → main → /window
```
Your WINDOW will be live at `https://YOUR_USERNAME.github.io/self-evolving-earth/`

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
│       └── daily-build.yml   ← GitHub Actions — runs at 8AM UTC
│
├── GOD_PROMPT.md             ← Daily instructions for Claude (the brain)
├── THE-BIBLE.md              ← Grandiose chronicle of all creation
├── run.js                    ← The builder — called by GitHub Actions
├── run.log                   ← Log of every daily run
├── .gitignore
├── .env.example
├── README.md
│
├── earth/
│   ├── earth.html            ← THE EARTH — evolves daily
│   └── state.json            ← Earth metrics — updated daily
│
└── window/
    └── index.html            ← THE WINDOW — observer dashboard
```

---

## Running Locally

```bash
export ANTHROPIC_API_KEY=sk-ant-your-key-here
node run.js
```

---

## Updating the Model

When Anthropic releases a new flagship model, update the top of `MODEL_CANDIDATES` in `run.js`:

```js
const MODEL_CANDIDATES = [
  'claude-opus-5',        // ← add the new one at top
  'claude-opus-4-5',
  'claude-sonnet-4-5',
];
```

The runner tries models top-down, so the Earth will automatically use the best available.

---

## Sacred Laws

1. The Earth must always render. Never ship broken WebGL.
2. Always use THREE.js as the rendering foundation.
3. `state.json` must be updated every single day.
4. `THE-BIBLE.md` must receive a new entry with every build.
5. `window/index.html` must always reflect current state.
6. Beauty over complexity. A gorgeous simple Earth beats a broken complex one.

---

*"The Earth does not stop growing. Neither does the model."*