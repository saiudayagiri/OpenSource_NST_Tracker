const fs = require('fs');
const path = require('path');

const studentsJsonPath = path.join(__dirname, '../data/students.json');
const kvStudentsJsonPath = path.join(__dirname, '../data/kv/students_list.json');

// Helper to update campus to ADYPU for 2nd and 3rd year students
function updateCampus(list) {
  let updatedCount = 0;
  for (const student of list) {
    if (student.year === '2nd year' || student.year === '3rd year') {
      student.campus = 'ADYPU';
      updatedCount++;
    }
  }
  console.log(`Updated campus to ADYPU for ${updatedCount} students.`);
  return list;
}

// 1. Update data/students.json
if (fs.existsSync(studentsJsonPath)) {
  console.log('Updating data/students.json...');
  const data = JSON.parse(fs.readFileSync(studentsJsonPath, 'utf-8'));
  const updated = updateCampus(data);
  fs.writeFileSync(studentsJsonPath, JSON.stringify(updated, null, 2), 'utf-8');
}

// 2. Update data/kv/students_list.json
if (fs.existsSync(kvStudentsJsonPath)) {
  console.log('Updating data/kv/students_list.json...');
  const data = JSON.parse(fs.readFileSync(kvStudentsJsonPath, 'utf-8'));
  data.value = updateCampus(data.value);
  fs.writeFileSync(kvStudentsJsonPath, JSON.stringify(data, null, 2), 'utf-8');
}

// 3. Clear cache files so leaderboard regenerates
const kvDir = path.join(__dirname, '../data/kv');
if (fs.existsSync(kvDir)) {
  console.log('Clearing summary caches...');
  const cacheFiles = ['summary_cache_all.json', 'summary_cache_month.json', 'summary_cache_week.json'];
  for (const file of cacheFiles) {
    const fullPath = path.join(kvDir, file);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`Deleted cache: ${file}`);
    }
  }
}

console.log('All done!');
