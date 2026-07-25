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