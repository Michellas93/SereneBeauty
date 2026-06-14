import { useState, useEffect } from 'react';
import { useData } from '../../admin/context/DataContext';
import { timeToMin } from '../../utils/bookingConflict';
import StepHeader from './StepHeader';
import styles from './StepSelectDateTime.module.css';

const MONTHS = ['Leden','Únor','Březen','Duben','Květen','Červen','Červenec','Srpen','Září','Říjen','Listopad','Prosinec'];
const DAYS = ['PO', 'ÚT', 'ST', 'ČT', 'PÁ', 'SO', 'NE'];
const DAY_NAMES = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];

const FALLBACK_SCHEDULE = { workingDays: [1,2,3,4,5,6], startTime: '09:00', endTime: '20:00' };

function minToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const PERIOD_LABELS = { morning: 'Dopoledne', afternoon: 'Odpoledne', evening: 'Večer' };

function generateSlots(schedule, totalDuration) {
  const start = timeToMin(schedule.startTime);
  const end = timeToMin(schedule.endTime);
  const groups = { morning: [], afternoon: [], evening: [] };
  for (let t = start; t + totalDuration <= end; t += 15) {
    const label = minToTime(t);
    if (t < 12 * 60) groups.morning.push(label);
    else if (t < 17 * 60) groups.afternoon.push(label);
    else groups.evening.push(label);
  }
  return groups;
}

export default function StepSelectDateTime({ booking, update, onNext, onBack, onHome, step, totalSteps }) {
  const { stylists, services, absences, bookings, settings } = useData();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const stylist = booking.stylist && booking.stylist !== 'no-preference'
    ? stylists.find(s => s.id === booking.stylist)
    : null;
  const salonSchedule = settings?.schedule ?? FALLBACK_SCHEDULE;
  const schedule = stylist?.schedule ?? salonSchedule;

  const totalDuration = services
    .filter(s => booking.services.includes(s.id))
    .reduce((sum, s) => sum + (s.durationMin ?? 30), 0) || 30;

  const slots = generateSlots(schedule, totalDuration);
  const hasSlots = Object.values(slots).some(arr => arr.length > 0);

  const dateStr = booking.date
    ? `${booking.date.getFullYear()}-${String(booking.date.getMonth() + 1).padStart(2, '0')}-${String(booking.date.getDate()).padStart(2, '0')}`
    : null;
  const bookedIntervals = (stylist && dateStr)
    ? bookings
        .filter(b => b.stylistId === stylist.id && b.date === dateStr && b.status !== 'cancelled')
        .map(b => {
          const start = timeToMin(b.time);
          const dur = services
            .filter(s => (b.serviceIds || []).includes(s.id))
            .reduce((sum, s) => sum + (s.durationMin ?? 30), 0) || 30;
          return [start, start + dur];
        })
    : [];

  const partialAbsenceIntervals = (stylist && dateStr)
    ? (absences ?? [])
        .filter(a => {
          if (a.stylistId !== stylist.id || a.isFullDay !== false || !a.startTime || !a.endTime) return false;
          if (a.dateFrom && a.dateTo) return a.dateFrom <= dateStr && dateStr <= a.dateTo;
          return a.date === dateStr;
        })
        .map(a => [timeToMin(a.startTime), timeToMin(a.endTime)])
    : [];

  const isSlotTaken = (slotLabel) => {
    const start = timeToMin(slotLabel);
    const end = start + totalDuration;
    const bookedConflict = bookedIntervals.some(([bStart, bEnd]) => start < bEnd && bStart < end);
    const absenceConflict = partialAbsenceIntervals.some(([aStart, aEnd]) => start < aEnd && aStart < end);
    return bookedConflict || absenceConflict;
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstCol = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;

  const isPast = (day) =>
    new Date(viewYear, viewMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const isWorkingDay = (day) => {
    const jsDay = new Date(viewYear, viewMonth, day).getDay();
    return schedule.workingDays.includes(jsDay);
  };

  const selDay = booking.date &&
    booking.date.getFullYear() === viewYear &&
    booking.date.getMonth() === viewMonth
    ? booking.date.getDate()
    : null;

  const canGoPrev = !(viewYear === today.getFullYear() && viewMonth === today.getMonth());

  useEffect(() => {
    if (booking.date) return;
    for (let offset = 0; offset < 60; offset++) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
      const jsDay = d.getDay();
      if (!schedule.workingDays.includes(jsDay)) continue;
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (isDayUnavailable(ds)) continue;
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      update({ date: d, time: null });
      break;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prevMonth = () => {
    if (!canGoPrev) return;
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const isSelectedToday = booking.date &&
    booking.date.getFullYear() === today.getFullYear() &&
    booking.date.getMonth() === today.getMonth() &&
    booking.date.getDate() === today.getDate();

  const isPastSlot = (slotLabel) => {
    if (!isSelectedToday) return false;
    const [h, m] = slotLabel.split(':').map(Number);
    const nowMins = today.getHours() * 60 + today.getMinutes();
    return (h * 60 + m) < nowMins;
  };

  const isFullDayAbsentOn = (stylistId, ds) => absences?.some(a => {
    if (a.stylistId !== stylistId || a.isFullDay === false) return false;
    if (a.dateFrom && a.dateTo) return a.dateFrom <= ds && ds <= a.dateTo;
    return a.date === ds;
  }) ?? false;

  const isDayUnavailable = (ds) => {
    if (booking.stylist !== 'no-preference') return isFullDayAbsentOn(booking.stylist, ds);
    const jsDay = new Date(ds + 'T00:00:00').getDay();
    const selectedSlugs = services
      .filter(s => booking.services.includes(s.id))
      .map(s => s.slug)
      .filter(Boolean);
    return !stylists.some(s => {
      if (s.cannotDo?.some(slug => selectedSlugs.includes(slug))) return false;
      const sched = s.schedule ?? salonSchedule;
      if (!sched.workingDays.includes(jsDay)) return false;
      return !isFullDayAbsentOn(s.id, ds);
    });
  };

  const selectDay = (day) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (isPast(day) || !isWorkingDay(day) || isDayUnavailable(dateStr)) return;
    update({ date: new Date(viewYear, viewMonth, day), time: null });
  };

  const workingDaysLabel = schedule.workingDays.map(d => DAY_NAMES[d]).join(', ');

  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const monthStart = `${monthPrefix}-01`;
  const monthEnd = `${monthPrefix}-31`;
  const hasAbsenceThisMonth = !!stylist && (absences?.some(a => {
    if (a.stylistId !== stylist.id || a.isFullDay === false) return false;
    if (a.dateFrom && a.dateTo) return a.dateFrom <= monthEnd && a.dateTo >= monthStart;
    return a.date?.startsWith(monthPrefix);
  }) ?? false);

  return (
    <div className={styles.page}>
      <StepHeader
        step={step}
        total={totalSteps}
        title="Vyberte termín"
        subtitle="Najděte čas, který vám vyhovuje."
        onBack={onBack}
        onHome={onHome}
      />

      <div className={styles.calendar}>
        <div className={styles.calNav}>
          <button onClick={prevMonth} className={styles.navBtn} disabled={!canGoPrev}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <span className={styles.monthLabel}>{MONTHS[viewMonth]} {viewYear}</span>
          <button onClick={nextMonth} className={styles.navBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>

        <div className={styles.grid}>
          {DAYS.map(d => <div key={d} className={styles.dayLabel}>{d}</div>)}
          {Array.from({ length: firstCol }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isAbsent = isDayUnavailable(dateStr);
            const disabled = isPast(day) || !isWorkingDay(day) || isAbsent;
            const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
            const isSel = day === selDay;
            return (
              <button
                key={day}
                className={`${styles.dayBtn} ${isToday ? styles.today : ''} ${isSel ? styles.selected : ''} ${disabled ? styles.dayDisabled : ''} ${isAbsent ? styles.dayAbsent : ''}`}
                onClick={() => selectDay(day)}
                disabled={disabled}
                title={isAbsent ? `${stylist?.name ?? 'Kadeřník'} má v tento den volno` : undefined}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className={styles.availNote}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <strong>{stylist ? stylist.name : 'Jakýkoli kadeřník'}</strong>
            <p>Pracovní dny: {workingDaysLabel} · {schedule.startTime}–{schedule.endTime}</p>
          </div>
        </div>

        {hasAbsenceThisMonth && (
          <div className={styles.absenceLegend}>
            <span className={styles.absenceDot} />
            V označené dny {stylist.name} nepřijímá objednávky.
          </div>
        )}
      </div>

      {booking.date && hasSlots ? (
        <div className={styles.times}>
          <h3 className={styles.timesTitle}>Dostupné časy</h3>
          {Object.entries(slots).map(([period, list]) =>
            list.length > 0 && (
              <div key={period}>
                <div className={styles.periodLabel}>{PERIOD_LABELS[period]}</div>
                <div className={styles.slotsGrid}>
                  {list.map(t => {
                    const taken = isSlotTaken(t);
                    const past = isPastSlot(t);
                    const disabledSlot = taken || past;
                    return (
                      <button
                        key={t}
                        className={`${styles.slot} ${booking.time === t ? styles.slotSelected : ''} ${taken ? styles.slotTaken : ''} ${past ? styles.slotPast : ''}`}
                        onClick={() => update({ time: t })}
                        disabled={disabledSlot}
                        title={taken ? 'Tento čas je již obsazený' : past ? 'Tento čas již uplynul' : undefined}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </div>
      ) : booking.date ? (
        <p className={styles.noSlots}>Pro tento den nejsou dostupné žádné termíny.</p>
      ) : null}

      <div className={styles.footer}>
        <button className={styles.nextBtn} onClick={onNext} disabled={!booking.time}>
          Další krok
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
