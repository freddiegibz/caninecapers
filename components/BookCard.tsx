import React from 'react';
import Image from 'next/image';
import styles from './BookCard.module.css';

interface BookCardProps {
  session: {
    image_url: string;
    date: string;
    time: string;
    length: string;
    field: string;
    price: string;
  };
  onBook: () => void;
}

const BookCard: React.FC<BookCardProps> = ({ session, onBook }) => {
  return (
    <div className={styles.card}>
      {/* Top Half - Image with Price Overlay */}
      <div className={styles.imageContainer}>
        <Image
          src={session.image_url}
          alt={session.field}
          fill
          className={styles.image}
        />
        {/* Price Tag Overlay */}
        <div className={styles.priceTag}>
          <span className={styles.priceText}>{session.price}</span>
        </div>
      </div>

      {/* Bottom Half - Session Information */}
      <div className={styles.content}>
        {/* Date */}
        <div className={styles.infoRow}>
          <span className={styles.label}>Date</span>
          <span className={styles.value}>{session.date}</span>
        </div>

        {/* Time */}
        <div className={styles.infoRow}>
          <span className={styles.label}>Time</span>
          <span className={styles.value}>{session.time}</span>
        </div>

        {/* Length */}
        <div className={styles.infoRow}>
          <span className={styles.label}>Length</span>
          <span className={styles.value}>{session.length}</span>
        </div>

        {/* Field Name */}
        <div className={styles.infoRow}>
          <span className={styles.label}>Field</span>
          <span className={`${styles.value} ${styles.fieldValue}`}>{session.field}</span>
        </div>

        {/* Book Session Button */}
        <button
          onClick={onBook}
          className={styles.bookButton}
        >
          Book Session
        </button>
      </div>
    </div>
  );
};

export default BookCard;
