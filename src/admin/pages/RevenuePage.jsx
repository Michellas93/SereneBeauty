import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import styles from './RevenuePage.module.css';

function getMonthStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(str) {
  const [y, m] = str.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' });
}

export default function RevenuePage() {
  const { bookings, stylists, services } = useData();

  const now = new Date();
  const thisMonth = getMonthStr(now);
  const lastMonth = getMonthStr(new Date(now.getFullYear(), now.getMonth() - 1));
  const twoMonthsAgo = getMonthStr(new Date(now.getFullYear(), now.getMonth() - 2));

  const completed = useMemo(() => bookings.filter((b) => b.status === 'completed'), [bookings]);
  const thisMonthCompleted = useMemo(() => completed.filter((b) => b.date.startsWith(thisMonth)), [completed, thisMonth]);
  const lastMonthCompleted = useMemo(() => completed.filter((b) => b.date.startsWith(lastMonth)), [completed, lastMonth]);
  const twoMonthsCompleted = useMemo(() => completed.filter((b) => b.date.startsWith(twoMonthsAgo)), [completed, twoMonthsAgo]);

  const totalRevenue = (list) => list.reduce((s, b) => s + (b.totalPrice || 0), 0);
  const avgRevenue = (list) => list.length ? Math.round(totalRevenue(list) / list.length) : 0;

  const thisMonthRevenue = totalRevenue(thisMonthCompleted);
  const lastMonthRevenue = totalRevenue(lastMonthCompleted);
  const twoRevenue = totalRevenue(twoMonthsCompleted);

  const revenueByMonth = [
    { label: monthLabel(twoMonthsAgo), revenue: twoRevenue, count: twoMonthsCompleted.length },
    { label: monthLabel(lastMonth), revenue: lastMonthRevenue, count: lastMonthCompleted.length },
    { label: monthLabel(thisMonth), revenue: thisMonthRevenue, count: thisMonthCompleted.length },
  ];
  const maxMonthRevenue = Math.max(...revenueByMonth.map((m) => m.revenue), 1);

  const revenueByStylists = useMemo(() =>
    stylists.map((s) => {
      const sb = completed.filter((b) => b.stylistId === s.id);
      return { name: s.name, revenue: totalRevenue(sb), count: sb.length };
    }).sort((a, b) => b.revenue - a.revenue),
    [completed, stylists]
  );
  const maxStylistRevenue = Math.max(...revenueByStylists.map((s) => s.revenue), 1);

  const revenueByServices = useMemo(() => {
    const map = {};
    completed.forEach((b) => {
      b.serviceIds.forEach((sid) => {
        const svc = services.find((s) => s.id === sid);
        if (!svc) return;
        if (!map[sid]) map[sid] = { name: svc.name, revenue: 0, count: 0 };
        map[sid].revenue += svc.price || 0;
        map[sid].count += 1;
      });
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [completed, services]);
  const maxServiceCount = Math.max(...revenueByServices.map((s) => s.count), 1);

  const recentCompleted = useMemo(() =>
    [...completed].sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)).slice(0, 8),
    [completed]
  );

  const formatDate = (str) => {
    const [y, m, d] = str.split('-');
    return `${d}.${m}.${y}`;
  };

  const getStylistName = (id) => stylists.find((s) => s.id === id)?.name || id;
  const getServiceNames = (ids) => ids.map((id) => services.find((s) => s.id === id)?.name).filter(Boolean).join(', ');

  const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
  const changeVsLast = lastMonthRevenue ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : null;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Tržby</h1>

      <div className={styles.kpiRow}>
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>Tržby tento měsíc</span>
          <span className={styles.kpiValue}>{thisMonthRevenue.toLocaleString()} Kč</span>
          {changeVsLast !== null && (
            <span className={`${styles.kpiChange} ${changeVsLast >= 0 ? styles.kpiUp : styles.kpiDown}`}>
              {changeVsLast >= 0 ? '▲' : '▼'} {Math.abs(changeVsLast)}% vs minulý měsíc
            </span>
          )}
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>Dokončeno tento měsíc</span>
          <span className={styles.kpiValue}>{thisMonthCompleted.length}</span>
          <span className={styles.kpiSub}>průměr {avgRevenue(thisMonthCompleted)} Kč / rezervace</span>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>Nadcházející (potvrzené)</span>
          <span className={styles.kpiValue}>{confirmed}</span>
          <span className={styles.kpiSub}>rezervací čeká</span>
        </div>
        <div className={styles.kpi}>
          <span className={styles.kpiLabel}>Celkové tržby</span>
          <span className={styles.kpiValue}>{totalRevenue(completed).toLocaleString()} Kč</span>
          <span className={styles.kpiSub}>{completed.length} dokončených návštěv</span>
        </div>
      </div>

      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Měsíční tržby</h2>
          <div className={styles.barChart}>
            {revenueByMonth.map((m) => (
              <div key={m.label} className={styles.barGroup}>
                <div className={styles.barTrack}>
                  <div
                    className={styles.bar}
                    style={{ height: `${(m.revenue / maxMonthRevenue) * 100}%` }}
                  >
                    <span className={styles.barVal}>{m.revenue.toLocaleString()} Kč</span>
                  </div>
                </div>
                <div className={styles.barLabel}>{m.label.split(' ')[0]}</div>
                <div className={styles.barCount}>{m.count} návštěv</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Tržby podle kadeřníka</h2>
          <div className={styles.hBars}>
            {revenueByStylists.map((s) => (
              <div key={s.name} className={styles.hBar}>
                <div className={styles.hBarLabel}>{s.name}</div>
                <div className={styles.hBarTrack}>
                  <div className={styles.hBarFill} style={{ width: `${(s.revenue / maxStylistRevenue) * 100}%` }} />
                </div>
                <div className={styles.hBarVal}>{s.revenue.toLocaleString()} Kč</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Nejoblíbenější služby</h2>
          <div className={styles.hBars}>
            {revenueByServices.map((s) => (
              <div key={s.name} className={styles.hBar}>
                <div className={styles.hBarLabel}>{s.name}</div>
                <div className={styles.hBarTrack}>
                  <div className={styles.hBarFill} style={{ width: `${(s.count / maxServiceCount) * 100}%`, background: '#818cf8' }} />
                </div>
                <div className={styles.hBarVal}>{s.count}× · {s.revenue.toLocaleString()} Kč</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Poslední dokončené návštěvy</h2>
          <div className={styles.recentList}>
            {recentCompleted.map((b) => (
              <div key={b.id} className={styles.recentItem}>
                <div className={styles.recentLeft}>
                  <div className={styles.recentClient}>{b.clientName}</div>
                  <div className={styles.recentDetail}>{getServiceNames(b.serviceIds)} · {getStylistName(b.stylistId)}</div>
                </div>
                <div className={styles.recentRight}>
                  <div className={styles.recentPrice}>{b.totalPrice} Kč</div>
                  <div className={styles.recentDate}>{formatDate(b.date)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
