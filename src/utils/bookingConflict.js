export class SlotConflictError extends Error {
  constructor(message = 'Tento termín už je obsazený. Vyberte prosím jiný čas.') {
    super(message);
    this.name = 'SlotConflictError';
  }
}

export function timeToMin(t) {
  const [h, m] = (t || '0:0').split(':').map(Number);
  return h * 60 + m;
}

export function bookingDuration(serviceIds, services) {
  const total = (serviceIds || [])
    .map(id => services.find(s => s.id === id))
    .reduce((sum, s) => sum + (s?.durationMin ?? 30), 0);
  return total || 30;
}

export function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}
