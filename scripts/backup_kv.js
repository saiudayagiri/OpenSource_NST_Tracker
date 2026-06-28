const fs = require('fs');
const path = require('path');

// 1. Read environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.substring(0, idx).trim();
    const val = trimmed.substring(idx + 1).trim();
    process.env[key] = val;
  });
}

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

if (!KV_URL || !KV_TOKEN) {
  console.error('❌ Error: KV_REST_API_URL or KV_REST_API_TOKEN is not defined in .env.local');
  process.exit(1);
}

const BACKUP_NAME = process.argv[2] || 'einstein0';
const BACKUP_DIR = path.join(__dirname, '..', 'data', 'backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}
const BACKUP_FILE = path.join(BACKUP_DIR, `${BACKUP_NAME}_kv.json`);

async function redisCommand(cmd) {
  const res = await fetch(KV_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cmd),
  });
  if (!res.ok) {
    throw new Error(`Upstash returned HTTP ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  return json.result;
}

async function run() {
  try {
    console.log('🔍 Scanning all keys in Upstash Redis / Vercel KV...');
    const keys = await redisCommand(['KEYS', '*']);
    console.log(`ℹ️ Found ${keys.length} keys in database.`);

    const backup = {};
    const batchSize = 50;

    for (let i = 0; i < keys.length; i += batchSize) {
      const batchKeys = keys.slice(i, i + batchSize);
      console.log(`📦 Fetching values for batch ${i / batchSize + 1} (${batchKeys.length} keys)...`);
      
      const pipelineRes = await fetch(`${KV_URL}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KV_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batchKeys.map(k => ['GET', k])),
      });
      
      const results = await pipelineRes.json();
      
      batchKeys.forEach((key, idx) => {
        const rawVal = results[idx]?.result;
        if (rawVal !== null && rawVal !== undefined) {
          try {
            backup[key] = JSON.parse(rawVal);
          } catch {
            backup[key] = rawVal;
          }
        }
      });
    }

    fs.writeFileSync(BACKUP_FILE, JSON.stringify(backup, null, 2), 'utf8');
    console.log(`\n🎉 Backup completed successfully! Saved to data/backups/${BACKUP_NAME}_kv.json`);
    console.log(`   Backup contains: ${Object.keys(backup).length} keys.`);
  } catch (err) {
    console.error('❌ Error during backup:', err.message);
  }
}

run();
