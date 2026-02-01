import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function deduplicateDates(datesStr: string): string {
  const dates = datesStr.split(",").map(d => d.trim()).filter(d => d);
  const uniqueDates = [...new Set(dates)];
  return uniqueDates.join(",");
}

export function parseComboStairConfig(config: string): number[] | null {
  try {
    const parsed = JSON.parse(config);
    if (parsed.steps && Array.isArray(parsed.steps)) {
      return parsed.steps;
    }
    return null;
  } catch {
    return null;
  }
}

export function calculateLinearPoints(basePoints: number, streak: number, multiplier: number = 1): number {
  return basePoints + (streak * basePoints * multiplier);
}

export function calculateStairPoints(basePoints: number, streak: number, steps: number[]): number {
  let total = basePoints;
  for (let i = 1; i < streak && i < steps.length; i++) {
    total += basePoints * steps[i];
  }
  return total;
}

export function validateDateFormat(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

export function sortDates(datesStr: string): string {
  const dates = datesStr.split(",").map(d => d.trim()).filter(d => d);
  const validDates = dates.filter(d => validateDateFormat(d));
  validDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  return validDates.join(",");
}
