"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatLondon } from "../../src/utils/dateTime";
import { useRouter } from "next/navigation";
import { supabase } from "../../src/lib/supabaseClient";
import SessionCard from "../../components/SessionCard";
import styles from "./page.module.css";


export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<'availability' | 'sessions'>('availability');
  const [userName, setUserName] = useState<string>('');
  const [userNameLoading, setUserNameLoading] = useState<boolean>(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [dayGroups, setDayGroups] = useState<Record<string, { date: string; dayName: string; count: number; sessions: NormalizedSession[] }>>({});
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
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;

  useEffect(() => {
    // Load user name on component mount
    loadUserName();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async (event, _session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await loadUserName();
        } else if (event === 'SIGNED_OUT') {
          setUserName('');
          setUserNameLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchAvailability = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/availability?appointmentTypeID=${encodeURIComponent(selectedType)}`, { cache: "no-store" });
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

        // Group by date and count slots when field and type are selected
        const dayGroups: Record<string, { date: string; dayName: string; count: number; sessions: NormalizedSession[] }> = {};
        normalized.forEach(session => {
          const date = new Date(session.startTime);
          const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
          const dayName = date.toLocaleDateString('en-GB', { weekday: 'long' });

          if (!dayGroups[dateKey]) {
            dayGroups[dateKey] = {
              date: dateKey,
              dayName,
              count: 0,
              sessions: []
            };
          }
          dayGroups[dateKey].count++;
          dayGroups[dateKey].sessions.push(session);
        });

        if (isMounted) {
          setSessions(normalized);
          setDayGroups(dayGroups);
          setCurrentPage(1);
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
  }, [selectedType, selectedField]);

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

  const loadUserName = async () => {
    try {
      console.log('Loading user name...');
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('Error fetching user:', error);
        setUserName('Guest');
        setUserNameLoading(false);
        return;
      }

      console.log('User object:', user);
      console.log('User ID:', user?.id);
      console.log('User email:', user?.email);
      console.log('User metadata:', user?.user_metadata);

      if (user) {
        // Try multiple ways to get the name
        let name = null;

        // 1. Check user metadata for name
        name = user.user_metadata?.name || user.user_metadata?.full_name || user.user_metadata?.display_name;
        console.log('Name from metadata:', name);

        // 2. Check user metadata for first/last name combination
        if (!name && user.user_metadata) {
          const firstName = user.user_metadata.first_name || user.user_metadata.given_name;
          const lastName = user.user_metadata.last_name || user.user_metadata.family_name;
          if (firstName || lastName) {
            name = [firstName, lastName].filter(Boolean).join(' ');
            console.log('Name from first/last name:', name);
          }
        }

        // 3. Try to fetch from profiles table
        if (!name) {
          console.log('Name not in metadata, checking profiles table...');
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('name, first_name, last_name, full_name')
              .eq('id', user.id)
              .single();

            console.log('Profile query result:', { profile, profileError });

            if (!profileError && profile) {
              // Try different name fields from profiles table
              name = profile.name || profile.full_name ||
                     (profile.first_name && profile.last_name ? `${profile.first_name} ${profile.last_name}` : null) ||
                     profile.first_name || profile.last_name;

              console.log('Name from profiles table:', name);
            } else {
              console.log('Profile query failed:', profileError?.message);
            }
          } catch (profileErr) {
            console.error('Error querying profiles table:', profileErr);
          }
        }

        // 4. Fallback to email username
        if (!name && user.email) {
          name = user.email.split('@')[0];
          console.log('Using email username:', name);
        }

        const finalName = name || 'Guest';
        console.log('Final name to display:', finalName);
        setUserName(finalName);
        setUserNameLoading(false);
      } else {
        console.log('No authenticated user found');
        setUserName('Guest');
        setUserNameLoading(false);
      }
    } catch (error) {
      console.error('Error loading user name:', error);
      setUserName('Guest');
      setUserNameLoading(false);
    }
  };

  return (
    <>
      <header className={styles.navbar}>
        <div className={styles.navbarContent}>
          {!userNameLoading && userName && (
            <div className={styles.greeting}>
              <h1 className={styles.greetingName}>Hello, {userName}</h1>
              <p className={styles.greetingSubtitle}>Welcome to Canine Capers</p>
            </div>
          )}
        </div>
      </header>

      <div className={styles.container}>
        <main className={styles.main}>
          <section className={styles.compactHero}>
            <div className={styles.heroContent}>
              {!userNameLoading && userName && (
                <h1 className={styles.heroGreeting}>
                  Welcome back, {userName}
                </h1>
              )}
              <h2 className={styles.heroTitle}>
                Your Canine Capers Hub
              </h2>
              <p className={styles.heroSubtitle}>
                Book, manage, and enjoy your sessions.
              </p>
            </div>

            <div className={styles.heroImageWrapper}>
              <Image
                src="/dogdashboardsection.png"
                alt="Excited dog enjoying playtime"
                width={360}
                height={260}
                className={styles.heroImage}
                priority
              />
            </div>
          </section>

          {/* Section Title */}
          <h2 className={styles.dashboardSectionTitle}>Check Your Bookings or See What&apos;s Available</h2>

          <div className={styles.sectionToggle}>
            <button
              className={`${styles.toggleButton} ${styles.tab} ${activeSection === 'availability' ? styles.active : ''}`}
              onClick={() => setActiveSection('availability')}
            >
              Available Sessions
            </button>
            <button
              className={`${styles.toggleButton} ${styles.tab} ${activeSection === 'sessions' ? styles.active : ''}`}
              onClick={() => setActiveSection('sessions')}
            >
              Your Sessions
            </button>
          </div>

          {activeSection === 'availability' && (
            <section className={styles.section}>
              <h2 className={styles.dashboardSectionTitle}>Available Sessions</h2>
              <h3 className={styles.sectionSubtitle}>
                Select Session Length & Field
              </h3>

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
                          onClick={() => {
                            setSelectedType(opt.id);
                            setSelectedDay(null);
                            setCurrentPage(1);
                          }}
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
                          onClick={() => {
                          setSelectedField(field.id);
                          setSelectedDay(null);
                          setCurrentPage(1);
                        }}
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
                <div style={{ width: '100%', textAlign: 'center', color: '#2b3a29', marginBottom: '0.75rem', fontWeight: 600 }}>
                  Loading available sessions…
                </div>
              )}
              {/* Day cards always visible when field and type are selected */}
              {selectedType && (
                <div>
                  <h3 className={styles.selectDayTitle}>Select Day</h3>
                  <div className={styles.dayCardsGrid}>
                    {Object.values(dayGroups)
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((dayGroup) => {
                        const dateObj = new Date(dayGroup.date);
                        const day = dateObj.getDate();
                        const month = dateObj.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();

                        return (
                        <div
                          key={dayGroup.date}
                          className={`${styles.dayCard} ${selectedDay === dayGroup.date ? styles.selected : ''}`}
                          onClick={() => setSelectedDay(selectedDay === dayGroup.date ? null : dayGroup.date)}
                        >
                            <div className={styles.dayName}>{dayGroup.dayName}</div>
                            <div className={styles.dayDate}>{day} {month}</div>
                            <div className={styles.daySlots}>
                              {dayGroup.count} slot{dayGroup.count !== 1 ? 's' : ''}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Available Times Section - appears below day cards when a day is selected */}
                  {selectedDay && (
                    <div className={styles.availableTimesSection}>
                      <h3 className={styles.availableTimesTitle}>Available Times</h3>
                      <div className={styles.availableTimesList}>
                        {sessions
                          .filter(session => {
                            const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
                            return sessionDate === selectedDay;
                          })
                          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                          .map((session) => {
                            const meta = getFieldMeta(session.calendarID);
                            const timeString = formatLondon(session.startTime);

                            return (
                              <div
                                key={session.id}
                                className={styles.availableTimeItem}
                                onClick={() => handleBookSession(session)}
                              >
                                <span className={styles.availableTimeTime}>{timeString}</span>
                                <span className={styles.availableTimeField}>{meta.name}</span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              )}


              {/* Show regular session grid when no type filter is applied */}
              {!selectedDay && !selectedType && (
                <div className={styles.availabilityGrid}>
                  {sessions.length === 0 && (
                    <p className={styles.availabilityTimeslot}>No sessions available for this type.</p>
                  )}
                  {sessions
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((session) => {
                      const meta = getFieldMeta(session.calendarID);
                      const dateLabel = formatLondon(session.startTime);
                      return (
                        <div key={session.id} className={styles.card}>
                          <SessionCard
                            meta={meta}
                            dateLabel={dateLabel}
                            price={getPriceForType(selectedType)}
                            onClick={() => handleBookSession(session)}
                          />
                        </div>
                      );
                    })}
                </div>
              )}
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

