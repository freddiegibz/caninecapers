"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";

export default function MySessions() {
  const [pastSessionsOpen, setPastSessionsOpen] = useState(false);

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
                src="/house.png"
                alt="Dashboard"
                width={24}
                height={24}
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
        <main className={styles.main}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Upcoming Sessions
              <span className={styles.titleUnderline}></span>
            </h2>
            <p className={styles.sectionDescription}>
              Your scheduled field sessions that are coming up.
            </p>

            <div className={styles.sessionsGrid}>
              {upcomingSessions.map((session) => (
                <div key={session.id} className={styles.sessionCard}>
                  <div className={styles.sessionImage}>
                    <Image
                      src={session.id.includes('central-bark') ? '/centralbark.webp' : '/hydebark.webp'}
                      alt={session.name}
                      width={110}
                      height={110}
                      className={styles.sessionImageContent}
                    />
                  </div>
                  <div className={styles.sessionContent}>
                    <span className={styles.sessionFieldName}>{session.name}</span>
                    <span className={styles.sessionTime}>{session.time}</span>
                    <span className={styles.sessionAddress}>{session.address}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={`${styles.section} ${styles.collapsibleSection}`}>
            <div
              className={styles.collapsibleHeader}
              onClick={() => setPastSessionsOpen(!pastSessionsOpen)}
            >
              <h3 className={styles.collapsibleTitle}>Past Sessions</h3>
              <span className={`${styles.collapsibleIcon} ${pastSessionsOpen ? styles.rotated : ''}`}>
                ▼
              </span>
            </div>
            <div className={`${styles.collapsibleContent} ${pastSessionsOpen ? styles.open : ''}`}>
              <div className={styles.sessionsGrid}>
                {pastSessions.map((session) => (
                  <div key={session.id} className={styles.sessionCard}>
                    <div className={styles.sessionImage}>
                      <Image
                        src={session.id.includes('central-bark') ? '/centralbark.webp' : '/hydebark.webp'}
                        alt={session.name}
                        width={110}
                        height={110}
                        className={styles.sessionImageContent}
                      />
                    </div>
                    <div className={styles.sessionContent}>
                      <span className={styles.sessionFieldName}>{session.name}</span>
                      <span className={styles.sessionTime}>{session.time}</span>
                      <span className={styles.sessionAddress}>{session.address}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
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

        <Link href="/my-sessions" className={`${styles.footerAction} ${styles.active}`} aria-current="page">
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
          <span className={styles.footerLabel}>Locations</span>
        </Link>
      </footer>
    </>
  );
}
