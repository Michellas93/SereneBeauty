import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { timeToMin } from '../../utils/bookingConflict';
import { MONTHS, DAYS } from '../../utils/dateConstants';
import styles from './BookingModal.module.css';

const TIMES = Array.from({ length: 49 }, (_, i) => {
  const h = Math.floor(i / 4) + 8;
  const m = (i % 4) * 15;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});

function dateToStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

const STATUSES = ['confirmed', 'completed', 'no-show', 'cancelled'];

const empty = {
  clientName: '', clientPhone: '', clientEmail: '',
  date: '', time: '09:00', stylistId: '', serviceIds: [],
  status: 'confirmed', notes: '',
};

export default function BookingModal({ booking, onClose, defaultDate, defaultTime }) {
  const { stylists, services, bookings, addBooking, updateBooking } = useData();
  const isEdit = !!booking;

  const [form, setForm] = useState(() =>
    isEdit
      ? { ...booking }
      : { ...empty, date: defaultDate || '', time: defaultTime || '09:00' }
  );
  const [error, setError] = useState('');
  const today = new Date();
  const initDate = form.date ? new Date(form.date + 'T12:00:00') : today;
  const [calYear, setCalYear] = useState(initDate.getFullYear());
  const [calMonth, setCalMonth] = useState(initDate.getMonth());
  const [calOpen, setCalOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const toggleService = (id) =>
    set('serviceIds', form.serviceIds.includes(id)
      ? form.serviceIds.filter((s) => s !== id)
      : [...form.serviceIds, id]
    );

  const totalPrice = services
    .filter((s) => form.serviceIds.includes(s.id))
    .reduce((sum, s) => sum + (s.price || 0), 0);

  const totalDuration = services
    .filter((s) => form.serviceIds.includes(s.id))
    .reduce((sum, s) => sum + (s.durationMin ?? 30), 0) || 30;

  const confirmedBookings = (form.stylistId && form.date)
    ? bookings.filter((b) =>
        b.stylistId === form.stylistId &&
        b.date === form.date &&
        b.status === 'confirmed' &&
        b.id !== booking?.id
      )
    : [];

  const bookedIntervals = confirmedBookings.map((b) => {
    const start = timeToMin(b.time);
    const dur = services
      .filter((s) => (b.serviceIds || []).includes(s.id))
      .reduce((sum, s) => sum + (s.durationMin ?? 30), 0) || 30;
    return { start, end: start + dur, clientName: b.clientName, time: b.time };
  });

  const getConflict = (t) => {
    const start = timeToMin(t);
    const end = start + totalDuration;
    return bookedIntervals.find(({ start: bStart, end: bEnd }) => start < bEnd && bStart < end) ?? null;
  };

  const isTimeTaken = (t) => getConflict(t) !== null;

  const [submitting, setSubmitting] = useState(false);

  const selectedStylist = stylists.find(s => s.id === form.stylistId);
  const isNonWorkingDay = (ds) => {
    if (!selectedStylist?.schedule?.workingDays) return false;
    const jsDay = new Date(ds + 'T12:00:00').getDay();
    return !selectedStylist.schedule.workingDays.includes(jsDay);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.clientName.trim()) return setError('Jméno klienta je povinné.');
    if (!form.date) return setError('Vyberte prosím datum.');
    if (!form.stylistId) return setError('Vyberte prosím kadeřníka.');
    if (form.serviceIds.length === 0) return setError('Vyberte alespoň jednu službu.');
    if (isNonWorkingDay(form.date)) return setError(`${selectedStylist.name} v tento den nepracuje.`);
    if (form.status === 'confirmed' && isTimeTaken(form.time)) return setError('Vybraný čas je již obsazený. Zvolte jiný termín.');
    setError('');
    setSubmitting(true);
    try {
      const payload = { ...form, totalPrice };
      if (isEdit) {
        await updateBooking(booking.id, payload);
      } else {
        await addBooking(payload);
      }
      onClose();
    } catch (err) {
      setError(err?.message || 'Nepodařilo se uložit rezervaci. Zkuste to prosím znovu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>{isEdit ? 'Upravit rezervaci' : 'Nová rezervace'}</h2>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>

        <form className={styles.body} onSubmit={handleSubmit}>
          <div className={styles.section}>
            <h3>Údaje klienta</h3>
            <div className={styles.row}>
              <div className={styles.field}>
                <label>Celé jméno *</label>
                <input value={form.clientName} onChange={(e) => set('clientName', e.target.value)} placeholder="Jana Dvořák" />
              </div>
              <div className={styles.field}>
                <label>Telefon</label>
                <input value={form.clientPhone} onChange={(e) => set('clientPhone', e.target.value)} placeholder="+420 601 000 000" />
              </div>
            </div>
            <div className={styles.field}>
              <label>E-mail</label>
              <input type="email" value={form.clientEmail} onChange={(e) => set('clientEmail', e.target.value)} placeholder="klient@email.cz" />
            </div>
          </div>

          <div className={styles.section}>
            <h3>Termín</h3>
            <div className={styles.field}>
              <label>Kadeřník *</label>
              <div className={styles.selectWrap}>
                <select value={form.stylistId} onChange={(e) => { set('stylistId', e.target.value); set('time', '09:00'); }}>
                  <option value="">— Vyberte kadeřníka —</option>
                  {stylists.map((s) => <option key={s.id} value={s.id}>{s.name} – {s.specialty}</option>)}
                </select>
                <svg className={styles.selectArrow} width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1l5 5 5-5" stroke="#737373" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.field}>
                <label>Datum *</label>
                <div className={styles.miniCal}>
                  <button type="button" className={styles.calToggle} onClick={() => setCalOpen(o => !o)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span>{form.date ? form.date.split('-').reverse().join('.') : 'Vyberte datum'}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 'auto', transform: calOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>
                  {calOpen && (
                    <>
                      <div className={styles.calNav}>
                        <button type="button" className={styles.calNavBtn}
                          disabled={calYear === today.getFullYear() && calMonth === today.getMonth()}
                          onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}>‹</button>
                        <span className={styles.calMonthLabel}>{MONTHS[calMonth]} {calYear}</span>
                        <button type="button" className={styles.calNavBtn}
                          onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}>›</button>
                      </div>
                      <div className={styles.calGrid}>
                        {DAYS.map(d => <div key={d} className={styles.calDayName}>{d}</div>)}
                        {Array.from({ length: (new Date(calYear, calMonth, 1).getDay() + 6) % 7 }).map((_, i) => <div key={`e${i}`} />)}
                        {Array.from({ length: new Date(calYear, calMonth + 1, 0).getDate() }).map((_, i) => {
                          const day = i + 1;
                          const ds = dateToStr(calYear, calMonth, day);
                          const isPast = new Date(calYear, calMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                          const isNonWorking = isNonWorkingDay(ds);
                          const isSelected = form.date === ds;
                          const isToday = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
                          return (
                            <button
                              key={day} type="button"
                              disabled={isPast || isNonWorking}
                              className={`${styles.calDay} ${isPast || isNonWorking ? styles.calDayPast : ''} ${isSelected ? styles.calDaySelected : ''} ${isToday ? styles.calDayToday : ''}`}
                              onClick={() => { set('date', ds); set('time', '09:00'); setCalOpen(false); }}
                            >{day}</button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className={styles.field}>
                <label>Čas *</label>
                <div className={styles.selectWrap}>
                  <select
                    value={form.time}
                    onChange={(e) => set('time', e.target.value)}
                    disabled={!form.stylistId || !form.date}
                  >
                    {TIMES.map((t) => {
                      const taken = isTimeTaken(t);
                      return (
                        <option key={t} value={t} disabled={taken}>
                          {t}{taken ? ' — obsazeno' : ''}
                        </option>
                      );
                    })}
                  </select>
                  <svg className={styles.selectArrow} width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1l5 5 5-5" stroke="#737373" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
                {!form.stylistId || !form.date
                  ? <p className={styles.timeHint}>Nejdříve vyberte kadeřníka a datum.</p>
                  : (() => { const c = getConflict(form.time); return c ? <p className={styles.timeWarning}>⚠ Obsazeno rezervací {c.clientName} ({c.time})</p> : null; })()
                }
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3>Služby</h3>
            <div className={styles.checkboxGrid}>
              {services.map((s) => (
                <label key={s.id} className={`${styles.checkItem} ${form.serviceIds.includes(s.id) ? styles.checked : ''}`}>
                  <input
                    type="checkbox"
                    checked={form.serviceIds.includes(s.id)}
                    onChange={() => toggleService(s.id)}
                  />
                  <div className={styles.checkInfo}>
                    <span className={styles.checkName}>{s.name}</span>
                    <span className={styles.checkPrice}>{s.price ? `${s.price} Kč` : 'Na dotaz'}</span>
                  </div>
                </label>
              ))}
            </div>
            {totalPrice > 0 && (
              <p className={styles.total}>Celkem: <strong>{totalPrice} Kč</strong></p>
            )}
          </div>

          {isEdit && (
            <div className={styles.section}>
              <h3>Stav</h3>
              <div className={styles.statusRow}>
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`${styles.statusBtn} ${form.status === s ? styles[s] : styles.statusInactive}`}
                    onClick={() => set('status', s)}
                  >
                    {s === 'confirmed' ? 'Potvrzeno' : s === 'completed' ? 'Dokončeno' : s === 'no-show' ? 'Nedorazil' : 'Zrušeno'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={styles.section}>
            <div className={styles.field}>
              <label>Poznámky</label>
              <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} placeholder="Poznámky…" />
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Zrušit</button>
            <button type="submit" className={styles.saveBtn} disabled={submitting}>{submitting ? 'Ukládám…' : isEdit ? 'Uložit změny' : 'Vytvořit rezervaci'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
