import Link from "next/link";
import styles from "./page.module.css";

export default function SignUp() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create Your Canine Capers Account</h1>
          <p className={styles.subtitle}>
            Sign up to book and manage your private dog-walking sessions.
          </p>
        </div>

        <form className={styles.signUpForm}>
          <div className={styles.formGroup}>
            <label htmlFor="fullName" className={styles.label}>Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              className={styles.input}
              placeholder="Enter your full name"
              required
            />
          </div>

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
              placeholder="Create a password"
              required
            />
          </div>

          <button type="submit" className={styles.createAccountButton}>
            Create Account
          </button>

          <p className={styles.signInLink}>
            Already have an account?{" "}
            <Link href="/login" className={styles.link}>
              Sign in here.
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}

