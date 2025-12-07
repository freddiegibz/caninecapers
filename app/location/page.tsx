"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AppHeader from "../../components/AppHeader";
import BottomNav from "../../components/BottomNav";
import styles from "./page.module.css";

// Icons
const PhoneIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);

const MapPinIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

export default function Location() {
  const [centralBarkExpanded, setCentralBarkExpanded] = useState(true);
  const [hydeBarkExpanded, setHydeBarkExpanded] = useState(false);

  return (
    <div className={styles.container}>
      <AppHeader />

      <main className={styles.main}>
        <header className={styles.header}>
          <span className={styles.superTitle}>VISIT US</span>
          <h1 className={styles.title}>Our Locations</h1>
          <p className={styles.subtitle}>Find your way to our private fields in the heart of the countryside.</p>
        </header>

        {/* Map Card */}
        <div className={styles.mapSection}>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2436.759639341879!2d-2.3076475236467444!3d52.35664454831156!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48708b6a4fbcdd7f%3A0x898bb61085801618!2sCanine%20Capers%20Dog%20Field!5e0!3m2!1sen!2suk!4v1760959804151!5m2!1sen!2suk"
            className={styles.mapFrame}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Field Locations"
          ></iframe>
        </div>

        {/* Field Directions */}
        <div className={styles.fieldsGrid}>
          {/* Central Bark */}
          <div className={styles.fieldCard}>
            <div className={styles.fieldHeader}>
              <Image src="/centralbark.webp" alt="Central Bark" fill className={styles.fieldImage} />
              <div className={styles.fieldOverlay}>
                <span className={styles.fieldName}>Central Bark</span>
              </div>
            </div>
            <div className={styles.fieldContent}>
              <button 
                className={styles.toggleButton}
                onClick={() => setCentralBarkExpanded(!centralBarkExpanded)}
              >
                <span>Arrival Directions</span>
                <span className={`${styles.toggleIcon} ${centralBarkExpanded ? styles.expanded : ''}`}>
                  <ChevronDownIcon />
                </span>
              </button>
              {centralBarkExpanded && (
                <div className={styles.directionsList}>
                  <div className={styles.directionItem}>
                    <span className={styles.stepNumber}>1</span>
                    <span className={styles.stepText}>
                      First field on the right as you enter the private road. Look for the Central Bark sign.
                    </span>
                  </div>
                  <div className={styles.directionItem}>
                    <span className={styles.stepNumber}>2</span>
                    <span className={styles.stepText}>
                      Parking is immediately on the left upon entering the gateway.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hyde Bark */}
          <div className={styles.fieldCard}>
            <div className={styles.fieldHeader}>
              <Image src="/hydebark.webp" alt="Hyde Bark" fill className={styles.fieldImage} />
              <div className={styles.fieldOverlay}>
                <span className={styles.fieldName}>Hyde Bark</span>
              </div>
            </div>
            <div className={styles.fieldContent}>
              <button 
                className={styles.toggleButton}
                onClick={() => setHydeBarkExpanded(!hydeBarkExpanded)}
              >
                <span>Arrival Directions</span>
                <span className={`${styles.toggleIcon} ${hydeBarkExpanded ? styles.expanded : ''}`}>
                  <ChevronDownIcon />
                </span>
              </button>
              {hydeBarkExpanded && (
                <div className={styles.directionsList}>
                  <div className={styles.directionItem}>
                    <span className={styles.stepNumber}>1</span>
                    <span className={styles.stepText}>
                      Follow the lane to the very end. Please wait at the large gate until the previous visitor leaves.
                    </span>
                  </div>
                  <div className={styles.directionItem}>
                    <span className={styles.stepNumber}>2</span>
                    <span className={styles.stepText}>
                      Drive up to the gated car park once the field is empty.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className={styles.contactCard}>
          <h2 className={styles.contactTitle}>Get in Touch</h2>
          <div className={styles.contactGrid}>
            <div className={styles.contactItem}>
              <div className={styles.contactIcon}>
                <MapPinIcon />
              </div>
              <span className={styles.contactLabel}>Address</span>
              <div className={styles.contactValue}>
                Brickyard Cottage<br/>
                Stourport-on-Severn<br/>
                DY13 8DZ
              </div>
            </div>
            <div className={styles.contactItem}>
              <div className={styles.contactIcon}>
                <PhoneIcon />
              </div>
              <span className={styles.contactLabel}>Phone</span>
              <a href="tel:+447533185734" className={styles.contactValue}>
                +44 7533 185 734
              </a>
            </div>
          </div>
          <Link href="/book" className={styles.primaryButton}>
            Book a Session
          </Link>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
