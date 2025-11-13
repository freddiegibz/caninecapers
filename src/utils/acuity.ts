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
  // If the caller passes a full ISO datetime with offset, use it directly
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(?:[+\-]\d{2}:?\d{2}|Z)$/.test(selectedTime)) {
    // Normalize to include seconds and colon in offset if needed
    let dt = selectedTime.replace('Z', '+00:00');
    // Insert seconds if missing
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?:[+\-]|Z)/.test(selectedTime)) {
      dt = dt.replace(/T(\d{2}:\d{2})([+\-])/, 'T$1:00$2');
    }
    // Insert colon in offset if missing (e.g., +0000 -> +00:00)
    dt = dt.replace(/([+\-]\d{2})(\d{2})$/, '$1:$2');
    return dt;
  }

  // Else, build from date + time, defaulting to +00:00 offset
  const dateStr = normalizeDateYYYYMMDD(selectedDate);
  const timeStr = selectedTime.length === 5 ? `${selectedTime}:00` : selectedTime;
  return `${dateStr}T${timeStr}+00:00`;
}

export function getAcuityBookingUrl(
  sessionId: string, 
  calendarId: string, 
  appointmentTypeId: string, 
  selectedDate: string,
  selectedTime: string
): string {
  // Use EXACT format from Acuity docs:
  // https://example.acuityscheduling.com/schedule.php?field:237764=Relaxation!&appointmentType=184520&datetime=2025-08-30T14:00-05:00
  const datetime = buildDatetime(selectedDate, selectedTime);
  
  // Build URL exactly as documented:
  // - field:ID key stays literal (colon not encoded)
  // - datetime value stays literal (colons and +/- not encoded, as per Acuity example)
  // - Other values are URL encoded
  return `https://caninecapers.as.me/schedule.php?field:${ACUITY_SESSION_FIELD_ID}=${encodeURIComponent(sessionId)}&appointmentType=${encodeURIComponent(appointmentTypeId)}&calendarID=${encodeURIComponent(calendarId)}&datetime=${datetime}`;
}
