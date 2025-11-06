// Test Acuity booking URL generation
const { getAcuityBookingUrl } = require('./src/utils/acuity.ts');

console.log('Testing Acuity booking URL generation...');

// Test with example data
const testSessionId = 'test-session-uuid-123';
const testCalendarId = '6255352';
const testAppointmentTypeId = '18525224';
const testDate = '2025-11-05';
const testTime = '17:00';

console.log('Input parameters:');
console.log('  sessionId:', testSessionId);
console.log('  calendarId:', testCalendarId);
console.log('  appointmentTypeId:', testAppointmentTypeId);
console.log('  date:', testDate);
console.log('  time:', testTime);
console.log('');

const generatedUrl = getAcuityBookingUrl(testSessionId, testCalendarId, testAppointmentTypeId, testDate, testTime);
console.log('Generated URL:');
console.log(generatedUrl);
console.log('');

console.log('Checking if Session ID field is included:');
console.log('Contains field:17508305:', generatedUrl.includes('field:17508305=' + testSessionId));
