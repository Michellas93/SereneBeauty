import { useState } from 'react';
import { useData } from '../context/DataContext';
import BookingModal from '../components/BookingModal';
import { timeToMin } from '../../utils/bookingConflict';
import styles from './SchedulePage.module.css';

const TIMES = [
  '09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30',
  '13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30',
  '17:00','17:30','18:00','18:30','19:00','19:30',
];

const DAY_NAMES = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

const STATUS_COLORS = {
  confirmed: { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af' },
  completed: { bg: '#dcfce7', border: '#86efac', text: '#166534' },
  cancelled: { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' },
  'no-show':  { bg: '#fef9c3', border: '#fde047', text: '#854d0e' },
};

function getStatusStyle(status) {
  return STATUS_COLORS[status] ?? STATUS_COLORS.confirmed;
}

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatHeader(date) {
  return date.toLocaleDateString('cs-CZ', { month: 'short', day: 'numeric' });
}

function isToday(date) {
  return toDateStr(date) === toDateStr(new Date());
}

export default function SchedulePage() {
  const { bookings, stylists, services, absences, updateBooking } = useData();
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [modal, setModal] = useState(null);
  const [view, setView] = useState('week');
  const [selectedDay, setSelectedDay] = useState(() => toDateStr(new Date()));
  const [stylistFilter, setStylistFilter] = useState('all');

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const prevWeek = () => setWeekStart((w) => addDays(w, -7));
  const nextWeek = () => setWeekStart((w) => addDays(w, 7));
  const goToday = () => { setWeekStart(getMonday(new Date())); setSelectedDay(toDateStr(new Date())); };

  const filterByStylist = (list) =>
    stylistFilter === 'all' ? list : list.filter((b) => b.stylistId === stylistFilter);

  const isVisibleStatus = (s) => s === 'confirmed' || s === 'completed' || s === 'cancelled' || s === 'no-show';

  const getBookingsAt = (dateStr, time) => {
    const slotMin = timeToMin(time);
    return filterByStylist(
      bookings.filter((b) => {
        if (b.date !== dateStr || !isVisibleStatus(b.status)) return false;
        const bMin = timeToMin(b.time);
        return bMin >= slotMin && bMin < slotMin + 30;
      })
    );
  };

  const getDayBookings = (dateStr) =>
    filterByStylist(bookings.filter((b) => b.date === dateStr && isVisibleStatus(b.status)))
      .sort((a, b) => a.time.localeCompare(b.time));

  const getServiceNames = (ids) =>
    ids.map((id) => services.find((s) => s.id === id)?.name).filter(Boolean).join(', ');

  const getStylistName = (id) => stylists.find((s) => s.id === id)?.name || id;

  const getAbsencesOn = (ds) =>
    absences
      .filter(a => {
        if (stylistFilter !== 'all' && a.stylistId !== stylistFilter) return false;
        if (a.dateFrom && a.dateTo) return a.dateFrom <= ds && ds <= a.dateTo;
        return a.date === ds;
      })
      .map(a => ({ ...a, stylistName: getStylistName(a.stylistId) }));

  const isBlockedDay = (ds) => {
    if (stylistFilter === 'all') return false;
    return absences.some(a => {
      if (a.stylistId !== stylistFilter || a.isFullDay === false) return false;
      if (a.dateFrom && a.dateTo) return a.dateFrom <= ds && ds <= a.dateTo;
      return a.date === ds;
    });
  };

  const statusBadge = (status) => {
    if (status === 'confirmed') return styles.badgeConfirmed;
    if (status === 'completed') return styles.badgeCompleted;
    return styles.badgeCancelled;
  };

  const weekLabel = `${formatHeader(weekStart)} – ${formatHeader(addDays(weekStart, 6))}`;

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.left}>
          <h1 className={styles.title}>Rozvrh</h1>
          <div className={styles.viewToggle}>
            <button className={`${styles.viewBtn} ${view === 'week' ? styles.viewActive : ''}`} onClick={() => setView('week')}>Týden</button>
            <button className={`${styles.viewBtn} ${view === 'day' ? styles.viewActive : ''}`} onClick={() => setView('day')}>Den</button>
          </div>
        </div>
        <div className={styles.right}>
          <div className={styles.selectWrap}>
            <select
              className={styles.stylistSelect}
              value={stylistFilter}
              onChange={(e) => setStylistFilter(e.target.value)}
            >
              <option value="all">Všichni kadeřníci</option>
              {stylists.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <svg className={styles.selectArrow} width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1l5 5 5-5" stroke="#737373" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
          <div className={styles.navGroup}>
            <button className={styles.navBtn} onClick={prevWeek}>‹</button>
            <span className={styles.weekLabel}>{weekLabel}</span>
            <button className={styles.navBtn} onClick={nextWeek}>›</button>
          </div>
          <button className={styles.todayBtn} onClick={goToday}>Dnes</button>
          <button className={styles.addBtn} onClick={() => setModal({ type: 'new' })}>+ Nová rezervace</button>
        </div>
      </div>

      {view === 'week' ? (
        <div className={styles.calendarWrap}>
          <div className={styles.calendar}>
            <div className={styles.timeGutter} />
            {weekDays.map((day) => {
              const ds = toDateStr(day);
              const dayAbsences = getAbsencesOn(ds);
              return (
                <div key={ds} className={`${styles.dayHeader} ${isToday(day) ? styles.todayHeader : day.getDay() === 0 || day.getDay() === 6 ? styles.weekendHeader : ''} ${dayAbsences.length > 0 ? styles.dayHeaderAbsent : ''}`}>
                  <span className={styles.dayName}>{DAY_NAMES[weekDays.indexOf(day)]}</span>
                  <span className={`${styles.dayNum} ${isToday(day) ? styles.todayNum : day.getDay() === 0 || day.getDay() === 6 ? styles.weekendNum : ''}`}>
                    {day.getDate()}
                  </span>
                  {dayAbsences.map(a => (
                    <span key={a.id} className={styles.absencePill}>
                      {a.stylistName} · {a.reason}
                      {a.isFullDay === false && a.startTime ? ` ${a.startTime}–${a.endTime}` : ''}
                    </span>
                  ))}
                </div>
              );
            })}

            {TIMES.map((time) => (
              <div key={time} className={styles.timeRow}>
                <div className={styles.timeLabel}>{time}</div>
                {weekDays.map((day) => {
                  const dateStr = toDateStr(day);
                  const slotBookings = getBookingsAt(dateStr, time);
                  const blocked = isBlockedDay(dateStr);
                  return (
                    <div
                      key={dateStr}
                      className={`${styles.cell} ${isToday(day) ? styles.todayCol : day.getDay() === 0 || day.getDay() === 6 ? styles.weekendCol : ''} ${blocked ? styles.cellBlocked : ''}`}
                      onClick={blocked ? undefined : () => setModal({ type: 'new', defaultDate: dateStr, defaultTime: time })}
                    >
                      {slotBookings.map((b) => {
                        const sc = getStatusStyle(b.status);
                        return (
                          <div
                            key={b.id}
                            className={`${styles.bookingCard} ${b.status === 'cancelled' ? styles.bookingCardCancelled : ''}`}
                            style={{ background: sc.bg, borderLeft: `3px solid ${sc.border}`, color: sc.text }}
                            onClick={(e) => { e.stopPropagation(); setModal({ type: 'edit', booking: b }); }}
                          >
                            <span className={styles.cardClient}>{b.clientName}</span>
                            <span className={styles.cardService}>{getStylistName(b.stylistId)}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className={styles.legend}>
            {[
              { key: 'confirmed', label: 'Potvrzeno' },
              { key: 'completed', label: 'Dokončeno' },
              { key: 'no-show',   label: 'Nedorazil' },
              { key: 'cancelled', label: 'Zrušeno' },
            ].map(({ key, label }) => {
              const sc = getStatusStyle(key);
              return (
                <div key={key} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: sc.bg, border: `2px solid ${sc.border}` }} />
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={styles.dayView}>
          <div className={styles.dayPicker}>
            {weekDays.map((day) => {
              const ds = toDateStr(day);
              return (
                <button
                  key={ds}
                  className={`${styles.dayTab} ${selectedDay === ds ? styles.dayTabActive : ''} ${isToday(day) ? styles.dayTabToday : ''}`}
                  onClick={() => setSelectedDay(ds)}
                >
                  <span className={styles.dayTabName}>{DAY_NAMES[weekDays.indexOf(day)]}</span>
                  <span className={styles.dayTabNum}>{day.getDate()}</span>
                </button>
              );
            })}
          </div>
          <div className={styles.dayList}>
            {getAbsencesOn(selectedDay).map(a => (
              <div key={a.id} className={styles.dayAbsenceRow}>
                <span className={styles.dayAbsenceIcon}>🏖</span>
                <div className={styles.dayAbsenceInfo}>
                  <span className={styles.dayAbsenceName}>{a.stylistName}</span>
                  <span className={styles.dayAbsenceReason}>{a.reason}{a.isFullDay === false && a.startTime ? ` · ${a.startTime}–${a.endTime}` : ' · Celý den'}</span>
                </div>
              </div>
            ))}
            {getDayBookings(selectedDay).length === 0 ? (
              <div className={styles.empty}>Pro tento den nejsou žádné rezervace.</div>
            ) : (
              getDayBookings(selectedDay).map((b) => {
                const sc = getStatusStyle(b.status);
                return (
                <div key={b.id} className={styles.dayItem} style={{ borderLeft: `4px solid ${sc.border}`, background: sc.bg }}>
                  <span className={styles.dayTime}>{b.time}</span>
                  <div className={styles.dayInfo}>
                    <span className={styles.dayClient}>{b.clientName}</span>
                    <span className={styles.dayService}>{getServiceNames(b.serviceIds)} · {getStylistName(b.stylistId)}</span>
                  </div>
                  <div className={styles.dayActions}>
                    <span className={`${styles.badge} ${statusBadge(b.status)}`}>
                      {b.status === 'confirmed' ? 'potvrzeno' : b.status === 'completed' ? 'dokončeno' : b.status === 'no-show' ? 'nedorazil' : 'zrušeno'}
                    </span>
                    {b.status === 'confirmed' && (
                      <button className={styles.completeBtn} onClick={() => updateBooking(b.id, { status: 'completed' })}>✓ Hotovo</button>
                    )}
                    <button className={styles.editBtn} onClick={() => setModal({ type: 'edit', booking: b })}>Upravit</button>
                  </div>
                </div>
                );
              })
            )}
            <button className={styles.addDayBtn} onClick={() => setModal({ type: 'new', defaultDate: selectedDay })}>
              + Přidat rezervaci na tento den
            </button>
          </div>
        </div>
      )}

      {modal?.type === 'new' && (
        <BookingModal
          defaultDate={modal.defaultDate}
          defaultTime={modal.defaultTime}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'edit' && (
        <BookingModal
          booking={modal.booking}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
