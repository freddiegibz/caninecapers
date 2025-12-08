"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatLondon } from "../../src/utils/dateTime";
import { supabase } from "../../src/lib/supabaseClient";
import BottomNav from "../../components/BottomNav";
import styles from "./page.module.css";

// Icons
const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

type Notice = {
  id: string;
  title: string;
  message: string;
  priority: 'info' | 'warning' | 'important';
};

type NextSession = {
  field: string;
  iso: string;
} | null;

export default function Dashboard() {
  const [userName, setUserName] = useState<string>("");
  const [nextSession, setNextSession] = useState<NextSession>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [noticesExpanded, setNoticesExpanded] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (isMounted && user?.user_metadata?.first_name) {
          setUserName(user.user_metadata.first_name);
        }

        if (user?.id) {
          const nowIso = new Date().toISOString();
          const { data: sessionData } = await supabase
            .from('sessions')
            .select('field, date')
            .eq('user_id', user.id)
            .eq('status', 'complete')
            .gt('date', nowIso)
            .order('date', { ascending: true })
            .limit(1);

          if (isMounted && sessionData?.[0]) {
            setNextSession({ 
              field: String(sessionData[0].field || 'Central Bark'), 
              iso: String(sessionData[0].date) 
            });
          }
        }

        const { data: noticesData } = await supabase
          .from('notices')
          .select('id, title, message, priority')
          .eq('is_active', true)
          .limit(3);

        if (isMounted && noticesData?.length) {
          setNotices(noticesData);
        } else if (isMounted) {
          setNotices([
            {
              id: '1',
              title: 'Winter Hours',
              message: 'Last booking slot is now 4:00 PM through February.',
              priority: 'info',
            },
            {
              id: '2',
              title: 'Hyde Bark Update',
              message: 'Agility equipment upgrades complete.',
              priority: 'warning',
            }
          ]);
        }
      } catch (error) {
        console.error('Dashboard error:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  };

  const formatSessionDate = (iso: string) => {
    const date = new Date(iso);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    if (isToday) return "Today";
    if (isTomorrow) return "Tomorrow";
    
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatSessionTime = (iso: string) => {
    const formatted = formatLondon(iso);
    const parts = formatted.split('·');
    return parts[1]?.trim() || '';
  };

  return (
    <div className={styles.page}>
      {/* Header / brand */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <Image 
            src="/dogdashboardsection.png" 
            alt="Canine Capers" 
            width={40} 
            height={30} 
            className={styles.brandIcon} 
          />
          <span className={styles.brandName}>Canine Capers</span>
        </div>
      </header>

      <main className={styles.main}>
        {/* Greeting */}
        <section className={styles.hero}>
          <span className={styles.greeting}>{getGreeting()}</span>
          <h1 className={styles.userName}>{userName || "Welcome"}</h1>
        </section>

        {/* Primary booking actions */}
        <section className={styles.actions}>
          <Link href="/book" className={styles.actionPrimary}>
            <span className={styles.actionIcon}><PlusIcon /></span>
            <span>Book Session</span>
          </Link>
          <Link href="/my-sessions" className={styles.actionSecondary}>
            <span className={styles.actionIcon}><CalendarIcon /></span>
            <span>My Sessions</span>
          </Link>
        </section>

        {/* Next session */}
        <section className={styles.sessionSection}>
          <div className={styles.sectionLabel}>
            <span>Next Session</span>
          </div>
          
          {loading ? (
            <div className={styles.sessionCard}>
              <div className={styles.sessionLoading}>Loading...</div>
            </div>
          ) : nextSession ? (
            <Link href="/my-sessions" className={styles.sessionCard}>
              <div className={styles.sessionHeader}>
                <div className={styles.sessionDate}>
                  {formatSessionDate(nextSession.iso)}
                </div>
                <ChevronRightIcon />
              </div>
              <div className={styles.sessionTime}>
                <ClockIcon />
                <span>{formatSessionTime(nextSession.iso)}</span>
              </div>
              <div className={styles.sessionLocation}>
                <MapPinIcon />
                <span>{nextSession.field}</span>
              </div>
            </Link>
          ) : (
            <div className={styles.sessionCardEmpty}>
              <p>No upcoming sessions</p>
              <Link href="/book" className={styles.bookLink}>
                Book your first session
              </Link>
            </div>
          )}
        </section>

        {/* Notices */}
        {notices.length > 0 && (
          <section className={styles.noticesSection}>
            <button 
              className={styles.noticesHeader} 
              onClick={() => setNoticesExpanded(!noticesExpanded)}
              aria-expanded={noticesExpanded}
            >
              <div className={styles.sectionLabelNotice}>
                <BellIcon />
                <span>Notices ({notices.length})</span>
              </div>
              {noticesExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
            </button>
            
            {noticesExpanded && (
              <div className={styles.noticesList}>
                {notices.map(notice => (
                  <div 
                    key={notice.id} 
                    className={`${styles.noticeItem} ${notice.priority === 'warning' ? styles.noticeWarning : ''}`}
                  >
                    <div className={styles.noticeDot}></div>
                    <div className={styles.noticeContent}>
                      <span className={styles.noticeTitle}>{notice.title}</span>
                      <span className={styles.noticeText}>{notice.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* FAB + nav */}
      <BottomNav />
    </div>
  );
}
