RENTULO - plán verzie 1.0

Cieľ verzie 1.0:
Vytvoriť jednoduchý a zrozumiteľný tok pre požičiavanie vecí medzi ľuďmi.

Hlavný tok:
1. Majiteľ pridá vec.
2. Záujemca nájde ponuku.
3. Záujemca pošle žiadosť o půjčení.
4. Majiteľ žiadosť potvrdí alebo odmietne.
5. Po potvrdení záujemca zaplatí.
6. Po platbe sa záujemcovi zobrazí kontakt a adresa vyzdvihnutia.
7. Vec sa označí ako vyzdvihnutá.
8. Po vrátení sa rezervácia označí ako vrátená.
9. Ponuka je znova dostupná.

Čo musí byť vo verzii 1.0:

Používatelia:
- registrácia
- prihlásenie
- odhlásenie
- môj účet
- zobrazenie základných údajov používateľa

Povinné údaje používateľa:
- meno
- e-mail
- telefón
- mesto
- PSČ
- heslo

Ponuky vecí:
- pridanie ponuky
- úprava ponuky
- zmazanie ponuky bez aktívnej rezervácie
- zobrazenie vlastných ponúk
- zobrazenie verejných ponúk
- detail ponuky
- fotka ponuky
- cena za deň
- mesto a PSČ
- popis
- kategória

Dôležité pravidlá ponúk:
- ponuka s aktívnou rezerváciou sa nesmie zmazať
- koncepty sa nemajú zobrazovať ako verejné ponuky

Vyhľadávanie:
- podľa názvu
- podľa mesta
- podľa PSČ
- podľa kategórie
- podľa ceny
- dostupné / rezervované

GPS hľadanie:
- môže zostať ako doplnková funkcia
- nie je hlavné jadro verzie 1.0

Rezervácie:
Používané statusy:
- pending
- approved
- paid
- picked_up
- returned
- rejected
- cancelled

Význam statusov:
- pending = čaká na potvrdenie
- approved = čaká na platbu
- paid = zaplatené
- picked_up = vyzdvihnuté
- returned = vrátené
- rejected = odmietnuté
- cancelled = zrušené

Statusy, ktoré blokujú ponuku:
- pending
- approved
- paid
- picked_up

Statusy, po ktorých je ponuka znova voľná:
- returned
- rejected
- cancelled

Platba:
- záujemca platí cenu půjčení
- platforma má províziu 10 %
- majiteľ má nárok na 90 %
- kontakt a adresa sa zobrazia až po platbe

V prototype:
- platba je simulovaná

V ostrej verzii:
- platba musí ísť cez platobnú bránu

Ochrana kontaktov:
Pred platbou sa môže zobrazovať:
- meno
- mesto
- základná informácia o ponuke
- stav rezervácie

Po platbe sa môže zobrazovať:
- telefón
- presná adresa vyzdvihnutia
- poznámka k predaniu

Čo môže počkať na verziu 1.1:
- hodnotenia používateľov
- chat medzi používateľmi
- admin panel
- automatické faktúry
- verifikačné SMS
- viac fotiek pri jednej ponuke
- obľúbené ponuky
- pokročilé filtrovanie
- kalendár dostupnosti
- recenzie vecí
- automatické storno pravidlá

Čo nechať až na neskôr:
- mobilná aplikácia
- poistenie vecí
- automatické riešenie sporov
- firemné účty
- API pre partnerov
- mapa všetkých ponúk

Aktuálny stav prototypu:
- registrácia funguje
- prihlásenie funguje
- môj účet funguje
- pridanie ponuky funguje
- úprava ponuky funguje
- moje ponuky fungujú
- moje rezervácie fungujú
- výsledky vyhľadávania fungujú
- detail ponuky funguje
- detail rezervácie funguje
- stavový tok rezervácie funguje
- simulovaná platba funguje
- provízia 10 % je pripravená
- kontakt je chránený pred platbou
- právne pracovné stránky sú pripravené
- dev.html je upravený
- README-js.txt je pripravený
- README-backend-plan.txt je pripravený
- js/api.js je pripravený, ale zatiaľ nepripojený

Ďalší odporúčaný postup:
1. Uložiť tento súbor.
2. Nerobiť veľké zásahy do funkčných stránok.
3. Najprv doladiť vizuál a texty.
4. Backend riešiť až potom, postupne cez js/api.js.
