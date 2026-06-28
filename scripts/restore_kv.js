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
const BACKUP_FILE = path.join(__dirname, '..', 'data', 'backups', `${BACKUP_NAME}_kv.json`);

if (!fs.existsSync(BACKUP_FILE)) {
  console.error(`❌ Error: Backup file not found at ${BACKUP_FILE}`);
  process.exit(1);
}

async function redisPipeline(commands) {
  const res = await fetch(`${KV_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  });
  if (!res.ok) {
    throw new Error(`Upstash returned HTTP ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function run() {
  try {
    console.log(`📂 Reading backup file: data/backups/${BACKUP_NAME}_kv.json...`);
    const backup = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
    const keys = Object.keys(backup);
    console.log(`ℹ️ Found ${keys.length} keys in backup.`);

    const batchSize = 30;
    let commands = [];
    let count = 0;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const val = backup[key];
      const serialized = typeof val === 'object' ? JSON.stringify(val) : String(val);

      commands.push(['SET', key, serialized]);

      if (commands.length >= batchSize || i === keys.length - 1) {
        const currentBatchSize = commands.length;
        console.log(`📦 Restoring batch of ${currentBatchSize} keys (${i + 1}/${keys.length})...`);
        await redisPipeline(commands);
        count += currentBatchSize;
        commands = [];
        await new Promise(r => setTimeout(r, 100));
      }
    }

    console.log(`\n🎉 Restore completed successfully! Restored ${count}/${keys.length} keys to Vercel KV.`);
  } catch (err) {
    console.error('❌ Error during restore:', err.message);
  }
}

run();
