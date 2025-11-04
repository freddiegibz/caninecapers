#!/bin/bash

# Test script for Acuity webhook
# Usage: ./test-webhook.sh

WEBHOOK_URL="https://caninecapers.vercel.app/api/acuity/webhook"

echo "🧪 Testing Acuity Webhook..."
echo "URL: $WEBHOOK_URL"
echo

# Test 1: Valid booking payload
echo "📤 Test 1: Valid booking for registered user"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "action=scheduled&appointment[id]=12345&appointment[datetime]=2024-01-15T14:30:00-0000&appointment[calendarID]=4783035&appointment[client][email]=test@example.com"
echo -e "\n"

# Test 2: Valid booking for unlinked user
echo "📤 Test 2: Valid booking for unlinked user"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "action=scheduled&appointment[id]=12346&appointment[datetime]=2024-01-16T10:00:00-0000&appointment[calendarID]=6255352&appointment[client][email]=unknown@example.com"
echo -e "\n"

# Test 3: Invalid payload (missing required fields)
echo "📤 Test 3: Invalid payload (missing email)"
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "action=scheduled&appointment[id]=12347&appointment[datetime]=2024-01-17T16:00:00-0000&appointment[calendarID]=4783035"
echo -e "\n"

# Test 4: Health check
echo "📤 Test 4: Health check (GET request)"
curl -X GET "$WEBHOOK_URL"
echo -e "\n"

echo "✅ All tests completed!"
echo "Check Vercel logs for detailed webhook processing information."
