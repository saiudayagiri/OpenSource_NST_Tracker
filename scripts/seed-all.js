const secret = 'cron_incremental_refresh_secret_2026';
const url = 'http://localhost:3000/api/refresh/incremental';

async function seed() {
  console.log('Starting full cache seed...');
  for (let i = 1; i <= 40; i++) {
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
    // Wait 12 seconds between batches to respect GitHub search rate limits (30 reqs/min)
    await new Promise(r => setTimeout(r, 12000));
  }
  console.log('Seeding process completed!');
}

seed();
