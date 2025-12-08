"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatLondon } from "../../src/utils/dateTime";
import { supabase } from "../../src/lib/supabaseClient";
import BottomNav from "../../components/BottomNav";
import styles from "./page.module.css";

// Icons
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

const ProfileIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
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
  const [noticesExpanded, setNoticesExpanded] = useState(false);

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
          // Default notices if none in DB
          setNotices([
            {
              id: '1',
              title: 'Winter Hours',
              message: 'Last booking slot is now 4:00 PM.',
              priority: 'info',
            },
            {
              id: '2',
              title: 'Field Maintenance',
              message: 'Agility course closed for upgrades.',
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

  const formatSessionDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString('en-GB', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const formatSessionTime = (iso: string) => {
    const formatted = formatLondon(iso);
    const parts = formatted.split('·');
    return parts[1]?.trim() || '';
  };

  return (
    <div className={styles.page}>
      
      {/* 1. Top Bar */}
      <header className={styles.topBar}>
        <div className={styles.logoContainer}>
          <Image 
            src="/caninecaperslogosymbol.png" 
            alt="Canine Capers" 
            width={32} 
            height={32}
            className={styles.logo}
          />
          <span className={styles.logoText}>Canine Capers</span>
        </div>
        <Link href="/settings" className={styles.profileButton}>
          <ProfileIcon />
        </Link>
      </header>

      <main className={styles.main}>
        
        {/* 2. Hero Card */}
        <section className={styles.heroCard}>
          <div className={styles.heroContent}>
            <p className={styles.welcomeText}>Welcome back, {userName || "User"}</p>
            <h1 className={styles.heroTitle}>What would you<br />like to do?</h1>
            
            <div className={styles.heroActions}>
              <Link href="/book" className={styles.btnPrimary}>
                Book Session
              </Link>
              <Link href="/my-sessions" className={styles.btnSecondary}>
                My Sessions
              </Link>
            </div>
          </div>
        </section>

        {/* 3. Upcoming Session Card */}
        <section className={styles.section}>
          {loading ? (
             <div className={styles.sessionCardLoading}>Loading...</div>
          ) : nextSession ? (
            <Link href="/my-sessions" className={styles.sessionCard}>
              <div className={styles.sessionThumbnail}>
                {/* Fallback pattern since we don't have real thumbnails */}
                <div className={styles.thumbnailPattern} />
              </div>
              <div className={styles.sessionInfo}>
                <span className={styles.sessionField}>{nextSession.field}</span>
                <div className={styles.sessionDateTime}>
                  <ClockIcon />
                  <span>{formatSessionDate(nextSession.iso)} · {formatSessionTime(nextSession.iso)}</span>
                </div>
                <span className={styles.viewDetails}>View details &rarr;</span>
              </div>
            </Link>
          ) : (
            <div className={styles.emptySessionCard}>
              <p className={styles.emptyTitle}>No upcoming sessions</p>
              <Link href="/book" className={styles.emptyCta}>
                Book your first session
              </Link>
            </div>
          )}
        </section>

        {/* 4. Notices (Collapsible) */}
        {notices.length > 0 && (
          <section className={styles.section}>
            <button 
              className={styles.noticesHeader} 
              onClick={() => setNoticesExpanded(!noticesExpanded)}
            >
              <span className={styles.noticesTitle}>Notices ({notices.length})</span>
              {noticesExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
            </button>
            
            {noticesExpanded && (
              <div className={styles.noticesList}>
                {notices.map(notice => (
                  <div key={notice.id} className={styles.noticeItem}>
                    <div className={`${styles.noticeDot} ${notice.priority === 'warning' ? styles.warningDot : ''}`} />
                    <div className={styles.noticeContent}>
                      <span className={styles.noticeHeading}>{notice.title}</span>
                      <span className={styles.noticeMessage}>{notice.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </main>

      <BottomNav />
    </div>
  );
}
