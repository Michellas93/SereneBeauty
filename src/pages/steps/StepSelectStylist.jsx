import { useData } from '../../admin/context/DataContext';
import StylistIcon from '../../components/StylistIcon';
import styles from './StepSelectStylist.module.css';

const NO_PREF = {
  id: 'no-preference',
  name: 'Bez preference',
  specialty: 'Přiřadit prvního dostupného specialistu',
  avatar: null,
  cannotDo: [],
};


export default function StepSelectStylist({ booking, update, onNext, onBack, onHome, step, totalSteps }) {
  const { stylists, services } = useData();
  const selected = booking.stylist;

  const selectedServiceSlugs = services
    .filter(s => booking.services.includes(s.id))
    .map(s => s.slug)
    .filter(Boolean);

  const isUnavailable = (stylist) =>
    stylist.cannotDo?.some(slug => selectedServiceSlugs.includes(slug)) ?? false;

  const unavailableReason = (stylist) => {
    const blocked = stylist.cannotDo?.filter(slug => selectedServiceSlugs.includes(slug)) ?? [];
    if (!blocked.length) return null;
    const names = services
      .filter(s => blocked.includes(s.slug))
      .map(s => s.name)
      .join(', ');
    return `Neprovádí: ${names}`;
  };

  const all = [NO_PREF, ...stylists];

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.topRow}>
          <button className={styles.backBtn} onClick={onBack}>
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
        <div className={styles.titleRow}>
          <h2>VYBERTE KADEŘNÍKA</h2>
          <span className={styles.stepCount}>{step + 1 < 10 ? `0${step + 1}` : step + 1} / {totalSteps < 10 ? `0${totalSteps}` : totalSteps}</span>
        </div>
      </div>

      <div className={styles.list}>
        {all.map((s) => {
          const unavailable = s.id !== 'no-preference' && isUnavailable(s);
          const reason = unavailable ? unavailableReason(s) : null;
          const isSel = selected === s.id;

          return (
            <button
              key={s.id}
              className={`${styles.item} ${isSel ? styles.itemSelected : ''} ${unavailable ? styles.itemUnavailable : ''}`}
              onClick={() => !unavailable && update({ stylist: s.id, date: null, time: null })}
              disabled={unavailable}
            >
              <div className={styles.avatar}>
                <StylistIcon specialty={s.specialty} />
              </div>
              <div className={styles.info}>
                <div className={styles.stylistName}>{s.name}</div>
                <div className={styles.specialty}>{reason ?? s.specialty}</div>
              </div>
              <div className={`${styles.checkbox} ${isSel ? styles.checked : ''}`}>
                {isSel && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className={styles.footer}>
        <button className={styles.backFootBtn} onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          ZPĚT
        </button>
        <button className={styles.nextBtn} onClick={onNext} disabled={!selected}>
          DALŠÍ
        </button>
      </div>
    </div>
  );
}
