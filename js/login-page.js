function loginTranslate(key, fallback) {
  if (typeof window.rentuloTranslate === "function") {
    return window.rentuloTranslate(key);
  }

  return fallback || key;
}

let loginSubmitInProgress = false;
let loginErrorState = null;

function loginNormalizeEmail(email) {
      return String(email || "").trim().toLowerCase();
    }

    function loginIsValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function renderLoginError() {
      const errorBox = document.getElementById("loginError");

      if (!errorBox) {
        return;
      }

      if (!loginErrorState) {
        errorBox.textContent = "";
        errorBox.classList.remove("active");
        return;
      }

      errorBox.textContent = loginTranslate(
        loginErrorState.key,
        loginErrorState.fallback
      );
      errorBox.classList.add("active");
    }

    function showLoginError(key, fallback) {
      loginErrorState = {
        key: key,
        fallback: fallback || key
      };
      renderLoginError();
    }

    function hideLoginError() {
      loginErrorState = null;
      renderLoginError();
    }

    function clearLoginErrors() {
      const fields = document.querySelectorAll("#loginForm input");

      fields.forEach(function (field) {
        field.classList.remove("input-error");
        field.removeAttribute("aria-invalid");
      });
    }

    function markLoginError(input) {
      if (input) {
        input.classList.add("input-error");
        input.setAttribute("aria-invalid", "true");
      }
    }

    function setLoginButtonState(isSubmitting) {
      const submitButton = document.getElementById("loginSubmitButton");

      if (!submitButton) {
        return;
      }

      submitButton.disabled = Boolean(isSubmitting);
      submitButton.setAttribute(
        "aria-busy",
        isSubmitting ? "true" : "false"
      );
      submitButton.textContent = loginTranslate(
        isSubmitting ? "login.submitting" : "login.submit",
        isSubmitting ? "Přihlašuji..." : "Přihlásit se"
      );
    }


    function loginGetInitials(fullName) {
      if (!fullName) {
        return "U";
      }

      const parts = fullName.trim().split(" ").filter(Boolean);

      if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
      }

      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }

    function loginSaveCurrentUser(user) {
      if (typeof saveCurrentUser === "function") {
        saveCurrentUser(user);
        return;
      }

      
    }

    function saveRememberLogin(rememberLogin) {
      try {
        localStorage.setItem(
          "rentuloRememberLogin",
          rememberLogin ? "true" : "false"
        );
      } catch (_error) {
        // Supabase will fall back to session storage when persistence is blocked.
      }
    }

    function loadRememberLogin() {
      try {
        return localStorage.getItem("rentuloRememberLogin") === "true";
      } catch (_error) {
        return false;
      }
    }

    async function loginLoadProfile(supabaseClient, user) {
      if (!user || !user.id) {
        return null;
      }

      const { data, error } = await supabaseClient
        .from("profiles")
        .select("full_name, phone, street, city, postal_code")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.warn(loginTranslate("login.console.profileLoad", "Profil se nepodařilo načíst."));
        return null;
      }

      return data || null;
    }

    function loginCreateLocalUserFromSupabase(user, profile) {
      const metadata = user && user.user_metadata ? user.user_metadata : {};

      const fullName =
        (profile && profile.full_name) ||
        metadata.full_name ||
        metadata.fullName ||
        user.email ||
        loginTranslate("login.userFallback", "Uživatel");

      const phone =
        (profile && profile.phone) ||
        metadata.phone ||
        "";

      const street =
        (profile && profile.street) ||
        metadata.street ||
        "";

      const city =
        (profile && profile.city) ||
        metadata.city ||
        "";

      const postalCode =
        (profile && profile.postal_code) ||
        metadata.postal_code ||
        metadata.postalCode ||
        "";

      return {
        id: user.id,
        fullName: fullName,
        name: fullName,
        email: user.email || "",
        phone: phone,
        street: street,
        city: city,
        postalCode: postalCode,
        initials: loginGetInitials(fullName),
        role: "user",
        source: "supabase",
        createdAt: user.created_at || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    async function handleLoginSubmit(event) {
      event.preventDefault();

      if (loginSubmitInProgress) {
        return;
      }

      hideLoginError();
      clearLoginErrors();

      const supabaseClient = getSupabaseClient();

      if (!supabaseClient) {
        showLoginError(
          "login.error.supabase",
          "Přihlášení je dočasně nedostupné. Obnovte stránku a zkuste to znovu."
        );
        return;
      }

      const emailInput = document.getElementById("loginEmail");
      const passwordInput = document.getElementById("loginPassword");
      const rememberInput = document.getElementById("rememberLogin");
      const email = loginNormalizeEmail(emailInput.value);
      const password = String(passwordInput.value || "");

      let hasError = false;

      if (!email) {
        markLoginError(emailInput);
        hasError = true;
      }

      if (!password) {
        markLoginError(passwordInput);
        hasError = true;
      }

      if (hasError) {
        showLoginError(
          "login.error.required",
          "Vyplňte prosím e-mail i heslo."
        );
        return;
      }

      if (!loginIsValidEmail(email)) {
        markLoginError(emailInput);
        showLoginError(
          "login.error.invalidEmail",
          "Zadejte platný e-mail."
        );
        return;
      }

      loginSubmitInProgress = true;
      saveRememberLogin(Boolean(rememberInput && rememberInput.checked));
      setLoginButtonState(true);

      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (error) {
          const code = String(error.code || "").toLowerCase();

          if (
            code === "invalid_credentials" ||
            code === "user_not_found"
          ) {
            markLoginError(emailInput);
            markLoginError(passwordInput);
            showLoginError(
              "login.error.invalidCredentials",
              "E-mail nebo heslo není správné."
            );
            return;
          }

          if (code === "email_not_confirmed") {
            showLoginError(
              "login.error.emailNotConfirmed",
              "E-mail ještě není potvrzený. Zkontrolujte prosím e-mailovou schránku."
            );
            return;
          }

          console.error(loginTranslate("login.console.failed", "Přihlášení se nepodařilo."), error);
          showLoginError(
            "login.error.generic",
            "Přihlášení se nepodařilo. Zkuste to prosím znovu."
          );
          return;
        }

        if (!data || !data.user) {
          showLoginError(
            "login.error.userMissing",
            "Přihlášení se nepodařilo. Uživatel nebyl načten."
          );
          return;
        }

        const profile = await loginLoadProfile(supabaseClient, data.user);
        const currentUser = loginCreateLocalUserFromSupabase(data.user, profile);

        loginSaveCurrentUser(currentUser);
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
        const targetPage = allowedReturnPages.has(returnPath) ? returnTo : "index.html";

        window.location.href = targetPage;
      } catch (error) {
        console.error(loginTranslate("login.console.failed", "Přihlášení se nepodařilo."), error);
        showLoginError(
          "login.error.connection",
          "Přihlášení se nepodařilo. Zkontrolujte připojení a zkuste to znovu."
        );
      } finally {
        loginSubmitInProgress = false;
        setLoginButtonState(false);
      }
    }

    function handleLoginLanguageChange() {
      document.title = loginTranslate(
        "login.documentTitle",
        "Přihlášení - Rentulo"
      );
      renderLoginError();
      setLoginButtonState(loginSubmitInProgress);
    }

    document.addEventListener("DOMContentLoaded", function () {
      document.title = loginTranslate("login.documentTitle", "Přihlášení - Rentulo");

      if (typeof window.applyRentuloTranslations === "function") {
        window.applyRentuloTranslations();
      }

      renderSharedNavigation("prihlaseni");

      const loginForm = document.getElementById("loginForm");
      const rememberInput = document.getElementById("rememberLogin");

      if (rememberInput) {
        rememberInput.checked = loadRememberLogin();
      }

      if (loginForm) {
        loginForm.addEventListener("submit", handleLoginSubmit);

        loginForm.addEventListener("input", function (event) {
          const field = event.target;

          if (field && field.matches("input")) {
            field.classList.remove("input-error");
            field.removeAttribute("aria-invalid");
          }
        });
      }
    });

    document.addEventListener(
      "rentuloLanguageChanged",
      handleLoginLanguageChange
    );
