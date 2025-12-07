"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatLondon } from "../../src/utils/dateTime";
import { supabase } from "../../src/lib/supabaseClient";
import AppHeader from "../../components/AppHeader";
import BottomNav from "../../components/BottomNav";
import styles from "./page.module.css";

// Icons Components (Content specific)
const LocationIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
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
          .limit(2);

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
              message: 'Agility equipment upgrades complete. Now open.',
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

  const getSessionDisplay = () => {
    if (!nextSession) return null;
    const formatted = formatLondon(nextSession.iso);
    const parts = formatted.split('·');
    return {
      date: parts[0]?.trim() || '',
      time: parts[1]?.trim() || ''
    };
  };

  const sessionDisplay = getSessionDisplay();

  return (
    <div className={styles.dashboard}>
      <AppHeader />

      {/* Main Content */}
      <div className={styles.content}>
        {/* Greeting */}
        <div className={styles.greeting}>
          <div className={styles.greetingText}>{getGreeting()}</div>
          <h1 className={styles.greetingName}>{userName || "Welcome back"}</h1>
        </div>

        {/* Primary Card */}
        <div className={styles.primaryCard}>
          {loading ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>Loading...</p>
            </div>
          ) : nextSession && sessionDisplay ? (
            <>
              <div className={styles.cardLabel}>
                <span className={styles.cardLabelDot}></span>
                Upcoming Session
              </div>
              <div className={styles.sessionDisplay}>
                <div className={styles.sessionTime}>{sessionDisplay.time}</div>
                <div className={styles.sessionDate}>{sessionDisplay.date}</div>
              </div>
              <div className={styles.sessionMeta}>
                <span className={styles.metaChip}>
                  <LocationIcon />
                  {nextSession.field}
                </span>
              </div>
              <div style={{ marginTop: '2rem' }}>
                <Link href="/my-sessions" className={`${styles.actionButton} ${styles.actionButtonSecondary}`}>
                  View Details
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className={styles.cardLabel}>
                <span className={styles.cardLabelDot}></span>
                No Upcoming Sessions
              </div>
              <div className={styles.emptyState}>
                <p className={styles.emptyText}>
                  Ready for your next adventure?
                </p>
                <Link href="/book" className={styles.actionButton}>
                  Book a Session <ArrowRightIcon />
                </Link>
              </div>
            </>
          )
          }
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          <Link href="/book" className={styles.quickAction}>
            <div className={styles.quickActionIcon}>
              <Image src="/booksession.png" alt="" width={24} height={24} />
            </div>
            <div className={styles.quickActionText}>
              <span className={styles.quickActionLabel}>Book Field</span>
              <span className={styles.quickActionSub}>Find available slots</span>
            </div>
          </Link>
          <Link href="/my-sessions" className={styles.quickAction}>
            <div className={styles.quickActionIcon}>
              <Image src="/viewsessions.png" alt="" width={24} height={24} />
            </div>
            <div className={styles.quickActionText}>
              <span className={styles.quickActionLabel}>My Sessions</span>
              <span className={styles.quickActionSub}>View & manage</span>
            </div>
          </Link>
        </div>

        {/* Notice Board */}
        {notices.length > 0 && (
          <div className={styles.noticeSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Club Updates</h2>
            </div>
            <div className={styles.noticeList}>
              {notices.map(notice => (
                <div 
                  key={notice.id} 
                  className={`${styles.notice} ${notice.priority === 'warning' ? styles.warning : ''}`}
                >
                  <div className={styles.noticeContent}>
                    <h3 className={styles.noticeTitle}>{notice.title}</h3>
                    <p className={styles.noticeMessage}>{notice.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
