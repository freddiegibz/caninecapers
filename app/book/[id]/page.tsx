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
    const sessionId = searchParams.get('id') || '';
    console.log('📋 Session ID from URL params:', sessionId);
    
    const sessionData: SessionData = {
      id: sessionId,
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

    if (sessionData.id && sessionData.startTime && sessionData.field && sessionData.appointmentTypeID) {
      setSession(sessionData);
    } else {
      console.error('❌ Missing session data:', { id: sessionData.id, startTime: sessionData.startTime, field: sessionData.field, appointmentTypeID: sessionData.appointmentTypeID });
      setError('Session not found. Please return to the dashboard and try again.');
    }

    setLoading(false);
  }, [searchParams, id]);

  const handleBack = () => {
    router.push('/dashboard');
  };

  const toFullIsoWithOffset = (isoZ: string) => {
    // Expecting e.g. 2025-11-16T06:15:00.000Z -> 2025-11-16T06:15:00+00:00
    const trimmed = isoZ.replace('.000Z', 'Z');
    return trimmed.replace('Z', '+00:00');
  };

  const handleConfirmBooking = async () => {
    if (!session) return;

    setBookingLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;

      // Create incomplete session in Supabase BEFORE redirecting to Acuity
      // This ensures the webhook can match the session ID when it comes back
      const { error: createError } = await supabase
        .from('sessions')
        .insert({
          id: session.id, // Use the UUID we generated
          user_id: userId,
          field: session.field,
          date: session.startTime, // ISO datetime string
          status: 'incomplete',
          source: 'app'
        });

      if (createError) {
        console.error('Failed to create incomplete session:', createError);
        // Continue anyway - webhook will create a new session if needed
      } else {
        console.log('✅ Created incomplete session:', session.id);
      }

      // Get user info for prefilling Acuity form
      let userInfo: { email?: string | null; firstName?: string | null; lastName?: string | null } | undefined;
      if (user) {
        const firstName = user.user_metadata?.first_name || user.user_metadata?.given_name || null;
        const lastName = user.user_metadata?.last_name || user.user_metadata?.family_name || null;
        const email = user.email || null;
        
        // Only include userInfo if we have at least email or name
        if (email || firstName || lastName) {
          userInfo = {
            email: email,
            firstName: firstName,
            lastName: lastName
          };
          console.log('Including user info in booking URL:', userInfo);
        }
      }

      // Detect Safari browser
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      console.log('🌐 Browser detection:', { isSafari, userAgent: navigator.userAgent });

      const fullDatetime = toFullIsoWithOffset(session.startTime);
      console.log('Booking with session ID:', session.id);
      const bookingUrl = getAcuityBookingUrl(
        session.id,
        session.calendarID.toString(),
        session.appointmentTypeID.toString(),
        session.date,
        fullDatetime, // pass as selectedTime: function will detect full ISO and use as-is
        userInfo, // optional user info for prefilling
        isSafari // Safari detection for URL format
      );
      console.log('Generated booking URL:', bookingUrl);
      console.log('Full URL length:', bookingUrl.length);
      console.log('URL contains field param:', bookingUrl.includes('field'));
      
      // For Safari, try using window.open or location.assign instead of href
      // Safari sometimes handles direct href assignment differently
      if (isSafari) {
        // Try location.assign which may preserve parameters better in Safari
        window.location.assign(bookingUrl);
      } else {
        window.location.href = bookingUrl;
      }
    } catch (error) {
      console.error('Failed to build booking URL:', error);
      const fullDatetime = toFullIsoWithOffset(session.startTime);
      const fallback = `https://caninecapers.as.me/schedule.php?appointmentType=${encodeURIComponent(session.appointmentTypeID)}&calendarID=${encodeURIComponent(session.calendarID)}&datetime=${encodeURIComponent(fullDatetime)}&field%3A17517976=${encodeURIComponent(session.id)}`;
      window.location.href = fallback;
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
                  <Image
                    src={session.field === 'Central Bark' ? '/locationicon/centralbark.png' : '/locationicon/hydebarki.png'}
                    alt=""
                    width={16}
                    height={16}
                    className={styles.fieldIcon}
                  />
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
