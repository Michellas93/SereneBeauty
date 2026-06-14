# Serene Beauty — Rezervační systém kadeřnictví

Aplikace má dvě části: veřejný booking flow, kde si klient bez registrace vybere služby, kadeřníka a termín, a admin rozhraní pro majitelku a recepční. Každý kadeřník má vlastní rozvrh a umí jen určité služby systém to celé hlídá.

**Nasazená aplikace:** https://kadernictvi-e56d4.web.app

## Tech stack
- React 19 + Vite, CSS Modules
- Firebase Firestore, Authentication, Hosting
- Zod (validace formulářů)
- Docker + nginx (alternativní deploy)

## Architektura a rozhodnutí

**Proč React?** V Reactu pracuji s Vue ani Angularem zkušenosti nemám, takže volba byla jasná. Vite jsem zvolila kvůli rychlému HMR a jednoduchému nastavení.

**Proč Firebase?** S Firebase mám zkušenosti z vlastních projektů, které jsem tvořila. Firestore real-time listenery se hodily proto, že změna v adminu se okamžitě projeví bez refreshe. Firebase Auth mi ušetřilo implementaci vlastní autentizace a Hosting deployment zjednodušuje na jeden příkaz.

**Struktura projektu:**

```
src/
├── pages/
│   ├── Landing.jsx
│   └── BookingFlow.jsx
│       └── steps/
│           ├── StepSelectService.jsx
│           ├── StepSelectStylist.jsx
│           ├── StepSelectDateTime.jsx
│           └── StepConfirm.jsx
├── admin/
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── DataContext.jsx
│   ├── pages/
│   │   ├── SchedulePage.jsx
│   │   ├── BookingsPage.jsx
│   │   ├── AbsencesPage.jsx
│   │   ├── RevenuePage.jsx
│   │   └── ManagePage.jsx
│   └── components/
│       ├── AdminLayout.jsx
│       ├── BookingModal.jsx
│       ├── ProtectedRoute.jsx
│       └── RoleRoute.jsx
└── firebase/
    ├── config.js
    └── seed.js
```

Data tečou jednosměrně: Firestore → `onSnapshot` → `DataContext` → komponenty.

## Spuštění lokálně

```bash
npm install
npm run dev
```

Aplikace běží na http://localhost:5173, admin na http://localhost:5173/admin.

Konfigurace Firebase jde do `.env.local`:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Hodnoty najdete ve Firebase Console → Project Settings → Your apps.

**Prvotní nahrání dat** — demo data se naplní seed skriptem. Dočasně přidejte do `src/App.jsx`:

```js
import { seedFirestore } from './firebase/seed';
useEffect(() => { seedFirestore(); }, []);
```

## Spuštění přes Docker

```bash
docker compose up --build
```

Aplikace běží na http://localhost:8080. Multi-stage build (Node 20 → nginx:alpine), Firebase env vars jsou zapečeny do bundle při kompilaci, nginx.conf má SPA fallback pro React Router.

## Přihlášení do adminu

| Role | Email | Heslo | Přístup |
|------|-------|-------|---------|
| Majitelka | majitelka@test.cz | Test1234 | vše |
| Recepční | sereneb@kadernictvi.cz | Serenebeauty | Rozvrh, Rezervace |

## Předpoklady, které jsem si doplnila

1. **Pořadí kroků: Služba → Kadeřník → Datum.** Kadeřník se vybírá před datem, aby systém mohl zobrazit jen dny a časy kdy daný kadeřník pracuje.

2. **Kombinace služeb v jedné rezervaci.** Délky se sčítají, kadeřník se filtruje podle všech vybraných služeb najednou.

3. **Sloty po 15 minutách s kontrolou kolizí.** Obsazené časy se zašednou. Před uložením se navíc dělá kontrola překryvu — pokud termín mezitím někdo zabral, uložení se odmítne.

4. **Ceny jako „od X Kč".** Finální cena závisí na délce vlasů a potvrdí se v salónu.

5. **Host booking.** Klient rezervaci online zrušit nemůže — musí zavolat, recepční ji zruší v adminu.

6. **Absence jsou plně implementované.** Admin zadá nepřítomnost jako jednorázový den nebo rozsah od–do, celý den nebo půl dne. Booking flow to respektuje — celý den se zašedne, půldenní absence zablokuje konkrétní sloty.

7. **Notifikace jsou mock** — výpis do konzole. V produkci: SendGrid + Twilio.

## Co bych přidala s více časem

- **Firestore transakce** — aktuální `getDocs` + zápis má teoretické okno pro souběžné rezervace; odolné řešení by vyžadovalo transakci nebo Firebase Function
- **Zpřísněné Security Rules** — veřejný zápis jen do `bookings`, admin operace podmíněné přihlášením
- **Email potvrzení** — Firebase Function trigger na `bookings.onCreate` + SendGrid
- **SMS připomínka** — Twilio + Cloud Scheduler 24 h předem
- **Unit testy** — slot-generation logika a Zod validace jsou ideální kandidáti
- **Stránkování** — Firestore `limit()` + cursor pagination místo načtení všech rezervací
- **Klientský portál** — přihlášení, přehled vlastních rezervací, online zrušení

## Co bych udělala jinak v produkci

- **Backend vrstva** — Firebase Functions nebo Express pro transakce, rate limiting a server-side validaci; Security Rules na to nestačí
- **Firebase Custom Claims místo Firestore pro role** — role v JWT tokenu není manipulovatelná z klienta; teď ji čtu z Firestore dokumentu, který může kdokoli přepsat
- **Code splitting** — admin stránky by se načítaly lazy loadem, recepční zbytečně stahuje kód stránek, ke kterým nemá přístup
- **CI/CD** — GitHub Actions: build + lint na každý PR, deploy jen při merge do main
- **Monitoring** — Sentry pro tiché chyby, bez toho nevím co se v produkci děje


## Mock integrace

| Integrace | Mock | Produkční služba |
|-----------|------|-----------------|
| E-mail potvrzení | `console.log` | SendGrid — nejrozšířenější transakční e-mail API, free tier 100 e-mailů/den |
| SMS připomínka | není | Twilio — standard pro SMS v Evropě, podporuje česká čísla |
| Platební brána | není | Stripe (karty, developer-friendly) + GoPay (česká alternativa, QR platby) |
