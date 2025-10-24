"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";

export default function Settings() {
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [updatesEnabled, setUpdatesEnabled] = useState(true);

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
            <h2 className={styles.sectionTitle}>
              Settings
              <span className={styles.titleUnderline}></span>
            </h2>

            {/* Profile Section */}
            <div className={styles.settingsSection}>
              <h3 className={styles.sectionHeader}>Profile</h3>

              <div className={styles.profileCard}>
                <div className={styles.profileInfo}>
                  <div className={styles.avatar}>
                    <Image
                      src="/centralbark.webp"
                      alt="Profile"
                      width={60}
                      height={60}
                      className={styles.avatarImage}
                    />
                  </div>
                  <div className={styles.profileDetails}>
                    <h4 className={styles.profileName}>Sarah Johnson</h4>
                    <p className={styles.profileEmail}>sarah.johnson@email.com</p>
                  </div>
                </div>
                <button className={styles.editButton}>
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Notifications Section */}
            <div className={styles.settingsSection}>
              <h3 className={styles.sectionHeader}>Notifications</h3>

              <div className={styles.toggleGroup}>
                <div className={styles.toggleItem}>
                  <div className={styles.toggleInfo}>
                    <span className={styles.toggleLabel}>Session Reminders</span>
                    <span className={styles.toggleDescription}>Get reminded about upcoming sessions</span>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={remindersEnabled}
                      onChange={(e) => setRemindersEnabled(e.target.checked)}
                      className={styles.toggleInput}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>

                <div className={styles.toggleItem}>
                  <div className={styles.toggleInfo}>
                    <span className={styles.toggleLabel}>App Updates</span>
                    <span className={styles.toggleDescription}>Receive notifications about app updates</span>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={updatesEnabled}
                      onChange={(e) => setUpdatesEnabled(e.target.checked)}
                      className={styles.toggleInput}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              </div>
            </div>

            {/* Account Section */}
            <div className={styles.settingsSection}>
              <h3 className={styles.sectionHeader}>Account</h3>

              <div className={styles.accountActions}>
                <button className={styles.accountButton}>
                  <div className={styles.buttonIconContainer}>
                    <Image
                      src="/changepass.png"
                      alt="Change Password"
                      width={20}
                      height={20}
                      className={styles.buttonIconImage}
                    />
                  </div>
                  <span className={styles.buttonText}>Change Password</span>
                  <span className={styles.buttonArrow}>›</span>
                </button>

                <button className={styles.accountButton}>
                  <div className={styles.buttonIconContainer}>
                    <Image
                      src="/logout.png"
                      alt="Logout"
                      width={20}
                      height={20}
                      className={styles.buttonIconImage}
                    />
                  </div>
                  <span className={styles.buttonText}>Logout</span>
                  <span className={styles.buttonArrow}>›</span>
                </button>
              </div>
            </div>

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
