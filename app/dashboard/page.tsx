"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<'availability' | 'sessions'>('availability');

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
          setCurrentPage(1);
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

  return (
    <>
      <header className={styles.navbar}>
        <div className={styles.navbarContent}>
          <div className={styles.greeting}>
            <h1 className={styles.greetingName}>Hello, Sarah</h1>
            <p className={styles.greetingSubtitle}>Welcome to Canine Capers</p>
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
          <article className={styles.introCard}>
            <div className={styles.introContent}>
              <h2 className={styles.introTitle}>Your Canine Capers Hub</h2>
              <p className={styles.introSubtitle}>Easily book, manage, and enjoy your private Canine Capers sessions</p>
            </div>

            <div className={styles.introImageWrapper}>
              <Image
                src="/dogdashboardsection.png"
                alt="Excited dog enjoying playtime"
                width={360}
                height={260}
                className={styles.introImage}
                priority
              />
            </div>
          </article>

          <div className={styles.sectionToggle}>
            <button
              className={`${styles.toggleButton} ${activeSection === 'availability' ? styles.active : ''}`}
              onClick={() => setActiveSection('availability')}
            >
              Upcoming Availability
            </button>
            <button
              className={`${styles.toggleButton} ${activeSection === 'sessions' ? styles.active : ''}`}
              onClick={() => setActiveSection('sessions')}
            >
              Your Future Sessions
            </button>
          </div>

          {activeSection === 'availability' && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                Available Slots
                <span className={styles.titleUnderline}></span>
              </h2>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {[{ id: '18525224', label: '30-Minute Reservation' }, { id: '29373489', label: '45-Minute Reservation' }, { id: '18525161', label: '1-Hour Reservation' }].map(opt => {
                  const checked = selectedType === opt.id;
                  return (
                    <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #e2dccb', background: checked ? '#f8f6f2' : '#ffffff', color: '#2b3a29', fontWeight: 600 }}>
                      <input
                        type="radio"
                        name="appointmentType"
                        value={opt.id}
                        checked={checked}
                        onChange={(e) => setSelectedType(e.target.value)}
                        disabled={loading}
                        style={{ accentColor: '#2b3a29' as unknown as string, width: 18, height: 18, borderRadius: 6 }}
                      />
                      {opt.label}
                    </label>
                  );
                })}
              </div>
              {loading && (
                <div style={{ width: '100%', textAlign: 'center', color: '#2b3a29', marginBottom: '0.75rem', fontWeight: 600 }}>
                  Loading available sessions…
                </div>
              )}
              <div className={styles.availabilityGrid}>
                {sessions.length === 0 && (
                  <p className={styles.availabilityTimeslot}>No sessions available for this type.</p>
                )}
                {sessions
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((session) => {
                  const meta = getFieldMeta(session.calendarID);
                  const dateLabel = `${formatDate(session.startTime)} · ${formatTime(session.startTime)}`;
                  return (
                    <div key={session.id} className={styles.availabilityCard}>
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
                          <span className={styles.availabilityName}>{meta.name}</span>
                          <span className={styles.availabilityPrice}>{getPriceForType(selectedType)}</span>
                        </div>
                        <span className={styles.availabilityTimeslot}>{dateLabel}</span>
                      </div>
                      <button className={styles.bookButton}>
                        Book <span className={styles.arrow}>›</span>
                      </button>
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
          )}

          {activeSection === 'sessions' && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                Your Slots
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
        <Link href="/book" className={styles.footerAction}>
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
          <span className={styles.footerLabel}>Locations</span>
        </Link>
      </footer>
    </>
  );
}

