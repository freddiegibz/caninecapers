"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "../../src/lib/supabaseClient";
import { formatLondon } from "../../src/utils/dateTime";
import AppHeader from "../../components/AppHeader";
import BottomNav from "../../components/BottomNav";
import styles from "./page.module.css";

// Icons
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

interface FormattedSession {
  id: string;
  name: string;
  startTime: string;
  dateDisplay: string;
  shortDate: string;
  address: string;
  image: string;
  acuity_id: number | null;
  status: string;
}

interface DatabaseSession {
  id: string;
  user_id: string;
  field: string | null;
  date: string;
  duration: number | null;
  status: string | null;
  acuity_appointment_id: number | null;
  created_at: string;
}

export default function MySessions() {
  const [loading, setLoading] = useState<boolean>(true);
  const [upcomingSessions, setUpcomingSessions] = useState<FormattedSession[]>([]);
  const [pastSessions, setPastSessions] = useState<FormattedSession[]>([]);
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

        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: true });

        if (error) throw error;
        
        // Cast data to known type
        const sessions = data as DatabaseSession[];

        if (isMounted && sessions) {
          const now = new Date();
          const upcoming: FormattedSession[] = [];
          const past: FormattedSession[] = [];

          sessions.forEach(session => {
            const sessionDate = new Date(session.date);
            const endTime = new Date(sessionDate.getTime() + 60 * 60 * 1000); // Assume 1hr

            const formatted: FormattedSession = {
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
      <AppHeader />

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
                        onClick={() => session.acuity_id && handleCancel(session.acuity_id)}
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
              <p className={styles.emptyText}>You don&apos;t have any scheduled visits at the moment.</p>
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

      <BottomNav />
    </div>
  );
}
