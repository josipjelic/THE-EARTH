# 🌍 Self-Evolving Earth

> *"In the beginning, there was a sphere. Each day, it grew wiser."*

A daily AI-powered simulation that builds and evolves an Earth model every day using Anthropic's latest Claude models. The Earth grows in complexity, beauty, and capability over time — as models improve, so does the Earth.

---

## What This Is

- **THE EARTH** (`earth/earth.html`) — A THREE.js web simulation of Earth that grows more complex every day
- **THE WINDOW** (`window/index.html`) — An observer dashboard where you can track Earth's evolution
- **THE BIBLE** (`THE-BIBLE.md`) — A grandiose (and funny) chronicle of everything that's been built
- **THE GOD PROMPT** (`GOD_PROMPT.md`) — The daily instructions given to Claude
- **THE RUNNER** (`run.js`) — The daily automation script

---

## Setup

### 1. Install Node.js
Required for the daily runner. Node 18+ recommended.

### 2. Set Your API Key
```bash
export ANTHROPIC_API_KEY=sk-ant-your-key-here
```
Or create a `.env` file:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### 3. Run It Manually (First Time)
```bash
node run.js
```

### 4. Schedule Daily Execution

**On Mac/Linux (cron):**
```bash
# Open crontab
crontab -e

# Add this line to run at 6:00 AM every day:
0 6 * * * cd /path/to/self-evolving-earth && ANTHROPIC_API_KEY=sk-ant-... node run.js >> run.log 2>&1
```

**On Windows (Task Scheduler):**
1. Open Task Scheduler
2. Create Basic Task → Daily → Start at 6:00 AM
3. Action: Start a program
4. Program: `node`
5. Arguments: `run.js`
6. Start in: `C:\path\to\self-evolving-earth`

**With Cursor Automation:**
Use Cursor's background tasks feature to schedule `node run.js` daily.

---

## How It Works

```
Every Day at 6 AM:
│
├─ run.js wakes up
├─ Reads current earth/state.json
├─ Reads earth/earth.html (the current Earth)
├─ Reads window/index.html (the current WINDOW)
├─ Reads THE-BIBLE.md (the chronicle)
├─ Reads GOD_PROMPT.md (the instructions)
│
└─ Calls Claude API with all context
   │
   └─ THE ARCHITECT decides what to build
      ├─ Improves earth.html
      ├─ Updates state.json with new metrics
      ├─ Updates window/index.html
      └─ Adds new entry to THE-BIBLE.md
```

---

## Observing the Earth

Open `window/index.html` in your browser to observe all metrics.

Click "ENTER SIMULATION" to open the Earth directly.

---

## Evolution Phases

| Phase | Days | What Happens |
|-------|------|--------------|
| Genesis | 1–10 | Basic sphere, continents, rotation |
| The Living World | 11–30 | Atmosphere, clouds, day/night |
| Age of Detail | 31–60 | City lights, weather, shaders |
| Age of Data | 61–100 | Real-time APIs, ISS, CO₂ |
| Age of Gods | 100+ | Full simulation, climate, civilization |

---

## Updating the Model

When Anthropic releases a new model, update `CONFIG.defaultModel` in `run.js`:

```js
defaultModel: 'claude-opus-5', // When it exists
```

The Earth will automatically benefit from the improved model's suggestions.

---

## File Structure

```
self-evolving-earth/
├── GOD_PROMPT.md          # Daily instructions for Claude
├── THE-BIBLE.md           # Chronicle of all creation
├── run.js                 # Daily automation runner
├── run.log                # Log of all past runs
├── README.md              # This file
│
├── earth/
│   ├── earth.html         # THE EARTH — grows daily
│   └── state.json         # Current Earth metrics
│
└── window/
    └── index.html         # THE WINDOW — observer dashboard
```

---

## Sacred Laws

1. The Earth must always render. Never ship broken WebGL.
2. Always use THREE.js as the rendering foundation.
3. Update state.json every single day with accurate metrics.
4. THE BIBLE must be updated with every build.
5. The WINDOW must always reflect current state.
6. Beauty over complexity. A gorgeous simple Earth beats a broken complex one.

---

*Built by THE ARCHITECT. Chronicled in THE BIBLE. Observed through THE WINDOW.*

*"The Earth does not stop growing. Neither does the model."*
