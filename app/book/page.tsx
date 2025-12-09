"use client";

import { useEffect, useState, useRef } from "react";
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

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"></polyline>
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
  const [selectedDay, setSelectedDay] = useState<string>(''); // Empty = show all days
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingSpecificDate, setLoadingSpecificDate] = useState<boolean>(false);
  const [calendarOpen, setCalendarOpen] = useState<boolean>(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const calendarRef = useRef<HTMLDivElement>(null);

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

  // Fetch availability for a specific date
  const fetchAvailabilityForDate = async (dateKey: string) => {
    try {
      setLoadingSpecificDate(true);
      const res = await fetch(`/api/availability?appointmentTypeID=${encodeURIComponent(selectedType)}&startDate=${encodeURIComponent(dateKey)}&endDate=${encodeURIComponent(dateKey)}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load availability");

      const data = (await res.json()) as ApiAvailabilitySlot[];

      const newSessions = data
        .map((item) => ({
          id: crypto.randomUUID(),
          calendarID: Number(item.calendarID),
          startTime: item.startTime,
        }))
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      // Add new sessions to existing ones
      setSessions(prev => {
        const combined = [...prev, ...newSessions];
        // Remove duplicates based on startTime and calendarID
        const unique = combined.filter((session, index, self) =>
          index === self.findIndex(s => s.startTime === session.startTime && s.calendarID === session.calendarID)
        );
        return unique.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      });
    } catch (error) {
      console.error("Failed to fetch availability for date:", error);
    } finally {
      setLoadingSpecificDate(false);
    }
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarOpen && calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setCalendarOpen(false);
      }
    };

    if (calendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [calendarOpen]);

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
  
  // Filter dates based on selected day
  const filteredDates = selectedDay 
    ? (sortedDates.includes(selectedDay) ? [selectedDay] : [])
    : sortedDates;
  
  // Check if selected day has availability
  const selectedDayHasAvailability = selectedDay ? sortedDates.includes(selectedDay) : true;
  
  // Calendar generation
  const getCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: Array<{ date: Date; dateKey: string; isCurrentMonth: boolean; hasAvailability: boolean }> = [];
    
    // Previous month's trailing days
    const prevMonth = new Date(year, month - 1, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthDays - i);
      days.push({
        date,
        dateKey: date.toISOString().split('T')[0],
        isCurrentMonth: false,
        hasAvailability: sortedDates.includes(date.toISOString().split('T')[0])
      });
    }
    
    // Current month's days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = date.toISOString().split('T')[0];
      days.push({
        date,
        dateKey,
        isCurrentMonth: true,
        hasAvailability: sortedDates.includes(dateKey) && date >= today
      });
    }
    
    // Next month's leading days to fill the grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      const dateKey = date.toISOString().split('T')[0];
      days.push({
        date,
        dateKey,
        isCurrentMonth: false,
        hasAvailability: sortedDates.includes(dateKey)
      });
    }
    
    return days;
  };
  
  const handleDateSelect = (dateKey: string) => {
    if (selectedDay === dateKey) {
      setSelectedDay(''); // Deselect if clicking same date
    } else {
      setSelectedDay(dateKey);
      // Check if this date has availability loaded
      const dateHasAvailability = sortedDates.includes(dateKey);
      if (!dateHasAvailability && !loadingSpecificDate) {
        // Automatically fetch availability for this date
        fetchAvailabilityForDate(dateKey);
      }
    }
    setCalendarOpen(false);
  };
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCalendarMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };
  
  const formatSelectedDate = () => {
    if (!selectedDay) return 'All Available Days';
    const date = new Date(selectedDay);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-GB', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long'
    });
  };

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
            
            {/* Calendar Picker */}
            <div className={`${styles.calendarWrapper} ${calendarOpen ? styles.calendarOpen : ''}`} ref={calendarRef}>
              <button
                type="button"
                className={styles.calendarButton}
                onClick={() => setCalendarOpen(!calendarOpen)}
              >
                <CalendarIcon />
                <span className={styles.calendarButtonValue}>{formatSelectedDate()}</span>
                <ChevronRightIcon />
              </button>
              
              {calendarOpen && (
                <div className={styles.calendar}>
                  <div className={styles.calendarHeader}>
                    <button
                      type="button"
                      className={styles.calendarNavButton}
                      onClick={() => navigateMonth('prev')}
                      aria-label="Previous month"
                    >
                      <ChevronLeftIcon />
                    </button>
                    <div className={styles.calendarMonthYear}>
                      {calendarMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                    </div>
                    <button
                      type="button"
                      className={styles.calendarNavButton}
                      onClick={() => navigateMonth('next')}
                      aria-label="Next month"
                    >
                      <ChevronRightIcon />
                    </button>
                  </div>
                  
                  <div className={styles.calendarWeekdays}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className={styles.calendarWeekday}>{day}</div>
                    ))}
                </div>

                  <div className={styles.calendarDays}>
                    {getCalendarDays().map((day, index) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const isToday = day.date.toDateString() === today.toDateString();
                      const isPast = day.date < today && !isToday;
                      const isSelected = selectedDay === day.dateKey;
                      
                      return (
                        <button
                          key={`${day.dateKey}-${index}`}
                          type="button"
                          className={`${styles.calendarDay} ${
                            !day.isCurrentMonth ? styles.calendarDayOtherMonth : ''
                          } ${isPast ? styles.calendarDayPast : ''} ${
                            day.hasAvailability ? styles.calendarDayAvailable : ''
                          } ${isSelected ? styles.calendarDaySelected : ''} ${
                            isToday ? styles.calendarDayToday : ''
                          }`}
                          onClick={() => !isPast && handleDateSelect(day.dateKey)}
                          disabled={isPast}
                        >
                          {day.date.getDate()}
                          {day.hasAvailability && day.isCurrentMonth && !isPast && (
                            <span className={styles.calendarDayDot}></span>
                          )}
                        </button>
                      );
                    })}
              </div>

                  <div className={styles.calendarFooter}>
                    <button
                      type="button"
                      className={styles.calendarClearButton}
                      onClick={() => {
                        setSelectedDay('');
                        setCalendarOpen(false);
                      }}
                    >
                      Show All Days
                    </button>
                </div>
                </div>
              )}
            </div>

            <div className={styles.slotsContainer}>
              {loading ? (
                <div className={styles.loading}>Finding available slots...</div>
              ) : selectedDay && !selectedDayHasAvailability ? (
                loadingSpecificDate ? (
                  <div className={styles.loading}>Loading availability for {new Date(selectedDay).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}...</div>
                ) : (
                  <div className={styles.emptyMessage}>
                    <div className={styles.emptyTitle}>Availability Not Yet Loaded</div>
                    <p className={styles.emptyText}>
                      Availability for {new Date(selectedDay).toLocaleDateString('en-GB', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })} hasn&apos;t been loaded yet.
                    </p>
                    <button
                      className={styles.loadAvailabilityButton}
                      onClick={() => fetchAvailabilityForDate(selectedDay)}
                      disabled={loadingSpecificDate}
                    >
                      Load Availability
                    </button>
                  </div>
                )
              ) : filteredDates.length > 0 ? (
                filteredDates.map(date => (
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
                  <div className={styles.emptyTitle}>No Sessions Available</div>
                  <p className={styles.emptyText}>
                    No sessions available for this configuration. Try changing the duration or field.
                  </p>
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
