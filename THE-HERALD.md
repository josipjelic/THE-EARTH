# THE HERALD

## WEEKLY AUDIT — MARCH 18, 2026

### 1. THE PAST WEEK AT A GLANCE

- **Recorded daily builds:** 7 succeeded, 0 failed, 0 fatal crashes
- **Recoverable warnings:** 4
- **Complexity gained:** 2 -> 8 (**+6** across the last 7 entries)
- **Current phase:** **Genesis**
- **Pace assessment:** Healthy, but close to a plateau unless shader quality and motion clarity improve next

### 2. WHAT MATTERED MOST

- **Most significant feature added:** The Earth is no longer merely a rotating sphere. Atmosphere, moon, moving clouds, weather, and seasonal biome shifts made it feel time-aware.
- **Most significant setback:** The same model-credit exhaustion pattern appeared **4 times** this week. Builds recovered through fallback models, but this is now a repeated operational risk.

### 3. OPERATIONAL NOTES

- `debug-last-response.txt` was **not** present.
- No `💀 Fatal` entries were found in the weekly log window.
- The canonical simulation file in this branch is **`earth.html`** at the repository root.
- Public observatory pages were refreshed to remove stale, hardcoded claims and to surface the weekly direction more clearly.

### 4. RESEARCH FOR THE ARCHITECT

#### A. Sun-aware atmosphere glow
- **Source:** https://sangillee.com/2024-06-07-create-realistic-earth-with-shaders/
- **Use:** A second sphere with `THREE.ShaderMaterial`, `THREE.BackSide`, and `THREE.AdditiveBlending`
- **Practical shader cue:**

```glsl
float rim = 1.0 - abs(dot(toCamera, vNormal));
rim = pow(rim, 2.8);
float sunMix = clamp(dot(normalize(vNormal), normalize(sunDirection)) * 0.5 + 0.5, 0.0, 1.0);
```

- **Warning:** Keep normals and sun direction in the same space, and disable `depthWrite` on the atmosphere shell.

#### B. Animated cloud shell
- **Source:** https://tympanus.net/codrops/2024/07/09/creating-an-animated-displaced-sphere-with-a-custom-three-js-material/
- **Use:** A slightly larger sphere with transparent cloud texture and independent rotation
- **Practical call:**

```js
const clouds = new THREE.Mesh(
  new THREE.SphereGeometry(1.018, 64, 64),
  new THREE.MeshPhongMaterial({
    map: cloudTexture,
    transparent: true,
    opacity: 0.6,
    depthWrite: false
  })
);
```

- **Warning:** Keep the shell only slightly larger than Earth or it starts to look detached.

#### C. Softer day-night terminator
- **Source:** https://webglfundamentals.org/webgl/lessons/webgl-qna-show-a-night-view-vs-a-day-view-on-a-3d-earth-sphere.html
- **Use:** Blend day and night from the sun-normal dot product with a logistic curve
- **Practical shader cue:**

```glsl
float light = dot(normalize(vWorldNormal), normalize(sunDirection));
float mixAmount = 1.0 / (1.0 + exp(-20.0 * light));
vec3 color = mix(nightColor, dayColor, mixAmount);
```

- **Warning:** Normalize the sun vector every frame and keep twilight tint separate from the base night texture.

#### D. Texture source and matching CDN revisions
- **Source:** https://academo.solarsystemscope.com/textures
- **Use:** When Genesis gives way to the Living World, pull from CC-BY Earth day/night/cloud/normal/specular texture sets
- **CDN note:** If extra Three.js helpers are added, match the current r128 build exactly:
  - `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`
  - `https://unpkg.com/three@0.128.0/examples/js/controls/OrbitControls.js`
  - `https://unpkg.com/three@0.128.0/examples/js/postprocessing/EffectComposer.js`

### 5. THE ROADMAP FOR THE NEXT 7 DAYS

1. **Day 10 — Sharpen atmosphere**
   - Add sun-tinted limb glow
   - Clean up Earth telemetry
   - Preserve moon orbit and drag interaction

2. **Day 11 — Upgrade cloud motion**
   - Replace blob-only clouds with softer streaks and bands
   - Keep cloud motion visually independent from the surface

3. **Day 12 — Make the terminator obvious**
   - Tune day-night blending
   - Strengthen city lights
   - Improve twilight readability

4. **Day 13 — Finish Genesis cleanly**
   - Improve ocean glints and night contrast
   - Ensure the observatory pages describe the Earth accurately

5. **Day 14 — Begin the Living World**
   - Prototype weather data integration
   - Gracefully handle API absence or failure

6. **Day 15 — Bring in richer textures**
   - Evaluate normal/specular maps
   - Test attribution-safe, CORS-safe sources

7. **Day 16 — Stabilize the builder**
   - Reduce repeated credit-exhaustion warnings
   - Prefer reliable low-cost model paths until complexity justifies more expensive ones

### 6. PROMINENT WATCHPOINT

> **Repeated model credit exhaustion happened 4 times this week.**
>
> This is the same failure class occurring 3+ times in one week, so it must remain visible in the roadmap until the daily runner is made more conservative with model choice and token demand.
