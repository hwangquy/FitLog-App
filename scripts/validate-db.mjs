// Kiểm tra db.json theo đúng bộ chuẩn hoá mà app dùng: bản ghi nào app sẽ loại bỏ sẽ bị báo ở đây.
// Chạy: npm run validate:db
import { readFileSync } from 'node:fs';
import { normalizeGoal, normalizeReminder, normalizeWorkout } from '../src/utils/normalize.ts';

const file = new URL('../db.json', import.meta.url);
const db = JSON.parse(readFileSync(file, 'utf8'));
let problems = 0;
const fail = msg => { problems++; console.error('✗', msg); };

const checks = { workouts: normalizeWorkout, goals: normalizeGoal, reminders: normalizeReminder };
for (const [name, normalize] of Object.entries(checks)) {
  const rows = db[name];
  if (!Array.isArray(rows)) { fail(`"${name}" phải là một mảng`); continue; }
  const ids = new Set();
  rows.forEach((row, i) => {
    const n = normalize(row);
    if (!n) return fail(`${name}[${i}] không hợp lệ (id=${row?.id}); app sẽ bỏ qua bản ghi này`);
    if (ids.has(n.id)) fail(`${name}: trùng id "${n.id}"`);
    ids.add(n.id);
  });
  console.log(`${name}: ${rows.length} bản ghi`);
}
const extra = Object.keys(db).filter(k => !(k in checks));
if (extra.length) console.warn('! Collection không được app sử dụng:', extra.join(', '));
console.log(problems === 0 ? '✓ db.json hợp lệ' : `✗ ${problems} vấn đề`);
process.exit(problems === 0 ? 0 : 1);
