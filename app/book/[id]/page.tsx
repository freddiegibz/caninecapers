'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '../../../src/lib/supabaseClient';
import { getAcuityBookingUrl } from '../../../src/utils/acuity';
import { formatLondon } from '../../../src/utils/dateTime';
import styles from './page.module.css';

interface SessionData {
  id: string;
  image_url: string;
  date: string;
  time: string;
  length: string;
  field: string;
  price: string;
  calendarID: string;
  startTime: string;
  appointmentTypeID: string;
}

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    // Read session data from URL query parameters
    const sessionData: SessionData = {
      id: searchParams.get('id') || '',
      image_url: searchParams.get('image_url') || '',
      date: searchParams.get('date') || '',
      time: searchParams.get('time') || '',
      length: searchParams.get('length') || '',
      field: searchParams.get('field') || '',
      price: searchParams.get('price') || '',
      calendarID: searchParams.get('calendarID') || '',
      startTime: searchParams.get('startTime') || '',
      appointmentTypeID: searchParams.get('appointmentTypeID') || ''
    };

    console.log('Session data from query params:', sessionData);

    // Check if we have all required session data
    const hasRequiredData = sessionData.id && sessionData.date && sessionData.time && sessionData.field && sessionData.appointmentTypeID;

    if (hasRequiredData) {
      setSession(sessionData);
      console.log('Session data loaded successfully');
    } else {
      console.error('Missing session data in URL parameters');
      setError('Session not found. Please return to the dashboard and try again.');
    }

    setLoading(false);
  }, [searchParams, id]);


  const handleBack = () => {
    router.push('/dashboard');
  };

  const handleConfirmBooking = async () => {
    if (!session) return;

    setBookingLoading(true);

    try {
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.error('Auth check error:', authError);
      }

      // Create incomplete session in database first
      const sessionData = {
        user_id: user?.id || null, // Link to authenticated user if available
        field: session.field,
        date: new Date(session.startTime).toISOString(),
        session_token: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      console.log('Creating session for user:', user?.id || 'anonymous');

      console.log('Creating incomplete session:', sessionData);

      const response = await fetch('/api/sessions/create-incomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const { sessionId, sessionToken } = await response.json();
      console.log('Created incomplete session:', { sessionId, sessionToken });

      // Save booking data with session info
      const bookingData = {
        sessionId,
        sessionToken,
        field: session.field,
        calendarID: session.calendarID,
        appointmentTypeID: session.appointmentTypeID,
        date: session.date,
        time: session.time,
        length: session.length,
        price: session.price,
        startTime: session.startTime
      };

      localStorage.setItem('pendingBooking', JSON.stringify(bookingData));
      console.log('Saved booking data to localStorage:', bookingData);

      // Generate Acuity booking URL using raw UI date/time values
      // Use session.date and session.time exactly as selected (no conversions)
      const selectedDate = session.date; // Already in YYYY-MM-DD format from UI
      const selectedTime = session.time; // Already in HH:MM format from UI (London-correct)

      const bookingUrl = getAcuityBookingUrl(
        sessionId,
        session.calendarID.toString(),
        session.appointmentTypeID.toString(),
        selectedDate,
        selectedTime
      );

      // Validate URL structure before redirect
      console.log('✅ Session ID prefill validation:', {
        format: 'Root query format (calendar view + session ID prefill)',
        fieldId: '17517976',
        sessionId: sessionId,
        encodedSessionId: encodeURIComponent(sessionId),
        urlUsesRootFormat: bookingUrl.startsWith('https://caninecapers.as.me/?'),
        urlContainsField: bookingUrl.includes('field:17517976='),
        urlContainsSessionId: bookingUrl.includes(encodeURIComponent(sessionId)),
        urlContainsDate: bookingUrl.includes('date='),
        urlContainsTime: bookingUrl.includes('time='),
        urlFormat: bookingUrl.startsWith('https://caninecapers.as.me/?') && bookingUrl.includes('field:17517976=') ? 'Correct format (root query + field param, opens calendar view)' : 'incorrect format'
      });

      // Add a brief delay for user feedback before redirecting
      setTimeout(() => {
        window.location.href = bookingUrl;
      }, 1500);
    } catch (error) {
      console.error('Failed to create session:', error);
      // Fallback: redirect without session tracking (can't pre-fill session ID since creation failed)
      // Use raw UI date/time values (no conversions)
      const selectedDate = session.date; // Already in YYYY-MM-DD format from UI
      const selectedTime = session.time; // Already in HH:MM format from UI (London-correct)

      // Use root query format for fallback (without session ID prefill)
      const bookingUrl = `https://caninecapers.as.me/?calendarID=${session.calendarID}&appointmentType=${session.appointmentTypeID}&date=${selectedDate}&time=${selectedTime}`;

      console.log("🗓 selectedDate (UI):", selectedDate);
      console.log("⏰ selectedTime (UI):", selectedTime);
      console.log("🔗 Final booking URL (fallback - no session ID):", bookingUrl);

      // Save basic booking data
      const bookingData = {
        field: session.field,
        calendarID: session.calendarID,
        appointmentTypeID: session.appointmentTypeID,
        date: session.date,
        time: session.time,
        length: session.length,
        price: session.price,
        startTime: session.startTime
      };

      localStorage.setItem('pendingBooking', JSON.stringify(bookingData));

      setTimeout(() => {
        window.location.href = bookingUrl;
      }, 1500);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Loading session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <div className={styles.errorContent}>
            <h1 className={styles.errorTitle}>
              Session Not Found
            </h1>
            <p className={styles.errorMessage}>
              {error}
            </p>
            <button
              onClick={handleBack}
              className={styles.errorButton}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <div className={styles.errorContent}>
            <h1 className={styles.errorTitle}>
              Session Not Found
            </h1>
            <p className={styles.errorMessage}>
              No session data available. Please return to the dashboard and try again.
            </p>
            <button
              onClick={handleBack}
              className={styles.errorButton}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header with Back Button */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <button
            onClick={handleBack}
            className={styles.backButton}
          >
            <span className={styles.backArrow}>←</span>
            <span className={styles.backText}>Back</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Session Card */}
        <div className={styles.sessionCard}>
          {/* Image Section */}
          <div className={styles.imageSection}>
            <Image
              src={session.image_url}
              alt={session.field}
              fill
              className={styles.sessionImage}
            />
            {/* Price Tag */}
            <div className={styles.priceTag}>
              <span className={styles.priceText}>
                {session.price}
              </span>
            </div>
          </div>

          {/* Content Section */}
          <div className={styles.contentSection}>
            <h1 className={styles.pageTitle}>
              Confirm Your Booking
            </h1>

            {/* Session Details */}
            <div className={styles.sessionDetails}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Field</span>
                <span className={`${styles.detailValue} ${styles.field}`}>
                  {session.field}
                </span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Date & Time</span>
                <span className={styles.detailValue}>{formatLondon(session.startTime)}</span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Duration</span>
                <span className={styles.detailValue}>{session.length}</span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Price</span>
                <span className={`${styles.detailValue} ${styles.price}`}>
                  {session.price}
                </span>
              </div>
            </div>

            {/* Book Button */}
            <button
              onClick={handleConfirmBooking}
              disabled={bookingLoading}
              className={styles.bookButton}
            >
              {bookingLoading ? 'Redirecting to payment...' : 'Confirm Booking'}
            </button>
          </div>
        </div>

        {/* Additional Information */}
        <div className={styles.infoSection}>
          <h2 className={styles.infoTitle}>What happens next?</h2>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoBullet}>•</span>
              <span>Your booking will be confirmed immediately</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoBullet}>•</span>
              <span>You&apos;ll receive a confirmation email with session details</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoBullet}>•</span>
              <span>The session will appear in your dashboard</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoBullet}>•</span>
              <span>You can reschedule or cancel up to 24 hours before</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
