"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";

export default function Location() {

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
          <div className={styles.headerRow}>
            <Image
              src="/location.png"
              alt=""
              width={24}
              height={24}
              className={styles.locationIcon}
            />
            <h1 className={styles.pageTitle}>Find Your Field</h1>
          </div>

          <div className={styles.mapCard}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2436.759639341879!2d-2.3076475236467444!3d52.35664454831156!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48708b6a4fbcdd7f%3A0x898bb61085801618!2sCanine%20Capers%20Dog%20Field!5e0!3m2!1sen!2suk!4v1760959804151!5m2!1sen!2suk"
              width="100%"
              height="300"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Business Location Map"
            ></iframe>
          </div>

          <section className={styles.infoSection}>
            <h2 className={styles.infoTitle}>Address</h2>
            <p className={styles.addressText}>
              123 Green Meadow Lane,<br />
              Stourport, DY13 8XX
            </p>

            <h2 className={styles.infoTitle}>Phone</h2>
            <a href="tel:+441234567890" className={styles.phoneLink}>+44 1234 567 890</a>

            <Link href="/book" className={styles.primaryButton}>Book a Session</Link>
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

        <Link href="/location" className={styles.footerAction} aria-current="page">
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
