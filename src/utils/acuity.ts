// Acuity configuration constants
export const ACUITY_OWNER_ID = '3e8feaf8'; // Acuity schedule/owner slug (subdomain)
export const ACUITY_OWNER_NUM = '21300080'; // Acuity numeric owner ID
export const ACUITY_SESSION_FIELD_ID = '17517976'; // Custom Session ID field ID

function normalizeDateYYYYMMDD(input: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  if (/^\d{4}-\d{2}-\d{2}T/.test(input)) return input.split('T')[0];
  const d = new Date(input);
  if (!isNaN(d.getTime())) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return input;
}

function buildDatetime(selectedDate: string, selectedTime: string): string {
  // Acuity example format: 2025-08-30T14:00-05:00 (NO seconds, with timezone offset)
  // If the caller passes a full ISO datetime with offset, extract date/time/offset
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(?:[+\-]\d{2}:?\d{2}|Z)$/.test(selectedTime)) {
    // Parse the ISO string
    let dt = selectedTime.replace('Z', '+00:00');
    
    // Remove seconds if present (Acuity format doesn't include seconds)
    // Match: THH:MM:SS+offset or THH:MM:SS-offset
    dt = dt.replace(/T(\d{2}:\d{2}):\d{2}([+\-]\d{2}:?\d{2})$/, 'T$1$2');
    
    // Ensure offset has colon (e.g., +0000 -> +00:00, but leave +00:00 as-is)
    dt = dt.replace(/([+\-])(\d{2})(\d{2})$/, '$1$2:$3');
    
    return dt;
  }

  // Else, build from date + time, defaulting to +00:00 offset
  // Format: YYYY-MM-DDTHH:MM+00:00 (no seconds)
  const dateStr = normalizeDateYYYYMMDD(selectedDate);
  const timeStr = selectedTime.length === 5 ? selectedTime : selectedTime.substring(0, 5); // Remove seconds if present
  return `${dateStr}T${timeStr}+00:00`;
}

export function getAcuityBookingUrl(
  sessionId: string, 
  calendarId: string, 
  appointmentTypeId: string, 
  selectedDate: string,
  selectedTime: string
): string {
  // Working link format (prefills Session ID but doesn't navigate to datetime):
  // https://caninecapers.as.me/schedule/{ownerId}/appointment/{typeId}/calendar/{calId}?appointmentTypeIds[]=...&calendarIds=...&field%3A17517976=...
  // 
  // Try adding datetime as query param (not in path) to see if both work together
  const datetime = buildDatetime(selectedDate, selectedTime);
  
  const fieldKey = encodeURIComponent(`field:${ACUITY_SESSION_FIELD_ID}`); // field:17517976 -> field%3A17517976
  // Use path format WITHOUT datetime segment, but add datetime as query param
  // This matches the working link structure that successfully prefills Session ID
  return `https://caninecapers.as.me/schedule/${ACUITY_OWNER_ID}/appointment/${appointmentTypeId}/calendar/${calendarId}?appointmentTypeIds[]=${encodeURIComponent(appointmentTypeId)}&calendarIds=${encodeURIComponent(calendarId)}&datetime=${encodeURIComponent(datetime)}&${fieldKey}=${encodeURIComponent(sessionId)}`;
}
