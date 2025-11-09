"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import { supabase } from "../../src/lib/supabaseClient";
import { formatLondon } from "../../src/utils/dateTime";

export default function MySessions() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const [loading, setLoading] = useState<boolean>(true);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<Array<{ id: string; name: string; time: string; address: string; iso: string }>>([]);
  const [pastSessions, setPastSessions] = useState<Array<{ id: string; name: string; time: string; address: string; iso: string }>>([]);

  useEffect(() => {
    let isMounted = true;
    const loadSessions = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!isMounted) return;
        setAuthUserId(user?.id ?? null);
        if (!user?.id) {
          setUpcomingSessions([]);
          setPastSessions([]);
          return;
        }

        const { data, error } = await supabase
          .from('sessions')
          .select('id, field, date')
          .eq('user_id', user.id)
          .eq('status', 'complete')
          .order('date', { ascending: true });

        if (error) {
          console.error('Failed to load sessions:', error);
          setUpcomingSessions([]);
          setPastSessions([]);
          return;
        }

        const now = new Date();
        const normalized = (data ?? []).map((s) => {
          const iso = String(s.date);
          const name = String(s.field || 'Central Bark');
          const time = formatLondon(iso);
          const address = name.toLowerCase().includes('hyde') ? 'Hyde Bark, London' : 'Central Bark, London';
          return { id: String(s.id), name, time, address, iso };
        });

        const upcoming = normalized.filter(n => new Date(n.iso) >= now);
        const past = normalized.filter(n => new Date(n.iso) < now).reverse();

        if (!isMounted) return;
        setUpcomingSessions(upcoming);
        setPastSessions(past);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadSessions();
    return () => { isMounted = false; };
  }, []);
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
        {/* Page Header */}
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>My Sessions</h1>
          <p className={styles.pageSubtitle}>See your upcoming and past bookings in one place.</p>
          <div className={styles.headerDivider}></div>
        </header>

        {/* Segmented Toggle Bar */}
        <div className={styles.toggleBar}>
          <button
            className={`${styles.toggleButton} ${activeTab === 'upcoming' ? styles.active : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming
          </button>
          <button
            className={`${styles.toggleButton} ${activeTab === 'past' ? styles.active : ''}`}
            onClick={() => setActiveTab('past')}
          >
            Past
          </button>
        </div>

        {/* Session Lists */}
        <main className={styles.main}>
          {loading && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>⏳</div>
              <h3 className={styles.emptyTitle}>Loading your sessions…</h3>
            </div>
          )}

          {!loading && !authUserId && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🔒</div>
              <h3 className={styles.emptyTitle}>Please sign in</h3>
              <p className={styles.emptyText}>Sign in to view and manage your sessions.</p>
              <Link className={styles.primaryButton} href="/signin">Sign In</Link>
            </div>
          )}

          {!loading && authUserId && upcomingSessions.length === 0 && pastSessions.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🐶</div>
              <h3 className={styles.emptyTitle}>No sessions yet</h3>
              <p className={styles.emptyText}>Book your first run in the fields.</p>
              <Link className={styles.primaryButton} href="/book">Book a Session</Link>
            </div>
          )}
          {activeTab === 'upcoming' && (
            <div className={styles.sessionList}>
              {upcomingSessions.length > 0 ? (
                upcomingSessions.map((session, index) => (
                  <div key={session.id}>
                    <div className={styles.sessionCard}>
                      <div className={styles.sessionImageContainer}>
                        <Image
                          src={session.name.toLowerCase().includes('hyde') ? '/hydebark.webp' : '/centralbark.webp'}
                          alt={session.name}
                          width={400}
                          height={225}
                          className={styles.sessionImage}
                        />
                      </div>
                      <div className={styles.sessionDetails}>
                        <div className={styles.sessionHeader}>
                          <h3 className={styles.sessionFieldName}>{session.name}</h3>
                          <button className={styles.cancelButton}>Cancel</button>
                        </div>
                        <div className={styles.sessionMeta}>
                          <div className={styles.metaRow}>
                            <span className={styles.metaIcon}>🕒</span>
                            <span className={styles.sessionTime}>{session.time}</span>
                          </div>
                          <div className={styles.metaRow}>
                            <span className={styles.metaIcon}>📍</span>
                            <span className={styles.sessionAddress}>{session.address}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {index < upcomingSessions.length - 1 && <div className={styles.cardDivider}></div>}
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🐕</div>
                  <h3 className={styles.emptyTitle}>No upcoming sessions</h3>
                  <p className={styles.emptyText}>Ready to book your next one?</p>
                  <Link href="/book" className={styles.primaryButton}>
                    Book a Session
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'past' && (
            <div className={styles.sessionList}>
              {pastSessions.length > 0 ? (
                pastSessions.map((session, index) => (
                  <div key={session.id}>
                    <div className={`${styles.sessionCard} ${styles.pastCard}`}>
                      <div className={styles.sessionImageContainer}>
                        <Image
                          src={session.name.toLowerCase().includes('hyde') ? '/hydebark.webp' : '/centralbark.webp'}
                          alt={session.name}
                          width={400}
                          height={225}
                          className={styles.sessionImage}
                        />
                      </div>
                      <div className={styles.sessionDetails}>
                        <div className={styles.sessionHeader}>
                          <h3 className={styles.sessionFieldName}>{session.name}</h3>
                          <button className={styles.rebookButton}>Rebook</button>
                        </div>
                        <div className={styles.sessionMeta}>
                          <div className={styles.metaRow}>
                            <span className={styles.metaIcon}>🕒</span>
                            <span className={styles.sessionTime}>{session.time}</span>
                          </div>
                          <div className={styles.metaRow}>
                            <span className={styles.metaIcon}>📍</span>
                            <span className={styles.sessionAddress}>{session.address}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {index < pastSessions.length - 1 && <div className={styles.cardDivider}></div>}
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🐾</div>
                  <h3 className={styles.emptyTitle}>No past sessions yet</h3>
                  <p className={styles.emptyText}>Your booking history will appear here.</p>
                  <Link href="/book" className={styles.secondaryButton}>
                    Explore Fields
                  </Link>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <footer className={styles.mobileFooter} aria-label="Primary actions">
        <Link href="/dashboard" className={styles.footerAction}>
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

        <Link href="/my-sessions" className={styles.footerAction} aria-current="page">
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
