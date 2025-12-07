"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import AppHeader from "../../components/AppHeader";
import BottomNav from "../../components/BottomNav";
import styles from "./page.module.css";

// Icons
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export default function Book() {
  const router = useRouter();

  type Session = {
    id: string;
    calendarID: number;
    startTime: string;
  };

  // Interface for API response
  type ApiAvailabilitySlot = {
    calendarID: number | string;
    startTime: string;
  };

  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedType, setSelectedType] = useState<string>('18525224'); // 30 min default
  const [selectedField, setSelectedField] = useState<number>(4783035); // Central Bark default
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch availability
  useEffect(() => {
    let isMounted = true;
    const fetchAvailability = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/availability?appointmentTypeID=${encodeURIComponent(selectedType)}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load availability");

        const data = (await res.json()) as ApiAvailabilitySlot[];

        const normalized = data
          .map((item) => ({
            id: crypto.randomUUID(),
            calendarID: Number(item.calendarID),
            startTime: item.startTime,
          }))
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        if (isMounted) setSessions(normalized);
      } catch {
        if (isMounted) setSessions([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAvailability();
    return () => { isMounted = false; };
  }, [selectedType]);

  // Group sessions by day
  const groupedSessions = sessions.reduce((acc, session) => {
    // Filter by selected field
    if (session.calendarID !== selectedField) return acc;

    const dateKey = session.startTime.split('T')[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(session);
    return acc;
  }, {} as Record<string, Session[]>);

  const sortedDates = Object.keys(groupedSessions).sort();

  const handleBook = (session: Session) => {
    const price = selectedType === '18525224' ? '£5.50' : selectedType === '29373489' ? '£8.25' : '£11.00';
    const duration = selectedType === '18525224' ? '30 min' : selectedType === '29373489' ? '45 min' : '1 hour';
    const fieldName = session.calendarID === 4783035 ? 'Central Bark' : 'Hyde Bark';
    
    const params = new URLSearchParams({
      id: session.id,
      date: new Date(session.startTime).toLocaleDateString('en-GB'),
      time: new Date(session.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      length: duration,
      field: fieldName,
      price: price,
      startTime: session.startTime,
      appointmentTypeID: selectedType,
      calendarID: String(session.calendarID)
    });

    router.push(`/book/${session.id}?${params.toString()}`);
  };

  return (
    <div className={styles.container}>
      <AppHeader />

      <main className={styles.main}>
        <div className={styles.header}>
          <span className={styles.superTitle}>BOOKING</span>
          <h1 className={styles.title}>Reserve Your Field</h1>
          <p className={styles.subtitle}>Choose your perfect time for off-lead freedom.</p>
        </div>

        {/* Offers Banner */}
        <div className={styles.offersBanner}>
          <div className={styles.offersText}>
            <div className={styles.offersTitle}>Frequent Visitor?</div>
            <div className={styles.offersSub}>Save up to 20% with our session packages.</div>
          </div>
          <a 
            href="https://caninecapers.as.me/catalog/3e8feaf8/cart" 
            target="_blank"
            className={styles.offersLink}
          >
            View Packages
          </a>
                </div>

        <div className={styles.selectionGrid}>
          {/* Step 1: Duration */}
          <section>
            <h2 className={styles.sectionTitle}>1. Select Duration</h2>
            <div className={styles.durationGrid}>
              {[
                { id: '18525224', label: '30 min', price: '£5.50' },
                { id: '29373489', label: '45 min', price: '£8.25' },
                { id: '18525161', label: '1 Hour', price: '£11.00' }
              ].map(opt => (
                        <button
                  key={opt.id}
                  className={`${styles.durationCard} ${selectedType === opt.id ? styles.active : ''}`}
                  onClick={() => setSelectedType(opt.id)}
                >
                  <span className={styles.durationLabel}>{opt.label}</span>
                  <span className={styles.durationPrice}>{opt.price}</span>
                        </button>
              ))}
            </div>
          </section>

          {/* Step 2: Field */}
          <section>
            <h2 className={styles.sectionTitle}>2. Choose Field</h2>
            <div className={styles.fieldGrid}>
              <div 
                className={`${styles.fieldCard} ${selectedField === 4783035 ? styles.active : ''}`}
                onClick={() => setSelectedField(4783035)}
              >
                <Image src="/centralbark.webp" alt="Central Bark" fill className={styles.fieldImage} />
                <div className={styles.fieldOverlay}>
                  <span className={styles.fieldName}>Central Bark</span>
                </div>
                {selectedField === 4783035 && (
                  <div className={styles.checkmark}><CheckIcon /></div>
                )}
              </div>

              <div 
                className={`${styles.fieldCard} ${selectedField === 6255352 ? styles.active : ''}`}
                onClick={() => setSelectedField(6255352)}
              >
                <Image src="/hydebark.webp" alt="Hyde Bark" fill className={styles.fieldImage} />
                <div className={styles.fieldOverlay}>
                  <span className={styles.fieldName}>Hyde Bark</span>
                </div>
                {selectedField === 6255352 && (
                  <div className={styles.checkmark}><CheckIcon /></div>
                )}
              </div>
            </div>
          </section>

          {/* Step 3: Time Slots */}
          <section>
            <h2 className={styles.sectionTitle}>3. Pick a Time</h2>
            <div className={styles.slotsContainer}>
              {loading ? (
                <div className={styles.loading}>Finding available slots...</div>
              ) : sortedDates.length > 0 ? (
                sortedDates.map(date => (
                  <div key={date} className={styles.dayGroup}>
                    <div className={styles.dayHeader}>
                      {new Date(date).toLocaleDateString('en-GB', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long' 
                      })}
                    </div>
                    <div className={styles.slotsGrid}>
                      {groupedSessions[date].map(session => (
                        <button
                          key={session.id}
                          className={styles.slotButton}
                          onClick={() => handleBook(session)}
                        >
                          {new Date(session.startTime).toLocaleTimeString('en-GB', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyMessage}>
                  No sessions available for this configuration. Try changing the duration or field.
                </div>
            )}
            </div>
          </section>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
