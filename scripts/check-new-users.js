const usernames = [
  "adarsh-priydarshi-5646",
  "sanjana2505006",
  "bhavesh-210",
  "dhiraj-143r",
  "zenowinged",
  "geetxnshgoyal",
  "Shristibot",
  "nithyarajmudhaliyar",
  "Sahitya0805",
  "SidharthxNST",
  "sharmavikas18",
  "Aryan-Verma-4",
  "aashish-jha-11",
  "raman976",
  "manthansubhash01",
  "Tushar8466",
  "kartikktripathi",
  "Injora",
  "Parth-co79",
  "Adityakumar37",
  "siddhitripathi25",
  "Anshika-av",
  "vanshgit1111"
];

const fs = require('fs');
const path = require('path');
const kvDir = path.join(__dirname, '../data/kv');

for (const user of usernames) {
  const safeKey = `profile_cache_${user.toLowerCase()}`;
  const cachePath = path.join(kvDir, `${safeKey}.json`);
  if (fs.existsSync(cachePath)) {
    const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    console.log(`${user}: cachedAt = ${data.value.cachedAt}`);
  } else {
    console.log(`${user}: NO CACHE`);
  }
}
