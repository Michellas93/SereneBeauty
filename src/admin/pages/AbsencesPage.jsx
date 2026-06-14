import { useState } from 'react';
import { useData } from '../context/DataContext';
import MiniCalendar from '../components/MiniCalendar';
import { ABSENCE_REASONS as REASONS, ABSENCE_REASON_CLASS as REASON_CLASS } from '../../utils/dateConstants';
import { getAbsenceStartDate as getStartDate, getAbsenceEndDate as getEndDate, formatAbsenceDate } from '../../utils/absenceUtils';
import styles from './ManagePage.module.css';

const TIME_OPTIONS = (() => {
  const opts = [];
  for (let h = 8; h <= 20; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 20 && m > 0) break;
      opts.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    }
  }
  return opts;
})();

export default function AbsencesPage() {
  const { stylists, absences, addAbsence, deleteAbsence } = useData();
  const today = new Date().toISOString().split('T')[0];
  const [stylistId, setStylistId] = useState('');
  const [reason, setReason] = useState('Dovolená');
  const [fullDay, setFullDay] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [saving, setSaving] = useState(false);

  const isVacation = reason === 'Dovolená';

  const handleReasonChange = (r) => {
    setReason(r);
    setFullDay(r === 'Dovolená');
  };

  const dateValid = isVacation ? (dateFrom && dateTo) : !!date;
  const canSubmit = !!stylistId && dateValid;

  const handleAdd = async () => {
    if (!canSubmit) return;
    setSaving(true);
    const base = { stylistId, reason, isFullDay: fullDay };
    if (isVacation) {
      await addAbsence({ ...base, dateFrom, dateTo, ...(!fullDay && { startTime, endTime }) });
      setDateFrom(''); setDateTo('');
    } else {
      await addAbsence({ ...base, date, ...(!fullDay && { startTime, endTime }) });
      setDate('');
    }
    setSaving(false);
  };

  const upcoming = [...absences]
    .filter(a => getEndDate(a) >= today)
    .sort((a, b) => getStartDate(a).localeCompare(getStartDate(b)));
  const past = [...absences]
    .filter(a => getEndDate(a) < today)
    .sort((a, b) => getStartDate(b).localeCompare(getStartDate(a)))
    .slice(0, 5);

  const getStylistName = (id) => stylists.find(s => s.id === id)?.name || id;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Absence</h1>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Přidat absenci</h2>
        </div>

        <div className={styles.absenceFormCard}>
          <div className={styles.absenceField} style={{ maxWidth: 320 }}>
            <label className={styles.absenceLabel}>Kadeřník</label>
            <select className={styles.absenceSelectLg} value={stylistId} onChange={e => setStylistId(e.target.value)}>
              <option value="">Vyberte kadeřníka…</option>
              {stylists.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className={styles.absenceField}>
            <label className={styles.absenceLabel}>Důvod</label>
            <div className={styles.reasonPills}>
              {REASONS.map(r => (
                <button key={r} type="button"
                  className={`${styles.reasonPill} ${reason === r ? styles.reasonPillActive : ''}`}
                  onClick={() => handleReasonChange(r)}
                >{r}</button>
              ))}
            </div>
          </div>

          {isVacation ? (
            <div className={styles.absenceFormRow}>
              <div className={styles.absenceField}>
                <label className={styles.absenceLabel}>Od data</label>
                <MiniCalendar value={dateFrom} onChange={(d) => { setDateFrom(d); if (dateTo && dateTo < d) setDateTo(''); }} />
              </div>
              <div className={styles.absenceField}>
                <label className={styles.absenceLabel}>Do data</label>
                <MiniCalendar value={dateTo} onChange={setDateTo} minDateStr={dateFrom || undefined} />
              </div>
            </div>
          ) : (
            <div className={styles.absenceField} style={{ maxWidth: 320 }}>
              <label className={styles.absenceLabel}>Datum</label>
              <MiniCalendar value={date} onChange={setDate} />
            </div>
          )}

          <div className={styles.absenceField}>
            <label className={styles.absenceLabel}>Délka</label>
            <div className={styles.reasonPills}>
              <button
                type="button"
                className={`${styles.reasonPill} ${fullDay ? styles.reasonPillActive : ''}`}
                onClick={() => setFullDay(true)}
              >Celý den</button>
              <button
                type="button"
                className={`${styles.reasonPill} ${!fullDay ? styles.reasonPillActive : ''}`}
                onClick={() => setFullDay(false)}
              >Půl dne</button>
            </div>
          </div>

          {!fullDay && (
            <div className={styles.absenceTimeRow}>
              <div className={styles.absenceField}>
                <label className={styles.absenceLabel}>Od</label>
                <select className={styles.absenceSelectSm} value={startTime} onChange={e => { setStartTime(e.target.value); if (e.target.value >= endTime) setEndTime(TIME_OPTIONS[TIME_OPTIONS.indexOf(e.target.value) + 1] ?? endTime); }}>
                  {TIME_OPTIONS.slice(0, -1).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className={styles.absenceField}>
                <label className={styles.absenceLabel}>Do</label>
                <select className={styles.absenceSelectSm} value={endTime} onChange={e => setEndTime(e.target.value)}>
                  {TIME_OPTIONS.filter(t => t > startTime).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          )}

          <button className={styles.absenceAddBtn} onClick={handleAdd} disabled={!canSubmit || saving}>
            {saving ? 'Ukládám…' : 'Potvrdit'}
          </button>
        </div>

        {upcoming.length > 0 && (
          <>
            <h3 className={styles.absenceSubtitle}>Nadcházející absence</h3>
            <div className={styles.absenceList}>
              {upcoming.map(a => (
                <div key={a.id} className={styles.absenceItem}>
                  <span className={styles.absenceDate2}>{formatAbsenceDate(a)}</span>
                  <span className={styles.absenceName}>{getStylistName(a.stylistId)}</span>
                  {a.isFullDay === false && a.startTime ? (
                    <span className={styles.absenceTimeRange}>{a.startTime}–{a.endTime}</span>
                  ) : null}
                  <span className={`${styles.absenceReason} ${styles[REASON_CLASS[a.reason] || 'reasonOther']}`}>{a.reason}</span>
                  <button className={styles.absenceDelBtn} onClick={() => deleteAbsence(a.id)}>✕</button>
                </div>
              ))}
            </div>
          </>
        )}

        {past.length > 0 && (
          <>
            <h3 className={styles.absenceSubtitle} style={{ color: 'var(--gray-400)' }}>Minulé (posledních 5)</h3>
            <div className={styles.absenceList}>
              {past.map(a => (
                <div key={a.id} className={`${styles.absenceItem} ${styles.absenceItemPast}`}>
                  <span className={styles.absenceDate2}>{formatAbsenceDate(a)}</span>
                  <span className={styles.absenceName}>{getStylistName(a.stylistId)}</span>
                  {a.isFullDay === false && a.startTime ? (
                    <span className={styles.absenceTimeRange}>{a.startTime}–{a.endTime}</span>
                  ) : null}
                  <span className={styles.absenceReason}>{a.reason}</span>
                  <button className={styles.absenceDelBtn} onClick={() => deleteAbsence(a.id)}>✕</button>
                </div>
              ))}
            </div>
          </>
        )}

        {absences.length === 0 && <p className={styles.empty}>Žádné absence zatím nezadány.</p>}
      </div>
    </div>
  );
}
