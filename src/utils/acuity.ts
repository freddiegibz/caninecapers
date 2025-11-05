// Acuity configuration constants
export const ACUITY_OWNER_ID = '3e8feaf8'; // Correct Acuity schedule/owner ID
export const ACUITY_SESSION_FIELD_ID = '17502393'; // Custom Session ID field ID

export function getAcuityBookingUrl(sessionId: string, calendarId: string, appointmentTypeId: string, date: string, time: string): string {
  // date and time parameters are already in London timezone
  // Determine if it's BST (March-October) or GMT
  const dateObj = new Date(`${date}T${time}:00Z`);
  const month = dateObj.getMonth() + 1; // getMonth() returns 0-11
  const isBST = month >= 3 && month <= 10; // Simplified BST check
  const timezoneOffset = isBST ? '+01:00' : '+00:00';

  // Create ISO datetime string with proper London timezone offset
  const isoDateTime = `${date}T${time}:00${timezoneOffset}`;
  const encodedDateTime = encodeURIComponent(isoDateTime);

  // Use canonical Acuity URL format with datetime segment
  const baseUrl = `https://app.acuityscheduling.com/schedule/${ACUITY_OWNER_ID}/appointment/${appointmentTypeId}/calendar/${calendarId}/datetime/${encodedDateTime}?appointmentTypeIds[]=${appointmentTypeId}&calendarIds=${calendarId}&date=${date}&time=${time}&field:${ACUITY_SESSION_FIELD_ID}=${sessionId}`;

  return baseUrl;
}
