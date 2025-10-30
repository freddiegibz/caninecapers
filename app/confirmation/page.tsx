'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../src/lib/supabaseClient';
import styles from './page.module.css';

interface BookingData {
  field: string;
  calendarID: string;
  appointmentTypeID: string;
  date: string;
  time: string;
  length: string;
  price: string;
  startTime: string;
}

export default function ConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const handleConfirmation = async () => {
      // Check if we have a success status from Acuity
      // Acuity may use different parameter names, so check for common success indicators
      const status = searchParams.get('status');
      const appointmentId = searchParams.get('appointmentID'); // Some systems use appointmentID
      const isSuccessRedirect = status === 'success' || appointmentId || searchParams.get('confirmed');

      if (isSuccessRedirect) {
        try {
          // Check if user is logged in
          const { data: { user }, error: userError } = await supabase.auth.getUser();

          if (userError || !user) {
            console.error('User not authenticated:', userError);
            setMessage('Please log in to save your booking.');
            setLoading(false);
            return;
          }

          // Retrieve pending booking from localStorage
          const pendingBookingData = localStorage.getItem('pendingBooking');

          if (!pendingBookingData) {
            console.error('No pending booking found in localStorage');
            setMessage('Booking data not found. Please try booking again.');
            setLoading(false);
            return;
          }

          const booking: BookingData = JSON.parse(pendingBookingData);
          console.log('Retrieved pending booking:', booking);

          // Insert booking into Supabase
          const { error: insertError } = await supabase
            .from('Bookings')
            .insert({
              user_id: user.id,
              field: booking.field,
              calendar_id: booking.calendarID,
              appointment_type_id: booking.appointmentTypeID,
              start_time: `${booking.date}T${booking.time}`,
              duration: booking.length,
              price: booking.price,
              status: 'confirmed'
            });

          if (insertError) {
            console.error('Error inserting booking:', insertError);
            setMessage('There was an error saving your booking. Please contact support.');
          } else {
            // Success - remove pending booking from localStorage
            localStorage.removeItem('pendingBooking');
            console.log('Booking saved successfully');
            setMessage('🎉 Your booking has been saved to your account!');
          }

        } catch (error) {
          console.error('Unexpected error:', error);
          setMessage('An unexpected error occurred. Please try again.');
        }
      } else {
        setMessage('Booking confirmation not found.');
      }

      setLoading(false);
    };

    handleConfirmation();
  }, [searchParams]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Processing your booking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.confirmationCard}>
        <div className={styles.content}>
          <h1 className={styles.title}>Booking Confirmation</h1>
          <p className={styles.message}>{message}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className={styles.button}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
