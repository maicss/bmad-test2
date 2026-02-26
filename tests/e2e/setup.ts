/**
 * E2E Test Setup
 *
 * Creates test data for E2E tests
 * This file should be run before E2E tests
 */

import db from '@/lib/db';
import { users, families } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Create test child user with PIN 1111
 */
async function createTestChildUser() {
  const childId = 'test-child-9999';
  const childPhone = '19999999999'; // Test phone for child
  const childPin = '9999';

  // Hash the phone number using SHA256
  const phoneHashDigest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(childPhone)
  );
  const phoneHash = Array.from(new Uint8Array(phoneHashDigest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Hash the PIN code
  const pinHash = await Bun.password.hash(childPin);

  // Check if child user already exists
  const existingChild = await db.select().from(users).where(eq(users.id, childId)).get();
  if (existingChild) {
    console.log('Test child user already exists, updating...');
    await db.update(users)
      .set({ phone_hash: phoneHash, password_hash: pinHash })
      .where(eq(users.id, childId));
  } else {
    // Create a test family
    const familyId = 'test-family-1111';
    const existingFamily = await db.select().from(families).where(eq(families.id, familyId)).get();
    if (!existingFamily) {
      await db.insert(families).values({
        id: familyId,
        primary_parent_id: 'test-parent-1111',
      });
    }

    // Create test child user
    await db.insert(users).values({
      id: childId,
      phone: childPhone,
      phone_hash: phoneHash,
      password_hash: pinHash,
      role: 'child',
      family_id: familyId,
    });
    console.log('Test child user created successfully');
  }

  console.log('Test child user setup complete');
  console.log('  ID:', childId);
  console.log('  Phone:', childPhone);
  console.log('  PIN:', childPin);
  console.log('  Family ID: test-family-1111');
}

/**
 * Create test parent user
 */
async function createTestParentUser() {
  const parentId = 'test-parent-1111';
  const parentPhone = '13800000001'; // Test phone for parent
  const parentPassword = 'Test1234';

  // Hash the phone number using SHA256
  const phoneHashDigest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(parentPhone)
  );
  const phoneHash = Array.from(new Uint8Array(phoneHashDigest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Hash the password
  const passwordHash = await Bun.password.hash(parentPassword);

  // Check if parent user already exists
  const existingParent = await db.select().from(users).where(eq(users.id, parentId)).get();
  if (existingParent) {
    console.log('Test parent user already exists, updating...');
    await db.update(users)
      .set({ phone_hash: phoneHash, password_hash: passwordHash })
      .where(eq(users.id, parentId));
  } else {
    // Create a test family
    const familyId = 'test-family-1111';
    const existingFamily = await db.select().from(families).where(eq(families.id, familyId)).get();
    if (!existingFamily) {
      await db.insert(families).values({
        id: familyId,
        primary_parent_id: parentId,
      });
    }

    // Create test parent user
    await db.insert(users).values({
      id: parentId,
      phone: parentPhone,
      phone_hash: phoneHash,
      password_hash: passwordHash,
      role: 'parent',
      family_id: familyId,
    });
    console.log('Test parent user created successfully');
  }

  console.log('Test parent user setup complete');
  console.log('  ID:', parentId);
  console.log('  Phone:', parentPhone);
  console.log('  Password:', parentPassword);
  console.log('  Family ID: test-family-1111');
}

/**
 * Run setup
 */
async function runSetup() {
  try {
    console.log('Setting up E2E test data...');

    await createTestParentUser();
    await createTestChildUser();

    console.log('\n✅ E2E test data setup complete!');
  } catch (error) {
    console.error('❌ E2E test data setup failed:', error);
    process.exit(1);
  }
}

// Run setup if executed directly
if (import.meta.main) {
  runSetup();
}

// Export for use in tests
export { createTestChildUser, createTestParentUser };
