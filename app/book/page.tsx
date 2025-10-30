"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  const [selectedType, setSelectedType] = useState<string>('18525224'); // default 30-Minute
  const [loading, setLoading] = useState<boolean>(false);

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
                src="/house.png"
                alt="Dashboard"
                width={24}
                height={24}
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
                View all available sessions in a calendar format to find the perfect time for your dog.
              </p>
              <button className={styles.calendarButton}>Open Calendar</button>
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
            <div className={styles.sessionsGrid}>
              {sessions.length === 0 && !loading && (
                <p className={styles.noSessions}>No sessions available for this type.</p>
              )}
              {sessions.slice(0, 6).map((session) => {  // Show first 6 sessions
                const meta = getFieldMeta(session.calendarID);
                const dateLabel = `${formatDate(session.startTime)} · ${formatTime(session.startTime)}`;
                const durationText = selectedType === '18525224' ? '30 min' :
                                    selectedType === '29373489' ? '45 min' :
                                    selectedType === '18525161' ? '1 hour' : '30 min';
                return (
                  <div
                    key={session.id}
                    className={styles.sessionCard}
                    onClick={() => handleBookSession(session)}
                  >
                    <div className={styles.sessionImage}>
                      <Image
                        src={meta.id === 'central-bark' ? '/centralbark.webp' : '/hydebark.webp'}
                        alt={meta.name}
                        width={80}
                        height={80}
                        className={styles.sessionImageContent}
                      />
                    </div>
                    <div className={styles.sessionDetails}>
                      <span className={styles.sessionFieldName}>{meta.name}</span>
                      <span className={styles.sessionTime}>{dateLabel}</span>
                      <span className={styles.sessionDuration}>{durationText} session</span>
                      <span className={styles.sessionPrice}>{getPriceForType(selectedType)}</span>
                    </div>
                    <div className={styles.bookButton}>
                      Book <span className={styles.arrow}>›</span>
                    </div>
                  </div>
                );
              })}
            </div>
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
          <span className={styles.footerLabel}>Locations</span>
        </Link>
      </footer>
    </>
  );
}
