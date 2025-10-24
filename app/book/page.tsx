"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";

export default function Book() {
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
            <div className={styles.calendarCard}>
              <h3 className={styles.calendarTitle}>Browse Calendar</h3>
              <p className={styles.calendarDescription}>
                View all available sessions in a calendar format to find the perfect time for your dog.
              </p>
              <button className={styles.calendarButton}>Open Calendar</button>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Upcoming Availability
              <span className={styles.titleUnderline}></span>
            </h2>

            <div className={styles.sessionsGrid}>
              {/* Placeholder sessions */}
              <div className={styles.sessionCard}>
                <div className={styles.sessionImage}>
                  <Image
                    src="/centralbark.webp"
                    alt="Central Bark"
                    width={80}
                    height={80}
                    className={styles.sessionImageContent}
                  />
                </div>
                <div className={styles.sessionDetails}>
                  <span className={styles.sessionFieldName}>Central Bark</span>
                  <span className={styles.sessionTime}>Today · 2:00 PM - 3:00 PM</span>
                  <span className={styles.sessionDuration}>1 hour session</span>
                  <span className={styles.sessionPrice}>£5.50</span>
                </div>
                <button className={styles.bookButton}>
                  Book <span className={styles.arrow}>›</span>
                </button>
              </div>

              <div className={styles.sessionCard}>
                <div className={styles.sessionImage}>
                  <Image
                    src="/hydebark.webp"
                    alt="Hyde Bark"
                    width={80}
                    height={80}
                    className={styles.sessionImageContent}
                  />
                </div>
                <div className={styles.sessionDetails}>
                  <span className={styles.sessionFieldName}>Hyde Bark</span>
                  <span className={styles.sessionTime}>Tomorrow · 10:00 AM - 11:00 AM</span>
                  <span className={styles.sessionDuration}>1 hour session</span>
                  <span className={styles.sessionPrice}>£5.50</span>
                </div>
                <button className={styles.bookButton}>
                  Book <span className={styles.arrow}>›</span>
                </button>
              </div>

            </div>
          </section>
        </main>
      </div>

      <footer className={styles.mobileFooter} aria-label="Primary actions">
        <Link href="/book" className={styles.footerAction} aria-current="page">
          <Image
            src="/booksession.png"
            alt="Book Session"
            width={26}
            height={26}
            className={styles.footerIcon}
          />
          <span className={styles.footerLabel}>Book</span>
        </Link>

        <Link href="/my-sessions" className={styles.footerAction}>
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
          <span className={styles.footerLabel}>Locations</span>
        </Link>
      </footer>
    </>
  );
}
