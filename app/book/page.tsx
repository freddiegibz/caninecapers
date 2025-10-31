"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function Book() {
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
  const [selectedType, setSelectedType] = useState<string>('18525224'); // default 30-Minute for sessions
  const [selectedField, setSelectedField] = useState<number>(0); // No default - user must select
  const [loading, setLoading] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;

  useEffect(() => {
    let isMounted = true;
    const fetchAvailability = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/availability?appointmentTypeID=${encodeURIComponent(selectedType)}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load availability");
        const data: AvailabilityResponseItem[] = await res.json();

        const normalized: NormalizedSession[] = data
          .map((item, idx) => ({
            id: `${item.calendarID}-${idx}-${item.startTime}`,
            calendarID: Number(item.calendarID),
            startTime: item.startTime,
          }))
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        if (isMounted) {
          setSessions(normalized);
        }
      } catch (error: unknown) {
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
  }, [selectedType]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
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

    // Save booking data to localStorage before redirecting to Acuity
    const bookingData = {
      field: meta.name,
      calendarID: session.calendarID.toString(),
      appointmentTypeID: selectedType,
      date: formatDate(session.startTime),
      time: formatTime(session.startTime),
      length: durationText,
      price: price,
      startTime: session.startTime
    };

    localStorage.setItem('pendingBooking', JSON.stringify(bookingData));
    console.log('Saved pending booking to localStorage:', bookingData);

    // Navigate to booking confirmation page
    const queryParams = new URLSearchParams({
      id: session.id,
      image_url: meta.id === 'central-bark' ? '/centralbark.webp' : '/hydebark.webp',
      date: formatDate(session.startTime),
      time: formatTime(session.startTime),
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
      date: formatDate(session.startTime),
      time: formatTime(session.startTime)
    });

    router.push(`/book/${session.id}?${queryParams.toString()}`);
  };
  return (
    <>
      <header className={styles.navbar}>
        <div className={styles.navbarContent}>
          <div className={styles.greeting}>
            <Link href="/dashboard" className={styles.backButton}>
              <span className={styles.backArrow}>&lt;</span>
              <Image
                src="/caninecaperslogosymbol.png"
                alt="Dashboard"
                width={32}
                height={32}
                className={styles.backIcon}
              />
            </Link>
          </div>
          <div className={styles.navActions}>
            <Link href="/settings" className={styles.settingsIcon}>
              <Image
                src="/settings.png"
                alt="Settings"
                width={40}
                height={40}
                className={styles.settingsIconImage}
              />
            </Link>
            <button className={styles.hamburgerMenu} aria-label="Menu">
              <span className={styles.hamburgerLine}></span>
              <span className={styles.hamburgerLine}></span>
              <span className={styles.hamburgerLine}></span>
            </button>
          </div>
        </div>
      </header>

      <div className={styles.container}>
        <main className={styles.main}>
          <section className={styles.section}>
            <div className={styles.calendarCard}>
              <h3 className={styles.calendarTitle}>Browse Calendar</h3>
              <p className={styles.calendarDescription}>
                Select your preferred appointment length and field to view available times in calendar format.
              </p>

              {/* Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={styles.filterToggle}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--forest)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  fontFamily: 'var(--font-poppins)',
                  cursor: 'pointer',
                  marginBottom: '1rem',
                  transition: 'all 0.2s ease'
                }}
              >
                {showFilters ? 'Hide Calendar Filters' : 'Show Calendar Filters'}
              </button>

              {/* Collapsible Filter Content */}
              {showFilters && (
                <>
                  {/* Appointment Type Selection */}
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>Appointment Length:</h4>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      {[{ id: '18525224', label: '30-Minute' }, { id: '29373489', label: '45-Minute' }, { id: '18525161', label: '1-Hour' }].map(opt => {
                        const checked = selectedType === opt.id;
                        return (
                          <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: checked ? '#f8f6f2' : '#ffffff', color: 'var(--text)', fontWeight: 600 }}>
                            <input
                              type="radio"
                              name="appointmentTypeCalendar"
                              value={opt.id}
                              checked={checked}
                              onChange={(e) => {
                            setSelectedType(e.target.value);
                            setCurrentPage(1); // Reset to first page when type changes
                          }}
                              style={{ accentColor: 'var(--forest)', width: 18, height: 18, borderRadius: 6 }}
                            />
                            {opt.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Field Selection */}
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>Select Field:</h4>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      {[
                        { id: 4783035, label: 'Central Bark' },
                        { id: 6255352, label: 'Hyde Bark' }
                      ].map(field => (
                        <label key={field.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: selectedField === field.id ? '#f8f6f2' : '#ffffff', color: 'var(--text)', fontWeight: 600 }}>
                          <input
                            type="radio"
                            name="field"
                            value={field.id}
                            checked={selectedField === field.id}
                            onChange={(e) => {
                          setSelectedField(Number(e.target.value));
                          setCurrentPage(1); // Reset to first page when field changes
                        }}
                            style={{ accentColor: 'var(--forest)', width: 18, height: 18, borderRadius: 6 }}
                          />
                          {field.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Show iframe when filters are expanded and both selections are made */}
              {showFilters && selectedField > 0 && selectedType && (
                <div className={styles.calendarContainer}>
                  <iframe
                    src={`https://app.acuityscheduling.com/schedule.php?owner=21300080&calendarID=${selectedField}&appointmentTypeID=${selectedType}`}
                    title="Schedule Appointment"
                    width="100%"
                    height="800"
                    frameBorder="0"
                    allow="payment"
                    className={styles.calendarIframe}
                  ></iframe>
                </div>
              )}

              {/* Load Acuity embed script when iframe is present */}
              {showFilters && selectedField > 0 && selectedType && (
                <Script
                  src="https://embed.acuityscheduling.com/js/embed.js"
                  strategy="lazyOnload"
                />
              )}

              {/* Show message when filters not expanded or selections not complete */}
              {(!showFilters || !selectedField || !selectedType) && (
                <div style={{ textAlign: 'center', color: 'var(--text)', opacity: 0.7, padding: '2rem', fontStyle: 'italic' }}>
                  {showFilters
                    ? 'Please select both a field and appointment length to view the calendar.'
                    : 'Click "Show Calendar Filters" above to access the calendar view.'
                  }
                </div>
              )}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Upcoming Availability
              <span className={styles.titleUnderline}></span>
            </h2>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {[{ id: '18525224', label: '30-Minute Reservation' }, { id: '29373489', label: '45-Minute Reservation' }, { id: '18525161', label: '1-Hour Reservation' }].map(opt => {
                const checked = selectedType === opt.id;
                return (
                  <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: checked ? '#f8f6f2' : '#ffffff', color: 'var(--text)', fontWeight: 600 }}>
                    <input
                      type="radio"
                      name="appointmentType"
                      value={opt.id}
                      checked={checked}
                      onChange={(e) => setSelectedType(e.target.value)}
                      disabled={loading}
                      style={{ accentColor: 'var(--forest)', width: 18, height: 18, borderRadius: 6 }}
                    />
                    {opt.label}
                  </label>
                );
              })}
                </div>
            {loading && (
              <div style={{ width: '100%', textAlign: 'center', color: 'var(--forest)', marginBottom: '0.75rem', fontWeight: 600 }}>
                Loading available sessions…
              </div>
            )}
            <div className={styles.availabilityGrid}>
              {sessions.length === 0 && !loading && (
                <p className={styles.availabilityTimeslot}>No sessions available for this type.</p>
              )}
              {sessions
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((session) => {
                const meta = getFieldMeta(session.calendarID);
                const dateLabel = `${formatDate(session.startTime)} · ${formatTime(session.startTime)}`;
                return (
                  <div
                    key={session.id}
                    className={styles.availabilityCard}
                    onClick={() => handleBookSession(session)}
                  >
                  <div className={styles.availabilityImage}>
                    <Image
                        src={meta.id === 'central-bark' ? '/centralbark.webp' : '/hydebark.webp'}
                        alt={meta.name}
                      width={110}
                      height={110}
                      className={styles.availabilityImageContent}
                    />
                  </div>
                  <div className={styles.availabilityContent}>
                    <div className={styles.availabilityHeader}>
                        <span className={styles.availabilityName}>
                          {meta.name}
                          <span className={styles.availabilityPrice}>{getPriceForType(selectedType)}</span>
                        </span>
                    </div>
                      <span className={styles.availabilityTimeslot}>{dateLabel}</span>
                  </div>
                  <div className={styles.bookButton}>
                    Book <span className={styles.arrow}>›</span>
                  </div>
                </div>
                );
              })}
            </div>
            {sessions.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '0.5rem 0.9rem',
                    borderRadius: 10,
                    border: `2px solid ${currentPage === 1 ? '#a3b18a66' : '#2b3a29'}`,
                    color: '#2b3a29',
                    background: '#fff',
                    opacity: currentPage === 1 ? 0.6 : 1,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((p) => (p * pageSize < sessions.length ? p + 1 : p))}
                  disabled={currentPage * pageSize >= sessions.length}
                  style={{
                    padding: '0.5rem 0.9rem',
                    borderRadius: 10,
                    border: `2px solid ${currentPage * pageSize >= sessions.length ? '#a3b18a66' : '#2b3a29'}`,
                    color: '#2b3a29',
                    background: '#fff',
                    opacity: currentPage * pageSize >= sessions.length ? 0.6 : 1,
                    cursor: currentPage * pageSize >= sessions.length ? 'not-allowed' : 'pointer',
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </main>
      </div>

      <footer className={styles.mobileFooter} aria-label="Primary actions">
        <Link href="/book" className={styles.footerAction} aria-current="page">
          <Image
            src="/booksession.png"
            alt="Book Session"
            width={26}
            height={26}
            className={styles.footerIcon}
          />
          <span className={styles.footerLabel}>Book Session</span>
        </Link>

        <Link href="/my-sessions" className={styles.footerAction}>
          <Image
            src="/viewsessions.png"
            alt="My Sessions"
            width={26}
            height={26}
            className={styles.footerIcon}
          />
          <span className={styles.footerLabel}>My Sessions</span>
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
      </footer>
    </>
  );
}
