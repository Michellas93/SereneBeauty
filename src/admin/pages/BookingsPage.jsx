import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import BookingModal from '../components/BookingModal';
import styles from './BookingsPage.module.css';

const STATUS_OPTS = [
  { value: 'active', label: 'Aktivní (bez zrušených)' },
  { value: 'all', label: 'Všechny stavy' },
  { value: 'confirmed', label: 'Potvrzené' },
  { value: 'completed', label: 'Dokončené' },
  { value: 'no-show', label: 'Nedorazil' },
  { value: 'cancelled', label: 'Zrušené' },
];

export default function BookingsPage() {
  const { bookings, stylists, services, updateBooking, deleteBooking } = useData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [stylistFilter, setStylistFilter] = useState('all');
  const [sortDir, setSortDir] = useState('desc');
  const [modal, setModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const getServiceNames = (ids) =>
    ids.map((id) => services.find((s) => s.id === id)?.name).filter(Boolean).join(', ');

  const getStylistName = (id) => stylists.find((s) => s.id === id)?.name || id;

  const filtered = useMemo(() => {
    let list = [...bookings];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((b) =>
        b.clientName.toLowerCase().includes(q) ||
        b.clientEmail.toLowerCase().includes(q) ||
        b.clientPhone.includes(q)
      );
    }
    if (statusFilter === 'active') list = list.filter((b) => b.status !== 'cancelled');
    else if (statusFilter !== 'all') list = list.filter((b) => b.status === statusFilter);
    if (stylistFilter !== 'all') list = list.filter((b) => b.stylistId === stylistFilter);
    list.sort((a, b) => {
      const cmp = a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [bookings, search, statusFilter, stylistFilter, sortDir]);

  const handleDelete = (id) => {
    deleteBooking(id);
    setConfirmDelete(null);
  };

  const statusClass = (s) => {
    if (s === 'confirmed') return styles.confirmed;
    if (s === 'completed') return styles.completed;
    if (s === 'no-show') return styles.noShow;
    return styles.cancelled;
  };

  const formatDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}.${m}.${y}`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h1 className={styles.title}>Rezervace</h1>
        <button className={styles.addBtn} onClick={() => setModal({ type: 'new' })}>+ Nová rezervace</button>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className={styles.search}
            placeholder="Hledat podle jména, e-mailu, telefonu…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.selectWrap}>
          <select className={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_OPTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <svg className={styles.selectArrow} width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1l5 5 5-5" stroke="#737373" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>

        <div className={styles.selectWrap}>
          <select className={styles.select} value={stylistFilter} onChange={(e) => setStylistFilter(e.target.value)}>
            <option value="all">Všichni kadeřníci</option>
            {stylists.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <svg className={styles.selectArrow} width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1l5 5 5-5" stroke="#737373" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>

        <button
          className={styles.sortBtn}
          onClick={() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc')}
          title="Toggle sort direction"
        >
          {sortDir === 'desc' ? '↓ Nejnovější' : '↑ Nejstarší'}
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Klient</th>
              <th>Datum a čas</th>
              <th>Kadeřník</th>
              <th>Služby</th>
              <th>Celkem</th>
              <th>Stav</th>
              <th>Akce</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className={styles.empty}>Žádné rezervace nenalezeny.</td></tr>
            )}
            {filtered.map((b) => (
              <tr key={b.id} className={b.status === 'cancelled' ? styles.rowCancelled : ''}>
                <td>
                  <div className={styles.clientName}>{b.clientName}</div>
                  <div className={styles.clientSub}>{b.clientPhone}</div>
                </td>
                <td>
                  <div className={styles.dateVal}>{formatDate(b.date)}</div>
                  <div className={styles.timeVal}>{b.time}</div>
                </td>
                <td className={styles.stylistCell}>{getStylistName(b.stylistId)}</td>
                <td className={styles.serviceCell}>{getServiceNames(b.serviceIds)}</td>
                <td className={styles.priceCell}>{b.totalPrice ? `${b.totalPrice} Kč` : '—'}</td>
                <td>
                  <span className={`${styles.badge} ${statusClass(b.status)}`}>
                    {b.status === 'confirmed' ? 'potvrzeno'
                      : b.status === 'completed' ? 'dokončeno'
                      : b.status === 'no-show' ? 'nedorazil'
                      : 'zrušeno'}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    {b.status === 'confirmed' && (
                      <button
                        className={styles.actionComplete}
                        onClick={() => updateBooking(b.id, { status: 'completed' })}
                        title="Dokončit"
                      >✓</button>
                    )}
                    {b.status === 'confirmed' && (
                      <button
                        className={styles.actionNoShow}
                        onClick={() => updateBooking(b.id, { status: 'no-show' })}
                        title="Zákazník nedorazil"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="8" r="4"/>
                          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                          <line x1="17" y1="3" x2="21" y2="7"/>
                          <line x1="21" y1="3" x2="17" y2="7"/>
                        </svg>
                      </button>
                    )}
                    {b.status === 'confirmed' && (
                      <button
                        className={styles.actionCancel}
                        onClick={() => updateBooking(b.id, { status: 'cancelled' })}
                        title="Zrušit"
                      >✕</button>
                    )}
                    <button
                      className={styles.actionEdit}
                      onClick={() => setModal({ type: 'edit', booking: b })}
                      title="Edit"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button
                      className={styles.actionDelete}
                      onClick={() => setConfirmDelete(b.id)}
                      title="Delete"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                        <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={styles.count}>Zobrazeno {filtered.length} rezervací</p>

      {modal?.type === 'new' && <BookingModal onClose={() => setModal(null)} />}
      {modal?.type === 'edit' && <BookingModal booking={modal.booking} onClose={() => setModal(null)} />}

      {confirmDelete && (
        <div className={styles.confirmOverlay} onClick={() => setConfirmDelete(null)}>
          <div className={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
            <h3>Smazat rezervaci</h3>
            <p>Opravdu chcete smazat? Tuto akci nelze vrátit.</p>
            <div className={styles.confirmActions}>
              <button className={styles.confirmCancel} onClick={() => setConfirmDelete(null)}>Zrušit</button>
              <button className={styles.confirmDelete} onClick={() => handleDelete(confirmDelete)}>Smazat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
