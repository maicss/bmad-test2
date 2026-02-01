import { describe, test, expect } from "bun:test";
import {
  deduplicateDates,
  parseComboStairConfig,
  calculateLinearPoints,
  calculateStairPoints,
  validateDateFormat,
  sortDates,
  cn,
} from "@/lib/utils";

describe("cn utility", () => {
  test("should merge tailwind classes", () => {
    const result = cn("px-4 py-2", "bg-blue-500");
    expect(result).toBe("px-4 py-2 bg-blue-500");
  });

  test("should handle conditional classes", () => {
    const isActive = true;
    const result = cn("base-class", isActive && "active-class");
    expect(result).toBe("base-class active-class");
  });

  test("should merge conflicting classes", () => {
    const result = cn("px-2", "px-4");
    expect(result).toBe("px-4");
  });
});

describe("deduplicateDates utility", () => {
  test("should remove duplicate dates", () => {
    const input = "2026-01-01,2026-01-02,2026-01-01";
    const result = deduplicateDates(input);
    expect(result).toBe("2026-01-01,2026-01-02");
  });

  test("should handle empty string", () => {
    const result = deduplicateDates("");
    expect(result).toBe("");
  });

  test("should handle single date", () => {
    const result = deduplicateDates("2026-01-01");
    expect(result).toBe("2026-01-01");
  });

  test("should trim whitespace", () => {
    const input = "2026-01-01 , 2026-01-02 , 2026-01-01";
    const result = deduplicateDates(input);
    expect(result).toBe("2026-01-01,2026-01-02");
  });

  test("should handle no duplicates", () => {
    const input = "2026-01-01,2026-01-02,2026-01-03";
    const result = deduplicateDates(input);
    expect(result).toBe("2026-01-01,2026-01-02,2026-01-03");
  });
});

describe("parseComboStairConfig utility", () => {
  test("should parse valid stair config", () => {
    const config = JSON.stringify({ steps: [1, 2, 3, 5, 8] });
    const result = parseComboStairConfig(config);
    expect(result).toEqual([1, 2, 3, 5, 8]);
  });

  test("should return null for invalid JSON", () => {
    const result = parseComboStairConfig("invalid json");
    expect(result).toBeNull();
  });

  test("should return null for missing steps", () => {
    const config = JSON.stringify({ other: "value" });
    const result = parseComboStairConfig(config);
    expect(result).toBeNull();
  });

  test("should return null for non-array steps", () => {
    const config = JSON.stringify({ steps: "not an array" });
    const result = parseComboStairConfig(config);
    expect(result).toBeNull();
  });

  test("should handle empty steps array", () => {
    const config = JSON.stringify({ steps: [] });
    const result = parseComboStairConfig(config);
    expect(result).toEqual([]);
  });
});

describe("calculateLinearPoints utility", () => {
  test("should calculate base points with no streak", () => {
    const result = calculateLinearPoints(10, 0);
    expect(result).toBe(10);
  });

  test("should calculate points with streak", () => {
    const result = calculateLinearPoints(10, 2);
    expect(result).toBe(30);
  });

  test("should calculate points with multiplier", () => {
    const result = calculateLinearPoints(10, 2, 0.5);
    expect(result).toBe(20);
  });

  test("should handle large streaks", () => {
    const result = calculateLinearPoints(5, 10);
    expect(result).toBe(55);
  });
});

describe("calculateStairPoints utility", () => {
  test("should calculate base points with no streak", () => {
    const result = calculateStairPoints(10, 0, [1, 2, 3]);
    expect(result).toBe(10);
  });

  test("should calculate points with streak 1", () => {
    const result = calculateStairPoints(10, 1, [1, 2, 3]);
    expect(result).toBe(10);
  });

  test("should calculate points with streak 2", () => {
    const result = calculateStairPoints(10, 2, [1, 2, 3]);
    expect(result).toBe(30);
  });

  test("should calculate points with streak 3", () => {
    const result = calculateStairPoints(10, 3, [1, 2, 3]);
    expect(result).toBe(60);
  });

  test("should stop at end of steps array", () => {
    const result = calculateStairPoints(10, 10, [1, 2]);
    expect(result).toBe(30);
  });
});

describe("validateDateFormat utility", () => {
  test("should validate correct date format", () => {
    const result = validateDateFormat("2026-01-15");
    expect(result).toBe(true);
  });

  test("should reject invalid format", () => {
    const result = validateDateFormat("01-15-2026");
    expect(result).toBe(false);
  });

  test("should reject invalid date", () => {
    const result = validateDateFormat("2026-13-45");
    expect(result).toBe(false);
  });

  test("should reject empty string", () => {
    const result = validateDateFormat("");
    expect(result).toBe(false);
  });

  test("should reject malformed string", () => {
    const result = validateDateFormat("not-a-date");
    expect(result).toBe(false);
  });
});

describe("sortDates utility", () => {
  test("should sort dates chronologically", () => {
    const input = "2026-03-01,2026-01-01,2026-02-01";
    const result = sortDates(input);
    expect(result).toBe("2026-01-01,2026-02-01,2026-03-01");
  });

  test("should handle empty string", () => {
    const result = sortDates("");
    expect(result).toBe("");
  });

  test("should filter out invalid dates", () => {
    const input = "2026-01-01,invalid,2026-02-01";
    const result = sortDates(input);
    expect(result).toBe("2026-01-01,2026-02-01");
  });

  test("should handle single date", () => {
    const result = sortDates("2026-01-01");
    expect(result).toBe("2026-01-01");
  });

  test("should handle already sorted dates", () => {
    const input = "2026-01-01,2026-02-01,2026-03-01";
    const result = sortDates(input);
    expect(result).toBe("2026-01-01,2026-02-01,2026-03-01");
  });
});
