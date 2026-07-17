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
        console.warn("Profil se nepodařilo načíst.");
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
        "Uživatel";

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
        showLoginError("Chyba: Supabase klient není načtený. Zkontrolujte js/supabase-config.js.");
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
        showLoginError("Vyplňte prosím e-mail i heslo.");
        return;
      }

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Přihlašuji...";
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
            showLoginError("E-mail nebo heslo není správné.");
            return;
          }

          if (message.includes("email not confirmed")) {
            showLoginError("E-mail ještě není potvrzený. Zkontrolujte prosím e-mailovou schránku.");
            return;
          }

          showLoginError("Přihlášení se nepodařilo: " + error.message);
          return;
        }

        if (!data || !data.user) {
          showLoginError("Přihlášení se nepodařilo. Uživatel nebyl načten.");
          return;
        }

        const profile = await loginLoadProfile(supabaseClient, data.user);
        const currentUser = loginCreateLocalUserFromSupabase(data.user, profile);

        loginSaveCurrentUser(currentUser);
        saveRememberLogin(rememberInput.checked);

        window.location.href = "muj-ucet.html";
      } catch (error) {
        console.error("Přihlášení se nepodařilo.");
        showLoginError("Přihlášení se nepodařilo. Zkontrolujte připojení a zkuste to znovu.");
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Přihlásit se";
        }
      }
    }

    document.addEventListener("DOMContentLoaded", function () {
      renderSharedNavigation("");

      const loginForm = document.getElementById("loginForm");

      if (loginForm) {
        loginForm.addEventListener("submit", handleLoginSubmit);
      }
    });