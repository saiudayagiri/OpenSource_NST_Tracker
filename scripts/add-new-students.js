const fs = require('fs');
const path = require('path');

const usernames = [
  "adarsh-priydarshi-5646",
  "sanjana2505006",
  "jhaayushkumar",
  "1-navneet",
  "rakshityadav1868",
  "bhavesh-210",
  "dhiraj-143r",
  "zenowinged",
  "geetxnshgoyal",
  "Shristibot",
  "nithyarajmudhaliyar",
  "Sahitya0805",
  "SidharthxNST",
  "unnati-jaiswal24",
  "sharmavikas18",
  "ManshaAgarwal716",
  "EncrypterParv",
  "bitflicker64",
  "Codehuman07",
  "gaurvansh133-glitch",
  "preetk25627-dotcom",
  "Siddhant-Srivastava-20",
  "Aryan-Verma-4",
  "vtushar06",
  "shiavm006",
  "sarthak-gupta229",
  "Dreamstick9",
  "sujayxbarui",
  "awantika-m",
  "yats0x7",
  "shubhammittal2241",
  "Arpan-Kaur2006",
  "CWAbhi",
  "kartikeyg0104",
  "DikshantJangra",
  "aashish-jha-11",
  "raman976",
  "manthansubhash01",
  "sammy200-ui",
  "Tushar8466",
  "kartikktripathi",
  "Injora",
  "mishtiagrawal02-cloud",
  "shiavm006",
  "vikgenix",
  "abhiiiiiii-21",
  "Srijan76-code",
  "sathvik89",
  "nishtha-09-gupta",
  "Parth-co79",
  "Adityakumar37",
  "siddhitripathi25",
  "Anshika-av",
  "ipsitdebnath",
  "akhileshsude",
  "lakshyaramchandani18",
  "smoky4g4h",
  "Abhi-2206",
  "abhinavsingh-hub",
  "AbnormalPilot",
  "anveshap103-tomato",
  "AKRITI-ENG",
  "amreshanand",
  "vanshgit1111",
  "kanikasharma-18",
  "Aayush2141",
  "divyansha12",
  "Nitanshu12",
  "Aggarwalmansi",
  "abhi-7-7",
  "AgrimaOjha",
  "Divyanshu-s13",
  "somraj112",
  "Shreyashgol",
  "deepanshu-sharma425",
  "AnanyaSoni2004"
];

const studentsFile = path.join(__dirname, '../data/students.json');
const kvFile = path.join(__dirname, '../data/kv/students_list.json');

let currentStudents = [];
try {
  currentStudents = JSON.parse(fs.readFileSync(studentsFile, 'utf8'));
} catch (e) {
  console.log('Error reading students.json, initializing empty');
}

const currentSet = new Set(currentStudents.map(s => s.github.toLowerCase()));
const newUsersAdded = [];

for (const user of usernames) {
  const trimmed = user.trim();
  if (trimmed && !currentSet.has(trimmed.toLowerCase())) {
    currentStudents.push({ github: trimmed });
    currentSet.add(trimmed.toLowerCase());
    newUsersAdded.push(trimmed);
  }
}

if (newUsersAdded.length === 0) {
  console.log('All of these users are already in the database. No new users to add!');
  process.exit(0);
}

console.log(`Adding ${newUsersAdded.length} new users:`, newUsersAdded);

fs.writeFileSync(studentsFile, JSON.stringify(currentStudents, null, 2), 'utf8');

try {
  const kvData = {
    value: currentStudents,
    expiresAt: null
  };
  fs.writeFileSync(kvFile, JSON.stringify(kvData, null, 2), 'utf8');
} catch (e) {
  console.error('Error writing to KV students_list.json:', e);
}

const secret = 'cron_incremental_refresh_secret_2026';
const url = 'http://localhost:3000/api/refresh/incremental';

async function seedNewUsers() {
  console.log('Seeding cache for new users...');
  const totalBatches = Math.ceil(newUsersAdded.length / 5);
  for (let i = 1; i <= totalBatches; i++) {
    console.log(`[Batch ${i}/${totalBatches}] Fetching profiles and contributions...`);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'x-cron-secret': secret,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      console.log(`[Batch ${i}/${totalBatches}] Updated users:`, data.updatedUsers);
    } catch (err) {
      console.error(`[Batch ${i}/${totalBatches}] Error:`, err);
    }
    if (i < totalBatches) {
      await new Promise(r => setTimeout(r, 12000));
    }
  }
  console.log('All new users have been successfully cached and added to the leaderboard!');
}

seedNewUsers();
