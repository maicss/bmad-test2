import db from './lib/db';
import { users } from './lib/db/schema';

const result = await db.select({
  id: users.id,
  phone: users.phone,
  role: users.role,
  family_id: users.family_id,
  password_hash: users.password_hash
})
.from(users)
.where((users) => users.phone === '+8613800000100')
.limit(1);

console.log('User found:', result.length > 0 ? 'YES' : 'NO');
if (result.length > 0) {
  console.log('User data:', JSON.stringify({
    id: result[0].id,
    phone: result[0].phone,
    role: result[0].role,
    family_id: result[0].family_id,
    has_password: !!result[0].password_hash
  }, null, 2));
}
process.exit(0);
