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

  function renderMessage(element, text, type) {
    if (!element) {
      return;
    }

    element.textContent = text || "";
    element.className = "message";

    if (text && type) {
      element.classList.add(type);
    }
  }

  function setMessage(element, text, type) {
    if (!element) {
      return;
    }

    delete element.dataset.messageKey;
    delete element.dataset.messageFallback;
    delete element.dataset.messageValues;
    renderMessage(element, text, type);
  }

  function formatTranslatedMessage(key, fallback, values) {
    let text = translate(key, fallback);

    Object.keys(values || {}).forEach(function (name) {
      text = text.split("{" + name + "}").join(String(values[name]));
    });

    return text;
  }

  function setTranslatedMessage(element, key, fallback, type, values) {
    if (!element) {
      return;
    }

    element.dataset.messageKey = key;
    element.dataset.messageFallback = fallback || "";
    element.dataset.messageValues = JSON.stringify(values || {});
    renderMessage(
      element,
      formatTranslatedMessage(key, fallback, values),
      type
    );
  }

  function refreshTranslatedMessages() {
    document
      .querySelectorAll(".message[data-message-key]")
      .forEach(function (element) {
        let values = {};

        try {
          values = JSON.parse(element.dataset.messageValues || "{}");
        } catch (_error) {
          values = {};
        }

        renderMessage(
          element,
          formatTranslatedMessage(
            element.dataset.messageKey,
            element.dataset.messageFallback || "",
            values
          ),
          element.classList.contains("error") ? "error" : "success"
        );
      });
  }

  function setLoadState(mode) {
    const state = document.getElementById("settingsLoadState");
    const text = document.getElementById("settingsLoadText");
    const retryButton = document.getElementById("settingsRetryButton");
    const content = document.getElementById("settingsContent");
    const isLoading = mode === "loading";
    const isError = mode === "error";

    if (state) {
      state.hidden = !isLoading && !isError;
      state.classList.toggle("is-error", isError);
      state.dataset.state = mode;
    }

    if (text) {
      const key = isError ? "settings.loadError" : "settings.loading";
      const fallback = isError
        ? "Nastavení se nepodařilo načíst."
        : "Načítám nastavení…";
      text.dataset.i18n = key;
      text.textContent = translate(key, fallback);
    }

    if (retryButton) {
      retryButton.hidden = !isError;
    }

    if (content) {
      content.hidden = isLoading || isError;
    }
  }

  function setButtonLoading(button, isLoading) {
    if (!button) {
      return;
    }

    button.disabled = Boolean(isLoading);
    button.classList.toggle("is-loading", Boolean(isLoading));
    button.setAttribute("aria-busy", isLoading ? "true" : "false");
  }

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function normalizeEmail(value) {
    return normalizeText(value).toLowerCase();
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function getAuthenticatedUser(client) {
    const { data, error } = await client.auth.getUser();

    if (error || !data || !data.user) {
      return null;
    }

    return data.user;
  }

  function syncLocalUser(user, profile) {
    if (!user || !user.id || typeof saveCurrentUser !== "function") {
      return;
    }

    const metadata = user.user_metadata || {};
    const currentLocalUser =
      typeof getCurrentUser === "function" ? getCurrentUser() : null;
    const fullName =
      (profile && profile.full_name) ||
      metadata.full_name ||
      metadata.fullName ||
      user.email ||
      translate("settings.userFallback", "Uživatel");

    saveCurrentUser({
      ...(currentLocalUser || {}),
      id: user.id,
      fullName: fullName,
      name: fullName,
      email: user.email || "",
      phone: (profile && profile.phone) || metadata.phone || "",
      street: (profile && profile.street) || metadata.street || "",
      city: (profile && profile.city) || metadata.city || "",
      postalCode:
        (profile && profile.postal_code) ||
        metadata.postal_code ||
        metadata.postalCode ||
        "",
      source: "supabase",
      updatedAt: new Date().toISOString()
    });
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

  function setProfileFields(profile, user) {
    const values = {
      profileFullName: profile && profile.full_name ? profile.full_name : "",
      profileEmail:
        user && user.email
          ? user.email
          : profile && profile.email
            ? profile.email
            : "",
      profilePhone: profile && profile.phone ? profile.phone : "",
      profileStreet: profile && profile.street ? profile.street : "",
      profileCity: profile && profile.city ? profile.city : "",
      profilePostalCode: profile && profile.postal_code ? profile.postal_code : ""
    };

    Object.keys(values).forEach(function (id) {
      const input = document.getElementById(id);

      if (input) {
        input.value = values[id];
      }
    });
  }

  async function loadPageData(client, user) {
    const languageSelect = document.getElementById("preferredLanguage");
    const emailCheckbox = document.getElementById("emailNotifications");
    const settingsMessage = document.getElementById("settingsMessage");
    const profileMessage = document.getElementById("profileMessage");

    setLoadState("loading");
    setMessage(settingsMessage, "", "");
    setMessage(profileMessage, "", "");

    let data;
    let error;

    try {
      const response = await client
        .from("profiles")
        .select(
          "full_name, email, phone, street, city, postal_code, preferred_language, email_notifications"
        )
        .eq("id", user.id)
        .maybeSingle();

      data = response.data;
      error = response.error;
    } catch (requestError) {
      error = requestError;
    }

    if (error || !data) {
      console.error(error);
      setLoadState("error");
      return false;
    }

    let profile = data || null;
    const authEmail = normalizeEmail(user && user.email);
    const profileEmail = normalizeEmail(profile && profile.email);

    if (authEmail && authEmail !== profileEmail) {
      try {
        const { error: emailSyncError } = await client
          .from("profiles")
          .update({
            email: authEmail,
            updated_at: new Date().toISOString()
          })
          .eq("id", user.id);

        if (emailSyncError) {
          console.error("Potvrzený e-mail se nepodařilo synchronizovat.", emailSyncError);
        } else {
          profile = { ...(profile || {}), email: authEmail };
        }
      } catch (emailSyncError) {
        console.error("Potvrzený e-mail se nepodařilo synchronizovat.", emailSyncError);
      }
    }

    syncLocalUser(user, profile);
    setProfileFields(profile, user);

    const pendingEmail = normalizeEmail(user && user.new_email);
    if (pendingEmail && pendingEmail !== authEmail) {
      setTranslatedMessage(
        profileMessage,
        "settings.emailConfirmationPending",
        "Změna e-mailu na {email} čeká na potvrzení. Do potvrzení zůstává aktivní původní e-mail.",
        "success",
        { email: pendingEmail }
      );
    }

    const language = profile && profile.preferred_language
      ? profile.preferred_language
      : "cs";

    const emailNotifications = profile
      ? profile.email_notifications !== false
      : true;

    if (languageSelect) {
      languageSelect.value = language;
    }

    if (emailCheckbox) {
      emailCheckbox.checked = emailNotifications;
    }

    applyLanguage(language);
    setLoadState("ready");
    return true;
  }

  async function saveProfile(client, user) {
    const fullNameInput = document.getElementById("profileFullName");
    const emailInput = document.getElementById("profileEmail");
    const phoneInput = document.getElementById("profilePhone");
    const streetInput = document.getElementById("profileStreet");
    const cityInput = document.getElementById("profileCity");
    const postalCodeInput = document.getElementById("profilePostalCode");
    const button = document.getElementById("saveProfileButton");
    const message = document.getElementById("profileMessage");

    const fullName = normalizeText(fullNameInput && fullNameInput.value);
    const email = normalizeEmail(emailInput && emailInput.value);
    const phone = normalizeText(phoneInput && phoneInput.value);
    const street = normalizeText(streetInput && streetInput.value);
    const city = normalizeText(cityInput && cityInput.value);
    const postalCode = normalizeText(postalCodeInput && postalCodeInput.value);

    if (button && button.disabled) {
      return user;
    }

    setMessage(message, "", "");

    if (!fullName || !email || !phone || !street || !city || !postalCode) {
      setTranslatedMessage(
        message,
        "settings.profileRequired",
        "Vyplňte všechna osobní data.",
        "error"
      );
      return user;
    }

    if (!isValidEmail(email)) {
      setTranslatedMessage(
        message,
        "settings.invalidEmail",
        "Zadejte platnou e-mailovou adresu.",
        "error"
      );
      return user;
    }

    setButtonLoading(button, true);

    try {
      const currentEmail = normalizeEmail(user.email);
      const currentPendingEmail = normalizeEmail(user.new_email);
      let emailConfirmationRequired = false;
      let authUser = user;

      if (email !== currentEmail && email !== currentPendingEmail) {
        const { data: authData, error: authError } = await client.auth.updateUser({
          email: email,
          data: {
            full_name: fullName,
            phone: phone,
            street: street,
            city: city,
            postal_code: postalCode
          }
        });

        if (authError) {
          throw authError;
        }

        const returnedUser = authData && authData.user ? authData.user : null;
        authUser = returnedUser || user;
        const returnedEmail = normalizeEmail(returnedUser && returnedUser.email);
        const pendingEmail = normalizeEmail(returnedUser && returnedUser.new_email);

        emailConfirmationRequired = Boolean(
          pendingEmail && pendingEmail === email && returnedEmail !== email
        );

        if (!emailConfirmationRequired && returnedEmail !== email) {
          emailConfirmationRequired = true;
        }
      } else {
        emailConfirmationRequired = Boolean(
          currentPendingEmail && email === currentPendingEmail
        );

        const { data: authData, error: metadataError } = await client.auth.updateUser({
          data: {
            full_name: fullName,
            phone: phone,
            street: street,
            city: city,
            postal_code: postalCode
          }
        });

        if (metadataError) {
          throw metadataError;
        }

        authUser = authData && authData.user ? authData.user : user;
      }

      const profileUpdate = {
        full_name: fullName,
        phone: phone,
        street: street,
        city: city,
        postal_code: postalCode,
        updated_at: new Date().toISOString()
      };

      if (!emailConfirmationRequired) {
        profileUpdate.email = email;
      }

      const { error: profileError } = await client
        .from("profiles")
        .update(profileUpdate)
        .eq("id", user.id);

      if (profileError) {
        throw profileError;
      }

      const effectiveEmail = emailConfirmationRequired ? currentEmail : email;
      const updatedUser = {
          ...authUser,
          email: effectiveEmail,
          user_metadata: {
            ...(authUser.user_metadata || {}),
            full_name: fullName,
            phone: phone,
            street: street,
            city: city,
            postal_code: postalCode
          }
        };

      syncLocalUser(
        updatedUser,
        {
          ...profileUpdate,
          email: effectiveEmail
        }
      );

      setTranslatedMessage(
        message,
        emailConfirmationRequired
          ? "settings.profileSavedEmailConfirmation"
          : "settings.profileSaved",
        emailConfirmationRequired
          ? "Osobní údaje byly uloženy. Změnu e-mailu potvrďte odkazem zaslaným na novou adresu."
          : "Osobní údaje byly uloženy.",
        "success"
      );
      return updatedUser;
    } catch (error) {
      console.error(error);
      setTranslatedMessage(
        message,
        "settings.profileSaveError",
        "Osobní údaje se nepodařilo uložit. Zkuste to prosím znovu.",
        "error"
      );
      return user;
    } finally {
      setButtonLoading(button, false);
    }
  }

  async function saveSettings(client, user) {
    const languageSelect = document.getElementById("preferredLanguage");
    const emailCheckbox = document.getElementById("emailNotifications");
    const saveButton = document.getElementById("saveSettingsButton");
    const message = document.getElementById("settingsMessage");

    const preferredLanguage = languageSelect ? languageSelect.value : "cs";
    const emailNotifications = emailCheckbox ? emailCheckbox.checked : true;

    if (saveButton && saveButton.disabled) {
      return;
    }

    setMessage(message, "", "");

    setButtonLoading(saveButton, true);

    try {
      const { error } = await client
        .from("profiles")
        .update({
          preferred_language: preferredLanguage,
          email_notifications: emailNotifications,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      applyLanguage(preferredLanguage);
      setTranslatedMessage(
        message,
        "settings.saved",
        "Nastavení bylo uloženo.",
        "success"
      );
    } catch (error) {
      console.error(error);
      setTranslatedMessage(
        message,
        "settings.saveError",
        "Nastavení se nepodařilo uložit.",
        "error"
      );
    } finally {
      setButtonLoading(saveButton, false);
    }
  }

  async function changePassword(client) {
    const currentPassword = document.getElementById("currentPassword");
    const newPassword = document.getElementById("newPassword");
    const confirmPassword = document.getElementById("confirmPassword");
    const button = document.getElementById("changePasswordButton");
    const message = document.getElementById("passwordMessage");

    const current = currentPassword ? currentPassword.value : "";
    const password = newPassword ? newPassword.value : "";
    const confirmation = confirmPassword ? confirmPassword.value : "";

    if (button && button.disabled) {
      return;
    }

    setMessage(message, "", "");

    if (!current) {
      setTranslatedMessage(
        message,
        "settings.currentPasswordRequired",
        "Zadejte současné heslo.",
        "error"
      );
      if (currentPassword) {
        currentPassword.focus();
      }
      return;
    }

    if (!meetsRentuloPasswordRequirements(password)) {
      setTranslatedMessage(
        message,
        "settings.passwordRequirements",
        "Heslo musí mít alespoň 8 znaků a obsahovat malé písmeno, velké písmeno, číslici a symbol.",
        "error"
      );
      if (newPassword) {
        newPassword.focus();
      }
      return;
    }

    if (password !== confirmation) {
      setTranslatedMessage(
        message,
        "settings.passwordMismatch",
        "Zadaná hesla se neshodují.",
        "error"
      );
      return;
    }

    setButtonLoading(button, true);

    try {
      const { error } = await client.auth.updateUser({
        password: password,
        current_password: current,
      });

      if (error) {
        throw error;
      }

      if (currentPassword) {
        currentPassword.value = "";
      }

      if (newPassword) {
        newPassword.value = "";
      }

      if (confirmPassword) {
        confirmPassword.value = "";
      }

      const showPasswords = document.getElementById("showPasswords");
      if (showPasswords) {
        showPasswords.checked = false;
      }
      if (currentPassword) {
        currentPassword.type = "password";
      }
      if (newPassword) {
        newPassword.type = "password";
      }
      if (confirmPassword) {
        confirmPassword.type = "password";
      }

      setTranslatedMessage(
        message,
        "settings.passwordChanged",
        "Heslo bylo úspěšně změněno.",
        "success"
      );
    } catch (error) {
      console.error(error);

      if (isRentuloWeakPasswordError(error)) {
        setTranslatedMessage(
          message,
          "settings.passwordRequirements",
          "Heslo musí mít alespoň 8 znaků a obsahovat malé písmeno, velké písmeno, číslici a symbol.",
          "error"
        );
      } else if (isCurrentPasswordError(error)) {
        setTranslatedMessage(
          message,
          "settings.currentPasswordIncorrect",
          "Současné heslo není správné.",
          "error"
        );
        if (currentPassword) {
          currentPassword.focus();
        }
      } else if (isSamePasswordError(error)) {
        setTranslatedMessage(
          message,
          "settings.passwordSameAsCurrent",
          "Nové heslo musí být jiné než současné heslo.",
          "error"
        );
        if (newPassword) {
          newPassword.focus();
        }
      } else {
        setTranslatedMessage(
          message,
          "settings.passwordChangeError",
          "Heslo se nepodařilo změnit. Zkuste to prosím znovu.",
          "error"
        );
      }
    } finally {
      setButtonLoading(button, false);
    }
  }

  function isCurrentPasswordError(error) {
    const code = String(error && error.code ? error.code : "").toLowerCase();
    const message = String(error && error.message ? error.message : "").toLowerCase();
    return (
      code === "current_password_required" ||
      code === "current_password_mismatch" ||
      message.includes("current password")
    );
  }

  function isSamePasswordError(error) {
    const code = String(error && error.code ? error.code : "").toLowerCase();
    const message = String(error && error.message ? error.message : "").toLowerCase();
    return code === "same_password" || message.includes("different from the old password");
  }

  function initializePasswordVisibility() {
    const checkbox = document.getElementById("showPasswords");
    const currentPassword = document.getElementById("currentPassword");
    const newPassword = document.getElementById("newPassword");
    const confirmPassword = document.getElementById("confirmPassword");

    if (!checkbox) {
      return;
    }

    checkbox.addEventListener("change", function () {
      const inputType = checkbox.checked ? "text" : "password";

      if (currentPassword) {
        currentPassword.type = inputType;
      }

      if (newPassword) {
        newPassword.type = inputType;
      }

      if (confirmPassword) {
        confirmPassword.type = inputType;
      }
    });
  }

  async function initializeSettingsPage() {
    if (!window.rentuloAuthGuard) {
      window.location.replace("prihlaseni.html?returnTo=nastaveni.html");
      return;
    }

    const user = await window.rentuloAuthGuard.requireUser();

    if (!user) {
      return;
    }

    const client = getSupabaseClient();

    if (!client) {
      setLoadState("error");

      const unavailableRetryButton = document.getElementById("settingsRetryButton");
      if (unavailableRetryButton) {
        unavailableRetryButton.addEventListener("click", function () {
          window.location.reload();
        });
      }

      return;
    }

    initializePasswordVisibility();

    const profileForm = document.getElementById("profileForm");
    const saveButton = document.getElementById("saveSettingsButton");
    const passwordForm = document.getElementById("passwordForm");
    const retryButton = document.getElementById("settingsRetryButton");
    let currentUser = user;

    if (profileForm) {
      profileForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        currentUser = await saveProfile(client, currentUser);
      });
    }

    if (saveButton) {
      saveButton.addEventListener("click", function () {
        saveSettings(client, currentUser);
      });
    }

    if (passwordForm) {
      passwordForm.addEventListener("submit", function (event) {
        event.preventDefault();
        changePassword(client);
      });
    }

    if (retryButton) {
      retryButton.addEventListener("click", async function () {
        setButtonLoading(retryButton, true);

        try {
          await loadPageData(client, currentUser);
        } finally {
          setButtonLoading(retryButton, false);
        }
      });
    }

    await loadPageData(client, currentUser);
  }

  document.addEventListener("rentuloLanguageChanged", function (event) {
    const languageSelect = document.getElementById("preferredLanguage");
    const language = event && event.detail ? event.detail.language : "";

    if (languageSelect && language) {
      languageSelect.value = language;
    }

    refreshTranslatedMessages();

    const loadState = document.getElementById("settingsLoadState");
    if (loadState && loadState.dataset.state) {
      setLoadState(loadState.dataset.state);
    }
  });

  document.addEventListener("DOMContentLoaded", initializeSettingsPage);
})();
