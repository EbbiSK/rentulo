    const cityPostalCodes = {
      "praha": "110 00",
      "brno": "602 00",
      "ostrava": "702 00",
      "plzeň": "301 00",
      "plzen": "301 00",
      "liberec": "460 01",
      "olomouc": "779 00",
      "české budějovice": "370 01",
      "ceske budejovice": "370 01",
      "hradec králové": "500 03",
      "hradec kralove": "500 03",
      "pardubice": "530 02",
      "zlín": "760 01",
      "zlin": "760 01",
      "havířov": "736 01",
      "havirov": "736 01",
      "kladno": "272 01",
      "most": "434 01",
      "opava": "746 01",
      "frýdek-místek": "738 01",
      "frydek-mistek": "738 01",
      "karviná": "733 01",
      "karvina": "733 01",
      "jihlava": "586 01",
      "teplice": "415 01",
      "děčín": "405 02",
      "decin": "405 02",
      "chomutov": "430 01",
      "karlovy vary": "360 01",
      "jablonec nad nisou": "466 01",
      "mladá boleslav": "293 01",
      "mlada boleslav": "293 01",
      "prostějov": "796 01",
      "prostejov": "796 01",
      "přerov": "750 02",
      "prerov": "750 02",
      "třinec": "739 61",
      "trinec": "739 61",
      "tábor": "390 01",
      "tabor": "390 01",
      "znojmo": "669 02",
      "kolín": "280 02",
      "kolin": "280 02",
      "písek": "397 01",
      "pisek": "397 01",
      "cheb": "350 02",
      "příbram": "261 01",
      "pribram": "261 01",
      "orlová": "735 14",
      "orlova": "735 14",
      "kroměříž": "767 01",
      "kromeriz": "767 01",
      "vsetín": "755 01",
      "vsetin": "755 01",
      "šumperk": "787 01",
      "sumperk": "787 01",
      "uherské hradiště": "686 01",
      "uherske hradiste": "686 01",
      "břeclav": "690 02",
      "breclav": "690 02",
      "hodonín": "695 01",
      "hodonin": "695 01",
      "česká lípa": "470 01",
      "ceska lipa": "470 01",
      "litoměřice": "412 01",
      "litomerice": "412 01",
      "krnov": "794 01",
      "sokolov": "356 01"
    };

    let registrationSubmitInProgress = false;
    let registrationErrorState = null;

    function registrationT(key, fallback) {
      if (typeof window.rentuloTranslate === "function") {
        return window.rentuloTranslate(key);
      }

      return fallback || key;
    }

    function registrationNormalizeEmail(email) {
      return String(email || "").trim().toLowerCase();
    }

    function registrationIsValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function normalizeCityName(value) {
      return String(value || "")
        .trim()
        .toLowerCase();
    }

    function registrationRenderError() {
      const errorBox = document.getElementById("registrationError");

      if (!errorBox) {
        return;
      }

      if (!registrationErrorState) {
        errorBox.textContent = "";
        errorBox.classList.remove("active");
        return;
      }

      errorBox.textContent = registrationT(
        registrationErrorState.key,
        registrationErrorState.fallback
      );
      errorBox.classList.add("active");
    }

    function registrationShowError(key, fallback) {
      registrationErrorState = {
        key: key,
        fallback: fallback || key
      };
      registrationRenderError();
    }

    function registrationHideError() {
      registrationErrorState = null;
      registrationRenderError();
    }

    function registrationClearErrors() {
      const fields = document.querySelectorAll("#registrationForm input");

      fields.forEach(function (field) {
        field.classList.remove("input-error");
        field.removeAttribute("aria-invalid");
      });
    }

    function registrationMarkError(input) {
      if (input) {
        input.classList.add("input-error");
        input.setAttribute("aria-invalid", "true");
      }
    }

    function registrationFocusFirstError() {
      const firstInvalidField = document.querySelector(
        "#registrationForm input[aria-invalid='true']"
      );

      if (firstInvalidField && typeof firstInvalidField.focus === "function") {
        firstInvalidField.focus();
      }
    }

    function registrationSetButtonState(isSubmitting) {
      const submitButton = document.getElementById("registrationSubmitButton");

      if (!submitButton) {
        return;
      }

      submitButton.disabled = Boolean(isSubmitting);
      submitButton.setAttribute(
        "aria-busy",
        isSubmitting ? "true" : "false"
      );
      submitButton.textContent = registrationT(
        isSubmitting ? "registration.submitting" : "registration.submit",
        isSubmitting ? "Vytvářím účet..." : "Vytvořit účet"
      );
    }

    function registrationIsEmpty(value) {
      return String(value || "").trim() === "";
    }

    function registrationGetSupabaseClient() {
      if (window.rentuloSupabase) {
        return window.rentuloSupabase;
      }

      if (typeof rentuloSupabase !== "undefined") {
        return rentuloSupabase;
      }

      return null;
    }

    function setupCitySuggestions() {
      const datalist = document.getElementById("citySuggestions");

      if (!datalist) {
        return;
      }

      const uniqueCities = [];
      const seen = {};

      Object.keys(cityPostalCodes).forEach(function (city) {
        const displayCity = city
          .split(" ")
          .map(function (part) {
            return part.charAt(0).toUpperCase() + part.slice(1);
          })
          .join(" ");

        const normalized = normalizeCityName(displayCity);

        if (!seen[normalized]) {
          seen[normalized] = true;
          uniqueCities.push(displayCity);
        }
      });

      datalist.innerHTML = uniqueCities
        .sort()
        .map(function (city) {
          return `<option value="${city}"></option>`;
        })
        .join("");
    }

    function setupPostalCodeAutocomplete() {
      const cityInput = document.getElementById("city");
      const postalCodeInput = document.getElementById("postalCode");

      if (!cityInput || !postalCodeInput) {
        return;
      }

      function updatePostalCode() {
        const city = normalizeCityName(cityInput.value);
        const postalCode = cityPostalCodes[city];

        if (!postalCode) {
          return;
        }

        if (!postalCodeInput.value.trim() || postalCodeInput.dataset.autoFilled === "true") {
          postalCodeInput.value = postalCode;
          postalCodeInput.dataset.autoFilled = "true";
        }
      }

      cityInput.addEventListener("input", updatePostalCode);
      cityInput.addEventListener("change", updatePostalCode);

      postalCodeInput.addEventListener("input", function () {
        postalCodeInput.dataset.autoFilled = "false";
      });
    }

    function registrationHandleAuthError(error, emailInput, passwordInput) {
      const code = String(error && error.code ? error.code : "").toLowerCase();

      if (
        code === "email_exists" ||
        code === "user_already_exists" ||
        code === "identity_already_exists"
      ) {
        registrationMarkError(emailInput);
        registrationShowError(
          "registration.error.exists",
          "Uživatel s tímto e-mailem už existuje. Zkuste se přihlásit."
        );
        return;
      }

      if (code === "email_address_invalid") {
        registrationMarkError(emailInput);
        registrationShowError(
          "registration.error.invalidEmail",
          "Zadejte platný e-mail."
        );
        return;
      }

      if (code === "weak_password") {
        registrationMarkError(passwordInput);
        registrationShowError(
          "registration.error.weakPassword",
          "Heslo musí mít alespoň 8 znaků a obsahovat malé písmeno, velké písmeno, číslici a symbol."
        );
        return;
      }

      if (
        code === "over_email_send_rate_limit" ||
        code === "over_request_rate_limit"
      ) {
        registrationShowError(
          "registration.error.rateLimit",
          "Proběhlo příliš mnoho pokusů. Počkejte chvíli a zkuste to znovu."
        );
        return;
      }

      if (
        code === "signup_disabled" ||
        code === "email_provider_disabled" ||
        code === "provider_disabled"
      ) {
        registrationShowError(
          "registration.error.unavailable",
          "Registrace je dočasně nedostupná. Zkuste to prosím později."
        );
        return;
      }

      console.error(
        registrationT("registration.console.failed", "Registrace se nepodařila."),
        error
      );
      registrationShowError(
        "registration.error.generic",
        "Registrace se nepodařila. Zkuste to prosím znovu."
      );
    }

    async function createUserAccount(event) {
      event.preventDefault();

      if (registrationSubmitInProgress) {
        return;
      }

      registrationHideError();
      registrationClearErrors();

      const supabaseClient = registrationGetSupabaseClient();

      if (!supabaseClient) {
        registrationShowError(
          "registration.error.supabase",
          "Služba je dočasně nedostupná. Obnovte stránku a zkuste to znovu."
        );
        return;
      }

      const fullNameInput = document.getElementById("fullName");
      const emailInput = document.getElementById("email");
      const phoneInput = document.getElementById("phone");
      const streetInput = document.getElementById("street");
      const cityInput = document.getElementById("city");
      const postalCodeInput = document.getElementById("postalCode");
      const passwordInput = document.getElementById("password");
      const termsBusiness = document.getElementById("termsBusiness");
      const termsPrivacy = document.getElementById("termsPrivacy");
      const requiredFields = [
        fullNameInput,
        emailInput,
        phoneInput,
        streetInput,
        cityInput,
        postalCodeInput,
        passwordInput
      ];

      if (
        requiredFields.some(function (field) { return !field; }) ||
        !termsBusiness ||
        !termsPrivacy
      ) {
        registrationShowError(
          "registration.error.supabase",
          "Služba je dočasně nedostupná. Obnovte stránku a zkuste to znovu."
        );
        return;
      }

      let hasError = false;

      requiredFields.forEach(function (field) {
        if (registrationIsEmpty(field.value)) {
          registrationMarkError(field);
          hasError = true;
        }
      });

      [termsBusiness, termsPrivacy].forEach(function (field) {
        if (!field.checked) {
          registrationMarkError(field);
          hasError = true;
        }
      });

      if (hasError) {
        registrationShowError(
          "registration.error.required",
          "Vyplňte prosím všechna pole a potvrďte oba souhlasy."
        );
        registrationFocusFirstError();
        return;
      }

      const email = registrationNormalizeEmail(emailInput.value);

      if (!registrationIsValidEmail(email)) {
        registrationMarkError(emailInput);
        registrationShowError(
          "registration.error.invalidEmail",
          "Zadejte platný e-mail."
        );
        registrationFocusFirstError();
        return;
      }

      if (!meetsRentuloPasswordRequirements(passwordInput.value)) {
        registrationMarkError(passwordInput);
        registrationShowError(
          "registration.error.passwordRequirements",
          "Heslo musí mít alespoň 8 znaků a obsahovat malé písmeno, velké písmeno, číslici a symbol."
        );
        registrationFocusFirstError();
        return;
      }

      const fullName = fullNameInput.value.trim();
      const phone = phoneInput.value.trim();
      const street = streetInput.value.trim();
      const city = cityInput.value.trim();
      const postalCode = postalCodeInput.value.trim();
      const now = new Date().toISOString();
      const preferredLanguage =
        typeof window.getRentuloLanguage === "function"
          ? window.getRentuloLanguage()
          : "cs";

      registrationSubmitInProgress = true;
      registrationSetButtonState(true);

      try {
        const { data, error } = await supabaseClient.auth.signUp({
          email: email,
          password: passwordInput.value,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
              street: street,
              city: city,
              postal_code: postalCode,
              preferred_language: preferredLanguage,
              terms_business_accepted: true,
              terms_privacy_accepted: true,
              terms_accepted_at: now
            }
          }
        });

        if (error) {
          registrationHandleAuthError(error, emailInput, passwordInput);
          registrationFocusFirstError();
          return;
        }

        if (!data || !data.user) {
          registrationShowError(
            "registration.error.userMissing",
            "Účet se nepodařilo bezpečně vytvořit. Zkuste to prosím znovu."
          );
          return;
        }

        if (
          Array.isArray(data.user.identities) &&
          data.user.identities.length === 0
        ) {
          registrationMarkError(emailInput);
          registrationShowError(
            "registration.error.exists",
            "Uživatel s tímto e-mailem už existuje. Zkuste se přihlásit."
          );
          registrationFocusFirstError();
          return;
        }

        window.location.href = "ucet-vytvoren.html";
      } catch (error) {
        console.error(
          registrationT("registration.console.failed", "Registrace se nepodařila."),
          error
        );
        registrationShowError(
          "registration.error.connection",
          "Registrace se nepodařila. Zkontrolujte připojení a zkuste to znovu."
        );
      } finally {
        registrationSubmitInProgress = false;
        registrationSetButtonState(false);
      }
    }

    function handleRegistrationLanguageChange() {
      document.title = registrationT(
        "registration.documentTitle",
        "Registrace - Rentulo"
      );
      registrationRenderError();
      registrationSetButtonState(registrationSubmitInProgress);
    }

    document.addEventListener("DOMContentLoaded", function () {
      document.title = registrationT(
        "registration.documentTitle",
        "Registrace - Rentulo"
      );

      if (typeof window.applyRentuloTranslations === "function") {
        window.applyRentuloTranslations();
      }

      renderSharedNavigation("registrace");
      setupCitySuggestions();
      setupPostalCodeAutocomplete();

      const registrationForm = document.getElementById("registrationForm");

      if (registrationForm) {
        registrationForm.addEventListener("submit", createUserAccount);
        registrationForm.addEventListener("input", function (event) {
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
      handleRegistrationLanguageChange
    );
