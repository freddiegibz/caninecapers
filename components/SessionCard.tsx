import Image from "next/image";
import styles from "./SessionCard.module.css";

interface SessionCardProps {
  meta: {
    id: string;
    name: string;
  };
  time: string;
  date?: string;
  duration?: string;
  price: string;
  onClick: () => void;
}

export default function SessionCard({ meta, time, date, duration, price, onClick }: SessionCardProps) {
  const fieldImage = meta.id === 'central-bark' ? '/centralbark.webp' : '/hydebark.webp';
  const fieldIcon = meta.id === 'central-bark' ? '/locationicon/centralbark.png' : '/locationicon/hydebarki.png';
  
  return (
    <div className={styles.availabilityCard} onClick={onClick}>
      <div className={styles.availabilityImageWrapper}>
        <Image
          src={fieldImage}
          alt={meta.name}
          width={220}
          height={140}
          className={styles.availabilityImage}
        />
        <div className={styles.imageGradientOverlay}></div>
      </div>
      <div className={styles.availabilityContent}>
        {date && (
          <div className={styles.availabilityDate}>{date}</div>
        )}
        <div className={styles.availabilityTime}>{time}</div>
        <div className={styles.availabilityDetails}>
          <span className={styles.availabilityField}>
            <Image
              src={fieldIcon}
              alt=""
              width={16}
              height={16}
              className={styles.fieldIcon}
            />
            {meta.name}
          </span>
          {duration && (
            <>
              <span className={styles.availabilitySeparator}>·</span>
              <span className={styles.availabilityLength}>
                <span className={styles.clockIcon}>🕒</span> {duration}
              </span>
            </>
          )}
          <span className={styles.availabilitySeparator}>·</span>
          <span className={styles.availabilityPrice}>{price}</span>
        </div>
        <button className={styles.availabilityBookButton}>
          Book
        </button>
      </div>
    </div>
  );
}
