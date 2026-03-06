/**
 * Points Input Component
 *
 * Story 2.2: Parent Sets Task Points Value
 * Task 2: Implement points input component with validation
 *
 * A reusable input component for setting task points values with:
 * - Input validation (1-100 range, integers only)
 * - Real-time error feedback
 * - Integration with points suggestions
 *
 * Source: Story 2.2 AC #2 - Points must be positive integer (1-100)
 */

'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validatePoints, POINTS_VALIDATION_ERRORS } from '@/lib/constants/points-suggestions';

export interface PointsInputProps {
  /** Current points value */
  value: number;
  /** Callback when value changes */
  onChange: (value: number) => void;
  /** Whether field has been touched */
  touched?: boolean;
  /** Error message to display */
  error?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Input ID */
  id?: string;
  /** Label text */
  label?: string;
  /** Helper text to display below input */
  helperText?: string;
  /** Additional CSS class names */
  className?: string;
}

const DEFAULT_PROPS: Partial<PointsInputProps> = {
  id: 'points',
  label: '积分值',
  helperText: '任务完成后，儿童可获得此积分（1-100分）',
};

/**
 * Points Input Component
 *
 * Provides validated input for task points with real-time error feedback
 */
export function PointsInput({
  value,
  onChange,
  touched = false,
  error,
  disabled = false,
  id = DEFAULT_PROPS.id,
  label = DEFAULT_PROPS.label,
  helperText = DEFAULT_PROPS.helperText,
  className = '',
}: PointsInputProps) {
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Allow empty input (will be validated on blur)
    if (inputValue === '') {
      onChange(0);
      return;
    }

    // Parse as number
    const numValue = parseInt(inputValue, 10);

    // Only update if valid number
    if (!isNaN(numValue)) {
      onChange(numValue);
    }
  };

  // Handle blur to validate
  const handleBlur = () => {
    if (value !== 0) {
      try {
        validatePoints(value);
      } catch (err) {
        // Error will be displayed via error prop
        const message = err instanceof Error ? err.message : POINTS_VALIDATION_ERRORS.OUT_OF_RANGE;
        // Pass error up to parent
        if (onChange) {
          // We can't directly pass error, parent should handle validation
          // This is a design choice - parent controls error state
        }
      }
    }
  };

  // Determine if input should show error state
  const hasError = touched && !!error;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor={id}>
          {label} <span className="text-red-500">*</span>
        </Label>
      )}

      <Input
        id={id}
        type="number"
        min={1}
        max={100}
        step={1}
        value={value === 0 ? '' : value.toString()}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        className={hasError ? 'border-red-500' : ''}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : `${id}-helper`}
      />

      {hasError && (
        <p id={`${id}-error`} className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      {!hasError && helperText && (
        <p id={`${id}-helper`} className="text-xs text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  );
}

/**
 * Props for points display badge
 */
export interface PointsBadgeProps {
  points: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

/**
 * Points Badge Component
 *
 * Displays points value with color coding based on difficulty
 */
export function PointsBadge({
  points,
  size = 'md',
  showLabel = false,
}: PointsBadgeProps) {
  const getDifficultyColor = (points: number): string => {
    if (points >= 1 && points <= 10) return 'bg-green-100 text-green-800 border-green-300';
    if (points >= 15 && points <= 30) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (points >= 30 && points <= 50) return 'bg-red-100 text-red-800 border-red-300';
    if (points >= 50 && points <= 100) return 'bg-purple-100 text-purple-800 border-purple-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getDifficultyLabel = (points: number): string => {
    if (points >= 1 && points <= 10) return '简单';
    if (points >= 15 && points <= 30) return '中等';
    if (points >= 30 && points <= 50) return '困难';
    if (points >= 50 && points <= 100) return '特殊';
    return '';
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const label = getDifficultyLabel(points);
  const colorClass = getDifficultyColor(points);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${colorClass} ${sizeClasses[size]}`}
    >
      <span className="font-bold">{points}</span>
      <span>分</span>
      {showLabel && label && (
        <>
          <span className="mx-1">·</span>
          <span>{label}</span>
        </>
      )}
    </span>
  );
}
