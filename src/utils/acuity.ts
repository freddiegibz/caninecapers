// Acuity configuration constants
export const ACUITY_OWNER_ID = '3e8feaf8'; // Acuity schedule/owner ID
export const ACUITY_SESSION_FIELD_ID = '17517976'; // Custom Session ID field ID

/**
 * Generate Acuity booking URL using root query format
 * Uses raw UI date/time values without any conversions
 * This format opens the calendar view (not specific slot) AND prefills session ID field
 * @param sessionId - The session ID to prefill in the form
 * @param calendarId - Acuity calendar ID
 * @param appointmentTypeId - Acuity appointment type ID
 * @param selectedDate - Date string in YYYY-MM-DD format (from UI, already correct for London)
 * @param selectedTime - Time string in HH:MM format (from UI, already correct for London)
 * @returns Formatted booking URL that opens calendar view with session ID prefilled
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

  // Use root query format - opens calendar view (not specific slot) with session ID prefilled
  // Format: https://caninecapers.as.me/?calendarID={id}&appointmentType={id}&date={date}&time={time}&field:ID=value
  const bookingUrl = `https://caninecapers.as.me/?calendarID=${calendarId}&appointmentType=${appointmentTypeId}&date=${dateStr}&time=${timeStr}&field:${ACUITY_SESSION_FIELD_ID}=${encodedSessionId}`;

  // Log values just before redirect
  console.log("🗓 selectedDate (UI):", selectedDate);
  console.log("⏰ selectedTime (UI):", selectedTime);
  console.log("📋 Session ID:", sessionId);
  console.log("📋 Encoded Session ID:", encodedSessionId);
  console.log("📋 Field Parameter:", `field:${ACUITY_SESSION_FIELD_ID}=${encodedSessionId}`);
  console.log("🔗 Final booking URL:", bookingUrl);
  console.log("✅ URL uses root query format (opens calendar view)");
  console.log("✅ URL contains field parameter:", bookingUrl.includes(`field:${ACUITY_SESSION_FIELD_ID}=`));
  console.log("✅ URL contains date parameter:", bookingUrl.includes('date='));
  console.log("✅ URL contains time parameter:", bookingUrl.includes('time='));
  console.log("✅ URL format: Root query with field parameter (calendar view + session ID prefill)");

  return bookingUrl;
}
