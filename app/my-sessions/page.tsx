"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";

export default function MySessions() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const upcomingSessions = [
    {
      id: "central-bark-upcoming",
      name: "Central Bark",
      time: "Wed 23 Oct · 3:00 PM - 3:30 PM",
      address: "24 Meadow Lane, London NW1",
    },
    {
      id: "hyde-bark-upcoming",
      name: "Hyde Bark",
      time: "Fri 25 Oct · 10:00 AM - 11:00 AM",
      address: "89 Hillcrest Road, Bristol BS8",
    },
  ];

  const pastSessions = [
    {
      id: "central-bark-past-1",
      name: "Central Bark",
      time: "Mon 14 Oct · 2:00 PM - 2:30 PM",
      address: "24 Meadow Lane, London NW1",
    },
    {
      id: "hyde-bark-past-1",
      name: "Hyde Bark",
      time: "Wed 9 Oct · 4:00 PM - 4:30 PM",
      address: "89 Hillcrest Road, Bristol BS8",
    },
  ];
  return (
    <>
      <header className={styles.navbar}>
        <div className={styles.navbarContent}>
          <div className={styles.greeting}>
            <Link href="/dashboard" className={styles.backButton}>
              <span className={styles.backArrow}>&lt;</span>
              <Image
                src="/caninecaperslogosymbol.png"
                alt="Dashboard"
                width={32}
                height={32}
                className={styles.backIcon}
              />
            </Link>
          </div>
          <div className={styles.navActions}>
            <Link href="/settings" className={styles.settingsIcon}>
              <Image
                src="/settings.png"
                alt="Settings"
                width={40}
                height={40}
                className={styles.settingsIconImage}
              />
            </Link>
            <button className={styles.hamburgerMenu} aria-label="Menu">
              <span className={styles.hamburgerLine}></span>
              <span className={styles.hamburgerLine}></span>
              <span className={styles.hamburgerLine}></span>
            </button>
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
          {activeTab === 'upcoming' && (
            <div className={styles.sessionList}>
              {upcomingSessions.length > 0 ? (
                upcomingSessions.map((session, index) => (
                  <div key={session.id}>
                    <div className={styles.sessionCard}>
                      <div className={styles.sessionImageContainer}>
                        <Image
                          src={session.id.includes('central-bark') ? '/centralbark.webp' : '/hydebark.webp'}
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
                          src={session.id.includes('central-bark') ? '/centralbark.webp' : '/hydebark.webp'}
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
        <Link href="/book" className={styles.footerAction}>
          <Image
            src="/booksession.png"
            alt="Book Session"
            width={26}
            height={26}
            className={styles.footerIcon}
          />
          <span className={styles.footerLabel}>Book Session</span>
        </Link>

        <Link href="/my-sessions" className={styles.footerAction} aria-current="page">
          <Image
            src="/viewsessions.png"
            alt="My Sessions"
            width={26}
            height={26}
            className={styles.footerIcon}
          />
          <span className={styles.footerLabel}>My Sessions</span>
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
      </footer>
    </>
  );
}
