const fs = require('fs');
const path = require('path');

const kvDir = path.join(__dirname, '../data/kv');

// 1. Delete all profile caches
console.log('Clearing old profile caches...');
const files = fs.readdirSync(kvDir);
let deletedCount = 0;
for (const file of files) {
  if (file.startsWith('profile_cache_') && file.endsWith('.json')) {
    fs.unlinkSync(path.join(kvDir, file));
    deletedCount++;
  }
}
console.log(`Deleted ${deletedCount} profile cache files.`);

// 2. Trigger the seeder
const secret = 'cron_incremental_refresh_secret_2026';
const url = 'http://localhost:3000/api/refresh/incremental';

async function seed() {
  console.log('Starting full fresh cache seed...');
  for (let i = 1; i <= 45; i++) {
    console.log(`[Batch ${i}] Triggering incremental refresh...`);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'x-cron-secret': secret,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      console.log(`[Batch ${i}] Response:`, data);
      
      if (!data.updatedUsers || data.updatedUsers.length === 0) {
        console.log('No more stale users. All caches are completely up to date!');
        break;
      }
    } catch (err) {
      console.error(`[Batch ${i}] Error:`, err);
    }
    // Wait 12 seconds between batches to respect GitHub search rate limits
    await new Promise(r => setTimeout(r, 12000));
  }
  console.log('Fresh seeding process completed!');
}

seed();
