(function () {
  const extraHistoryTranslations = {
    cs: {
      "history.subtitle": "Dokončené rezervace, půjčení a hodnocení na jednom místě.",
      "history.rentalsTabShort": "Moje rezervace",
      "history.offersTabShort": "Moje nabídky",
      "history.detail.show": "Zobrazit detail",
      "history.detail.hide": "Skrýt detail",
      "history.review.commentOptional": "Komentář (nepovinný)"
    },
    sk: {
      "history.subtitle": "Dokončené rezervácie, požičania a hodnotenia na jednom mieste.",
      "history.rentalsTabShort": "Moje rezervácie",
      "history.offersTabShort": "Moje ponuky",
      "history.detail.show": "Zobraziť detail",
      "history.detail.hide": "Skryť detail",
      "history.review.commentOptional": "Komentár (nepovinný)"
    },
    en: {
      "history.subtitle": "Completed reservations, rentals and reviews in one place.",
      "history.rentalsTabShort": "My reservations",
      "history.offersTabShort": "My offers",
      "history.detail.show": "Show details",
      "history.detail.hide": "Hide details",
      "history.review.commentOptional": "Comment (optional)"
    },
    de: {
      "history.subtitle": "Abgeschlossene Reservierungen, Ausleihen und Bewertungen an einem Ort.",
      "history.rentalsTabShort": "Meine Reservierungen",
      "history.offersTabShort": "Meine Angebote",
      "history.detail.show": "Details anzeigen",
      "history.detail.hide": "Details ausblenden",
      "history.review.commentOptional": "Kommentar (optional)"
    },
    pl: {
      "history.subtitle": "Zakończone rezerwacje, wypożyczenia i oceny w jednym miejscu.",
      "history.rentalsTabShort": "Moje rezerwacje",
      "history.offersTabShort": "Moje oferty",
      "history.detail.show": "Pokaż szczegóły",
      "history.detail.hide": "Ukryj szczegóły",
      "history.review.commentOptional": "Komentarz (opcjonalnie)"
    }
  };

  function currentHistoryLanguage() {
    if (typeof window.getRentuloLanguage === "function") {
      return window.getRentuloLanguage();
    }

    return document.documentElement.lang || "cs";
  }

  function historyTranslation(key, fallback) {
    const language = currentHistoryLanguage();
    const languageMap = extraHistoryTranslations[language] || extraHistoryTranslations.cs;
    return languageMap[key] || extraHistoryTranslations.cs[key] || fallback || key;
  }

  window.historyExtraT = historyTranslation;

  const baseRentuloTranslate = typeof window.rentuloTranslate === "function"
    ? window.rentuloTranslate
    : null;

  window.rentuloTranslate = function (key) {
    const language = currentHistoryLanguage();
    const languageMap = extraHistoryTranslations[language] || extraHistoryTranslations.cs;

    if (Object.prototype.hasOwnProperty.call(languageMap, key)) {
      return languageMap[key];
    }

    return baseRentuloTranslate ? baseRentuloTranslate(key) : key;
  };

  function renderHistoryExtraTranslations() {
    document.querySelectorAll("[data-history-extra-i18n]").forEach(function (element) {
      const key = element.dataset.historyExtraI18n;
      if (!key) return;
      element.textContent = historyTranslation(key, element.textContent);
    });
  }

  document.addEventListener("DOMContentLoaded", renderHistoryExtraTranslations);
  document.addEventListener("rentuloLanguageChanged", renderHistoryExtraTranslations);
})();
