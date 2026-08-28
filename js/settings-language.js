(function () {
  const SUPPORTED_LANGUAGES = ["cs", "sk", "en", "de", "pl"];

  const TEXT = {
    cs: {
      title: "Jazyk stránky",
      description: "Vyberte jazyk, ve kterém chcete Rentulo používat. Volba se uloží k vašemu účtu a použije se po přihlášení.",
      label: "Jazyk",
      save: "Uložit jazyk",
      saving: "Ukládám…",
      saved: "Jazyk byl uložen.",
      error: "Jazyk se nepodařilo uložit. Zkuste to prosím znovu."
    },
    sk: {
      title: "Jazyk stránky",
      description: "Vyberte jazyk, v ktorom chcete Rentulo používať. Voľba sa uloží k vášmu účtu a použije sa po prihlásení.",
      label: "Jazyk",
      save: "Uložiť jazyk",
      saving: "Ukladám…",
      saved: "Jazyk bol uložený.",
      error: "Jazyk sa nepodarilo uložiť. Skúste to prosím znova."
    },
    en: {
      title: "Site language",
      description: "Choose the language you want to use in Rentulo. The choice is saved to your account and used after sign-in.",
      label: "Language",
      save: "Save language",
      saving: "Saving…",
      saved: "Language saved.",
      error: "The language could not be saved. Please try again."
    },
    de: {
      title: "Sprache der Website",
      description: "Wählen Sie die Sprache, in der Sie Rentulo verwenden möchten. Die Auswahl wird in Ihrem Konto gespeichert und nach der Anmeldung verwendet.",
      label: "Sprache",
      save: "Sprache speichern",
      saving: "Wird gespeichert…",
      saved: "Die Sprache wurde gespeichert.",
      error: "Die Sprache konnte nicht gespeichert werden. Bitte versuchen Sie es erneut."
    },
    pl: {
      title: "Język strony",
      description: "Wybierz język, w którym chcesz korzystać z Rentulo. Wybór zostanie zapisany na Twoim koncie i użyty po zalogowaniu.",
      label: "Język",
      save: "Zapisz język",
      saving: "Zapisywanie…",
      saved: "Język został zapisany.",
      error: "Nie udało się zapisać języka. Spróbuj ponownie."
    }
  };

  function normalizeLanguage(language) {
    const normalized = String(language || "").toLowerCase();
    return SUPPORTED_LANGUAGES.includes(normalized) ? normalized : "cs";
  }

  function getCurrentLanguage() {
    if (typeof window.getRentuloLanguage === "function") {
      return normalizeLanguage(window.getRentuloLanguage());
    }

    return normalizeLanguage(localStorage.getItem("rentuloLanguage"));
  }

  function getSupabaseClient() {
    if (window.rentuloSupabase) {
      return window.rentuloSupabase;
    }

    if (typeof rentuloSupabase !== "undefined") {
      return rentuloSupabase;
    }

    return null;
  }

  function renderText(language) {
    const current = normalizeLanguage(language || getCurrentLanguage());
    const text = TEXT[current] || TEXT.cs;
    const title = document.getElementById("settingsLanguageTitle");
    const description = document.getElementById("settingsLanguageDescription");
    const label = document.getElementById("settingsLanguageLabel");
    const saveLabel = document.getElementById("settingsLanguageSaveLabel");
    const savingLabel = document.getElementById("settingsLanguageSavingLabel");

    if (title) title.textContent = text.title;
    if (description) description.textContent = text.description;
    if (label) label.textContent = text.label;
    if (saveLabel) saveLabel.textContent = text.save;
    if (savingLabel) savingLabel.textContent = text.saving;
  }

  function setMessage(text, type) {
    const message = document.getElementById("languageMessage");

    if (!message) {
      return;
    }

    message.textContent = text || "";
    message.className = "message";

    if (text && type) {
      message.classList.add(type);
    }
  }

  function setLoading(isLoading) {
    const button = document.getElementById("saveLanguageButton");

    if (!button) {
      return;
    }

    button.disabled = Boolean(isLoading);
    button.classList.toggle("is-loading", Boolean(isLoading));
    button.setAttribute("aria-busy", isLoading ? "true" : "false");
  }

  async function getUser() {
    if (window.rentuloAuthGuard && typeof window.rentuloAuthGuard.requireUser === "function") {
      return window.rentuloAuthGuard.requireUser();
    }

    const client = getSupabaseClient();

    if (!client || !client.auth) {
      return null;
    }

    const { data, error } = await client.auth.getUser();
    return !error && data && data.user ? data.user : null;
  }

  async function loadPreference(client, user) {
    if (!client || !user || !user.id) {
      return;
    }

    const select = document.getElementById("settingsLanguageSelect");

    if (!select) {
      return;
    }

    try {
      const { data, error } = await client
        .from("profiles")
        .select("preferred_language")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      const metadata = user.user_metadata || {};
      const language = normalizeLanguage(
        (data && data.preferred_language) || metadata.preferred_language || "cs"
      );

      select.value = language;
      renderText(language);
    } catch (error) {
      console.warn("Jazyk účtu se nepodařilo načíst.", error);
      select.value = getCurrentLanguage();
      renderText();
    }
  }

  async function savePreference(client, user) {
    const select = document.getElementById("settingsLanguageSelect");

    if (!client || !user || !user.id || !select) {
      return;
    }

    const language = normalizeLanguage(select.value);
    const text = TEXT[language] || TEXT.cs;

    setMessage("", "");
    setLoading(true);

    try {
      const { error: profileError } = await client
        .from("profiles")
        .update({
          preferred_language: language,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (profileError) {
        throw profileError;
      }

      const { error: authError } = await client.auth.updateUser({
        data: { preferred_language: language }
      });

      if (authError) {
        console.warn("Jazyk se nepodařilo uložit do Auth metadata.", authError);
      }

      if (typeof window.setRentuloLanguage === "function") {
        window.setRentuloLanguage(language);
      } else {
        localStorage.setItem("rentuloLanguage", language);
      }

      if (typeof renderSharedNavigation === "function") {
        renderSharedNavigation("nastaveni");
      }

      select.value = language;
      renderText(language);
      setMessage(text.saved, "success");
    } catch (error) {
      console.error(error);
      setMessage((TEXT[getCurrentLanguage()] || TEXT.cs).error, "error");
    } finally {
      setLoading(false);
    }
  }

  async function initialize() {
    const client = getSupabaseClient();
    const select = document.getElementById("settingsLanguageSelect");
    const saveButton = document.getElementById("saveLanguageButton");

    if (!client || !select || !saveButton) {
      return;
    }

    renderText();

    const user = await getUser();

    if (!user) {
      return;
    }

    await loadPreference(client, user);

    saveButton.addEventListener("click", function () {
      void savePreference(client, user);
    });
  }

  document.addEventListener("rentuloLanguageChanged", function (event) {
    const language = normalizeLanguage(
      event && event.detail ? event.detail.language : getCurrentLanguage()
    );
    const select = document.getElementById("settingsLanguageSelect");

    if (select) {
      select.value = language;
    }

    renderText(language);
  });

  document.addEventListener("DOMContentLoaded", function () {
    void initialize();
  });
})();
