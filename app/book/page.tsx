"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { useRouter } from "next/navigation";
import SessionCard from "../../components/SessionCard";
import styles from "./page.module.css";

export default function Book() {
  const router = useRouter();

  // Offers (Acuity Packages)
  const OFFERS: Array<{
    id: string;
    title: string;
    url: string;
    appliesTo?: string[]; // appointmentTypeIDs this offer is most relevant for
  }> = [
    {
      id: '938143',
      title: 'Book 10 × 1 hour, get 2 free',
      url: 'https://app.acuityscheduling.com/catalog.php?owner=21300080&action=addCart&clear=1&id=938143',
      appliesTo: ['18525161']
    },
    {
      id: '938145',
      title: 'Book 10 × 30 minutes, get 2 free',
      url: 'https://app.acuityscheduling.com/catalog.php?owner=21300080&action=addCart&clear=1&id=938145',
      appliesTo: ['18525224']
    },
    {
      id: '1210365',
      title: 'Book 10 × 45 minutes, get 2 free',
      url: 'https://app.acuityscheduling.com/catalog.php?owner=21300080&action=addCart&clear=1&id=1210365',
      appliesTo: ['29373489']
    }
  ];

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
  const [selectedDay, setSelectedDay] = useState<string>('all'); // 'all' or YYYY-MM-DD format
  const [dayDropdownOpen, setDayDropdownOpen] = useState<boolean>(false);
  const daySelectorRef = useRef<HTMLDivElement>(null);
  const [offersDropdownOpen, setOffersDropdownOpen] = useState<boolean>(false);
  const offersDropdownRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [hasScrolled, setHasScrolled] = useState<boolean>(false);

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
          setSelectedDay('all'); // Reset to "all" when sessions change
        }
      } catch {
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dayDropdownOpen && daySelectorRef.current && !daySelectorRef.current.contains(event.target as Node)) {
        setDayDropdownOpen(false);
      }
    };

    if (dayDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dayDropdownOpen]);

  // Close offers dropdown when clicking outside
  useEffect(() => {
    const handleClickOutsideOffers = (event: MouseEvent) => {
      if (offersDropdownOpen && offersDropdownRef.current && !offersDropdownRef.current.contains(event.target as Node)) {
        setOffersDropdownOpen(false);
      }
    };
    if (offersDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutsideOffers);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideOffers);
    };
  }, [offersDropdownOpen]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: 'Europe/London'
    });
  };

  const formatDateShort = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: 'Europe/London'
    });
  };

  const getDateKey = (iso: string) => {
    const d = new Date(iso);
    return d.toISOString().split('T')[0]; // Returns YYYY-MM-DD
  };

  // Get unique days from sessions
  const getUniqueDays = () => {
    const days = new Set<string>();
    sessions.forEach(session => {
      days.add(getDateKey(session.startTime));
    });
    return Array.from(days).sort();
  };

  // Get display text for selected day
  const getSelectedDayText = () => {
    if (selectedDay === 'all') return 'All Days';
    const daySession = sessions.find(s => getDateKey(s.startTime) === selectedDay);
    if (!daySession) return 'All Days';
    return formatDateShort(daySession.startTime);
  };

  // Filter sessions by selected day
  const filteredSessions = selectedDay === 'all' 
    ? sessions 
    : sessions.filter(session => getDateKey(session.startTime) === selectedDay);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-GB', {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: 'Europe/London'
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

          {/* Offers Dropdown (compact) */}
          <div className={styles.offersStrip}>
            <div className={styles.offersDropdownContainer} ref={offersDropdownRef}>
              <button
                className={styles.offersDropdownButton}
                onClick={() => setOffersDropdownOpen(!offersDropdownOpen)}
              >
                <span>Offers: Save with Packages</span>
                <span className={styles.daySelectorArrow}>{offersDropdownOpen ? '↑' : '↓'}</span>
              </button>
              {offersDropdownOpen && (
                <div className={styles.offersDropdown}>
                  {OFFERS.map(offer => (
                    <a
                      key={offer.id}
                      className={styles.offerDropdownItem}
                      href={offer.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className={styles.offerDropdownTitle}>{offer.title}</span>
                      <span className={styles.offerDropdownCta}>Buy</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
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
                    src={`https://caninecapers.as.me/?calendarID=${selectedField}&appointmentTypeID=${selectedType}`}
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
            {sessions.length === 0 && !loading && (
              <p className={styles.noSessionsMessage}>No sessions available for this type.</p>
            )}
            {sessions.length > 0 && (
              <>
                <h3 className={styles.availableSessionsSubtitle}>Available Sessions</h3>
                {/* Day Selector Dropdown */}
                <div className={styles.daySelectorContainer} ref={daySelectorRef}>
                  <button
                    className={styles.daySelectorButton}
                    onClick={() => setDayDropdownOpen(!dayDropdownOpen)}
                  >
                    <span>{getSelectedDayText()}</span>
                    <span className={styles.daySelectorArrow}>{dayDropdownOpen ? '↑' : '↓'}</span>
                  </button>
                  {dayDropdownOpen && (
                    <div className={styles.dayDropdown}>
                      <button
                        className={`${styles.dayDropdownItem} ${selectedDay === 'all' ? styles.dayDropdownItemActive : ''}`}
                        onClick={() => {
                          setSelectedDay('all');
                          setDayDropdownOpen(false);
                        }}
                      >
                        All Days
                      </button>
                      {getUniqueDays().map((dayKey) => {
                        const daySession = sessions.find(s => getDateKey(s.startTime) === dayKey);
                        if (!daySession) return null;
                        return (
                          <button
                            key={dayKey}
                            className={`${styles.dayDropdownItem} ${selectedDay === dayKey ? styles.dayDropdownItemActive : ''}`}
                            onClick={() => {
                              setSelectedDay(dayKey);
                              setDayDropdownOpen(false);
                            }}
                          >
                            {formatDateShort(daySession.startTime)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className={styles.availabilityScrollContainer}>
                  <div className={styles.availabilityGrid}>
                    {filteredSessions.map((session) => {
                      const meta = getFieldMeta(session.calendarID);
                      const timeString = formatTime(session.startTime);
                      const dateString = formatDate(session.startTime);
                      const durationText = selectedType === '18525224' ? '30 min' :
                                          selectedType === '29373489' ? '45 min' :
                                          selectedType === '18525161' ? '1 hour' : '30 min';
                      const price = getPriceForType(selectedType);
                      return (
                        <SessionCard
                          key={session.id}
                          meta={meta}
                          time={timeString}
                          date={dateString}
                          duration={durationText}
                          price={price}
                          onClick={() => handleBookSession(session)}
                        />
                      );
                    })}
                  </div>
                </div>
              </>
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
            src="/images/homeicon.png"
            alt="Dashboard"
            width={32}
            height={32}
            className={styles.footerIcon}
          />
          <span className={styles.footerLabel}>Home</span>
        </Link>

        <Link href="/book" className={styles.footerAction} aria-current="page">
          <Image
            src="/booksession.png"
            alt="Book Session"
            width={32}
            height={32}
            className={styles.footerIcon}
          />
          <span className={styles.footerLabel}>Book</span>
        </Link>

        <Link href="/my-sessions" className={styles.footerAction}>
          <Image
            src="/viewsessions.png"
            alt="My Sessions"
            width={32}
            height={32}
            className={styles.footerIcon}
          />
          <span className={styles.footerLabel}>Sessions</span>
        </Link>

        <Link href="/location" className={styles.footerAction}>
          <Image
            src="/location.png"
            alt="Locations"
            width={32}
            height={32}
            className={styles.footerIcon}
          />
          <span className={styles.footerLabel}>Location</span>
        </Link>

        <Link href="/settings" className={styles.footerAction}>
          <Image
            src="/images/settingsicon.png"
            alt="Settings"
            width={32}
            height={32}
            className={styles.footerIcon}
          />
          <span className={styles.footerLabel}>Settings</span>
        </Link>
      </footer>
    </>
  );
}
