'use client';

import { Wallet } from '@coinbase/onchainkit/wallet';
import styles from './HeaderWallet.module.css';

export default function HeaderWallet() {
  return (
    <header className={styles.header}>
      <div className={styles.title}>
        <span className={styles.name}>Mini Math Quiz</span>
      </div>
      <div className={styles.walletContainer}>
        <Wallet />
      </div>
    </header>
  );
}
