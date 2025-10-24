"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<'availability' | 'sessions'>('availability');

  const upcomingAvailability = [
    {
      id: "central-bark",
      name: "Central Bark",
      address: "24 Meadow Lane, London NW1",
      nextSlot: "Today · 4:00 PM - 5:00 PM",
      rating: "4.9 · 128 reviews",
      price: "£5.50/hour",
    },
    {
      id: "hyde-bark",
      name: "Hyde Bark",
      address: "89 Hillcrest Road, Bristol BS8",
      nextSlot: "Tomorrow · 9:00 AM - 10:00 AM",
      rating: "4.7 · 98 reviews",
      price: "£5.50/hour",
    },
  ];

  return (
    <>
      <header className={styles.navbar}>
        <div className={styles.navbarContent}>
          <div className={styles.greeting}>
            <h1 className={styles.greetingName}>Hello, Sarah</h1>
            <p className={styles.greetingSubtitle}>Welcome to Canine Capers</p>
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
          <article className={styles.introCard}>
            <div className={styles.introContent}>
              <h2 className={styles.introTitle}>Your Canine Capers Hub</h2>
              <p className={styles.introSubtitle}>Easily book, manage, and enjoy your private Canine Capers sessions</p>
            </div>

            <div className={styles.introImageWrapper}>
              <Image
                src="/dogdashboardsection.png"
                alt="Excited dog enjoying playtime"
                width={360}
                height={260}
                className={styles.introImage}
                priority
              />
            </div>
          </article>

          <div className={styles.sectionToggle}>
            <button
              className={`${styles.toggleButton} ${activeSection === 'availability' ? styles.active : ''}`}
              onClick={() => setActiveSection('availability')}
            >
              Upcoming Availability
            </button>
            <button
              className={`${styles.toggleButton} ${activeSection === 'sessions' ? styles.active : ''}`}
              onClick={() => setActiveSection('sessions')}
            >
              Your Future Sessions
            </button>
          </div>

          {activeSection === 'availability' && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                Available Slots
                <span className={styles.titleUnderline}></span>
              </h2>
              <div className={styles.availabilityGrid}>
                {upcomingAvailability.map((field) => (
                  <div key={field.id} className={styles.availabilityCard}>
                    <div className={styles.availabilityImage}>
                      <Image
                        src={field.id === 'central-bark' ? '/centralbark.webp' : '/hydebark.webp'}
                        alt={field.name}
                        width={110}
                        height={110}
                        className={styles.availabilityImageContent}
                      />
                    </div>
                    <div className={styles.availabilityContent}>
                      <div className={styles.availabilityHeader}>
                        <span className={styles.availabilityName}>{field.name}</span>
                        <span className={styles.availabilityPrice}>{field.price}</span>
                      </div>
                      <span className={styles.availabilityTimeslot}>{field.nextSlot}</span>
                    </div>
                    <button className={styles.bookButton}>
                      Book <span className={styles.arrow}>›</span>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeSection === 'sessions' && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                Your Slots
                <span className={styles.titleUnderline}></span>
              </h2>
              <div className={styles.sessionsGrid}>
                <div className={styles.sessionCard}>
                  <div className={styles.sessionImage}>
                    <Image
                      src="/centralbark.webp"
                      alt="Central Bark"
                      width={110}
                      height={110}
                      className={styles.sessionImageContent}
                    />
                  </div>
                  <div className={styles.sessionContent}>
                    <span className={styles.sessionFieldName}>Central Bark</span>
                    <span className={styles.sessionTime}>Wed 23 Oct · 3:00 PM - 3:30 PM</span>
                    <span className={styles.sessionAddress}>24 Meadow Lane, London NW1</span>
                  </div>
                </div>

                <div className={styles.sessionCard}>
                  <div className={styles.sessionImage}>
                    <Image
                      src="/hydebark.webp"
                      alt="Hyde Bark"
                      width={110}
                      height={110}
                      className={styles.sessionImageContent}
                    />
                  </div>
                  <div className={styles.sessionContent}>
                    <span className={styles.sessionFieldName}>Hyde Bark</span>
                    <span className={styles.sessionTime}>Fri 25 Oct · 10:00 AM - 11:00 AM</span>
                    <span className={styles.sessionAddress}>89 Hillcrest Road, Bristol BS8</span>
                  </div>
                </div>
              </div>
            </section>
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

        <Link href="/my-sessions" className={styles.footerAction}>
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

