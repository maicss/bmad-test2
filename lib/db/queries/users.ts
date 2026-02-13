import db from '../index';
import { users } from '../schema';
import { eq } from 'drizzle-orm';
import type { User, NewUser } from '../schema';

/**
 * Query functions for users table
 *
 * Source: AGENTS.md - All queries must be in lib/db/queries/ directory, per-table files
 * Source: Story 1.1 Task 3 - Use Bun.password.hash() for both phone and password hashing
 */

/**
 * Get user by phone hash
 *
 * Hashes the input phone before querying the database
 * This ensures phone numbers are not stored in plain text for security
 *
 * Source: Story 1.1 AC #4 - NFR9
 *
 * @param phone - Plain text phone number
 * @returns User or null
 */
export async function getUserByPhone(phone: string): Promise<User | null> {
  const phoneHash = await Bun.password.hash(phone, 'bcrypt');
  const result = await db
    .select()
    .from(users)
    .where(eq(users.phone_hash, phoneHash))
    .limit(1) as any;
  const user = Array.isArray(result) && result.length > 0 ? result[0] as User : null;
  return user;
}

/**
 * Get user by phone (plain text)
 *
 * Uses plain text phone for querying (e.g., when sending OTP SMS)
 * This is needed because SMS providers require the plain phone number
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
 * Create user with phone (plain + hashed) and optional password
 *
 * Implements double storage for phone numbers:
 * - phone: Plain text for SMS sending
 * - phone_hash: Hashed for secure login queries
 * - password_hash: Hashed if password provided
 *
 * Source: Story 1.1 AC #4 - NFR9, NFR10
 * Source: Story 1.1 Task 3 - MUST use Bun.password.hash()
 *
 * @param phone - Plain text phone number
 * @param role - User role (parent/child/admin)
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
  const phoneHash = await Bun.password.hash(phone, 'bcrypt');
  const passwordHash = password ? await Bun.password.hash(password, 'bcrypt') : null;

  const result = await db
    .insert(users)
    .values({
      id: crypto.randomUUID(), // Generate UUID for primary key
      phone,
      phone_hash: phoneHash,
      password_hash: passwordHash,
      role,
      family_id: familyId || null,
    })
    .returning() as any;

  // Handle the returning result safely
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
    password_hash: string | null;
    family_id: string | null;
  }>
): Promise<User> {
  // If updating phone, also update phone_hash
  let phoneHash: string | null = null;
  if (data.phone) {
    phoneHash = await Bun.password.hash(data.phone, 'bcrypt');
  }

  const updateData = {
    ...data,
    phone_hash: phoneHash,
  };

  const result = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning() as any;

  // Handle the returning result safely
  const user = Array.isArray(result) && result.length > 0 ? result[0] as User : null;
  if (!user) {
    throw new Error('Failed to update user');
  }
  return user;
}
