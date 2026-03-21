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

// Fallback model list if the live ranking fetch fails
const FALLBACK_MODELS = [
  'anthropic/claude-opus-4-5',
  'anthropic/claude-sonnet-4-5',
  'google/gemini-2.5-pro-preview',
  'openai/gpt-4.1',
  'anthropic/claude-3-7-sonnet',
];
const BUDGET_FALLBACK_MODELS = [
  'google/gemini-2.0-flash-001',
  'google/gemini-2.5-flash',
  'openai/gpt-4o-mini',
  'anthropic/claude-3.5-haiku',
];

const CODING_PROVIDERS   = ['anthropic', 'openai', 'google', 'deepseek', 'x-ai'];
const MIN_CONTEXT_TOKENS = 32_000;
const MAX_CANDIDATES     = 5;

// Score = log2(context_M) + log10(price_per_mtok + ε)
// Balances large context window vs. premium (expensive = flagship) pricing.
function scoreModel(m) {
  const ctx   = Math.log2(Math.max(m.context_length ?? 1, 1) / 1_000);
  const price = Math.log10(parseFloat(m.pricing?.completion ?? '0') * 1_000_000 + 1e-6) + 6;
  return ctx + price;
}

function fetchBestCodingModels(apiKey) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'openrouter.ai',
      path    : '/api/v1/models',
      method  : 'GET',
      headers : {
        'Authorization' : `Bearer ${apiKey}`,
        'HTTP-Referer'  : 'https://github.com/self-evolving-earth',
        'X-Title'       : 'THE EARTH - Self-Evolving Simulation',
      },
    };
    const req = https.request(options, res => {
      let raw = '';
      res.on('data', c => { raw += c; });
      res.on('end', () => {
        try {
          const { data: models } = JSON.parse(raw);
          const ranked = models
            .filter(m => {
              const provider = m.id.split('/')[0];
              if (!CODING_PROVIDERS.includes(provider)) return false;
              if ((m.context_length ?? 0) < MIN_CONTEXT_TOKENS) return false;
              if (m.id.endsWith(':free')) return false;
              if (parseFloat(m.pricing?.completion ?? '0') === 0) return false;
              return true;
            })
            .sort((a, b) => scoreModel(b) - scoreModel(a))
            .slice(0, MAX_CANDIDATES)
            .map(m => m.id);
          if (ranked.length === 0) return reject(new Error('No suitable models found'));
          resolve(ranked);
        } catch (e) { reject(new Error(`Models parse fail: ${e.message}`)); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

const MAX_TOKENS = 9000;

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

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
  let candidates;
  try {
    candidates = await fetchBestCodingModels(apiKey);
    log(`🏆 Live model ranking fetched: ${candidates.join(', ')}`);
  } catch (e) {
    log(`⚠  Could not fetch live model list (${e.message}), using fallback`);
    candidates = FALLBACK_MODELS;
  }

  // Prefer budget-friendly models first so daily runs do not burn credits
  // before reaching a model that can actually complete the task.
  candidates = unique([...BUDGET_FALLBACK_MODELS, ...candidates, ...FALLBACK_MODELS]);
  log(`🤖 Final model queue: ${candidates.join(', ')}`);

  for (const model of candidates) {
    log(`🤖 Trying: ${model}`);
    try {
      const { text } = await apiRequest(model, content, apiKey);
      log(`✅ Success: ${model} (${text.length} chars)`);
      return { model, text };
    } catch (e) { log(`⚠  ${model} failed: ${e.message}`); }
  }
  throw new Error('All models failed.');
}

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
if(el('phase-days'))el('phase-days').textContent='Days 1–10: the foundations of Earth are still forming';
if(el('progress-fill'))el('progress-fill').style.width=c+'%';
if(el('progress-label'))el('progress-label').textContent=c+' / 100';
if(el('feature-list'))el('feature-list').innerHTML=(f.length?f:['—']).map(x=>'<li>'+x+'</li>').join('');
var up=s.earth?.last_updated?new Date(s.earth.last_updated):new Date();
if(el('last-update'))el('last-update').textContent='Last Updated: '+up.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})+' — Day '+day+' of Creation';
}).catch(function(){if(document.getElementById('last-update'))document.getElementById('last-update').textContent='State unavailable';});})();
</script>`;

const EARTH_STATE_SCRIPT = `<script>
fetch('earth/state.json').then(r=>r.json()).then(s=>{
var day=s.earth?.day??s.day??1,c=s.earth?.complexity_level??s.complexityLevel??1,p=s.phase||'Genesis';
var i=document.getElementById('info');
if(i)i.innerHTML='Day '+day+' of Creation<br><span style="font-size:11px;color:rgba(255,255,255,0.45);">Complexity '+c+'/100 · '+p+' Phase</span>';
document.title='THE EARTH — Day '+day;
}).catch(function(){var i=document.getElementById('info');if(i)i.textContent='THE EARTH';});
</script>`;

function ensureHtmlLoadsState() {
  const htmlFiles = [
    { filePath: PATHS.window, marker: 'earth/state.json', script: WINDOW_STATE_SCRIPT },
    { filePath: PATHS.earth, marker: 'earth/state.json', script: EARTH_STATE_SCRIPT },
  ];

  for (const { filePath, marker, script } of htmlFiles) {
    let content = read(filePath, '');
    if (!content || content.includes(marker)) continue;
    if (/<\/body>/i.test(content)) {
      content = content.replace(/<\/body>/i, script + '\n</body>');
      write(filePath, content);
      log(`📦 Injected state loader into ${path.basename(filePath)}`);
    }
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
Keep element ids: metric-day, metric-complexity, metric-features, metric-loc, phase-name, phase-days, progress-fill, progress-label, feature-list, last-update.`.trim();
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
  for (const block of blocks) {
    if (write(path.join(ROOT, block.relativePath), block.content)) written++;
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