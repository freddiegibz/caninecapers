# Acuity Booking URL Refactoring - .as.me Domain Format

## ✅ Refactoring Complete

All Acuity booking URLs have been refactored to use the `.as.me` domain format for reliable date/time preselection and session ID autofill.

---

## 📋 Changes Summary

### 1. Main Utility Function
**File:** `src/utils/acuity.ts`

**Before:**
```typescript
const bookingUrl = `https://app.acuityscheduling.com/schedule.php?owner=${ACUITY_OWNER_ID}&calendarID=${calendarId}&appointmentType=${appointmentTypeId}&date=${date}&time=${time}&field:${ACUITY_SESSION_FIELD_ID}=${encodedSessionId}`;
```

**After:**
```typescript
const bookingUrl = `https://caninecapers.as.me/?calendarID=${calendarId}&appointmentType=${appointmentTypeId}&date=${formattedDate}&time=${formattedTime}&field:${ACUITY_SESSION_FIELD_ID}=${encodedSessionId}`;
```

**Key Changes:**
- ✅ Changed domain from `app.acuityscheduling.com/schedule.php` to `caninecapers.as.me`
- ✅ Removed `owner=` parameter (not needed with .as.me)
- ✅ Added London timezone conversion for accurate date/time
- ✅ Added optional `startTimeISO` parameter for timezone conversion
- ✅ Enhanced logging with timezone conversion details

---

### 2. Booking Confirmation Page
**File:** `app/book/[id]/page.tsx`

**Changes:**
- ✅ Added London timezone conversion before calling `getAcuityBookingUrl()`
- ✅ Passes ISO string to utility function for accurate conversion
- ✅ Updated validation logging to check for `.as.me` format
- ✅ Updated fallback URL to use `.as.me` format
- ✅ Removed unused `ACUITY_OWNER_ID` import

**London Timezone Conversion:**
```typescript
const londonTime = new Date(startTimeISO).toLocaleString("en-GB", { 
  timeZone: "Europe/London",
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
});

const [datePart, timePart] = londonTime.split(', ');
const [day, month, year] = datePart.split('/');
const formattedDate = `${year}-${month}-${day}`;
const formattedTime = timePart;
```

---

### 3. Book Page Iframe
**File:** `app/book/page.tsx`

**Before:**
```typescript
src={`https://app.acuityscheduling.com/schedule.php?owner=${ACUITY_OWNER_ID}&calendarID=${selectedField}&appointmentTypeID=${selectedType}`}
```

**After:**
```typescript
src={`https://caninecapers.as.me/?calendarID=${selectedField}&appointmentTypeID=${selectedType}`}
```

**Changes:**
- ✅ Updated iframe src to use `.as.me` domain
- ✅ Removed `owner=` parameter
- ✅ Removed unused `ACUITY_OWNER_ID` import

---

### 4. Test File
**File:** `test-acuity-url.js`

**Changes:**
- ✅ Updated to test `.as.me` format
- ✅ Added validation checks for new format
- ✅ Added ISO string parameter for timezone conversion testing

---

## 🔗 URL Format Comparison

### Before (Legacy format):
```
https://app.acuityscheduling.com/schedule.php?owner=3e8feaf8&calendarID=4783035&appointmentType=18525224&date=2025-11-05&time=17:00&field:17517976=abc123-session-id
```

### After (.as.me format):
```
https://caninecapers.as.me/?calendarID=4783035&appointmentType=18525224&date=2025-11-05&time=17:00&field:17517976=abc123-session-id
```

**Key Differences:**
- ✅ Simpler domain: `caninecapers.as.me`
- ✅ No `owner=` parameter needed
- ✅ No `/schedule.php` path needed
- ✅ Direct query parameters
- ✅ London timezone conversion ensures accurate date/time

---

## 📍 Files Modified

1. **`src/utils/acuity.ts`**
   - Refactored to use `.as.me` format
   - Added London timezone conversion
   - Enhanced logging

2. **`app/book/[id]/page.tsx`**
   - Added London timezone conversion
   - Updated validation logging
   - Updated fallback URL
   - Removed unused import

3. **`app/book/page.tsx`**
   - Updated iframe src to `.as.me`
   - Removed unused import

4. **`test-acuity-url.js`**
   - Updated test to validate `.as.me` format

---

## ✅ Validation & Logging

### Console Logs Added:

**In `getAcuityBookingUrl()`:**
```javascript
console.log("🔗 Generated booking link:", bookingUrl);
console.log("📋 London timezone conversion:", {
  originalDate: date,
  originalTime: time,
  londonDate: formattedDate,
  londonTime: formattedTime,
  sessionId: sessionId,
  fieldParameter: `field:${ACUITY_SESSION_FIELD_ID}=${encodedSessionId}`
});
```

**In `app/book/[id]/page.tsx`:**
```javascript
console.log('✅ Session ID prefill validation:', {
  format: '.as.me',
  fieldId: '17517976',
  sessionId: sessionId,
  encodedSessionId: encodeURIComponent(sessionId),
  urlContainsField: bookingUrl.includes('field:17517976='),
  urlContainsSessionId: bookingUrl.includes(encodeURIComponent(sessionId)),
  urlFormat: bookingUrl.startsWith('https://caninecapers.as.me') ? '.as.me (correct format)' : 'legacy format'
});
```

---

## 🧪 Example Generated URL

**Input:**
- Session ID: `abc123-session-id`
- Calendar ID: `4783035`
- Appointment Type: `18525224`
- Date: `2025-11-05`
- Time: `17:00`
- Start Time ISO: `2025-11-05T17:00:00.000Z`

**Output:**
```
https://caninecapers.as.me/?calendarID=4783035&appointmentType=18525224&date=2025-11-05&time=17:00&field:17517976=abc123-session-id
```

**With Encoded Session ID (if special characters):**
If sessionId = `"session-123 & test"`:
```
https://caninecapers.as.me/?calendarID=4783035&appointmentType=18525224&date=2025-11-05&time=17:00&field:17517976=session-123%20%26%20test
```

---

## ✅ Features Preserved

- ✅ Error handling intact
- ✅ `pendingBooking` localStorage logic preserved
- ✅ Fallback flow maintained (without session ID if creation fails)
- ✅ All existing functionality preserved
- ✅ Session ID URL encoding maintained

---

## 🧪 Testing Checklist

- [ ] Create a booking session through the app
- [ ] Check browser console for validation logs
- [ ] Verify URL uses `caninecapers.as.me` domain
- [ ] Verify date/time are in London timezone
- [ ] Verify field parameter: `field:17517976=...`
- [ ] Test in browser - booking form should open with:
  - ✅ Correct date preselected
  - ✅ Correct time preselected
  - ✅ Session ID field (ID: 17517976) prefilled

---

## 📝 Notes

- **Timezone Conversion:** All dates/times are converted to London timezone (`Europe/London`) before being added to the URL
- **Format:** The `.as.me` format handles both date/time preselection and field prefilling directly through query parameters
- **No Legacy Parameters:** Removed `owner=`, `/schedule.php`, and `/datetime/` paths - not needed with `.as.me`
- **Encoding:** Session ID is properly URL-encoded to handle special characters

---

**Status:** ✅ Refactoring Complete  
**Format:** `.as.me` domain  
**Timezone:** London (Europe/London)  
**Field Prefill:** ✅ Enabled (`field:17517976`)

