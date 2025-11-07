"use client";

import Image from "next/image";
import styles from "./HeroSection.module.css";

interface HeroSectionProps {
  onBookSession: () => void;
  onViewBookings: () => void;
}

export default function HeroSection({ onBookSession, onViewBookings }: HeroSectionProps) {
  return (
    <section className={styles.heroSection}>
      <div className={styles.heroCard}>
        <div className={styles.heroIcon}>
          <Image
            src="/dogdashboardsection.png"
            alt="Dog outline"
            width={120}
            height={90}
            className={styles.dogIcon}
            priority
          />
        </div>
        
        <h1 className={styles.heroHeadline}>
          Your Canine Capers Hub
        </h1>
        
        <p className={styles.heroSubtext}>
          Book, manage, and enjoy your sessions with ease.
        </p>
        
        <div className={styles.heroActions}>
          <button 
            className={styles.primaryButton}
            onClick={onBookSession}
          >
            Book a Session
          </button>
          <button 
            className={styles.secondaryButton}
            onClick={onViewBookings}
          >
            View My Bookings
          </button>
        </div>
      </div>
    </section>
  );
}

