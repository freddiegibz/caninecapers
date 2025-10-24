import Link from "next/link";
import styles from "./page.module.css";

export default function SignIn() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome to Canine Capers</h1>
          <p className={styles.subtitle}>
            Sign in to manage your bookings and view your upcoming sessions.
          </p>
        </div>

        <form className={styles.signInForm}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className={styles.input}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className={styles.input}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className={styles.signInButton}>
            Sign In
          </button>

          <p className={styles.signUpLink}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className={styles.link}>
              Sign up here.
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}
