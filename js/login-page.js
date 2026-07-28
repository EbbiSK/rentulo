function loginTranslate(key, fallback) {
  if (typeof window.rentuloTranslate === "function") {
    return window.rentuloTranslate(key);
  }

  return fallback || key;
}

function loginNormalizeEmail(email) {
      return String(email || "").trim().toLowerCase();
    }

    function showLoginError(message) {
      const errorBox = document.getElementById("loginError");

      if (!errorBox) {
        return;
      }

      errorBox.textContent = message;
      errorBox.classList.add("active");
    }

    function hideLoginError() {
      const errorBox = document.getElementById("loginError");

      if (!errorBox) {
        return;
      }

      errorBox.textContent = "";
      errorBox.classList.remove("active");
    }

    function clearLoginErrors() {
      const fields = document.querySelectorAll("#loginForm input");

      fields.forEach(function (field) {
        field.classList.remove("input-error");
      });
    }

    function markLoginError(input) {
      if (input) {
        input.classList.add("input-error");
      }
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
      if (rememberLogin) {
        localStorage.setItem("rentuloRememberLogin", "true");
      } else {
        localStorage.removeItem("rentuloRememberLogin");
      }
    }

    async function loginLoadProfile(supabaseClient, user) {
      if (!user || !user.id) {
        return null;
      }

      const { data, error } = await supabaseClient
        .from("profiles")
        .select("*")
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

      hideLoginError();
      clearLoginErrors();

      const supabaseClient = getSupabaseClient();

      if (!supabaseClient) {
        showLoginError(loginTranslate("login.error.supabase", "Přihlášení momentálně není dostupné. Zkuste to prosím později."));
        return;
      }

      const emailInput = document.getElementById("loginEmail");
      const passwordInput = document.getElementById("loginPassword");
      const rememberInput = document.getElementById("rememberLogin");
      const submitButton = document.getElementById("loginSubmitButton");

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
        showLoginError(loginTranslate("login.error.required", "Vyplňte prosím e-mail i heslo."));
        return;
      }

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = loginTranslate("login.submitting", "Přihlašuji...");
      }

      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (error) {
          const message = String(error.message || "").toLowerCase();

          if (message.includes("invalid login credentials")) {
            markLoginError(emailInput);
            markLoginError(passwordInput);
            showLoginError(loginTranslate("login.error.invalidCredentials", "E-mail nebo heslo není správné."));
            return;
          }

          if (message.includes("email not confirmed")) {
            showLoginError(loginTranslate("login.error.emailNotConfirmed", "E-mail ještě není potvrzený. Zkontrolujte prosím e-mailovou schránku."));
            return;
          }

          console.error(loginTranslate("login.console.failed", "Přihlášení se nepodařilo."), error);
          showLoginError(loginTranslate("login.error.generic", "Přihlášení se nepodařilo. Zkuste to prosím znovu."));
          return;
        }

        if (!data || !data.user) {
          showLoginError(loginTranslate("login.error.userMissing", "Přihlášení se nepodařilo. Uživatel nebyl načten."));
          return;
        }

        const profile = await loginLoadProfile(supabaseClient, data.user);
        const currentUser = loginCreateLocalUserFromSupabase(data.user, profile);

        loginSaveCurrentUser(currentUser);
        saveRememberLogin(rememberInput.checked);

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
        showLoginError(loginTranslate("login.error.connection", "Přihlášení se nepodařilo. Zkontrolujte připojení a zkuste to znovu."));
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = loginTranslate("login.submit", "Přihlásit se");
        }
      }
    }

    document.addEventListener("DOMContentLoaded", function () {
      document.title = loginTranslate("login.documentTitle", "Přihlášení - Rentulo");

      if (typeof window.applyRentuloTranslations === "function") {
        window.applyRentuloTranslations();
      }

      renderSharedNavigation("");

      const loginForm = document.getElementById("loginForm");

      if (loginForm) {
        loginForm.addEventListener("submit", handleLoginSubmit);
      }
    });
