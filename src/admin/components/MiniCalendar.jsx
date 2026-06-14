import { useState } from 'react';
import { MONTHS, DAYS } from '../../utils/dateConstants';
import styles from '../pages/ManagePage.module.css';

export default function MiniCalendar({ value, onChange, minDateStr }) {
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstCol = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const minDate = minDateStr
    ? new Date(minDateStr + 'T00:00:00')
    : new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isPast = (d) => new Date(viewYear, viewMonth, d) < minDate;
  const toStr = (d) => `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const prevMonth = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y-1)) : setViewMonth(m => m-1);
  const nextMonth = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y+1)) : setViewMonth(m => m+1);
  const displayLabel = value ? value.split('-').reverse().join('.') : 'Vyberte datum…';

  return (
    <div className={styles.calPickerWrap}>
      <button type="button" className={`${styles.absenceSelectLg} ${styles.calPickerBtn}`} onClick={() => setOpen(o => !o)}>
        <span style={{ color: value ? '#0a0a0a' : '#a3a3a3' }}>{displayLabel}</span>
      </button>
      {open && (
        <div className={styles.calPickerDropdown}>
          <div className={styles.miniCalNav}>
            <button type="button" onClick={prevMonth} className={styles.miniCalNavBtn}>‹</button>
            <span className={styles.miniCalMonth}>{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth} className={styles.miniCalNavBtn}>›</button>
          </div>
          <div className={styles.miniCalGrid}>
            {DAYS.map(d => <div key={d} className={styles.miniCalDayLabel}>{d}</div>)}
            {Array.from({ length: firstCol }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const str = toStr(day);
              const past = isPast(day);
              const sel = value === str;
              const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
              return (
                <button key={day} type="button"
                  className={`${styles.miniCalDay} ${sel ? styles.miniCalDaySel : ''} ${past ? styles.miniCalDayPast : ''} ${isToday && !sel ? styles.miniCalDayToday : ''}`}
                  onClick={() => { if (!past) { onChange(str); setOpen(false); } }}
                  disabled={past}
                >{day}</button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
