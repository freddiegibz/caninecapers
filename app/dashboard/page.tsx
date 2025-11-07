"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatLondon } from "../../src/utils/dateTime";
import { useRouter } from "next/navigation";
import HeroSection from "../../components/HeroSection";
import styles from "./page.module.css";


export default function Dashboard() {
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
    appointmentTypeID: string; // Include appointment type
  };

  const [sessions, setSessions] = useState<NormalizedSession[]>([]);
  const [selectedField, setSelectedField] = useState<number>(0); // All fields by default
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchAvailability = async () => {
      try {
        setLoading(true);
        
        // Fetch all appointment types
        const appointmentTypes = ['18525224', '29373489', '18525161']; // 30 min, 45 min, 1 hour
        
        const allPromises = appointmentTypes.map(async (typeID) => {
          const res = await fetch(`/api/availability?appointmentTypeID=${encodeURIComponent(typeID)}`, { cache: "no-store" });
          if (!res.ok) return [];
          const data: AvailabilityResponseItem[] = await res.json();
          return data.map((item, idx) => ({
            id: `${item.calendarID}-${typeID}-${idx}-${item.startTime}`,
            calendarID: Number(item.calendarID),
            startTime: item.startTime,
            appointmentTypeID: typeID,
          }));
        });

        const allResults = await Promise.all(allPromises);
        let normalized: NormalizedSession[] = allResults.flat();

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
  }, [selectedField]);

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
    const price = getPriceForType(session.appointmentTypeID);
    const durationText = session.appointmentTypeID === '18525224' ? '30 min' :
                        session.appointmentTypeID === '29373489' ? '45 min' :
                        session.appointmentTypeID === '18525161' ? '1 hour' : '30 min';

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
      appointmentTypeID: session.appointmentTypeID
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
            onBookSession={() => {}}
            onViewBookings={() => {}}
          />

          {/* Dashboard Content */}
          <div className={styles.dashboardContent}>
            {/* Next Session Card */}
            <div className={styles.nextSessionCard}>
              <div className={styles.nextSessionHeader}>
                <h3 className={styles.nextSessionTitle}>Your Next Session</h3>
                <button className={styles.viewDetailsLink}>View Details</button>
              </div>
              <div className={styles.nextSessionInfo}>
                <span className={styles.nextSessionText}>Central Bark · Fri 7 Nov · 17:15</span>
              </div>
            </div>

            {/* Available Today Section */}
            <div className={styles.availableTodayContent}>
              <p className={styles.availableTodayCaption}>Looking to book more?</p>
              <h2 className={styles.dashboardSectionTitle}>Available Today</h2>

              {loading && (
                <div style={{ width: '100%', textAlign: 'center', color: '#2b3a29', marginBottom: '0.75rem', fontWeight: 600 }}>
                  Loading available sessions…
                </div>
              )}

              {/* Available Times Section - shows today's sessions */}
              <div className={styles.availableTimesSection}>
              <div className={styles.availableTimesList}>
                {sessions
                  .filter(session => {
                    const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
                    return sessionDate === selectedDay;
                  })
                  .length === 0 ? (
                    <div className={styles.emptyState}>
                      <p>No sessions available for today.</p>
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
                        
                        // Determine duration and price from session's appointmentTypeID
                        const duration = session.appointmentTypeID === '18525224' ? '30 min' :
                                        session.appointmentTypeID === '29373489' ? '45 min' :
                                        session.appointmentTypeID === '18525161' ? '1 hour' : '30 min';
                        const price = getPriceForType(session.appointmentTypeID);

                        return (
                          <div
                            key={session.id}
                            className={styles.availableTimeItem}
                          >
                            <div className={styles.availableTimeImageWrapper}>
                              <Image
                                src={fieldImage}
                                alt={`${meta.name} field`}
                                width={160}
                                height={110}
                                className={styles.availableTimeImage}
                              />
                              <div className={styles.imageGradientOverlay}></div>
                            </div>
                            <div className={styles.availableTimeContent}>
                              <div className={styles.availableTimeTime}>{timeString}</div>
                              <div className={styles.availableTimeDetails}>
                                <span className={styles.availableTimeField}>{meta.name}</span>
                                <span className={styles.availableTimeSeparator}>·</span>
                                <span className={styles.availableTimeLength}>{duration}</span>
                                <span className={styles.availableTimeSeparator}>·</span>
                                <span className={styles.availableTimePrice}>{price}</span>
                              </div>
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
            </div>
          </div>
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

