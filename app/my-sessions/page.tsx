"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "../../src/lib/supabaseClient";
import { formatLondon } from "../../src/utils/dateTime";
import styles from "./page.module.css";

// Icons
const LocationIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
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

// Helper function
async function cancelSession(appointmentId: string): Promise<boolean> {
  try {
    const res = await fetch("/api/cancel-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to cancel session");
    }

    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.error("Cancel session error:", err);
    return false;
  }
}

export default function MySessions() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [upcomingSessions, setUpcomingSessions] = useState<Array<any>>([]);
  const [pastSessions, setPastSessions] = useState<Array<any>>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSessions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (isMounted) setLoading(false);
          return;
        }

        const { data: sessions, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: true });

        if (error) throw error;

        if (isMounted && sessions) {
          const now = new Date();
          const upcoming: any[] = [];
          const past: any[] = [];

          sessions.forEach(session => {
            const sessionDate = new Date(session.date);
            const endTime = new Date(sessionDate.getTime() + 60 * 60 * 1000); // Assume 1hr

            const formatted = {
              id: session.id,
              name: session.field || 'Unknown Field',
              startTime: formatLondon(session.date).split('·')[1]?.trim() || '',
              dateDisplay: new Date(session.date).toLocaleDateString('en-GB', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              }),
              shortDate: new Date(session.date).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              }),
              address: session.field?.includes('Central') ? 'Stourport-on-Severn' : 'Bewdley',
              image: session.field?.includes('Central') ? '/centralbark.webp' : '/hydebark.webp',
              acuity_id: session.acuity_appointment_id,
              status: session.status || 'confirmed'
            };

            if (endTime >= now && session.status !== 'cancelled') {
              upcoming.push(formatted);
            } else {
              past.push(formatted);
            }
          });

          setUpcomingSessions(upcoming);
          setPastSessions(past.reverse());
        }
      } catch (err) {
        console.error('Error loading sessions:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSessions();
    return () => { isMounted = false; };
  }, []);

  const handleCancel = async (appointmentId: number) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    
    setUpdatingId(String(appointmentId));
    const success = await cancelSession(String(appointmentId));
    
    if (success) {
      setUpcomingSessions(prev => prev.filter(s => s.acuity_id !== appointmentId));
      alert('Booking cancelled successfully.');
    } else {
      alert('Could not cancel booking. Please try again.');
    }
    setUpdatingId(null);
  };

  if (loading) {
    return (
      <div className={styles.container}>
         <div className={styles.navbar}>
           {/* Skeleton Navbar */}
           <div style={{width: 200, height: 32, background: 'rgba(0,0,0,0.05)', borderRadius: 8}}></div>
         </div>
         <div className={styles.main}>
            <span className={styles.pageTitle}>Loading...</span>
         </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <Link href="/" className={styles.brand}>
          <Image src="/caninecaperslogosymbol.png" alt="" width={32} height={32} />
          <span className={styles.brandText}>Canine Capers</span>
        </Link>
        <div className={styles.navActions}>
          <Link href="/location" className={styles.iconButton} aria-label="Locations">
            <LocationIcon />
          </Link>
          <Link href="/settings" className={styles.iconButton} aria-label="Settings">
            <SettingsIcon />
          </Link>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <span className={styles.superTitle}>Your Account</span>
          <h1 className={styles.pageTitle}>My Sessions</h1>
        </div>
        
        {/* Upcoming Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Upcoming Bookings</h2>
            <span className={styles.countBadge}>{upcomingSessions.length}</span>
          </div>

          {upcomingSessions.length > 0 ? (
            <div className={styles.upcomingGrid}>
              {upcomingSessions.map(session => (
                <div key={session.id} className={styles.sessionCard}>
                  <div className={styles.cardImageWrapper}>
                    <Image 
                      src={session.image} 
                      alt={session.name} 
                      fill 
                      className={styles.cardImage} 
                    />
                    <div className={styles.cardStatus}>Confirmed</div>
                  </div>
                  <div className={styles.cardContent}>
                    <h3 className={styles.cardField}>{session.name}</h3>
                    <div className={styles.cardDate}>{session.dateDisplay}</div>
                    <div className={styles.cardTime}>
                      <ClockIcon /> {session.startTime}
                    </div>
                    <div className={styles.cardLocation}>
                      <MapPinIcon /> {session.address}
                    </div>
                    
                    <div className={styles.cardActions}>
                      <a 
                        href={`https://caninecapers.as.me/schedule.php?action=appt&id=${session.acuity_id}`}
                        target="_blank"
                        className={`${styles.actionButton} ${styles.manageBtn}`}
                      >
                        Manage
                      </a>
                      <button 
                        onClick={() => handleCancel(session.acuity_id)}
                        className={`${styles.actionButton} ${styles.cancelBtn}`}
                        disabled={updatingId === String(session.acuity_id)}
                      >
                        {updatingId === String(session.acuity_id) ? 'Processing...' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyStateBox}>
              <h3 className={styles.emptyTitle}>No Upcoming Bookings</h3>
              <p className={styles.emptyText}>You don't have any scheduled visits at the moment.</p>
              <Link href="/book" className={styles.bookBtn}>Book a Session</Link>
            </div>
          )}
        </section>

        {/* Past History Section */}
        {pastSessions.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Session History</h2>
            </div>
            
            <div className={styles.historyTableContainer}>
              <div className={styles.historyHeader}>
                <span className={styles.colHeader}>Date</span>
                <span className={styles.colHeader}>Field</span>
                <span className={`${styles.colHeader} ${styles.colTime}`}>Time</span>
                <span className={styles.colHeader} style={{textAlign: 'right'}}>Action</span>
              </div>
              
              <div>
                {pastSessions.map(session => (
                  <div key={session.id} className={styles.historyRow}>
                    <div className={styles.cellDate}>{session.shortDate}</div>
                    <div className={styles.cellField}>{session.name}</div>
                    <div className={`${styles.cellTime} ${styles.colTime}`}>{session.startTime}</div>
                    <div className={styles.cellAction}>
                      <Link href="/book" className={styles.rebookLink}>Rebook</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
