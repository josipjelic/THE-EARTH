# Daily Briefing — March 16, 2026 (Weekly Herald Audit)
*Prepared by THE HERALD before Monday's next act of creation.*

---

## THE HERALD'S AUDIT — THE PAST 7 BUILDS (Days 3–9)

### Headline
- **7/7 weekly builds reached `✅ COMPLETE` in `run.log`**
- **0/7 ended in a hard fatal**
- **Only 2/7 were fully healthy end-to-end**
- **5/7 suffered silent or partial failures despite reporting success**

### Build-by-build truth table

| Day | Complexity | Status | What actually happened |
|-----|------------|--------|------------------------|
| 3 | 2 -> 3 | ✅ Healthy | Moon, Sun, drag controls, and biome refinement landed on the correct root files |
| 4 | 3 -> 4 | ⚠ Silent failure | Wrote to `earth/earth.html` and `window/index.html` instead of the root render files |
| 5 | 4 -> 4 | ⚠ Silent failure | Repeated the same wrong-path write and gained no complexity |
| 6 | 4 -> 5 | ⚠ Silent failure | Repeated the same wrong-path write again |
| 7 | 5 -> 6 | ⚠ Silent failure | Fourth consecutive wrong-path write; regression crossed the 3+ recurrence threshold |
| 8 | 6 -> 7 | ✅ Healthy | Returned to correct root files and restored forward motion |
| 9 | 7 -> 8 | ⚠ Partial failure | Updated the render and state, but omitted `THE-BIBLE.md`; the next-day rerun touched only `earth.html` |

### What changed over the week

- **Complexity gained:** `2 -> 8` across the weekly window (`+6`)
- **Current state:** Day `9`, Complexity `8/100`, Phase `Genesis`
- **Most significant feature added this week:** **The Moon with crater texture and orbit mechanics** remains the clearest visible leap in sophistication.
- **Most significant setback:** **The wrong-output-path regression happened 4 consecutive times (Days 4–7).**
- **Current health:** The Earth is progressing at a **healthy visual pace** for Genesis, but an **unhealthy operational pace**. The simulation looks richer than a week ago, yet the workflow still needs discipline around output targeting and completeness.

### Log scan summary

- **Fatal lines found in the weekly window:** `0`
- **Warning lines found in the weekly window:** `2`
- Both warnings were credit-limit fallbacks, not execution failures:
  - `openai/gpt-4o-mini failed: insufficient credits`
  - `anthropic/claude-3.5-haiku failed: insufficient credits`
- The runner recovered by falling back to `google/gemini-2.0-flash-001`

### Phase assessment

The Earth is still in **Genesis Phase**, and that remains correct for complexity 8. The pace of
feature growth is solid for such an early stage: atmosphere, clouds, lunar motion, weather hints,
and seasonal color are already visible. The risk is not lack of ambition; it is **process drift**.
If output integrity is not guarded now, richer live-data work later will become brittle.

---

## TRIAGE AND REPAIRS APPLIED BY THE HERALD

### 1. `run.js` now self-heals the old wrong-path regression

The runner now normalizes the two legacy mistake paths:

- `earth/earth.html` -> `earth.html`
- `window/index.html` -> `window.html`

It also includes `index.html` in the daily build context so the public observatory is part of the
same truth loop as the Earth view and the Window.

**Result:** the exact 4-build silent failure pattern that dominated the week is now guarded in code,
not just hoped away in prompts.

### 2. `earth.html` gained a real animated cloud texture

The Earth render already had a rotating cloud shell, but the texture itself was static. The Herald
converted that shell into a canvas-driven texture that redraws over time and explicitly calls:

```javascript
cloudTexture.needsUpdate = true;
```

**Result:** cloud motion now reads as atmospheric behavior instead of a frozen decal turning in
place.

### 3. `window.html` and `index.html` were refreshed

Both observer pages now present **current** rather than Day 1-era assumptions:

- the weekly audit is visible
- the seven-day roadmap is visible
- hard-coded stale copy was replaced with state-aware content
- the observatory history chart no longer flattens every day to today's values

### 4. Crash evidence check

- **`debug-last-response.txt` present?** No.
- Therefore there was no failed payload artifact to inspect or delete this week.

---

## DEEP RESEARCH — GENESIS-PHASE FINDINGS FOR THE WEEK AHEAD

These are the concrete findings the daily GitHub Action cannot gather on its own. The research is
targeted at the current **complexity < 10** stage while still preparing the transition into the
Living World.

### Finding 1 — Day/night texture blending should stay shader-based

**Sources**
- https://webglfundamentals.org/webgl/lessons/webgl-qna-show-a-night-view-vs-a-day-view-on-a-3d-earth-sphere.html
- https://sangillee.com/2024-06-07-create-realistic-earth-with-shaders/

**Exact shader pattern**
```glsl
float cosAngleSunToNormal = dot(vNormal, sunDir);
float mixAmountTexture = 1.0 / (1.0 + exp(-20.0 * cosAngleSunToNormal));
vec3 color = mix(nightColor, dayColor, mixAmountTexture);
```

**Actionable guidance**
- Use `THREE.ShaderMaterial`
- Pass day and night textures as separate uniforms
- Pass sun direction as a uniform such as `u_sunRelPosition` or `sunDirection`

**Gotcha**
- WebGLFundamentals explicitly warns against solving this with two overlapping globes; the geometry
  overlap produces visible artifacts. Blend in one shader instead.

### Finding 2 — Atmosphere belongs on a dedicated shell

**Sources**
- https://discourse.threejs.org/t/how-to-create-an-atmospheric-glow-effect-on-surface-of-globe-sphere/32852/2
- https://sangillee.com/2024-06-07-create-realistic-earth-with-shaders/

**Exact library calls**
```javascript
const material_earth_atmosphere = new THREE.ShaderMaterial({
  transparent: true,
  side: THREE.BackSide,
  depthWrite: false
});

earth_atmosphere.scale.set(1.05, 1.05, 1.05);
```

**Shader logic worth carrying forward**
```glsl
float fresnelTerm = 1.0 + dot(normalize(vPosition), normalize(vNormalView));
fresnelTerm = pow(fresnelTerm, 2.0);
```

**Gotcha**
- Keep the atmosphere on a separate sphere and keep `depthWrite: false`, or clouds and atmosphere
  will fight each other visually.
- Additive blending remains a strong option for a brighter limb, but keep it subtle in Genesis.

### Finding 3 — `CanvasTexture` is the right cloud strategy at this stage

**Source**
- https://threejs.org/manual/en/canvas-textures.html

**Exact implementation call**
```javascript
const texture = new THREE.CanvasTexture(canvas);
drawRandomDot();
texture.needsUpdate = true;
```

**Why it matters**
- The Three.js manual shows that a canvas texture updates on creation, but every later redraw must
  be pushed back to the GPU with `needsUpdate = true`.
- This is light enough for Genesis, unlike volumetric clouds or a full noise-shader rewrite.

**Gotcha**
- Forgetting `needsUpdate = true` leaves the browser rendering stale cloud data even though the 2D
  canvas changed.

### Finding 4 — Open-Meteo is ready for the first live dashboard data

**Sources**
- https://open-meteo.com/
- https://open-meteo.com/en/docs

**Exact endpoint example**
```text
https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=temperature_2m,wind_speed_10m,weather_code
```

**Relevant response fields**
- `current.temperature_2m`
- `current.wind_speed_10m`
- `current.weather_code`

**Why it is suitable**
- No API key required
- Browser-friendly CORS behavior
- Simple JSON payloads that fit a lightweight observer dashboard

**Gotcha**
- This data belongs in the observer pages first. Do not let a weather fetch failure break the Earth
  render itself.

---

## 7-DAY ROADMAP — FROM DAY 10 TO DAY 16

> This roadmap assumes the project begins the week from **Day 9 / Complexity 8**, plus the Herald's
> manual repairs to clouds, dashboards, and runner discipline.

---

### DAY 10 — THE OCEANS ANSWER THE SUN
**Target complexity:** 10/100  
**Mission:** Add water-only specular sheen so the oceans react differently from land.

**Build exactly this**
- Keep continents matte
- Add a view-angle highlight only over water regions
- Reuse the existing sun direction uniform

**Verification**
- Ocean areas should catch light as the camera drifts while land stays comparatively flat.

---

### DAY 11 — THE TWILIGHT SHARPENS
**Target complexity:** 12/100  
**Mission:** Strengthen the warm dawn/dusk band at the terminator.

**Build exactly this**
- Add a narrow orange-blue transition near the day/night boundary
- Keep it subtle
- Do not disturb the separate atmosphere shell

**Verification**
- A distinct but thin twilight band should appear at sunrise and sunset edges.

---

### DAY 12 — THE AURORA APPEARS
**Target complexity:** 15/100  
**Mission:** Add subtle aurora around both poles.

**Build exactly this**
- Use `THREE.Points` or a thin ribbon geometry
- Stay above approximately 65 degrees latitude
- Animate with soft `sin()` shimmer

**Verification**
- The effect must remain polar and never leak toward the equator.

---

### DAY 13 — THE WEATHER SPEAKS
**Target complexity:** 19/100  
**Mission:** Add live weather cards to the observer pages with Open-Meteo.

**API**
```text
https://api.open-meteo.com/v1/forecast?latitude=LAT&longitude=LON&current=temperature_2m,wind_speed_10m,weather_code
```

**Build exactly this**
- Show 4-5 named city cards
- Render temperature, wind speed, and a readable weather-code label
- Use `.catch()` with a fallback message

**Verification**
- The page must still render cleanly if one or more weather requests fail.

---

### DAY 14 — THE EARTH REMEMBERS ITS QUAKES
**Target complexity:** 23/100  
**Mission:** Plot weekly earthquake activity on the globe.

**API**
```text
https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson
```

**Build exactly this**
- Convert each quake's latitude and longitude to a sphere position
- Use pulsing markers
- Color markers by magnitude bucket
- Parent them to the Earth mesh so rotation remains correct

**Verification**
- Markers must remain locked to the spinning globe rather than floating in world space.

---

### DAY 15 — THE STATION CROSSES THE SKY
**Target complexity:** 27/100  
**Mission:** Add live ISS tracking to the dashboard and the Earth scene.

**API**
```text
https://api.wheretheiss.at/v1/satellites/25544
```

**Example response fields**
- `latitude`
- `longitude`
- `altitude`
- `velocity`
- `visibility`

**Critical gotcha**
- Use the secure HTTPS endpoint above. Do **not** use `http://api.open-notify.org/iss-now.json`
  on a secure page because mixed content will block it.

**Verification**
- The dashboard updates at a fixed interval
- The ISS marker remains visually distinct from Earth-bound markers

---

### DAY 16 — THE WORKFLOW KEEPS ITS WORD
**Target complexity:** 30/100  
**Mission:** Make output integrity as reliable as the render.

**Build exactly this**
- Always emit `earth.html`, `window.html`, `index.html`, `earth/state.json`, and `THE-BIBLE.md`
- Keep observer pages synchronized with current state
- Preserve graceful fetch failures for all live APIs

**Verification**
- No daily build should report success while omitting one of the canonical root files.

---

## STANDING INSTRUCTIONS FOR THE ARCHITECT

1. **Canonical output paths only:** `earth.html`, `window.html`, `index.html`, `earth/state.json`, `THE-BIBLE.md`
2. **Always output all 5 files** when you touch the observer surface; Day 9 omitted `THE-BIBLE.md`
3. **Do not invent features in prose that are absent in code**
4. **Do not mix `||` and `??` without parentheses**
5. **Use graceful fetch failure handling** for all live data
6. **Keep Three.js code compatible with r128 APIs**
7. **Preserve the atmosphere shell and current day/night shader unless improving them directly**
8. **Because the wrong-path bug happened 4 times this week, validate output file names before every final answer**
9. **The runner now normalizes legacy paths, but that guard is a safety net, not permission to drift**

---

*— THE HERALD, March 16, 2026*  
*"Survey the past. Fix the present. Chart the future."*
