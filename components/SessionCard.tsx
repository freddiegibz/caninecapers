import Image from "next/image";
import styles from "./SessionCard.module.css";

interface SessionCardProps {
  meta: {
    id: string;
    name: string;
  };
  dateLabel: string;
  price: string;
  onClick: () => void;
}

export default function SessionCard({ meta, dateLabel, price, onClick }: SessionCardProps) {
  return (
    <div className={styles.availabilityCard} onClick={onClick}>
      <div className={styles.availabilityImage}>
        <Image
          src={meta.id === 'central-bark' ? '/centralbark.webp' : '/hydebark.webp'}
          alt={meta.name}
          width={60}
          height={60}
          className={styles.availabilityImageContent}
        />
      </div>
      <div className={styles.availabilityContent}>
        <div className={styles.availabilityHeader}>
          <span className={styles.availabilityName}>
            {meta.name}
            <span className={styles.availabilityPrice}>{price}</span>
          </span>
        </div>
        <span className={styles.availabilityTimeslot}>{dateLabel}</span>
      </div>
      <div className={styles.bookButton}>
        Book
        <Image
          src="/images/bookarrow.png"
          alt=""
          width={14}
          height={14}
          className={styles.bookArrowIcon}
        />
      </div>
    </div>
  );
}
