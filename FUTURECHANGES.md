# Co bych řešila v dalším PR


**Přihlášení pro stávající klienty** — zadání to výslovně nechtělo (guest booking), ale v reálu by si salon pravděpodobně přál, aby se vracející klienti mohli přihlásit, vidět historii svých rezervací a rušit termíny online bez nutnosti volat. Firebase Auth to technicky umožňuje, jen by přibyl klientský portál a role `client`.


**Přepínač jazyka (CZ / EN)** — aktuálně je celá aplikace jen česky. Salon ale může navštívit i klient, který česky neumí. Přidala bych jednoduchý přepínač a přeložila statické texty a texty ve Firebase (services...). Technicky bych použila knihovnu `react-i18next` texty by se přesunuly do JSON souborů (`cs.json`, `en.json`) a v komponentách nahradily voláním `t('klíč')`. Admin by zůstal jen česky.


**Návrh dostupných kadeřníků při obsazeném termínu** — pokud si klient vybere konkrétního kadeřníka, zvolí datum a zjistí, že jeho preferovaný čas je obsazený, musí teď jít zpět a začít výběr kadeřníka znovu. Bylo by uživatelsky přívětivější zobrazit přímo v kalendáři, kteří jiní kadeřníci mají v daný čas volno klient by je mohl vybrat na místě bez zbytečného kroků zpět.


**Správa kombinací služeb** — combo karty (např. „Barva + Střih + Foukaná") jsou aktuálně natvrdo v kódu. Jednotlivé služby se sice načítají z Firestore dynamicky, ale pokud administrátor odstraní například „Střih", z combo karty se to neprojeví karta tam zůstane s původním názvem. Řešením by bylo přesunout komba do Firestore jako samostatnou kolekci, kde by každé kombo obsahovalo seznam `serviceIds` při načtení by se zkontrolovalo, jestli všechny služby stále existují, a neplatná komba by se buď nezobrazila, nebo označila jako nedostupná.

**v zadáni byla 1 věc ale já jsem napsala vše co mě hned teď napadlo, že bych upravila**