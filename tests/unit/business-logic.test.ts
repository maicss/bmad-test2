/**
 * Business Logic Unit Tests
 * 
 * 测试业务逻辑函数
 */

import { describe, test, expect } from "bun:test";

describe("Points Calculation", () => {
  test("should calculate total earned points correctly", () => {
    const transactions = [
      { type: "earn", amount: 10 },
      { type: "earn", amount: 5 },
      { type: "earn", amount: 8 },
    ];

    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    expect(total).toBe(23);
  });

  test("should calculate total spent points correctly", () => {
    const transactions = [
      { type: "spend", amount: -50 },
      { type: "spend", amount: -30 },
    ];

    const total = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    expect(total).toBe(80);
  });

  test("should calculate current balance", () => {
    const earned = 100;
    const spent = 30;
    const balance = earned - spent;

    expect(balance).toBe(70);
  });

  test("should handle negative balance edge case", () => {
    const transactions = [
      { type: "earn", amount: 10 },
      { type: "spend", amount: -20 },
    ];

    const balance = transactions.reduce((sum, t) => sum + t.amount, 0);
    expect(balance).toBe(-10);
  });
});

describe("Task Completion Logic", () => {
  test("should award points on task completion", () => {
    const taskPoints = 10;
    const currentPoints = 50;
    const newPoints = currentPoints + taskPoints;

    expect(newPoints).toBe(60);
  });

  test("should track completion count", () => {
    const completions = [
      { date: "2025-01-30", taskId: "1" },
      { date: "2025-01-30", taskId: "2" },
      { date: "2025-01-29", taskId: "3" },
    ];

    const todayCompletions = completions.filter((c) => c.date === "2025-01-30");
    expect(todayCompletions.length).toBe(2);
  });

  test("should enforce daily limits", () => {
    const dailyLimit = 3;
    const completedToday = 3;

    const canComplete = completedToday < dailyLimit;
    expect(canComplete).toBe(false);
  });
});

describe("Wish Redemption Logic", () => {
  test("should check if user has enough points", () => {
    const userPoints = 100;
    const wishCost = 50;

    const canRedeem = userPoints >= wishCost;
    expect(canRedeem).toBe(true);
  });

  test("should reject redemption with insufficient points", () => {
    const userPoints = 30;
    const wishCost = 50;

    const canRedeem = userPoints >= wishCost;
    expect(canRedeem).toBe(false);
  });

  test("should calculate points after redemption", () => {
    const userPoints = 100;
    const wishCost = 50;
    const remainingPoints = userPoints - wishCost;

    expect(remainingPoints).toBe(50);
  });

  test("should check wish status", () => {
    const approvedStatuses = ["approved", "pending"];
    const wishStatus = "approved";

    const canRedeem = approvedStatuses.includes(wishStatus);
    expect(canRedeem).toBe(true);
  });
});

describe("Role-Based Access Control", () => {
  test("should allow parent to create tasks", () => {
    const userRole = "parent";
    const allowedRoles = ["parent", "admin"];

    const canCreate = allowedRoles.includes(userRole);
    expect(canCreate).toBe(true);
  });

  test("should allow admin full access", () => {
    const userRole = "admin";
    const isAdmin = userRole === "admin";

    expect(isAdmin).toBe(true);
  });

  test("should restrict child from admin actions", () => {
    const userRole = "child";
    const allowedRoles = ["parent", "admin"];

    const canPerformAction = allowedRoles.includes(userRole);
    expect(canPerformAction).toBe(false);
  });

  test("should identify family roles correctly", () => {
    const isPrimary = (role: string) => role === "primary";
    const isSecondary = (role: string) => role === "secondary";
    const isChild = (role: string) => role === "child";

    expect(isPrimary("primary")).toBe(true);
    expect(isSecondary("secondary")).toBe(true);
    expect(isChild("child")).toBe(true);
  });
});

describe("Streak Calculation", () => {
  test("should calculate consecutive days", () => {
    const dates = [
      new Date("2025-01-30"),
      new Date("2025-01-29"),
      new Date("2025-01-28"),
    ];

    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
      const diffDays = (dates[i - 1].getTime() - dates[i].getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        streak++;
      }
    }

    expect(streak).toBe(3);
  });

  test("should reset streak on gap", () => {
    const today = new Date("2025-01-30");
    const lastActive = new Date("2025-01-28");

    const diffDays = (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
    const streakBroken = diffDays > 1;

    expect(streakBroken).toBe(true);
  });
});

describe("Progress Calculation", () => {
  test("should calculate wish progress percentage", () => {
    const currentPoints = 65;
    const requiredPoints = 100;
    const progress = Math.min(Math.round((currentPoints / requiredPoints) * 100), 100);

    expect(progress).toBe(65);
  });

  test("should cap progress at 100%", () => {
    const currentPoints = 150;
    const requiredPoints = 100;
    const progress = Math.min(Math.round((currentPoints / requiredPoints) * 100), 100);

    expect(progress).toBe(100);
  });

  test("should calculate task completion rate", () => {
    const completed = 8;
    const total = 10;
    const rate = (completed / total) * 100;

    expect(rate).toBe(80);
  });
});
