import db from '../lib/db';
import { users } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, 'bcrypt');
}

async function hashPhone(phone: string): Promise<string> {
  return await Bun.password.hash(phone, 'bcrypt');
}

// Check if user exists
const existing = await db.select().from(users).where(eq(users.phone, '13800000100'));

if (existing.length > 0) {
  console.log('User 13800000100 already exists');
} else {
  const zhang1PhoneHash = await hashPhone('13800000100');
  const zhang1PasswordHash = await hashPassword('1111');
  const zhang1Id = 'user-zhang-1';

  await db.insert(users).values({
    id: zhang1Id,
    phone: '13800000100',
    phone_hash: zhang1PhoneHash,
    password_hash: zhang1PasswordHash,
    role: 'parent',
    family_id: 'family-001',
    name: 'Zhang 1 (Primary Parent)',
  });
  
  console.log('Created user 13800000100 / 1111');
}
