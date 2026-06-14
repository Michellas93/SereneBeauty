import { useNavigate, Link } from 'react-router-dom';
import { useData } from '../admin/context/DataContext';
import styles from './Landing.module.css';

const heroImg = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80';

export default function Landing() {
  const navigate = useNavigate();
  const { settings } = useData();

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <img src={heroImg} alt="Salon interior" className={styles.heroImg} />
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <div className={styles.topBar}>
            <span className={styles.brand}>Serene Beauty</span>
            <Link to="/admin" className={styles.adminLink}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </Link>
          </div>
          <div className={styles.heroText}>
            <h1>Serene<br />Beauty<br />Salon</h1>
            <p>Kde špičková móda potkává relaxační zážitek lázní. Objevte svou nejzářivější podobu v našem minimalistickém útočišti.</p>
            <div className={styles.heroBtns}>
              <button className={styles.btnPrimary} onClick={() => navigate('/book')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                REZERVOVAT TERMÍN
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Naše Služby</h2>
        <p className={styles.subtext}>
          Pečlivě vybrané kosmetické ošetření navržené pro moderního člověka. Každá služba je přizpůsobena vašemu jedinečnému profilu vlasů a wellness potřebám.
        </p>
        <button className={styles.btnPriceList} onClick={() => navigate('/book')}>
          Ceník služeb
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerContacts}>
          <a href={`tel:${settings?.phone?.replace(/\s/g, '')}`} className={styles.footerContact}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.4 2 2 0 0 1 3.62 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.76a16 16 0 0 0 5.94 5.94l1.62-1.62a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            {settings?.phone}
          </a>
          <span className={styles.footerDot}>·</span>
          <span className={styles.footerContact}>Platba hotově i kartou</span>
          <span className={styles.footerDot}>·</span>
          <span className={styles.footerContact}>{settings?.openingHours}</span>
        </div>
        <span className={styles.footerCopy}>© 2026 Serene Beauty Salon</span>
      </footer>
    </div>
  );
}
