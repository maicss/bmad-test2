import db from '../index';
import { users } from '../schema';
import { eq, and } from 'drizzle-orm';
import type { User, NewUser } from '../schema';

/**
 * Query functions for users table
 *
 * Source: AGENTS.md - All queries must be in lib/db/queries/ directory, per-table files
 */

/**
 * Get user by phone (plain text - for login)
 *
 * Uses plain phone for querying
 * Returns user that can be used for password verification
 *
 * @param phone - Plain text phone number
 * @returns User or null
 */
export async function getUserByPhone(phone: string): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.phone, phone))
    .limit(1) as any;

  const user = Array.isArray(result) && result.length > 0 ? result[0] as User : null;
  return user;
}

/**
 * Get user by phone (plain text)
 *
 * Uses plain phone for querying
 * Needed for SMS sending and other operations that need plain phone
 *
 * Source: Story 1.1 Task 3
 *
 * @param phone - Plain text phone number
 * @returns User or null
 */
export async function getUserByPhonePlain(phone: string): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.phone, phone))
    .limit(1) as any;

  const user = Array.isArray(result) && result.length > 0 ? result[0] as User : null;
  return user;
}

/**
 * Get user by ID
 *
 * @param id - User ID
 * @returns User or null
 */
export async function getUserById(id: string): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1) as any;

  const user = Array.isArray(result) && result.length > 0 ? result[0] as User : null;
  return user;
}

/**
 * Create a new user
 *
 * @param phone - Phone number
 * @param role - User role (parent, child, admin)
 * @param password - Optional password (null for OTP-only users)
 * @param familyId - Optional family ID
 * @returns Created user
 */
export async function createUser(
  phone: string,
  role: 'parent' | 'child' | 'admin',
  password?: string,
  familyId?: string
): Promise<User> {
  // Use bcrypt for phone hashing (NFR9 & NFR10)
  const phoneHash = await Bun.password.hash(phone, 'bcrypt');

  // Use bcrypt for password hashing
  const passwordHash = password ? await Bun.password.hash(password, 'bcrypt') : null;

  const result = await db
    .insert(users)
    .values({
      id: Bun.randomUUIDv7(),
      phone,
      phone_hash: phoneHash,
      password_hash: passwordHash,
      role,
      family_id: familyId || null,
    })
    .returning() as any;

  // Handle returning result safely
  const user = Array.isArray(result) && result.length > 0 ? result[0] as User : null;
  if (!user) {
    throw new Error('Failed to create user');
  }
  return user;
}

/**
 * Update user
 *
 * @param id - User ID
 * @param data - Partial user data to update
 * @returns Updated user
 */
export async function updateUser(
  id: string,
  data: Partial<{
    phone: string;
    password: string | null;
    family_id: string | null;
  }>
): Promise<User> {
  // Get current user to preserve existing phone_hash
  const currentUser = await getUserById(id);
  if (!currentUser) {
    throw new Error('User not found');
  }

  // If updating phone, also update phone_hash using bcrypt (NFR9 & NFR10)
  let phoneHash: string | undefined;
  if (data.phone) {
    phoneHash = await Bun.password.hash(data.phone, 'bcrypt');
  }

  // If updating password, hash it using bcrypt
  let passwordHash: string | null = undefined;
  if (data.password !== undefined) {
    passwordHash = data.password ? await Bun.password.hash(data.password, 'bcrypt') : null;
  }

  const updateData: any = {
    phone: data.phone,
    phone_hash: phoneHash !== undefined ? phoneHash : currentUser.phone_hash,
    password_hash: passwordHash !== undefined ? passwordHash : currentUser.password_hash,
    family_id: data.family_id,
  };

  const result = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning() as any;

  // Handle returning result safely
  const user = Array.isArray(result) && result.length > 0 ? result[0] as User : null;
  if (!user) {
    throw new Error('Failed to update user');
  }
  return user;
}

/**
 * Get user by PIN code
 *
 * Queries all users and matches PIN hash
 * Returns only child users with matching PIN (role = 'child')
 * Uses Bun.password.verify() for PIN verification
 *
 * Source: Story 1.3 AC #2 - Verify child role and PIN match
 * Source: Story 1.3 Task 1 - Add getChildByPIN function
 *
 * @param pin - 4-digit PIN code
 * @returns Child user with matching PIN or null
 */
export async function getChildByPIN(pin: string): Promise<User | null> {
  // Get all users (PIN login is only for children)
  const result = await db
    .select()
    .from(users)
    .limit(100) as any;

  // Find user with matching PIN using Bun.password.verify()
  // Only return child users (role = 'child')
  const usersList = Array.isArray(result) ? result as User[] : [];
  for (const user of usersList) {
    if (user.password_hash && await Bun.password.verify(pin, user.password_hash)) {
      // Only return if user is a child
      if (user.role === 'child') {
        return user;
      }
    }
  }

  return null;
}

/**
 * Generate unique 4-digit PIN code
 *
 * Returns a random 4-digit PIN (1000-9999)
 *
 * @returns 4-digit PIN string
 */
export function generatePin(): string {
  return Math.floor(Math.random() * 9000 + 1000).toString().padStart(4, '0');
}

/**
 * Get user's family ID
 *
 * Story 2.5: Used for task plan permission checks
 *
 * @param userId - User ID
 * @returns Family ID or null if user has no family
 */
export async function getUserFamilyId(userId: string): Promise<string | null> {
  const user = await getUserById(userId);
  return user?.family_id || null;
}

/**
 * Get all children in a family
 *
 * Story 2.6: Used for manual task creation validation
 *
 * @param familyId - Family ID
 * @returns Array of child users in the family
 */
export async function getFamilyChildren(familyId: string): Promise<User[]> {
  const result = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.family_id, familyId),
        eq(users.role, 'child')
      )
    ) as any;

  return Array.isArray(result) ? result as User[] : [];
}

/**
 * Generate unique 4-digit PIN code for a family
 *
 * Ensures PIN is unique among all children in the family
 *
 * @param familyId - Family ID
 * @returns Unique 4-digit PIN string
 */
async function generateUniquePIN(familyId: string): Promise<string> {
  const maxAttempts = 100;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const pin = generatePin();

    // Check if any child in this family already has this PIN
    const familyChildren = await getFamilyChildren(familyId);
    const pinTaken = await Promise.all(
      familyChildren.map(async (child) => {
        if (!child.password_hash) return false;
        try {
          return await Bun.password.verify(pin, child.password_hash);
        } catch {
          return false;
        }
      })
    );

    if (!pinTaken.some(taken => taken)) {
      return pin; // Found unique PIN
    }

    attempts++;
  }

  throw new Error('Failed to generate unique PIN after maximum attempts');
}

/**
 * Create child account with auto-generated PIN
 *
 * Creates a child user account with:
 * - Unique 4-digit PIN (0000-9999)
 * - Role set to 'child'
 * - Linked to parent's family
 * - PIN encrypted using Bun.password.hash()
 *
 * @param name - Child name
 * @param age - Child age (6-12 years)
 * @param familyId - Family ID to link child to
 * @returns Created child user with generatedPin property
 * @throws Error if validation fails
 */
export async function createChildAccount(
  name: string,
  age: number,
  familyId: string
): Promise<User & { generatedPin: string }> {
  // Validate child name
  if (!name || name.trim().length === 0) {
    throw new Error('Child name is required');
  }

  if (name.trim().length > 50) {
    throw new Error('Child name cannot exceed 50 characters');
  }

  // Validate child age (6-12 years)
  if (isNaN(age) || age < 6 || age > 12) {
    throw new Error('Child age must be between 6 and 12 years');
  }

  // Generate unique PIN for this family
  const pin = await generateUniquePIN(familyId);

  // Hash PIN using Bun.password.hash()
  const pinHash = await Bun.password.hash(pin, 'bcrypt');

  // Create child user account
  // Note: Using phone field to store name temporarily (as per Story 1.5 implementation)
  const result = await db
    .insert(users)
    .values({
      id: Bun.randomUUIDv7(),
      phone: name.trim(), // Store name in phone field temporarily
      phone_hash: '', // Empty hash since we're using phone for name
      password_hash: pinHash, // Store hashed PIN in password_hash
      role: 'child',
      family_id: familyId,
    })
    .returning() as any;

  const child = Array.isArray(result) && result.length > 0 ? result[0] as User : null;
  if (!child) {
    throw new Error('Failed to create child account');
  }

  // Return child with generated PIN for display
  return {
    ...child,
    generatedPin: pin,
  };
}
