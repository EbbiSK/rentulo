RENTULO - plán prechodu na backend

Aktuálny stav:
Projekt teraz funguje ako prototyp v prehliadači.
Dáta sa ukladajú do localStorage a sessionStorage.

To znamená:
- dáta sú iba v jednom prehliadači
- používatelia sa navzájom nevidia medzi rôznymi zariadeniami
- po vymazaní prehliadača sa dáta stratia
- prihlásenie je iba simulované
- platba je iba simulovaná
- fotky sú uložené ako base64 v prehliadači

Cieľ backendu:
Nahradiť localStorage reálnou databázou a serverom.

Hlavné dátové skupiny:
- users
- offers
- reservations
- notifications
- payments
- reviews

Prvá backend verzia má riešiť hlavne:
- users
- offers
- reservations

Až potom riešiť:
- notifications
- payments
- reviews

Odporúčaná stratégia:
1. Nechať aktuálny frontend čo najviac tak, ako je.
2. Vytvoriť spoločnú API vrstvu v súbore js/api.js.
3. Najprv nechať api.js pracovať s localStorage.
4. Potom postupne prepínať funkcie z localStorage na server.
5. Stránky meniť čo najmenej.

Navrhovaný súbor:
- js/api.js

Základné funkcie v js/api.js:
- apiGetCurrentUser()
- apiRegister(userData)
- apiLogin(email, password)
- apiLogout()

- apiGetOffers()
- apiGetOfferById(id)
- apiCreateOffer(offerData)
- apiUpdateOffer(id, offerData)
- apiDeleteOffer(id)
- apiGetMyOffers()

- apiGetReservations()
- apiGetReservationById(id)
- apiGetMyReservations()
- apiGetOwnerReservations()
- apiCreateReservation(reservationData)
- apiUpdateReservationStatus(id, status)

Budúce API endpointy:

Používatelia:
- POST   /api/register
- POST   /api/login
- POST   /api/logout
- GET    /api/me
- PUT    /api/me

Ponuky:
- GET    /api/offers
- GET    /api/offers/:id
- POST   /api/offers
- PUT    /api/offers/:id
- DELETE /api/offers/:id
- GET    /api/my/offers

Rezervácie:
- GET    /api/my/reservations
- GET    /api/owner/reservations
- GET    /api/reservations/:id
- POST   /api/reservations
- PUT    /api/reservations/:id/status

Notifikácie:
- GET    /api/notifications
- PUT    /api/notifications/:id/read

Platby:
- POST   /api/payments/create
- POST   /api/payments/webhook
- GET    /api/payments/:reservationId

Poradie napájania na backend:

Krok 1 - používatelia:
- registrace.html
- prihlaseni.html
- muj-ucet.html
- navigation.js
- user.js

Krok 2 - ponuky:
- nabidnout.html
- vysledky.html
- detail.html
- moje-nabidky.html
- edit-nabidka.html

Krok 3 - rezervácie:
- detail.html
- rezervace.html
- moje-rezervace.html
- moje-nabidky.html

Krok 4 - fotky:
Teraz:
- photoDataUrl
- imageDataUrl
- image

V backende:
- photoUrl

Fotky sa nemajú ukladať ako base64 do databázy.
Na server alebo úložisko sa nahrá súbor a do databázy sa uloží iba URL.

Krok 5 - platby:
Platby riešiť až po používateľoch, ponukách a rezerváciách.

Logika platby:
- záujemca zaplatí cenu požičania
- platforma si vezme 10 %
- majiteľ dostane 90 %
- kaucia sa eviduje samostatne
- kontakt a presná adresa sa zobrazia až po platbe

Statusy rezervácie:
- pending
- approved
- paid
- picked_up
- returned
- rejected
- cancelled

Statusy, ktoré blokujú ponuku:
- pending
- approved
- paid
- picked_up

Statusy, po ktorých je ponuka znova voľná:
- returned
- rejected
- cancelled

Čo zatiaľ nerobiť:
- admin panel
- chat medzi používateľmi
- hodnotenia ako prvý krok
- automatické faktúry
- reálne výplaty majiteľom
- mobilnú aplikáciu

Najbližší technický krok po tomto README:
Vytvoriť js/api.js ako medzivrstvu medzi stránkami a dátami.
Najprv bude api.js používať localStorage.
Neskôr sa vnútro api.js prepne na reálny backend.