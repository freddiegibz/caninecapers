"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import { supabase } from "../../src/lib/supabaseClient";
import { formatLondon } from "../../src/utils/dateTime";

export default function MySessions() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const [loading, setLoading] = useState<boolean>(true);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [showReschedule, setShowReschedule] = useState<{ appointmentId: number; currentIso: string; appointmentTypeID?: string | null } | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Array<{ startTime: string; calendarID: number; fieldName: string }>>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [rescheduling, setRescheduling] = useState<boolean>(false);
  const [rescheduleSuccess, setRescheduleSuccess] = useState<string | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<number>(0); // 0 = current 5 days, 1 = next 5 days, etc.
  const [upcomingSessions, setUpcomingSessions] = useState<Array<{ id: string; name: string; time: string; address: string; iso: string; length?: string; acuity_appointment_id?: number; appointmentTypeID?: string }>>([]);
  const [pastSessions, setPastSessions] = useState<Array<{ id: string; name: string; time: string; address: string; iso: string; length?: string; acuity_appointment_id?: number; appointmentTypeID?: string }>>([]);
  const [updatingSession, setUpdatingSession] = useState<string | null>(null); // session ID being updated

  const openReschedule = async (appointmentId?: number, currentIso?: string) => {
    if (!appointmentId || !currentIso) return;
    setAvailableSlots([]);
    setLoadingSlots(true);
    setSelectedDateRange(0); // Reset to first date range
    setShowReschedule({ appointmentId, currentIso, appointmentTypeID: null });
    // Fetch appointment info to get appointmentTypeID
    try {
      const infoResp = await fetch(`/api/acuity/appointment/${encodeURIComponent(String(appointmentId))}`, { cache: 'no-store' });
      if (infoResp.ok) {
        const info = await infoResp.json();
        const typeId: string | null = info.appointmentTypeID || null;
        setShowReschedule({ appointmentId, currentIso, appointmentTypeID: typeId });
        if (typeId) {
          await loadSlotsForRange(typeId, 0);
        }
      }
    } catch {
      // Silent fail; modal will show empty state
    } finally {
      setLoadingSlots(false);
    }
  };

  const loadSlotsForRange = async (appointmentTypeID: string, rangeIndex: number) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + (rangeIndex * 5) + 1); // Start from tomorrow + offset
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 4); // 5 days total

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const availResp = await fetch(
      `/api/availability?appointmentTypeID=${encodeURIComponent(appointmentTypeID)}&startDate=${startDateStr}&endDate=${endDateStr}`,
      { cache: 'no-store' }
    );
    if (availResp.ok) {
      const slots: Array<{ startTime: string; calendarID: number }> = await availResp.json();
      // Map slots to include field names and filter to only show future slots
      const now = new Date();
      const enrichedSlots = slots
        .map(slot => ({
          ...slot,
          fieldName: getFieldMeta(slot.calendarID).name
        }))
        .filter(slot => new Date(slot.startTime) > now) // Only show future slots
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()); // Sort by time
      setAvailableSlots(enrichedSlots);
    }
  };

  const handleDateRangeChange = async (newRange: number) => {
    if (!showReschedule?.appointmentTypeID) return;
    setSelectedDateRange(newRange);
    setLoadingSlots(true);
    try {
      await loadSlotsForRange(showReschedule.appointmentTypeID, newRange);
    } finally {
      setLoadingSlots(false);
    }
  };

  const getDateRangeLabel = (rangeIndex: number) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + (rangeIndex * 5) + 1);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 4);

    const startMonth = startDate.toLocaleDateString('en-GB', { month: 'short' });
    const endMonth = endDate.toLocaleDateString('en-GB', { month: 'short' });
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();

    if (startMonth === endMonth) {
      return `${startDay}-${endDay} ${startMonth}`;
    } else {
      return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
    }
  };

  const submitRescheduleToSlot = async (slot: { startTime: string; calendarID: number }) => {
    if (!showReschedule) return;
    setRescheduling(true);
    setRescheduleSuccess(null);
    try {
      const resp = await fetch('/api/acuity/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: showReschedule.appointmentId, datetime: slot.startTime, calendarID: slot.calendarID })
      });

      const data = await resp.json();

      if (resp.ok && data.success) {
        console.log('Reschedule successful:', data);
        setRescheduleSuccess('Appointment rescheduled successfully!');
        setShowReschedule(null);
        // Refresh the session list to show updated times
        await loadSessions();
        // Clear success message after a delay
        setTimeout(() => setRescheduleSuccess(null), 3000);
      } else {
        console.error('Reschedule failed:', data);
        const errorMsg = data.error || 'Unknown error';
        const details = data.details ? ` ${data.details}` : '';
        alert(`Failed to reschedule: ${errorMsg}.${details}`);
      }
    } catch (e) {
      console.error('Error rescheduling:', e);
      alert('Failed to reschedule. Please try again.');
    } finally {
      setRescheduling(false);
    }
  };

  const getFieldMeta = (calendarID: number) => {
    if (calendarID === 4783035) {
      return { id: "central-bark" as const, name: "Central Bark" };
    }
    if (calendarID === 6255352) {
      return { id: "hyde-bark" as const, name: "Hyde Bark" };
    }
    return { id: "central-bark" as const, name: "Central Bark" };
  };


  const syncSessionFromAcuity = async (sessionId: string, appointmentId: number) => {
    setUpdatingSession(sessionId);
    try {
      const resp = await fetch('/api/sessions/sync-acuity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: String(appointmentId), sessionId })
      });
      
      const data = await resp.json();
      
      if (resp.ok && data.success) {
        console.log('Session synced:', data);
        // Refresh the session list to show updated data
        await loadSessions();
        alert('Session updated successfully!');
      } else {
        console.error('Sync failed:', data);
        alert(`Failed to update session: ${data.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error('Error syncing session:', e);
      alert('Failed to update session. Please try again.');
    } finally {
      setUpdatingSession(null);
    }
  };



    const loadSessions = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        setAuthUserId(user?.id ?? null);
        if (!user?.id) {
          setUpcomingSessions([]);
          setPastSessions([]);
          return;
        }

        const { data, error } = await supabase
          .from('sessions')
          .select('id, field, date, acuity_appointment_id')
          .eq('user_id', user.id)
          .eq('status', 'complete')
          .order('date', { ascending: true });

        if (error) {
          console.error('Failed to load sessions:', error);
          setUpcomingSessions([]);
          setPastSessions([]);
          return;
        }

        const now = new Date();
        const normalized = (data ?? []).map((s) => {
          const iso = String(s.date);
          const name = String(s.field || 'Central Bark');
          const time = formatLondon(iso);
          const address = 'Brickyard Cottage, Stourport-on-Severn, Bewdley DY13 8DZ, United Kingdom';
          return { 
            id: String(s.id), 
            name, 
            time, 
            address, 
            iso, 
          length: undefined,
          acuity_appointment_id: s.acuity_appointment_id || undefined,
          appointmentTypeID: undefined
          };
        });

        const upcoming = normalized.filter(n => new Date(n.iso) >= now);
        const past = normalized.filter(n => new Date(n.iso) < now).reverse();

        setUpcomingSessions(upcoming);
        setPastSessions(past);

      // Enrich upcoming with appointment type for accurate duration
      const enriched = await Promise.all(upcoming.map(async (sess) => {
        if (!sess.acuity_appointment_id) return sess;
        try {
          const resp = await fetch(`/api/acuity/appointment/${encodeURIComponent(String(sess.acuity_appointment_id))}`, { cache: 'no-store' });
          if (!resp.ok) return sess;
          const info = await resp.json();
          const typeId: string | undefined = info.appointmentTypeID || undefined;
          let lengthText: string | undefined;
          if (typeId === '18525224') lengthText = '30 min';
          else if (typeId === '29373489') lengthText = '45 min';
          else if (typeId === '18525161') lengthText = '1 hour';
          return { ...sess, appointmentTypeID: typeId, length: lengthText };
        } catch {
          return sess;
        }
      }));
      setUpcomingSessions(enriched);
      } finally {
      setLoading(false);
      }
    };

  useEffect(() => {
    loadSessions();
  }, []);
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
        {/* Page Header */}
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>My Sessions</h1>
          <p className={styles.pageSubtitle}>See your upcoming and past bookings in one place.</p>
          {rescheduleSuccess && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: '#d4edda',
              color: '#155724',
              borderRadius: '4px',
              border: '1px solid #c3e6cb'
            }}>
              {rescheduleSuccess}
            </div>
          )}
          <div className={styles.headerDivider}></div>
        </header>

        {/* Segmented Toggle Bar */}
        <div className={styles.toggleBar}>
          <button
            className={`${styles.toggleButton} ${activeTab === 'upcoming' ? styles.active : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming
          </button>
          <button
            className={`${styles.toggleButton} ${activeTab === 'past' ? styles.active : ''}`}
            onClick={() => setActiveTab('past')}
          >
            Past
          </button>
        </div>

        {/* Session Lists */}
        <main className={styles.main}>
          {loading && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>⏳</div>
              <h3 className={styles.emptyTitle}>Loading your sessions…</h3>
            </div>
          )}

          {!loading && !authUserId && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🔒</div>
              <h3 className={styles.emptyTitle}>Please sign in</h3>
              <p className={styles.emptyText}>Sign in to view and manage your sessions.</p>
              <Link className={styles.primaryButton} href="/signin">Sign In</Link>
            </div>
          )}

          {!loading && authUserId && upcomingSessions.length === 0 && pastSessions.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🐶</div>
              <h3 className={styles.emptyTitle}>No sessions yet</h3>
              <p className={styles.emptyText}>Book your first run in the fields.</p>
              <Link className={styles.primaryButton} href="/book">Book a Session</Link>
            </div>
          )}
          {activeTab === 'upcoming' && (
            <div className={styles.sessionList}>
              {upcomingSessions.length > 0 ? (
                upcomingSessions.map((session, index) => (
                  <div key={session.id}>
                    <div className={styles.sessionCard}>
                      <div className={styles.sessionImageContainer}>
                        <Image
                          src={session.name.toLowerCase().includes('hyde') ? '/hydebark.webp' : '/centralbark.webp'}
                          alt={session.name}
                          width={400}
                          height={225}
                          className={styles.sessionImage}
                        />
                      </div>
                      <div className={styles.sessionDetails}>
                        <div className={styles.sessionHeader}>
                          <h3 className={styles.sessionFieldName}>
                            <Image
                              src={session.name.toLowerCase().includes('hyde') ? '/locationicon/hydebarki.png' : '/locationicon/centralbark.png'}
                              alt=""
                              width={16}
                              height={16}
                              style={{ marginRight: '0.5rem', verticalAlign: 'middle' }}
                            />
                            {session.name}
                          </h3>
                          <div className={styles.sessionActions}>
                            {session.acuity_appointment_id && (
                              <>
                                <button
                                  className={styles.rescheduleButton}
                                  onClick={() => openReschedule(session.acuity_appointment_id, session.iso)}
                                >
                                  Reschedule
                                </button>
                                <button
                                  className={styles.updateButton}
                                  onClick={() => {
                                    if (session.acuity_appointment_id) {
                                      syncSessionFromAcuity(session.id, session.acuity_appointment_id);
                                    }
                                  }}
                                  disabled={updatingSession === session.id || !session.acuity_appointment_id}
                                >
                                  {updatingSession === session.id ? 'Updating...' : 'Update'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className={styles.sessionMeta}>
                          <div className={styles.metaRow}>
                            <span className={styles.metaIcon}>🕒</span>
                            <span className={styles.sessionTime}>{session.time}</span>
                          </div>
                          <div className={styles.metaRow}>
                            <span className={styles.metaIcon}>⏱️</span>
                            <span className={styles.sessionLength}>{session.length || '30 min'}</span>
                          </div>
                          <div className={styles.metaRow}>
                            <span className={styles.metaIcon}>📍</span>
                            <Link href="/location" className={styles.sessionAddressLink}>
                              {session.address}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                    {index < upcomingSessions.length - 1 && <div className={styles.cardDivider}></div>}
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🐕</div>
                  <h3 className={styles.emptyTitle}>No upcoming sessions</h3>
                  <p className={styles.emptyText}>Ready to book your next one?</p>
                  <Link href="/book" className={styles.primaryButton}>
                    Book a Session
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'past' && (
            <div className={styles.sessionList}>
              {pastSessions.length > 0 ? (
                pastSessions.map((session, index) => (
                  <div key={session.id}>
                    <div className={`${styles.sessionCard} ${styles.pastCard}`}>
                      <div className={styles.sessionImageContainer}>
                        <Image
                          src={session.name.toLowerCase().includes('hyde') ? '/hydebark.webp' : '/centralbark.webp'}
                          alt={session.name}
                          width={400}
                          height={225}
                          className={styles.sessionImage}
                        />
                      </div>
                      <div className={styles.sessionDetails}>
                        <div className={styles.sessionHeader}>
                          <h3 className={styles.sessionFieldName}>
                            <Image
                              src={session.name.toLowerCase().includes('hyde') ? '/locationicon/hydebarki.png' : '/locationicon/centralbark.png'}
                              alt=""
                              width={16}
                              height={16}
                              style={{ marginRight: '0.5rem', verticalAlign: 'middle' }}
                            />
                            {session.name}
                          </h3>
                          <button className={styles.rebookButton}>Rebook</button>
                        </div>
                        <div className={styles.sessionMeta}>
                          <div className={styles.metaRow}>
                            <span className={styles.metaIcon}>🕒</span>
                            <span className={styles.sessionTime}>{session.time}</span>
                          </div>
                          <div className={styles.metaRow}>
                            <span className={styles.metaIcon}>⏱️</span>
                            <span className={styles.sessionLength}>{session.length || '30 min'}</span>
                          </div>
                          <div className={styles.metaRow}>
                            <span className={styles.metaIcon}>📍</span>
                            <Link href="/location" className={styles.sessionAddressLink}>
                              {session.address}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                    {index < pastSessions.length - 1 && <div className={styles.cardDivider}></div>}
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🐾</div>
                  <h3 className={styles.emptyTitle}>No past sessions yet</h3>
                  <p className={styles.emptyText}>Your booking history will appear here.</p>
                  <Link href="/book" className={styles.secondaryButton}>
                    Explore Fields
                  </Link>
                </div>
              )}
            </div>
          )}
        </main>
      </div>


      {showReschedule && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <strong>Reschedule</strong>
              <button className={styles.closeBtn} onClick={() => setShowReschedule(null)}>×</button>
            </div>
            <div className={styles.modalBody}>
              {rescheduling && (
                <div style={{ textAlign: 'center', padding: '1rem' }}>Rescheduling appointment…</div>
              )}
              {!rescheduling && loadingSlots && (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Loading available slots…</div>
              )}
              {!rescheduling && !loadingSlots && !showReschedule.appointmentTypeID && (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Loading appointment info…</div>
              )}
              {!rescheduling && !loadingSlots && showReschedule.appointmentTypeID && availableSlots.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  No free slots available for this date range.
                </div>
              )}
              {!rescheduling && !loadingSlots && availableSlots.length > 0 && (
                <div>
                  {/* Date Range Selector */}
                  <div className={styles.dateSelector}>
                    <button
                      className={styles.navButton}
                      onClick={() => handleDateRangeChange(Math.max(0, selectedDateRange - 1))}
                      disabled={selectedDateRange === 0}
                    >
                      ‹ Previous
                    </button>
                    <select
                      value={selectedDateRange}
                      onChange={(e) => handleDateRangeChange(Number(e.target.value))}
                      className={styles.dateSelect}
                    >
                      {Array.from({ length: 5 }, (_, i) => (
                        <option key={i} value={i}>
                          {getDateRangeLabel(i)}
                        </option>
                      ))}
                    </select>
                    <button
                      className={styles.navButton}
                      onClick={() => handleDateRangeChange(selectedDateRange + 1)}
                    >
                      Next ›
                    </button>
                  </div>

                  {/* Available Slots Grid */}
                  <div className={styles.slotsGrid}>
                    {availableSlots.map((slot, idx) => (
                      <div
                        key={idx}
                        className={styles.slotCard}
                        onClick={() => !rescheduling && submitRescheduleToSlot(slot)}
                        style={{ opacity: rescheduling ? 0.6 : 1, pointerEvents: rescheduling ? 'none' : 'auto' }}
                      >
                        <div className={styles.fieldName}>{slot.fieldName}</div>
                        <div className={styles.slotTime}>
                          {new Date(slot.startTime).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          })}
                        </div>
                        <div className={styles.slotDate}>
                          {new Date(slot.startTime).toLocaleDateString('en-GB', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short'
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.secondaryBtn} onClick={() => setShowReschedule(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <footer className={styles.mobileFooter} aria-label="Primary actions">
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

        <Link href="/my-sessions" className={styles.footerAction} aria-current="page">
          <Image
            src="/viewsessions.png"
            alt="My Sessions"
            width={26}
            height={26}
            className={styles.footerIcon}
          />
          <span className={styles.footerLabel}>Sessions</span>
        </Link>

        <Link href="/location" className={styles.footerAction}>
          <Image
            src="/location.png"
            alt="Locations"
            width={26}
            height={26}
            className={styles.footerIcon}
          />
          <span className={styles.footerLabel}>Location</span>
        </Link>

        <Link href="/settings" className={styles.footerAction}>
          <Image
            src="/images/settingsicon.png"
            alt="Settings"
            width={16}
            height={16}
            className={styles.footerIcon}
          />
          <span className={styles.footerLabel}>Settings</span>
        </Link>
      </footer>
    </>
  );
}
