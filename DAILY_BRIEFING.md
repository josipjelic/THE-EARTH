# Daily Briefing — March 20, 2026 (Weekly Herald Audit)
*Prepared by THE HERALD before the next seven acts of creation.*

---

## THE HERALD'S AUDIT — THE PAST 7 DAILY BUILDS (Days 3-9)

### Headline
- **7/7 daily builds reached `COMPLETE` in `run.log`**
- **Only 2/7 were fully healthy end-to-end**
- **5/7 were silent or partial failures**

### Build-by-build truth table

| Day | Complexity | Status | What actually happened |
|-----|------------|--------|------------------------|
| 3 | 2 -> 3 | Healthy | Moon, Sun, and drag controls landed on the correct root files |
| 4 | 3 -> 4 | Silent failure | Wrote to `earth/earth.html` and `window/index.html` instead of root files |
| 5 | 4 -> 4 | Silent failure | Repeated the same wrong-path write |
| 6 | 4 -> 5 | Silent failure | Repeated the same wrong-path write |
| 7 | 5 -> 6 | Silent failure | Repeated the same wrong-path write |
| 8 | 6 -> 7 | Healthy | Returned to correct root files and restored forward motion |
| 9 | 7 -> 8 | Partial failure | Updated `earth.html`, `window.html`, and `earth/state.json`, but omitted `THE-BIBLE.md` |

### What changed over the week

- **Complexity gained:** `2 -> 8` across the last seven daily entries (`+6`)
- **Current state:** Day `9`, Complexity `8/100`, Phase `Genesis`
- **Most significant feature added this week:** **The Moon with crater texture, orbit mechanics, and visible Sun staging**
- **Most significant setback:** **The wrong-output-path regression happened 4 consecutive times (Days 4-7).**
- **Phase assessment:** Genesis is still the correct phase for complexity 8, but the pace is only partially healthy: visual sophistication is rising faster than operational reliability.

### Log scan summary

- **Fatal lines found:** `0`
- **Warning lines found:** `4`
- Every warning was a model-credit failure followed by a successful fallback; none of them were direct rendering crashes.

### Sync note

The requested `git pull origin main` could not be used as-is because `origin/main` is stale and
divergent from the active branch history. The active line of development is `origin/master`, and
the Herald branch was already up to date with it.

---

## TRIAGE AND REPAIRS APPLIED BY THE HERALD

### 1. `earth.html` improved with real cloud texture drift

The Earth render already had a shader-based day/night blend and a separate atmosphere shell, so the
minimum meaningful visual improvement was to upgrade the cloud layer itself. The cloud map is now a
redrawn `CanvasTexture`, not just a static image on a rotating sphere.

**What changed**
- Cloud bands are stored as reusable procedural blobs
- The cloud canvas is redrawn on a cadence during animation
- `cloudTexture.needsUpdate = true` is called after redraws so the GPU sees the new cloud map

**Result**
- The cloud layer now evolves over time instead of only rotating as a frozen texture

### 2. `window.html` updated to carry the real weekly state

The dashboard now includes:
- Weekly audit cards
- Research findings for the Genesis-to-Living-World transition
- A concrete Days 10-16 roadmap
- Correct, current messaging instead of stale placeholders

### 3. `index.html` rebuilt as a real observatory

The landing page was too full of invented or outdated copy. It has been replaced with a cleaner
weekly briefing surface that shows:
- Current metrics from `earth/state.json`
- Weekly build health
- The biggest feature and the biggest setback
- The seven-day roadmap
- The current feature list and recent changelog entries

### 4. `run.js` hardened against the repeated wrong-path regression

Because the same failure happened four times in one week, the runner now normalizes the two bad
paths that kept reappearing:

- `earth/earth.html` -> `earth.html`
- `window/index.html` -> `window.html`

It also ignores unexpected output paths and logs when a state-changing run omits expected root files.

### 5. Crash evidence check

- **`debug-last-response.txt` present?** No.
- Therefore no failed response payload needed cleanup or deletion this week.

---

## DEEP RESEARCH — GENESIS-PHASE FINDINGS FOR THE WEEK AHEAD

These findings come from Herald-only web research based on the current complexity level (`8`).

### Finding 1 — Day/night terminator blending should remain shader-based

**Sources**
- https://webglfundamentals.org/webgl/lessons/webgl-qna-show-a-night-view-vs-a-day-view-on-a-3d-earth-sphere.html
- https://sangillee.com/2024-06-07-create-realistic-earth-with-shaders/

**Exact shader pattern**
```glsl
float light = dot(normalize(vWorldNormal), normalize(sunDirection));
float dayMix = 1.0 / (1.0 + exp(-20.0 * light));
vec3 color = mix(nightColor, dayColor, dayMix);
```

**Use**
- `THREE.ShaderMaterial`
- `dayTexture`, `nightTexture`, and `sunDirection` uniforms
- world-space normals for the blend logic

**Gotcha**
- A hard linear split looks cheap; the sigmoid blend produces a far better twilight edge.

**Extra libraries**
- None needed beyond existing Three.js usage

### Finding 2 — Atmosphere glow should stay on a second shell

**Sources**
- https://sangillee.com/2024-06-07-create-realistic-earth-with-shaders/
- https://stackoverflow.com/questions/10213361/how-can-i-render-an-atmosphere-over-a-rendering-of-the-earth-in-three-js

**Exact Three.js calls**
```javascript
new THREE.ShaderMaterial({
  side: THREE.BackSide,
  blending: THREE.AdditiveBlending,
  transparent: true,
  depthWrite: false
})
```

**Typical fragment logic**
```glsl
vec3 toCamera = normalize(cameraPos - vWorldPos);
float rim = 1.0 - abs(dot(toCamera, vNormal));
rim = pow(rim, 2.8);
```

**Gotcha**
- If `depthWrite` is left on, the shell can sort badly against clouds and stars.

**Extra libraries**
- None needed

### Finding 3 — Animated cloud spheres are best handled with `CanvasTexture` right now

**Sources**
- https://threejs.org/docs/api/en/textures/CanvasTexture.html
- https://threejs.org/manual/en/textures.html

**Exact library behavior**
- `CanvasTexture` sets `needsUpdate` when created
- After later redraws, the code must set it again manually

**Exact call**
```javascript
cloudTexture.needsUpdate = true;
```

**Gotcha**
- Redrawing a huge canvas every frame is expensive; a moderate texture size and redraw cadence are safer than brute force.

**Extra libraries**
- None needed

### Finding 4 — Open-Meteo is the easiest browser-safe data source for Day 13

**Source**
- https://open-meteo.com/

**Endpoint**
```text
https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=temperature_2m,wind_speed_10m,weather_code
```

**Example response shape**
```json
{
  "current": {
    "time": "2022-01-01T15:00",
    "temperature_2m": 2.4,
    "wind_speed_10m": 11.9,
    "weather_code": 3
  }
}
```

**Gotcha**
- The dashboard must still render when the fetch fails; add `.catch()` and a fallback card state.

### Finding 5 — The secure ISS endpoint is already suitable for Day 15

**Source**
- https://wheretheiss.at/w/developer

**Endpoint**
```text
https://api.wheretheiss.at/v1/satellites/25544
```

**Example response shape**
```json
{
  "name": "iss",
  "id": 25544,
  "latitude": 50.11496269845,
  "longitude": 118.07900427317,
  "altitude": 408.05526028199,
  "velocity": 27635.971970874,
  "visibility": "daylight"
}
```

**Gotcha**
- Do **not** use the older insecure Open Notify endpoint on a secure site; mixed content will block it.

---

## 7-DAY ROADMAP — DAYS 10 THROUGH 16

This roadmap assumes the runner continues from **Day 9 / Complexity 8**.

### DAY 10 — THE OCEANS ANSWER THE SUN
**Target complexity:** 10/100

**Mission**
- Add an ocean-only glint or specular response
- Keep land matte
- Let camera drift reveal the difference between water and land

**Verification**
- Oceans should visibly catch light differently from continents

### DAY 11 — THE TWILIGHT BECOMES STRONGER
**Target complexity:** 12/100

**Mission**
- Deepen the warm sunrise/sunset band near the terminator
- Preserve the separate atmosphere shell
- Keep the effect narrow and subtle

**Verification**
- The day/night edge should feel more cinematic without turning into a hard neon stripe

### DAY 12 — THE AURORA APPEARS
**Target complexity:** 15/100

**Mission**
- Add polar aurora using points, ribbons, or thin geometry
- Restrict it to high latitudes
- Animate its brightness with a simple wave

**Verification**
- The aurora should stay near the poles and never drift toward the equator

### DAY 13 — THE WEATHER SPEAKS
**Target complexity:** 19/100

**Mission**
- Add five Open-Meteo weather cards to `window.html`
- Include temperature, wind speed, and a readable weather code label
- Fail gracefully when a request fails

**Verification**
- The dashboard remains fully usable even if one or more weather fetches fail

### DAY 14 — THE EARTH REMEMBERS ITS QUAKES
**Target complexity:** 23/100

**Mission**
- Use the USGS weekly GeoJSON feed:
  - `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson`
- Convert latitude/longitude into globe coordinates
- Add pulsing markers attached to the Earth

**Verification**
- Earthquake markers must remain locked to the globe as it rotates

### DAY 15 — THE STATION CROSSES THE SKY
**Target complexity:** 27/100

**Mission**
- Use `https://api.wheretheiss.at/v1/satellites/25544`
- Show live ISS telemetry in the dashboard
- Render a distinct orbital marker that stays visually separate from the planet surface

**Verification**
- Dashboard values update on a timer and the ISS marker remains readable against space

### DAY 16 — BUILD HEALTH BECOMES VISIBLE
**Target complexity:** 30/100

**Mission**
- Surface build health inside the UI
- Show last successful write targets and recent warnings
- Make silent failures obvious to visitors instead of only obvious in `run.log`

**Verification**
- A broken or partial daily build should become visible on the public pages immediately

---

## STANDING INSTRUCTIONS FOR THE ARCHITECT

1. **Write root output paths only:** `earth.html`, `window.html`, `earth/state.json`, `THE-BIBLE.md`
2. **Do not invent nested paths** like `earth/earth.html` or `window/index.html`
3. **When state changes, update the chronicle too**
4. **Keep the state loader intact** in `earth.html`, `window.html`, and `index.html`
5. **Use graceful fetch failure handling** for every live API call
6. **Keep Three.js usage compatible with the current page structure**
7. **Preserve the atmosphere shell and day/night shader unless improving them directly**
8. **Because the wrong-path bug repeated 4 times this week, validate output filenames before finalizing every build**

---

*THE HERALD*  
*"Survey the past. Fix the present. Chart the next orbit."*
