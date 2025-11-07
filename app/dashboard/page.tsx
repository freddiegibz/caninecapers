"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatLondon } from "../../src/utils/dateTime";
import { useRouter } from "next/navigation";
import HeroSection from "../../components/HeroSection";
import styles from "./page.module.css";


export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<'availability' | 'sessions'>('availability');
  const [selectedDay, setSelectedDay] = useState<string>(() => {
    // Initialize to today's date in YYYY-MM-DD format (London time)
    const today = new Date();
    const londonDate = new Date(today.toLocaleString('en-US', { timeZone: 'Europe/London' }));
    return londonDate.toISOString().split('T')[0];
  });
  const router = useRouter();

  type AvailabilityResponseItem = {
    startTime: string; // ISO string
    calendarID: number; // 4783035 or 6255352
  };

  type NormalizedSession = {
    id: string;
    calendarID: number;
    startTime: string; // ISO
  };

  const [sessions, setSessions] = useState<NormalizedSession[]>([]);
  const [selectedType, setSelectedType] = useState<string>('18525224'); // default 30-Minute
  const [selectedField, setSelectedField] = useState<number>(0); // All fields by default
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchAvailability = async () => {
      try {
        setLoading(true);
        // Use selected type if available, otherwise use default (30 min) to load initial data
        const typeToUse = selectedType || '18525224';
        const res = await fetch(`/api/availability?appointmentTypeID=${encodeURIComponent(typeToUse)}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load availability");
        const data: AvailabilityResponseItem[] = await res.json();

        let normalized: NormalizedSession[] = data
          .map((item, idx) => ({
            id: `${item.calendarID}-${idx}-${item.startTime}`,
            calendarID: Number(item.calendarID),
            startTime: item.startTime,
          }));

        // Filter by selected field if not "All" (0)
        if (selectedField !== 0) {
          normalized = normalized.filter(session => session.calendarID === selectedField);
        }

        normalized = normalized.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        if (isMounted) {
          setSessions(normalized);
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_error: unknown) {
        // Silent fail to keep UI clean; show empty state instead
        if (isMounted) setSessions([]);
      }
      finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAvailability();
    return () => {
      isMounted = false;
    };
  }, [activeSection, selectedType, selectedField]);

  // London timezone formatting utilities are imported above

  const getFieldMeta = (calendarID: number) => {
    if (calendarID === 4783035) {
      return { id: "central-bark" as const, name: "Central Bark" };
    }
    if (calendarID === 6255352) {
      return { id: "hyde-bark" as const, name: "Hyde Bark" };
    }
    return { id: "central-bark" as const, name: "Central Bark" };
  };

  const getPriceForType = (appointmentTypeID: string) => {
    switch (appointmentTypeID) {
      case '18525224': // 30-Minute Reservation
        return '£5.50';
      case '29373489': // 45-Minute Reservation
        return '£8.25';
      case '18525161': // 1-Hour Reservation
        return '£11.00';
      default:
        return '£5.50';
    }
  };

  const handleBookSession = (session: NormalizedSession) => {
    const meta = getFieldMeta(session.calendarID);
    const price = getPriceForType(selectedType);
    const durationText = selectedType === '18525224' ? '30 min' :
                        selectedType === '29373489' ? '45 min' :
                        selectedType === '18525161' ? '1 hour' : '30 min';

    // Pass session data via query parameters
    // Extract date and time components for URL params
    // session.startTime is already GMT London ISO string (e.g., "2025-11-05T17:00:00.000Z")
    const dateParam = session.startTime.split('T')[0]; // YYYY-MM-DD from London time
    const timeParam = session.startTime.split('T')[1].slice(0, 5); // HH:MM from London time

    const queryParams = new URLSearchParams({
      id: session.id,
      image_url: meta.id === 'central-bark' ? '/centralbark.webp' : '/hydebark.webp',
      date: dateParam,
      time: timeParam,
      length: durationText,
      field: meta.name,
      price: price,
      calendarID: session.calendarID.toString(),
      startTime: session.startTime,
      appointmentTypeID: selectedType
    });

    console.log('Navigating to booking page with session data:', {
      id: session.id,
      field: meta.name,
      date: dateParam,
      time: timeParam,
      formattedDisplay: formatLondon(session.startTime)
    });

    router.push(`/book/${session.id}?${queryParams.toString()}`);
  };

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
          <HeroSection 
            onBookSession={() => setActiveSection('availability')}
            onViewBookings={() => setActiveSection('sessions')}
          />

          <div className={styles.sectionToggle}>
            <button
              className={`${styles.toggleButton} ${styles.tab} ${activeSection === 'availability' ? styles.active : ''}`}
              onClick={() => setActiveSection('availability')}
            >
              Book A Session
            </button>
            <button
              className={`${styles.toggleButton} ${styles.tab} ${activeSection === 'sessions' ? styles.active : ''}`}
              onClick={() => setActiveSection('sessions')}
            >
              View My Booking
            </button>
          </div>

          {activeSection === 'availability' && (
            <section className={styles.section}>
              <h2 className={styles.dashboardSectionTitle}>Available Sessions</h2>

              {loading && (
                <div style={{ width: '100%', textAlign: 'center', color: '#2b3a29', marginBottom: '0.75rem', fontWeight: 600 }}>
                  Loading available sessions…
                </div>
              )}

              {/* Filter Chips - Above available times */}
              <div className={styles.filterChipsSection}>
                <div className={styles.filterChipsRow}>
                  <div className={styles.filterChipGroup}>
                    {[{ id: '18525224', label: '30 min' }, { id: '29373489', label: '45 min' }, { id: '18525161', label: '1 hour' }].map(opt => {
                      const checked = selectedType === opt.id;
                      return (
                        <button
                          key={opt.id}
                          className={`${styles.filterChipSmall} ${checked ? styles.activeChipSmall : ''}`}
                          onClick={() => setSelectedType(opt.id)}
                          disabled={loading}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className={styles.filterChipGroup}>
                    {[
                      { id: 0, label: 'All' },
                      { id: 4783035, label: 'Central' },
                      { id: 6255352, label: 'Hyde' }
                    ].map(field => {
                      const checked = selectedField === field.id;
                      return (
                        <button
                          key={field.id}
                          className={`${styles.filterChipSmall} ${checked ? styles.activeChipSmall : ''}`}
                          onClick={() => setSelectedField(field.id)}
                          disabled={loading}
                        >
                          {field.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Day Indicator - Inline above available times */}
              <div className={styles.dayIndicator}>
                <span className={styles.dayIndicatorText}>
                  Showing sessions for{' '}
                  <span className={styles.dayIndicatorDate}>
                    {new Date(selectedDay).toLocaleDateString('en-GB', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                  {' '}
                  <button 
                    className={styles.changeDayLink}
                    onClick={(e) => {
                      e.preventDefault();
                      // Create and trigger date picker
                      const input = document.createElement('input');
                      input.type = 'date';
                      input.value = selectedDay;
                      input.min = new Date().toISOString().split('T')[0];
                      
                      // Style to be hidden but functional
                      input.style.position = 'absolute';
                      input.style.opacity = '0';
                      input.style.pointerEvents = 'none';
                      
                      // Handle date selection
                      input.onchange = (event) => {
                        const target = event.target as HTMLInputElement;
                        if (target.value) {
                          setSelectedDay(target.value);
                        }
                        // Clean up
                        document.body.removeChild(input);
                      };
                      
                      // Handle cancellation (click outside)
                      input.onblur = () => {
                        setTimeout(() => {
                          if (document.body.contains(input)) {
                            document.body.removeChild(input);
                          }
                        }, 100);
                      };
                      
                      // Append to DOM and trigger
                      document.body.appendChild(input);
                      // Use showPicker if available (modern browsers), otherwise fallback to click
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const inputWithPicker = input as any;
                      if (typeof inputWithPicker.showPicker === 'function') {
                        inputWithPicker.showPicker();
                      } else {
                        input.click();
                      }
                    }}
                  >
                    Change Day
                  </button>
                </span>
              </div>

              {/* Available Times Section - shows immediately filtered to today */}
              <div className={styles.availableTimesSection}>
                <div className={styles.availableTimesList}>
                  {sessions
                    .filter(session => {
                      const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
                      return sessionDate === selectedDay;
                    })
                    .length === 0 ? (
                      <div className={styles.emptyState}>
                        <p>No sessions available for this day.</p>
                      </div>
                    ) : (
                      sessions
                        .filter(session => {
                          const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
                          return sessionDate === selectedDay;
                        })
                        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                        .map((session) => {
                            const meta = getFieldMeta(session.calendarID);
                            const timeString = formatLondon(session.startTime);

                            const fieldImage = session.calendarID === 4783035 ? '/centralbark.webp' : '/hydebark.webp';

                            return (
                              <div
                                key={session.id}
                                className={styles.availableTimeItem}
                                onClick={(e) => {
                                  // Only handle click if not clicking the book button
                                  if (!(e.target as HTMLElement).classList.contains(styles.availableTimeBook)) {
                                    handleBookSession(session);
                                  }
                                }}
                              >
                                <Image
                                  src={fieldImage}
                                  alt={`${meta.name} field`}
                                  width={160}
                                  height={98}
                                  className={styles.availableTimeImage}
                                />
                                <div className={styles.availableTimeContent}>
                                  <div className={styles.availableTimeTime}>{timeString}</div>
                                  <div className={styles.availableTimeLength}>
                                    {selectedType === '18525224' ? '30 min' :
                                     selectedType === '29373489' ? '45 min' :
                                     selectedType === '18525161' ? '1 hour' : '30 min'}
                                  </div>
                                  <div className={styles.availableTimeField}>{meta.name}</div>
                                  <button
                                    className={styles.availableTimeBook}
                                    onClick={() => handleBookSession(session)}
                                  >
                                    Book
                                  </button>
                                </div>
                              </div>
                            );
                          })
                    )}
                </div>
              </div>
            </section>
          )}

          {/* Extended Calendar Section - Only show for Available Sessions */}
          {activeSection === 'availability' && (
            <section className={styles.section}>
              <div style={{
                borderTop: '1px solid rgba(226, 220, 203, 0.4)',
                paddingTop: '1.5rem',
                textAlign: 'center'
              }}>
                <Link
                  href="/book"
                  style={{
                    color: 'var(--forest)',
                    textDecoration: 'underline',
                    fontSize: '0.9rem',
                    fontWeight: 500
                  }}
                >
                  Browse Extended Calendar →
                </Link>
                <p style={{
                  fontSize: '0.8rem',
                  color: 'var(--text)',
                  opacity: 0.8,
                  marginTop: '0.25rem',
                  marginBottom: 0,
                  lineHeight: 1.4
                }}>
                  View sessions for upcoming months and book further in advance
                </p>
              </div>
            </section>
          )}

          {activeSection === 'sessions' && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                Your Sessions
                <span className={styles.titleUnderline}></span>
              </h2>
              <div className={styles.sessionsGrid}>
                <div className={styles.sessionCard}>
                  <div className={styles.sessionImage}>
                    <Image
                      src="/centralbark.webp"
                      alt="Central Bark"
                      width={110}
                      height={110}
                      className={styles.sessionImageContent}
                    />
                  </div>
                  <div className={styles.sessionContent}>
                    <span className={styles.sessionFieldName}>Central Bark</span>
                    <span className={styles.sessionTime}>Wed 23 Oct · 3:00 PM - 3:30 PM</span>
                    <span className={styles.sessionAddress}>24 Meadow Lane, London NW1</span>
                  </div>
                </div>

                <div className={styles.sessionCard}>
                  <div className={styles.sessionImage}>
                    <Image
                      src="/hydebark.webp"
                      alt="Hyde Bark"
                      width={110}
                      height={110}
                      className={styles.sessionImageContent}
                    />
                  </div>
                  <div className={styles.sessionContent}>
                    <span className={styles.sessionFieldName}>Hyde Bark</span>
                    <span className={styles.sessionTime}>Fri 25 Oct · 10:00 AM - 11:00 AM</span>
                    <span className={styles.sessionAddress}>89 Hillcrest Road, Bristol BS8</span>
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      <footer className={styles.mobileFooter} aria-label="Primary actions">
        <Link href="/dashboard" className={styles.footerAction} aria-current="page">
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

      {/* Branded Footer Note */}
      <div className={styles.brandedFooter}>
        <div className={styles.footerDivider}>🐾──────────────</div>
        <div className={styles.footerNote}>
          Canine Capers is proudly local — <span>thank you for supporting your community.</span>
        </div>
      </div>

    </>
  );
}

