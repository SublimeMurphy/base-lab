import HeaderWallet from './components/HeaderWallet';
import MathQuiz from './components/MathQuiz';
import styles from './page.module.css';

export default function Page() {
  return (
    <main className={styles.container}>
      <div className={styles.inner}>
        <HeaderWallet />
        <section className={styles.mainContent}>
          <MathQuiz />
        </section>
      </div>
    </main>
  );
}
