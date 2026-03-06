/**
 * Points Suggestions Component
 *
 * Story 2.2: Parent Sets Task Points Value
 * Task 3: Implement task difficulty-points value suggestion system UI
 *
 * Provides visual UI for selecting points based on task difficulty with:
 * - Preset buttons for difficulty levels (simple/medium/hard/special)
 * - Example tasks for each difficulty
 * - Visual feedback with color coding
 *
 * Source: Story 2.2 AC #2 - Display suggested correspondence between points and difficulty
 */

'use client';

import { POINT_SUGGESTIONS, getDefaultPoints, PointsDifficulty } from '@/lib/constants/points-suggestions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface PointsSuggestionsProps {
  /** Callback when a difficulty is selected */
  onSelectPoints: (points: number) => void;
  /** Currently selected points value */
  currentPoints?: number;
  /** Disable selection */
  disabled?: boolean;
  /** Additional CSS class names */
  className?: string;
}

/**
 * Points Suggestions Component
 *
 * Displays difficulty-based point suggestions with visual selection
 */
export function PointsSuggestions({
  onSelectPoints,
  currentPoints,
  disabled = false,
  className = '',
}: PointsSuggestionsProps) {
  // Get the difficulty level for current points
  const getCurrentDifficulty = (): PointsDifficulty | null => {
    if (!currentPoints) return null;
    if (currentPoints >= 1 && currentPoints <= 10) return 'simple';
    if (currentPoints >= 15 && currentPoints <= 30) return 'medium';
    if (currentPoints >= 30 && currentPoints <= 50) return 'hard';
    if (currentPoints >= 50 && currentPoints <= 100) return 'special';
    return null;
  };

  const currentDifficulty = getCurrentDifficulty();

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h4 className="text-sm font-medium mb-3">选择任务难度快速设置积分</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(POINT_SUGGESTIONS).map(([key, suggestion]) => {
            const isSelected = currentDifficulty === key;
            const defaultPoints = getDefaultPoints(key as PointsDifficulty);

            return (
              <Button
                key={key}
                type="button"
                variant={isSelected ? 'default' : 'outline'}
                onClick={() => !disabled && onSelectPoints(defaultPoints)}
                disabled={disabled}
                className={`
                  flex flex-col items-start gap-1 h-auto py-3 px-3
                  ${isSelected ? 'ring-2 ring-offset-2' : ''}
                `}
                style={{
                  ...(isSelected && {
                    backgroundColor: getDifficultyColor(key as PointsDifficulty),
                    borderColor: getDifficultyColor(key as PointsDifficulty),
                  }),
                }}
              >
                <span className="font-semibold text-sm">{suggestion.label}</span>
                <span className="text-xs opacity-80">
                  {suggestion.min}-{suggestion.max}分
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium">参考示例</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {Object.entries(POINT_SUGGESTIONS).map(([key, suggestion]) => (
            <div
              key={key}
              className="flex items-start gap-2 p-2 rounded-md bg-muted/50"
            >
              <Badge
                variant="outline"
                className="shrink-0"
                style={{
                  backgroundColor: getDifficultyBgColor(key as PointsDifficulty),
                  borderColor: getDifficultyColor(key as PointsDifficulty),
                }}
              >
                {suggestion.label}
              </Badge>
              <span className="text-muted-foreground">
                {suggestion.examples.slice(0, 3).join('、')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Get color for difficulty level
 */
function getDifficultyColor(difficulty: PointsDifficulty): string {
  const colors = {
    simple: '#22c55e',      // green
    medium: '#eab308',     // yellow
    hard: '#ef4444',       // red
    special: '#a855f7',    // purple
  };
  return colors[difficulty];
}

/**
 * Get background color for difficulty badge
 */
function getDifficultyBgColor(difficulty: PointsDifficulty): string {
  const colors = {
    simple: '#dcfce7',      // green-100
    medium: '#fef9c3',      // yellow-100
    hard: '#fee2e2',        // red-100
    special: '#f3e8ff',     // purple-100
  };
  return colors[difficulty];
}

/**
 * Compact version - just the preset buttons
 */
export interface PointsPresetsProps {
  /** Callback when points are selected */
  onSelectPoints: (points: number) => void;
  /** Currently selected points */
  currentPoints?: number;
  /** Disable selection */
  disabled?: boolean;
}

/**
 * Points Presets Component (Compact)
 *
 * Minimal version with only preset buttons
 */
export function PointsPresets({
  onSelectPoints,
  currentPoints,
  disabled = false,
}: PointsPresetsProps) {
  const getCurrentDifficulty = (): PointsDifficulty | null => {
    if (!currentPoints) return null;
    if (currentPoints >= 1 && currentPoints <= 10) return 'simple';
    if (currentPoints >= 15 && currentPoints <= 30) return 'medium';
    if (currentPoints >= 30 && currentPoints <= 50) return 'hard';
    if (currentPoints >= 50 && currentPoints <= 100) return 'special';
    return null;
  };

  const currentDifficulty = getCurrentDifficulty();

  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(POINT_SUGGESTIONS).map(([key, suggestion]) => {
        const isSelected = currentDifficulty === key;
        const defaultPoints = getDefaultPoints(key as PointsDifficulty);

        return (
          <Button
            key={key}
            type="button"
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            onClick={() => !disabled && onSelectPoints(defaultPoints)}
            disabled={disabled}
            className="font-normal"
          >
            {suggestion.label} ({suggestion.min}-{suggestion.max})
          </Button>
        );
      })}
    </div>
  );
}
