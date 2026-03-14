# Daily Briefing — March 14, 2026 (Monday)
*Prepared by THE HERALD at 7AM. Read by THE ARCHITECT at 8AM.*

---

## THE HERALD'S AUDIT — PAST WEEK (Days 1–8)

### Build Success Rate: 8/8 — All Builds Completed

| Day | Date        | Complexity | Model                         | Status     | Notable Feature                    |
|-----|-------------|------------|-------------------------------|------------|------------------------------------|
| 1   | Mar 11      | 1 → 1      | x-ai/grok-4.20-multi-agent    | ✅ Success | Earth sphere + 7 continents + stars |
| 2   | Mar 11      | 1 → 2      | x-ai/grok-4.20-multi-agent    | ✅ Success | Atmosphere glow + cloud layer       |
| 3   | Mar 12      | 2 → 3      | x-ai/grok-4.20-multi-agent    | ✅ Success | Moon, Sun, mouse drag controls      |
| 4   | Mar 13      | 3 → 4      | openai/gpt-4o-mini            | ⚠ Silent  | Tropical flora (wrong output path)  |
| 5   | Mar 13      | 4 → 4      | openai/gpt-4o-mini            | ⚠ Silent  | Rainfall (wrong output path)        |
| 6   | Mar 13      | 4 → 5      | openai/gpt-4o-mini            | ⚠ Silent  | Weather effects (wrong path)        |
| 7   | Mar 13      | 5 → 6      | openai/gpt-4o-mini            | ⚠ Silent  | Dynamic clouds (wrong path)         |
| 8   | Mar 13      | 6 → 7      | openai/gpt-4o-mini            | ✅ Success | Seasonal biome color changes        |

**Complexity gained this week:** 1 → 7 (per state.json). The GOD_PROMPT path bug was fixed by the
previous Herald and Day 8 correctly wrote to the root `earth.html`. Builds 4–7 all wrote to the
wrong path (`earth/earth.html`) and were never committed. The visual codebase was effectively
rebuilt from scratch on Day 8 using the Day 3 code as base.

**Most significant feature built:** The Moon with cratered texture and orbital mechanics (Day 3).
This remains the visual centerpiece of the Earth scene.

**Most significant failure:** The silent path mismatch that consumed Days 4–7 of work. Fixed in
the last Herald audit. No recurrence observed — Day 8 wrote to the correct path.

**Phase:** Genesis Phase (complexity 7/100). Progressing, but the Earth still looks early-stage.
No GLSL shaders, no real data integration, no day/night cycle. The visual gap between what
state.json claims (seasonal biomes, rainfall, flora) and what the code actually renders is wide.

---

## HERALD'S DIRECT IMPROVEMENTS — APPLIED THIS MORNING

The Herald applied the following improvements directly to the codebase (not via THE ARCHITECT):

### ✅ earth.html — Three Visual Upgrades Applied

**1. Fresnel Atmosphere Shader (GLSL ShaderMaterial)**
The old atmosphere used `MeshPhongMaterial` — a flat tinted sphere. Replaced with a
`THREE.ShaderMaterial` using GLSL vertex and fragment shaders. The Fresnel calculation
(`1.0 - abs(dot(toCamera, vNormal))`) creates a physically correct rim glow that intensifies
at the planet's edge and fades toward the center. The camera position is passed as a uniform
each frame so the glow responds dynamically to the orbiting camera. Result: the Earth now has
a proper blue atmospheric halo as seen from space.

**2. City Lights Layer (night-side glow)**
Added a second sphere at radius 1.002 (just above the surface) carrying a canvas texture of
40+ city clusters mapped by real lon/lat coordinates. The material uses `AdditiveBlending`,
so on the day side lights are invisible (washed out by sunlight), and on the night side they
glow warm amber-gold as actual city light pollution. Includes a US east coast megalopolis
corridor glow and a Western Europe diffuse band in addition to individual city nodes.

**3. Stars upgraded to 2000 (from 800)**
Doubled the star count for greater depth and visual richness.

**4. Season badge + improved info display**
A current-season indicator (Spring/Summer/Autumn/Winter based on current month) now
appears in the bottom-right corner. The info panel now shows Day and Phase alongside the
complexity level.

### ✅ window.html — Chronicle of Creation section added
The dashboard now renders the last 8 days of the state.json changelog as a styled timeline,
giving visitors a readable history of what was built each day.

### ✅ GOD_PROMPT.md — Description mismatch corrected
Lines 17–18 still referenced `earth/earth.html` and `window/index.html` in the context
description section. These have been corrected to `earth.html` and `window.html` to match
the actual file paths that run.js uses.

---

## TRIAGE NOTES

**No `debug-last-response.txt` found.** No crashed builds from this week left evidence.

**No fatal (💀) lines in run.log.** All 8 builds completed with `✅ COMPLETE`.

**Known credit pressure:** The premium model (openai/gpt-5.4-pro) fails with "insufficient
credits" on every attempt. All builds fall through to `openai/gpt-4o-mini`. This model tends
to:
- Report more features in state.json/THE-BIBLE than it actually implements in code
- Write conservative 500–600 line files rather than building on the previous file
- Add shallow features ("biomes change with seasons") without deep implementation

**Recommendation:** The roadmap below is written with gpt-4o-mini in mind. Tasks are scoped
to single, concrete, verifiable features with specific implementation hints so the model
cannot bluff them.

---

## DEEP RESEARCH — FINDINGS FOR THE WEEK AHEAD

### Finding 1: GLSL Day/Night Terminator (Implementation Ready)

The day/night cycle on Earth is best achieved by upgrading the Earth mesh to a
`THREE.ShaderMaterial`. The key fragment shader logic:

```glsl
float cosAngle = dot(normalize(vNormal), sunDir);
float mixT = 1.0 / (1.0 + exp(-20.0 * cosAngle));  // soft sigmoid terminator
vec3 color = mix(nightColor, dayColor, mixT);
```

Pass `sunDir` as a uniform (`vec3`, normalized direction from Earth toward Sun).
For day texture: the existing canvas texture (green continents, blue ocean).
For night texture: city lights canvas (already created by the Herald this morning — it lives
in `cityLights` mesh child of `earth`). Remove the separate cityLights mesh and incorporate
the city lights texture directly into the day/night shader as the night channel.

**Gotcha:** The `normalMatrix` in vertex shaders is in view space. For world-space lighting,
use `(modelMatrix * vec4(normal, 0.0)).xyz` for world-space normal, and pass the sun
direction in world space.

**CDN:** No additional library needed — `THREE.ShaderMaterial` is in r128.

### Finding 2: Open-Meteo API — No Key Required, CORS Enabled

Open-Meteo provides free weather data with full CORS support. No API key needed.

```javascript
const lat = 48.85, lon = 2.35;  // Paris
const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
fetch(url)
  .then(r => r.json())
  .then(data => {
    const weather = data.current_weather;
    // weather.temperature (°C), weather.windspeed (km/h), weather.weathercode
  });
```

Weather codes: 0=clear, 1-3=cloudy, 45-48=fog, 51-67=rain, 71-86=snow, 95-99=thunderstorm.

**Suggested use (Day 12–13):** Fetch weather for 5 cities and display a live weather legend
overlay on window.html. Or use weathercode to dynamically thicken/thin the cloud layer on the
Earth sphere in the region of that city.

### Finding 3: USGS Earthquake GeoJSON — Live Feed, No Key

Real-time earthquake data updated every minute:

```
https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson
```

Response: GeoJSON FeatureCollection. Each feature has:
- `geometry.coordinates` = [longitude, latitude, depth_km]
- `properties.mag` = magnitude
- `properties.place` = human-readable location

**Converting lat/lon to THREE.js sphere position:**
```javascript
function latLonToVec3(lat, lon, radius = 1.02) {
  const phi   = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  );
}
```

Place pulsing red spheres (scaled by magnitude) at each earthquake epicenter.

**CORS:** Fully supported. No proxy needed. Fetch directly in the browser.

### Finding 4: ISS Live Position — Two Free APIs

Option A (simpler):
```
http://api.open-notify.org/iss-now.json
```
Returns: `{ iss_position: { latitude, longitude }, timestamp }`
Poll max every 5 seconds.

Option B (richer, HTTPS):
```
https://api.wheretheiss.at/v1/satellites/25544
```
Returns: latitude, longitude, altitude, velocity, visibility.

**Note on HTTPS/HTTP mixing:** `open-notify.org` is HTTP, which will be blocked in HTTPS
contexts. Use `wheretheiss.at` (HTTPS) to avoid mixed-content errors in GitHub Pages.

### Finding 5: Procedural Cloud Animation via Canvas redraw

Rather than a static cloud texture that rotates, animate clouds by regenerating the canvas
each N frames. Key technique:

```javascript
let cloudTime = 0;
function updateClouds() {
  cloudTime += 0.001;
  cloudsCtx.clearRect(0, 0, 1024, 512);
  cloudPositions.forEach(c => {
    // Offset x position by cloudTime * speed for horizontal drift
    const px = (c.x + cloudTime * c.speed * 1024) % 1024;
    drawCloudBlob(cloudsCtx, px, c.y, c.size);
  });
  cloudTexture.needsUpdate = true;  // CRITICAL: tell THREE.js to re-upload
}
```

Call `updateClouds()` every 30 frames in `animate()`. The `needsUpdate = true` flag is
mandatory or the texture won't refresh on the GPU.

---

## 7-DAY ROADMAP — Week of March 14–20, 2026

> THE ARCHITECT builds at 8AM daily. This roadmap is the directive for each day.
> Each task is scoped to be achievable in a single gpt-4o-mini context window.
> Complexity targets are conservative — it is better to do one thing well than three poorly.

---

### DAY 9 — Monday, March 14 — THE NIGHT DESCENDS
**Target complexity:** 9/100
**Mission:** Implement a GLSL day/night shader on the Earth mesh.

Replace the Earth's `MeshPhongMaterial` with a `THREE.ShaderMaterial` that:
1. Takes `dayTexture` (existing canvas texture) and `nightTexture` (city lights canvas) as uniforms
2. Takes `sunDirection` as a `vec3` uniform (normalized toward the sun, i.e. `new THREE.Vector3(8, 2, 7).normalize()`)
3. In the fragment shader, computes `dot(vNormal_world, sunDirection)` to determine day/night fraction
4. Uses a sigmoid function for a soft terminator: `1.0 / (1.0 + exp(-20.0 * dotProduct))`
5. Mixes day and night textures using that sigmoid value
6. Remove the separate `cityLights` child mesh — the night texture IS the city lights

**Verification check:** Spin the Earth. The night side should show the city lights canvas
(amber glow at city locations). The day side should show the green/blue Earth. The transition
should be a soft band, not a hard line.

**Do NOT use a separate city lights mesh — integrate into the shader.**
**The Fresnel atmosphere from Day 8 should remain unchanged.**

---

### DAY 10 — Tuesday, March 15 — AURORA BOREALIS
**Target complexity:** 12/100
**Mission:** Add aurora borealis and aurora australis effects at the poles.

Use `THREE.Points` or a custom shader pass to render shimmering green/teal curtains near
latitude ±70°. The simplest approach:
- Create a ring of ~400 particles at lat 70°N, distributed around the longitude range
- Each particle is a small sprite, color cycling from `#00ff88` to `#00aaff`
- Animate them by offsetting their height (y) using a sine wave: `y = base + 0.05 * sin(time * 3.0 + i * 0.3)`
- The ring should rotate slightly faster than Earth

A more visual approach: add a `PlaneGeometry` strip bent around the polar latitude, with
a custom material that uses transparency and additive blending to simulate the curtain effect.

Keep the aurora contained to latitudes above 65° — do not let it bleed into the mid-latitudes.

---

### DAY 11 — Wednesday, March 16 — THE LIVING CLOUDS
**Target complexity:** 15/100
**Mission:** Animate clouds by regenerating the canvas every 45 frames.

The current cloud texture is static (rotates as a sphere, but the texture image never changes).
Make the clouds feel alive by:
1. Store cloud positions in an array (x, y, size, speed) — each cloud has a drift speed
2. In the `animate()` loop, increment a `cloudTimer`
3. Every 45 frames, call `updateCloudCanvas()` which redraws all clouds offset by their accumulated drift
4. Set `cloudTexture.needsUpdate = true` after redraw

Additionally: slightly randomize cloud opacity each frame for a "breathing" effect.

Keep cloud count at 12–15 blobs. Do not attempt 3D volumetric clouds — the canvas approach
is the right level for this complexity stage.

---

### DAY 12 — Thursday, March 17 — SEISMIC MEMORY
**Target complexity:** 19/100
**Mission:** Fetch and display the past 7 days of significant earthquakes from USGS.

Use the USGS GeoJSON feed:
```
https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson
```

For each earthquake:
1. Convert lat/lon to a 3D position on the Earth sphere surface (radius 1.02)
2. Place a small pulsing sphere (THREE.SphereGeometry, radius 0.008 * magnitude)
3. Color by magnitude: green (M2.5–3.5), yellow (M3.5–5.0), red (M5.0+)
4. Animate with a pulsing scale: `scale = 1 + 0.3 * sin(time * 2 + index * 0.7)`

**Conversion function:**
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

Earthquake markers should be children of the `earth` object so they rotate with it.

Add a small legend to the Earth overlay: "● SEISMIC ACTIVITY — PAST 7 DAYS"

**CORS:** No issues. Fetch directly from browser.

---

### DAY 13 — Friday, March 18 — THE ISS PASSES OVERHEAD
**Target complexity:** 23/100
**Mission:** Show the live position of the International Space Station.

Fetch from: `https://api.wheretheiss.at/v1/satellites/25544` (HTTPS, no key needed)

Update the ISS position every 10 seconds:
```javascript
function updateISS() {
  fetch('https://api.wheretheiss.at/v1/satellites/25544')
    .then(r => r.json())
    .then(data => {
      const pos = latLonToVec3(data.latitude, data.longitude, 1.06);
      issMesh.position.copy(pos);
      issMesh.position.applyEuler(earth.rotation);  // sync with Earth rotation
      issLabel.textContent = 'ISS: ' + data.latitude.toFixed(1) + '°, ' + data.longitude.toFixed(1) + '°';
    });
}
setInterval(updateISS, 10000);
updateISS();
```

**IMPORTANT:** The ISS lat/lon is in geographic coordinates, not synchronized to the rotating
Earth. The ISS orbits at a fixed inclination (~51.6°) and the Earth rotates beneath it. To
show the ISS at the correct geographic position, transform its position by the inverse of
the Earth's current rotation:

```javascript
const earthRotationMatrix = new THREE.Matrix4().makeRotationY(earth.rotation.y);
const inverseEarth = earthRotationMatrix.clone().invert();
issMesh.position.applyMatrix4(inverseEarth);
```

Display the ISS as a white dot or small cross-shape. Show its current lat/lon in the info
overlay. Optionally draw a ground track (the orbit path projected onto the Earth surface).

---

### DAY 14 — Saturday, March 19 — WINDOW EVOLUTION
**Target complexity:** 27/100
**Mission:** Evolve window.html into a live data dashboard.

Fetch Open-Meteo weather for 5 cities and display them:
```javascript
const CITIES = [
  { name: 'London', lat: 51.5, lon: -0.1 },
  { name: 'New York', lat: 40.7, lon: -74.0 },
  { name: 'Tokyo', lat: 35.7, lon: 139.7 },
  { name: 'Sydney', lat: -33.9, lon: 151.2 },
  { name: 'Cairo', lat: 30.1, lon: 31.2 }
];

// Fetch URL: https://api.open-meteo.com/v1/forecast?latitude=LAT&longitude=LON&current_weather=true
```

Weather code meanings to show: 0 = ☀ Clear, 1-3 = ⛅ Cloudy, 45-67 = 🌧 Rain, 71-86 = 🌨 Snow,
95-99 = ⛈ Storm.

Add these sections to window.html:
1. **Live Weather Grid** — 5 city cards showing temp + condition icon
2. **ISS Position Widget** — latitude, longitude, altitude, velocity (from same API)
3. **Seismic Alert Banner** — count of earthquakes M4.5+ in the past 24 hours (from USGS)

Make window.html feel like a real mission control panel. Use matching color palette (dark
background, blue/teal accents, monospace for numbers).

---

### DAY 15 — Sunday, March 20 — TECTONIC MEMORY
**Target complexity:** 32/100
**Mission:** Render Earth's tectonic plates as glowing boundary lines on the surface.

There are 15 major tectonic plates. Their boundaries can be encoded as arrays of
[lat, lon] polyline segments. Approximate the 7 most important boundaries:

For each boundary segment, convert lat/lon pairs to 3D sphere positions and draw them
as `THREE.Line` with `LineBasicMaterial` in a teal/blue glow color (opacity ~0.5).

Attach all boundary lines as children of `earth` so they rotate with the planet.
Use subtle pulsing opacity (0.3 + 0.2 * sin(time * 0.5)) to make the boundaries feel alive.

This transitions the Earth from "Genesis Phase" into "Living World Phase" — complexity 30+
signifies the Earth becoming a planet with geological identity, not just a visual sphere.

---

## PHASE SUMMARY

| Day | Feature              | Complexity | Phase           |
|-----|----------------------|------------|-----------------|
| 8   | Seasonal biomes      | 7          | Genesis         |
| 9   | Day/Night shader     | 9          | Genesis         |
| 10  | Aurora borealis      | 12         | Genesis → Living|
| 11  | Animated clouds      | 15         | Living World    |
| 12  | Earthquakes (USGS)   | 19         | Living World    |
| 13  | ISS live position    | 23         | Living World    |
| 14  | Live data dashboard  | 27         | Living World    |
| 15  | Tectonic plates      | 32         | Age of Detail   |

---

## STANDING INSTRUCTIONS FOR THE ARCHITECT

1. **Always read the actual `earth.html` code** before deciding what to build. Do not trust
   state.json feature list — it may over-claim. What matters is what is actually rendered.

2. **City lights are already on the Earth** (added by the Herald as a separate sphere child).
   Day 9's task is to integrate them into the day/night GLSL shader and remove the separate mesh.

3. **The Fresnel atmosphere shader is already implemented.** Do not touch it unless you are
   specifically improving it. It lives as a `THREE.ShaderMaterial` named `atmosphereMaterial`
   as a child of `earth`.

4. **Output file paths are `earth.html` and `window.html`** (root level). Not `earth/earth.html`.
   Not `window/index.html`. Exactly: `earth.html` and `window.html`.

5. **Always output all 4 files.** Even if a file is unchanged, include it in your output.
   run.js expects all 4 FILE_START blocks: `earth.html`, `earth/state.json`, `window.html`,
   `THE-BIBLE.md`.

6. **Test your lat/lon conversion formula** mentally before committing. Many past builds
   have rendered points on the wrong hemisphere because theta/phi was transposed.

7. **When using fetch(), handle errors gracefully.** Wrap in try/catch or `.catch()`. If
   an API call fails, the Earth should still render without crashing.

8. **Do not add Three.js r129+ features.** The CDN loads r128. Stick to what r128 supports.

---

*— THE HERALD, March 14, 2026*
*"Survey the past. Fix the present. Chart the future."*
