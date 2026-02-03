/**
 * Password Hasher using Bun's built-in password utilities
 */

export class BunPasswordHasher {
  /**
   * Hash a password using Bun's password utility
   */
  async hash(password: string): Promise<string> {
    return await Bun.password.hash(password);
  }

  /**
   * Verify a password against a hash
   */
  async verify(password: string, hash: string): Promise<boolean> {
    try {
      return await Bun.password.verify(password, hash);
    } catch {
      return false;
    }
  }
}

export const passwordHasher = new BunPasswordHasher();
