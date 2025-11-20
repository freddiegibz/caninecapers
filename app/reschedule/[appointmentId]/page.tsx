'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '../../../src/lib/supabaseClient';
import { formatLondon } from '../../../src/utils/dateTime';
import styles from './page.module.css';

interface Appointment {
  id: string;
  appointmentTypeID: string;
  calendarID: string;
  datetime: string;
  fieldName: string;
  length: string;
  price: string;
}

interface AvailableSlot {
  startTime: string;
  calendarID: number;
  fieldName: string;
}

export default function ReschedulePage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.appointmentId as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduling, setRescheduling] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState(0); // 0 = next 5 days, 1 = next 5-10 days, etc.

  useEffect(() => {
    if (appointmentId) {
      loadAppointment();
      loadAvailableSlots();
    }
  }, [appointmentId, selectedDateRange]);

  const loadAppointment = async () => {
    try {
      const { data: session, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('acuity_appointment_id', appointmentId)
        .single();

      if (error) throw error;

      if (session) {
        setAppointment({
          id: session.acuity_appointment_id,
          appointmentTypeID: session.appointment_type_id,
          calendarID: session.calendar_id,
          datetime: session.datetime,
          fieldName: session.calendar_id === '4783035' ? 'Central Bark' : 'Hyde Bark',
          length: session.appointment_type_id === '18525224' ? '30 min' :
                  session.appointment_type_id === '29373489' ? '45 min' : '1 hour',
          price: session.appointment_type_id === '18525224' ? '£5.50' :
                 session.appointment_type_id === '29373489' ? '£8.25' : '£11.00'
        });
      }
    } catch (error) {
      console.error('Error loading appointment:', error);
    }
  };

  const loadAvailableSlots = async () => {
    try {
      setLoading(true);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + (selectedDateRange * 5) + 1); // Start from tomorrow + offset
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 5); // Next 5 days

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const response = await fetch(
        `/api/availability?appointmentTypeID=${appointment?.appointmentTypeID}&startDate=${startDateStr}&endDate=${endDateStr}`
      );

      if (!response.ok) throw new Error('Failed to load slots');

      const slots = await response.json();
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error loading slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const submitRescheduleToSlot = async (slot: { startTime: string; calendarID: number }) => {
    if (!appointment) return;

    try {
      setRescheduling(true);
      const response = await fetch('/api/acuity/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment.id,
          newDateTime: slot.startTime,
          calendarID: slot.calendarID
        })
      });

      if (!response.ok) throw new Error('Reschedule failed');

      // Redirect back to my-sessions
      router.push('/my-sessions');
    } catch (error) {
      console.error('Reschedule error:', error);
      alert('Failed to reschedule appointment. Please try again.');
    } finally {
      setRescheduling(false);
    }
  };

  const getDateRangeOptions = () => {
    const options = [];
    for (let i = 0; i < 5; i++) { // Show 5 ranges
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + (i * 5) + 1);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 4);

      const startMonth = startDate.toLocaleDateString('en-GB', { month: 'short' });
      const endMonth = endDate.toLocaleDateString('en-GB', { month: 'short' });
      const startDay = startDate.getDate();
      const endDay = endDate.getDate();

      const label = startMonth === endMonth
        ? `${startDay}-${endDay} ${startMonth}`
        : `${startDay} ${startMonth} - ${endDay} ${endMonth}`;

      options.push({ value: i, label });
    }
    return options;
  };

  const groupSlotsByDate = () => {
    const grouped: { [date: string]: AvailableSlot[] } = {};
    availableSlots.forEach(slot => {
      const date = new Date(slot.startTime).toISOString().split('T')[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(slot);
    });
    return grouped;
  };

  if (!appointment) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading appointment details...</div>
      </div>
    );
  }

  const groupedSlots = groupSlotsByDate();
  const dateOptions = getDateRangeOptions();

  return (
    <>
      <header className={styles.navbar}>
        <div className={styles.navbarContent}>
          <div className={styles.greeting}>
            <Link href="/dashboard" className={styles.logoLink}>
              <Image
                src="/caninecaperslogosymbol.png"
                alt="Canine Capers"
                width={32}
                height={32}
                className={styles.logoIcon}
              />
            </Link>
            <h1 className={styles.brandTitle}>Canine Capers</h1>
          </div>
        </div>
      </header>

      <div className={styles.container}>
        <main className={styles.main}>
          {/* Page Header */}
          <header className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Reschedule Session</h1>
            <p className={styles.pageSubtitle}>
              Current: {formatLondon(appointment.datetime)} at {appointment.fieldName}
            </p>
            <div className={styles.headerDivider}></div>
          </header>

          {/* Date Range Selector */}
          <div className={styles.dateSelectorSection}>
            <div className={styles.dateSelector}>
              <label className={styles.dateLabel}>Select date range:</label>
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(Number(e.target.value))}
                className={styles.dateSelect}
              >
                {dateOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Available Slots */}
          <section className={styles.slotsSection}>
            {loading ? (
              <div className={styles.loadingState}>Loading available slots...</div>
            ) : Object.keys(groupedSlots).length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📅</div>
                <h3 className={styles.emptyTitle}>No slots available</h3>
                <p className={styles.emptyText}>Try selecting a different date range.</p>
              </div>
            ) : (
              <div className={styles.slotsContainer}>
                {Object.entries(groupedSlots).map(([date, slots]) => (
                  <div key={date} className={styles.dateGroup}>
                    <h3 className={styles.dateHeader}>
                      {new Date(date).toLocaleDateString('en-GB', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })}
                    </h3>
                    <div className={styles.slotsGrid}>
                      {slots.map((slot, idx) => (
                        <div key={idx} className={styles.slotCard}>
                          <div className={styles.slotTime}>
                            {new Date(slot.startTime).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false
                            })}
                          </div>
                          <div className={styles.slotField}>{slot.fieldName}</div>
                          <div className={styles.slotLength}>{appointment.length}</div>
                          <button
                            className={styles.selectSlotBtn}
                            onClick={() => submitRescheduleToSlot(slot)}
                            disabled={rescheduling}
                          >
                            {rescheduling ? 'Rescheduling...' : 'Select This Slot'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      <footer className={styles.mobileFooter} aria-label="Primary actions">
        <Link href="/my-sessions" className={styles.footerAction}>
          <Image
            src="/viewsessions.png"
            alt="My Sessions"
            width={26}
            height={26}
            className={styles.footerIcon}
          />
          <span className={styles.footerLabel}>Sessions</span>
        </Link>

        <Link href="/dashboard" className={styles.footerAction}>
          <Image
            src="/images/homeicon.png"
            alt="Dashboard"
            width={16}
            height={16}
            className={styles.footerIcon}
          />
          <span className={styles.footerLabel}>Home</span>
        </Link>

        <Link href="/book" className={styles.footerAction}>
          <Image
            src="/booksession.png"
            alt="Book Session"
            width={26}
            height={26}
            className={styles.footerIcon}
          />
          <span className={styles.footerLabel}>Book</span>
        </Link>
      </footer>
    </>
  );
}
