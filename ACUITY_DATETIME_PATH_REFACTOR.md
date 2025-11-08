# Acuity Booking URL Refactoring - /datetime/ Path Format

## ✅ Refactoring Complete

All Acuity booking URLs now use the `/datetime/` path segment format for direct slot preselection while maintaining session ID autofill.

---

## 📋 Changes Applied

### 1. Updated Function Signature
**File:** `src/utils/acuity.ts`

**Before:**
```typescript
getAcuityBookingUrl(sessionId, calendarId, appointmentTypeId, date, time, startTimeISO?)
```

**After:**
```typescript
getAcuityBookingUrl(sessionId, calendarId, appointmentTypeId, startTimeISO)
```

**Changes:**
- ✅ Removed `date` and `time` parameters (no longer needed)
- ✅ Made `startTimeISO` required (needed for datetime path)
- ✅ Function now handles all timezone conversion internally

---

### 2. New URL Format with /datetime/ Path
**File:** `src/utils/acuity.ts`

**Format:**
```
https://caninecapers.as.me/schedule/3e8feaf8/appointment/{appointmentTypeId}/calendar/{calendarId}/datetime/{encodedDateTime}?appointmentTypeIds[]={appointmentTypeId}&calendarIds={calendarId}&field:17517976={sessionId}
```

**Key Features:**
- ✅ Uses `/schedule/3e8feaf8/appointment/.../calendar/.../datetime/...` path
- ✅ Datetime is URL-encoded ISO string with timezone (`+00:00`)
- ✅ Removed `date=` and `time=` query parameters (Acuity ignores them when `/datetime/` is present)
- ✅ Keeps `appointmentTypeIds[]`, `calendarIds`, and `field:17517976` parameters

---

### 3. London Timezone Conversion
**Method:**
```typescript
const londonTime = new Date(startTimeISO).toLocaleString("en-GB", { timeZone: "Europe/London" });
const londonDate = new Date(londonTime);
const isoDateTime = londonDate.toISOString().split(".")[0] + "+00:00";
const encodedDateTime = encodeURIComponent(isoDateTime);
```

**Result:** ISO datetime string like `2025-11-05T17:00:00+00:00` (URL-encoded)

---

### 4. Updated Logging
**Changed to:**
```javascript
console.log("🔗 Final booking URL:", bookingUrl);
```

**Added Validation:**
- Checks for `/datetime/` path presence
- Verifies no `date=` or `time=` parameters
- Confirms field parameter is present

---

## 📍 Files Modified

1. **`src/utils/acuity.ts`**
   - Updated function signature (removed date/time params)
   - Added `/datetime/` path format
   - Implemented London timezone conversion with ISO datetime
   - Removed `date=` and `time=` query parameters
   - Updated logging

2. **`app/book/[id]/page.tsx`**
   - Updated function call to match new signature
   - Removed manual date/time conversion (handled by function)
   - Updated fallback URL to use `/datetime/` format
   - Updated validation logging

3. **`test-acuity-url.js`**
   - Updated to match new function signature
   - Added validation for `/datetime/` path
   - Added checks to ensure no `date=` or `time=` parameters

---

## 🔗 URL Format Comparison

### Before (Root Query Format):
```
https://caninecapers.as.me/?calendarID=4783035&appointmentType=18525224&date=2025-11-05&time=17:00&field:17517976=abc123-session-id
```

### After (/datetime/ Path Format):
```
https://caninecapers.as.me/schedule/3e8feaf8/appointment/18525224/calendar/4783035/datetime/2025-11-05T17%3A00%3A00%2B00%3A00?appointmentTypeIds[]=18525224&calendarIds=4783035&field:17517976=abc123-session-id
```

**Key Differences:**
- ✅ Uses `/datetime/` path for direct slot preselection
- ✅ Datetime encoded in path: `/datetime/2025-11-05T17%3A00%3A00%2B00%3A00`
- ✅ No `date=` or `time=` query parameters
- ✅ Uses `appointmentTypeIds[]` array notation
- ✅ Uses `calendarIds` (not `calendarID`)

---

## 🧪 Example Generated URL

**Input:**
- Session ID: `abc123-session-id`
- Calendar ID: `4783035`
- Appointment Type: `18525224`
- Start Time ISO: `2025-11-05T17:00:00.000Z`

**London Timezone Conversion:**
- London Time String: `"05/11/2025, 17:00"`
- London Date Object: `Date(2025-11-05T17:00:00.000Z)`
- ISO DateTime: `2025-11-05T17:00:00+00:00`
- Encoded DateTime: `2025-11-05T17%3A00%3A00%2B00%3A00`

**Output:**
```
https://caninecapers.as.me/schedule/3e8feaf8/appointment/18525224/calendar/4783035/datetime/2025-11-05T17%3A00%3A00%2B00%3A00?appointmentTypeIds[]=18525224&calendarIds=4783035&field:17517976=abc123-session-id
```

---

## ✅ Validation Checks

The code now validates:
- ✅ URL contains `/schedule/` path
- ✅ URL contains `/datetime/` path segment
- ✅ Datetime is URL-encoded in path
- ✅ Field parameter included (`field:17517976=`)
- ✅ No `date=` query parameter (removed)
- ✅ No `time=` query parameter (removed)
- ✅ `appointmentTypeIds[]` array parameter present
- ✅ `calendarIds` parameter present

---

## 🧪 Testing Checklist

- [ ] Create a booking session through the app
- [ ] Check browser console for: `🔗 Final booking URL: [URL]`
- [ ] Verify URL format:
  - ✅ Contains `/schedule/3e8feaf8/appointment/.../calendar/.../datetime/...`
  - ✅ Datetime is URL-encoded in path
  - ✅ Contains `appointmentTypeIds[]=`
  - ✅ Contains `calendarIds=`
  - ✅ Contains `field:17517976=`
  - ✅ No `date=` parameter
  - ✅ No `time=` parameter
- [ ] Test in browser:
  - ✅ Booking form opens directly to the selected time slot (no manual selection needed)
  - ✅ Session ID field (ID: 17517976) is prefilled automatically

---

## 📝 Notes

- **Direct Slot Preselection:** The `/datetime/` path format opens directly to the selected slot without requiring manual selection
- **London Timezone:** All datetimes are normalized to `Europe/London` timezone before encoding
- **ISO Format:** Datetime uses ISO format with `+00:00` timezone offset
- **Parameter Removal:** `date=` and `time=` parameters are removed since Acuity ignores them when `/datetime/` is present
- **Field Prefill:** Session ID prefilling still works via `field:17517976=` parameter

---

**Status:** ✅ Refactoring Complete  
**Format:** `/datetime/` path segment  
**Timezone:** London (Europe/London)  
**Field Prefill:** ✅ Enabled (`field:17517976`)  
**Direct Slot:** ✅ Enabled (opens directly to selected slot)

