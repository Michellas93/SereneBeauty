export const getAbsenceStartDate = (a) => a.dateFrom ?? a.date ?? '';
export const getAbsenceEndDate = (a) => a.dateTo ?? a.date ?? '';

const fmtDate = (str) => {
  const [y, m, d] = str.split('-');
  return `${d}.${m}.${y}`;
};

export const formatAbsenceDate = (a) => {
  if (a.dateFrom && a.dateTo) {
    if (a.dateFrom === a.dateTo) return fmtDate(a.dateFrom);
    return `${fmtDate(a.dateFrom)} – ${fmtDate(a.dateTo)}`;
  }
  return fmtDate(a.date);
};
