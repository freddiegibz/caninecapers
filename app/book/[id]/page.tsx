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
  const [debugInfo, setDebugInfo] = useState<{ url: string; isSafari: boolean; userAgent: string } | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [showSessionIdModal, setShowSessionIdModal] = useState(false);

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
      // Store email so webhook can match by email address
      const { error: createError } = await supabase
        .from('sessions')
        .insert({
          id: session.id, // Use the UUID we generated
          user_id: userId,
          field: session.field,
          date: session.startTime, // ISO datetime string
          status: 'incomplete',
          client_email: user?.email?.toLowerCase().trim() || null // Store email for webhook matching
        });

      if (createError) {
        console.error('Failed to create incomplete session:', createError);
        // Continue anyway - webhook will create a new session if needed
      } else {
        console.log('✅ Created incomplete session:', session.id);
      }

      // Get user info for prefilling Acuity form (firstName, lastName, email, phone)
      // Sessions will be matched by email, not Session ID
      let userInfo: { email?: string | null; firstName?: string | null; lastName?: string | null; phone?: string | null } | undefined;
      if (user) {
        const firstName = user.user_metadata?.first_name || user.user_metadata?.given_name || null;
        const lastName = user.user_metadata?.last_name || user.user_metadata?.family_name || null;
        const email = user.email || null;
        const phone = user.user_metadata?.phone || null;
        
        // Only include userInfo if we have at least email (required for matching)
        if (email) {
          userInfo = {
            email: email,
            firstName: firstName,
            lastName: lastName,
            phone: phone
          };
          console.log('Including user info in booking URL (matched by email):', userInfo);
        }
      }

      // Detect mobile devices and Safari browser
      // Be more specific - only detect actual mobile devices, not desktop browsers
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent);
      // Check screen width as additional check (mobile is typically < 768px)
      const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 768;
      const isMobile = isMobileDevice && isSmallScreen;
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) && !userAgent.includes('brave');
      console.log('🌐 Browser detection:', { 
        isMobile,
        isSafari, 
        userAgent: navigator.userAgent,
        hasUserInfo: !!userInfo,
        userInfoData: userInfo
      });

      const fullDatetime = toFullIsoWithOffset(session.startTime);
      console.log('Booking with session ID:', session.id);
      const bookingUrl = getAcuityBookingUrl(
        session.id,
        session.calendarID.toString(),
        session.appointmentTypeID.toString(),
        session.date,
        fullDatetime, // pass as selectedTime: function will detect full ISO and use as-is
        userInfo, // optional user info for prefilling
        isSafari, // Safari detection for URL format
        isMobile // Mobile detection - use schedule.php format
      );
      console.log('Generated booking URL:', bookingUrl);
      console.log('Full URL length:', bookingUrl.length);
      console.log('URL contains field param:', bookingUrl.includes('field'));
      
      // Store debug info for visual display (useful for mobile Safari)
      setDebugInfo({
        url: bookingUrl,
        isSafari,
        userAgent: navigator.userAgent
      });
      
      // Show confirmation modal before redirecting
      setShowSessionIdModal(true);
      
      // Store URL for later redirect
      setRedirectUrl(bookingUrl);
    } catch (error) {
      console.error('Failed to build booking URL:', error);
      const fullDatetime = toFullIsoWithOffset(session.startTime);
      // Fallback: minimal URL with just appointment type and datetime (no Session ID)
      const fallback = `https://caninecapers.as.me/schedule.php?appointmentType=${encodeURIComponent(session.appointmentTypeID)}&calendarID=${encodeURIComponent(session.calendarID)}&datetime=${encodeURIComponent(fullDatetime)}`;
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
              disabled={bookingLoading || showSessionIdModal}
              className={styles.bookButton}
            >
              {bookingLoading ? 'Preparing...' : 'Confirm Booking'}
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

        {/* Booking Confirmation Modal - Shows before redirect */}
        {showSessionIdModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>Ready to Book</h3>
                <button
                  className={styles.modalClose}
                  onClick={() => {
                    setShowSessionIdModal(false);
                    // Open Acuity in new window after closing modal
                    if (redirectUrl) {
                      window.open(redirectUrl, '_blank', 'noopener,noreferrer');
                    }
                  }}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalBody}>
                <p className={styles.modalText}>
                  Your booking form will open in a new window with your details prefilled.
                  Your session will be automatically linked to your account using your email address.
                </p>
              </div>
              <div className={styles.modalFooter}>
                <button
                  className={styles.continueButton}
                  onClick={() => {
                    setShowSessionIdModal(false);
                    // Open Acuity in new window
                    if (redirectUrl) {
                      window.open(redirectUrl, '_blank', 'noopener,noreferrer');
                    }
                  }}
                >
                  Continue to Booking
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Debug Panel - Shows URL on mobile Safari */}
        {debugInfo && (
          <div className={styles.debugPanel}>
            <button
              onClick={() => setShowDebug(!showDebug)}
              className={styles.debugToggle}
            >
              {showDebug ? '▼' : '▶'} Debug Info {debugInfo.isSafari ? '(Safari)' : ''}
            </button>
            {showDebug && (
              <div className={styles.debugContent}>
                <div className={styles.debugItem}>
                  <strong>Generated URL:</strong>
                  <div className={styles.debugUrl}>{debugInfo.url}</div>
                </div>
                <div className={styles.debugItem}>
                  <strong>Browser:</strong> {debugInfo.isSafari ? 'Safari' : 'Other'}
                </div>
                <div className={styles.debugItem}>
                  <strong>User Agent:</strong>
                  <div className={styles.debugUserAgent}>{debugInfo.userAgent}</div>
                </div>
                <div className={styles.debugItem}>
                  <strong>URL Length:</strong> {debugInfo.url.length} characters
                </div>
                <div className={styles.debugItem}>
                  <strong>Has User Info:</strong> {debugInfo.url.includes('email=') || debugInfo.url.includes('firstName=') || debugInfo.url.includes('phone=') ? 'Yes' : 'No'}
                </div>
                <div className={styles.debugItem}>
                  <strong>Has Datetime:</strong> {debugInfo.url.includes('datetime=') ? 'Yes' : 'No'}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
