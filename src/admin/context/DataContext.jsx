import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
  query, where, getDocs,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { SlotConflictError, timeToMin, bookingDuration, overlaps } from '../../utils/bookingConflict';

const DataContext = createContext(null);

const DEFAULT_SETTINGS = {
  phone: '+420 600 000 000',
  email: 'sereneb@kadernictvi.cz',
  openingHours: 'Po–Pá 9–19, So 9–15',
  schedule: { workingDays: [1, 2, 3, 4, 5, 6], startTime: '09:00', endTime: '20:00' },
};

function useCollection(collectionName) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, collectionName), (snap) => {
      setData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, [collectionName]);

  return { data, loading };
}

function useSettings() {
  const [data, setData] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'salon'), (snap) => {
      setData(snap.exists() ? { ...DEFAULT_SETTINGS, ...snap.data() } : DEFAULT_SETTINGS);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { data, loading };
}

export function DataProvider({ children }) {
  const { data: bookings, loading: bookingsLoading } = useCollection('bookings');
  const { data: stylists, loading: stylistsLoading } = useCollection('stylists');
  const { data: services, loading: servicesLoading } = useCollection('services');
  const { data: absences, loading: absencesLoading } = useCollection('absences');
  const { data: settings, loading: settingsLoading } = useSettings();

  const loading = bookingsLoading || stylistsLoading || servicesLoading || absencesLoading || settingsLoading;

  const autoCompletedIds = useRef(new Set());

  useEffect(() => {
    if (!bookings.length) return;
    const now = new Date();
    bookings.forEach((b) => {
      if (b.status !== 'confirmed') return;
      if (autoCompletedIds.current.has(b.id)) return;
      const [bh, bm] = b.time.split(':').map(Number);
      const bDate = new Date(`${b.date}T00:00:00`);
      bDate.setHours(bh, bm, 0, 0);
      if (bDate < now) {
        autoCompletedIds.current.add(b.id);
        updateDoc(doc(db, 'bookings', b.id), { status: 'completed' });
      }
    });
  }, [bookings]);

  const addBooking = useCallback(async (booking) => {
    if (booking.stylistId && booking.date && booking.time) {
      const newStart = timeToMin(booking.time);
      const newEnd = newStart + bookingDuration(booking.serviceIds, services);

      const snap = await getDocs(query(
        collection(db, 'bookings'),
        where('stylistId', '==', booking.stylistId),
        where('date', '==', booking.date),
      ));

      const conflict = snap.docs.some((d) => {
        const ex = d.data();
        if (ex.status === 'cancelled') return false;
        const exStart = timeToMin(ex.time);
        const exEnd = exStart + bookingDuration(ex.serviceIds, services);
        return overlaps(newStart, newEnd, exStart, exEnd);
      });

      if (conflict) throw new SlotConflictError();
    }

    const docRef = await addDoc(collection(db, 'bookings'), {
      ...booking,
      status: 'confirmed',
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...booking, status: 'confirmed' };
  }, [services]);

  const updateBooking = useCallback((id, patch) => {
    return updateDoc(doc(db, 'bookings', id), patch);
  }, []);

  const deleteBooking = useCallback((id) => {
    return deleteDoc(doc(db, 'bookings', id));
  }, []);

  const addStylist = useCallback(async (stylist) => {
    await addDoc(collection(db, 'stylists'), stylist);
  }, []);

  const updateStylist = useCallback((id, patch) => {
    return updateDoc(doc(db, 'stylists', id), patch);
  }, []);

  const deleteStylist = useCallback((id) => {
    return deleteDoc(doc(db, 'stylists', id));
  }, []);

  const addService = useCallback(async (service) => {
    await addDoc(collection(db, 'services'), service);
  }, []);

  const updateService = useCallback((id, patch) => {
    return updateDoc(doc(db, 'services', id), patch);
  }, []);

  const deleteService = useCallback((id) => {
    return deleteDoc(doc(db, 'services', id));
  }, []);

  const addAbsence = useCallback(async (absence) => {
    await addDoc(collection(db, 'absences'), absence);
  }, []);

  const deleteAbsence = useCallback((id) => {
    return deleteDoc(doc(db, 'absences', id));
  }, []);

  const updateSettings = useCallback((patch) => {
    return updateDoc(doc(db, 'settings', 'salon'), patch);
  }, []);

  return (
    <DataContext.Provider value={{
      bookings, addBooking, updateBooking, deleteBooking,
      stylists, addStylist, updateStylist, deleteStylist,
      services, addService, updateService, deleteService,
      absences, addAbsence, deleteAbsence,
      settings, updateSettings,
      loading,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
