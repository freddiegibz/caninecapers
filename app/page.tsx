import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Canine Capers</h1>
          <p className={styles.subtitle}>
            Your premier dog walking and care service in London.
          </p>
        </div>

        <div className={styles.actions}>
          <Link href="/signin" className={styles.primaryButton}>
            Sign In
          </Link>
          <Link href="/signup" className={styles.secondaryButton}>
            Create Account
          </Link>
        </div>

        <div className={styles.features}>
          <div className={styles.feature}>
            <h3 className={styles.featureTitle}>Easy Booking</h3>
            <p className={styles.featureDescription}>
              Schedule walks and care services with just a few clicks.
            </p>
          </div>
          <div className={styles.feature}>
            <h3 className={styles.featureTitle}>Trusted Walkers</h3>
            <p className={styles.featureDescription}>
              Professional, vetted dog walkers in your area.
            </p>
          </div>
          <div className={styles.feature}>
            <h3 className={styles.featureTitle}>Real-time Updates</h3>
            <p className={styles.featureDescription}>
              Get photos and updates during your dog's walk.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
