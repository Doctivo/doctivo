/**
 * Utility for Indian Standard Time (IST, UTC+05:30) date and slot calculations.
 * Guarantees consistent date/time evaluation regardless of server UTC hosting.
 */

export interface ISTDateInfo {
  istTodayStr: string;   // "YYYY-MM-DD" in Asia/Kolkata
  istMinutesNow: number; // Minutes from midnight (e.g. 10:40 AM = 640)
  istNow: Date;
}

export function getISTDateInfo(): ISTDateInfo {
  const istNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const year = istNow.getFullYear();
  const month = String(istNow.getMonth() + 1).padStart(2, '0');
  const day = String(istNow.getDate()).padStart(2, '0');
  const istTodayStr = `${year}-${month}-${day}`;
  const istMinutesNow = istNow.getHours() * 60 + istNow.getMinutes();

  return { istTodayStr, istMinutesNow, istNow };
}

/**
 * Parses time strings like "09:00 AM", "9:00 AM", "1:30 PM", or "14:15" into minutes from midnight.
 */
export function parseSlotToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const min = parseInt(match[2], 10);
  const period = (match[3] || '').toUpperCase();

  if (period === 'PM' && hour < 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

  return hour * 60 + min;
}

/**
 * Checks whether an appointment slot is in the past in IST.
 * @param dateStr "YYYY-MM-DD" or ISO date string
 * @param timeStr "09:00 AM"
 * @param bufferMinutes Optional grace buffer in minutes (default: 0)
 * @returns true if slot is in the past (must be blocked)
 */
export function isSlotInPast(dateStr: string, timeStr: string, bufferMinutes = 0): boolean {
  if (!dateStr || !timeStr) return true;
  const cleanDate = String(dateStr).split('T')[0].trim();
  const { istTodayStr, istMinutesNow } = getISTDateInfo();

  // 1. Date is strictly before today in IST
  if (cleanDate < istTodayStr) {
    return true;
  }

  // 2. Date is today in IST -> Check slot start time against current IST minutes
  if (cleanDate === istTodayStr) {
    const slotMinutes = parseSlotToMinutes(timeStr);
    if (slotMinutes === null) return true; // Malformed time string is considered invalid/past
    return slotMinutes <= (istMinutesNow + bufferMinutes);
  }

  // 3. Date is in the future
  return false;
}
