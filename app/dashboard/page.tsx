"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatLondon } from "../../src/utils/dateTime";
import { useRouter } from "next/navigation";
import { supabase } from "../../src/lib/supabaseClient";
import HeroSection from "../../components/HeroSection";
import styles from "./page.module.css";


export default function Dashboard() {
  const [selectedDay] = useState<string>(() => {
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
  const [selectedField] = useState<number>(0); // All fields by default
  const [loading, setLoading] = useState<boolean>(false);
  const quickActionsRef = useRef<HTMLDivElement>(null);
  const [focusedActionIndex, setFocusedActionIndex] = useState<number>(-1);
  const [nextSession, setNextSession] = useState<{ field: string; iso: string } | null>(null);
  const [loadingNext, setLoadingNext] = useState<boolean>(true);
  const [showProfileSetup, setShowProfileSetup] = useState<boolean>(false);

  // Notice Board State
  type Notice = {
    id: string;
    title: string;
    message: string;
    priority: 'info' | 'warning' | 'important';
    created_at: string;
  };
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loadingNotices, setLoadingNotices] = useState<boolean>(true);
  const [noticeBoardExpanded, setNoticeBoardExpanded] = useState<boolean>(false);

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

    // Check if user has set up their profile
    const checkProfileSetup = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata) {
          const hasName = !!(user.user_metadata.first_name || user.user_metadata.last_name);
          const hasPhone = !!user.user_metadata.phone;
          setShowProfileSetup(!hasName || !hasPhone);
        } else {
          setShowProfileSetup(true);
        }
      } catch (error) {
        console.error('Error checking profile setup:', error);
        setShowProfileSetup(true); // Show by default if check fails
      }
    };

    checkProfileSetup();

    return () => {
      isMounted = false;
    };
  }, [selectedField]);

  // Fetch next chronological session for the authenticated user
  useEffect(() => {
    let isMounted = true;
    const loadNext = async () => {
      try {
        setLoadingNext(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) {
          setNextSession(null);
          return;
        }
        const nowIso = new Date().toISOString();
        const { data, error } = await supabase
          .from('sessions')
          .select('field, date')
          .eq('user_id', user.id)
          .eq('status', 'complete')
          .gt('date', nowIso)
          .order('date', { ascending: true })
          .limit(1);
        if (error) {
          console.error('Failed to load next session:', error);
          setNextSession(null);
          return;
        }
        const row = (data && data[0]) ? data[0] : null;
        if (!isMounted) return;
        setNextSession(row ? { field: String(row.field || 'Central Bark'), iso: String(row.date) } : null);
      } finally {
        if (isMounted) setLoadingNext(false);
      }
    };
    loadNext();
    return () => { isMounted = false; };
  }, []);

  // Fetch notices from Supabase
  useEffect(() => {
    let isMounted = true;
    const loadNotices = async () => {
      try {
        setLoadingNotices(true);
        const now = new Date().toISOString();
        
        // Try to fetch from Supabase notices table
        const { data, error } = await supabase
          .from('notices')
          .select('id, title, message, priority, created_at')
          .eq('is_active', true)
          .lte('start_date', now)
          .or(`end_date.is.null,end_date.gte.${now}`)
          .order('priority', { ascending: false }) // important first
          .order('created_at', { ascending: false }) // newest first
          .limit(5);

        if (error) {
          // Table might not exist yet, use mock data for demo
          console.log('Notices table not found, using mock data:', error.message);
          const mockNotices: Notice[] = [
            {
              id: '1',
              title: 'Welcome to Canine Capers!',
              message: 'We\'re excited to have you here. Book your first session and let your dog enjoy our premium fields.',
              priority: 'info',
              created_at: new Date().toISOString(),
            },
            {
              id: '2',
              title: 'New Field Opening Soon',
              message: 'We\'re opening a third location next month! Stay tuned for updates.',
              priority: 'important',
              created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            },
          ];
          if (isMounted) setNotices(mockNotices);
        } else {
          if (isMounted) setNotices(data || []);
        }
      } catch (err) {
        console.error('Failed to load notices:', err);
        if (isMounted) setNotices([]);
      } finally {
        if (isMounted) setLoadingNotices(false);
      }
    };
    loadNotices();
    return () => { isMounted = false; };
  }, []);

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

  const handleQuickActionKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (!quickActionsRef.current) return;

    const buttons = Array.from(quickActionsRef.current.querySelectorAll('[role="button"]')) as HTMLElement[];
    const totalButtons = buttons.length;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (index + 1) % totalButtons;
      setFocusedActionIndex(nextIndex);
      setTimeout(() => buttons[nextIndex]?.focus(), 0);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (index - 1 + totalButtons) % totalButtons;
      setFocusedActionIndex(prevIndex);
      setTimeout(() => buttons[prevIndex]?.focus(), 0);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setFocusedActionIndex(0);
      setTimeout(() => buttons[0]?.focus(), 0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setFocusedActionIndex(totalButtons - 1);
      setTimeout(() => buttons[totalButtons - 1]?.focus(), 0);
    }
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

      {showProfileSetup && (
        <div className={styles.profileSetupBar}>
          <div className={styles.profileSetupContent}>
            <div className={styles.profileSetupIcon}>👤</div>
            <div className={styles.profileSetupText}>
              Set up your profile for smoother booking experience
            </div>
            <Link href="/settings" className={styles.profileSetupLink}>
              Complete Setup
            </Link>
          </div>
        </div>
      )}

      <div className={styles.container}>
        <main className={styles.main}>
          {/* Notice Board Section */}
          {notices.length > 0 && (
            <div className={styles.noticeBoardCard}>
              <div className={styles.noticeBoardHeader}>
                <div className={styles.noticeBoardTitleWrapper}>
                  <Image
                    src="/noticeboard.jpg"
                    alt="Notice board icon"
                    width={20}
                    height={20}
                    className={styles.noticeBoardIcon}
                  />
                  <h3 className={styles.noticeBoardTitle}>Notice Board</h3>
                </div>
                <button
                  className={styles.noticeBoardToggle}
                  onClick={() => setNoticeBoardExpanded(!noticeBoardExpanded)}
                  aria-label={noticeBoardExpanded ? 'Collapse notice board' : 'Expand notice board'}
                >
                  <span className={styles.toggleIcon}>
                    {noticeBoardExpanded ? '−' : '+'}
                  </span>
                </button>
              </div>
              {noticeBoardExpanded && (
                <div className={styles.noticeBoardContent}>
                  {loadingNotices ? (
                    <div className={styles.noticeItem}>
                      <p className={styles.noticeMessage}>Loading announcements...</p>
                    </div>
                  ) : (
                    notices.map((notice) => {
                      const priorityClass = notice.priority === 'important'
                        ? styles.noticePriorityImportant
                        : notice.priority === 'warning'
                        ? styles.noticePriorityWarning
                        : styles.noticePriorityInfo;

                      return (
                        <div key={notice.id} className={styles.noticeItem}>
                          <div className={styles.noticeItemHeader}>
                            <span className={`${styles.noticePriorityBadge} ${priorityClass}`}>
                              {notice.priority === 'important' ? 'Important' : notice.priority === 'warning' ? 'Update' : 'Info'}
                            </span>
                            <h4 className={styles.noticeTitle}>{notice.title}</h4>
                          </div>
                          <p className={styles.noticeMessage}>{notice.message}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          <HeroSection />

          {/* Dashboard Content */}
          <div className={styles.dashboardContent}>
            {/* Next Session Card */}
            <div className={styles.nextSessionCard}>
              <div className={styles.nextSessionContent}>
                <div className={styles.nextSessionDetails}>
                  <h3 className={styles.nextSessionTitle}>Your Next Session</h3>
                  {loadingNext ? (
                    <div className={styles.nextSessionInfoRow}>
                      <span className={styles.nextSessionField}>Loading…</span>
                    </div>
                  ) : nextSession ? (
                    <>
                      <div className={styles.nextSessionInfoRow}>
                        <span className={styles.nextSessionField}>{nextSession.field}</span>
                      </div>
                      <div className={styles.nextSessionInfoRow}>
                        <span className={styles.nextSessionDate}>{formatLondon(nextSession.iso).split('·')[0].trim()}</span>
                        <span className={styles.nextSessionTime}>{formatLondon(nextSession.iso).split('·').slice(1).join('·').trim()}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={styles.nextSessionInfoRow}>
                        <span className={styles.nextSessionField}>No upcoming session</span>
                      </div>
                      <div className={styles.nextSessionInfoRow}>
                        <Link href="/book" className={styles.viewDetailsLink}>Book one now →</Link>
                      </div>
                    </>
                  )}
                </div>
                <Link href="/my-sessions" className={styles.viewDetailsLink}>
                  View Details →
                </Link>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className={styles.quickActionsContainer}>
              <div className={styles.quickActionsSeparator}></div>
              <div className={styles.quickActionsLabel}>Quick Actions</div>
              <div className={styles.quickActionsScroll} ref={quickActionsRef} role="toolbar" aria-label="Quick actions">
                <Link 
                  href="/book" 
                  className={styles.quickActionButton}
                  role="button"
                  aria-label="Book again"
                  tabIndex={focusedActionIndex === -1 ? 0 : focusedActionIndex === 0 ? 0 : -1}
                  onKeyDown={(e) => handleQuickActionKeyDown(e, 0)}
                  onFocus={() => setFocusedActionIndex(0)}
                >
                  <div className={styles.quickActionIcon}>
                    <Image
                      src="/booksession.png"
                      alt=""
                      width={24}
                      height={24}
                      aria-hidden="true"
                    />
                  </div>
                  <span className={styles.quickActionLabel}>Book Again</span>
                </Link>
                <Link 
                  href="/my-sessions" 
                  className={styles.quickActionButton}
                  role="button"
                  aria-label="View bookings"
                  tabIndex={focusedActionIndex === -1 ? 0 : focusedActionIndex === 1 ? 0 : -1}
                  onKeyDown={(e) => handleQuickActionKeyDown(e, 1)}
                  onFocus={() => setFocusedActionIndex(1)}
                >
                  <div className={styles.quickActionIcon}>
                    <Image
                      src="/viewsessions.png"
                      alt=""
                      width={24}
                      height={24}
                      aria-hidden="true"
                    />
                  </div>
                  <span className={styles.quickActionLabel}>View Bookings</span>
                </Link>
                <Link 
                  href="/location" 
                  className={styles.quickActionButton}
                  role="button"
                  aria-label="Directions"
                  tabIndex={focusedActionIndex === -1 ? 0 : focusedActionIndex === 2 ? 0 : -1}
                  onKeyDown={(e) => handleQuickActionKeyDown(e, 2)}
                  onFocus={() => setFocusedActionIndex(2)}
                >
                  <div className={styles.quickActionIcon}>
                    <Image
                      src="/location.png"
                      alt=""
                      width={24}
                      height={24}
                      aria-hidden="true"
                    />
                  </div>
                  <span className={styles.quickActionLabel}>Directions</span>
                </Link>
                <a 
                  href="tel:+447533185734" 
                  className={styles.quickActionButton}
                  role="button"
                  aria-label="Contact us"
                  tabIndex={focusedActionIndex === -1 ? 0 : focusedActionIndex === 3 ? 0 : -1}
                  onKeyDown={(e) => handleQuickActionKeyDown(e, 3)}
                  onFocus={() => setFocusedActionIndex(3)}
                >
                  <div className={styles.quickActionIcon}>
                    <Image
                      src="/locationicon/phone.png"
                      alt=""
                      width={24}
                      height={24}
                      aria-hidden="true"
                    />
                  </div>
                  <span className={styles.quickActionLabel}>Contact Us</span>
                </a>
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
                                <span className={styles.availableTimeLength}>
                                  <span className={styles.clockIcon}>🕒</span> {duration}
                                </span>
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

    </>
  );
}

