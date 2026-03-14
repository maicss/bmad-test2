import db from './lib/db';
import { users } from './lib/db/schema';
import { eq } from 'drizzle-orm';

const result = await db
  .select()
  .from(users)
  .where(eq(users.phone, '13800000100'))
  .limit(1);

if (result.length > 0) {
  const user = result[0];
  console.log('User found:', {
    id: user.id,
    phone: user.phone,
    role: user.role,
    has_password: !!user.password_hash
  });

  if (user.password_hash) {
    const valid = await Bun.password.verify('1111', user.password_hash);
    console.log('Password valid:', valid);
  }
} else {
  console.log('User not found');
}
process.exit(0);
