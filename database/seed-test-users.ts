/**
 * Seed Test Users
 *
 * Initializes test users as defined in specs/auth/index.md
 *
 * Usage: bun run database/seed-test-users.ts
 */

import db from '../lib/db';
import { users, families } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Test user data from specs/auth/index.md
 *
 * | Role       | Last Name | First Name | Gender | Phone       | PIN  | Password | Family ID  | Description          |
 * | :--------- | :-------- | :--------- | :----- | :---------- | :--- | :------- | :--------- | :------------------- |
 * | **admin**  | -         | admin      | Male   | 13800000001 | -    | 1111     | -          | System Administrator |
 * | **parent** | Zhang     | 1          | Male   | 13800000100 | -    | 1111     | family-001 | Family 1 (Primary)   |
 * | **parent** | Zhang     | 2          | Male   | 12800000200 | -    | 1111     | family-001 | Family 1 (Secondary) |
 * | **child**  | Zhang     | 3          | Male   | -           | 1111 | -        | family-001 | Family 1 (Child)     |
 * | **parent** | Li        | 1          | Male   | 13800000300 | -    | 1111     | family-002 | Family 2 (Primary)   |
 * | **parent** | Li        | 2          | Male   | 13800000400 | -    | 1111     | family-002 | Family 2 (Secondary) |
 */

async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, 'bcrypt');
}

async function hashPhone(phone: string): Promise<string> {
  return await Bun.password.hash(phone, 'bcrypt');
}

async function seedTestUsers() {
  console.log('🌱 Seeding test users...\n');

  // First, create families
  console.log('Creating families...');

  // Check if families already exist
  const existingFamily001 = await db.select().from(families).where(eq(families.id, 'family-001'));
  const existingFamily002 = await db.select().from(families).where(eq(families.id, 'family-002'));

  // Create family-001 with Zhang 1 as primary parent
  if (existingFamily001.length === 0) {
    // Need to create user first to get ID for family
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

    await db.insert(families).values({
      id: 'family-001',
      primary_parent_id: zhang1Id,
    });
    console.log('✅ Created family-001');
  } else {
    console.log('ℹ️  family-001 already exists');
  }

  // Create family-002 with Li 1 as primary parent
  if (existingFamily002.length === 0) {
    const li1PhoneHash = await hashPhone('13800000300');
    const li1PasswordHash = await hashPassword('1111');
    const li1Id = 'user-li-1';

    await db.insert(users).values({
      id: li1Id,
      phone: '13800000300',
      phone_hash: li1PhoneHash,
      password_hash: li1PasswordHash,
      role: 'parent',
      family_id: 'family-002',
      name: 'Li 1 (Primary Parent)',
    });

    await db.insert(families).values({
      id: 'family-002',
      primary_parent_id: li1Id,
    });
    console.log('✅ Created family-002');
  } else {
    console.log('ℹ️  family-002 already exists');
  }

  console.log('\nCreating users...\n');

  // Admin user
  const existingAdmin = await db.select().from(users).where(eq(users.phone, '13800000001'));
  if (existingAdmin.length === 0) {
    const adminPhoneHash = await hashPhone('13800000001');
    const adminPasswordHash = await hashPassword('1111');

    await db.insert(users).values({
      id: 'user-admin',
      phone: '13800000001',
      phone_hash: adminPhoneHash,
      password_hash: adminPasswordHash,
      role: 'admin',
      family_id: null,
      name: 'System Administrator',
    });
    console.log('✅ Created admin user (13800000001 / 1111)');
  } else {
    console.log('ℹ️  Admin user already exists');
  }

  // Zhang 2 (Family 1 - Secondary Parent)
  const existingZhang2 = await db.select().from(users).where(eq(users.phone, '12800000200'));
  if (existingZhang2.length === 0) {
    const zhang2PhoneHash = await hashPhone('12800000200');
    const zhang2PasswordHash = await hashPassword('1111');

    await db.insert(users).values({
      id: 'user-zhang-2',
      phone: '12800000200',
      phone_hash: zhang2PhoneHash,
      password_hash: zhang2PasswordHash,
      role: 'parent',
      family_id: 'family-001',
      name: 'Zhang 2 (Secondary Parent)',
    });
    console.log('✅ Created Zhang 2 (12800000200 / 1111) - Family 1');
  } else {
    console.log('ℹ️  Zhang 2 already exists');
  }

  // Zhang 3 (Family 1 - Child)
  const existingZhang3 = await db.select().from(users).where(eq(users.name, 'Zhang 3 (Child)'));
  if (existingZhang3.length === 0) {
    const childPasswordHash = await hashPassword('1111'); // PIN as password

    await db.insert(users).values({
      id: 'user-zhang-3',
      phone: '00000000000', // Dummy phone for child
      phone_hash: await hashPhone('00000000000'),
      password_hash: childPasswordHash,
      role: 'child',
      family_id: 'family-001',
      name: 'Zhang 3 (Child)',
    });
    console.log('✅ Created Zhang 3 (PIN: 1111) - Family 1 Child');
  } else {
    console.log('ℹ️  Zhang 3 already exists');
  }

  // Li 2 (Family 2 - Secondary Parent)
  const existingLi2 = await db.select().from(users).where(eq(users.phone, '13800000400'));
  if (existingLi2.length === 0) {
    const li2PhoneHash = await hashPhone('13800000400');
    const li2PasswordHash = await hashPassword('1111');

    await db.insert(users).values({
      id: 'user-li-2',
      phone: '13800000400',
      phone_hash: li2PhoneHash,
      password_hash: li2PasswordHash,
      role: 'parent',
      family_id: 'family-002',
      name: 'Li 2 (Secondary Parent)',
    });
    console.log('✅ Created Li 2 (13800000400 / 1111) - Family 2');
  } else {
    console.log('ℹ️  Li 2 already exists');
  }

  console.log('\n✨ Test users seeded successfully!\n');
  console.log('Test Accounts:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Admin:     13800000001 / 1111');
  console.log('  Zhang 1:   13800000100 / 1111  (Family 1 - Primary)');
  console.log('  Zhang 2:   12800000200 / 1111  (Family 1 - Secondary)');
  console.log('  Zhang 3:   PIN: 1111           (Family 1 - Child)');
  console.log('  Li 1:      13800000300 / 1111  (Family 2 - Primary)');
  console.log('  Li 2:      13800000400 / 1111  (Family 2 - Secondary)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// Run seed
seedTestUsers().catch(console.error);
