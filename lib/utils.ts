import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format as formatDateFns, parseISO } from 'date-fns';

/**
 * Combines multiple class names into a single string, handling conditional classes
 * and merging tailwind classes correctly.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date | string): string {
  if (!date) return '';
  
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDateFns(d, 'MMM d, yyyy'); // Format as "Jan 1, 2023"
  } catch (e) {
    console.error('Error formatting date:', e);
    return typeof date === 'string' ? date : date.toString();
  }
}

/**
 * Format a date to a time string (12-hour format with am/pm)
 */
export function formatTime(date: Date | string): string {
  if (!date) return '';
  
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDateFns(d, 'h:mm a'); // Format as "3:30 pm"
  } catch (e) {
    console.error('Error formatting time:', e);
    return typeof date === 'string' ? date : date.toString();
  }
}

/**
 * Get initials from a user's name
 */
export function getInitials(firstName?: string, lastName?: string): string {
  if (!firstName && !lastName) return '?';
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`;
}
