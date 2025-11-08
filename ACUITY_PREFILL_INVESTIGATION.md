# Acuity Scheduling Form Prefill Investigation

## Summary

Investigation of the Acuity Scheduling dynamic form prefill implementation (`field:XXXX=value`) to identify why prefilling may not be working as expected.

---

## 1. Current Implementation Locations

### Primary URL Construction Function
**File:** `src/utils/acuity.ts`  
**Function:** `getAcuityBookingUrl()`  
**Lines:** 5-21

```typescript
export function getAcuityBookingUrl(sessionId: string, calendarId: string, appointmentTypeId: string, date: string, time: string): string {
  // ... timezone logic ...
  const baseUrl = `https://app.acuityscheduling.com/schedule/${ACUITY_OWNER_ID}/appointment/${appointmentTypeId}/calendar/${calendarId}/datetime/${encodedDateTime}?appointmentTypeIds[]=${appointmentTypeId}&calendarIds=${calendarId}&date=${date}&time=${time}&field:${ACUITY_SESSION_FIELD_ID}=${sessionId}`;
  return baseUrl;
}
```

### Where It's Called
1. **`app/book/[id]/page.tsx`** (Line 131-137)
   - Called in `handleConfirmBooking()` after creating an incomplete session
   - Uses `window.location.href` for redirect

2. **Fallback URL** (Line 153)
   - Manual string concatenation when session creation fails
   - Does NOT include field prefill parameter

---

## 2. Current URL Format Being Generated

### Example Generated URL:
```
https://app.acuityscheduling.com/schedule/3e8feaf8/appointment/18525224/calendar/4783035/datetime/2025-11-05T17%3A00%3A00%2B00%3A00?appointmentTypeIds[]=18525224&calendarIds=4783035&date=2025-11-05&time=17:00&field:17508305=abc123-session-id
```

### Configuration Constants:
- **Owner ID:** `3e8feaf8` ✅
- **Session Field ID:** `17508305` ⚠️ (See Issue #1 below)

---

## 3. Identified Issues

### Issue #1: Field ID Mismatch ⚠️ **CRITICAL**

**Problem:** There's a discrepancy between the field ID used in code vs. test scripts.

- **Code uses:** `17508305` (`src/utils/acuity.ts:3`)
- **Test script expects:** `17502393` (`test-acuity-session-id.sh:32`)

**Impact:** If the actual Acuity form field ID is `17502393`, the prefill will never work because the code is targeting the wrong field.

**Location:**
- `src/utils/acuity.ts:3` - `ACUITY_SESSION_FIELD_ID = '17508305'`
- `test-acuity-session-id.sh:32` - Checks for `field:17502393`

---

### Issue #2: Missing URL Encoding ⚠️ **HIGH PRIORITY**

**Problem:** The `sessionId` value is NOT URL-encoded when appended to the query string.

**Current Code (Line 18):**
```typescript
const baseUrl = `...&field:${ACUITY_SESSION_FIELD_ID}=${sessionId}`;
```

**Issue:** If `sessionId` contains special characters (spaces, `&`, `=`, `#`, etc.), they will break the URL structure or be misinterpreted by Acuity.

**Example Problem Scenarios:**
- Session ID: `"session-123 & test"` → URL becomes: `...&field:17508305=session-123 & test` (breaks at `&`)
- Session ID: `"session=123"` → URL becomes: `...&field:17508305=session=123` (creates extra parameter)
- Session ID: `"session#123"` → URL becomes: `...&field:17508305=session#123` (fragment breaks URL)

**Impact:** Even if field ID is correct, special characters in session IDs will cause prefill to fail.

---

### Issue #3: String Concatenation vs. URLSearchParams ⚠️ **MEDIUM PRIORITY**

**Problem:** URL is built using template literal string concatenation instead of `URLSearchParams`, making it error-prone.

**Current Approach:**
```typescript
const baseUrl = `...?appointmentTypeIds[]=${appointmentTypeId}&calendarIds=${calendarId}&date=${date}&time=${time}&field:${ACUITY_SESSION_FIELD_ID}=${sessionId}`;
```

**Issues:**
- No automatic encoding
- Manual handling of array parameters (`appointmentTypeIds[]`)
- Easy to introduce syntax errors
- Harder to maintain

**Better Approach:**
Use `URLSearchParams` for query string construction, then manually append the `field:` parameter (since `URLSearchParams` doesn't support colons in keys).

---

### Issue #4: Fallback URL Missing Field Parameter ⚠️ **MEDIUM PRIORITY**

**Location:** `app/book/[id]/page.tsx:153`

**Problem:** When session creation fails, the fallback URL does NOT include the field prefill parameter.

```typescript
const bookingUrl = `https://app.acuityscheduling.com/schedule.php?owner=${ACUITY_OWNER_ID}&calendarID=${session.calendarID}&appointmentType=${session.appointmentTypeID}&date=${formattedDate}&time=${formattedTime}&source=app`;
```

**Impact:** Users who experience session creation failures will not have the session ID prefilled, breaking the tracking flow.

---

## 4. Verification Checklist

### ✅ What's Working:
- URL structure follows Acuity's canonical format
- Owner ID is correctly set (`3e8feaf8`)
- Datetime encoding is correct (`encodeURIComponent` for datetime segment)
- Parameters are appended at the correct moment (before redirect)
- Uses `window.location.href` (no Next.js routing interference)

### ❌ What's Not Working:
- Field ID may be incorrect (mismatch between code and tests)
- Session ID value is not URL-encoded
- Fallback URL doesn't include field parameter
- No validation of session ID format before URL construction

---

## 5. Recommended Fixes

### Fix #1: Verify and Correct Field ID

**Action:** Confirm the actual Acuity form field ID:
1. Log into Acuity Scheduling admin
2. Navigate to Settings → Intake Forms
3. Find the "Session ID" custom field
4. Note the Field ID (should be numeric, e.g., `17508305` or `17502393`)

**Update:** `src/utils/acuity.ts:3`
```typescript
export const ACUITY_SESSION_FIELD_ID = '17508305'; // Verify this matches Acuity admin
```

---

### Fix #2: URL-Encode Session ID

**Update:** `src/utils/acuity.ts:18`

**Before:**
```typescript
const baseUrl = `...&field:${ACUITY_SESSION_FIELD_ID}=${sessionId}`;
```

**After:**
```typescript
const encodedSessionId = encodeURIComponent(sessionId);
const baseUrl = `...&field:${ACUITY_SESSION_FIELD_ID}=${encodedSessionId}`;
```

---

### Fix #3: Use URLSearchParams for Query String (Optional but Recommended)

**Update:** `src/utils/acuity.ts` (Full function rewrite)

```typescript
export function getAcuityBookingUrl(sessionId: string, calendarId: string, appointmentTypeId: string, date: string, time: string): string {
  // ... timezone logic ...
  const encodedDateTime = encodeURIComponent(isoDateTime);
  
  // Build base URL path
  const basePath = `https://app.acuityscheduling.com/schedule/${ACUITY_OWNER_ID}/appointment/${appointmentTypeId}/calendar/${calendarId}/datetime/${encodedDateTime}`;
  
  // Build query parameters using URLSearchParams
  const params = new URLSearchParams();
  params.append('appointmentTypeIds[]', appointmentTypeId);
  params.append('calendarIds', calendarId);
  params.append('date', date);
  params.append('time', time);
  
  // Append field parameter manually (URLSearchParams doesn't support colons in keys)
  const encodedSessionId = encodeURIComponent(sessionId);
  const queryString = `${params.toString()}&field:${ACUITY_SESSION_FIELD_ID}=${encodedSessionId}`;
  
  return `${basePath}?${queryString}`;
}
```

---

### Fix #4: Add Field Parameter to Fallback URL

**Update:** `app/book/[id]/page.tsx:153`

**Before:**
```typescript
const bookingUrl = `https://app.acuityscheduling.com/schedule.php?owner=${ACUITY_OWNER_ID}&calendarID=${session.calendarID}&appointmentType=${session.appointmentTypeID}&date=${formattedDate}&time=${formattedTime}&source=app`;
```

**After:**
```typescript
// Note: Fallback can't include sessionId since session creation failed
// But if you have a fallback sessionId, include it:
const bookingUrl = `https://app.acuityscheduling.com/schedule.php?owner=${ACUITY_OWNER_ID}&calendarID=${session.calendarID}&appointmentType=${session.appointmentTypeID}&date=${formattedDate}&time=${formattedTime}&source=app`;
// If you want to still try prefill with a generated ID:
// const fallbackSessionId = `fallback_${Date.now()}`;
// const encodedFallbackId = encodeURIComponent(fallbackSessionId);
// const bookingUrl = `...&field:${ACUITY_SESSION_FIELD_ID}=${encodedFallbackId}`;
```

---

## 6. Testing Recommendations

### Test Case 1: Verify Field ID
1. Create a test booking with a known session ID
2. Check Acuity admin to see if the Session ID field was populated
3. If not populated, verify the field ID matches

### Test Case 2: Test URL Encoding
1. Create a session with special characters: `"test & session=123#test"`
2. Generate booking URL
3. Verify the URL is valid and `sessionId` is properly encoded
4. Test the URL in browser and verify Acuity receives the correct value

### Test Case 3: Test Fallback Flow
1. Simulate session creation failure
2. Verify fallback URL is generated
3. Check if field parameter is included (if applicable)

---

## 7. Example Corrected Implementation

### Minimal Fix (Addresses Critical Issues):

```typescript
// src/utils/acuity.ts
export const ACUITY_OWNER_ID = '3e8feaf8';
export const ACUITY_SESSION_FIELD_ID = '17508305'; // ⚠️ VERIFY THIS MATCHES ACUITY ADMIN

export function getAcuityBookingUrl(sessionId: string, calendarId: string, appointmentTypeId: string, date: string, time: string): string {
  // ... existing timezone logic ...
  const encodedDateTime = encodeURIComponent(isoDateTime);
  
  // ✅ FIX: URL-encode sessionId
  const encodedSessionId = encodeURIComponent(sessionId);
  
  // Build URL with properly encoded sessionId
  const baseUrl = `https://app.acuityscheduling.com/schedule/${ACUITY_OWNER_ID}/appointment/${appointmentTypeId}/calendar/${calendarId}/datetime/${encodedDateTime}?appointmentTypeIds[]=${appointmentTypeId}&calendarIds=${calendarId}&date=${date}&time=${time}&field:${ACUITY_SESSION_FIELD_ID}=${encodedSessionId}`;
  
  return baseUrl;
}
```

---

## 8. Next Steps

1. **Immediate:** Verify the correct field ID in Acuity admin
2. **Immediate:** Add URL encoding for `sessionId`
3. **Short-term:** Update test scripts to match code field ID (or vice versa)
4. **Short-term:** Add field parameter to fallback URL (if applicable)
5. **Long-term:** Refactor to use `URLSearchParams` for better maintainability

---

## Files Modified Summary

- **Primary:** `src/utils/acuity.ts` (URL construction)
- **Secondary:** `app/book/[id]/page.tsx` (URL usage and fallback)
- **Test:** `test-acuity-session-id.sh` (field ID mismatch)

---

**Generated:** Investigation completed  
**Status:** Issues identified, fixes recommended

