import { useState, useRef } from 'react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useData } from '../context/DataContext';
import { storage } from '../../firebase/config';
import StylistIcon from '../../components/StylistIcon';
import MiniCalendar from '../components/MiniCalendar';
import { ABSENCE_REASONS as REASONS, ABSENCE_REASON_CLASS as REASON_CLASS } from '../../utils/dateConstants';
import { getAbsenceStartDate as getStartDate, getAbsenceEndDate as getEndDate, formatAbsenceDate } from '../../utils/absenceUtils';
import styles from './ManagePage.module.css';

const CATEGORIES = ['haircuts', 'coloring', 'treatment', 'styling', 'other'];
const CATEGORY_LABELS = { haircuts: 'Střihy', coloring: 'Barvení', treatment: 'Ošetření', styling: 'Styling', other: 'Ostatní' };

function AbsenceSection({ stylists, absences, addAbsence, deleteAbsence }) {
  const today = new Date().toISOString().split('T')[0];
  const [stylistId, setStylistId] = useState('');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('Dovolená');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!stylistId || !date) return;
    setSaving(true);
    await addAbsence({ stylistId, date, reason });
    setDate('');
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
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Přidat absenci</h2>
      </div>

      <div className={styles.absenceFormCard}>
        <div className={styles.absenceFormRow}>
          <div className={styles.absenceField}>
            <label className={styles.absenceLabel}>Kadeřník</label>
            <select className={styles.absenceSelectLg} value={stylistId} onChange={e => setStylistId(e.target.value)}>
              <option value="">Vyberte kadeřníka…</option>
              {stylists.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className={styles.absenceField}>
            <label className={styles.absenceLabel}>Datum</label>
            <MiniCalendar value={date} onChange={setDate} />
          </div>
        </div>
        <div className={styles.absenceField}>
          <label className={styles.absenceLabel}>Důvod</label>
          <div className={styles.reasonPills}>
            {REASONS.map(r => (
              <button
                key={r}
                type="button"
                className={`${styles.reasonPill} ${reason === r ? styles.reasonPillActive : ''}`}
                onClick={() => setReason(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <button
          className={styles.absenceAddBtn}
          onClick={handleAdd}
          disabled={!stylistId || !date || saving}
        >
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
                <span className={styles.absenceReason}>{a.reason}</span>
                <button className={styles.absenceDelBtn} onClick={() => deleteAbsence(a.id)}>✕</button>
              </div>
            ))}
          </div>
        </>
      )}

      {absences.length === 0 && (
        <p className={styles.empty}>Žádné absence zatím nezadány.</p>
      )}
    </div>
  );
}

const emptyStylist = { name: '', specialty: '', avatar: '', serviceIds: [] };
const emptyService = { name: '', duration: '', durationMin: '', price: '', description: '', category: 'haircuts' };

function StylistModal({ stylist, onClose, onSave, services }) {
  const [form, setForm] = useState(stylist ? { serviceIds: [], ...stylist } : { ...emptyStylist });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleService = (id) =>
    set('serviceIds', form.serviceIds.includes(id)
      ? form.serviceIds.filter((s) => s !== id)
      : [...form.serviceIds, id]
    );

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const sRef = storageRef(storage, `stylists/${Date.now()}_${file.name}`);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      set('avatar', url);
    } catch {
      alert('Nahrávání selhalo. Zkontrolujte Firebase Storage pravidla.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{stylist ? 'Upravit kadeřníka' : 'Nový kadeřník'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <form className={styles.modalBody} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Jméno *</label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Tereza Horáková" required />
          </div>
          <div className={styles.field}>
            <label>Popis / titul</label>
            <input value={form.specialty} onChange={(e) => set('specialty', e.target.value)} placeholder="Specialistka na barvení" />
          </div>
          <div className={styles.field}>
            <label>Fotografie</label>
            <div className={styles.avatarRow}>
              {form.avatar
                ? <img src={form.avatar} alt="" className={styles.avatarPreview} onError={(e) => (e.target.style.display = 'none')} />
                : <div className={styles.avatarPlaceholder}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
              }
              <div className={styles.avatarBtns}>
                <button type="button" className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? 'Nahrávám…' : 'Nahrát foto'}
                </button>
                {form.avatar && (
                  <button type="button" className={styles.removePicBtn} onClick={() => set('avatar', '')}>Odebrat</button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
            </div>
          </div>
          {services.length > 0 && (
            <div className={styles.field}>
              <label>Služby které umí</label>
              <div className={styles.serviceCheckGrid}>
                {services.map((s) => (
                  <label key={s.id} className={`${styles.serviceCheck} ${form.serviceIds.includes(s.id) ? styles.serviceCheckOn : ''}`}>
                    <input type="checkbox" checked={form.serviceIds.includes(s.id)} onChange={() => toggleService(s.id)} />
                    {s.name}
                  </label>
                ))}
              </div>
              {form.serviceIds.length === 0 && (
                <p className={styles.serviceCheckHint}>Pokud nevyberete nic, kadeřník se zobrazí pro všechny služby.</p>
              )}
            </div>
          )}
          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Zrušit</button>
            <button type="submit" className={styles.saveBtn} disabled={uploading}>
              {stylist ? 'Uložit' : 'Přidat kadeřníka'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ServiceModal({ service, onClose, onSave }) {
  const [form, setForm] = useState(service ? { ...service, price: service.price ?? '' } : { ...emptyService });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const price = form.price === '' ? null : Number(form.price);
    const durationMin = form.durationMin === '' ? null : Number(form.durationMin);
    onSave({ ...form, price, durationMin });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{service ? 'Upravit službu' : 'Nová služba'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <form className={styles.modalBody} onSubmit={handleSubmit}>
          <div className={styles.row2}>
            <div className={styles.field}>
              <label>Název *</label>
              <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Melír" required />
            </div>
            <div className={styles.field}>
              <label>Kategorie</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
          </div>
          <div className={styles.row2}>
            <div className={styles.field}>
              <label>Trvání (zobrazit)</label>
              <input value={form.duration} onChange={(e) => set('duration', e.target.value)} placeholder="60 – 90 min" />
            </div>
            <div className={styles.field}>
              <label>Trvání v minutách *</label>
              <input type="number" min="5" value={form.durationMin} onChange={(e) => set('durationMin', e.target.value ? Number(e.target.value) : '')} placeholder="60" />
            </div>
          </div>
          <div className={styles.row2}>
            <div className={styles.field}>
              <label>Cena (Kč)</label>
              <input type="number" min="0" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="Prázdné = na dotaz" />
            </div>
          </div>
          <div className={styles.field}>
            <label>Popis</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} placeholder="Popis služby…" />
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Zrušit</button>
            <button type="submit" className={styles.saveBtn}>{service ? 'Uložit' : 'Přidat službu'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ManagePage() {
  const { stylists, addStylist, updateStylist, deleteStylist, services, addService, updateService, deleteService, absences, addAbsence, deleteAbsence } = useData();
  const [tab, setTab] = useState('stylists');
  const [stylistModal, setStylistModal] = useState(null);
  const [serviceModal, setServiceModal] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const handleStylistSave = (form) => {
    if (stylistModal?.edit) updateStylist(stylistModal.edit.id, form);
    else addStylist(form);
  };

  const handleServiceSave = (form) => {
    if (serviceModal?.edit) updateService(serviceModal.edit.id, form);
    else addService(form);
  };

  const handleConfirmDel = () => {
    if (!confirmDel) return;
    if (confirmDel.type === 'stylist') deleteStylist(confirmDel.id);
    else deleteService(confirmDel.id);
    setConfirmDel(null);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingAbsenceCount = absences.filter(a => (a.dateTo ?? a.date ?? '') >= todayStr).length;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Správa</h1>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'stylists' ? styles.tabActive : ''}`} onClick={() => setTab('stylists')}>
          Kadeřníci ({stylists.length})
        </button>
        <button className={`${styles.tab} ${tab === 'services' ? styles.tabActive : ''}`} onClick={() => setTab('services')}>
          Služby ({services.length})
        </button>
        <button className={`${styles.tab} ${tab === 'absences' ? styles.tabActive : ''}`} onClick={() => setTab('absences')}>
          Absence {upcomingAbsenceCount > 0 && `(${upcomingAbsenceCount})`}
        </button>
      </div>

      {tab === 'stylists' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Kadeřníci</h2>
            <button className={styles.addBtn} onClick={() => setStylistModal({ edit: null })}>+ Přidat kadeřníka</button>
          </div>
          <div className={styles.grid}>
            {stylists.map((s) => (
              <div key={s.id} className={styles.card}>
                <div className={styles.cardAvatar}>
                  <StylistIcon specialty={s.specialty} size={26} />
                </div>
                <div className={styles.cardInfo}>
                  <div className={styles.cardName}>{s.name}</div>
                  <div className={styles.cardSub}>{s.specialty || 'Stylist'}</div>
                </div>
                <div className={styles.cardActions}>
                  <button className={styles.editBtn} onClick={() => setStylistModal({ edit: s })}>Upravit</button>
                  <button className={styles.delBtn} onClick={() => setConfirmDel({ type: 'stylist', id: s.id, name: s.name })}>Smazat</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'services' && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Služby</h2>
            <button className={styles.addBtn} onClick={() => setServiceModal({ edit: null })}>+ Přidat službu</button>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Název</th>
                  <th>Kategorie</th>
                  <th>Trvání</th>
                  <th>Cena</th>
                  <th>Popis</th>
                  <th>Akce</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id}>
                    <td className={styles.svcName}>{s.name}</td>
                    <td><span className={styles.catBadge}>{CATEGORY_LABELS[s.category] || s.category}</span></td>
                    <td className={styles.svcSub}>{s.duration || '—'}</td>
                    <td className={styles.svcPrice}>{s.price != null ? `${s.price} Kč` : 'Na dotaz'}</td>
                    <td className={styles.svcDesc}>{s.description}</td>
                    <td>
                      <div className={styles.cardActions}>
                        <button className={styles.editBtn} onClick={() => setServiceModal({ edit: s })}>Upravit</button>
                        <button className={styles.delBtn} onClick={() => setConfirmDel({ type: 'service', id: s.id, name: s.name })}>Smazat</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'absences' && (
        <AbsenceSection
          stylists={stylists}
          absences={absences}
          addAbsence={addAbsence}
          deleteAbsence={deleteAbsence}
        />
      )}

      {stylistModal && (
        <StylistModal
          stylist={stylistModal.edit}
          services={services}
          onClose={() => setStylistModal(null)}
          onSave={handleStylistSave}
        />
      )}

      {serviceModal && (
        <ServiceModal
          service={serviceModal.edit}
          onClose={() => setServiceModal(null)}
          onSave={handleServiceSave}
        />
      )}

      {confirmDel && (
        <div className={styles.overlay} onClick={() => setConfirmDel(null)}>
          <div className={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
            <h3>Smazat {confirmDel.type === 'stylist' ? 'kadeřníka' : 'službu'}</h3>
            <p>Smazat <strong>{confirmDel.name}</strong>? Tuto akci nelze vrátit.</p>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setConfirmDel(null)}>Zrušit</button>
              <button className={styles.deleteBtn} onClick={handleConfirmDel}>Smazat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
