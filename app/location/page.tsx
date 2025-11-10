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
              Both fields are located at Bewdley Rd North. Each field will have a sign with the name of the field on it. Use the map above for help. Follow the directions below depending on your booking.
            </p>

            {/* Central Bark Directions */}
            <div className={styles.directionCard}>
              <button
                className={styles.directionToggle}
                onClick={() => setCentralBarkExpanded(!centralBarkExpanded)}
                aria-expanded={centralBarkExpanded}
              >
                <Image
                  src="/locationicon/centralbark.png"
                  alt="Central Bark"
                  width={24}
                  height={24}
                  className={styles.directionIcon}
                />
                <span className={styles.directionFieldName}>Central Bark</span>
                <span className={styles.directionArrow}>
                  {centralBarkExpanded ? '↑' : '↓'}
                </span>
              </button>
              {centralBarkExpanded && (
                <div className={styles.directionContent}>
                  <div className={styles.directionItem}>
                    <span className={styles.bullet}>•</span>
                    <span>Entrance: Central Bark is the first field you&apos;ll see as you come down the road with both fields on. It&apos;s on the right, and you&apos;ll see a sign with the field name.</span>
                  </div>
                  <div className={styles.directionItem}>
                    <span className={styles.bullet}>•</span>
                    <span>Parking: The parking for Central Bark is on the left.</span>
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
                <Image
                  src="/locationicon/hydebarki.png"
                  alt="Hyde Bark"
                  width={24}
                  height={24}
                  className={styles.directionIcon}
                />
                <span className={styles.directionFieldName}>Hyde Bark</span>
                <span className={styles.directionArrow}>
                  {hydeBarkExpanded ? '↑' : '↓'}
                </span>
              </button>
              {hydeBarkExpanded && (
                <div className={styles.directionContent}>
                  <div className={styles.directionItem}>
                    <span className={styles.bullet}>•</span>
                    <span>Entrance: Follow the same signed &ldquo;Canine Capers&rdquo; road until the end. Please wait at the large gate until the field is empty.</span>
                  </div>
                  <div className={styles.directionItem}>
                    <span className={styles.bullet}>•</span>
                    <span>Parking: When the field is empty, drive up and you will see a gated car park. You&apos;ll see a sign with the field name.</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className={styles.infoSection}>
            {/* Address */}
            <div className={styles.contactItem}>
              <Image
                src="/location.png"
                alt="Location"
                width={20}
                height={24}
                className={styles.contactIcon}
              />
              <div className={styles.contactContent}>
                <h3 className={styles.infoTitle}>Address</h3>
                <p className={styles.addressText}>
                  Brickyard Cottage,<br />
                  Stourport-on-Severn, Bewdley<br />
                  DY13 8DZ, United Kingdom
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className={styles.contactItem}>
              <Image
                src="/locationicon/phone.png"
                alt="Phone"
                width={24}
                height={24}
                className={styles.contactIcon}
              />
              <div className={styles.contactContent}>
                <h3 className={styles.infoTitle}>Phone</h3>
                <a href="tel:+447533185734" className={styles.phoneLink}>+44 7533 185 734</a>
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
            src="/images/homeicon.png"
            alt="Dashboard"
            width={16}
            height={16}
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
            src="/images/settingsicon.png"
            alt="Settings"
            width={16}
            height={16}
            className={styles.footerIcon}
          />
          <span className={styles.footerLabel}>Settings</span>
        </Link>
      </footer>
    </>
  );
}
