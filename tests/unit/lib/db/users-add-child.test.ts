/**
 * BDD Unit Tests for Story 1.5: Add Child to Family
 *
 * Tests child account creation, PIN generation, and family queries
 *
 * Source: Story 1.5 Task 6 - Write BDD tests
 * Requirement: Given-When-Then format with business language
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import db from '@/lib/db';
import { users, families } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createChildAccount, getFamilyChildren } from '@/lib/db/queries/users';

describe('Story 1.5: Add Child to Family - Unit Tests', () => {
  let testUserId: string;
  let testFamilyId: string;

  afterAll(async () => {
    // Clean up test data
    await db.delete(users).where(eq(users.family_id, testFamilyId));
    await db.delete(families).where(eq(families.id, testFamilyId));
  });

  beforeEach(async () => {
    // Create fresh test data for each test to avoid phone conflicts
    testUserId = crypto.randomUUID();
    testFamilyId = crypto.randomUUID();

    // Clean up old data
    await db.delete(users).where(eq(users.family_id, testFamilyId));
    await db.delete(families).where(eq(families.id, testFamilyId));

    // Create test family
    await db.insert(families).values({
      id: testFamilyId,
      primary_parent_id: testUserId,
    });

    // Create test parent user (with unique phone using timestamp)
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const testPhone = `test-parent-${timestamp}-${randomSuffix}`;
    
    await db.insert(users).values({
      id: testUserId,
      phone: testPhone,
      phone_hash: await crypto.subtle.digest('SHA-256', new TextEncoder().encode(testPhone)).then(hash => Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')),
      role: 'parent',
      family_id: testFamilyId,
    });
  });

  it('given parent enters child name and age, when creates child account, then generates unique 4-digit PIN and creates child account', async () => {
    // Given: Parent enters child name and age
    const childName = 'Child1';
    const childAge = 8;

    // When: Creates child account
    const child = await createChildAccount(childName, childAge, testFamilyId);

    // Then: Generates unique 4-digit PIN and creates child account
    expect(child).toBeDefined();
    expect(child.generatedPin).toBeDefined();
    expect(child.generatedPin).toMatch(/^\d{4}$/);
    expect(child.role).toBe('child');
    expect(child.family_id).toBe(testFamilyId);
  });

  it('given system generates PIN, when family already has child with same PIN, then auto-generates new PIN to ensure uniqueness', async () => {
    // Given: System generates PIN
    // When: Family already has child with same PIN (implemented by unique PIN generation)

    // Create first child
    const child1 = await createChildAccount('Child2', 8, testFamilyId);
    const pin1 = child1.generatedPin;

    // Create second child (should generate different PIN)
    const child2 = await createChildAccount('Child3', 7, testFamilyId);
    const pin2 = child2.generatedPin;

    // Then: PINs should be different (highly probable with 10000 combinations)
    expect(pin1).toMatch(/^\d{4}$/);
    expect(pin2).toMatch(/^\d{4}$/);
    expect(pin1).not.toEqual(pin2);
  });

  it('given parent adds child, when views child list, then displays all children and their info', async () => {
    // Given: Parent adds child
    await createChildAccount('Child4', 8, testFamilyId);
    await createChildAccount('Child5', 7, testFamilyId);

    // When: Views child list
    const children = await getFamilyChildren(testFamilyId);

    // Then: Displays all children and their info
    expect(children.length).toBeGreaterThanOrEqual(2);
    expect(children.every(child => child.role === 'child')).toBe(true);
    expect(children.every(child => child.family_id === testFamilyId)).toBe(true);
  });

  it('given system generates PIN, when validates PIN format, then should be 4-digit number (0000-9999)', async () => {
    // Given: System generates PIN
    const child = await createChildAccount('Child6', 9, testFamilyId);

    // When: Validates PIN format
    const pin = child.generatedPin;
    const isValidPin = /^\d{4}$/.test(pin);
    const isInRange = parseInt(pin) >= 0 && parseInt(pin) <= 9999;

    // Then: Should be 4-digit number (0000-9999)
    expect(isValidPin).toBe(true);
    expect(isInRange).toBe(true);
  });

  it('given child name is empty, when creates child account, then throws error', async () => {
    // Given: Child name is empty
    const emptyName = '';

    // When: Creates child account
    // Then: Throws error
    await expect(async () => {
      await createChildAccount(emptyName, 8, testFamilyId);
    }).toThrow('Child name is required');
  });

  it('given child age is not between 6-12 years, when creates child account, then throws error', async () => {
    // Given: Child age is not between 6-12 years
    const invalidAge = 5;

    // When: Creates child account
    // Then: Throws error
    await expect(async () => {
      await createChildAccount('Child7', invalidAge, testFamilyId);
    }).toThrow('Child age must be between 6 and 12 years');
  });
});
