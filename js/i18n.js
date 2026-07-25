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
"account.eyebrow": "Můj účet",
"account.greeting": "Dobrý den",
"account.description":
  "Vyberte akci. Důležité rezervace a žádosti se zvýrazní automaticky.",
      "settings.pageTitle": "Nastavení",
      "settings.pageDescription":
        "Spravujte jazyk, upozornění a zabezpečení svého účtu.",
      "settings.back": "Zpět na Můj účet",

      "settings.generalTitle": "Obecné nastavení",
      "settings.generalDescription": "Změny se uloží do vašeho profilu.",
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
      "settings.passwordChanged": "Heslo bylo úspěšně změněno.",

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
"account.eyebrow": "My account",
"account.greeting": "Good day",
"account.description":
  "Choose an action. Important reservations and requests are highlighted automatically.",
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
"account.eyebrow": "Mein Konto",
"account.greeting": "Guten Tag",
"account.description":
  "Wählen Sie eine Aktion. Wichtige Reservierungen und Anfragen werden automatisch hervorgehoben.",
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

  window.rentuloTranslate = translate;

  document.addEventListener(
    "DOMContentLoaded",
    function () {
      applyRentuloTranslations();
    }
  );
})();