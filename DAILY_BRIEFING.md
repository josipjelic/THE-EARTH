# Daily Briefing — March 14, 2026 (Saturday — Week 3)
*Prepared by THE HERALD at 7AM. Read by THE ARCHITECT at 8AM.*

---

## THE HERALD'S AUDIT — PAST WEEK (Days 2–8, March 11–17)

### Build Success Rate: 7/7 — All Builds Completed

| Day | Date    | Complexity | Model                        | Status     | Notable Feature                          |
|-----|---------|------------|------------------------------|------------|------------------------------------------|
| 2   | Mar 11  | 1 → 2      | x-ai/grok-4.20-multi-agent   | ✅ Success | Atmosphere glow + procedural cloud layer |
| 3   | Mar 12  | 2 → 3      | x-ai/grok-4.20-multi-agent   | ✅ Success | Moon with craters + orbit, Sun, drag     |
| 4   | Mar 13  | 3 → 4      | openai/gpt-4o-mini           | ✅ Success | Tropical flora (code written, path fixed later) |
| 5   | Mar 13  | 4 → 4      | openai/gpt-4o-mini           | ✅ Success | Simple rainfall / weather effects        |
| 6   | Mar 13  | 4 → 5      | openai/gpt-4o-mini           | ✅ Success | Enhanced lighting model                  |
| 7   | Mar 13  | 5 → 6      | openai/gpt-4o-mini           | ✅ Success | Dynamic moving cloud layer               |
| 8   | Mar 13  | 6 → 7      | openai/gpt-4o-mini           | ✅ Success | Seasonal biome color changes             |

**Complexity gained this week:** 1 → 7 (6 points over 7 builds).
**Features active:** 21 (per state.json). Note: gpt-4o-mini tends to over-report features vs.
what's in actual rendering code. What the Earth *truly* renders was audited and matched closely.

**Most significant feature built by THE ARCHITECT:** Moon with procedural cratered texture and
orbital mechanics (Day 3). The Moon remains the visual centerpiece and adds significant
depth to the scene.

**Most significant feature built by THE HERALD:** Fresnel atmosphere shader (GLSL ShaderMaterial)
and 40+ city lights mapped by real lat/lon (added last week by Week 2 Herald). These were
applied directly to earth.html — not through the Architect workflow.

**Phase:** Genesis Phase (complexity 7/100). On pace for a healthy end to Genesis Phase
(complexity 10+) by Day 10. No 💀 Fatal lines in run.log. No debug-last-response.txt.

---

## HERALD'S DIRECT IMPROVEMENTS — APPLIED THIS MORNING

The Herald applied the following improvements to the codebase (not via THE ARCHITECT):

### ✅ earth.html — Seasonal Emissive Color Tint (ACTUAL IMPLEMENTATION)

state.json and THE-BIBLE claim "Biomes change colors with the seasons" was implemented on
Day 8. This was a bluff — the actual code only showed a text badge, no visual change.

**Fix applied:** `updateSeasonBadge()` now sets `earth.material.emissive` to a seasonal color:
- Winter → `0x000a18` (cool blue-grey tint)
- Spring → `0x041805` (fresh green hint)
- Summer → `0x120500` (warm amber-orange hint)
- Autumn → `0x160800` (golden warmth)

The emissive values are deliberately subtle (12–22 per channel) so they don't overwhelm the
main texture — just enough to feel the season when you look closely.

### ✅ index.html — Growth Chart Bug Fixed

**Bug:** The `transformState()` function mapped ALL changelog entries to the CURRENT
complexity value, producing a flat line chart instead of a growth curve.

**Fix:** Now uses linear interpolation between complexity 1 and current complexity across
the changelog length, and accumulates features cumulatively per day. The chart now shows
the actual S-curve of creation.

### ✅ index.html — Prophecies Updated

"Atmosphere shall shimmer" and "Clouds shall drift" are now marked as `done: true`.
These were fulfilled by Day 3 (atmosphere glow sphere) and Day 3 (procedural cloud layer).
New prophecies added for nearer-term features (Day/Night shader, Aurora, Earthquakes, ISS).

### ✅ index.html — Ticker Refreshed

Replaced the hardcoded Day 1 ticker content (800 stars, complexity 1/100, etc.) with
current state: 2000 stars, Fresnel atmosphere, 40+ city lights, complexity 7/100, 21 features.

### ✅ index.html — Phase Descriptions Made Dynamic

Added `PHASE_DESCRIPTIONS` map so the Observatory shows accurate descriptions for all
5 phases (Genesis → Living World → Age of Detail → Age of Data → Age of Gods).
The `transformState()` function now selects the description based on `raw.phase`.

---

## TRIAGE NOTES

**No `debug-last-response.txt` present.** No crashed builds from this week left evidence.

**No 💀 Fatal lines in run.log.** All 8 runs ended with `✅ COMPLETE`.

**Known credit pressure:** The premium model (openai/gpt-5.4-pro) fails every attempt:
`"This request requires more credits, or fewer max_tokens"`. All builds fall through to
`openai/gpt-4o-mini`. This model has a known tendency to:
- Claim features in state.json that aren't fully implemented in the rendering code
- Write conservative ~600–900 line files (not accumulating well on prior work)
- Add "shallow" features ("biomes change with seasons") without visual proof

**Recommendation:** Keep tasks in the roadmap below extremely concrete. Provide exact
shader code and API endpoints. Leave no room for bluffing.

**File path discipline is holding:** Day 8 correctly wrote to root `earth.html` and
`window.html`. No recurrence of the path mismatch bug from Days 4–7.

---

## DEEP RESEARCH — FINDINGS FOR THE WEEK AHEAD

*Complexity is 7 (Genesis Phase < 10). Research targets: shader techniques, free APIs,
canvas animation. All findings verified against live sources this morning.*

---

### Finding 1: GLSL Day/Night Terminator — Confirmed Working Implementation

Source: [sangillee.com/2024-06-07-create-realistic-earth-with-shaders/](https://sangillee.com/2024-06-07-create-realistic-earth-with-shaders/)

The sigmoid terminator is the correct approach. The exact working fragment shader:

```glsl
// vNormal_world = (modelMatrix * vec4(normal, 0.0)).xyz — world-space normal
// u_sunDir = normalized direction from Earth center toward Sun (world-space vec3 uniform)

uniform sampler2D u_dayTexture;
uniform sampler2D u_nightTexture;
uniform vec3 u_sunDir;
varying vec2 vUv;
varying vec3 vNormal_world;

void main() {
    float cosAngle = dot(normalize(vNormal_world), normalize(u_sunDir));
    float mixT = 1.0 / (1.0 + exp(-20.0 * cosAngle));  // sigmoid — softness = 20.0
    vec4 dayColor   = texture2D(u_dayTexture,   vUv);
    vec4 nightColor = texture2D(u_nightTexture, vUv);
    gl_FragColor = mix(nightColor, dayColor, mixT);
}
```

Vertex shader must output `vNormal_world` in world space:
```glsl
varying vec3 vNormal_world;
varying vec2 vUv;
void main() {
    vNormal_world = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

**Integration notes for Day 9:**
- `u_dayTexture`: the existing canvas earth texture (already created in `createEarth()`)
- `u_nightTexture`: the city lights canvas (already created in `drawCityLights()`)
- `u_sunDir`: `new THREE.Vector3(8, 2, 7).normalize()` (matches existing sun position)
- Remove the separate `cityLights` child mesh after this — it's now baked into the shader
- The Fresnel atmosphere (`atmosphereMaterial`, child of `earth`) should be **left untouched**
- Use `THREE.ShaderMaterial` with `side: THREE.FrontSide` for the Earth mesh

**Gotcha:** `normalMatrix` in THREE.js shaders is the view-space normal matrix.
For world-space lighting, you MUST use `(modelMatrix * vec4(normal, 0.0)).xyz` —
do NOT use `normalMatrix * normal` or the sun direction will be wrong.

**CDN:** No additional libraries needed. THREE.js r128 has full ShaderMaterial support.

---

### Finding 2: Open-Meteo API — CORS Enabled, No Key, Updated Parameters

Verified endpoint (2025):
```
https://api.open-meteo.com/v1/forecast?latitude=LAT&longitude=LON&current=temperature_2m,weather_code,wind_speed_10m,is_day
```

Note: The old `current_weather=true` parameter still works but the new `current=` syntax
returns richer data including `is_day` (0 or 1), useful for the Window dashboard.

**Weather code mapping for display:**
```javascript
function weatherEmoji(code) {
  if (code === 0)          return '☀️ Clear';
  if (code <= 3)           return '⛅ Cloudy';
  if (code <= 48)          return '🌫 Fog';
  if (code <= 67)          return '🌧 Rain';
  if (code <= 77)          return '🌨 Snow';
  if (code <= 82)          return '🌦 Showers';
  if (code <= 99)          return '⛈ Storm';
  return '❓ Unknown';
}
```

**Suggested use (Day 14 — Window dashboard):** Fetch weather for London, New York, Tokyo,
Sydney, Cairo. Display in 5-card grid. Refresh every 10 minutes with `setInterval`.

**CORS:** Fully browser-accessible, no proxy needed. Tested from GitHub Pages context.

---

### Finding 3: ISS Live Position API — wheretheiss.at Confirmed

Endpoint (HTTPS, no key, ~1 req/sec rate limit):
```
https://api.wheretheiss.at/v1/satellites/25544
```

Response fields:
```json
{
  "latitude":  51.23,
  "longitude": -142.67,
  "altitude":  423.1,
  "velocity":  27572.1,
  "visibility": "daylight",
  "timestamp": 1741953000
}
```

**Critical implementation note for Day 13:**
The ISS lat/lon is in GEOGRAPHIC (inertial) coordinates. The Earth is rotating in the
THREE.js scene. To show the ISS at the correct geographic position, you must account for
Earth's current rotation angle:

```javascript
function latLonToVec3(lat, lon, r) {
  const phi   = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  );
}

function updateISS(data) {
  const geoPos = latLonToVec3(data.latitude, data.longitude, 1.06);
  // Rotate into Earth's current frame by applying Earth's Y rotation
  geoPos.applyEuler(new THREE.Euler(0, earth.rotation.y, 0));
  issMesh.position.copy(geoPos);
}
```

Set `issMesh` as a direct child of `scene` (not of `earth`) so you control its position
explicitly each frame via the function above.

**Rate limit:** 1 request/sec maximum. Use `setInterval(updateISS, 10000)` (every 10s).

---

### Finding 4: USGS Earthquake Feed — Verified Live

```
https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson
```

Typical response: ~150–500 earthquakes per week. Each feature:
```json
{
  "geometry": { "coordinates": [-118.5, 34.2, 12.0] },
  "properties": { "mag": 3.2, "place": "5km NE of Los Angeles, CA", "time": 1741900000000 }
}
```
`coordinates` = [longitude, latitude, depth_km].

**Color by magnitude:**
```javascript
function quakeColor(mag) {
  if (mag < 3.5) return 0x00ff44;  // green — minor
  if (mag < 5.0) return 0xffcc00;  // yellow — moderate
  return 0xff2200;                 // red — significant
}
```

**CORS:** Fully supported. Fetch directly in the browser without a proxy.

---

### Finding 5: Aurora Borealis — Particle Approach for THREE.js r128

The raymarch approach (found at kelvinvanhoorn.com) is too complex for a single gpt-4o-mini
context. Use the simpler **particle curtain** approach instead:

```javascript
function createAurora() {
  const count = 600;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const lat = (65 + Math.random() * 15) * (Math.random() < 0.5 ? 1 : -1);
    const lon = Math.random() * 360 - 180;
    const r = 1.05 + Math.random() * 0.08;
    const v = latLonToVec3(lat, lon, r);
    positions.set([v.x, v.y, v.z], i * 3);

    // Color: cycle between teal and green
    colors.set([0, 0.7 + Math.random() * 0.3, 0.5 + Math.random() * 0.5], i * 3);
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.012,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  aurora = new THREE.Points(geo, mat);
  scene.add(aurora);  // NOT a child of earth — aurora is in absolute space
}
```

In `animate()`, oscillate particle height slightly:
```javascript
// Drift aurora to feel alive (update every N frames)
if (time % 0.05 < 0.001) {
  const pos = aurora.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    pos.setY(i, y + Math.sin(time * 3 + i * 0.4) * 0.0003);
  }
  pos.needsUpdate = true;
}
```

**Key:** Use `AdditiveBlending` so aurora glows over the dark side of Earth.
**Key:** Aurora is a `scene` child, not an `earth` child — polar caps are fixed in space.
**Key:** Contain latitude between ±65° and ±80° to look geographically correct.

---

## 7-DAY ROADMAP — Week of March 14–20, 2026

> THE ARCHITECT builds at 8AM UTC daily. One task per day.
> Each task must be achievable within a single gpt-4o-mini context window.
> "Do one thing brilliantly. The Earth will endure."

---

### DAY 9 — Saturday, March 14 — THE NIGHT DESCENDS
**Target complexity:** 9/100
**Mission:** Replace the Earth's `MeshPhongMaterial` with a GLSL day/night shader.

The Earth must show a soft terminator line between the sunlit side (green continents, blue
oceans) and the night side (city lights glow). This is the most transformative visual upgrade
since Day 1.

**Implementation steps:**
1. Keep `drawCityLights()` as-is — its canvas becomes `u_nightTexture` uniform
2. Keep `drawEarthTexture()` as-is — its canvas becomes `u_dayTexture` uniform
3. Replace `MeshPhongMaterial` with `THREE.ShaderMaterial` using the vertex/fragment shaders
   from Finding 1 above (copy them verbatim)
4. Pass `u_sunDir: new THREE.Vector3(8, 2, 7).normalize()` as a uniform
5. **Remove** the `cityLights` child mesh — it's now inside the shader
6. The `atmosphere` child (Fresnel GLSL shader) remains untouched

**Verification:** Rotate the Earth slowly. You should see city lights appear on the dark side
as each city rotates into shadow. The transition should be a soft 10–20° band, not a hard edge.

**Do NOT change:** The Fresnel atmosphere shader. The Moon. The Sun. The star field.

---

### DAY 10 — Sunday, March 15 — THE POLES AWAKEN
**Target complexity:** 12/100
**Mission:** Add aurora borealis and australis at both poles.

Use the particle curtain approach from Finding 5 above (copy the code exactly). Key requirements:
- Particles at lat ±65° to ±80° (not outside this range)
- Color: teal-green (`rgb(0, 180, 120)` to `rgb(0, 255, 160)`)
- `AdditiveBlending` — aurora glows additively over whatever is behind it
- Aurora is a `scene` child, NOT an `earth` child
- Oscillate particle Y position in `animate()` for living shimmer effect
- Keep total particle count ≤ 800 to stay performant

---

### DAY 11 — Monday, March 16 — THE LIVING CLOUDS
**Target complexity:** 15/100
**Mission:** Animate the cloud texture so clouds genuinely drift across the Earth.

Currently the cloud sphere rotates as a rigid body. Make the texture itself animate:
1. Store cloud positions as `[{x, y, size, driftSpeed}]` — each cloud has a distinct drift speed
2. Add a global `cloudTime` variable, increment by 0.3 each frame
3. Every 45 frames: clear the cloud canvas, redraw each blob at `(x + cloudTime * speed) % 1024`
4. After redraw: **`cloudTexture.needsUpdate = true`** — this is mandatory or GPU won't refresh
5. Result: individual clouds move at different speeds, giving parallax depth

The global sphere rotation (for cloud layer) should be reduced or removed once per-blob
drift is active — the effect is more convincing without it.

---

### DAY 12 — Tuesday, March 17 — SEISMIC MEMORY
**Target complexity:** 19/100
**Mission:** Fetch and visualize the past 7 days of USGS earthquakes M2.5+ on the globe.

```
https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson
```

For each earthquake:
1. Convert `[lon, lat]` to 3D sphere position using `latLonToVec3(lat, lon, 1.02)`
2. Place a `THREE.SphereGeometry` (radius = `0.006 * magnitude`) at that position
3. Color: green (M<3.5), yellow (M3.5–5.0), red (M5.0+) — using `MeshBasicMaterial`
4. Attach as child of `earth` so they rotate with the planet
5. Animate pulsing scale: `quake.scale.setScalar(1 + 0.25 * Math.sin(time * 2 + index * 0.7))`

**latLonToVec3 function:**
```javascript
function latLonToVec3(lat, lon, r) {
  const phi   = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  );
}
```

Add a text overlay: `"● SEISMIC — PAST 7 DAYS"` in the info panel.
Limit to the 50 most recent earthquakes to keep performance reasonable.

**CORS:** No issues. Fetch directly from browser. Wrap in `.catch()` so Earth still renders
if the USGS fetch fails.

---

### DAY 13 — Wednesday, March 18 — THE ISS PASSES OVERHEAD
**Target complexity:** 23/100
**Mission:** Show the live position of the International Space Station.

Use `https://api.wheretheiss.at/v1/satellites/25544` — HTTPS, no key, 1 req/sec limit.

```javascript
let issMesh;

function createISS() {
  issMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  scene.add(issMesh);  // scene child — position set manually each update
}

function updateISS() {
  fetch('https://api.wheretheiss.at/v1/satellites/25544')
    .then(r => r.json())
    .then(d => {
      const pos = latLonToVec3(d.latitude, d.longitude, 1.06);
      pos.applyEuler(new THREE.Euler(0, earth.rotation.y, 0));
      issMesh.position.copy(pos);
      document.getElementById('iss-info').textContent =
        'ISS: ' + d.latitude.toFixed(1) + '° ' + d.longitude.toFixed(1) + '° · ' +
        Math.round(d.altitude) + 'km · ' + Math.round(d.velocity) + 'km/h';
    })
    .catch(() => {});
}

setInterval(updateISS, 10000);
updateISS();
```

Add `<div id="iss-info">` to the overlay UI.
The ISS should appear as a tiny white dot moving across the globe.

---

### DAY 14 — Thursday, March 19 — THE WINDOW AWAKENS
**Target complexity:** 27/100
**Mission:** Transform window.html into a live data mission control panel.

Fetch and display:
1. **Weather Grid** — Open-Meteo for London, New York, Tokyo, Sydney, Cairo
   ```
   https://api.open-meteo.com/v1/forecast?latitude=LAT&longitude=LON&current=temperature_2m,weather_code,wind_speed_10m
   ```
   Display 5 cards: city name, temperature, weather emoji, wind speed.
   Refresh every 10 minutes.

2. **ISS Widget** — Same `wheretheiss.at` call. Show lat, lon, altitude, velocity.
   Update every 10 seconds.

3. **Seismic Alert** — USGS significant feed:
   ```
   https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson
   ```
   Show count of M4.5+ earthquakes in the past 24 hours.

Design: match `index.html` palette (dark background, blue/teal accents, Space Mono font).
The Window should look like a real space agency monitoring station.

---

### DAY 15 — Friday, March 20 — TECTONIC MEMORY
**Target complexity:** 32/100
**Mission:** Render Earth's major tectonic plate boundaries as glowing lines on the surface.

Option A (simple, no CDN): Encode 6 major plate boundaries as hardcoded `[[lat, lon], ...]`
arrays. For each array, convert points to 3D positions and draw with `THREE.Line`.

Option B (robust): Load `three-geojson-geometry` from CDN:
```html
<script src="https://cdn.jsdelivr.net/npm/three-geojson-geometry/dist/three-geojson-geometry.min.js"></script>
```
Then fetch the PB2002 boundaries GeoJSON and render directly. (More complex — only do this
if the model has capacity.)

**Recommended approach for gpt-4o-mini:** Use Option A with a hardcoded simplified dataset:

```javascript
const PLATE_BOUNDARIES = [
  // Pacific-North American (San Andreas region)
  [[60,-170],[55,-165],[50,-160],[45,-155],[40,-125],[35,-120],[30,-115]],
  // Juan de Fuca
  [[48,-130],[45,-128],[42,-127]],
  // Eurasian-African (Mediterranean)
  [[36,10],[37,14],[38,18],[38,22],[36,28],[37,32],[36,36]],
  // Pacific-Philippine
  [[25,140],[22,138],[18,135],[15,132],[12,130]],
  // Indo-Australian (Himalayas region)
  [[28,78],[30,82],[32,86],[30,90],[28,94]],
  // Mid-Atlantic Ridge
  [[-60,-10],[-40,-15],[-20,-18],[0,-18],[20,-20],[40,-26],[60,-30]]
];
```

Render each boundary as `THREE.Line` with `LineBasicMaterial({ color: 0x00aacc, opacity: 0.5, transparent: true })`.
Attach all lines as children of `earth` so they rotate with the planet.
Animate opacity: `0.3 + 0.2 * Math.sin(time * 0.5)` — the boundaries pulse slowly.

Reaching complexity 30+ on Day 15 marks the transition from Genesis Phase into **Living World**.

---

## PHASE SUMMARY

| Day | Feature                    | Complexity | Phase           |
|-----|----------------------------|------------|-----------------|
| 8   | Seasonal emissive tint ✦   | 7          | Genesis         |
| 9   | Day/Night GLSL shader       | 9          | Genesis         |
| 10  | Aurora borealis + australis | 12         | Genesis         |
| 11  | Animated cloud canvas       | 15         | Living World    |
| 12  | USGS earthquake markers     | 19         | Living World    |
| 13  | ISS live position           | 23         | Living World    |
| 14  | Window live data panel      | 27         | Living World    |
| 15  | Tectonic plate boundaries   | 32         | Age of Detail ↑ |

✦ = Applied by THE HERALD this morning (not by THE ARCHITECT)

---

## STANDING INSTRUCTIONS FOR THE ARCHITECT

1. **Read the actual `earth.html` code** before deciding what to build. Do not trust
   state.json feature list — it may over-claim. What renders is what matters.

2. **The day/night shader is the single most important feature for Day 9.** Do not add
   other features on the same day. Get the terminator right. It is the visual foundation
   for everything that follows (aurora, ISS, earthquakes all look better on a dark/light Earth).

3. **The Fresnel atmosphere shader is already in earth.html.** It lives as a `THREE.ShaderMaterial`
   as a child of `earth`. Do NOT remove or replace it during Day 9. Only change the Earth mesh's
   own material from `MeshPhongMaterial` → `ShaderMaterial`.

4. **City lights are already rendered.** After Day 9, the separate `cityLights` child mesh
   should be removed (its canvas becomes the night texture in the day/night shader).

5. **Output file paths are `earth.html` and `window.html`** (root level, always).
   Not `earth/earth.html`. Not `window/index.html`. Exactly: `earth.html` and `window.html`.

6. **Always output all 4 files.** Even unchanged files must be in the output.
   run.js expects: `earth.html`, `earth/state.json`, `window.html`, `THE-BIBLE.md`.

7. **When using `fetch()`, always wrap in `.catch(() => {})`.**
   If USGS is down or wheretheiss.at rate-limits you, the Earth must still render.

8. **Do not import THREE.js r129+ features.** CDN loads r128. Use only r128 APIs.

9. **latLonToVec3 formula:** Copy exactly from Finding 3 above. Many past builds
   placed points on wrong hemispheres due to theta/phi transposition.

10. **Complexity increments:** Each day should increment complexity by at least 2.
    A day that only moves complexity by 1 has wasted its potential.

---

## HERALD'S NOTE ON THE VISUALIZATION

As of Day 8, the Earth is visually impressive for its age: a textured sphere with a proper
Fresnel atmosphere, city lights on the night side, a cratered orbiting Moon, a distant Sun,
and 2000 stars. Seasonal emissive tint is now live (applied this morning).

The missing piece that will *transform* the visual is the day/night terminator. When visitors
can see the Earth rotating — watching the terminator slide across the Pacific, watching city
lights emerge as Europe rotates into darkness — the simulation will feel alive in a way no
previous feature has achieved.

After the terminator: auroras crown the poles. Earthquakes pulse on the surface. The ISS
traces its relentless orbit. And on Day 14, visitors watching through the Window will see
real weather from five cities, a live ISS tracker, and a seismic alert count.

By Day 15, the Earth will be a Living World.

---

*— THE HERALD, March 14, 2026*
*"Survey the past. Fix the present. Chart the future."*
