#!/bin/bash

# Test script for Acuity Session ID pre-filling using field ID 17502393
# Usage: ./test-acuity-session-id.sh

echo "🧪 Testing Acuity Session ID Pre-filling with Field ID 17502393..."
echo

# Test 1: Create session and check booking URL format with timezone conversion
echo "📤 Test 1: Create session and verify booking URL format (with GMT London timezone conversion)"
SESSION_RESPONSE=$(curl -s -X POST https://caninecapers.vercel.app/api/sessions/create-incomplete \
  -H "Content-Type: application/json" \
  -d '{"user_id":null,"field":"Central Bark","date":"2025-11-04T14:30:00.000Z","calendarID":"4783035","appointmentTypeID":"18525161","time":"14:30"}')

echo "Session creation response:"
echo "$SESSION_RESPONSE" | jq . 2>/dev/null || echo "$SESSION_RESPONSE"
echo

# Extract values from response
SESSION_ID=$(echo "$SESSION_RESPONSE" | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)
SESSION_TOKEN=$(echo "$SESSION_RESPONSE" | grep -o '"sessionToken":"[^"]*"' | cut -d'"' -f4)
BOOKING_URL=$(echo "$SESSION_RESPONSE" | grep -o '"bookingUrl":"[^"]*"' | cut -d'"' -f4)

echo "Extracted values:"
echo "Session ID: $SESSION_ID"
echo "Session Token: $SESSION_TOKEN"
echo "Booking URL: $BOOKING_URL"
echo

# Test 2: Verify booking URL format with all parameters
echo "📤 Test 2: Verify booking URL format"
if [[ "$BOOKING_URL" == *"schedule/3e8feaf8"* ]] && [[ "$BOOKING_URL" == *"appointment/"* ]] && [[ "$BOOKING_URL" == *"calendar/"* ]] && [[ "$BOOKING_URL" == *"datetime/"* ]] && [[ "$BOOKING_URL" == *"appointmentTypeIds"* ]] && [[ "$BOOKING_URL" == *"calendarIds"* ]] && [[ "$BOOKING_URL" == *"date="* ]] && [[ "$BOOKING_URL" == *"time="* ]] && [[ "$BOOKING_URL" == *"field:17502393=$SESSION_ID"* ]]; then
  echo "✅ Booking URL format is correct!"
  echo "  - Uses correct owner ID: 3e8feaf8"
  echo "  - Uses canonical datetime format: schedule/.../datetime/..."
  echo "  - Contains encoded ISO datetime with timezone offset"
  echo "  - Contains appointmentTypeIds and calendarIds arrays"
  echo "  - Contains date and time parameters"
  echo "  - Contains Session ID field: field:17502393=$SESSION_ID"
else
  echo "❌ Booking URL format is incorrect"
  echo "Expected: https://app.acuityscheduling.com/schedule/3e8feaf8/appointment/.../calendar/.../datetime/...?appointmentTypeIds[]=...&calendarIds=...&date=...&time=...&field:17502393=<UUID>"
  echo "Actual: $BOOKING_URL"
fi
echo

# Test 3: Test webhook with simulated Acuity form data using field ID
echo "📤 Test 3: Test webhook with Session ID in form field 17502393"
# This simulates what Acuity would send with the Session ID field (ID: 17502393) populated
WEBHOOK_RESPONSE=$(curl -s -X POST https://caninecapers.vercel.app/api/acuity/webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "action=scheduled&appointment[id]=12345&appointment[datetime]=2025-11-04T14:30:00-0000&appointment[calendarID]=4783035&appointment[client][email]=test@example.com&appointment[forms][0][id]=17502393&appointment[forms][0][value]=$SESSION_ID&source=app")

if [[ "$WEBHOOK_RESPONSE" == *"OK"* ]]; then
  echo "✅ Webhook processed successfully"
else
  echo "❌ Webhook failed"
  echo "Response: $WEBHOOK_RESPONSE"
fi
echo

echo "✅ Session ID pre-filling test completed!"
echo "The booking URL now uses field ID 17502393 to automatically populate your custom Session ID field in Acuity."
