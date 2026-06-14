/**
 * Seed script — spusť jednou z prohlížeče nebo přidej dočasně do App.jsx.
 * Naplní Firestore kolekcemi services a stylists z původních mock dat.
 *
 * Použití v App.jsx (jednou, pak odstraň):
 *   import { seedFirestore } from './firebase/seed';
 *   seedFirestore().then(() => console.log('Seed done'));
 */
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as authSignOut } from 'firebase/auth';
import { collection, addDoc, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { auth, db } from './config';

const SERVICES = [
  { slug: 'haircut-women', name: 'Dámský střih', duration: '45 – 60 min', durationMin: 45, price: 650, description: 'Přesný střih přizpůsobený tvaru obličeje a životnímu stylu, včetně mytí a dokončovacího stylu.', category: 'haircuts' },
  { slug: 'haircut-men', name: 'Pánský střih', duration: '30 – 45 min', durationMin: 30, price: 450, description: 'Klasický nebo moderní pánský střih, přesně načasovaný a upravený přesně podle vašich preferencí.', category: 'haircuts' },
  { slug: 'kids-cut', name: 'Dětský střih', duration: '30 min', durationMin: 30, price: 350, description: 'Jemné a trpělivé stříhání pro naše mladší hosty (do 12 let).', category: 'haircuts' },
  { slug: 'blowout', name: 'Foukání', duration: '30 – 45 min', durationMin: 30, price: 550, description: 'Profesionální foukání s objemem a leskem pro bezproblémové záření trvající celý den.', category: 'haircuts' },
  { slug: 'treatment', name: 'Regenerační ošetření', duration: '20 – 30 min', durationMin: 20, price: 600, description: 'Hloubková kondicionace a oprava vazeb pro obnovení přirozené síly a zdraví vlasů.', category: 'haircuts' },
  { slug: 'color', name: 'Barvení', duration: '90 – 120 min', durationMin: 90, price: 1500, description: 'Celobarevná aplikace pomocí organických, amoniak-free pigmentů. Jednoduché barvení na jedno sezení.', category: 'coloring' },
  { slug: 'highlights', name: 'Melír / Balayage', duration: '120 – 150 min', durationMin: 120, price: 2200, description: 'Foliové techniky nebo volně malovaný balayage pro přirozený, sluncem políbený výsledek.', category: 'coloring' },
  { slug: 'bridal', name: 'Svatební styling', duration: 'Individuálně', durationMin: 120, price: null, description: 'Konzultace a zkouška svatebního účesu. Personalizované plánování pro váš výjimečný den.', category: 'coloring' },
];

const STYLISTS = [
  { name: 'Jana Kovářová', specialty: 'Mistryně — 15 let praxe', cannotDo: ['kids-cut'], schedule: { workingDays: [1,2,3,4,5], startTime: '09:00', endTime: '17:00' } },
  { name: 'Tereza Horáková', specialty: 'Specialistka na barvení', cannotDo: [], schedule: { workingDays: [2,3,4,5,6], startTime: '10:00', endTime: '18:00' } },
  { name: 'Markéta Novotná', specialty: 'Stylistka', cannotDo: [], schedule: { workingDays: [1,2,3,4,5], startTime: '08:00', endTime: '16:00' } },
  { name: 'Tomáš Blažek', specialty: 'Stylista', cannotDo: ['color', 'highlights', 'bridal'], schedule: { workingDays: [3,4,5,6], startTime: '12:00', endTime: '20:00' } },
  { name: 'Eva Procházková', specialty: 'Majitelka salónu', cannotDo: ['blowout', 'treatment', 'color', 'highlights', 'bridal'], schedule: { workingDays: [1,3,5], startTime: '09:00', endTime: '14:00' } },
];

async function clearCollection(name) {
  const snap = await getDocs(collection(db, name));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

let running = false;
let addingOwner = false;

export async function addOwner() {
  if (addingOwner) return;
  addingOwner = true;
  const snap = await getDocs(collection(db, 'stylists'));
  const exists = snap.docs.some(d => d.data().name === 'Eva Procházková');
  if (exists) { console.log('Majitelka již existuje.'); return; }
  const owner = STYLISTS.find(s => s.name === 'Eva Procházková');
  await addDoc(collection(db, 'stylists'), owner);
  console.log('Majitelka přidána.');
}

/**
 * Vytvoří dva admin účty v Firebase Auth + záznamy v kolekci admins.
 * Spusť jednou: import { seedAdminUsers } from './firebase/seed'; seedAdminUsers();
 * Přihlašovací údaje:
 *   Majitelka:  majitelka@test.cz       /  Test1234
 *   Recepční:   sereneb@kadernictvi.cz  /  Serenebeauty
 */
export async function seedAdminUsers() {
  const USERS = [
    { email: 'majitelka@test.cz',      password: 'Test1234',     role: 'owner' },
    { email: 'sereneb@kadernictvi.cz', password: 'Serenebeauty', role: 'receptionist' },
  ];

  for (const u of USERS) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, u.email, u.password);
      await setDoc(doc(db, 'admins', cred.user.uid), { role: u.role, email: u.email });
      await authSignOut(auth);
      console.log(`Admin vytvořen: ${u.email} (${u.role})`);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        try {
          const cred = await signInWithEmailAndPassword(auth, u.email, u.password);
          await setDoc(doc(db, 'admins', cred.user.uid), { role: u.role, email: u.email });
          await authSignOut(auth);
          console.log(`Admin role nastaven: ${u.email} (${u.role})`);
        } catch (signInErr) {
          console.error(`Nelze přihlásit ${u.email} pro nastavení role:`, signInErr);
        }
      } else {
        console.error(`Chyba při vytváření ${u.email}:`, err);
      }
    }
  }
  console.log('seedAdminUsers hotov.');
}

export async function seedSettings() {
  await setDoc(doc(db, 'settings', 'salon'), {
    phone: '+420 600 000 000',
    email: 'sereneb@kadernictvi.cz',
    openingHours: 'Po–Pá 9–19, So 9–15',
    schedule: { workingDays: [1, 2, 3, 4, 5, 6], startTime: '09:00', endTime: '20:00' },
  });
  console.log('Settings nahrány do Firestore.');
}

export async function seedFirestore() {
  if (running) return;
  running = true;
  console.log('Seeduji Firestore…');
  await clearCollection('services');
  await clearCollection('stylists');

  for (const svc of SERVICES) {
    await addDoc(collection(db, 'services'), svc);
  }
  for (const sty of STYLISTS) {
    await addDoc(collection(db, 'stylists'), sty);
  }
  await seedSettings();
  console.log('Seed hotov — services, stylists a settings nahrány do Firestore.');
}
