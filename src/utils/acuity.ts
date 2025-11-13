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
  selectedTime: string,
  userInfo?: {
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  },
  isSafari?: boolean
): string {
  // Working link format (prefills Session ID but doesn't navigate to datetime):
  // https://caninecapers.as.me/schedule/{ownerId}/appointment/{typeId}/calendar/{calId}?appointmentTypeIds[]=...&calendarIds=...&field%3A17517976=...
  // 
  // Acuity also supports prefilling client data: firstName, lastName, email, phone
  const datetime = buildDatetime(selectedDate, selectedTime);
  
  // Validate sessionId is not empty
  if (!sessionId || sessionId.trim() === '') {
    console.warn('⚠️ Empty sessionId passed to getAcuityBookingUrl');
  }
  
  const fieldKey = encodeURIComponent(`field:${ACUITY_SESSION_FIELD_ID}`); // field:17517976 -> field%3A17517976
  const encodedSessionId = encodeURIComponent(sessionId);
  
  // Safari has issues with path-based URLs and array parameters (appointmentTypeIds[])
  // Use schedule.php format for Safari which handles parameters more reliably
  // Don't include user info (firstName/lastName/email) for Safari as it interferes with Session ID prefilling
  if (isSafari) {
    // Use schedule.php format - this was working for Session ID and date/time before
    const params = [
      `appointmentType=${encodeURIComponent(appointmentTypeId)}`,
      `calendarID=${encodeURIComponent(calendarId)}`,
      `datetime=${datetime}`, // Acuity docs show datetime should be literal (not URL encoded)
      `${fieldKey}=${encodedSessionId}` // Custom field parameter
    ];
    
    const safariUrl = `https://caninecapers.as.me/schedule.php?${params.join('&')}`;
    console.log('🔗 Safari-compatible URL (without user info):', safariUrl);
    return safariUrl;
  }
  
  // Build base URL with required parameters for non-Safari browsers
  // Put standard Acuity params first, then user info, then custom field LAST
  // This ensures the custom field parameter is processed correctly
  const baseParams = [
    `appointmentTypeIds[]=${encodeURIComponent(appointmentTypeId)}`,
    `calendarIds=${encodeURIComponent(calendarId)}`,
    `datetime=${encodeURIComponent(datetime)}`
  ];
  
  // Add optional user info if provided (standard Acuity fields)
  if (userInfo) {
    if (userInfo.email) {
      baseParams.push(`email=${encodeURIComponent(userInfo.email)}`);
    }
    if (userInfo.firstName) {
      baseParams.push(`firstName=${encodeURIComponent(userInfo.firstName)}`);
    }
    if (userInfo.lastName) {
      baseParams.push(`lastName=${encodeURIComponent(userInfo.lastName)}`);
    }
  }
  
  // Add custom field parameter LAST - this ensures it's processed after standard fields
  baseParams.push(`${fieldKey}=${encodedSessionId}`);
  
  const finalUrl = `https://caninecapers.as.me/schedule/${ACUITY_OWNER_ID}/appointment/${appointmentTypeId}/calendar/${calendarId}?${baseParams.join('&')}`;
  
  // Debug logging
  console.log('🔗 Acuity booking URL params:', {
    sessionId,
    hasUserInfo: !!userInfo,
    userInfoKeys: userInfo ? Object.keys(userInfo).filter(k => userInfo[k as keyof typeof userInfo]) : [],
    fieldParam: `${fieldKey}=${encodedSessionId}`,
    totalParams: baseParams.length
  });
  
  // Use path format WITHOUT datetime segment, but add datetime as query param
  // This matches the working link structure that successfully prefills Session ID
  return finalUrl;
}
