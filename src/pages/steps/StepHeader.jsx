import styles from './StepHeader.module.css';

export default function StepHeader({ step, total, title, subtitle, onBack, onHome }) {
  return (
    <div className={styles.header}>
      <div className={styles.topRow}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Zpět">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        {onHome && (
          <button className={styles.homeBtn} onClick={onHome}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Hlavní stránka
          </button>
        )}
      </div>
      <div className={styles.stepInfo}>
        <div className={styles.stepLabel}>KROK {step + 1} Z {total}</div>
        <h2 className={styles.title}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      <div className={styles.progress}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`${styles.dot} ${i <= step ? styles.active : ''}`} />
        ))}
      </div>
    </div>
  );
}
