// Test Acuity booking URL generation
const { getAcuityBookingUrl } = require('./src/utils/acuity.ts');

console.log('Testing Acuity booking URL generation (/datetime/ path format with raw UI values)...');

// Test with example data (raw UI values - no conversions)
const testSessionId = 'test-session-uuid-123';
const testCalendarId = '6255352';
const testAppointmentTypeId = '18525224';
const testSelectedDate = '2025-11-05'; // YYYY-MM-DD from UI
const testSelectedTime = '17:00'; // HH:MM from UI (London-correct)

console.log('Input parameters (raw UI values):');
console.log('  sessionId:', testSessionId);
console.log('  calendarId:', testCalendarId);
console.log('  appointmentTypeId:', testAppointmentTypeId);
console.log('  selectedDate (UI):', testSelectedDate);
console.log('  selectedTime (UI):', testSelectedTime);
console.log('');

const generatedUrl = getAcuityBookingUrl(testSessionId, testCalendarId, testAppointmentTypeId, testSelectedDate, testSelectedTime);
console.log('Generated URL:');
console.log(generatedUrl);
console.log('');

console.log('Validation checks:');
console.log('  Uses .as.me domain:', generatedUrl.includes('caninecapers.as.me'));
console.log('  Contains /schedule/ path:', generatedUrl.includes('/schedule/'));
console.log('  Contains /datetime/ path:', generatedUrl.includes('/datetime/'));
console.log('  Contains field:17517976:', generatedUrl.includes('field:17517976='));
console.log('  Contains encoded sessionId:', generatedUrl.includes(encodeURIComponent(testSessionId)));
console.log('  Contains appointmentTypeIds[]:', generatedUrl.includes('appointmentTypeIds[]'));
console.log('  Contains calendarIds:', generatedUrl.includes('calendarIds='));
console.log('  No date= parameter:', !generatedUrl.includes('date='));
console.log('  No time= parameter:', !generatedUrl.includes('time='));
console.log('  Full field parameter:', generatedUrl.match(/field:17517976=[^&]*/)?.[0] || 'NOT FOUND');
console.log('');

console.log('Expected format:');
console.log('  https://caninecapers.as.me/schedule/3e8feaf8/appointment/{appointmentTypeId}/calendar/{calendarId}/datetime/{encodedDateTime}?appointmentTypeIds[]={appointmentTypeId}&calendarIds={calendarId}&field:17517976={sessionID}');
console.log('');
console.log('Note: Uses raw UI date/time values without any conversions');
