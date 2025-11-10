"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./HeroSection.module.css";

export default function HeroSection() {
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
          <Link 
            href="/book"
            className={styles.primaryButton}
          >
            Book a Session
          </Link>
          <Link 
            href="/my-sessions"
            className={styles.secondaryButton}
          >
            View My Bookings
          </Link>
        </div>
      </div>
    </section>
  );
}

