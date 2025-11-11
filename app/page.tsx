import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <>
      <header className={styles.navbar}>
        <div className={styles.navbarContent}>
          <div className={styles.symbolLogo}>
            <Image
              src="/caninecaperslogosymbol.png"
              alt="Canine Capers"
              width={48}
              height={48}
              className={styles.symbolImage}
            />
          </div>
          <div className={styles.navActions}>
            <Link href="/signin" className={styles.navButton}>
              Sign In
            </Link>
            <Link href="/signup" className={styles.primaryNavButton}>
              Sign Up
            </Link>
          </div>
        </div>
      </header>
      <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.heroSection}>
          <div className={styles.heroBackground}>
            <Image
              src="/field.webp"
              alt="Beautiful field landscape"
              fill
              className={styles.backgroundImage}
              priority
            />
            <div className={styles.heroOverlay}></div>
          </div>
          <div className={styles.heroContent}>
            <Image
              src="/caninecaperslogotext_final.png?v=1"
              alt="Canine Capers"
              width={1200}
              height={240}
              className={styles.mainLogo}
            />
            <p className={styles.subtitle}>
            Stourport&apos;s home for safe, private dog adventures. Space to run, play, and just be a dog.
            </p>
            <div className={styles.actions}>
              <Link href="/signin" className={styles.primaryButton}>
                Sign In
              </Link>
              <Link href="/signup" className={styles.secondaryButton}>
                Create Account
              </Link>
            </div>
          </div>
        </div>

        {/* Offers Promo Tile */}
        <div className={styles.offersPromo}>
          <div className={styles.offersPromoContent}>
            <div className={styles.offersPromoBadge}>Save</div>
            <h3 className={styles.offersPromoTitle}>Save with Packages</h3>
            <p className={styles.offersPromoText}>Buy 10 sessions, get 2 free — available for multiple lengths.</p>
            <Link href="/book" className={styles.offersPromoButton}>View Offers</Link>
          </div>
        </div>

        {/* Gallery Preview */}
        <div className={styles.galleryPreview}>
          <div className={styles.galleryPreviewHeader}>
            <h3 className={styles.galleryPreviewTitle}>Field Gallery</h3>
            <Link href="/gallery" className={styles.galleryPreviewLink}>View All →</Link>
          </div>
          <p className={styles.galleryPreviewSubtitle}>See photos from our community</p>
          <div className={styles.galleryPreviewGrid}>
            {/* These will be populated dynamically when gallery is set up */}
            <div className={styles.galleryPreviewPlaceholder}>
              <span className={styles.galleryPreviewIcon}>📷</span>
              <p>Share your photos!</p>
            </div>
          </div>
        </div>

        <div className={styles.features}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <Image
                src="/hillicon.png"
                alt="Hill landscape"
                width={96}
                height={96}
                className={styles.iconImage}
              />
            </div>
            <h3 className={styles.featureTitle}>Private Field Hire</h3>
            <p className={styles.featureDescription}>
              Book safe, exclusive fields for off-lead freedom. Space to run, play, and relax — just you and your dog.
            </p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <Image
                src="/pawprintclock.png"
                alt="Paw print with clock"
                width={96}
                height={96}
                className={styles.iconImage}
              />
            </div>
            <h3 className={styles.featureTitle}>Care & Convenience</h3>
            <p className={styles.featureDescription}>
              Trusted local care and easy bookings. Manage sessions, reschedule, or check availability all in one place.
            </p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <Image
                src="/dogheart.png"
                alt="Dog heart"
                width={96}
                height={96}
                className={styles.iconImage}
              />
            </div>
            <h3 className={styles.featureTitle}>Community & Calm</h3>
            <p className={styles.featureDescription}>
              A countryside escape built for dogs and owners alike — friendly, calm, and close to home.
            </p>
          </div>
        </div>

      </main>
    </div>
    </>
  );
}
