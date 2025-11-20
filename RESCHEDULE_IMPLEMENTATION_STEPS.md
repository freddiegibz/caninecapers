# Rescheduling Implementation - Actionable Steps

## Overview
Implement rescheduling using Acuity's built-in reschedule page (no API calls needed) + webhook updates.

---

## Phase 1: Backend - Update Webhook Handler

### Step 1.1: Add Rescheduled Action Handler
**File**: `app/api/acuity/webhook/route.ts`

**What to do**:
- Add detection for `action === 'rescheduled'` 
- When rescheduled action detected:
  1. Extract `appointmentId`, `datetime`, `calendarID` from webhook
  2. Find existing session: `WHERE acuity_appointment_id = appointmentId`
  3. Update session: `date` = new datetime, `field` = new field name
  4. Keep same `id`, `user_id`, `status = 'complete'`

**Location in code**: After line 219 (after extracting fields, before session matching)

**Logic**:
```
IF action === 'rescheduled':
  - Find session WHERE acuity_appointment_id = appointmentId
  - Update: date, field, updated_at
  - Return success
```

---

## Phase 2: Frontend - Add Reschedule Button

### Step 2.1: Update My Sessions Query
**File**: `app/my-sessions/page.tsx`

**What to do**:
- Modify the Supabase query to include `acuity_appointment_id`
- Current: `.select('id, field, date, acuity_appointment_id')`
- Already includes it! ✅ Just need to use it

**Line**: ~34

---

### Step 2.2: Add Reschedule Button to Session Cards
**File**: `app/my-sessions/page.tsx`

**What to do**:
- In the "Upcoming" sessions section, add a "Reschedule" button next to "Cancel"
- Button should link to: `https://caninecapers.as.me/appointments/{acuity_appointment_id}/reschedule`
- Only show for sessions that have `acuity_appointment_id` and are in the future

**Location**: Around line 162, in the session card header section

**Button placement**:
```
<div className={styles.sessionHeader}>
  <h3>{session.name}</h3>
  <div>
    <RescheduleButton />  // New
    <CancelButton />
  </div>
</div>
```

---

### Step 2.3: Create Reschedule Link Helper Function
**File**: `app/my-sessions/page.tsx` or create `src/utils/acuity.ts` helper

**What to do**:
- Create function: `getRescheduleUrl(acuityAppointmentId: number): string`
- Returns: `https://caninecapers.as.me/appointments/${acuityAppointmentId}/reschedule`
- Use this function in the Reschedule button

---

### Step 2.4: Style Reschedule Button
**File**: `app/my-sessions/page.module.css`

**What to do**:
- Add styles for `.rescheduleButton` matching the existing `.cancelButton` style
- Consider making it secondary style (outline) vs Cancel (primary/destructive)

---

## Phase 3: Testing & Validation

### Step 3.1: Test Reschedule Link
**What to do**:
1. Book a test session
2. Go to "My Sessions"
3. Click "Reschedule" button
4. Verify it opens Acuity reschedule page
5. Verify appointment details are pre-filled

---

### Step 3.2: Test Webhook Update
**What to do**:
1. Reschedule an appointment via Acuity
2. Check webhook logs for `action === 'rescheduled'`
3. Verify session in database updates:
   - `date` field changes
   - `field` field changes (if different field)
   - `updated_at` updates
   - `id` and `user_id` stay the same

---

### Step 3.3: Test UI Update
**What to do**:
1. Reschedule an appointment
2. Wait for webhook to process (or manually refresh)
3. Check "My Sessions" page
4. Verify updated date/time appears
5. Verify field name updates if changed

---

## Phase 4: Edge Cases & Polish

### Step 4.1: Handle Missing Appointment ID
**What to do**:
- If `acuity_appointment_id` is null, hide Reschedule button
- Show message: "Reschedule not available" or just don't show button

---

### Step 4.2: Handle Past Sessions
**What to do**:
- Only show Reschedule button for upcoming sessions
- Past sessions already have "Rebook" button (different action)

---

### Step 4.3: Add Loading State
**What to do**:
- When user clicks Reschedule, optionally show "Opening..." state
- Or just open link directly (simpler)

---

### Step 4.4: Add Confirmation Message
**What to do**:
- After rescheduling via Acuity, user returns to your app
- Optionally show toast/notification: "Session rescheduled successfully"
- Or rely on webhook update showing in UI naturally

---

## Implementation Order

**Recommended sequence**:

1. ✅ **Step 1.1** - Update webhook handler (backend first)
2. ✅ **Step 2.1** - Verify query includes acuity_appointment_id
3. ✅ **Step 2.3** - Create reschedule URL helper function
4. ✅ **Step 2.2** - Add Reschedule button to UI
5. ✅ **Step 2.4** - Style the button
6. ✅ **Step 3.1-3.3** - Test end-to-end
7. ✅ **Step 4.1-4.4** - Handle edge cases

---

## Files to Modify

1. `app/api/acuity/webhook/route.ts` - Add rescheduled handler
2. `app/my-sessions/page.tsx` - Add reschedule button + helper
3. `app/my-sessions/page.module.css` - Style reschedule button
4. (Optional) `src/utils/acuity.ts` - Add reschedule URL helper

---

## Key Points

- **No API calls needed** - Just link to Acuity's page
- **Webhook handles updates** - Acuity sends webhook when rescheduled
- **Same session record** - Update existing, don't create new
- **Simple UX** - User clicks button, Acuity handles the rest





