import { Database } from "bun:sqlite";
import { resolve } from "path";

const TEST_DB_PATH = resolve(process.cwd(), "database/db.sqlite");

export interface TestSession {
  userId: string;
  sessionToken: string;
  cookie: string;
}

export async function createTestAdminSession(): Promise<TestSession | null> {
  try {
    const db = new Database(TEST_DB_PATH);
    
    const userId = `test_admin_${Date.now()}`;
    const sessionToken = `test_session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const now = Date.now();
    const expiresAt = now + 24 * 60 * 60 * 1000;
    
    db.run(`
      INSERT OR REPLACE INTO user (id, name, email, role, email_verified, created_at, updated_at)
      VALUES (?, 'Test Admin', 'test@example.com', 'admin', 1, ?, ?)
    `, [userId, now, now]);
    
    db.run(`
      INSERT INTO session (id, token, user_id, expires_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [sessionToken, sessionToken, userId, expiresAt, now, now]);
    
    db.close();
    
    return {
      userId,
      sessionToken,
      cookie: `better-auth.session_token=${sessionToken}`
    };
  } catch (error) {
    console.error("Failed to create test session:", error);
    return null;
  }
}

export async function cleanupTestAdminSession(userId: string): Promise<void> {
  try {
    const db = new Database(TEST_DB_PATH);
    db.run("DELETE FROM session WHERE user_id = ?", [userId]);
    db.run("DELETE FROM user WHERE id = ?", [userId]);
    db.close();
  } catch {
  }
}

export async function serverIsRunning(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.status < 500;
  } catch {
    return false;
  }
}
