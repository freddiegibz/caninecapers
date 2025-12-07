"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "../../src/lib/supabaseClient";
import AppHeader from "../../components/AppHeader";
import BottomNav from "../../components/BottomNav";
import styles from "./page.module.css";

// Icons
const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const LogOutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

export default function Settings() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userEmail, setUserEmail] = useState('Loading...');
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [profileStatus, setProfileStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);

  // Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [passwordStatus, setPasswordStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserEmail('Guest');
        return;
      }

      setUserEmail(user.email || '');
      
      let firstName = user.user_metadata?.first_name || '';
      let lastName = user.user_metadata?.last_name || '';
      const phone = user.user_metadata?.phone || '';

      // Fallback to profiles table if needed
      if (!firstName && !lastName) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          firstName = profile.first_name || '';
          lastName = profile.last_name || '';
        }
      }

      setProfileData({ firstName, lastName, phone });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      setProfileStatus(null);

      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: profileData.firstName.trim() || null,
          last_name: profileData.lastName.trim() || null,
          phone: profileData.phone.trim() || null
        }
      });

      if (error) throw error;

      setProfileStatus({ type: 'success', msg: 'Profile updated successfully' });
      setIsEditing(false);
      setTimeout(() => setProfileStatus(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update';
      setProfileStatus({ type: 'error', msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      setPasswordStatus({ type: 'error', msg: 'All fields are required' });
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      setPasswordStatus({ type: 'error', msg: 'New passwords do not match' });
      return;
    }

    try {
      setIsChangingPassword(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('No user found');

      // Verify current
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.current
      });
      if (signInError) throw new Error('Current password is incorrect');

      // Update
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.new
      });
      if (updateError) throw updateError;

      setPasswordStatus(null);
      setShowPasswordModal(false);
      setPasswordData({ current: '', new: '', confirm: '' });
      alert('Password updated successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password';
      setPasswordStatus({ type: 'error', msg });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const fullName = [profileData.firstName, profileData.lastName].filter(Boolean).join(' ') || 'Valued Member';

  return (
    <div className={styles.container}>
      <AppHeader />

      <main className={styles.main}>
        {/* Hero Section */}
        <div className={styles.profileHero}>
          <div className={styles.avatarContainer}>
            <div className={styles.avatar}>
              <Image src="/centralbark.webp" alt="Profile" fill className={styles.avatarImage} />
            </div>
          </div>
          <h1 className={styles.heroName}>{fullName}</h1>
          <p className={styles.heroEmail}>{userEmail}</p>
        </div>

        <div className={styles.contentGrid}>
          {/* Left Column: Member Details */}
          <div>
            <div className={styles.sectionTitle}>Membership Details</div>
            <div className={styles.membershipCard}>
              <div className={styles.cardHeader}>
                <h3 style={{margin:0, fontFamily:'var(--font-poppins)', fontSize:'1.1rem', color:'#2B3A29'}}>Personal Information</h3>
                {!isEditing ? (
                  <button className={styles.editButton} onClick={() => setIsEditing(true)}>
                    Edit <EditIcon />
                  </button>
                ) : (
                  <div style={{display:'flex', gap:'0.5rem'}}>
                    <button 
                      className={styles.editButton} 
                      onClick={() => setIsEditing(false)}
                      style={{color:'#7B8A80'}}
                    >
                      Cancel
                    </button>
                    <button 
                      className={styles.editButton} 
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      style={{background:'#2B3A29', color:'#fff'}}
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.infoGrid}>
                <div className={styles.infoGroup}>
                  <label className={styles.infoLabel}>First Name</label>
                  {isEditing ? (
                    <input 
                      className={styles.inputField}
                      value={profileData.firstName}
                      onChange={e => setProfileData(prev => ({...prev, firstName: e.target.value}))}
                    />
                  ) : (
                    <div className={styles.infoValue}>{profileData.firstName || '—'}</div>
                  )}
                </div>

                <div className={styles.infoGroup}>
                  <label className={styles.infoLabel}>Last Name</label>
                  {isEditing ? (
                    <input 
                      className={styles.inputField}
                      value={profileData.lastName}
                      onChange={e => setProfileData(prev => ({...prev, lastName: e.target.value}))}
                    />
                  ) : (
                    <div className={styles.infoValue}>{profileData.lastName || '—'}</div>
                  )}
                </div>

                <div className={`${styles.infoGroup} ${styles.fullWidth}`}>
                  <label className={styles.infoLabel}>Phone Number</label>
                  {isEditing ? (
                    <input 
                      className={styles.inputField}
                      value={profileData.phone}
                      onChange={e => setProfileData(prev => ({...prev, phone: e.target.value}))}
                      placeholder="+44..."
                    />
                  ) : (
                    <div className={styles.infoValue}>{profileData.phone || '—'}</div>
                  )}
                </div>
              </div>
              {profileStatus && (
                <div className={`${styles.statusMessage} ${styles[profileStatus.type]}`}>
                  {profileStatus.msg}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Actions & Security */}
          <div className={styles.actionsColumn}>
            <div>
              <div className={styles.sectionTitle}>Account Security</div>
              <div className={styles.actionCard}>
                <button className={styles.actionButton} onClick={() => setShowPasswordModal(true)}>
                  <div className={styles.actionContent}>
                    <div className={styles.actionIcon}><LockIcon /></div>
                    <div>
                      <span className={styles.actionTitle}>Change Password</span>
                      <span className={styles.actionDesc}>Update your login credentials</span>
                    </div>
                  </div>
                  <span style={{color: '#A3B18A'}}>→</span>
                </button>
                
                <button className={styles.logoutButton} onClick={handleLogout} disabled={isLoggingOut}>
                  <LogOutIcon />
                  {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className={styles.modalOverlay} onClick={() => setShowPasswordModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Update Password</h2>
            
            <input 
              type="password" 
              placeholder="Current Password"
              className={styles.modalInput}
              value={passwordData.current}
              onChange={e => setPasswordData(prev => ({...prev, current: e.target.value}))}
            />
            <input 
              type="password" 
              placeholder="New Password"
              className={styles.modalInput}
              value={passwordData.new}
              onChange={e => setPasswordData(prev => ({...prev, new: e.target.value}))}
            />
            <input 
              type="password" 
              placeholder="Confirm New Password"
              className={styles.modalInput}
              value={passwordData.confirm}
              onChange={e => setPasswordData(prev => ({...prev, confirm: e.target.value}))}
            />

            {passwordStatus && (
              <div className={`${styles.statusMessage} ${styles[passwordStatus.type]}`}>
                {passwordStatus.msg}
              </div>
            )}

            <div className={styles.modalActions}>
              <button 
                className={styles.secondaryBtn} 
                onClick={() => setShowPasswordModal(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.primaryBtn}
                onClick={handleChangePassword}
                disabled={isChangingPassword}
              >
                {isChangingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
