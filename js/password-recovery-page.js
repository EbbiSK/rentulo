(function () {
  function t(key, fallback) {
    if (typeof window.rentuloTranslate === "function") {
      return window.rentuloTranslate(key);
    }
    return fallback || key;
  }

  function setMessage(element, text, type) {
    if (!element) return;
    element.textContent = text || "";
    element.className = "status-message";
    if (text) element.classList.add("active", type || "success");
  }

  function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
  }

  function getSafeReturnTo() {
    const allowedReturnPages = new Set([
      "detail.html",
      "edit-nabidka.html",
      "historie.html",
      "moje-nabidky.html",
      "moje-rezervace.html",
      "muj-ucet.html",
      "nabidnout.html",
      "nastaveni.html"
    ]);
    const returnTo = new URLSearchParams(window.location.search).get("returnTo") || "";
    const returnPath = returnTo.split(/[?#]/, 1)[0];

    return allowedReturnPages.has(returnPath) ? returnTo : "";
  }

  function getLoginUrl() {
    const returnTo = getSafeReturnTo();
    return returnTo
      ? "prihlaseni.html?returnTo=" + encodeURIComponent(returnTo)
      : "prihlaseni.html";
  }

  function updateBackToLoginLinks() {
    const loginUrl = getLoginUrl();
    document
      .querySelectorAll('a[data-i18n="passwordRecovery.backToLogin"]')
      .forEach(function (link) {
        link.href = loginUrl;
      });
  }

  function getRedirectUrl() {
    const returnTo = getSafeReturnTo();
    const url = new URL(window.location.origin + window.location.pathname);

    if (returnTo) {
      url.searchParams.set("returnTo", returnTo);
    }

    return url.toString();
  }

  function showPasswordForm() {
    const requestForm = document.getElementById("requestResetForm");
    const passwordForm = document.getElementById("setPasswordForm");
    const title = document.getElementById("recoveryTitle");
    const description = document.getElementById("recoveryDescription");

    if (requestForm) requestForm.classList.add("hidden");
    if (passwordForm) passwordForm.classList.remove("hidden");
    if (title) title.textContent = t("passwordRecovery.newTitle", "Nastavit nové heslo");
    if (description) description.textContent = t("passwordRecovery.newDescription", "Použijte alespoň 8 znaků, včetně malého a velkého písmene, číslice a symbolu (např. ! nebo @).");
  }

  async function handleRequest(event, client) {
    event.preventDefault();
    const emailInput = document.getElementById("recoveryEmail");
    const button = document.getElementById("requestResetButton");
    const message = document.getElementById("requestMessage");
    const email = normalizeEmail(emailInput && emailInput.value);

    setMessage(message, "", "");
    if (!email || !email.includes("@")) {
      setMessage(message, t("passwordRecovery.error.emailRequired", "Zadejte platný e-mail."), "error");
      if (emailInput) emailInput.focus();
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = t("passwordRecovery.sending", "Odesílám...");
    }

    try {
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: getRedirectUrl()
      });

      if (error) {
        console.error(error);
        setMessage(message, t("passwordRecovery.error.generic", "Obnovu hesla se nepodařilo dokončit. Zkuste to znovu."), "error");
        return;
      }

      setMessage(message, t("passwordRecovery.sent", "Pokud je e-mail registrovaný, poslali jsme na něj odkaz pro obnovu hesla."), "success");
      if (emailInput) emailInput.value = "";
    } catch (error) {
      console.error(error);
      setMessage(message, t("passwordRecovery.error.generic", "Obnovu hesla se nepodařilo dokončit. Zkuste to znovu."), "error");
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = t("passwordRecovery.send", "Poslat odkaz pro obnovu");
      }
    }
  }

  async function handleNewPassword(event, client) {
    event.preventDefault();
    const passwordInput = document.getElementById("newPassword");
    const confirmInput = document.getElementById("confirmPassword");
    const button = document.getElementById("savePasswordButton");
    const message = document.getElementById("passwordMessage");
    const password = passwordInput ? passwordInput.value : "";
    const confirmation = confirmInput ? confirmInput.value : "";

    setMessage(message, "", "");
    if (!meetsRentuloPasswordRequirements(password)) {
      setMessage(
        message,
        t(
          "passwordRecovery.error.passwordRequirements",
          "Heslo musí mít alespoň 8 znaků a obsahovat malé písmeno, velké písmeno, číslici a symbol."
        ),
        "error"
      );
      if (passwordInput) passwordInput.focus();
      return;
    }
    if (password !== confirmation) {
      setMessage(message, t("passwordRecovery.error.passwordMismatch", "Zadaná hesla se neshodují."), "error");
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = t("passwordRecovery.saving", "Ukládám...");
    }

    try {
      const { error } = await client.auth.updateUser({ password: password });
      if (error) {
        console.error(error);
        if (isRentuloWeakPasswordError(error)) {
          setMessage(
            message,
            t(
              "passwordRecovery.error.passwordRequirements",
              "Heslo musí mít alespoň 8 znaků a obsahovat malé písmeno, velké písmeno, číslici a symbol."
            ),
            "error"
          );
        } else {
          setMessage(message, t("passwordRecovery.error.invalidLink", "Odkaz pro obnovu hesla je neplatný nebo vypršel. Požádejte o nový odkaz."), "error");
        }
        return;
      }

      if (passwordInput) passwordInput.value = "";
      if (confirmInput) confirmInput.value = "";
      setMessage(message, t("passwordRecovery.updated", "Heslo bylo změněno. Nyní se můžete přihlásit."), "success");
    } catch (error) {
      console.error(error);
      setMessage(message, t("passwordRecovery.error.generic", "Obnovu hesla se nepodařilo dokončit. Zkuste to znovu."), "error");
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = t("passwordRecovery.save", "Uložit nové heslo");
      }
    }
  }

  document.addEventListener("DOMContentLoaded", async function () {
    document.title = t("passwordRecovery.documentTitle", "Obnova hesla - Rentulo");
    if (typeof window.applyRentuloTranslations === "function") window.applyRentuloTranslations();
    if (typeof window.renderSharedNavigation === "function") window.renderSharedNavigation("prihlaseni");
    updateBackToLoginLinks();

    const client = typeof getSupabaseClient === "function" ? getSupabaseClient() : null;
    const requestForm = document.getElementById("requestResetForm");
    const passwordForm = document.getElementById("setPasswordForm");
    const requestMessage = document.getElementById("requestMessage");

    if (!client) {
      setMessage(requestMessage, t("passwordRecovery.error.generic", "Obnovu hesla se nepodařilo dokončit. Zkuste to znovu."), "error");
      return;
    }

    if (requestForm) requestForm.addEventListener("submit", function (event) { handleRequest(event, client); });
    if (passwordForm) passwordForm.addEventListener("submit", function (event) { handleNewPassword(event, client); });

    client.auth.onAuthStateChange(function (event) {
      if (event === "PASSWORD_RECOVERY") showPasswordForm();
    });

    const urlText = window.location.href;
    if (urlText.includes("type=recovery") || urlText.includes("access_token=")) {
      showPasswordForm();
    } else {
      const { data } = await client.auth.getSession();
      if (data && data.session && window.location.hash) showPasswordForm();
    }
  });
})();
