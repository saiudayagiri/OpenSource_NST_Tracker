const fs = require('fs');
const path = require('path');

const studentsFile = path.join(__dirname, '../data/students.json');
const kvDir = path.join(__dirname, '../data/kv');

const students = JSON.parse(fs.readFileSync(studentsFile, 'utf8'));

console.log(`Total students in JSON: ${students.length}`);

const cachedUsers = [];
const uncachedUsers = [];

for (const student of students) {
  const safeKey = `profile_cache_${student.github.toLowerCase()}`;
  const cachePath = path.join(kvDir, `${safeKey}.json`);
  if (fs.existsSync(cachePath)) {
    const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    cachedUsers.push({
      github: student.github,
      cachedAt: data.value ? data.value.cachedAt : null
    });
  } else {
    uncachedUsers.push(student.github);
  }
}

console.log(`Cached users count: ${cachedUsers.length}`);
console.log(`Uncached users count: ${uncachedUsers.length}`);
console.log('Uncached users list:', uncachedUsers);

cachedUsers.sort((a, b) => new Date(a.cachedAt) - new Date(b.cachedAt));
console.log('Top 10 oldest caches:', cachedUsers.slice(0, 10));
