#!/bin/bash

# Test script for Acuity webhook
# Usage: ./test-webhook.sh

WEBHOOK_URL="https://caninecapers.vercel.app/api/acuity/webhook"

echo "🧪 Testing Acuity Webhook..."
echo "URL: $WEBHOOK_URL"
echo

# Test 1: Valid app-generated booking
echo "📤 Test 1: Valid app-generated booking for registered user"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "action=scheduled&appointment[id]=12345&appointment[datetime]=2024-01-15T14:30:00-0000&appointment[calendarID]=4783035&appointment[client][email]=test@example.com&source=app"
echo -e "\n"

# Test 1b: External booking (should be logged but not processed)
echo "📤 Test 1b: External booking (logged but not processed)"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "action=scheduled&appointment[id]=99999&appointment[datetime]=2024-01-15T16:00:00-0000&appointment[calendarID]=4783035&appointment[client][email]=external@example.com"
echo -e "\n"

# Test 2: Valid app-generated booking for unlinked user
echo "📤 Test 2: Valid app-generated booking for unlinked user"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "action=scheduled&appointment[id]=12346&appointment[datetime]=2024-01-16T10:00:00-0000&appointment[calendarID]=6255352&appointment[client][email]=unknown@example.com&source=app"
echo -e "\n"

# Test 3: Invalid app-generated payload (missing email)
echo "📤 Test 3: Invalid app-generated payload (missing email)"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "action=scheduled&appointment[id]=12347&appointment[datetime]=2024-01-17T16:00:00-0000&appointment[calendarID]=4783035&source=app"
echo -e "\n"

# Test 4: Health check
echo "📤 Test 4: Health check (GET request)"
curl -X GET "$WEBHOOK_URL"
echo -e "\n"

echo "✅ All tests completed!"
echo "Check Vercel logs for detailed webhook processing information."
