import { Database } from "bun:sqlite";
import { resolve } from "path";

const DB_PATH = resolve(process.cwd(), "database/db.sqlite");

async function seedTestData() {
  const db = new Database(DB_PATH);
  
  console.log("Seeding test data...");
  
  const now = Date.now();
  const testData = {
    admin: {
      id: "admin-001",
      name: "admin",
      email: "admin@example.com",
      role: "admin",
      phone: "13800000001",
      password: "$2b$10$hashed_password_here",
    },
    parent1: {
      id: "parent-001",
      name: "Zhang 1",
      email: "parent1@example.com",
      role: "parent",
      phone: "13800000100",
      password: "1111",
      familyId: "family-001",
    },
    parent2: {
      id: "parent-002",
      name: "Zhang 2",
      email: "parent2@example.com",
      role: "parent",
      phone: "12800000200",
      password: "1111",
      familyId: "family-001",
    },
    child: {
      id: "6321f2b1-bbfc-46c2-b1da-d00831f93523",
      name: "Zhang 3",
      role: "child",
      pin: "1111",
      familyId: "family-001",
    },
  };

  try {
    db.run("DELETE FROM family_member WHERE family_id = ?", ["family-001"]);
    db.run("DELETE FROM family WHERE id = ?", ["family-001"]);
    db.run("DELETE FROM user WHERE id IN (?, ?, ?, ?)", [
      testData.admin.id,
      testData.parent1.id,
      testData.parent2.id,
      testData.child.id,
    ]);

    db.run(`
      INSERT OR REPLACE INTO user (id, name, email, role, phone, email_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    `, [testData.admin.id, testData.admin.name, testData.admin.email, testData.admin.role, testData.admin.phone, now, now]);

    db.run(`
      INSERT OR REPLACE INTO user (id, name, email, role, phone, email_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    `, [testData.parent1.id, testData.parent1.name, testData.parent1.email, testData.parent1.role, testData.parent1.phone, now, now]);

    db.run(`
      INSERT OR REPLACE INTO user (id, name, email, role, phone, email_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    `, [testData.parent2.id, testData.parent2.name, testData.parent2.email, testData.parent2.role, testData.parent2.phone, now, now]);

    // Hash the child's PIN using Bun.password
    const pinHash = await Bun.password.hash(testData.child.pin, {
      algorithm: "bcrypt",
      cost: 10,
    });

    db.run(`
      INSERT OR REPLACE INTO user (id, name, role, pin_hash, email_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, 1, ?, ?)
    `, [testData.child.id, testData.child.name, testData.child.role, pinHash, now, now]);

    db.run(`
      INSERT INTO family (id, name, max_parents, max_children, validity_months, registration_type, status, created_at, updated_at)
      VALUES (?, 'Zhang Family', 2, 2, 12, 'self', 'approved', ?, ?)
    `, ["family-001", now, now]);

    db.run(`
      INSERT INTO family_member (id, family_id, user_id, role, current_points, created_at, updated_at)
      VALUES (?, ?, ?, 'primary', 0, ?, ?)
    `, ["member-parent-001", "family-001", testData.parent1.id, now, now]);

    db.run(`
      INSERT INTO family_member (id, family_id, user_id, role, current_points, created_at, updated_at)
      VALUES (?, ?, ?, 'secondary', 0, ?, ?)
    `, ["member-parent-002", "family-001", testData.parent2.id, now, now]);

    db.run(`
      INSERT INTO family_member (id, family_id, user_id, role, current_points, created_at, updated_at)
      VALUES (?, ?, ?, 'child', 100, ?, ?)
    `, ["member-child-001", "family-001", testData.child.id, now, now]);

    console.log("Test data seeded successfully!");
    console.log("- Admin: 13800000001 / 1111");
    console.log("- Parent 1: 13800000100 / 1111");
    console.log("- Parent 2: 12800000200 / 1111");
    console.log("- Child ID: 6321f2b1-bbfc-46c2-b1da-d00831f93523 / PIN: 1111");
    
  } catch (error) {
    console.error("Error seeding test data:", error);
  } finally {
    db.close();
  }
}

seedTestData();
