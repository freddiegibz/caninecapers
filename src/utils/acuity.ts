// Acuity configuration constants
export const ACUITY_OWNER_ID = '3e8feaf8'; // Acuity schedule/owner ID
export const ACUITY_SESSION_FIELD_ID = '17517976'; // Custom Session ID field ID

/**
 * Get London timezone offset for a given date (handles DST)
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Timezone offset string like "+00:00" or "+01:00"
 */
function getLondonOffset(dateStr: string): string {
  // dateStr: "YYYY-MM-DD"
  const [y, m, d] = dateStr.split("-").map(Number);

  // Use a fixed 12:00 time to avoid DST boundary oddities
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    timeZoneName: "shortOffset"
  });

  const parts = fmt.formatToParts(dt);
  const off = parts.find(p => p.type === "timeZoneName")?.value || "+00:00";

  // Normalize to +HH:MM or -HH:MM
  return off.replace("UTC", "+00:00").replace("GMT", "+00:00");
}

/**
 * Generate Acuity booking URL using .as.me domain with /datetime/ path segment
 * Uses raw UI date/time values without any conversions
 * @param sessionId - The session ID to prefill in the form
 * @param calendarId - Acuity calendar ID
 * @param appointmentTypeId - Acuity appointment type ID
 * @param selectedDate - Date string in YYYY-MM-DD format (from UI, already correct for London)
 * @param selectedTime - Time string in HH:MM format (from UI, already correct for London)
 * @returns Formatted booking URL with datetime path for direct slot preselection and session ID prefill
 */
export function getAcuityBookingUrl(
  sessionId: string, 
  calendarId: string, 
  appointmentTypeId: string, 
  selectedDate: string,
  selectedTime: string
): string {
  // URL-encode sessionId to handle special characters safely
  const encodedSessionId = encodeURIComponent(sessionId);

  // Use raw UI values - do not convert the time
  const dateStr = selectedDate;      // "YYYY-MM-DD" from UI
  const timeStr = selectedTime;      // "HH:MM" from UI (London-correct)
  
  // Get London offset for this date (handles DST)
  const offset = getLondonOffset(dateStr); // "+00:00" or "+01:00"
  
  // Build ISO datetime string WITHOUT altering the hour
  // Do not use new Date() on the time - use it exactly as selected
  const isoNaive = `${dateStr}T${timeStr}:00${offset}`;
  const encodedDateTime = encodeURIComponent(isoNaive);

  // Construct final URL with /datetime/ path
  // Remove date= and time= parameters - Acuity ignores them when /datetime/ is present
  const bookingUrl = `https://caninecapers.as.me/schedule/${ACUITY_OWNER_ID}/appointment/${appointmentTypeId}/calendar/${calendarId}/datetime/${encodedDateTime}?appointmentTypeIds[]=${appointmentTypeId}&calendarIds=${calendarId}&field:${ACUITY_SESSION_FIELD_ID}=${encodedSessionId}`;

  // Log values just before redirect
  console.log("🗓 selectedDate (UI):", selectedDate);
  console.log("⏰ selectedTime (UI):", selectedTime);
  console.log("🕰 London offset:", offset);
  console.log("🔗 Final booking URL:", bookingUrl);

  return bookingUrl;
}
