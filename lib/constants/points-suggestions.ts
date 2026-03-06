/**
 * Points Suggestion Constants
 *
 * Story 2.2: Parent Sets Task Points Value
 * Task 3: Implement task difficulty-points value suggestion system
 *
 * Provides suggested points ranges based on task difficulty levels
 *
 * Source: Story 2.2 AC #2 - Display suggested correspondence between points and task difficulty
 */

/**
 * Points suggestion categories based on task difficulty
 *
 * Mapping:
 * - Simple tasks (e.g., making bed): 1-10 points
 * - Medium tasks (e.g., washing dishes): 15-30 points
 * - Hard tasks (e.g., completing homework): 30-50 points
 * - Special tasks (e.g., caring for pets): 50-100 points
 */
export const POINT_SUGGESTIONS = {
  /** Simple daily tasks - 1-10 points */
  simple: {
    min: 1,
    max: 10,
    label: '简单',
    color: 'green',
    examples: ['整理床铺', '收拾玩具', '刷牙', '洗脸', '整理书包'] as const,
  },

  /** Medium effort tasks - 15-30 points */
  medium: {
    min: 15,
    max: 30,
    label: '中等',
    color: 'yellow',
    examples: ['洗碗', '扫地', '倒垃圾', '整理房间', '折衣服'] as const,
  },

  /** Difficult tasks - 30-50 points */
  hard: {
    min: 30,
    max: 50,
    label: '困难',
    color: 'red',
    examples: ['完成作业', '打扫整个房间', '洗衣服', '做饭', '辅导弟弟妹妹'] as const,
  },

  /** Special/exceptional tasks - 50-100 points */
  special: {
    min: 50,
    max: 100,
    label: '特殊',
    color: 'purple',
    examples: ['照顾宠物', '帮助同学', '参加社区服务', '学习新技能', '完成项目'] as const,
  },
} as const;

/**
 * Points suggestion type
 */
export type PointsDifficulty = keyof typeof POINT_SUGGESTIONS;

/**
 * Get suggested points range for a difficulty level
 */
export function getPointsRange(difficulty: PointsDifficulty) {
  return POINT_SUGGESTIONS[difficulty];
}

/**
 * Get default points value for a difficulty level (midpoint of range)
 */
export function getDefaultPoints(difficulty: PointsDifficulty): number {
  const range = POINT_SUGGESTIONS[difficulty];
  return Math.floor((range.min + range.max) / 2);
}

/**
 * Validate points value is within acceptable range (1-100)
 *
 * @param points - Points value to validate
 * @returns true if valid, false otherwise
 */
export function isValidPoints(points: number): boolean {
  return Number.isInteger(points) && points >= 1 && points <= 100;
}

/**
 * Validate points and throw error if invalid
 *
 * @param points - Points value to validate
 * @throws Error if points is not a valid integer in range 1-100
 */
export function validatePoints(points: number): void {
  if (!Number.isInteger(points)) {
    throw new Error('积分值必须为整数');
  }

  if (points < 1 || points > 100) {
    throw new Error('积分值必须在1-100之间');
  }
}

/**
 * Get difficulty level from points value
 *
 * @param points - Points value
 * @returns Difficulty level or undefined if points don't match any range
 */
export function getDifficultyFromPoints(points: number): PointsDifficulty | undefined {
  if (points >= 1 && points <= 10) return 'simple';
  if (points >= 15 && points <= 30) return 'medium';
  if (points >= 30 && points <= 50) return 'hard';
  if (points >= 50 && points <= 100) return 'special';
  return undefined;
}

/**
 * Points validation error messages
 */
export const POINTS_VALIDATION_ERRORS = {
  NOT_INTEGER: '积分值必须为整数',
  OUT_OF_RANGE: '积分值必须在1-100之间',
  MIN_ERROR: '积分最少1分',
  MAX_ERROR: '积分最多100分',
} as const;
