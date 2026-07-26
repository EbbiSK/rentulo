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

    const { data, error } = await client
      .from("profiles")
      .select(
        "full_name, email, phone, street, city, postal_code, preferred_language, email_notifications"
      )
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      const errorText = translate(
        "settings.loadError",
        "Nastavení se nepodařilo načíst."
      );
      setMessage(settingsMessage, errorText, "error");
      setMessage(profileMessage, errorText, "error");
      return;
    }

    setProfileFields(data, user);

    const language = data && data.preferred_language
      ? data.preferred_language
      : "cs";

    const emailNotifications = data
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

    setMessage(message, "", "");

    if (!fullName || !email || !phone || !street || !city || !postalCode) {
      setMessage(
        message,
        translate("settings.profileRequired", "Vyplňte všechna osobní data."),
        "error"
      );
      return;
    }

    if (!isValidEmail(email)) {
      setMessage(
        message,
        translate("settings.invalidEmail", "Zadejte platnou e-mailovou adresu."),
        "error"
      );
      return;
    }

    if (button) {
      button.disabled = true;
    }

    try {
      const currentEmail = normalizeEmail(user.email);
      let emailConfirmationRequired = false;

      if (email !== currentEmail) {
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

        emailConfirmationRequired = !(
          authData &&
          authData.user &&
          normalizeEmail(authData.user.email) === email
        );
      } else {
        const { error: metadataError } = await client.auth.updateUser({
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

      setMessage(
        message,
        emailConfirmationRequired
          ? translate(
              "settings.profileSavedEmailConfirmation",
              "Osobní údaje byly uloženy. Změnu e-mailu potvrďte odkazem zaslaným na novou adresu."
            )
          : translate(
              "settings.profileSaved",
              "Osobní údaje byly uloženy."
            ),
        "success"
      );
    } catch (error) {
      console.error(error);
      setMessage(
        message,
        translate(
          "settings.profileSaveError",
          "Osobní údaje se nepodařilo uložit. Zkuste to prosím znovu."
        ),
        "error"
      );
    } finally {
      if (button) {
        button.disabled = false;
      }
    }
  }

  async function saveSettings(client, user) {
    const languageSelect = document.getElementById("preferredLanguage");
    const emailCheckbox = document.getElementById("emailNotifications");
    const saveButton = document.getElementById("saveSettingsButton");
    const message = document.getElementById("settingsMessage");

    const preferredLanguage = languageSelect ? languageSelect.value : "cs";
    const emailNotifications = emailCheckbox ? emailCheckbox.checked : true;

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
        translate("settings.saveError", "Nastavení se nepodařilo uložit."),
        "error"
      );
      return;
    }

    applyLanguage(preferredLanguage);
    setMessage(
      message,
      translate("settings.saved", "Nastavení bylo uloženo."),
      "success"
    );
  }

  async function changePassword(client) {
    const newPassword = document.getElementById("newPassword");
    const confirmPassword = document.getElementById("confirmPassword");
    const button = document.getElementById("changePasswordButton");
    const message = document.getElementById("passwordMessage");

    const password = newPassword ? newPassword.value : "";
    const confirmation = confirmPassword ? confirmPassword.value : "";

    setMessage(message, "", "");

    if (password.length < 8) {
      setMessage(
        message,
        translate(
          "settings.passwordTooShort",
          "Heslo musí mít alespoň 8 znaků."
        ),
        "error"
      );
      return;
    }

    if (password !== confirmation) {
      setMessage(
        message,
        translate(
          "settings.passwordMismatch",
          "Zadaná hesla se neshodují."
        ),
        "error"
      );
      return;
    }

    if (button) {
      button.disabled = true;
    }

    const { error } = await client.auth.updateUser({ password: password });

    if (button) {
      button.disabled = false;
    }

    if (error) {
      console.error(error);
      setMessage(
        message,
        translate(
          "settings.passwordChangeError",
          "Heslo se nepodařilo změnit. Zkuste to prosím znovu."
        ),
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
      return;
    }

    await loadPageData(client, user);

    const profileForm = document.getElementById("profileForm");
    const saveButton = document.getElementById("saveSettingsButton");
    const passwordForm = document.getElementById("passwordForm");

    if (profileForm) {
      profileForm.addEventListener("submit", function (event) {
        event.preventDefault();
        saveProfile(client, user);
      });
    }

    if (saveButton) {
      saveButton.addEventListener("click", function () {
        saveSettings(client, user);
      });
    }

    if (passwordForm) {
      passwordForm.addEventListener("submit", function (event) {
        event.preventDefault();
        changePassword(client);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", initializeSettingsPage);
})();
