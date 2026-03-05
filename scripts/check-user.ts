import db from '../lib/db';
import { users } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

const user = await db.select().from(users).where(eq(users.id, 'user-zhang-1'));
console.log('user-zhang-1:', JSON.stringify(user, null, 2));

const byPhone = await db.select().from(users).where(eq(users.phone, '13800000100'));
console.log('by phone 13800000100:', JSON.stringify(byPhone, null, 2));
