export function getAcuityBookingUrl(sessionId: string, calendarId: string, appointmentTypeId: string, date: string, time: string): string {
  const OWNER_ID = '3e8feaf8'; // Acuity schedule/owner ID (from your working URL example)
  const fieldId = '17502393'; // The field ID for your custom Session ID question

  // Use your working path-based format with field pre-filling added
  const baseUrl = `https://app.acuityscheduling.com/schedule/${OWNER_ID}/appointment/${appointmentTypeId}/calendar/${calendarId}?appointmentTypeIds[]=${appointmentTypeId}&calendarIds=${calendarId}&date=${date}&time=${time}&field:${fieldId}=${sessionId}`;

  return baseUrl;
}
