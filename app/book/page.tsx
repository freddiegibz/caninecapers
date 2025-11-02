"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { useRouter } from "next/navigation";
import SessionCard from "../../components/SessionCard";
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
  const [hasScrolled, setHasScrolled] = useState<boolean>(false);
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
      } catch (_: unknown) {
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

  // Scroll detection for footer visibility
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollTop > 100 && !hasScrolled) {
        setHasScrolled(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasScrolled]);

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
            <h1 className={styles.pageTitle}>Book A Session</h1>
            <p className={styles.pageSubtitle}>Find and book your next field session</p>
            <div className={styles.headerDivider}></div>
          </header>

          {/* Collapsible Browse Calendar Section */}
          <div className={styles.calendarToggleBar}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`${styles.calendarToggleButton} ${showFilters ? styles.expanded : ''}`}
            >
              <span className={styles.toggleIcon}>
                {showFilters ? '−' : '+'}
              </span>
              <span className={styles.toggleText}>
                {showFilters ? 'Hide Calendar' : 'Browse Calendar'}
              </span>
              <span className={styles.toggleArrow}>
                {showFilters ? '↑' : '↓'}
              </span>
            </button>
          </div>

          {/* Expanded Calendar Panel */}
          {showFilters && (
            <div className={styles.calendarPanel}>
              {/* Quick Filter Selection */}
              <div className={styles.quickFilters}>
                <div className={styles.filterGroup}>
                  <span className={styles.filterLabel}>Length:</span>
                  <div className={styles.filterOptions}>
                    {[{ id: '18525224', label: '30m' }, { id: '29373489', label: '45m' }, { id: '18525161', label: '1h' }].map(opt => {
                      const checked = selectedType === opt.id;
                      return (
                        <button
                          key={opt.id}
                          className={`${styles.quickFilter} ${checked ? styles.active : ''}`}
                          onClick={() => {
                            setSelectedType(opt.id);
                            setCurrentPage(1);
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.filterGroup}>
                  <span className={styles.filterLabel}>Field:</span>
                  <div className={styles.filterOptions}>
                    {[
                      { id: 4783035, label: 'Central' },
                      { id: 6255352, label: 'Hyde' }
                    ].map(field => (
                      <button
                        key={field.id}
                        className={`${styles.quickFilter} ${selectedField === field.id ? styles.active : ''}`}
                        onClick={() => {
                          setSelectedField(field.id);
                          setCurrentPage(1);
                        }}
                      >
                        {field.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Calendar Iframe */}
              {selectedField > 0 && selectedType && (
                <div className={styles.calendarContainer}>
                  <iframe
                    src={`https://app.acuityscheduling.com/schedule.php?owner=21300080&calendarID=${selectedField}&appointmentTypeID=${selectedType}`}
                    title="Schedule Appointment"
                    width="100%"
                    height="600"
                    frameBorder="0"
                    allow="payment"
                    className={styles.calendarIframe}
                  ></iframe>
                  <Script
                    src="https://embed.acuityscheduling.com/js/embed.js"
                    strategy="lazyOnload"
                  />
                </div>
              )}

              {/* Selection Prompt */}
              {(!selectedField || !selectedType) && (
                <div className={styles.selectionPrompt}>
                  Select length and field above to view calendar
                </div>
              )}
            </div>
          )}

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Upcoming Availability
              <span className={styles.titleUnderline}></span>
            </h2>

            {/* Unified Filter Row */}
            <div className={styles.unifiedFilterRow}>
              <div className={styles.filterSection}>
                <span className={styles.filterSectionLabel}>Length</span>
                <div className={styles.filterChips}>
                  {[{ id: '18525224', label: '30 min' }, { id: '29373489', label: '45 min' }, { id: '18525161', label: '1 hour' }].map(opt => {
                    const checked = selectedType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        className={`${styles.filterChip} ${checked ? styles.activeChip : ''}`}
                        onClick={() => setSelectedType(opt.id)}
                        disabled={loading}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.filterSection}>
                <span className={styles.filterSectionLabel}>Field</span>
                <div className={styles.filterChips}>
                  {[
                    { id: 0, label: 'All' },
                    { id: 4783035, label: 'Central' },
                    { id: 6255352, label: 'Hyde' }
                  ].map(field => {
                    const checked = selectedField === field.id;
                    return (
                      <button
                        key={field.id}
                        className={`${styles.filterChip} ${checked ? styles.activeChip : ''}`}
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
                  <SessionCard
                    key={session.id}
                    meta={meta}
                    dateLabel={dateLabel}
                    price={getPriceForType(selectedType)}
                    onClick={() => handleBookSession(session)}
                  />
                );
              })}
            </div>
            {sessions.length >= pageSize && currentPage * pageSize < sessions.length && (
              <div className={styles.loadMoreContainer}>
                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className={styles.loadMoreButton}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More Sessions'}
                </button>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Branded Footer Note - Only show after scrolling */}
      {hasScrolled && (
        <div className={styles.brandedFooter}>
          <div className={styles.footerDivider}>🐾──────────────</div>
          <div className={styles.footerNote}>
            Canine Capers is proudly local — <span>thank you for supporting your community.</span>
          </div>
        </div>
      )}

      <footer className={styles.mobileFooter} aria-label="Primary actions">
        <Link href="/dashboard" className={styles.footerAction}>
          <Image
            src="/house.png"
            alt="Dashboard"
            width={26}
            height={26}
            className={styles.footerIcon}
          />
          <span className={styles.footerLabel}>Home</span>
        </Link>

        <Link href="/book" className={styles.footerAction} aria-current="page">
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
            src="/settings.png"
            alt="Settings"
            width={26}
            height={26}
            className={styles.footerIcon}
          />
          <span className={styles.footerLabel}>Settings</span>
        </Link>
      </footer>
    </>
  );
}
