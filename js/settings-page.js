(function () {
  function getSupabaseClient() {
    if (window.rentuloSupabase) {
      return window.rentuloSupabase;
    }

    if (typeof rentuloSupabase !== "undefined") {
      return rentuloSupabase;
    }

    return null;
  }

  function translate(key, fallback) {
    if (typeof window.rentuloTranslate === "function") {
      return window.rentuloTranslate(key);
    }

    return fallback;
  }

  function setMessage(element, text, type) {
    if (!element) {
      return;
    }

    element.textContent = text || "";
    element.className = "message";

    if (text && type) {
      element.classList.add(type);
    }
  }

  async function getAuthenticatedUser(client) {
    const { data, error } = await client.auth.getUser();

    if (error || !data || !data.user) {
      return null;
    }

    return data.user;
  }

  function applyLanguage(language) {
    if (typeof window.setRentuloLanguage === "function") {
      window.setRentuloLanguage(language);
    } else {
      localStorage.setItem("rentuloLanguage", language);
    }

    if (typeof renderSharedNavigation === "function") {
      renderSharedNavigation("muj-ucet");
    }
  }

  async function loadSettings(client, user) {
    const languageSelect =
      document.getElementById("preferredLanguage");

    const emailCheckbox =
      document.getElementById("emailNotifications");

    const message =
      document.getElementById("settingsMessage");

    const { data, error } = await client
      .from("profiles")
      .select("preferred_language, email_notifications")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error(error);

      setMessage(
        message,
        "Nastavení se nepodařilo načíst.",
        "error"
      );

      return;
    }

    const language =
      data && data.preferred_language
        ? data.preferred_language
        : "cs";

    const emailNotifications =
      data
        ? data.email_notifications !== false
        : true;

    if (languageSelect) {
      languageSelect.value = language;
    }

    if (emailCheckbox) {
      emailCheckbox.checked = emailNotifications;
    }

    applyLanguage(language);
  }

  async function saveSettings(client, user) {
    const languageSelect =
      document.getElementById("preferredLanguage");

    const emailCheckbox =
      document.getElementById("emailNotifications");

    const saveButton =
      document.getElementById("saveSettingsButton");

    const message =
      document.getElementById("settingsMessage");

    const preferredLanguage =
      languageSelect
        ? languageSelect.value
        : "cs";

    const emailNotifications =
      emailCheckbox
        ? emailCheckbox.checked
        : true;

    setMessage(message, "", "");

    if (saveButton) {
      saveButton.disabled = true;
    }

    const { error } = await client
      .from("profiles")
      .update({
        preferred_language: preferredLanguage,
        email_notifications: emailNotifications,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    if (saveButton) {
      saveButton.disabled = false;
    }

    if (error) {
      console.error(error);

      setMessage(
        message,
        "Nastavení se nepodařilo uložit.",
        "error"
      );

      return;
    }

    applyLanguage(preferredLanguage);

    setMessage(
      message,
      translate(
        "settings.saved",
        "Nastavení bylo uloženo."
      ),
      "success"
    );
  }

  async function changePassword(client) {
    const newPassword =
      document.getElementById("newPassword");

    const confirmPassword =
      document.getElementById("confirmPassword");

    const button =
      document.getElementById("changePasswordButton");

    const message =
      document.getElementById("passwordMessage");

    const password =
      newPassword
        ? newPassword.value
        : "";

    const confirmation =
      confirmPassword
        ? confirmPassword.value
        : "";

    setMessage(message, "", "");

    if (password.length < 8) {
      setMessage(
        message,
        "Heslo musí mít alespoň 8 znaků.",
        "error"
      );

      return;
    }

    if (password !== confirmation) {
      setMessage(
        message,
        "Zadaná hesla se neshodují.",
        "error"
      );

      return;
    }

    if (button) {
      button.disabled = true;
    }

    const { error } = await client.auth.updateUser({
      password: password
    });

    if (button) {
      button.disabled = false;
    }

    if (error) {
      console.error(error);

      setMessage(
        message,
        "Heslo se nepodařilo změnit: " + error.message,
        "error"
      );

      return;
    }

    if (newPassword) {
      newPassword.value = "";
    }

    if (confirmPassword) {
      confirmPassword.value = "";
    }

    setMessage(
      message,
      translate(
        "settings.passwordChanged",
        "Heslo bylo úspěšně změněno."
      ),
      "success"
    );
  }

  async function initializeSettingsPage() {
    const client = getSupabaseClient();

    if (!client) {
      window.location.href = "prihlaseni.html";
      return;
    }

    const user = await getAuthenticatedUser(client);

    if (!user) {
      window.location.href = "prihlaseni.html";
      return;
    }

    await loadSettings(client, user);

    const saveButton =
      document.getElementById("saveSettingsButton");

    const passwordForm =
      document.getElementById("passwordForm");

    if (saveButton) {
      saveButton.addEventListener("click", function () {
        saveSettings(client, user);
      });
    }

    if (passwordForm) {
      passwordForm.addEventListener(
        "submit",
        function (event) {
          event.preventDefault();
          changePassword(client);
        }
      );
    }
  }

  document.addEventListener(
    "DOMContentLoaded",
    initializeSettingsPage
  );
})();