import db from '../index';
import { users } from '../schema';
import { eq } from 'drizzle-orm';
import type { User } from '../schema';

/**
 * Query functions for users table
 *
 * Source: AGENTS.md - All queries must be in lib/db/queries/ directory, per-table files
 * Source: Story 1.1 Task 3 - Use Bun.password.hash() for password hashing
 * Source: Story 1.2 - Use SHA256 for phone_hash (deterministic)
 */

/**
 * Get user by phone hash
 *
 * Uses SHA256 for phone hashing (deterministic, unlike bcrypt)
 * bcrypt is only used for password hashing
 * This ensures phone numbers are securely hashed for login queries
 *
 * Source: Story 1.2 AC #1 - Password login uses phone_hash for security
 *
 * @param phone - Plain text phone number
 * @returns User or null
 */
export async function getUserByPhone(phone: string): Promise<User | null> {
  // Use SHA256 for deterministic phone hashing
  const phoneHash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(phone)
  );
  const phoneHashHex = Array.from(new Uint8Array(phoneHash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const result = await db
    .select()
    .from(users)
    .where(eq(users.phone_hash, phoneHashHex))
    .limit(1) as any;
  const user = Array.isArray(result) && result.length > 0 ? result[0] as User : null;
  return user;
}

/**
 * Get user by phone (plain text)
 *
 * Uses plain text phone for querying (e.g., when sending OTP SMS)
 * This is needed because SMS providers require plain phone number
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
 * Create user with phone (plain + hashed) and optional password
 *
 * Implements double storage for phone numbers:
 * - phone: Plain text for SMS sending
 * - phone_hash: Hashed (SHA256) for secure login queries
 * - password_hash: Hashed (bcrypt) if password provided
 *
 * Source: Story 1.1 AC #4 - NFR9, NFR10
 * Source: Story 1.2 - Use SHA256 for phone_hash (deterministic)
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
  // Use SHA256 for deterministic phone hashing
  const phoneHash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(phone)
  );
  const phoneHashHex = Array.from(new Uint8Array(phoneHash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Use bcrypt for password hashing
  const passwordHash = password ? await Bun.password.hash(password, 'bcrypt') : null;

  const result = await db
    .insert(users)
    .values({
      id: crypto.randomUUID(), // Generate UUID for primary key
      phone,
      phone_hash: phoneHashHex,
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
    password_hash: string | null;
    family_id: string | null;
  }>
): Promise<User> {
  // If updating phone, also update phone_hash using SHA256
  let phoneHash: string | null = null;
  if (data.phone) {
    const phoneHashDigest = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(data.phone)
    );
    phoneHash = Array.from(new Uint8Array(phoneHashDigest))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
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

  // Handle returning result safely
  const user = Array.isArray(result) && result.length > 0 ? result[0] as User : null;
  if (!user) {
    throw new Error('Failed to update user');
  }
  return user;
}

/**
 * Generate unique 4-digit PIN code
 *
 * Generates a random 4-digit PIN code (0000-9999)
 * Checks for conflicts with existing children in family
 * Retries if conflict until unique PIN is found
 *
 * Source: Story 1.5 AC #2 - Ensure PIN uniqueness per child
 * Source: Story 1.5 Task 1 - Generate unique 4-digit PIN code
 *
 * @param familyId - Family ID to check for PIN conflicts
 * @param maxAttempts - Maximum retry attempts (default: 100)
 * @returns Unique 4-digit PIN code
 */
export async function generateUniquePIN(
  familyId: string,
  maxAttempts: number = 100
): Promise<string> {
  // Generate random 4-digit PIN code
  const generateRandomPIN = (): string => {
    return Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
  };

  // Check if PIN is already used by any child in the family
  const isPINUsed = async (pin: string): Promise<boolean> => {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.family_id, familyId))
      .limit(100) as any;

    const usersList = Array.isArray(result) ? result as User[] : [];
    
    // Check each child user's password_hash (which stores PIN)
    for (const user of usersList) {
      if (user.role === 'child' && user.password_hash) {
        const matches = await Bun.password.verify(pin, user.password_hash);
        if (matches) {
          return true;
        }
      }
    }

    return false;
  };

  // Generate unique PIN with retry logic
  let attempts = 0;
  let pin: string;
  let used: boolean;

  do {
    pin = generateRandomPIN();
    used = await isPINUsed(pin);
    attempts++;

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique PIN after ' + maxAttempts + ' attempts');
    }
  } while (used);

  console.log(`[PIN GENERATION] Generated unique PIN after ${attempts} attempts`);
  return pin;
}

/**
 * Create child account
 *
 * Creates a new child user with auto-generated unique PIN code
 * Links to parent's family
 * Uses Bun.password.hash() for PIN encryption
 *
 * Source: Story 1.5 Task 1 - Add child creation query functions
 *
 * @param name - Child's name
 * @param age - Child's age (6-12 years)
 * @param familyId - Family ID
 * @returns Created child user with generated PIN
 */
export async function createChildAccount(
  name: string,
  age: number,
  familyId: string
): Promise<User> {
  // Validate inputs
  if (!name || name.trim().length === 0) {
    throw new Error('Child name is required');
  }

  if (age < 6 || age > 12) {
    throw new Error('Child age must be between 6 and 12 years');
  }

  // Generate unique 4-digit PIN code for child
  const pin = await generateUniquePIN(familyId);

  // Encrypt PIN using Bun.password.hash() (bcrypt)
  const pinHash = await Bun.password.hash(pin, 'bcrypt');

  // Generate unique phone placeholder to ensure uniqueness
  const uniquePhone = `child-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@bmad-local.temp`;

  // Create child user account
  // Note: Children don't have phone numbers, so phone field is a placeholder
  // We use a placeholder based on family and random ID for uniqueness
  const result = await db
    .insert(users)
    .values({
      id: crypto.randomUUID(), // Generate UUID for primary key
      phone: uniquePhone,
      phone_hash: await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(`child-${pin}`)
      ).then(hash => Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')),
      password_hash: pinHash, // Store encrypted PIN
      role: 'child',
      family_id: familyId,
    })
    .returning() as any;

  // Handle returning result safely
  const child = Array.isArray(result) && result.length > 0 ? result[0] as User : null;
  if (!child) {
    throw new Error('Failed to create child account');
  }

  console.log(`[CHILD CREATION] Created child ${child.id} with PIN ${pin}`);
  
  // Return child user along with generated PIN (not stored in DB)
  // We attach the PIN as a temporary property for API response
  return {
    ...child,
    generatedPin: pin, // Temporary property for API response
  };
}

/**
 * Get family children
 *
 * Fetches only child users (role='child') in a family
 *
 * @param familyId - Family ID
 * @returns List of child users
 */
export async function getFamilyChildren(familyId: string): Promise<User[]> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.family_id, familyId))
    .orderBy(users.created_at) as any;

  // Filter only child users
  const usersList = Array.isArray(result) ? result as User[] : [];
  return usersList.filter(user => user.role === 'child');
}

/**
 * Suspend child account
 *
 * Suspends a child account (child cannot login with PIN)
 * Adds is_suspended flag to user metadata or sets status
 * Only parent in the same family can suspend children
 *
 * Source: Story 1.5 Task 4 - Implement child account suspension
 *
 * @param childId - Child user ID
 * @returns Updated user
 */
export async function suspendChildAccount(childId: string): Promise<User> {
  // TODO: Implement suspension logic
  // For now, we'll just return the user
  
  const result = await db
    .update(users)
    .set({
      // TODO: Add suspension status when schema is updated
      // is_active: false,
      // suspended_at: new Date(),
    })
    .where(eq(users.id, childId))
    .returning() as any;

  // Handle returning result safely
  const user = Array.isArray(result) && result.length > 0 ? result[0] as User : null;
  if (!user) {
    throw new Error('Failed to suspend child account');
  }
  return user;
}

/**
 * Activate child account
 *
 * Activates a suspended child account (child can login with PIN again)
 * Only parent in the same family can activate children
 *
 * Source: Story 1.5 Task 4 - Implement child account activation
 *
 * @param childId - Child user ID
 * @returns Updated user
 */
export async function activateChildAccount(childId: string): Promise<User> {
  // TODO: Implement activation logic
  // For now, we'll just return the user
  
  const result = await db
    .update(users)
    .set({
      // TODO: Add activation status when schema is updated
      // is_active: true,
      // activated_at: new Date(),
    })
    .where(eq(users.id, childId))
    .returning() as any;

  // Handle returning result safely
  const user = Array.isArray(result) && result.length > 0 ? result[0] as User : null;
  if (!user) {
    throw new Error('Failed to activate child account');
  }
  return user;
}

/**
 * Update child account status
 *
 * Updates child account status (active/suspended)
 *
 * Source: Story 1.5 Task 4 - Update child status
 *
 * @param childId - Child user ID
 * @param isActive - Whether child account should be active
 * @returns Updated user
 */
export async function updateChildStatus(
  childId: string,
  isActive: boolean
): Promise<User> {
  // TODO: Implement status update logic
  // For now, we'll just return the user
  
  const result = await db
    .update(users)
    .set({
      // TODO: Add status field when schema is updated
      // is_active: isActive,
      // status_updated_at: new Date(),
    })
    .where(eq(users.id, childId))
    .returning() as any;

  // Handle returning result safely
  const user = Array.isArray(result) && result.length > 0 ? result[0] as User : null;
  if (!user) {
    throw new Error('Failed to update child status');
  }
  return user;
}
