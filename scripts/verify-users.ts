import db from '../lib/db';
import { users, families } from '../lib/db/schema';

console.log('=== Families ===');
const allFamilies = await db.select().from(families);
for (const f of allFamilies) {
  console.log(`  ${f.id} | primary: ${f.primary_parent_id}`);
}

console.log('\n=== Users ===');
const allUsers = await db.select().from(users);
for (const u of allUsers) {
  const phone = u.phone || '-';
  const name = u.name || '-';
  const family = u.family_id || '-';
  console.log(`  ${u.role.padEnd(10)} | ${phone.padEnd(15)} | ${name.padEnd(30)} | family: ${family}`);
}
