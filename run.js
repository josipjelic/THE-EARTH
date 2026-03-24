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

// Keep the builder on affordable models first so scheduled runs survive low-credit periods.
const MODEL_CANDIDATES = [
  { name: 'google/gemini-2.0-flash-001', maxTokens: 6200 },
  { name: 'openai/gpt-4o-mini', maxTokens: 4200 },
  { name: 'anthropic/claude-3.5-haiku', maxTokens: 2400 },
  { name: 'anthropic/claude-3.5-sonnet', maxTokens: 2400 },
];

const FORMAT_REPAIR_MAX_TOKENS = 2200;

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

function normalizeRelativePath(relativePath) {
  const clean = relativePath.replace(/\\/g, '/').replace(/^\.?\//, '').trim();
  const aliasMap = {
    'earth/earth.html': 'earth.html',
    'window/index.html': 'window.html',
  };
  return aliasMap[clean] || clean;
}

// ── OpenRouter API (OpenAI-compatible) ─────────────────────
function apiRequest(model, userContent, apiKey, maxTokens) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model,
      max_tokens: maxTokens,
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
  log(`🤖 Model candidates: ${MODEL_CANDIDATES.map(m => `${m.name}(${m.maxTokens})`).join(', ')}`);

  for (const candidate of MODEL_CANDIDATES) {
    log(`🤖 Trying: ${candidate.name} (max_tokens=${candidate.maxTokens})`);
    try {
      const { text } = await apiRequest(candidate.name, content, apiKey, candidate.maxTokens);
      log(`✅ Success: ${candidate.name} (${text.length} chars)`);
      return { model: candidate.name, text };
    } catch (e) { log(`⚠  ${candidate.name} failed: ${e.message}`); }
  }
  throw new Error('All models failed.');
}

async function repairMalformedResponse(rawResponse, apiKey) {
  const repairPrompt = `The following model output was supposed to contain files using this exact format:
===FILE_START: relative/path===
...full file content...
===FILE_END===

Allowed paths:
- earth.html
- window.html
- earth/state.json
- THE-BIBLE.md

Convert the response into only FILE_START/FILE_END blocks. Do not add commentary. Preserve content exactly where possible.
If the response is not recoverable into file blocks, return exactly NO_RECOVERABLE_FILES.

===RAW_RESPONSE===
${rawResponse.slice(0, 22000)}
===END_RAW_RESPONSE===`;

  for (const candidate of MODEL_CANDIDATES.slice(0, 2)) {
    try {
      log(`🛠️  Repair attempt via ${candidate.name}`);
      const { text } = await apiRequest(candidate.name, repairPrompt, apiKey, FORMAT_REPAIR_MAX_TOKENS);
      if (text.trim() === 'NO_RECOVERABLE_FILES') break;
      const blocks = parseFileBlocks(text);
      if (blocks.length) return { model: candidate.name, text, blocks };
    } catch (e) {
      log(`⚠  Repair attempt failed on ${candidate.name}: ${e.message}`);
    }
  }

  return { model: null, text: rawResponse, blocks: [] };
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
  const bibleSnip  = read(PATHS.bible).slice(-3200);
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
index.html already loads from state.json — do not break it.
Keep edits incremental so output remains compact and reliable. Prefer the smallest meaningful improvement instead of rewriting untouched files.`.trim();
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

  let blocks = parseFileBlocks(response);
  log(`📝 File blocks found: ${blocks.length}`);

  if (blocks.length === 0) {
    log('⚠  No FILE blocks in response. Attempting repair pass.');
    const repaired = await repairMalformedResponse(response, apiKey);
    blocks = repaired.blocks;
    log(`🛠️  Repair blocks found: ${blocks.length}`);
    if (blocks.length === 0) {
      log('⚠  Repair failed. Writing debug file.');
      write(path.join(ROOT, 'debug-last-response.txt'), response);
      process.exit(1);
    }
  }

  divider();
  log('🌍 Applying changes...');
  let written = 0;
  for (const block of blocks) {
    const normalizedPath = normalizeRelativePath(block.relativePath);
    if (normalizedPath !== block.relativePath) {
      log(`⚠  Normalized legacy output path ${block.relativePath} -> ${normalizedPath}`);
    }
    if (write(path.join(ROOT, normalizedPath), block.content)) written++;
  }
  log(`📦 ${written}/${blocks.length} files written`);

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

  // Remove stale debugging artifacts after a successful write cycle.
  try {
    const debugPath = path.join(ROOT, 'debug-last-response.txt');
    if (fs.existsSync(debugPath)) {
      fs.unlinkSync(debugPath);
      log('🧹 Removed stale debug-last-response.txt');
    }
  } catch (e) {
    log(`⚠  Could not remove debug-last-response.txt: ${e.message}`);
  }

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