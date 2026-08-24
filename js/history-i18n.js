(function () {
  const extraHistoryTranslations = {
    cs: {
      "history.subtitle": "Dokončené rezervace, půjčení a hodnocení na jednom místě.",
      "history.review.commentOptional": "Komentář (nepovinný)"
    },
    en: {
      "history.subtitle": "Completed reservations, rentals and reviews in one place.",
      "history.review.commentOptional": "Comment (optional)"
    },
    de: {
      "history.subtitle": "Abgeschlossene Reservierungen, Ausleihen und Bewertungen an einem Ort.",
      "history.review.commentOptional": "Kommentar (optional)"
    },
    pl: {
      "history.subtitle": "Zakończone rezerwacje, wypożyczenia i oceny w jednym miejscu.",
      "history.review.commentOptional": "Komentarz (opcjonalnie)"
    }
  };

  function currentHistoryLanguage() {
    if (typeof window.getRentuloLanguage === "function") {
      return window.getRentuloLanguage();
    }

    return document.documentElement.lang || "cs";
  }

  window.historyExtraT = function (key, fallback) {
    const language = currentHistoryLanguage();
    const languageMap = extraHistoryTranslations[language] || extraHistoryTranslations.cs;
    return languageMap[key] || extraHistoryTranslations.cs[key] || fallback || key;
  };

  function renderHistoryExtraTranslations() {
    document.querySelectorAll("[data-history-extra-i18n]").forEach(function (element) {
      const key = element.dataset.historyExtraI18n;
      if (!key) return;
      element.textContent = window.historyExtraT(key, element.textContent);
    });
  }

  document.addEventListener("DOMContentLoaded", renderHistoryExtraTranslations);
  document.addEventListener("rentuloLanguageChanged", renderHistoryExtraTranslations);
})();
