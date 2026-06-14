import { useState } from 'react';
import { z } from 'zod';
import { useData } from '../../admin/context/DataContext';
import { SlotConflictError } from '../../utils/bookingConflict';
import StepHeader from './StepHeader';
import styles from './StepConfirm.module.css';

const schema = z.object({
  name: z.string().min(5, 'Zadejte celé jméno (min. 5 znaků)'),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-]{9,15}$/, 'Zadejte platné telefonní číslo (např. +420 601 000 000)'),
  email: z.string().email('Zadejte platnou e-mailovou adresu'),
});

export default function StepConfirm({ booking, update, onBack, onHome, step, totalSteps }) {
  const { services, stylists, addBooking, settings } = useData();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  const selectedServices = services.filter(s => booking.services.includes(s.id));
  const stylist = stylists.find(s => s.id === booking.stylist);
  const total = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);

  const totalDuration = selectedServices.reduce((sum, s) => sum + (s.durationMin ?? 30), 0);
  const formatDuration = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} min`;
    return m === 0 ? `${h} h` : `${h} h ${m} min`;
  };

  const validate = (data) => {
    const result = schema.safeParse(data);
    if (result.success) return {};
    return Object.fromEntries(
      result.error.issues.map(i => [i.path[0], i.message])
    );
  };

  const handleBlur = (field) => {
    setTouched(t => ({ ...t, [field]: true }));
    const errors = validate({ name: booking.name, phone: booking.phone, email: booking.email });
    setFieldErrors(errors);
  };

  const handleChange = (field, value) => {
    update({ [field]: value });
    if (touched[field]) {
      const errors = validate({ name: booking.name, phone: booking.phone, email: booking.email, [field]: value });
      setFieldErrors(errors);
    }
  };

  const handleSubmit = async () => {
    const allTouched = { name: true, phone: true, email: true };
    setTouched(allTouched);
    const errors = validate({ name: booking.name, phone: booking.phone, email: booking.email });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    setSubmitError('');
    try {
      await addBooking({
        clientName: booking.name,
        clientPhone: booking.phone,
        clientEmail: booking.email,
        stylistId: booking.stylist === 'no-preference' ? '' : (booking.stylist || ''),
        serviceIds: booking.services,
        date: booking.date
          ? `${booking.date.getFullYear()}-${String(booking.date.getMonth() + 1).padStart(2, '0')}-${String(booking.date.getDate()).padStart(2, '0')}`
          : '',
        time: booking.time || '09:00',
        totalPrice: total,
        notes: '',
      });
      console.log('[MOCK EMAIL] Potvrzení rezervace odesláno na:', booking.email);
      setSubmitted(true);
    } catch (err) {
      if (err instanceof SlotConflictError) {
        setSubmitError('Tento termín byl mezitím obsazen. Vraťte se prosím zpět a vyberte jiný čas.');
      } else {
        setSubmitError('Nepodařilo se uložit rezervaci. Zkuste to prosím znovu.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className={styles.success}>
        <div className={styles.successIcon}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2>Rezervace potvrzena!</h2>
        <p>Potvrzení pošleme na <strong>{booking.email}</strong>. Brzy se uvidíme!</p>
        <p className={styles.changeNote}>
          Pokud budete chtít termín zrušit nebo přesunout, napište nám na{' '}
          <a href={`mailto:${settings?.email}`}>{settings?.email}</a>{' '}
          nebo zavolejte na <a href={`tel:${settings?.phone?.replace(/\s/g, '')}`}>{settings?.phone}</a>.
        </p>
        <a href="/" className={styles.homeBtn}>Zpět na hlavní stránku</a>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <StepHeader step={step} total={totalSteps} title="Potvrdit rezervaci" onBack={onBack} onHome={onHome} />

      <div className={styles.summary}>
        <h3 className={styles.summaryTitle}>Shrnutí rezervace</h3>

        <div className={styles.summaryRow}>
          <span className={styles.label}>Služby</span>
          <div className={styles.serviceList}>
            {selectedServices.map(s => (
              <div key={s.id} className={styles.serviceItem}>
                <span>{s.name}</span>
                <span>{s.price ? `od ${s.price.toLocaleString('cs-CZ')} Kč` : 'Na dotaz'}</span>
              </div>
            ))}
          </div>
        </div>

        {booking.date && (
          <div className={styles.summaryRow}>
            <span className={styles.label}>Datum a čas</span>
            <span className={styles.value}>
              {booking.date.toLocaleDateString('cs-CZ', { weekday: 'long', month: 'long', day: 'numeric' })}
              {booking.time && ` v ${booking.time}`}
            </span>
          </div>
        )}

        {totalDuration > 0 && (
          <div className={styles.summaryRow}>
            <span className={styles.label}>Přibližná délka</span>
            <span className={styles.value}>~ {formatDuration(totalDuration)}</span>
          </div>
        )}

        {stylist && (
          <div className={styles.summaryRow}>
            <span className={styles.label}>Kadeřník</span>
            <span className={styles.value}>{stylist.name}</span>
          </div>
        )}

        {total > 0 && (
          <div className={`${styles.summaryRow} ${styles.totalRow}`}>
            <span className={styles.label}>Celkem</span>
            <span className={styles.totalValue}>od {total.toLocaleString('cs-CZ')} Kč</span>
          </div>
        )}
      </div>

      <div className={styles.form}>
        <h3 className={styles.formTitle}>Vaše údaje</h3>

        {[
          { field: 'name',  label: 'Celé jméno',       type: 'text',  placeholder: 'Jana Nováková' },
          { field: 'phone', label: 'Telefonní číslo',   type: 'tel',   placeholder: '+420 601 000 000' },
          { field: 'email', label: 'E-mailová adresa',  type: 'email', placeholder: 'jana@email.cz' },
        ].map(({ field, label, type, placeholder }) => (
          <div key={field} className={styles.field}>
            <label>{label} <span className={styles.required}>*</span></label>
            <input
              type={type}
              placeholder={placeholder}
              value={booking[field] ?? ''}
              onChange={e => handleChange(field, e.target.value)}
              onBlur={() => handleBlur(field)}
              className={touched[field] && fieldErrors[field] ? styles.inputError : ''}
            />
            {touched[field] && fieldErrors[field] && (
              <span className={styles.fieldError}>{fieldErrors[field]}</span>
            )}
          </div>
        ))}
      </div>

      {submitError && <p className={styles.error}>{submitError}</p>}

      <div className={styles.footer}>
        <p className={styles.note}>Uvedená délka i cena jsou pouze orientační a mohou se lišit podle délky vlasů a zvolené procedury. Platba není nyní požadována — finální cena bude potvrzena v salónu.</p>
        <button
          className={styles.confirmBtn}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Rezervuji…' : 'Potvrdit rezervaci'}
        </button>
      </div>
    </div>
  );
}
