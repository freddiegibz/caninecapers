"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "../../src/lib/supabaseClient";
import styles from "./page.module.css";

export default function Settings() {
  const router = useRouter();
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [updatesEnabled, setUpdatesEnabled] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userName, setUserName] = useState<string>('Loading...');
  const [userEmail, setUserEmail] = useState<string>('Loading...');
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const loadUserData = async () => {
    try {
      console.log('Loading user data for settings...');
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('Error fetching user:', error);
        setUserName('Guest');
        setUserEmail('guest@example.com');
        setIsLoadingUser(false);
        return;
      }

      console.log('Settings - User fetched:', user);

      if (user) {
        // Set email directly from user object
        setUserEmail(user.email || 'No email');

        // Try multiple ways to get the name
        let name = null;

        // 1. Check user metadata for name
        name = user.user_metadata?.name || user.user_metadata?.full_name || user.user_metadata?.display_name;
        console.log('Name from metadata:', name);

        // 2. Check user metadata for first/last name combination
        if (!name && user.user_metadata) {
          const firstName = user.user_metadata.first_name || user.user_metadata.given_name;
          const lastName = user.user_metadata.last_name || user.user_metadata.family_name;
          if (firstName || lastName) {
            name = [firstName, lastName].filter(Boolean).join(' ');
            console.log('Name from first/last name:', name);
          }
        }

        // 3. Try to fetch from profiles table
        if (!name) {
          console.log('Name not in metadata, checking profiles table...');
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('name, first_name, last_name, full_name')
              .eq('id', user.id)
              .single();

            console.log('Profile query result:', { profile, profileError });

            if (!profileError && profile) {
              // Try different name fields from profiles table
              name = profile.name || profile.full_name ||
                     (profile.first_name && profile.last_name ? `${profile.first_name} ${profile.last_name}` : null) ||
                     profile.first_name || profile.last_name;

              console.log('Name from profiles table:', name);
            } else {
              console.log('Profile query failed:', profileError?.message);
            }
          } catch (profileErr) {
            console.error('Error querying profiles table:', profileErr);
          }
        }

        // 4. Fallback to email username
        if (!name && user.email) {
          name = user.email.split('@')[0];
          console.log('Using email username:', name);
        }

        const finalName = name || 'User';
        console.log('Final name for settings:', finalName);
        setUserName(finalName);
      } else {
        console.log('No authenticated user found in settings');
        setUserName('Guest');
        setUserEmail('guest@example.com');
      }
    } catch (error) {
      console.error('Error loading user data for settings:', error);
      setUserName('Guest');
      setUserEmail('guest@example.com');
    } finally {
      setIsLoadingUser(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      console.log('Starting logout process...');

      // Check if user is actually logged in first
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Current user before logout:', user);

      if (userError) {
        console.error('Error checking current user:', userError);
        alert('Unable to verify login status. Please try again.');
        setIsLoggingOut(false);
        return;
      }

      if (!user) {
        console.log('No user logged in, redirecting to home');
        router.push('/');
        return;
      }

      console.log('Calling supabase.auth.signOut()...');
      const { error } = await supabase.auth.signOut();
      console.log('signOut result - error:', error);

      if (error) {
        console.error('Logout error:', error);
        alert(`Failed to log out: ${error.message}`);
        setIsLoggingOut(false);
      } else {
        console.log('User logged out successfully, redirecting...');
        // Use window.location for a hard redirect to ensure clean state
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Unexpected logout error:', error);
      alert(`An unexpected error occurred: ${error}`);
      setIsLoggingOut(false);
    }
  };

  const handleChangePassword = async () => {
    // Basic validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    try {
      setIsChangingPassword(true);
      setPasswordError('');
      console.log('Starting password change process...');

      // First, re-authenticate with current password
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user || !user.email) {
        setPasswordError('Unable to verify user session');
        setIsChangingPassword(false);
        return;
      }

      console.log('Re-authenticating user...');
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword
      });

      if (signInError) {
        console.error('Re-authentication failed:', signInError);
        setPasswordError('Current password is incorrect');
        setIsChangingPassword(false);
        return;
      }

      console.log('Updating password...');
      // Now update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (updateError) {
        console.error('Password update failed:', updateError);
        setPasswordError(updateError.message || 'Failed to update password');
      } else {
        console.log('Password updated successfully');
        // Clear form and close modal
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordModal(false);
        alert('Password changed successfully!');
      }
    } catch (error) {
      console.error('Unexpected error during password change:', error);
      setPasswordError('An unexpected error occurred');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const openPasswordModal = () => {
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError('');
    setShowPasswordModal(true);
  };

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
                    <h4 className={styles.profileName}>
                      {isLoadingUser ? 'Loading...' : userName}
                    </h4>
                    <p className={styles.profileEmail}>
                      {isLoadingUser ? 'Loading...' : userEmail}
                    </p>
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
                <button className={styles.accountButton} onClick={openPasswordModal}>
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

                <button
                  className={styles.accountButton}
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <div className={styles.buttonIconContainer}>
                    <Image
                      src="/logout.png"
                      alt="Logout"
                      width={20}
                      height={20}
                      className={styles.buttonIconImage}
                    />
                  </div>
                  <span className={styles.buttonText}>
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                  </span>
                  <span className={styles.buttonArrow}>›</span>
                </button>
              </div>
            </div>

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

        <Link href="/location" className={styles.footerAction}>
          <Image
            src="/location.png"
            alt="Locations"
            width={26}
            height={26}
            className={styles.footerIcon}
          />
          <span className={styles.footerLabel}>Location</span>
        </Link>

        <Link href="/settings" className={styles.footerAction} aria-current="page">
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

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className={styles.modalOverlay} onClick={() => setShowPasswordModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Change Password</h3>
              <button
                className={styles.modalClose}
                onClick={() => setShowPasswordModal(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Current Password</label>
                <input
                  type="password"
                  className={styles.formInput}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Enter your current password"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>New Password</label>
                <input
                  type="password"
                  className={styles.formInput}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter your new password"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Confirm New Password</label>
                <input
                  type="password"
                  className={styles.formInput}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm your new password"
                />
              </div>

              {passwordError && (
                <div className={styles.errorMessage}>{passwordError}</div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowPasswordModal(false)}
                disabled={isChangingPassword}
              >
                Cancel
              </button>
              <button
                className={styles.submitButton}
                onClick={handleChangePassword}
                disabled={isChangingPassword}
              >
                {isChangingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
