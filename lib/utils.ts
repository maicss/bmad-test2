import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function for Tailwind CSS class merging
 *
 * Used by Shadcn components for conditional class application
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a masked phone number for display
 *
 * Masks all but the last 4 digits
 * Example: 13800123456 -> 138****3456
 *
 * @param phone - Full phone number
 * @returns Masked phone number
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length <= 4) {
    // 太短的号码直接返回原值
    return phone;
  }

  // 保留前3位和最后4位，中间替换为 *
  const middlePart = phone.slice(3, -4);
  return phone.slice(0, 3) + middlePart.replace(/\d/g, '*') + phone.slice(-4);
}

/**
 * Validate Chinese phone number format
 *
 * Chinese mobile numbers are 11 digits, starting with 1
 *
 * @param phone - Phone number to validate
 * @returns True if valid Chinese phone format
 */
export function isValidChinesePhone(phone: string): boolean {
  const regex = /^1[3-9]\d{9}$/;
  return regex.test(phone);
}

/**
 * Validate password strength
 *
 * Password must be 8-20 characters and contain:
 * - At least 1 uppercase letter
 * - At least 1 number
 *
 * @param password - Password to validate
 * @returns True if meets strength requirements
 */
export function isStrongPassword(password: string): boolean {
  if (password.length < 8 || password.length > 20) {
    return false;
  }
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  return hasUpperCase && hasNumber;
}
