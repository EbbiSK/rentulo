(function () {
  const DEFAULT_LANGUAGE = "cs";
  const SUPPORTED_LANGUAGES = ["cs", "en", "de"];

  const translations = {
    cs: {
      "nav.howItWorks": "Jak to funguje",
      "nav.browse": "Prohlédnout nabídky",
      "nav.offer": "Nabídnout cokoli",
      "nav.account": "Můj účet",
      "nav.login": "Přihlásit se",
      "nav.logout": "Odhlásit se",
      "nav.register": "Registrovat se",

      "account.eyebrow": "Můj účet",
      "account.greeting": "Dobrý den",
      "account.description":
        "Vyberte akci. Důležité rezervace a žádosti se zvýrazní automaticky.",
      "account.actionsTitle": "Co chcete udělat?",
      "account.actionsHint": "Vyberte jednu z hlavních částí účtu",

      "account.verified": "Ověřený účet",
      "account.userFallback": "Uživatel",
      "account.emailMissing": "E-mail není uložen",
      "account.ratingNone": "Hodnocení: zatím bez hodnocení",
      "account.ratingValue": "Hodnocení: ⭐ {average} / 5 ({count} hodnocení)",
      "account.itemFallback": "Věc k půjčení",
      "account.categoryFallback": "Ostatní",
      "account.ownerFallback": "Majitel",

      "account.findTitle": "Najít věc",
      "account.findDescription": "Vyhledejte dostupné věci k půjčení ve vašem okolí.",
      "account.findType": "Půjčení",
      "account.findButton": "Prohlédnout nabídky",
      "account.offerTitle": "Nabídnout cokoli",
      "account.offerDescription": "Přidejte vlastní věc a začněte ji bezpečně půjčovat.",
      "account.offerType": "Nabídka",
      "account.offerButton": "Přidat věc",
      "account.reservationsTitle": "Moje rezervace",
      "account.reservationsDefault": "Co si chci půjčit",
      "account.reservationsType": "Moje půjčení",
      "account.reservationsButton": "Spravovat rezervace",
      "account.offersTitle": "Moje nabídky",
      "account.offersDefault": "Co nabízím a žádosti od lidí",
      "account.offersType": "Moje věci",
      "account.offersButton": "Spravovat nabídky",
      "account.historyTitle": "Historie",
      "account.historyDescription": "Dokončené, vrácené, zrušené a odmítnuté rezervace.",
      "account.historyType": "Archiv",
      "account.historyButton": "Zobrazit historii",
      "account.settingsTitle": "Nastavení",
      "account.settingsDescription": "Jazyk aplikace, upozornění a zabezpečení účtu.",
      "account.settingsType": "Účet",
      "account.settingsButton": "Otevřít nastavení",

      "account.dynamic.waitingPaymentOne": "1 rezervace čeká na platbu",
      "account.dynamic.waitingPaymentMany": "{count} rezervace čekají na platbu",
      "account.dynamic.activeReservationOne": "Máte 1 aktivní rezervaci",
      "account.dynamic.activeReservationMany": "Máte {count} aktivních rezervací",
      "account.dynamic.pendingRequestOne": "Máte 1 novou žádost k potvrzení",
      "account.dynamic.pendingRequestMany": "Máte {count} nové žádosti k potvrzení",
      "account.dynamic.paidRequestOne": "1 rezervace je zaplacená, označte vyzvednutí",
      "account.dynamic.paidRequestMany": "{count} rezervace jsou zaplacené, označte vyzvednutí",
      "account.dynamic.pickedUpOne": "1 půjčení probíhá, po vrácení ho uzavřete",
      "account.dynamic.pickedUpMany": "{count} půjčení probíhají, po vrácení je uzavřete",
      "account.dynamic.openRequests": "Máte otevřené žádosti k vyřízení",
      "account.dynamic.incomingRequestOne": "Máte 1 otevřenou žádost u svých nabídek",
      "account.dynamic.incomingRequestMany": "Máte {count} otevřených žádostí u svých nabídek",
      "account.dynamic.myOfferOne": "Máte 1 vlastní nabídku",
      "account.dynamic.myOfferMany": "Máte {count} vlastní nabídky",
      "account.alert.waitingPaymentOne": "rezervace čeká na platbu",
      "account.alert.waitingPaymentMany": "rezervace čekají na platbu",
      "account.alert.pendingOne": "nová žádost čeká na potvrzení",
      "account.alert.pendingMany": "nové žádosti čekají na potvrzení",
      "account.alert.paidOne": "zaplacená rezervace čeká na označení vyzvednutí",
      "account.alert.paidMany": "zaplacené rezervace čekají na označení vyzvednutí",
      "account.alert.pickedUpOne": "půjčení čeká na označení vrácení",
      "account.alert.pickedUpMany": "půjčení čekají na označení vrácení",
      "account.alert.join": " a ",
      "account.alert.summary": "Máte nové věci k vyřízení: {items}.",

      "reservations.pageTitle": "Moje rezervace - Rentulo",
      "reservations.back": "← Zpět do účtu",
      "reservations.heading": "Moje rezervace",
      "reservations.description": "Spravujte své rezervace a jejich průběh.",
      "reservations.findItem": "Najít věc",
      "reservations.empty.title": "Zatím nemáte žádné rezervace.",
      "reservations.empty.description": "Najděte věc ve svém okolí a pošlete první žádost o půjčení.",
      "reservations.loading.title": "Načítám rezervace...",
      "reservations.loading.description": "Chvíli strpení, načítáme vaše rezervace ze Supabase.",
      "reservation.status.pending": "Čeká na potvrzení",
      "reservation.status.approved": "Čeká na platbu",
      "reservation.status.paid": "Zaplaceno",
      "reservation.status.pickedUp": "Vyzvednuto",
      "reservation.status.returned": "Vráceno",
      "reservation.status.rejected": "Odmítnuto",
      "reservation.status.cancelled": "Zrušeno",
      "reservation.status.completed": "Dokončeno",
      "reservations.fallback.itemForRent": "Věc k půjčení",
      "reservations.fallback.other": "Ostatní",
      "reservations.fallback.owner": "Majitel",
      "reservations.fallback.item": "Věc",
      "reservations.review.sent": "Odesláno",
      "reservations.hideDetail": "Skrýt detail",
      "reservations.detail": "Detail",
      "reservations.review.fromOwner": "Hodnocení od majitele",
      "reservations.review.notRatedByOwner": "Majitel vás zatím neohodnotil.",
      "reservations.review.sentTitle": "Hodnocení bylo odesláno",
      "reservations.review.stars": "Počet hvězdiček",
      "reservations.review.excellent": "výborné",
      "reservations.review.good": "dobré",
      "reservations.review.average": "průměrné",
      "reservations.review.weak": "slabé",
      "reservations.review.bad": "špatné",
      "reservations.review.comment": "Komentář",
      "reservations.review.placeholder": "Jak proběhlo půjčení?",
      "reservations.review.submit": "Odeslat hodnocení",
      "reservations.payment.platformTitle": "Platba přes provozovatele platformy",
      "reservations.payment.testInfo": "Kliknutím na tlačítko Zaplatit provedete testovací platbu.",
      "reservations.payment.totalToPay": "Celkem zaplatíte",
      "reservations.payment.fee": "Provize Rentulo 10 %",
      "reservations.payment.ownerGets": "Majitel dostane",
      "reservations.payment.completed": "Platba byla přijata a půjčení je dokončeno",
      "reservations.payment.accepted": "Platba přijata přes provozovatele platformy",
      "reservations.payment.feeInfo": "Rentulo si ponechá provizi 10 % a majiteli bude vyplaceno 90 % z půjčovného.",
      "reservations.payment.totalPaid": "Celkem zaplaceno",
      "reservations.payment.rentuloFee": "Provize Rentulo",
      "reservations.payment.ownerAmount": "Částka pro majitele",
      "reservations.state.pendingTitle": "Žádost čeká na potvrzení",
      "reservations.state.pendingText": "Majitel zatím vaši žádost nepotvrdil.",
      "reservations.state.approvedTitle": "Žádost je potvrzená",
      "reservations.state.approvedText": "Teď můžete dokončit platbu. Po zaplacení se zobrazí telefon a přesná adresa.",
      "reservations.state.paidTitle": "Zaplaceno – domluvte se s majitelem na předání",
      "reservations.state.paidText": "Kontaktujte majitele a domluvte si přesný čas vyzvednutí.",
      "reservations.state.pickedTitle": "Věc byla označena jako vyzvednutá",
      "reservations.state.pickedText": "Půjčení právě probíhá.",
      "reservations.state.returnedTitle": "Vráceno – půjčení je dokončeno",
      "reservations.state.returnedText": "Rezervace byla úspěšně ukončena. Už není potřeba žádná další akce.",
      "reservations.state.rejectedTitle": "Žádost byla odmítnuta",
      "reservations.state.rejectedText": "Majitel vaši žádost odmítl.",
      "reservations.state.cancelledTitle": "Rezervace byla zrušena",
      "reservations.state.cancelledText": "Tato rezervace už nepokračuje.",
      "reservations.contact.hiddenTitle": "Kontaktní údaje jsou skryté",
      "reservations.contact.hiddenText": "Telefon a přesná adresa se zobrazí až po zaplacení.",
      "reservations.contact.city": "Město",
      "reservations.contact.completedTitle": "Kontaktní údaje k dokončené rezervaci",
      "reservations.contact.pickupTitle": "Údaje pro vyzvednutí",
      "reservations.contact.completedNote": "Rezervace je dokončená. Kontaktní údaje zůstávají dostupné, protože půjčení bylo zaplaceno.",
      "reservations.contact.phone": "Telefon",
      "reservations.contact.phoneMissing": "Telefon není uložen",
      "reservations.contact.address": "Adresa",
      "reservations.contact.addressMissing": "Adresa není uložená",
      "reservations.contact.note": "Poznámka",
      "reservations.detail.term": "Termín",
      "reservations.detail.total": "Celkem k platbě",
      "reservations.detail.payment": "Platba",
      "reservations.payment.paidLower": "zaplaceno",
      "reservations.payment.waitingLower": "čeká na platbu",
      "reservations.detail.fee": "Provize 10 %",
      "reservations.detail.ownerGets": "Majitel dostane",
      "reservations.pay": "Zaplatit",
      "reservations.detailReservation": "Detail rezervace",
      "reservations.cancel": "Zrušit rezervaci",
      "reservations.pickupMap": "Mapa vyzvednutí",
      "reservations.itemDetail": "Detail věci",
      "reservations.moreActions": "Další akce",
      "reservations.ownerLabel": "Majitel",
      "reservations.countOne": "1 rezervace",
      "reservations.countMany": "rezervací",
      "reservations.activeTitle": "Aktivní rezervace",
      "reservations.activeEmpty": "Nemáte žádné aktivní rezervace. Dokončené, zrušené a odmítnuté záznamy najdete v Historii.",
      "reservations.error.load": "Rezervace se nepodařilo načíst ze Supabase. Podívejte se prosím do konzole.",
      "reservations.error.supabase": "Supabase klient není načtený.",
      "reservations.error.loginCancel": "Pro zrušení rezervace se musíte znovu přihlásit.",
      "reservations.error.cannotCancel": "Tuto rezervaci už nelze běžně zrušit.",
      "reservations.confirm.cancel": "Opravdu chcete tuto rezervaci zrušit? Termín se znovu uvolní.",
      "reservations.error.cancel": "Rezervaci se nepodařilo zrušit. Podívejte se prosím do konzole.",
      "reservations.success.cancelled": "Rezervace byla zrušena a přesunuta do Historie.",
      "reservations.error.loginPay": "Pro zaplacení se musíte znovu přihlásit.",
      "reservations.confirm.testPayment": "Toto je testovací platba. Opravdu chcete označit rezervaci jako zaplacenou?",
      "reservations.error.payment": "Platbu se nepodařilo uložit do Supabase. Podívejte se prosím do konzole.",
      "reservations.error.loginReview": "Pro odeslání hodnocení se musíte přihlásit.",
      "reservations.error.alreadyReviewed": "Tuto rezervaci jste už hodnotili.",
      "reservations.error.selectStars": "Vyberte počet hvězdiček.",
      "reservations.error.writeComment": "Napište krátký komentář k půjčení.",
      "reservations.error.ownerId": "Chybí ID majitele pro hodnocení.",
      "reservations.error.supabaseUnavailable": "Supabase klient není dostupný. Obnovte stránku a zkuste to znovu.",
      "reservations.error.reviewSave": "Hodnocení se nepodařilo uložit.",
      "reservations.success.reviewSaved": "Hodnocení bylo uloženo.",

      "settings.pageTitle": "Nastavení",
      "settings.pageDescription":
        "Spravujte jazyk, upozornění a zabezpečení svého účtu.",
      "settings.back": "Zpět na Můj účet",

      "settings.generalTitle": "Obecné nastavení",
      "settings.generalDescription":
        "Změny se uloží do vašeho profilu.",
      "settings.language": "Jazyk aplikace",
      "settings.emailTitle": "E-mailová upozornění",
      "settings.emailDescription":
        "Důležitá upozornění o rezervacích",
      "settings.systemEmails":
        "Systémové a bezpečnostní e-maily zůstanou vždy aktivní.",
      "settings.save": "Uložit nastavení",
      "settings.saved": "Nastavení bylo uloženo.",

      "settings.passwordTitle": "Změna hesla",
      "settings.passwordDescription":
        "Nové heslo musí mít alespoň 8 znaků.",
      "settings.newPassword": "Nové heslo",
      "settings.confirmPassword": "Potvrzení nového hesla",
      "settings.changePassword": "Změnit heslo",
      "settings.passwordChanged":
        "Heslo bylo úspěšně změněno.",

      "settings.cancelAccountTitle": "Zrušení účtu",
      "settings.cancelAccountDescription":
        "Bezpečný proces zrušení účtu doplníme po kontrole aktivních rezervací, plateb a zákonných povinností. Účet se nyní nedá odstranit omylem."
    },

    en: {
      "nav.howItWorks": "How it works",
      "nav.browse": "Browse listings",
      "nav.offer": "List an item",
      "nav.account": "My account",
      "nav.login": "Sign in",
      "nav.logout": "Sign out",
      "nav.register": "Register",

      "account.eyebrow": "My account",
      "account.greeting": "Good day",
      "account.description":
        "Choose an action. Important reservations and requests are highlighted automatically.",
      "account.actionsTitle": "What would you like to do?",
      "account.actionsHint": "Choose one of the main account sections",

      "account.verified": "Verified account",
      "account.userFallback": "User",
      "account.emailMissing": "Email is not saved",
      "account.ratingNone": "Rating: no ratings yet",
      "account.ratingValue": "Rating: ⭐ {average} / 5 ({count} ratings)",
      "account.itemFallback": "Item for rent",
      "account.categoryFallback": "Other",
      "account.ownerFallback": "Owner",

      "account.findTitle": "Find an item",
      "account.findDescription": "Search for available items to rent near you.",
      "account.findType": "Renting",
      "account.findButton": "Browse listings",
      "account.offerTitle": "List an item",
      "account.offerDescription": "Add your own item and start renting it out safely.",
      "account.offerType": "Listing",
      "account.offerButton": "Add an item",
      "account.reservationsTitle": "My reservations",
      "account.reservationsDefault": "Items I want to rent",
      "account.reservationsType": "My rentals",
      "account.reservationsButton": "Manage reservations",
      "account.offersTitle": "My listings",
      "account.offersDefault": "My listings and requests from users",
      "account.offersType": "My items",
      "account.offersButton": "Manage listings",
      "account.historyTitle": "History",
      "account.historyDescription": "Completed, returned, cancelled and rejected reservations.",
      "account.historyType": "Archive",
      "account.historyButton": "View history",
      "account.settingsTitle": "Settings",
      "account.settingsDescription": "Application language, notifications and account security.",
      "account.settingsType": "Account",
      "account.settingsButton": "Open settings",

      "account.dynamic.waitingPaymentOne": "1 reservation is waiting for payment",
      "account.dynamic.waitingPaymentMany": "{count} reservations are waiting for payment",
      "account.dynamic.activeReservationOne": "You have 1 active reservation",
      "account.dynamic.activeReservationMany": "You have {count} active reservations",
      "account.dynamic.pendingRequestOne": "You have 1 new request to approve",
      "account.dynamic.pendingRequestMany": "You have {count} new requests to approve",
      "account.dynamic.paidRequestOne": "1 reservation is paid; mark it as picked up",
      "account.dynamic.paidRequestMany": "{count} reservations are paid; mark them as picked up",
      "account.dynamic.pickedUpOne": "1 rental is in progress; close it after return",
      "account.dynamic.pickedUpMany": "{count} rentals are in progress; close them after return",
      "account.dynamic.openRequests": "You have open requests to handle",
      "account.dynamic.incomingRequestOne": "You have 1 open request for your listings",
      "account.dynamic.incomingRequestMany": "You have {count} open requests for your listings",
      "account.dynamic.myOfferOne": "You have 1 listing",
      "account.dynamic.myOfferMany": "You have {count} listings",
      "account.alert.waitingPaymentOne": "reservation is waiting for payment",
      "account.alert.waitingPaymentMany": "reservations are waiting for payment",
      "account.alert.pendingOne": "new request is waiting for approval",
      "account.alert.pendingMany": "new requests are waiting for approval",
      "account.alert.paidOne": "paid reservation is waiting to be marked as picked up",
      "account.alert.paidMany": "paid reservations are waiting to be marked as picked up",
      "account.alert.pickedUpOne": "rental is waiting to be marked as returned",
      "account.alert.pickedUpMany": "rentals are waiting to be marked as returned",
      "account.alert.join": " and ",
      "account.alert.summary": "You have new items to handle: {items}.",

      "reservations.pageTitle": "My reservations - Rentulo",
      "reservations.back": "← Back to account",
      "reservations.heading": "My reservations",
      "reservations.description": "Manage your reservations and their progress.",
      "reservations.findItem": "Find an item",
      "reservations.empty.title": "You do not have any reservations yet.",
      "reservations.empty.description": "Find an item near you and send your first rental request.",
      "reservations.loading.title": "Loading reservations...",
      "reservations.loading.description": "Please wait while we load your reservations from Supabase.",
      "reservation.status.pending": "Waiting for approval",
      "reservation.status.approved": "Waiting for payment",
      "reservation.status.paid": "Paid",
      "reservation.status.pickedUp": "Picked up",
      "reservation.status.returned": "Returned",
      "reservation.status.rejected": "Rejected",
      "reservation.status.cancelled": "Cancelled",
      "reservation.status.completed": "Completed",
      "reservations.fallback.itemForRent": "Item for rent",
      "reservations.fallback.other": "Other",
      "reservations.fallback.owner": "Owner",
      "reservations.fallback.item": "Item",
      "reservations.review.sent": "Sent",
      "reservations.hideDetail": "Hide details",
      "reservations.detail": "Details",
      "reservations.review.fromOwner": "Review from the owner",
      "reservations.review.notRatedByOwner": "The owner has not reviewed you yet.",
      "reservations.review.sentTitle": "Review submitted",
      "reservations.review.stars": "Star rating",
      "reservations.review.excellent": "excellent",
      "reservations.review.good": "good",
      "reservations.review.average": "average",
      "reservations.review.weak": "poor",
      "reservations.review.bad": "bad",
      "reservations.review.comment": "Comment",
      "reservations.review.placeholder": "How did the rental go?",
      "reservations.review.submit": "Submit review",
      "reservations.payment.platformTitle": "Payment through the platform operator",
      "reservations.payment.testInfo": "Click Pay to make a test payment.",
      "reservations.payment.totalToPay": "Total to pay",
      "reservations.payment.fee": "Rentulo fee 10%",
      "reservations.payment.ownerGets": "Owner receives",
      "reservations.payment.completed": "Payment received and the rental is complete",
      "reservations.payment.accepted": "Payment received through the platform operator",
      "reservations.payment.feeInfo": "Rentulo keeps a 10% fee and the owner receives 90% of the rental price.",
      "reservations.payment.totalPaid": "Total paid",
      "reservations.payment.rentuloFee": "Rentulo fee",
      "reservations.payment.ownerAmount": "Amount for owner",
      "reservations.state.pendingTitle": "Request waiting for approval",
      "reservations.state.pendingText": "The owner has not approved your request yet.",
      "reservations.state.approvedTitle": "Request approved",
      "reservations.state.approvedText": "You can now complete payment. The phone number and exact address will appear after payment.",
      "reservations.state.paidTitle": "Paid – arrange handover with the owner",
      "reservations.state.paidText": "Contact the owner and arrange the exact pickup time.",
      "reservations.state.pickedTitle": "Item marked as picked up",
      "reservations.state.pickedText": "The rental is currently in progress.",
      "reservations.state.returnedTitle": "Returned – rental completed",
      "reservations.state.returnedText": "The reservation has been successfully completed. No further action is needed.",
      "reservations.state.rejectedTitle": "Request rejected",
      "reservations.state.rejectedText": "The owner rejected your request.",
      "reservations.state.cancelledTitle": "Reservation cancelled",
      "reservations.state.cancelledText": "This reservation will not continue.",
      "reservations.contact.hiddenTitle": "Contact details are hidden",
      "reservations.contact.hiddenText": "The phone number and exact address will appear after payment.",
      "reservations.contact.city": "City",
      "reservations.contact.completedTitle": "Contact details for completed reservation",
      "reservations.contact.pickupTitle": "Pickup details",
      "reservations.contact.completedNote": "The reservation is complete. Contact details remain available because the rental was paid.",
      "reservations.contact.phone": "Phone",
      "reservations.contact.phoneMissing": "Phone number not saved",
      "reservations.contact.address": "Address",
      "reservations.contact.addressMissing": "Address not saved",
      "reservations.contact.note": "Note",
      "reservations.detail.term": "Dates",
      "reservations.detail.total": "Total to pay",
      "reservations.detail.payment": "Payment",
      "reservations.payment.paidLower": "paid",
      "reservations.payment.waitingLower": "waiting for payment",
      "reservations.detail.fee": "Fee 10%",
      "reservations.detail.ownerGets": "Owner receives",
      "reservations.pay": "Pay",
      "reservations.detailReservation": "Reservation details",
      "reservations.cancel": "Cancel reservation",
      "reservations.pickupMap": "Pickup map",
      "reservations.itemDetail": "Item details",
      "reservations.moreActions": "More actions",
      "reservations.ownerLabel": "Owner",
      "reservations.countOne": "1 reservation",
      "reservations.countMany": "reservations",
      "reservations.activeTitle": "Active reservations",
      "reservations.activeEmpty": "You do not have any active reservations. Completed, cancelled and rejected records are available in History.",
      "reservations.error.load": "Reservations could not be loaded from Supabase. Please check the console.",
      "reservations.error.supabase": "Supabase client is not loaded.",
      "reservations.error.loginCancel": "Please sign in again to cancel the reservation.",
      "reservations.error.cannotCancel": "This reservation can no longer be cancelled normally.",
      "reservations.confirm.cancel": "Are you sure you want to cancel this reservation? The dates will become available again.",
      "reservations.error.cancel": "The reservation could not be cancelled. Please check the console.",
      "reservations.success.cancelled": "The reservation was cancelled and moved to History.",
      "reservations.error.loginPay": "Please sign in again to pay.",
      "reservations.confirm.testPayment": "This is a test payment. Do you want to mark the reservation as paid?",
      "reservations.error.payment": "The payment could not be saved to Supabase. Please check the console.",
      "reservations.error.loginReview": "Please sign in to submit a review.",
      "reservations.error.alreadyReviewed": "You have already reviewed this reservation.",
      "reservations.error.selectStars": "Select a star rating.",
      "reservations.error.writeComment": "Write a short comment about the rental.",
      "reservations.error.ownerId": "The owner ID is missing for the review.",
      "reservations.error.supabaseUnavailable": "Supabase is unavailable. Refresh the page and try again.",
      "reservations.error.reviewSave": "The review could not be saved.",
      "reservations.success.reviewSaved": "The review was saved.",

      "settings.pageTitle": "Settings",
      "settings.pageDescription":
        "Manage the language, notifications and security of your account.",
      "settings.back": "Back to My account",

      "settings.generalTitle": "General settings",
      "settings.generalDescription":
        "Changes will be saved to your profile.",
      "settings.language": "Application language",
      "settings.emailTitle": "Email notifications",
      "settings.emailDescription":
        "Important reservation notifications",
      "settings.systemEmails":
        "System and security emails will always remain active.",
      "settings.save": "Save settings",
      "settings.saved": "Settings have been saved.",

      "settings.passwordTitle": "Change password",
      "settings.passwordDescription":
        "The new password must contain at least 8 characters.",
      "settings.newPassword": "New password",
      "settings.confirmPassword": "Confirm new password",
      "settings.changePassword": "Change password",
      "settings.passwordChanged":
        "The password has been changed successfully.",

      "settings.cancelAccountTitle": "Cancel account",
      "settings.cancelAccountDescription":
        "A secure account cancellation process will be added after checking active reservations, payments and legal obligations. The account cannot currently be deleted accidentally."
    },

    de: {
      "nav.howItWorks": "So funktioniert es",
      "nav.browse": "Angebote ansehen",
      "nav.offer": "Artikel anbieten",
      "nav.account": "Mein Konto",
      "nav.login": "Anmelden",
      "nav.logout": "Abmelden",
      "nav.register": "Registrieren",

      "account.eyebrow": "Mein Konto",
      "account.greeting": "Guten Tag",
      "account.description":
        "Wählen Sie eine Aktion. Wichtige Reservierungen und Anfragen werden automatisch hervorgehoben.",
      "account.actionsTitle": "Was möchten Sie tun?",
      "account.actionsHint":
        "Wählen Sie einen der Hauptbereiche Ihres Kontos",

      "account.verified": "Verifiziertes Konto",
      "account.userFallback": "Benutzer",
      "account.emailMissing": "E-Mail ist nicht gespeichert",
      "account.ratingNone": "Bewertung: noch keine Bewertungen",
      "account.ratingValue": "Bewertung: ⭐ {average} / 5 ({count} Bewertungen)",
      "account.itemFallback": "Mietartikel",
      "account.categoryFallback": "Sonstiges",
      "account.ownerFallback": "Vermieter",

      "account.findTitle": "Artikel finden",
      "account.findDescription": "Suchen Sie nach verfügbaren Mietartikeln in Ihrer Nähe.",
      "account.findType": "Mieten",
      "account.findButton": "Angebote ansehen",
      "account.offerTitle": "Artikel anbieten",
      "account.offerDescription": "Fügen Sie einen eigenen Artikel hinzu und vermieten Sie ihn sicher.",
      "account.offerType": "Angebot",
      "account.offerButton": "Artikel hinzufügen",
      "account.reservationsTitle": "Meine Reservierungen",
      "account.reservationsDefault": "Was ich mieten möchte",
      "account.reservationsType": "Meine Mieten",
      "account.reservationsButton": "Reservierungen verwalten",
      "account.offersTitle": "Meine Angebote",
      "account.offersDefault": "Meine Angebote und Anfragen von Nutzern",
      "account.offersType": "Meine Artikel",
      "account.offersButton": "Angebote verwalten",
      "account.historyTitle": "Verlauf",
      "account.historyDescription": "Abgeschlossene, zurückgegebene, stornierte und abgelehnte Reservierungen.",
      "account.historyType": "Archiv",
      "account.historyButton": "Verlauf anzeigen",
      "account.settingsTitle": "Einstellungen",
      "account.settingsDescription": "Sprache, Benachrichtigungen und Kontosicherheit.",
      "account.settingsType": "Konto",
      "account.settingsButton": "Einstellungen öffnen",

      "account.dynamic.waitingPaymentOne": "1 Reservierung wartet auf Zahlung",
      "account.dynamic.waitingPaymentMany": "{count} Reservierungen warten auf Zahlung",
      "account.dynamic.activeReservationOne": "Sie haben 1 aktive Reservierung",
      "account.dynamic.activeReservationMany": "Sie haben {count} aktive Reservierungen",
      "account.dynamic.pendingRequestOne": "Sie haben 1 neue Anfrage zur Bestätigung",
      "account.dynamic.pendingRequestMany": "Sie haben {count} neue Anfragen zur Bestätigung",
      "account.dynamic.paidRequestOne": "1 Reservierung ist bezahlt; als abgeholt markieren",
      "account.dynamic.paidRequestMany": "{count} Reservierungen sind bezahlt; als abgeholt markieren",
      "account.dynamic.pickedUpOne": "1 Miete läuft; nach der Rückgabe abschließen",
      "account.dynamic.pickedUpMany": "{count} Mieten laufen; nach der Rückgabe abschließen",
      "account.dynamic.openRequests": "Sie haben offene Anfragen zu bearbeiten",
      "account.dynamic.incomingRequestOne": "Sie haben 1 offene Anfrage zu Ihren Angeboten",
      "account.dynamic.incomingRequestMany": "Sie haben {count} offene Anfragen zu Ihren Angeboten",
      "account.dynamic.myOfferOne": "Sie haben 1 Angebot",
      "account.dynamic.myOfferMany": "Sie haben {count} Angebote",
      "account.alert.waitingPaymentOne": "Reservierung wartet auf Zahlung",
      "account.alert.waitingPaymentMany": "Reservierungen warten auf Zahlung",
      "account.alert.pendingOne": "neue Anfrage wartet auf Bestätigung",
      "account.alert.pendingMany": "neue Anfragen warten auf Bestätigung",
      "account.alert.paidOne": "bezahlte Reservierung wartet auf die Markierung als abgeholt",
      "account.alert.paidMany": "bezahlte Reservierungen warten auf die Markierung als abgeholt",
      "account.alert.pickedUpOne": "Miete wartet auf die Markierung als zurückgegeben",
      "account.alert.pickedUpMany": "Mieten warten auf die Markierung als zurückgegeben",
      "account.alert.join": " und ",
      "account.alert.summary": "Sie haben neue Vorgänge zu bearbeiten: {items}.",

      "reservations.pageTitle": "Meine Reservierungen - Rentulo",
      "reservations.back": "← Zurück zum Konto",
      "reservations.heading": "Meine Reservierungen",
      "reservations.description": "Verwalten Sie Ihre Reservierungen und deren Verlauf.",
      "reservations.findItem": "Artikel finden",
      "reservations.empty.title": "Sie haben noch keine Reservierungen.",
      "reservations.empty.description": "Finden Sie einen Artikel in Ihrer Nähe und senden Sie Ihre erste Mietanfrage.",
      "reservations.loading.title": "Reservierungen werden geladen...",
      "reservations.loading.description": "Bitte warten Sie, während Ihre Reservierungen aus Supabase geladen werden.",
      "reservation.status.pending": "Wartet auf Bestätigung",
      "reservation.status.approved": "Wartet auf Zahlung",
      "reservation.status.paid": "Bezahlt",
      "reservation.status.pickedUp": "Abgeholt",
      "reservation.status.returned": "Zurückgegeben",
      "reservation.status.rejected": "Abgelehnt",
      "reservation.status.cancelled": "Storniert",
      "reservation.status.completed": "Abgeschlossen",
      "reservations.fallback.itemForRent": "Mietartikel",
      "reservations.fallback.other": "Sonstiges",
      "reservations.fallback.owner": "Vermieter",
      "reservations.fallback.item": "Artikel",
      "reservations.review.sent": "Gesendet",
      "reservations.hideDetail": "Details ausblenden",
      "reservations.detail": "Details",
      "reservations.review.fromOwner": "Bewertung vom Vermieter",
      "reservations.review.notRatedByOwner": "Der Vermieter hat Sie noch nicht bewertet.",
      "reservations.review.sentTitle": "Bewertung gesendet",
      "reservations.review.stars": "Sternebewertung",
      "reservations.review.excellent": "ausgezeichnet",
      "reservations.review.good": "gut",
      "reservations.review.average": "durchschnittlich",
      "reservations.review.weak": "schwach",
      "reservations.review.bad": "schlecht",
      "reservations.review.comment": "Kommentar",
      "reservations.review.placeholder": "Wie verlief die Ausleihe?",
      "reservations.review.submit": "Bewertung senden",
      "reservations.payment.platformTitle": "Zahlung über den Plattformbetreiber",
      "reservations.payment.testInfo": "Klicken Sie auf Bezahlen, um eine Testzahlung durchzuführen.",
      "reservations.payment.totalToPay": "Gesamtbetrag",
      "reservations.payment.fee": "Rentulo-Gebühr 10 %",
      "reservations.payment.ownerGets": "Vermieter erhält",
      "reservations.payment.completed": "Zahlung eingegangen und Ausleihe abgeschlossen",
      "reservations.payment.accepted": "Zahlung über den Plattformbetreiber eingegangen",
      "reservations.payment.feeInfo": "Rentulo behält 10 % Gebühr ein, der Vermieter erhält 90 % des Mietpreises.",
      "reservations.payment.totalPaid": "Insgesamt bezahlt",
      "reservations.payment.rentuloFee": "Rentulo-Gebühr",
      "reservations.payment.ownerAmount": "Betrag für Vermieter",
      "reservations.state.pendingTitle": "Anfrage wartet auf Bestätigung",
      "reservations.state.pendingText": "Der Vermieter hat Ihre Anfrage noch nicht bestätigt.",
      "reservations.state.approvedTitle": "Anfrage bestätigt",
      "reservations.state.approvedText": "Sie können jetzt die Zahlung abschließen. Telefonnummer und genaue Adresse werden danach angezeigt.",
      "reservations.state.paidTitle": "Bezahlt – Übergabe mit dem Vermieter vereinbaren",
      "reservations.state.paidText": "Kontaktieren Sie den Vermieter und vereinbaren Sie die genaue Abholzeit.",
      "reservations.state.pickedTitle": "Artikel als abgeholt markiert",
      "reservations.state.pickedText": "Die Ausleihe läuft derzeit.",
      "reservations.state.returnedTitle": "Zurückgegeben – Ausleihe abgeschlossen",
      "reservations.state.returnedText": "Die Reservierung wurde erfolgreich abgeschlossen. Es ist keine weitere Aktion erforderlich.",
      "reservations.state.rejectedTitle": "Anfrage abgelehnt",
      "reservations.state.rejectedText": "Der Vermieter hat Ihre Anfrage abgelehnt.",
      "reservations.state.cancelledTitle": "Reservierung storniert",
      "reservations.state.cancelledText": "Diese Reservierung wird nicht fortgesetzt.",
      "reservations.contact.hiddenTitle": "Kontaktdaten sind ausgeblendet",
      "reservations.contact.hiddenText": "Telefonnummer und genaue Adresse werden nach der Zahlung angezeigt.",
      "reservations.contact.city": "Stadt",
      "reservations.contact.completedTitle": "Kontaktdaten zur abgeschlossenen Reservierung",
      "reservations.contact.pickupTitle": "Abholdaten",
      "reservations.contact.completedNote": "Die Reservierung ist abgeschlossen. Die Kontaktdaten bleiben sichtbar, da die Ausleihe bezahlt wurde.",
      "reservations.contact.phone": "Telefon",
      "reservations.contact.phoneMissing": "Telefonnummer nicht gespeichert",
      "reservations.contact.address": "Adresse",
      "reservations.contact.addressMissing": "Adresse nicht gespeichert",
      "reservations.contact.note": "Hinweis",
      "reservations.detail.term": "Zeitraum",
      "reservations.detail.total": "Gesamtbetrag",
      "reservations.detail.payment": "Zahlung",
      "reservations.payment.paidLower": "bezahlt",
      "reservations.payment.waitingLower": "wartet auf Zahlung",
      "reservations.detail.fee": "Gebühr 10 %",
      "reservations.detail.ownerGets": "Vermieter erhält",
      "reservations.pay": "Bezahlen",
      "reservations.detailReservation": "Reservierungsdetails",
      "reservations.cancel": "Reservierung stornieren",
      "reservations.pickupMap": "Abholkarte",
      "reservations.itemDetail": "Artikeldetails",
      "reservations.moreActions": "Weitere Aktionen",
      "reservations.ownerLabel": "Vermieter",
      "reservations.countOne": "1 Reservierung",
      "reservations.countMany": "Reservierungen",
      "reservations.activeTitle": "Aktive Reservierungen",
      "reservations.activeEmpty": "Sie haben keine aktiven Reservierungen. Abgeschlossene, stornierte und abgelehnte Einträge finden Sie im Verlauf.",
      "reservations.error.load": "Reservierungen konnten nicht aus Supabase geladen werden. Bitte prüfen Sie die Konsole.",
      "reservations.error.supabase": "Supabase-Client ist nicht geladen.",
      "reservations.error.loginCancel": "Bitte melden Sie sich erneut an, um die Reservierung zu stornieren.",
      "reservations.error.cannotCancel": "Diese Reservierung kann nicht mehr normal storniert werden.",
      "reservations.confirm.cancel": "Möchten Sie diese Reservierung wirklich stornieren? Der Zeitraum wird wieder verfügbar.",
      "reservations.error.cancel": "Die Reservierung konnte nicht storniert werden. Bitte prüfen Sie die Konsole.",
      "reservations.success.cancelled": "Die Reservierung wurde storniert und in den Verlauf verschoben.",
      "reservations.error.loginPay": "Bitte melden Sie sich erneut an, um zu bezahlen.",
      "reservations.confirm.testPayment": "Dies ist eine Testzahlung. Möchten Sie die Reservierung als bezahlt markieren?",
      "reservations.error.payment": "Die Zahlung konnte nicht in Supabase gespeichert werden. Bitte prüfen Sie die Konsole.",
      "reservations.error.loginReview": "Bitte melden Sie sich an, um eine Bewertung zu senden.",
      "reservations.error.alreadyReviewed": "Sie haben diese Reservierung bereits bewertet.",
      "reservations.error.selectStars": "Wählen Sie eine Sternebewertung.",
      "reservations.error.writeComment": "Schreiben Sie einen kurzen Kommentar zur Ausleihe.",
      "reservations.error.ownerId": "Die Vermieter-ID für die Bewertung fehlt.",
      "reservations.error.supabaseUnavailable": "Supabase ist nicht verfügbar. Aktualisieren Sie die Seite und versuchen Sie es erneut.",
      "reservations.error.reviewSave": "Die Bewertung konnte nicht gespeichert werden.",
      "reservations.success.reviewSaved": "Die Bewertung wurde gespeichert.",

      "settings.pageTitle": "Einstellungen",
      "settings.pageDescription":
        "Verwalten Sie Sprache, Benachrichtigungen und Sicherheit Ihres Kontos.",
      "settings.back": "Zurück zu Mein Konto",

      "settings.generalTitle": "Allgemeine Einstellungen",
      "settings.generalDescription":
        "Änderungen werden in Ihrem Profil gespeichert.",
      "settings.language": "Sprache der Anwendung",
      "settings.emailTitle": "E-Mail-Benachrichtigungen",
      "settings.emailDescription":
        "Wichtige Benachrichtigungen zu Reservierungen",
      "settings.systemEmails":
        "System- und Sicherheits-E-Mails bleiben immer aktiv.",
      "settings.save": "Einstellungen speichern",
      "settings.saved": "Die Einstellungen wurden gespeichert.",

      "settings.passwordTitle": "Passwort ändern",
      "settings.passwordDescription":
        "Das neue Passwort muss mindestens 8 Zeichen enthalten.",
      "settings.newPassword": "Neues Passwort",
      "settings.confirmPassword": "Neues Passwort bestätigen",
      "settings.changePassword": "Passwort ändern",
      "settings.passwordChanged":
        "Das Passwort wurde erfolgreich geändert.",

      "settings.cancelAccountTitle": "Konto kündigen",
      "settings.cancelAccountDescription":
        "Ein sicherer Prozess zur Kontokündigung wird nach der Prüfung aktiver Reservierungen, Zahlungen und gesetzlicher Pflichten ergänzt. Das Konto kann derzeit nicht versehentlich gelöscht werden."
    }
  };

  function normalizeLanguage(language) {
    return SUPPORTED_LANGUAGES.includes(language)
      ? language
      : DEFAULT_LANGUAGE;
  }

  function getRentuloLanguage() {
    return normalizeLanguage(
      localStorage.getItem("rentuloLanguage")
    );
  }

  function translate(key, language) {
    const selectedLanguage = normalizeLanguage(
      language || getRentuloLanguage()
    );

    return (
      translations[selectedLanguage][key] ||
      translations[DEFAULT_LANGUAGE][key] ||
      key
    );
  }

  function applyRentuloTranslations(language) {
    const selectedLanguage = normalizeLanguage(
      language || getRentuloLanguage()
    );

    document.documentElement.lang = selectedLanguage;

    document
      .querySelectorAll("[data-i18n]")
      .forEach(function (element) {
        const key = element.dataset.i18n;

        element.textContent = translate(
          key,
          selectedLanguage
        );
      });

    document
      .querySelectorAll("[data-i18n-placeholder]")
      .forEach(function (element) {
        const key =
          element.dataset.i18nPlaceholder;

        element.setAttribute(
          "placeholder",
          translate(key, selectedLanguage)
        );
      });
  }

  function setRentuloLanguage(language) {
    const selectedLanguage =
      normalizeLanguage(language);

    localStorage.setItem(
      "rentuloLanguage",
      selectedLanguage
    );

    applyRentuloTranslations(
      selectedLanguage
    );

    document.dispatchEvent(
      new CustomEvent(
        "rentuloLanguageChanged",
        {
          detail: {
            language: selectedLanguage
          }
        }
      )
    );
  }

  window.getRentuloLanguage =
    getRentuloLanguage;

  window.setRentuloLanguage =
    setRentuloLanguage;

  window.applyRentuloTranslations =
    applyRentuloTranslations;

  window.rentuloTranslate =
    translate;

  document.addEventListener(
    "DOMContentLoaded",
    function () {
      applyRentuloTranslations();
    }
  );
})();