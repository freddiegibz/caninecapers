'use client';

import React from 'react';
import BookCard from '../../components/BookCard';
import styles from './page.module.css';

export default function BookCardDemo() {
  // Sample session data for demonstration
  const sampleSessions = [
    {
      image_url: '/centralbark.webp',
      date: 'Wed 30 Oct',
      time: '3:00 PM',
      length: '30 min',
      field: 'Central Bark',
      price: '£5.50'
    },
    {
      image_url: '/hydebark.webp',
      date: 'Fri 1 Nov',
      time: '10:00 AM',
      length: '45 min',
      field: 'Hyde Bark',
      price: '£8.25'
    },
    {
      image_url: '/centralbark.webp',
      date: 'Sat 2 Nov',
      time: '2:00 PM',
      length: '1 hour',
      field: 'Central Bark',
      price: '£11.00'
    }
  ];

  const handleBook = (session: typeof sampleSessions[0]) => {
    console.log('Booking session:', session);
    alert(`Booking confirmed for ${session.field} on ${session.date} at ${session.time}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>
          BookCard Component Demo
        </h1>
        <p className={styles.subtitle}>
          Mobile-optimized session booking cards for the Canine Capers app
        </p>

        <div className={styles.grid}>
          {sampleSessions.map((session, index) => (
            <BookCard
              key={index}
              session={session}
              onBook={() => handleBook(session)}
            />
          ))}
        </div>

        <div className={styles.features}>
          <h2 className={styles.featuresTitle}>Component Features:</h2>
          <ul className={styles.featuresList}>
            <li className={styles.featureItem}>• Mobile-optimized design (≤400px screens)</li>
            <li className={styles.featureItem}>• Forest-green theme (#2b3a29)</li>
            <li className={styles.featureItem}>• Semi-transparent price overlay</li>
            <li className={styles.featureItem}>• Clean information layout with dividers</li>
            <li className={styles.featureItem}>• Interactive button with press animation</li>
            <li className={styles.featureItem}>• Uses CSS modules for scoped styling</li>
            <li className={styles.featureItem}>• TypeScript support with proper interfaces</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
