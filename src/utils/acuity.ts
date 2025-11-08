// Acuity configuration constants
export const ACUITY_OWNER_ID = '3e8feaf8'; // Acuity schedule/owner ID
export const ACUITY_SESSION_FIELD_ID = '17517976'; // Custom Session ID field ID

/**
 * Generate Acuity booking URL using .as.me domain with /datetime/ path segment
 * @param sessionId - The session ID to prefill in the form
 * @param calendarId - Acuity calendar ID
 * @param appointmentTypeId - Acuity appointment type ID
 * @param startTimeISO - ISO string for accurate timezone conversion (e.g., "2025-11-05T17:00:00.000Z")
 * @returns Formatted booking URL with datetime path for direct slot preselection and session ID prefill
 */
export function getAcuityBookingUrl(
  sessionId: string, 
  calendarId: string, 
  appointmentTypeId: string, 
  startTimeISO: string
): string {
  // URL-encode sessionId to handle special characters safely
  const encodedSessionId = encodeURIComponent(sessionId);

  // Convert to London timezone and create ISO datetime string
  const londonTime = new Date(startTimeISO).toLocaleString("en-GB", { timeZone: "Europe/London" });
  const londonDate = new Date(londonTime);
  const isoDateTime = londonDate.toISOString().split(".")[0] + "+00:00";
  const encodedDateTime = encodeURIComponent(isoDateTime);

  // Use /datetime/ path format for direct slot preselection
  // Remove date= and time= parameters - Acuity ignores them when /datetime/ is present
  const bookingUrl = `https://caninecapers.as.me/schedule/${ACUITY_OWNER_ID}/appointment/${appointmentTypeId}/calendar/${calendarId}/datetime/${encodedDateTime}?appointmentTypeIds[]=${appointmentTypeId}&calendarIds=${calendarId}&field:${ACUITY_SESSION_FIELD_ID}=${encodedSessionId}`;

  // Log final generated URL for verification
  console.log("🔗 Final booking URL:", bookingUrl);

  return bookingUrl;
}
