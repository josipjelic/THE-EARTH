#!/usr/bin/env node
/**
 * ╔═══════════════════════════════════════════════════════╗
 * ║              THE DAILY RUNNER                         ║
 * ║    "Each dawn, the Architect awakens and builds."     ║
 * ║                                                       ║
 * ║  Run this with: node run.js                           ║
 * ║  Schedule with: cron / Task Scheduler / Cursor        ║
 * ╚═══════════════════════════════════════════════════════╝
 *
 * What this does:
 * 1. Reads the GOD PROMPT
 * 2. Reads current Earth state (state.json + all HTML files)
 * 3. Finds the latest available Anthropic model
 * 4. Calls Claude with full context
 * 5. Parses the response for file changes
 * 6. Applies file changes
 * 7. Commits a log entry
 * 8. Optionally: opens the WINDOW in browser
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ── Configuration ──────────────────────────────────────────
const CONFIG = {
  // Anthropic API key — set in environment or .env file
  apiKey: process.env.ANTHROPIC_API_KEY || '',

  // Always use the latest model — update this when new models release
  // The runner itself will try to determine the latest via a quick API call
  defaultModel: 'claude-opus-4-5',

  // File paths (relative to this script's location)
  paths: {
    godPrompt:  './GOD_PROMPT.md',
    state:      './earth/state.json',
    earth:      './earth/earth.html',
    window:     './window/index.html',
    bible:      './THE-BIBLE.md',
    log:        './run.log',
  },

  // Max tokens for the daily build response
  maxTokens: 8192,

  // Open browser after build?
  openBrowser: false,
};

// ── Helpers ────────────────────────────────────────────────

function log(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}`;
  console.log(line);
  fs.appendFileSync(CONFIG.paths.log, line + '\n');
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    log(`⚠️  Could not read ${filePath}: ${e.message}`);
    return '';
  }
}

function writeFile(filePath, content) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
    log(`✅ Written: ${filePath}`);
  } catch (e) {
    log(`❌ Failed to write ${filePath}: ${e.message}`);
  }
}

// ── Parse THE ARCHITECT's response ────────────────────────
/**
 * The GOD PROMPT instructs Claude to output file changes in this format:
 * ===FILE_START: path/to/file.ext===
 * [content]
 * ===FILE_END===
 */
function parseFileChanges(response) {
  const changes = [];
  const regex = /===FILE_START: (.+?)===\n([\s\S]*?)\n===FILE_END===/g;
  let match;
  while ((match = regex.exec(response)) !== null) {
    changes.push({
      path: match[1].trim(),
      content: match[2]
    });
  }
  return changes;
}

// ── Anthropic API Call ─────────────────────────────────────
function callClaude(model, messages, maxTokens) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages,
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CONFIG.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(`API Error: ${parsed.error.message}`));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}\nRaw: ${data.slice(0, 500)}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Get Latest Model ───────────────────────────────────────
async function getLatestModel() {
  // Model priority list — update as Anthropic releases new models
  // The runner tries the first one; falls back down the list
  const modelCandidates = [
    'claude-opus-4-5',
    'claude-sonnet-4-5',
    'claude-haiku-4-5',
  ];

  // For now: return the configured default
  // Future: could call /v1/models endpoint to get latest
  log(`🤖 Using model: ${CONFIG.defaultModel}`);
  return CONFIG.defaultModel;
}

// ── Build the Context for THE ARCHITECT ───────────────────
function buildContext(state) {
  const today = new Date().toISOString().split('T')[0];
  const dayNumber = (state.earth?.day || 0) + 1;

  return `
Today's Date: ${today}
Day Number: ${dayNumber}
Model Available: ${CONFIG.defaultModel}

=== CURRENT STATE (state.json) ===
${JSON.stringify(state, null, 2)}

=== CURRENT EARTH (earth.html) — ${readFile(CONFIG.paths.earth).length} chars ===
${readFile(CONFIG.paths.earth)}

=== CURRENT WINDOW (window/index.html) — ${readFile(CONFIG.paths.window).length} chars ===
${readFile(CONFIG.paths.window)}

=== THE BIBLE (last 3000 chars) ===
${readFile(CONFIG.paths.bible).slice(-3000)}

=== YOUR DIVINE MANDATE ===
${readFile(CONFIG.paths.godPrompt)}

Now build Day ${dayNumber}. Make it more magnificent than yesterday.
Output your changes using the ===FILE_START/END=== format.
`.trim();
}

// ── Main Execution ─────────────────────────────────────────
async function main() {
  log('');
  log('═══════════════════════════════════════════════════');
  log('   THE DAILY RUNNER — Self-Evolving Earth Build     ');
  log('═══════════════════════════════════════════════════');

  // 1. Validate API key
  if (!CONFIG.apiKey) {
    log('❌ ANTHROPIC_API_KEY not set. Export it or add to .env');
    log('   export ANTHROPIC_API_KEY=sk-ant-...');
    process.exit(1);
  }

  // 2. Read current state
  const stateRaw = readFile(CONFIG.paths.state);
  let state;
  try {
    state = JSON.parse(stateRaw);
    log(`📖 Current state: Day ${state.earth?.day}, Complexity ${state.earth?.complexity_level}`);
  } catch (e) {
    log('❌ Failed to parse state.json: ' + e.message);
    process.exit(1);
  }

  // 3. Get latest model
  const model = await getLatestModel();

  // 4. Build context
  log('🔭 Building context for THE ARCHITECT...');
  const context = buildContext(state);
  log(`📏 Context size: ${context.length} chars`);

  // 5. Call Claude
  log(`⚡ Summoning THE ARCHITECT (${model})...`);
  let response;
  try {
    const result = await callClaude(model, [
      { role: 'user', content: context }
    ], CONFIG.maxTokens);

    response = result.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n');

    log(`✅ THE ARCHITECT has spoken (${response.length} chars)`);
  } catch (e) {
    log('❌ API call failed: ' + e.message);
    process.exit(1);
  }

  // 6. Parse file changes
  log('🔍 Parsing divine instructions...');
  const changes = parseFileChanges(response);
  log(`📝 Found ${changes.length} file(s) to update`);

  if (changes.length === 0) {
    log('⚠️  No file changes found in response. Check GOD_PROMPT format.');
    log('--- Raw response (first 2000 chars) ---');
    log(response.slice(0, 2000));
    process.exit(1);
  }

  // 7. Apply changes
  log('🌍 Applying changes to the Earth...');
  for (const change of changes) {
    writeFile(change.path, change.content);
  }

  // 8. Log build
  const newState = JSON.parse(readFile(CONFIG.paths.state));
  log('');
  log('═══════════════════════════════════════════════════');
  log(`   BUILD COMPLETE — Day ${newState.earth?.day} of the Earth          `);
  log(`   Complexity: ${newState.earth?.complexity_level}/100                          `);
  log(`   Features: ${newState.features?.active?.length || '?'}                                    `);
  log('═══════════════════════════════════════════════════');

  // 9. Optional: open browser
  if (CONFIG.openBrowser) {
    const { exec } = require('child_process');
    exec(`open ./window/index.html || xdg-open ./window/index.html || start ./window/index.html`);
  }
}

main().catch(e => {
  log('💀 Fatal error: ' + e.message);
  process.exit(1);
});
