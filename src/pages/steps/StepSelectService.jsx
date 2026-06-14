import { useData } from '../../admin/context/DataContext';
import StepHeader from './StepHeader';
import styles from './StepSelectService.module.css';

const COMBOS = [
  {
    name: 'Barva + Střih + Foukaná',
    description: 'Nejoblíbenější kombinace — kompletní proměna v jedné návštěvě.',
    badge: 'Nejoblíbenější',
    slugs: ['color', 'haircut-women', 'blowout'],
  },
];

export default function StepSelectService({ booking, update, onNext, onBack, step, totalSteps }) {
  const { services } = useData();
  const selected = booking.services;

  const toggle = (id) => {
    if (selected.includes(id)) {
      update({ services: selected.filter((s) => s !== id) });
    } else {
      update({ services: [...selected, id] });
    }
  };

  const combos = COMBOS.map((combo) => {
    const items = combo.slugs.map((slug) => services.find((s) => s.slug === slug)).filter(Boolean);
    const ids = items.map((s) => s.id);
    const allSelected = ids.length > 0 && ids.every((id) => selected.includes(id));
    const price = items.reduce((sum, s) => sum + (s.price || 0), 0);
    const duration = items.reduce((sum, s) => sum + (s.durationMin || 0), 0);
    const h = Math.floor(duration / 60), m = duration % 60;
    const durationLabel = m === 0 ? `${h} h` : `${h} h ${m} min`;
    return { ...combo, ids, items, allSelected, price, durationLabel };
  });

  const toggleCombo = (combo) => {
    if (combo.allSelected) {
      update({ services: selected.filter((id) => !combo.ids.includes(id)) });
    } else {
      update({ services: [...new Set([...selected, ...combo.ids])] });
    }
  };

  const totalDuration = services
    .filter((s) => selected.includes(s.id))
    .reduce((sum, s) => sum + (s.durationMin ?? 30), 0);
  const formatDuration = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} min`;
    return m === 0 ? `${h} h` : `${h} h ${m} min`;
  };

  return (
    <div className={styles.page}>
      <StepHeader
        step={step}
        total={totalSteps}
        title="Vyberte službu"
        onBack={onBack}
      />

      <p className={styles.hint}>Můžete vybrat více služeb najednou. Uvedené časy jsou pouze orientační.</p>

      {combos.filter((c) => c.items.length > 0).map((combo) => (
        <div key={combo.name} className={`${styles.comboCard} ${combo.allSelected ? styles.comboSelected : ''}`}>
          <span className={styles.comboBadge}>{combo.badge}</span>
          <div className={styles.comboBody}>
            <div className={styles.comboLeft}>
              <div className={styles.comboName}>{combo.name}</div>
              <div className={styles.comboDesc}>{combo.description}</div>
              <div className={styles.comboPills}>
                {combo.items.map((s) => (
                  <span key={s.id} className={styles.comboPill}>{s.name}</span>
                ))}
              </div>
              <button className={styles.selectBtn} onClick={() => toggleCombo(combo)}>
                <span className={`${styles.checkbox} ${combo.allSelected ? styles.checkboxSelected : ''}`}>
                  {combo.allSelected && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </span>
                {combo.allSelected ? 'Vybráno' : 'Přidat kombo'}
              </button>
            </div>
            <div className={styles.comboRight}>
              <div className={styles.cardPrice}>od {combo.price.toLocaleString('cs-CZ')} Kč</div>
              <div className={styles.cardDuration}>~ {combo.durationLabel}</div>
            </div>
          </div>
        </div>
      ))}

      <div className={styles.sectionLabel}>Nebo vyberte jednotlivě</div>

      <div className={styles.list}>
        {services.map((svc) => {
          const isSelected = selected.includes(svc.id);
          return (
            <div key={svc.id} className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}>
              <div className={styles.cardBody}>
                <div className={styles.cardLeft}>
                  <div className={styles.cardName}>{svc.name}</div>
                  <div className={styles.cardDuration}>{svc.duration}</div>
                  <div className={styles.cardDesc}>{svc.description}</div>
                  <button
                    className={styles.selectBtn}
                    onClick={() => toggle(svc.id)}
                  >
                    <span className={`${styles.checkbox} ${isSelected ? styles.checkboxSelected : ''}`}>
                      {isSelected && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </span>
                    {isSelected ? 'Vybráno' : 'Přidat'}
                  </button>
                </div>
                <div className={styles.cardPrice}>
                  {svc.price ? `od ${svc.price.toLocaleString('cs-CZ')} Kč` : 'NA DOTAZ'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.footer}>
        {selected.length > 0 && (
          <p className={styles.durationSummary}>
            Přibližná celková délka: <strong>~ {formatDuration(totalDuration)}</strong>
          </p>
        )}
        <button
          className={styles.nextBtn}
          onClick={onNext}
          disabled={selected.length === 0}
        >
          {selected.length > 0 ? `Pokračovat (${selected.length} ${selected.length === 1 ? 'služba' : selected.length < 5 ? 'služby' : 'služeb'})` : 'Vyberte alespoň jednu službu'}
          {selected.length > 0 && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
