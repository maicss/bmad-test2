/**
 * Default Date Strategies Seeding
 * 在系统启动时添加默认日期策略
 *
 * 2026年中国国假安排:
 * - 元旦: 1月1日-3日放假, 1月4日(周日)上班
 * - 春节: 2月15日-23日放假, 2月14日、2月28日(周六)上班
 * - 清明节: 4月4日-6日放假
 * - 劳动节: 5月1日-5日放假, 5月9日(周六)上班
 * - 端午节: 6月19日-21日放假
 * - 中秋节: 9月25日-27日放假
 * - 国庆节: 10月1日-7日放假, 9月20日、10月10日(周六)上班
 */

import type { Database } from "bun:sqlite";

// ============================================================
// 2026年国假数据
// ============================================================

const HOLIDAYS_2026: { holidays: string[]; workdays: string[] } = {
  // 放假日期 (YYYY-MM-DD 格式)
  holidays: [
    // 元旦 (1月1日-3日)
    "2026-01-01",
    "2026-01-02",
    "2026-01-03",
    // 春节 (2月15日-23日)
    "2026-02-15",
    "2026-02-16",
    "2026-02-17",
    "2026-02-18",
    "2026-02-19",
    "2026-02-20",
    "2026-02-21",
    "2026-02-22",
    "2026-02-23",
    // 清明节 (4月4日-6日)
    "2026-04-04",
    "2026-04-05",
    "2026-04-06",
    // 劳动节 (5月1日-5日)
    "2026-05-01",
    "2026-05-02",
    "2026-05-03",
    "2026-05-04",
    "2026-05-05",
    // 端午节 (6月19日-21日)
    "2026-06-19",
    "2026-06-20",
    "2026-06-21",
    // 中秋节 (9月25日-27日)
    "2026-09-25",
    "2026-09-26",
    "2026-09-27",
    // 国庆节 (10月1日-7日)
    "2026-10-01",
    "2026-10-02",
    "2026-10-03",
    "2026-10-04",
    "2026-10-05",
    "2026-10-06",
    "2026-10-07",
  ],
  // 调休上班日 (通常是周末)
  workdays: [
    "2026-01-04", // 元旦调休周日
    "2026-02-14", // 春节调休周六
    "2026-02-28", // 春节调休周六
    "2026-05-09", // 劳动节调休周六
    "2026-09-20", // 国庆调休周日
    "2026-10-10", // 国庆调休周六
  ],
} as const;

// ============================================================
// 日期工具函数
// ============================================================

function generateAllDates(year: number): string[] {
  const dates: string[] = [];
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    dates.push(formatDate(d));
  }
  return dates;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isWeekend(dateStr: string): boolean {
  const date = new Date(dateStr);
  const day = date.getDay();
  return day === 0 || day === 6; // 0=周日, 6=周六
}

// ============================================================
// 日期策略生成
// ============================================================

interface DateStrategyData {
  id: string;
  name: string;
  description: string | null;
  region: string;
  year: number;
  isPublic: number;
  dates: string;
  copyCount: number;
  createdBy: string | null;
}

/**
 * 生成默认日期策略数据
 */
function generateDefaultDateStrategies(year: number): DateStrategyData[] {
  const allDates = generateAllDates(year);
  const holidaySet = new Set(HOLIDAYS_2026.holidays);
  const workdaySet = new Set(HOLIDAYS_2026.workdays);

  // 1. 每天 - 所有日期
  const dailyDates = allDates;

  // 2. 周末（不含国假）- 是周末但不在国假中，也不是调休上班日
  const weekendDates = allDates.filter(
    (d) => isWeekend(d) && !holidaySet.has(d) && !workdaySet.has(d),
  );

  // 3. 工作日（不含国假）- 周一到周五，排除国假，包含调休上班日
  const workdayNoHolidayDates = allDates.filter((d) => {
    if (holidaySet.has(d)) return false;
    if (workdaySet.has(d)) return true; // 调休上班日
    return !isWeekend(d); // 非周末的工作日
  });

  // 4. 工作日（含国假）- 同上
  const workdayWithHolidayDates = workdayNoHolidayDates;

  // 5. 休息日（含国假）- 周末 + 国假
  const restDayWithHolidayDates = allDates.filter((d) => {
    if (holidaySet.has(d)) return true;
    if (workdaySet.has(d)) return false; // 排除调休上班日
    return isWeekend(d);
  });

  const ADMIN_ID = "115eb481-9c21-4e0f-a027-f03b96c4e588";

  return [
    {
      id: `default-daily-${year}`,
      name: "每天",
      description: null,
      region: "000000",
      year,
      isPublic: 1,
      dates: dailyDates.join(","),
      copyCount: 0,
      createdBy: ADMIN_ID,
    },
    {
      id: `default-weekend-${year}`,
      name: "周末",
      description: null,
      region: "000000",
      year,
      isPublic: 1,
      dates: weekendDates.join(","),
      copyCount: 0,
      createdBy: ADMIN_ID,
    },
    {
      id: `default-workday-no-holiday-${year}`,
      name: "工作日",
      description: null,
      region: "000000",
      year,
      isPublic: 1,
      dates: workdayNoHolidayDates.join(","),
      copyCount: 0,
      createdBy: ADMIN_ID,
    },
    {
      id: `default-workday-with-holiday-${year}`,
      name: "工作日",
      description: null,
      region: "000000",
      year,
      isPublic: 1,
      dates: workdayWithHolidayDates.join(","),
      copyCount: 0,
      createdBy: ADMIN_ID,
    },
    {
      id: `default-restday-${year}`,
      name: "休息日",
      description: null,
      region: "000000",
      year,
      isPublic: 1,
      dates: restDayWithHolidayDates.join(","),
      copyCount: 0,
      createdBy: ADMIN_ID,
    },
  ];
}

// ============================================================
// 导出的初始化函数
// ============================================================

/**
 * 在系统启动时添加默认日期策略
 * 检查数据库是否已存在默认策略，如果不存在则写入
 *
 * @param db - 原始 SQLite 数据库实例
 */
export function seedDefaultDateStrategies(db: Database): void {
  try {
    const year = 2026;

    // 检查是否已存在默认策略
    const existingStrategies = db
      .query(
        `SELECT id FROM date_strategy WHERE id LIKE 'default-%' AND year = ?`,
      )
      .all(year) as { id: string }[];

    if (existingStrategies.length > 0) {
      console.log(`✅ 默认日期策略已存在，跳过初始化 (year: ${year})`);
      return;
    }

    console.log(`🌱 开始初始化默认日期策略 (year: ${year})...`);

    const strategies = generateDefaultDateStrategies(year);
    const stmt = db.prepare(`
      INSERT INTO date_strategy (id, name, description, region, year, is_public, dates, copy_count, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const strategy of strategies) {
      stmt.run(
        strategy.id,
        strategy.name,
        strategy.description,
        strategy.region,
        strategy.year,
        strategy.isPublic,
        strategy.dates,
        strategy.copyCount,
        strategy.createdBy,
        Date.now(),
        Date.now(),
      );
      const daysCount = strategy.dates.split(",").length;
      console.log(`  ✓ 已创建策略: ${strategy.name} (${daysCount} 天)`);
    }

    console.log(
      `✅ 默认日期策略初始化完成，共创建 ${strategies.length} 条记录`,
    );
  } catch (error) {
    console.error("❌ 默认日期策略初始化失败:", error);
    // 不抛出异常，允许应用继续启动
  }
}
