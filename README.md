# Rentulo

Rentulo je webová platforma na požičiavanie vecí medzi používateľmi. Aktuálny repozitár predstavuje predprodukčný stav aplikácie pred zapojením ostrej platobnej brány a produkčnej domény.

> Stav dokumentácie: 18. 8. 2026

## Technológie

- statické HTML stránky,
- CSS,
- vanilla JavaScript,
- Supabase:
  - Auth,
  - PostgreSQL databáza,
  - Storage,
  - RPC/databázové funkcie,
  - Edge Functions,
- Vercel pre hosting webu,
- Resend pre aktuálne e-mailové notifikácie,
- OpenStreetMap pre mapové podklady,
- Nominatim a Photon pre geokódovanie miesta vyzdvihnutia.

Frontend momentálne nemá klasický build krok. `package.json` obsahuje iba Supabase CLI ako vývojovú závislosť.

## Základná štruktúra projektu

```text
/
├── assets/                     # brand a statické súbory
├── css/                        # spoločné a stránkové štýly
├── js/                         # frontendová logika
├── supabase/
│   ├── functions/              # Supabase Edge Functions
│   ├── migrations/             # aktívna migračná história
│   ├── migrations-archive/     # historický archív migrácií
│   └── snippets/               # pomocné SQL/snippety
├── *.html                      # jednotlivé stránky aplikácie
├── package.json
├── package-lock.json
└── vercel.json                 # Vercel konfigurácia a HTTP security headers
```

Medzi hlavné stránky patria napríklad:

- `index.html`,
- `vysledky.html`,
- `detail.html`,
- `nabidnout.html`,
- `edit-nabidka.html`,
- `moje-nabidky.html`,
- `moje-rezervace.html`,
- `historie.html`,
- `nastaveni.html`,
- `registrace.html`,
- `prihlaseni.html`,
- `obnova-hesla.html`,
- `jak-to-funguje.html`,
- `obchodni-podminky.html`,
- `ochrana-osobnich-udaju.html`.

## Lokálne spustenie

Projekt je statický frontend. Na bežnú vizuálnu kontrolu je vhodné spustiť ho cez lokálny HTTP server, napríklad VS Code Live Server.

Ak je potrebný Supabase CLI:

```powershell
npm install
```

V repozitári nie je potrebný frontendový build príkaz.

## Supabase klient

Frontend inicializuje Supabase v:

```text
js/supabase-config.js
```

V klientskom kóde je verejná Supabase publishable key. Táto hodnota je určená na použitie vo frontende; bezpečnosť dát musí byť vynútená databázovými pravidlami, najmä RLS a bezpečnými RPC funkciami.

Service-role kľúč nesmie byť vložený do frontendového kódu. Používa sa iba na serverovej strane tam, kde je to nevyhnutné.

Prihlásenie používa vlastné ukladanie Supabase session podľa voľby používateľa:

- `sessionStorage` pri bežnom prihlásení,
- `localStorage` pri zapnutej voľbe zapamätania prihlásenia.

## Supabase Edge Functions

Aktuálne sú v projekte:

- `account-deactivation`,
- `geocode-pickup`,
- `send-reservation-email`.

Podrobnosti o konfigurácii a potrebných premenných prostredia sú v `HANDOVER.md`.

## Jazyky

Používateľské rozhranie podporuje:

- češtinu,
- angličtinu,
- nemčinu,
- poľštinu.

## Nasadenie

Aktuálny tok nasadenia je:

```text
lokálny projekt -> Git commit -> GitHub main -> Vercel
```

Po odsúhlasenej zmene sa používa štandardný postup:

```powershell
git status
git add <zmenene-subory>
git commit -m "Popis zmeny"
git push origin main
```

Vercel následne nasadí novú verziu z vetvy `main`.

## Bezpečnosť

`vercel.json` nastavuje bezpečnostné HTTP hlavičky vrátane:

- Content-Security-Policy,
- X-Content-Type-Options,
- Referrer-Policy,
- X-Frame-Options,
- Permissions-Policy,
- Strict-Transport-Security,
- Cross-Origin-Opener-Policy.

GitHub CodeQL bol 18. 8. 2026 spustený nad vetvou `main`. V tom čase bolo 0 otvorených a 6 vyriešených code-scanning nálezov. Secret scanning a Dependabot v tom istom kontrolnom kroku neukazovali otvorené problémy.

Tento stav je iba časový snapshot. Bezpečnostné kontroly treba opakovať po významných zmenách a pred produkčným spustením.

## Dôležité upozornenie

Projekt ešte nie je pripravený na ostrú prevádzku iba samotným nasadením.

Pred produkciou treba najmä:

1. doplniť GitHub CI,
2. doplniť najdôležitejšie automatizované testy,
3. vytvoriť čistú finálnu zálohu,
4. odstrániť alebo vypnúť testovaciu platobnú cestu,
5. zapojiť ostrú platobnú bránu,
6. nastaviť produkčnú doménu a súvisiace URL,
7. rozhodnúť finálnu stratégiu notifikácií,
8. doplniť a právne skontrolovať firemné a kontaktné údaje,
9. vykonať finálny produkčný security a smoke audit.

Podrobný stav, konfigurácia a otvorené úlohy sú v [HANDOVER.md](HANDOVER.md).
