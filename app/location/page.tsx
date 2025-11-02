"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";

export default function Location() {
  const [centralBarkExpanded, setCentralBarkExpanded] = useState(false);
  const [hydeBarkExpanded, setHydeBarkExpanded] = useState(false);

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
        <main className={styles.main}>
          <div className={styles.headerRow}>
            <Image
              src="/location.png"
              alt=""
              width={24}
              height={24}
              className={styles.locationIcon}
            />
            <div className={styles.titleContainer}>
              <h1 className={styles.pageTitle}>Find Your Field</h1>
              <div className={styles.titleAccent}></div>
            </div>
          </div>

          <div className={styles.mapCard}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2436.759639341879!2d-2.3076475236467444!3d52.35664454831156!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48708b6a4fbcdd7f%3A0x898bb61085801618!2sCanine%20Capers%20Dog%20Field!5e0!3m2!1sen!2suk!4v1760959804151!5m2!1sen!2suk"
              width="100%"
              height="300"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Business Location Map"
            ></iframe>
          </div>

          {/* Directions Section */}
          <section className={styles.directionsSection}>
            <h2 className={styles.directionsTitle}>Directions for Each Field</h2>
            <p className={styles.directionsSubtitle}>
              Both fields are on Green Meadow Lane — around 100m apart. Follow the directions below depending on your booking.
            </p>

            {/* Central Bark Directions */}
            <div className={styles.directionCard}>
              <button
                className={styles.directionToggle}
                onClick={() => setCentralBarkExpanded(!centralBarkExpanded)}
                aria-expanded={centralBarkExpanded}
              >
                <span className={styles.directionIcon}>🏕️</span>
                <span className={styles.directionFieldName}>Central Bark</span>
                <span className={styles.directionArrow}>
                  {centralBarkExpanded ? '↑' : '↓'}
                </span>
              </button>
              {centralBarkExpanded && (
                <div className={styles.directionContent}>
                  <div className={styles.directionItem}>
                    <span className={styles.bullet}>•</span>
                    <span>Entrance: Follow the main path from the car park towards the large oak tree. The Central Bark entrance is on your left.</span>
                  </div>
                  <div className={styles.directionItem}>
                    <span className={styles.bullet}>•</span>
                    <span>Parking: Free parking available in the main car park. Look for the "Canine Capers" signs.</span>
                  </div>
                  <div className={styles.directionItem}>
                    <span className={styles.bullet}>•</span>
                    <span>Note: Central Bark has the larger field with more shade options. Perfect for hot summer days!</span>
                  </div>
                </div>
              )}
            </div>

            {/* Hyde Bark Directions */}
            <div className={styles.directionCard}>
              <button
                className={styles.directionToggle}
                onClick={() => setHydeBarkExpanded(!hydeBarkExpanded)}
                aria-expanded={hydeBarkExpanded}
              >
                <span className={styles.directionIcon}>🌳</span>
                <span className={styles.directionFieldName}>Hyde Bark</span>
                <span className={styles.directionArrow}>
                  {hydeBarkExpanded ? '↑' : '↓'}
                </span>
              </button>
              {hydeBarkExpanded && (
                <div className={styles.directionContent}>
                  <div className={styles.directionItem}>
                    <span className={styles.bullet}>•</span>
                    <span>Entrance: Continue past Central Bark for about 50m. Hyde Bark entrance is marked with a wooden signpost.</span>
                  </div>
                  <div className={styles.directionItem}>
                    <span className={styles.bullet}>•</span>
                    <span>Parking: Same main car park as Central Bark, or overflow parking available near the entrance.</span>
                  </div>
                  <div className={styles.directionItem}>
                    <span className={styles.bullet}>•</span>
                    <span>Note: Hyde Bark offers more wooded areas and agility obstacles. Great for adventurous dogs!</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className={styles.infoSection}>
            {/* Address */}
            <div className={styles.contactItem}>
              <span className={styles.contactIcon}>📍</span>
              <div className={styles.contactContent}>
                <h3 className={styles.infoTitle}>Address</h3>
                <p className={styles.addressText}>
                  123 Green Meadow Lane,<br />
                  Stourport, DY13 8XX
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className={styles.contactItem}>
              <span className={styles.contactIcon}>📞</span>
              <div className={styles.contactContent}>
                <h3 className={styles.infoTitle}>Phone</h3>
                <a href="tel:+441234567890" className={styles.phoneLink}>+44 1234 567 890</a>
              </div>
            </div>

            {/* Book Session Button */}
            <Link href="/book" className={styles.primaryButton}>Book a Session</Link>
          </section>
        </main>
      </div>

      <footer className={styles.mobileFooter} aria-label="Primary actions">
        <Link href="/dashboard" className={styles.footerAction}>
          <Image
            src="/house.png"
            alt="Dashboard"
            width={26}
            height={26}
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
          <span className={styles.footerLabel}>Location</span>
        </Link>

        <Link href="/settings" className={styles.footerAction}>
          <Image
            src="/settings.png"
            alt="Settings"
            width={26}
            height={26}
            className={styles.footerIcon}
          />
          <span className={styles.footerLabel}>Settings</span>
        </Link>
      </footer>
    </>
  );
}
