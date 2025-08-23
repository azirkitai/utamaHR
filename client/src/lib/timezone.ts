/**
 * Malaysia Timezone Utilities
 * 
 * This module provides consistent timezone handling for the entire application.
 * All times should be displayed in Malaysia time (UTC+8 / Asia/Kuala_Lumpur)
 */

const MALAYSIA_TIMEZONE = 'Asia/Kuala_Lumpur';

/**
 * Format a date/time string to Malaysia timezone
 * @param dateTime - ISO string or Date object
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted time string in Malaysia timezone
 */
export function formatMalaysiaTime(dateTime: string | Date, options?: Intl.DateTimeFormatOptions): string {
  if (!dateTime) return '-';
  
  try {
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleTimeString('ms-MY', {
      timeZone: MALAYSIA_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      ...options
    });
  } catch (error) {
    console.error('Error formatting Malaysia time:', error);
    return 'Invalid Date';
  }
}

/**
 * Format a date to Malaysia timezone with date and time
 * @param dateTime - ISO string or Date object
 * @returns Formatted date and time string in Malaysia timezone
 */
export function formatMalaysiaDateTime(dateTime: string | Date): string {
  if (!dateTime) return '-';
  
  try {
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleString('ms-MY', {
      timeZone: MALAYSIA_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error('Error formatting Malaysia date time:', error);
    return 'Invalid Date';
  }
}

/**
 * Format a date to Malaysia date only
 * @param dateTime - ISO string or Date object
 * @returns Formatted date string in Malaysia timezone
 */
export function formatMalaysiaDate(dateTime: string | Date): string {
  if (!dateTime) return '-';
  
  try {
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleDateString('ms-MY', {
      timeZone: MALAYSIA_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting Malaysia date:', error);
    return 'Invalid Date';
  }
}

/**
 * Get current time in Malaysia timezone
 * @returns Current Date object adjusted to Malaysia timezone
 */
export function getMalaysiaTime(): Date {
  const now = new Date();
  // Convert to Malaysia time by adding 8 hours offset
  const malaysiaTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  return malaysiaTime;
}

/**
 * Check if a time is the same in Malaysia timezone
 * @param time1 - First time to compare
 * @param time2 - Second time to compare
 * @returns true if times are the same in Malaysia timezone
 */
export function isSameMalaysiaTime(time1: string | Date, time2: string | Date): boolean {
  try {
    const date1 = typeof time1 === 'string' ? new Date(time1) : time1;
    const date2 = typeof time2 === 'string' ? new Date(time2) : time2;
    
    if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return false;
    
    return formatMalaysiaTime(date1) === formatMalaysiaTime(date2);
  } catch (error) {
    return false;
  }
}