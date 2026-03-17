#!/usr/bin/env node
/**
 * THE DAILY RUNNER — Self-Evolving Earth
 * Runs via GitHub Actions at 8AM UTC every day.
 * Can also be run locally: node run.js
 */

'use strict';

const fs    = require('fs');
const path  = require('path');
const https = require('https');

const ROOT = __dirname;

const PATHS = {
  godPrompt : path.join(ROOT, 'GOD_PROMPT.md'),
  state     : path.join(ROOT, 'earth', 'state.json'),
  earth     : path.join(ROOT, 'earth.html'),
  window    : path.join(ROOT, 'window.html'),
  bible     : path.join(ROOT, 'THE-BIBLE.md'),
  log       : path.join(ROOT, 'run.log'),
};

const CANONICAL_OUTPUTS = new Set([
  'earth.html',
  'window.html',
  'earth/state.json',
  'THE-BIBLE.md',
]);

const OUTPUT_ALIASES = {
  './earth.html': 'earth.html',
  './window.html': 'window.html',
  './earth/state.json': 'earth/state.json',
  './THE-BIBLE.md': 'THE-BIBLE.md',
  'earth/earth.html': 'earth.html',
  'window/index.html': 'window.html',
};

// Cheap models — tried in order. GPT 4o mini first for cost efficiency.
const MODEL_CANDIDATES = [
  'openai/gpt-4o-mini',
  'anthropic/claude-3.5-haiku',
  'google/gemini-2.0-flash-001',
  'anthropic/claude-3.5-sonnet',
];

const MAX_TOKENS = 10000;

// ── Logging ────────────────────────────────────────────────
function log(msg) {
  const ts   = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(PATHS.log, line + '\n'); } catch (_) {}
}

function divider(c = '─') { log(c.repeat(60)); }

// ── File I/O ───────────────────────────────────────────────
function read(filePath, fallback = '') {
  try { return fs.readFileSync(filePath, 'utf8'); }
  catch (e) { log(`⚠  Cannot read ${path.relative(ROOT, filePath)}: ${e.message}`); return fallback; }
}

function write(filePath, content) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
    log(`✅ Written: ${path.relative(ROOT, filePath)}`);
    return true;
  } catch (e) {
    log(`❌ Write failed ${path.relative(ROOT, filePath)}: ${e.message}`);
    return false;
  }
}

// ── Parse ===FILE_START/END=== blocks ─────────────────────
function parseFileBlocks(text) {
  const blocks = [];
  const re = /===FILE_START:\s*(.+?)===\n([\s\S]*?)\n===FILE_END===/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    blocks.push({ relativePath: m[1].trim(), content: m[2] });
  }
  return blocks;
}

function normalizeOutputPath(relativePath) {
  const cleaned = relativePath.replace(/\\/g, '/').replace(/^\.\//, '').trim();
  const normalized = OUTPUT_ALIASES[cleaned] ?? cleaned;

  if (normalized !== cleaned) {
    log(`⚠  Normalized AI output path ${cleaned} -> ${normalized}`);
  }

  return normalized;
}

// ── OpenRouter API (OpenAI-compatible) ─────────────────────
function apiRequest(model, userContent, apiKey) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content: userContent }],
    });
    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://github.com/self-evolving-earth',
        'X-Title': 'THE EARTH - Self-Evolving Simulation',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, res => {
      let raw = '';
      res.on('data', c => { raw += c; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.error) return reject(new Error(`API: ${parsed.error.message}`));
          const text = parsed.choices?.[0]?.message?.content;
          if (!text) return reject(new Error(`No content in response. Body: ${raw.slice(0, 400)}`));
          resolve({ text });
        } catch (e) { reject(new Error(`Parse fail. Status ${res.statusCode}. Body: ${raw.slice(0, 400)}`)); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function callArchitect(content, apiKey) {
  log(`🤖 Model candidates: ${MODEL_CANDIDATES.join(', ')}`);

  for (const model of MODEL_CANDIDATES) {
    log(`🤖 Trying: ${model}`);
    try {
      const { text } = await apiRequest(model, content, apiKey);
      log(`✅ Success: ${model} (${text.length} chars)`);
      return { model, text };
    } catch (e) { log(`⚠  ${model} failed: ${e.message}`); }
  }
  throw new Error('All models failed.');
}

// ── Ensure HTML files load state.json ───────────────────────
const WINDOW_STATE_SCRIPT = `<script>
(function(){fetch('earth/state.json').then(r=>r.json()).then(s=>{
var d=document;
var day=s.earth?.day??s.day??0,c=s.earth?.complexity_level??s.complexityLevel??0,f=s.features||[],loc=s.linesOfCode??0;
var el=function(id){return d.getElementById(id);};
if(el('metric-day'))el('metric-day').textContent=day;
if(el('metric-complexity'))el('metric-complexity').textContent=c;
if(el('metric-features'))el('metric-features').textContent=f.length||s.totalFeatures||0;
if(el('metric-loc'))el('metric-loc').textContent=loc?'~'+loc:'—';
if(el('phase-name'))el('phase-name').textContent=(s.phase||'Genesis')+' Phase';
if(el('phase-days'))el('phase-days').textContent='Days '+Math.max(1,day-9)+'–'+(day+1)+': The foundations are laid';
if(el('progress-fill'))el('progress-fill').style.width=c+'%';
if(el('progress-label'))el('progress-label').textContent=c+' / 100';
if(el('feature-list'))el('feature-list').innerHTML=(f.length?f:['—']).map(x=>'<li>'+x+'</li>').join('');
var specs=[];if(s.earthRotation?.speed)specs.push('Earth Rotation: '+s.earthRotation.speed+' rad/frame');
if(s.camera?.fov)specs.push('Camera FOV: '+s.camera.fov+'°');specs.push('Three.js r128');specs.push('1024×512');specs.push('800 stars');
if(el('tech-specs-list'))el('tech-specs-list').innerHTML=specs.map(x=>'<li>'+x+'</li>').join('');
var up=s.earth?.last_updated?new Date(s.earth.last_updated):new Date();
if(el('last-update'))el('last-update').textContent='Last Updated: '+up.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})+' — Day '+day+' of Creation';
}).catch(function(){if(document.getElementById('last-update'))document.getElementById('last-update').textContent='State unavailable';});})();
</script>`;

const EARTH_STATE_SCRIPT = `<script>
fetch('earth/state.json').then(r=>r.json()).then(s=>{
var day=s.earth?.day??s.day??1,c=s.earth?.complexity_level??s.complexityLevel??1;
var i=document.getElementById('info');if(i)i.textContent='Day '+day+' of Creation';
document.title='THE EARTH — Day '+day;console.log('🌍 THE EARTH — Day '+day+' of Creation');
}).catch(function(){var i=document.getElementById('info');if(i)i.textContent='THE EARTH';});
</script>`;

function ensureHtmlLoadsState() {
  const htmlFiles = [
    { path: path.join(ROOT, 'window.html'), marker: 'earth/state.json', script: WINDOW_STATE_SCRIPT },
    { path: path.join(ROOT, 'earth.html'), marker: 'earth/state.json', script: EARTH_STATE_SCRIPT },
  ];
  for (const { path: filePath, marker, script } of htmlFiles) {
    try {
      let content = read(filePath, '');
      if (!content.includes(marker)) {
        content = content.replace(/<\/body>/i, script + '\n</body>');
        write(filePath, content);
        log(`📦 Injected state loader into ${path.basename(filePath)}`);
      }
    } catch (e) { log(`⚠  Could not ensure state loader in ${path.basename(filePath)}: ${e.message}`); }
  }
}

// ── Build context ──────────────────────────────────────────
function buildContext(state) {
  const today   = new Date().toISOString().split('T')[0];
  const nextDay = (state?.earth?.day ?? 0) + 1;
  const repo    = process.env.GITHUB_REPOSITORY  ? `GitHub Repo: ${process.env.GITHUB_REPOSITORY}` : '(local run)';
  const run     = process.env.GITHUB_RUN_NUMBER   ? `Actions Run: #${process.env.GITHUB_RUN_NUMBER}` : '';
  const earthHtml  = read(PATHS.earth);
  const windowHtml = read(PATHS.window);
  const bibleSnip  = read(PATHS.bible).slice(-4000);
  const godPrompt  = read(PATHS.godPrompt);

  return `Today's Date: ${today}
Day to Build: ${nextDay}
${repo}
${run}

=== CURRENT state.json ===
${JSON.stringify(state, null, 2)}

=== CURRENT earth.html (${earthHtml.length} chars) ===
${earthHtml}

=== CURRENT window.html (${windowHtml.length} chars) ===
${windowHtml}

=== THE-BIBLE.md (last 4000 chars) ===
${bibleSnip}

=== GOD_PROMPT.md ===
${godPrompt}

---
Build Day ${nextDay}. Output ALL changed files using ===FILE_START/===FILE_END format.
Files live at the repo root: earth.html, window.html, earth/state.json, THE-BIBLE.md.
Use these exact relative paths in FILE_START headers.

CRITICAL: window.html and earth.html MUST preserve the state-loading script that fetches earth/state.json.
Keep element ids: metric-day, metric-complexity, metric-features, metric-loc, phase-name, phase-days, progress-fill, progress-label, feature-list, last-update.
index.html already loads from state.json — do not break it.`.trim();
}

// ── Main ───────────────────────────────────────────────────
async function main() {
  divider('═');
  log('   THE DAILY RUNNER — Self-Evolving Earth');
  divider('═');

  const forceRebuild = process.env.FORCE_REBUILD === 'true';
  if (forceRebuild) log('🔁 FORCE_REBUILD=true — manually triggered from GitHub Actions');

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || !apiKey.startsWith('sk-')) {
    log('❌ OPENROUTER_API_KEY missing or invalid. Set it in environment or GitHub Secrets.');
    process.exit(1);
  }

  let state;
  try {
    state = JSON.parse(read(PATHS.state, '{}'));
    log(`📖 State: Day ${state?.earth?.day ?? 0}, Complexity ${state?.earth?.complexity_level ?? 0}/100`);
  } catch (e) {
    log('⚠  state.json unreadable — starting fresh'); state = {};
  }

  log('🔭 Building context...');
  const context = buildContext(state);
  log(`📏 Context: ${context.length} chars`);

  divider();
  log('⚡ Summoning THE ARCHITECT...');
  divider();
  const { model, text: response } = await callArchitect(context, apiKey);

  const blocks = parseFileBlocks(response);
  log(`📝 File blocks found: ${blocks.length}`);

  if (blocks.length === 0) {
    log('⚠  No FILE blocks in response. Writing debug file.');
    write(path.join(ROOT, 'debug-last-response.txt'), response);
    process.exit(1);
  }

  divider();
  log('🌍 Applying changes...');
  let written = 0;
  const seenPaths = new Set();
  for (const block of blocks) {
    const relativePath = normalizeOutputPath(block.relativePath);
    if (!CANONICAL_OUTPUTS.has(relativePath)) {
      log(`⚠  Ignored unexpected output path: ${block.relativePath}`);
      continue;
    }

    seenPaths.add(relativePath);
    if (write(path.join(ROOT, relativePath), block.content)) written++;
  }
  log(`📦 ${written}/${blocks.length} files written`);

  const missingOutputs = [...CANONICAL_OUTPUTS].filter(file => !seenPaths.has(file));
  if (missingOutputs.length) {
    log(`⚠  Response omitted canonical files: ${missingOutputs.join(', ')}`);
  }

  // Stamp model & timestamp into state
  try {
    const s = JSON.parse(read(PATHS.state, '{}'));
    if (!s.earth) s.earth = {};
    s.earth.model_used   = model;
    s.earth.last_updated = new Date().toISOString();
    write(PATHS.state, JSON.stringify(s, null, 2));
  } catch (_) {}

  // Ensure HTML files load state from state.json (inject if AI overwrote)
  ensureHtmlLoadsState();

  divider('═');
  try {
    const f = JSON.parse(read(PATHS.state, '{}'));
    log(`   ✅ COMPLETE — Day ${f?.earth?.day}, Complexity ${f?.earth?.complexity_level}/100, Model: ${model}`);
  } catch (_) { log('   ✅ Build complete'); }
  divider('═');
}

main().catch(e => {
  log(`💀 Fatal: ${e.message}`);
  process.exit(1);
});