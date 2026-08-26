(function () {
  const accountHomeTranslations = {
    cs: {
      "accountHome.title": "Můj účet",
      "accountHome.subtitle": "Spravujte svůj profil a nastavení účtu.",
      "accountHome.settingsTitle": "Nastavení účtu",
      "accountHome.settingsDescription": "Osobní údaje, jazyk, heslo a zabezpečení účtu.",
      "accountHome.userFallback": "Uživatel",
      "accountHome.emailMissing": "E-mail není uložen",
      "accountHome.ratingCompact": "Hodnocení: ⭐ {average} / 5 ({count})",
      "accountHome.ratingNone": "Hodnocení: zatím bez hodnocení"
    },
    en: {
      "accountHome.title": "My account",
      "accountHome.subtitle": "Manage your profile and account settings.",
      "accountHome.settingsTitle": "Account settings",
      "accountHome.settingsDescription": "Personal details, language, password and account security.",
      "accountHome.userFallback": "User",
      "accountHome.emailMissing": "No email saved",
      "accountHome.ratingCompact": "Rating: ⭐ {average} / 5 ({count})",
      "accountHome.ratingNone": "Rating: no ratings yet"
    },
    de: {
      "accountHome.title": "Mein Konto",
      "accountHome.subtitle": "Verwalten Sie Ihr Profil und Ihre Kontoeinstellungen.",
      "accountHome.settingsTitle": "Kontoeinstellungen",
      "accountHome.settingsDescription": "Persönliche Daten, Sprache, Passwort und Kontosicherheit.",
      "accountHome.userFallback": "Benutzer",
      "accountHome.emailMissing": "Keine E-Mail gespeichert",
      "accountHome.ratingCompact": "Bewertung: ⭐ {average} / 5 ({count})",
      "accountHome.ratingNone": "Bewertung: noch keine Bewertungen"
    },
    pl: {
      "accountHome.title": "Moje konto",
      "accountHome.subtitle": "Zarządzaj swoim profilem i ustawieniami konta.",
      "accountHome.settingsTitle": "Ustawienia konta",
      "accountHome.settingsDescription": "Dane osobowe, język, hasło i bezpieczeństwo konta.",
      "accountHome.userFallback": "Użytkownik",
      "accountHome.emailMissing": "Brak zapisanego adresu e-mail",
      "accountHome.ratingCompact": "Ocena: ⭐ {average} / 5 ({count})",
      "accountHome.ratingNone": "Ocena: brak ocen"
    }
  };

  function getLanguage() {
    if (typeof window.getRentuloLanguage === "function") {
      return window.getRentuloLanguage();
    }

    return document.documentElement.lang || "cs";
  }

  function translate(key, fallback, replacements) {
    const language = getLanguage();
    const map = accountHomeTranslations[language] || accountHomeTranslations.cs;
    let text = map[key] || accountHomeTranslations.cs[key] || fallback || key;

    Object.keys(replacements || {}).forEach(function (name) {
      text = text.replaceAll("{" + name + "}", String(replacements[name]));
    });

    return text;
  }

  function render() {
    document.querySelectorAll("[data-account-i18n]").forEach(function (element) {
      const key = element.dataset.accountI18n;
      if (!key) return;
      element.textContent = translate(key, element.textContent);
    });
  }

  window.accountHomeT = translate;
  window.renderAccountHomeTranslations = render;

  document.addEventListener("DOMContentLoaded", render);
  document.addEventListener("rentuloLanguageChanged", render);
})();
