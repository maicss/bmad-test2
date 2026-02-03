/**
 * Phone Credential Provider for Better-Auth
 *
 * Custom provider to enable phone number + password authentication
 * instead of the default email-based credential provider.
 */

import { getRawDb } from "@/database/db";

/**
 * Phone credential provider
 * Stores phone number as email in the format: +8613800000001@phone.local
 */

export async function verifyPhoneCredential(phone: string, password: string): Promise<{
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: string;
  image: string | null;
  createdAt: string;
  updatedAt: string;
} | null> {
  const rawDb = getRawDb();

  // Find user by phone
  const userRow = rawDb
    .query(`
      SELECT id, name, email, emailVerified, image, createdAt, updatedAt, role, phone, gender
      FROM user
      WHERE phone = ?
    `)
    .get(phone) as {
      id: string;
      name: string;
      email: string | null;
      emailVerified: number;
      image: string | null;
      createdAt: string;
      updatedAt: string;
      role: string;
      phone: string;
      gender: string | null;
    } | null;

  if (!userRow) {
    return null;
  }

  // Find account with phone provider
  const accountRow = rawDb
    .query(`
      SELECT id, accountId, providerId, userId, password
      FROM account
      WHERE userId = ? AND providerId = 'phone'
    `)
    .get(userRow.id) as {
      id: string;
      accountId: string;
      providerId: string;
      userId: string;
      password: string;
    } | null;

  if (!accountRow) {
    return null;
  }

  // Verify password using Bun's built-in password verifier
  const isValidPassword = await Bun.password.verify(password, accountRow.password);

  if (!isValidPassword) {
    return null;
  }

  return userRow;
}

/**
 * Create or update phone credential account
 */
export async function createPhoneCredential(userId: string, password: string): Promise<void> {
  const rawDb = getRawDb();

  // Hash password
  const hashedPassword = await Bun.password.hash(password);

  // Check if account already exists
  const existing = rawDb
    .query(`
      SELECT id FROM account WHERE userId = ? AND providerId = 'phone'
    `)
    .get(userId);

  if (existing) {
    // Update existing account
    rawDb.run(`
      UPDATE account
      SET password = ?, updatedAt = ?
      WHERE userId = ? AND providerId = 'phone'
    `, [
      hashedPassword,
      new Date().toISOString(),
      userId,
    ]);
  } else {
    // Create new account
    rawDb.run(`
      INSERT INTO account (id, accountId, providerId, userId, password, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      crypto.randomUUID(),
      userId, // Use userId as accountId for phone provider
      'phone',
      userId,
      hashedPassword,
      new Date().toISOString(),
      new Date().toISOString(),
    ]);
  }
}
